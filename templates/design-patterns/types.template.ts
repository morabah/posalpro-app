// __FILE_DESCRIPTION__: Types skeleton for API contracts and UI models

export type DatabaseId = string; // CUID-friendly per CORE_REQUIREMENTS

export type __ENTITY__ = {
  id: DatabaseId;
  title: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
};

export type __LIST_RESPONSE__<TItem> = {
  success: boolean;
  data: Array<TItem>;
  pagination: {
    hasNextPage: boolean;
    nextCursor?: { cursorCreatedAt: string; cursorId: string } | null;
    limit?: number;
  };
};
