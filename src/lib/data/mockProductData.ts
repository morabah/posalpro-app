/**
 * PosalPro MVP2 - Advanced Product Mock Data
 * Hybrid Approach: Mix mock data with database-connected features
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

export interface MockProduct {
  // EXISTING DATABASE FIELDS (from Prisma schema)
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  images: string[];
  isActive: boolean;
  version: number;

  // NEW ADVANCED FIELDS (from wireframes - mock only)
  productId: string; // "CS-2025-001" format
  subCategory?: string;
  priceModel: 'Fixed Price' | 'Hourly Rate' | 'Subscription';
  discountOptions?: {
    volumeDiscount: boolean;
    annualCommitment: boolean;
    newClientDiscount: boolean;
  };
  customizationOptions?: {
    name: string;
    type: 'single-select' | 'multi-select' | 'text' | 'number';
    options: Array<{
      name: string;
      modifier: number;
      description?: string;
    }>;
  }[];
  relatedResources?: {
    name: string;
    type: 'document' | 'image' | 'video';
    url: string;
    size?: string;
    uploadedAt: string;
  }[];
  visibilitySettings?: {
    status: 'Draft' | 'Active' | 'Archived';
    showInCatalog: boolean;
    featured: boolean;
    clientSpecific: boolean;
  };
  licenseRequirements?: {
    requiresLicense: boolean;
    licenseType?: string;
    complianceStandards?: string[];
    validationRules?: string[];
  };
  history?: {
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
  mockOnly: true; // Flag to identify mock data
}

// ADVANCED MOCK PRODUCTS (Wireframe-Perfect Data)
export const advancedMockProducts: MockProduct[] = [
  {
    // EXISTING DATABASE FIELDS
    id: 'mock-cs-001',
    name: 'Cloud Security Suite',
    description:
      'Enterprise-grade cloud security solution with advanced threat detection and compliance automation',
    sku: 'CSS-2025-001',
    price: 2500,
    currency: 'USD',
    category: ['Security', 'Software'],
    tags: ['cloud', 'security', 'enterprise', 'compliance'],
    images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
    isActive: true,
    version: 1,

    // NEW ADVANCED FIELDS (from wireframes)
    productId: 'CS-2025-001',
    subCategory: 'Cloud',
    priceModel: 'Fixed Price',
    discountOptions: {
      volumeDiscount: true,
      annualCommitment: true,
      newClientDiscount: false,
    },
    customizationOptions: [
      {
        name: 'Deployment Type',
        type: 'single-select',
        options: [
          { name: 'Cloud-only', modifier: 0, description: 'Full cloud deployment' },
          { name: 'Hybrid', modifier: 500, description: 'Cloud + on-premises mix' },
          { name: 'On-premises', modifier: 1200, description: 'Full on-premises deployment' },
        ],
      },
      {
        name: 'Support Level',
        type: 'single-select',
        options: [
          { name: 'Standard', modifier: 0, description: 'Email support during business hours' },
          { name: 'Premium', modifier: 750, description: '24/7 phone support' },
          {
            name: 'Enterprise',
            modifier: 2000,
            description: 'Dedicated technical account manager',
          },
        ],
      },
    ],
    relatedResources: [
      {
        name: 'Security_Whitepaper.pdf',
        type: 'document',
        url: '/mock-documents/security-whitepaper.pdf',
        size: '2.4 MB',
        uploadedAt: '2025-01-10T10:30:00Z',
      },
      {
        name: 'Dashboard_Screenshot.png',
        type: 'image',
        url: '/mock-images/dashboard-screenshot.png',
        size: '1.2 MB',
        uploadedAt: '2025-01-10T10:35:00Z',
      },
      {
        name: 'Implementation_Guide.pdf',
        type: 'document',
        url: '/mock-documents/implementation-guide.pdf',
        size: '5.7 MB',
        uploadedAt: '2025-01-10T10:40:00Z',
      },
    ],
    visibilitySettings: {
      status: 'Active',
      showInCatalog: true,
      featured: true,
      clientSpecific: false,
    },
    licenseRequirements: {
      requiresLicense: true,
      licenseType: 'Enterprise',
      complianceStandards: ['SOC 2', 'ISO 27001', 'GDPR'],
      validationRules: [
        'Annual license renewal',
        'User count validation',
        'Feature usage tracking',
      ],
    },
    history: [
      {
        date: '2025-01-10',
        action: 'Created',
        user: 'Mohamed Rabah',
        details: 'Initial product creation with basic information',
      },
      {
        date: '2025-01-15',
        action: 'Updated pricing',
        user: 'Sarah Johnson',
        details: 'Adjusted base price based on market research',
      },
      {
        date: '2025-01-20',
        action: 'Added customization options',
        user: 'Mike Chen',
        details: 'Added deployment type and support level options',
      },
      {
        date: '2025-01-22',
        action: 'Updated resources',
        user: 'Lisa Wong',
        details: 'Added implementation guide and dashboard screenshot',
      },
    ],
    mockOnly: true,
  },
  {
    // EXISTING DATABASE FIELDS
    id: 'mock-dm-002',
    name: 'Data Migration Service',
    description:
      'Professional data migration service with ETL capabilities and data quality assurance',
    sku: 'DMS-2025-002',
    price: 175,
    currency: 'USD',
    category: ['Services', 'Data'],
    tags: ['migration', 'etl', 'data-quality', 'professional'],
    images: ['/api/placeholder/300/200'],
    isActive: true,
    version: 1,

    // NEW ADVANCED FIELDS
    productId: 'DM-2025-002',
    subCategory: 'Professional Services',
    priceModel: 'Hourly Rate',
    discountOptions: {
      volumeDiscount: true,
      annualCommitment: false,
      newClientDiscount: true,
    },
    customizationOptions: [
      {
        name: 'Service Level',
        type: 'single-select',
        options: [
          { name: 'Standard', modifier: 0, description: 'Basic migration service' },
          { name: 'Premium', modifier: 50, description: 'Enhanced with data validation' },
          { name: 'Enterprise', modifier: 100, description: 'Full data transformation service' },
        ],
      },
    ],
    relatedResources: [
      {
        name: 'Migration_Process_Overview.pdf',
        type: 'document',
        url: '/mock-documents/migration-overview.pdf',
        size: '1.8 MB',
        uploadedAt: '2025-01-08T14:20:00Z',
      },
    ],
    visibilitySettings: {
      status: 'Active',
      showInCatalog: true,
      featured: false,
      clientSpecific: false,
    },
    licenseRequirements: {
      requiresLicense: false,
    },
    history: [
      {
        date: '2025-01-08',
        action: 'Created',
        user: 'David Kim',
        details: 'Service creation for data migration offerings',
      },
    ],
    mockOnly: true,
  },
  {
    // EXISTING DATABASE FIELDS
    id: 'mock-aa-003',
    name: 'AI Analytics Dashboard',
    description:
      'Advanced business intelligence platform with predictive analytics and automated insights',
    sku: 'AAD-2025-003',
    price: 950,
    currency: 'USD',
    category: ['Software', 'Analytics'],
    tags: ['ai', 'analytics', 'business-intelligence', 'predictive'],
    images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
    isActive: false, // Draft status
    version: 1,

    // NEW ADVANCED FIELDS
    productId: 'AA-2025-003',
    subCategory: 'Business Intelligence',
    priceModel: 'Subscription',
    discountOptions: {
      volumeDiscount: false,
      annualCommitment: true,
      newClientDiscount: true,
    },
    customizationOptions: [
      {
        name: 'Data Sources',
        type: 'multi-select',
        options: [
          { name: 'CRM Integration', modifier: 100, description: 'Connect to Salesforce, HubSpot' },
          {
            name: 'ERP Integration',
            modifier: 150,
            description: 'Connect to SAP, Oracle, Microsoft Dynamics',
          },
          { name: 'Custom API', modifier: 75, description: 'Custom API integration' },
        ],
      },
    ],
    relatedResources: [
      {
        name: 'Analytics_Platform_Overview.pdf',
        type: 'document',
        url: '/mock-documents/analytics-overview.pdf',
        size: '3.2 MB',
        uploadedAt: '2025-01-12T09:15:00Z',
      },
      {
        name: 'Demo_Video.mp4',
        type: 'video',
        url: '/mock-videos/analytics-demo.mp4',
        size: '45 MB',
        uploadedAt: '2025-01-12T09:20:00Z',
      },
    ],
    visibilitySettings: {
      status: 'Draft',
      showInCatalog: false,
      featured: false,
      clientSpecific: false,
    },
    licenseRequirements: {
      requiresLicense: true,
      licenseType: 'SaaS',
      complianceStandards: ['SOC 2', 'GDPR', 'CCPA'],
      validationRules: ['Monthly active users', 'Data volume limits', 'API call limits'],
    },
    history: [
      {
        date: '2025-01-12',
        action: 'Created',
        user: 'Emma Rodriguez',
        details: 'Initial draft of AI analytics platform',
      },
    ],
    mockOnly: true,
  },
  {
    // EXISTING DATABASE FIELDS
    id: 'mock-na-004',
    name: 'Network Audit Package',
    description:
      'Comprehensive network security audit with vulnerability assessment and compliance reporting',
    sku: 'NAP-2025-004',
    price: 3500,
    currency: 'USD',
    category: ['Services', 'Security'],
    tags: ['network', 'audit', 'vulnerability', 'compliance'],
    images: ['/api/placeholder/300/200'],
    isActive: true,
    version: 1,

    // NEW ADVANCED FIELDS
    productId: 'NA-2025-004',
    subCategory: 'Security Services',
    priceModel: 'Fixed Price',
    discountOptions: {
      volumeDiscount: false,
      annualCommitment: false,
      newClientDiscount: false,
    },
    relatedResources: [
      {
        name: 'Network_Audit_Methodology.pdf',
        type: 'document',
        url: '/mock-documents/network-methodology.pdf',
        size: '4.1 MB',
        uploadedAt: '2025-01-05T16:45:00Z',
      },
    ],
    visibilitySettings: {
      status: 'Active',
      showInCatalog: true,
      featured: false,
      clientSpecific: false,
    },
    licenseRequirements: {
      requiresLicense: false,
    },
    history: [
      {
        date: '2025-01-05',
        action: 'Created',
        user: 'James Wilson',
        details: 'Network audit service package creation',
      },
    ],
    mockOnly: true,
  },
];

// UTILITY FUNCTIONS
export const getMockProductById = (id: string): MockProduct | undefined => {
  return advancedMockProducts.find(product => product.id === id);
};

export const getMockProductsByCategory = (category: string): MockProduct[] => {
  return advancedMockProducts.filter(product =>
    product.category.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
  );
};

export const getActiveMockProducts = (): MockProduct[] => {
  return advancedMockProducts.filter(product => product.isActive);
};

export const searchMockProducts = (query: string): MockProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  return advancedMockProducts.filter(
    product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description?.toLowerCase().includes(lowercaseQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      product.category.some(cat => cat.toLowerCase().includes(lowercaseQuery))
  );
};
