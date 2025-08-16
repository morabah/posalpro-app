'use client';
import { useToast } from '@/components/feedback/Toast/ToastProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  Select as AdvancedSelect,
  type SelectOption as AdvOption,
} from '@/components/ui/forms/Select';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApiClient } from '@/hooks/useApiClient';
import useErrorHandler from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import type { RuleDSL } from '@/lib/services/productRelationshipEngine';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  ruleType: z.enum([
    'REQUIRES',
    'EXCLUDES',
    'RECOMMENDS',
    'AUTO_ADD',
    'CHOOSE_ONE_OF',
    'LICENSE_FOR',
    'CAPACITY_LINK',
  ]),
  explain: z.string().optional(),
  precedence: z.number().int().min(0).default(0),
  // Rule details will be collected via dedicated UI inputs
  rule: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

type RuleDTO = {
  id: string;
  productId: string;
  name: string;
  ruleType: FormValues['ruleType'];
  rule: unknown;
  precedence: number;
  explain?: string | null;
};

export default function RuleBuilder({
  productId,
  onCreated,
  initialRule,
  onCancel,
}: {
  productId: string;
  onCreated: () => void;
  initialRule?: RuleDTO;
  onCancel?: () => void;
}) {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError, getUserFriendlyMessage } = useErrorHandler();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Local UI state for friendly inputs
  const [type, setType] = useState<FormValues['ruleType']>('REQUIRES');
  const [triggerSku, setTriggerSku] = useState('');
  // REQUIRES
  const [requiresSku, setRequiresSku] = useState('');
  const [requiresQty, setRequiresQty] = useState<string>('');
  // EXCLUDES
  const [excludesSku, setExcludesSku] = useState('');
  const [excludesRegions, setExcludesRegions] = useState<string>('');
  // AUTO_ADD
  const [autoAddSku, setAutoAddSku] = useState('');
  const [autoAddQty, setAutoAddQty] = useState<string>('');
  const [autoAddOverride, setAutoAddOverride] = useState<boolean>(false);
  // CHOOSE_ONE_OF
  const [chooseGroup, setChooseGroup] = useState('');
  const [chooseOptions, setChooseOptions] = useState<string>('');
  // RECOMMENDS
  const [recoSku, setRecoSku] = useState('');
  const [recoScore, setRecoScore] = useState<string>('');
  // Product options
  const [productOptions, setProductOptions] = useState<AdvOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const isEditing = Boolean(initialRule?.id);

  // Local validation error flags for non-RHF fields
  const [fieldErrors, setFieldErrors] = useState({
    triggerSku: false,
    requiresSku: false,
    excludesSku: false,
    autoAddSku: false,
    chooseGroup: false,
    chooseOptions: false,
    recoSku: false,
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      try {
        // Pre-submit validation for required local fields
        const missing: string[] = [];
        const nextErrors = { ...fieldErrors };
        nextErrors.triggerSku = !String(triggerSku).trim();
        if (nextErrors.triggerSku) missing.push('Trigger SKU');
        switch (type) {
          case 'REQUIRES':
            nextErrors.requiresSku = !String(requiresSku).trim();
            if (nextErrors.requiresSku) missing.push('Requires SKU');
            break;
          case 'EXCLUDES':
            nextErrors.excludesSku = !String(excludesSku).trim();
            if (nextErrors.excludesSku) missing.push('Excludes SKU');
            break;
          case 'AUTO_ADD':
            nextErrors.autoAddSku = !String(autoAddSku).trim();
            if (nextErrors.autoAddSku) missing.push('Auto-add SKU');
            break;
          case 'CHOOSE_ONE_OF': {
            const options = (chooseOptions || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            nextErrors.chooseGroup = !String(chooseGroup).trim();
            nextErrors.chooseOptions = options.length < 2;
            if (nextErrors.chooseGroup) missing.push('Group');
            if (nextErrors.chooseOptions) missing.push('At least two options');
            break;
          }
          case 'RECOMMENDS':
            nextErrors.recoSku = !String(recoSku).trim();
            if (nextErrors.recoSku) missing.push('Recommend SKU');
            break;
          default:
            break;
        }
        if (missing.length) {
          setFieldErrors(nextErrors);
          // Surface a primary form error to RHF so it marks the form invalid
          setError('name', { type: 'manual', message: 'Missing required fields' });
          toast.warning(`Please provide: ${missing.join(', ')}`, {
            title: 'Missing required fields',
          });
          return;
        }
        setFieldErrors({
          triggerSku: false,
          requiresSku: false,
          excludesSku: false,
          autoAddSku: false,
          chooseGroup: false,
          chooseOptions: false,
          recoSku: false,
        });
        clearErrors();

        // Build DSL from friendly fields
        const base: RuleDSL = {
          if: { select: String(triggerSku || '').trim() },
          then: [],
        };
        if (values.explain) base.explain = values.explain;

        if (!base.if.select) {
          toast.warning('Please provide the triggering SKU (If: Select SKU)', {
            title: 'Validation error',
          });
          return;
        }

        switch (type) {
          case 'REQUIRES': {
            const qtyStr = (requiresQty || '').trim();
            const qty =
              qtyStr === '' ? undefined : Number.isNaN(Number(qtyStr)) ? qtyStr : Number(qtyStr);
            base.then.push({
              requires: { sku: String(requiresSku).trim(), ...(qty !== undefined ? { qty } : {}) },
            } as RuleDSL['then'][number]);
            break;
          }
          case 'EXCLUDES': {
            const regions = (excludesRegions || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            base.then.push({
              excludes: {
                sku: String(excludesSku).trim(),
                ...(regions.length ? { scope: { region: regions } } : {}),
              },
            } as RuleDSL['then'][number]);
            break;
          }
          case 'AUTO_ADD': {
            const qtyStr = (autoAddQty || '').trim();
            const qty = qtyStr === '' ? undefined : Number(qtyStr);
            base.then.push({
              auto_add: {
                sku: String(autoAddSku).trim(),
                ...(Number.isFinite(qty as number) ? { qty } : {}),
                ...(autoAddOverride ? { override: true } : {}),
              },
            } as RuleDSL['then'][number]);
            break;
          }
          case 'CHOOSE_ONE_OF': {
            const options = (chooseOptions || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            base.then.push({
              choose_one_of: { group: String(chooseGroup).trim(), options },
            } as RuleDSL['then'][number]);
            break;
          }
          case 'RECOMMENDS': {
            const scoreStr = (recoScore || '').trim();
            const score = scoreStr === '' ? undefined : Number(scoreStr);
            base.then.push({
              recommends: {
                sku: String(recoSku).trim(),
                ...(Number.isFinite(score as number) ? { score } : {}),
              },
            } as RuleDSL['then'][number]);
            break;
          }
          default: {
            // For unsupported types in the engine, fallback to an empty then to avoid server errors
            // Intentionally no-op; keep a valid structure
          }
        }

        const payload = {
          productId,
          name: values.name,
          ruleType: type,
          rule: base,
          precedence: values.precedence,
          explain: values.explain,
        };
        await apiClient.post('/products/relationships/rules', payload);
        analytics('rule_created', { productId, ruleType: type }, 'medium');
        toast.success('Rule created successfully', { title: 'Success' });
        reset();
        onCreated();
      } catch (error) {
        const processed = handleAsyncError(error, 'Failed to create rule', {
          component: 'RuleBuilder',
          phase: 'createRule',
        });
        const message = getUserFriendlyMessage(processed as any);
        toast.error(message || 'Failed to create rule', { title: 'Error' });
      }
    },
    [
      apiClient,
      analytics,
      handleAsyncError,
      getUserFriendlyMessage,
      toast,
      onCreated,
      productId,
      reset,
      type,
      triggerSku,
      requiresSku,
      requiresQty,
      excludesSku,
      excludesRegions,
      autoAddSku,
      autoAddQty,
      autoAddOverride,
      chooseGroup,
      chooseOptions,
      recoSku,
      recoScore,
    ]
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<FormValues>) => {
      const firstError = Object.values(errors)[0] as { message?: string } | undefined;
      const msg = firstError?.message || 'Please fix the highlighted validation errors.';
      toast.warning(msg, { title: 'Validation error' });
    },
    [toast]
  );

  // Load products for selects
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingProducts(true);
        const res = await apiClient.get<any>('/products?limit=100&sortBy=name&sortOrder=asc');
        const list = Array.isArray((res as any)?.data?.products)
          ? (res as any).data.products
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : Array.isArray(res)
              ? res
              : [];
        if (!isMounted) return;
        const options: AdvOption[] = list.map((p: any) => ({
          value: String(p.sku || p.id),
          label: `${p.name ?? p.sku ?? p.id}${p.sku ? ` (${p.sku})` : ''}`,
        }));
        setProductOptions(options);
      } catch (error) {
        handleAsyncError(error, 'Failed to fetch products', {
          component: 'RuleBuilder',
          phase: 'loadProducts',
        });
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill when editing an existing rule
  useEffect(() => {
    if (!initialRule) return;
    try {
      setValue('name', initialRule.name, { shouldDirty: false });
      setValue('precedence', initialRule.precedence, { shouldDirty: false });
      setValue('explain', initialRule.explain ?? '', { shouldDirty: false });
      setType(initialRule.ruleType);

      const dsl = initialRule.rule as RuleDSL | undefined;
      if (dsl?.if?.select) setTriggerSku(String(dsl.if.select));
      if (Array.isArray(dsl?.then)) {
        for (const act of dsl!.then) {
          if ((act as any).requires) {
            setRequiresSku(String((act as any).requires.sku || ''));
            const qty = (act as any).requires.qty;
            setRequiresQty(qty !== undefined ? String(qty) : '');
          }
          if ((act as any).excludes) {
            setExcludesSku(String((act as any).excludes.sku || ''));
            const regions = (act as any).excludes.scope?.region as string[] | undefined;
            setExcludesRegions(Array.isArray(regions) ? regions.join(',') : '');
          }
          if ((act as any).auto_add) {
            setAutoAddSku(String((act as any).auto_add.sku || ''));
            setAutoAddQty(
              (act as any).auto_add.qty !== undefined ? String((act as any).auto_add.qty) : ''
            );
            setAutoAddOverride(Boolean((act as any).auto_add.override));
          }
          if ((act as any).choose_one_of) {
            setChooseGroup(String((act as any).choose_one_of.group || ''));
            const options = (act as any).choose_one_of.options as string[] | undefined;
            setChooseOptions(Array.isArray(options) ? options.join(',') : '');
          }
          if ((act as any).recommends) {
            setRecoSku(String((act as any).recommends.sku || ''));
            setRecoScore(
              (act as any).recommends.score !== undefined
                ? String((act as any).recommends.score)
                : ''
            );
          }
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRule]);

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name{' '}
              <span className="text-red-600" aria-hidden>
                ＊
              </span>
            </label>
            <Input
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'rule-name-error' : undefined}
              placeholder="e.g., License requirement"
              {...register('name')}
            />
            {errors.name?.message ? (
              <p id="rule-name-error" className="mt-1 text-xs text-red-600">
                {String(errors.name.message)}
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type{' '}
              <span className="text-red-600" aria-hidden>
                ＊
              </span>
            </label>
            <Select
              aria-label="Rule Type"
              options={[
                { label: 'Requires', value: 'REQUIRES' },
                { label: 'Excludes', value: 'EXCLUDES' },
                { label: 'Recommend', value: 'RECOMMENDS' },
                { label: 'Auto-add', value: 'AUTO_ADD' },
                { label: 'Choose One Of', value: 'CHOOSE_ONE_OF' },
                { label: 'License For', value: 'LICENSE_FOR' },
                { label: 'Capacity Link', value: 'CAPACITY_LINK' },
              ]}
              onChange={val => {
                const t = val as FormValues['ruleType'];
                setType(t);
                setValue('ruleType', t, { shouldValidate: true, shouldDirty: true });
              }}
              value={type}
            />
            {/* bind ruleType in form state */}
            <input type="hidden" {...register('ruleType')} value={type} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precedence</label>
            <Input
              type="number"
              defaultValue={0}
              {...register('precedence', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explain (why)</label>
          <Input placeholder="Explain the logic" {...register('explain')} />
        </div>

        {/* Common trigger section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              If: Select Product (trigger){' '}
              <span className="text-red-600" aria-hidden>
                ＊
              </span>
            </label>
            <AdvancedSelect
              placeholder="Search products..."
              options={productOptions}
              searchable
              loading={loadingProducts}
              value={triggerSku}
              onChange={val => setTriggerSku(Array.isArray(val) ? (val[0] ?? '') : String(val))}
            />
            {fieldErrors.triggerSku ? (
              <p id="trigger-sku-error" className="mt-1 text-xs text-red-600">
                Trigger product is required
              </p>
            ) : null}
          </div>
        </div>

        {/* Type-specific inputs */}
        {type === 'REQUIRES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requires: Product{' '}
                <span className="text-red-600" aria-hidden>
                  ＊
                </span>
              </label>
              <AdvancedSelect
                placeholder="Select dependent product"
                options={productOptions}
                searchable
                loading={loadingProducts}
                value={requiresSku}
                onChange={val => setRequiresSku(Array.isArray(val) ? (val[0] ?? '') : String(val))}
              />
              {fieldErrors.requiresSku ? (
                <p id="requires-sku-error" className="mt-1 text-xs text-red-600">
                  Requires product is required
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (number or formula)
              </label>
              <Input
                placeholder="e.g., 1 or =ceil(#cores/8)"
                value={requiresQty}
                onChange={e => setRequiresQty(e.target.value)}
              />
            </div>
          </div>
        )}

        {type === 'EXCLUDES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excludes: Product{' '}
                <span className="text-red-600" aria-hidden>
                  ＊
                </span>
              </label>
              <AdvancedSelect
                placeholder="Select incompatible product"
                options={productOptions}
                searchable
                loading={loadingProducts}
                value={excludesSku}
                onChange={val => setExcludesSku(Array.isArray(val) ? (val[0] ?? '') : String(val))}
              />
              {fieldErrors.excludesSku ? (
                <p id="excludes-sku-error" className="mt-1 text-xs text-red-600">
                  Excludes product is required
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regions (optional, comma-separated)
              </label>
              <Input
                placeholder="e.g., KSA,UAE"
                value={excludesRegions}
                onChange={e => setExcludesRegions(e.target.value)}
              />
            </div>
          </div>
        )}

        {type === 'AUTO_ADD' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-add: Product
              </label>
              <AdvancedSelect
                placeholder="Select product to auto-add"
                options={productOptions}
                searchable
                loading={loadingProducts}
                value={autoAddSku}
                onChange={val => setAutoAddSku(Array.isArray(val) ? (val[0] ?? '') : String(val))}
              />
              {fieldErrors.autoAddSku ? (
                <p id="autoadd-sku-error" className="mt-1 text-xs text-red-600">
                  Auto-add product is required
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g., 1"
                value={autoAddQty}
                onChange={e => setAutoAddQty(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoAddOverride}
                  onChange={e => setAutoAddOverride(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Allow override</span>
              </label>
            </div>
          </div>
        )}

        {type === 'CHOOSE_ONE_OF' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group{' '}
                <span className="text-red-600" aria-hidden>
                  ＊
                </span>
              </label>
              <Input
                aria-invalid={fieldErrors.chooseGroup}
                aria-describedby={fieldErrors.chooseGroup ? 'choose-group-error' : undefined}
                placeholder="Group name"
                value={chooseGroup}
                onChange={e => setChooseGroup(e.target.value)}
              />
              {fieldErrors.chooseGroup ? (
                <p id="choose-group-error" className="mt-1 text-xs text-red-600">
                  Group is required
                </p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (comma-separated SKUs){' '}
                <span className="text-red-600" aria-hidden>
                  ＊
                </span>
              </label>
              <Input
                aria-invalid={fieldErrors.chooseOptions}
                aria-describedby={fieldErrors.chooseOptions ? 'choose-options-error' : undefined}
                placeholder="SKU1,SKU2,SKU3"
                value={chooseOptions}
                onChange={e => setChooseOptions(e.target.value)}
              />
              {fieldErrors.chooseOptions ? (
                <p id="choose-options-error" className="mt-1 text-xs text-red-600">
                  Enter at least two options
                </p>
              ) : null}
            </div>
          </div>
        )}

        {type === 'RECOMMENDS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommend: Product{' '}
                <span className="text-red-600" aria-hidden>
                  ＊
                </span>
              </label>
              <AdvancedSelect
                placeholder="Select suggested product"
                options={productOptions}
                searchable
                loading={loadingProducts}
                value={recoSku}
                onChange={val => setRecoSku(Array.isArray(val) ? (val[0] ?? '') : String(val))}
              />
              {fieldErrors.recoSku ? (
                <p id="reco-sku-error" className="mt-1 text-xs text-red-600">
                  Recommend product is required
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g., 80"
                value={recoScore}
                onChange={e => setRecoScore(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={() => onCancel?.()}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEditing
              ? isSubmitting
                ? 'Saving...'
                : 'Save Rule'
              : isSubmitting
                ? 'Creating...'
                : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
