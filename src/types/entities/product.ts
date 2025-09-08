/**
 * Product Entity Types
 * Based on Prisma models and DATA_MODEL.md specifications
 */

// Product Enums (manually defined to match Prisma schema)
export enum RelationshipType {
  REQUIRES = 'REQUIRES',
  RECOMMENDS = 'RECOMMENDS',
  INCOMPATIBLE = 'INCOMPATIBLE',
  ALTERNATIVE = 'ALTERNATIVE',
  OPTIONAL = 'OPTIONAL',
}

// Core Product Types (manually defined to match Prisma schema)
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  attributes?: Record<string, unknown> | null;
  images: string[];
  datasheetPath?: string | null; // Optional path to product datasheet (network or local)
  isActive: boolean;
  version: number;
  usageAnalytics?: Record<string, unknown> | null;
  userStoryMappings: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: RelationshipType;
  quantity?: number | null;
  condition?: Record<string, unknown> | null;
  validationHistory?: Record<string, unknown> | null;
  performanceImpact?: Record<string, unknown> | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product with relations
export interface ProductWithRelationships extends Product {
  relationships: Array<
    ProductRelationship & {
      targetProduct: Product;
    }
  >;
  relatedFrom: Array<
    ProductRelationship & {
      sourceProduct: Product;
    }
  >;
}

export interface ProductWithValidation extends Product {
  validationRules: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    isActive: boolean;
  }>;
}

// Product Analytics Types (from DATA_MODEL.md)
export interface ProductUsageAnalytics {
  productId: string;
  totalUsage: number;
  successRate: number;
  averageConfigurationTime: number;
  validationFailures: number;
  relationshipIssues: number;
  hypothesesSupported: string[];
  performanceMetrics: Record<string, number>;
}

export interface RelationshipValidationHistory {
  timestamp: Date;
  validationResult: boolean;
  performance: number;
  userStory: string;
  hypothesis: string;
  testCase: string;
}

export interface RelationshipPerformanceImpact {
  validationSpeedImprovement: number;
  errorReduction: number;
  configurationEfficiency: number;
  userSatisfaction: number;
}

export interface RelationshipCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

export interface ConditionRule {
  attribute: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

// Form Types
export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency?: string;
  category?: string[];
  tags?: string[];
  attributes?: Record<string, unknown>;
  images?: string[];
  datasheetPath?: string; // Optional path to product datasheet (network or local)
  userStoryMappings?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
  isActive?: boolean;
}

export interface CreateProductRelationshipData {
  sourceProductId: string;
  targetProductId: string;
  type: RelationshipType;
  quantity?: number;
  condition?: RelationshipCondition;
}

// Query Types
export interface ProductFilters {
  isActive?: boolean;
  category?: string[];
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  sku?: string;
  search?: string;
  // Cursor pagination properties (following CORE_REQUIREMENTS.md)
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSortOptions {
  field: 'name' | 'sku' | 'price' | 'createdAt' | 'category';
  direction: 'asc' | 'desc';
}

// Component Traceability Matrix
export interface ProductComponentMapping {
  userStories: string[];
  acceptanceCriteria: string[];
  methods: string[];
  hypotheses: string[];
  testCases: string[];
  analyticsHooks: string[];
}

// Validation Types
export interface ProductValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  attributes: Record<string, unknown>;
  isActive: boolean;
  version: number;
  // Relationships
  relatedProducts: ProductRelationship[];
}

// ProductRelationship interface is defined above (line 35)

export type ProductSortBy = 'name' | 'price' | 'category' | 'isActive' | 'createdAt';

// Base query options interface
export interface BaseQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductQuery extends BaseQueryOptions {
  sortBy?: ProductSortBy;
  category?: string;
  tags?: string[];
  priceRange?: [number, number];
  isActive?: boolean;
}

// API Client type
export interface ApiClient {
  get: <T = unknown>(url: string, config?: Record<string, unknown>) => Promise<{ data: T }>;
  post: <T = unknown>(url: string, data?: unknown) => Promise<{ data: T }>;
  put: <T = unknown>(url: string, data?: unknown) => Promise<{ data: T }>;
  delete: (url: string) => Promise<void>;
}

// Product service interface
export interface ProductService {
  query(options: ProductQuery, apiClient: ApiClient): Promise<ProductData[]>;
  getById(id: string, apiClient: ApiClient): Promise<ProductData | null>;
  create(
    data: Omit<ProductData, 'id' | 'relatedProducts'>,
    apiClient: ApiClient
  ): Promise<ProductData>;
  update(id: string, data: Partial<ProductData>, apiClient: ApiClient): Promise<ProductData>;
  delete(id: string, apiClient: ApiClient): Promise<void>;
}
