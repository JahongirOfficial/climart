import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  XCircle,
  History
} from "lucide-react";
import { useState, useMemo } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { ProductModal } from "@/components/ProductModal";
import { ViewProductModal } from "@/components/ViewProductModal";
import { Product } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, getStockStatus } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";

const ProductsList = () => {
  const { products, loading, error, refetch, createProduct, updateProduct, deleteProduct } = useProducts();
  const { warehouses } = useWarehouses();
  const { showSuccess, showError } = useModal();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Create warehouse lookup map
  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehouses.forEach(wh => {
      map.set(wh._id, { name: wh.name, color: wh.color || '#3B82F6' });
    });
    return map;
  }, [warehouses]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Calculate totals with memoization
  const { totalValue, lowStockCount, outOfStockCount } = useMemo(() => {
    return {
      totalValue: products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0),
      lowStockCount: products.filter(p => p.quantity <= (p.minQuantity || 0)).length,
      outOfStockCount: products.filter(p => p.quantity === 0).length
    };
  }, [products]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct._id, productData);
    } else {
      await createProduct(productData);
    }
    refetch();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Mahsulotni o\'chirmoqchimisiz?')) return;

    try {
      await deleteProduct(productId);
      showSuccess('Mahsulot o\'chirildi');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    }
  };

  if (loading && products.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Card key={i} className="p-4"><Skeleton className="h-4 w-28 mb-2" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20 mt-1" /></Card>)}
          </div>
          <Card>
            <div className="p-4 border-b"><Skeleton className="h-10 w-full" /></div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32 ml-auto" />
              </div>
            ))}
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
                <Button
                  onClick={() => refetch()}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Qayta urinish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar ro'yxati</h1>
              <p className="text-sm text-gray-500 mt-1">
                Barcha mahsulotlar va ularning zaxirasi
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                data={filteredProducts}
                filename="mahsulotlar"
                fieldsToInclude={["name", "sku", "category", "unit", "quantity", "costPrice", "sellingPrice"]}
              />
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={handleCreateProduct}>
                <Plus className="h-4 w-4" />
                Yangi mahsulot
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami mahsulotlar</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-xs text-gray-500 mt-1">Turlar soni</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Ombor qiymati</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tan narxda</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Kam qolgan</span>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              <p className="text-xs text-gray-500 mt-1">Minimal miqdordan kam</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Tugagan</span>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              <p className="text-xs text-gray-500 mt-1">Omborda yo'q</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Mahsulot nomi yoki kategoriyani qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Kategoriya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Zaxira
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Tan narx
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sotuv narxi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sotuv (kunlik)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Qoldi (kun)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.quantity, product.minQuantity);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 wrap-text">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 wrap-text">
                        {product.category || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {product.stockByWarehouse && product.stockByWarehouse.length > 0 ? (
                            <>
                              <div className="flex flex-wrap gap-1.5">
                                {product.stockByWarehouse.map((stock: any) => {
                                  const warehouse = warehouseMap.get(stock.warehouse);
                                  const color = warehouse?.color || '#3B82F6';
                                  return (
                                    <span
                                      key={stock.warehouse}
                                      className="inline-flex items-center px-2.5 py-1 text-sm font-bold rounded-md border-2"
                                      style={{ 
                                        color: color,
                                        borderColor: color,
                                        backgroundColor: `${color}15`
                                      }}
                                      title={warehouse?.name || 'Noma\'lum ombor'}
                                    >
                                      {stock.quantity}
                                    </span>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-gray-500">
                                Jami: {product.quantity} {product.unit || 'dona'}
                              </p>
                            </>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {product.quantity} {product.unit || 'dona'}
                              </p>
                              {product.minQuantity && (
                                <p className="text-xs text-gray-500">Min: {product.minQuantity}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(product.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {product.dailyAverage?.toFixed(1) || '0.0'} {product.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${(product.daysRemaining ?? 99999) < 7 ? 'text-red-600' :
                          (product.daysRemaining ?? 99999) < 14 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                          {(product.daysRemaining ?? 99999) >= 99999 ? '∞' : Math.ceil(product.daysRemaining || 0)} kun
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${stockStatus.className}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/products/history/${product._id}`)}
                            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="Tarix"
                          >
                            <History className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Mahsulotlar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                {products.length === 0 ? "Hali mahsulotlar yo'q" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {filteredProducts.length} ta mahsulot
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Oldingi
              </Button>
              <Button variant="outline" size="sm">
                Keyingi
              </Button>
            </div>
          </div>
        </Card>

        {/* Product Modal */}
        <ProductModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
        />

        {/* View Product Modal */}
        <ViewProductModal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingProduct(null);
          }}
          product={viewingProduct}
        />
      </div>
    </Layout>
  );
};

export default ProductsList;
