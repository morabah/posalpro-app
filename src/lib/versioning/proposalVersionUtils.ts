import { Prisma, PrismaClient } from '@prisma/client';

type PrismaTransaction = Prisma.TransactionClient | PrismaClient;

const normalizeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeProducts = (products: unknown): Array<{
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number | null;
  total: number;
}> => {
  if (!Array.isArray(products)) {
    return [];
  }

  const normalized = products
    .map(product => {
      if (!product || typeof product !== 'object') {
        return null;
      }

      const rawId = (product as Record<string, unknown>).productId ?? (product as Record<string, unknown>).id;
      const productId = rawId !== undefined && rawId !== null ? String(rawId) : '';

      if (!productId) {
        return null;
      }

      const quantity = normalizeNumber((product as Record<string, unknown>).quantity) ?? 0;
      const unitPrice = normalizeNumber((product as Record<string, unknown>).unitPrice) ?? 0;
      const discount = normalizeNumber((product as Record<string, unknown>).discount);
      const total =
        normalizeNumber((product as Record<string, unknown>).total) ?? quantity * unitPrice;

      return {
        productId,
        quantity,
        unitPrice,
        discount,
        total,
      };
    })
    .filter((product): product is {
      productId: string;
      quantity: number;
      unitPrice: number;
      discount: number | null;
      total: number;
    } => Boolean(product));

  return normalized.sort((a, b) => a.productId.localeCompare(b.productId));
};

export const normalizeVersionSnapshot = (snapshot: unknown) => {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const source = snapshot as Record<string, unknown>;

  let dueDate: string | null = null;
  if (source.dueDate) {
    const parsed = new Date(String(source.dueDate));
    if (!Number.isNaN(parsed.getTime())) {
      dueDate = parsed.toISOString();
    }
  }

  return {
    title: source.title ?? null,
    status: source.status ?? null,
    priority: source.priority ?? null,
    value: normalizeNumber(source.value),
    customerId: source.customerId ?? null,
    dueDate,
    products: normalizeProducts(source.products),
  };
};

interface CreateProposalVersionParams {
  proposalId: string;
  changeType: string;
  changesSummary?: string | null;
  snapshot?: Prisma.JsonValue | null;
  createdBy?: string | null;
}

export const createProposalVersionIfChanged = async (
  tx: PrismaTransaction,
  { proposalId, changeType, changesSummary, snapshot, createdBy }: CreateProposalVersionParams
) => {
  const lastVersionRecord = await tx.proposalVersion.findFirst({
    where: { proposalId },
    orderBy: { version: 'desc' },
    select: {
      version: true,
      snapshot: true,
    },
  });

  const previousNormalized = lastVersionRecord?.snapshot
    ? normalizeVersionSnapshot(lastVersionRecord.snapshot)
    : null;
  const currentNormalized = snapshot ? normalizeVersionSnapshot(snapshot) : null;

  if (currentNormalized && previousNormalized) {
    if (JSON.stringify(previousNormalized) === JSON.stringify(currentNormalized)) {
      return { created: false, version: lastVersionRecord?.version ?? 0 };
    }
  } else if (previousNormalized && !currentNormalized) {
    return { created: false, version: lastVersionRecord?.version ?? 0 };
  }

  const nextVersion = (lastVersionRecord?.version ?? 0) + 1;

  await tx.proposalVersion.create({
    data: {
      proposalId,
      version: nextVersion,
      changeType,
      changesSummary: changesSummary ?? null,
      snapshot: snapshot ?? Prisma.JsonNull,
      createdBy: createdBy ?? null,
    },
  });

  return { created: true, version: nextVersion };
};
