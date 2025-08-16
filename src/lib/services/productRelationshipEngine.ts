import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Typed DSL subset based on the spec
export interface RuleDSL {
  if: { select: string };
  then: Array<
    | { requires: { sku: string; qty?: string | number } }
    | { excludes: { sku: string; scope?: { region?: string[] } } }
    | { choose_one_of: { group: string; options: string[] } }
    | { recommends: { sku: string; score?: number } }
    | { auto_add: { sku: string; qty?: number; override?: boolean } }
  >;
  explain?: string;
}

export interface SimulationInput {
  selectedSkus: string[]; // user-selected SKUs
  attributes?: Record<string, unknown>; // e.g., { region: 'KSA', voltage: '220V' }
  mode?: 'strict' | 'advisory' | 'silent-auto';
}

export type SimulationAction =
  | { type: 'add'; sku: string; reason: string }
  | { type: 'require'; sku: string; reason: string; quantity?: number }
  | { type: 'exclude'; sku: string; reason: string; level: 'block' | 'warn' }
  | { type: 'choose'; group: string; options: string[]; reason: string }
  | { type: 'recommend'; sku: string; score?: number; reason: string };

export interface SimulationResult {
  actions: SimulationAction[];
  explain: Array<{ ruleId: string; because: string }>;
}

const SimulationInputSchema = z.object({
  selectedSkus: z.array(z.string()).min(0),
  attributes: z.record(z.any()).optional(),
  mode: z.enum(['strict', 'advisory', 'silent-auto']).optional(),
});

export class ProductRelationshipEngine {
  static async evaluate(
    productIdsOrSkus: string[],
    input: SimulationInput
  ): Promise<SimulationResult> {
    const parsed = SimulationInputSchema.parse(input);

    // Load rules for all products involved (authoring is per source product)
    // Resolve SKUs to product IDs where needed
    const uniqueSkus = new Set<string>(parsed.selectedSkus.concat(productIdsOrSkus));
    const products = await prisma.product.findMany({
      where: {
        OR: [{ sku: { in: Array.from(uniqueSkus) } }, { id: { in: Array.from(uniqueSkus) } }],
      },
      select: { id: true, sku: true },
    });
    const resolvedIds = new Set(products.map(p => p.id));

    const rules = await prisma.productRelationshipRule.findMany({
      where: {
        productId: { in: Array.from(resolvedIds) },
        status: { in: ['DRAFT', 'PUBLISHED', 'REVIEW'] as any },
        // Effective date window if provided
        OR: [{ effectiveFrom: null, effectiveTo: null }, { effectiveFrom: { lte: new Date() } }],
      },
      orderBy: [{ precedence: 'desc' }, { updatedAt: 'desc' }],
      select: { id: true, productId: true, rule: true, explain: true, ruleType: true },
    });

    const selected = new Set<string>(parsed.selectedSkus);
    const actions: SimulationAction[] = [];
    const explain: Array<{ ruleId: string; because: string }> = [];

    const getSkuFromIdOrSku = (idOrSku: string): string => {
      const byId = products.find(p => p.id === idOrSku);
      const bySku = products.find(p => p.sku === idOrSku);
      return byId?.sku || bySku?.sku || idOrSku;
    };

    // Precedence: EXCLUDES > REQUIRES/AUTO_ADD > RECOMMENDS
    // Evaluate excludes first
    for (const r of rules) {
      const ruleJson = r.rule as unknown as RuleDSL;
      const triggerSku = getSkuFromIdOrSku(ruleJson?.if?.select || '');
      if (!selected.has(triggerSku)) continue;

      for (const then of ruleJson.then || []) {
        if ('excludes' in then) {
          const sku = then.excludes.sku;
          const scope = then.excludes.scope || {};
          const regionOk =
            !scope.region || scope.region.includes(String(parsed.attributes?.region || ''));
          if (regionOk && selected.has(sku)) {
            actions.push({
              type: 'exclude',
              sku,
              level: parsed.mode === 'strict' ? 'block' : 'warn',
              reason: ruleJson.explain || 'Not compatible',
            });
            explain.push({ ruleId: r.id, because: ruleJson.explain || `Excluded ${sku}` });
          }
        }
      }
    }

    // Requires and auto_add
    for (const r of rules) {
      const ruleJson = r.rule as unknown as RuleDSL;
      const triggerSku = getSkuFromIdOrSku(ruleJson?.if?.select || '');
      if (!selected.has(triggerSku)) continue;
      for (const then of ruleJson.then || []) {
        if ('requires' in then) {
          const sku = then.requires.sku;
          const qtyExpr = then.requires.qty;
          let qty: number | undefined;
          if (typeof qtyExpr === 'number') qty = qtyExpr;
          // Simple expression support: '=ceil(#cores/8)'
          if (typeof qtyExpr === 'string' && qtyExpr.startsWith('=ceil(')) {
            // Evaluate minimal placeholder with attributes
            try {
              const attrs = (parsed.attributes || {}) as Record<string, unknown>;
              const cores = Number((attrs as Record<string, unknown>)['cores'] || 0);
              const m = qtyExpr.match(/#cores\/(\d+)/);
              if (m) qty = Math.ceil(cores / Number(m[1]));
            } catch {
              // ignore
            }
          }
          actions.push({
            type: 'require',
            sku,
            quantity: qty,
            reason: ruleJson.explain || 'Required item',
          });
          explain.push({ ruleId: r.id, because: ruleJson.explain || `Requires ${sku}` });
        } else if ('auto_add' in then) {
          const sku = then.auto_add.sku;
          actions.push({ type: 'add', sku, reason: ruleJson.explain || 'Auto-added dependency' });
          explain.push({ ruleId: r.id, because: ruleJson.explain || `Auto-add ${sku}` });
        } else if ('choose_one_of' in then) {
          const group = then.choose_one_of.group;
          const options = then.choose_one_of.options;
          actions.push({
            type: 'choose',
            group,
            options,
            reason: ruleJson.explain || 'Selection required',
          });
          explain.push({ ruleId: r.id, because: ruleJson.explain || `Choose one of ${group}` });
        }
      }
    }

    // Recommends
    for (const r of rules) {
      const ruleJson = r.rule as unknown as RuleDSL;
      const triggerSku = getSkuFromIdOrSku(ruleJson?.if?.select || '');
      if (!selected.has(triggerSku)) continue;
      for (const then of ruleJson.then || []) {
        if ('recommends' in then) {
          actions.push({
            type: 'recommend',
            sku: then.recommends.sku,
            score: then.recommends.score,
            reason: ruleJson.explain || 'Recommended add-on',
          });
          explain.push({
            ruleId: r.id,
            because: ruleJson.explain || `Recommend ${then.recommends.sku}`,
          });
        }
      }
    }

    return { actions, explain };
  }
}
