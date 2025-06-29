/**
 * PosalPro MVP2 - Product List Component
 * Displays paginated list of products with search and filtering
 * Based on PRODUCT_MANAGEMENT_SCREEN.md wireframe specifications
 * Component Traceability Matrix: US-5.1, US-5.2, H11, H12
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import {
  CubeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import Link from 'next/link';
import { memo, useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-5.2.1'],
  methods: ['fetchProducts()', 'searchProducts()', 'trackProductViewed()'],
  hypotheses: ['H11', 'H12'],
  testCases: ['TC-H11-001', 'TC-H12-001'],
};

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const ProductCard = memo(({ product, onView, onEdit }: ProductCardProps) => {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <CubeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(product.status)}>
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600">{product.category}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onView(product.id)} className="p-2">
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(product.id)} className="p-2">
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {product.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {product.tags.slice(0, 2).join(', ')}
                {product.tags.length > 2 && ` +${product.tags.length - 2}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
ProductCard.displayName = 'ProductCard';

const ProductListSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex space-x-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
));
ProductListSkeleton.displayName = 'ProductListSkeleton';

const ProductList = memo(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const apiClient = useApiClient();
  const analytics = useAnalytics();

  const fetchProducts = useCallback(
    async (page = 1, search = '') => {
      try {
        setLoading(true);
        setError(null);

        // Track analytics event
        analytics.track('product_list_fetch_started', {
          component: 'ProductList',
          page,
          search: search.length > 0,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        // Mock data for demonstration
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Enterprise Software License',
            description:
              'Comprehensive enterprise software solution with full support and maintenance',
            category: 'Software',
            price: 50000,
            status: 'active',
            tags: ['enterprise', 'software', 'license'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Cloud Infrastructure Setup',
            description: 'Complete cloud infrastructure deployment and configuration service',
            category: 'Services',
            price: 25000,
            status: 'active',
            tags: ['cloud', 'infrastructure', 'setup'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Security Audit Package',
            description: 'Comprehensive security assessment and vulnerability testing',
            category: 'Security',
            price: 15000,
            status: 'active',
            tags: ['security', 'audit', 'testing'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Data Analytics Platform',
            description: 'Advanced data analytics and business intelligence platform',
            category: 'Analytics',
            price: 75000,
            status: 'draft',
            tags: ['analytics', 'data', 'intelligence'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            name: 'Mobile App Development',
            description: 'Custom mobile application development for iOS and Android',
            category: 'Development',
            price: 35000,
            status: 'active',
            tags: ['mobile', 'app', 'development'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            name: 'Training Program',
            description: 'Comprehensive training program for software implementation',
            category: 'Training',
            price: 8000,
            status: 'inactive',
            tags: ['training', 'education', 'implementation'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        // Filter based on search if provided
        let filteredProducts = mockProducts;
        if (search) {
          filteredProducts = mockProducts.filter(
            product =>
              product.name.toLowerCase().includes(search.toLowerCase()) ||
              product.description.toLowerCase().includes(search.toLowerCase()) ||
              product.category.toLowerCase().includes(search.toLowerCase()) ||
              product.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
          );
        }

        // Simulate pagination
        const itemsPerPage = 12;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setProducts(paginatedProducts);
        setTotal(filteredProducts.length);
        setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));
        setCurrentPage(page);

        // Track successful fetch
        analytics.track('product_list_fetch_success', {
          component: 'ProductList',
          productCount: paginatedProducts.length,
          total: filteredProducts.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn('[ProductList] Error fetching products:', error);
        setError('Failed to load products');

        // Track error
        analytics.track('product_list_fetch_error', {
          component: 'ProductList',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, analytics]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setCurrentPage(1);
      fetchProducts(1, term);
    }, 500),
    [fetchProducts]
  );

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  useEffect(() => {
    if (searchTerm !== '') {
      debouncedSearch(searchTerm);
    } else {
      fetchProducts(1, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // ✅ CRITICAL FIX: Only include searchTerm to prevent infinite loops

  const handleView = useCallback(
    (productId: string) => {
      analytics.track('product_view_clicked', {
        component: 'ProductList',
        productId,
        timestamp: Date.now(),
      });
      window.location.href = `/products/${productId}`;
    },
    [analytics]
  );

  const handleEdit = useCallback(
    (productId: string) => {
      analytics.track('product_edit_clicked', {
        component: 'ProductList',
        productId,
        timestamp: Date.now(),
      });
      window.location.href = `/products/${productId}/edit`;
    },
    [analytics]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchProducts(page, searchTerm);
    },
    [fetchProducts, searchTerm]
  );

  if (error && products.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load products</p>
          <Button onClick={() => fetchProducts()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-gray-600 text-sm">
            {total} product{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <ProductListSkeleton />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No products match "${searchTerm}"`
                : 'Get started by adding your first product'}
            </p>
            <Link href="/products/create">
              <Button>Add Product</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
});
ProductList.displayName = 'ProductList';

export default ProductList;
