import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Package,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useProcurement } from "@/hooks/useProcurement";

const Procurement = () => {
  const { products, loading, error, createOrdersForProducts } = useProcurement();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [forecastDays] = useState(14);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [creatingOrders, setCreatingOrders] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-50 text-red-700 border-red-300',
      'warning': 'bg-yellow-50 text-yellow-700 border-yellow-300',
      'ok': 'bg-green-50 text-green-700 border-green-300'
    };
    return colors[status] || colors['ok'];
  };

  const getStatusIcon = (status: string) => {
    if (status === 'critical') return <XCircle className="h-4 w-4" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'critical': 'Kritik',
      'warning': 'Ogohlantirish',
      'ok': 'Yaxshi'
    };
    return labels[status] || status;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    product.supplier.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const criticalProducts = products.filter(p => p.status === 'critical');
  const warningProducts = products.filter(p => p.status === 'warning');
  const totalDeficit = products.reduce((sum, p) => sum + Math.abs(p.deficit), 0);
  const totalOrderValue = products
    .filter(p => p.needToOrder > 0)
    .reduce((sum, p) => sum + (p.needToOrder * p.costPrice), 0);

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    const productsNeedingOrder = filteredProducts.filter(p => p.needToOrder > 0);
    if (selectedProducts.length === productsNeedingOrder.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsNeedingOrder.map(p => p._id));
    }
  };

  const handleCreateOrder = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setCreatingOrders(true);
      const result = await createOrdersForProducts(selectedProducts);
      showSuccess(`Muvaffaqiyatli yaratildi: ${result.ordersCreated} ta buyurtma`);
      setSelectedProducts([]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setCreatingOrders(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
          </div>
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
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Zakazlar bilan ishlash</h1>
              <p className="text-sm text-gray-500 mt-1">
                Avtomatik tahlil va aqlli rejalashtirish
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
                disabled
              >
                <Calendar className="h-4 w-4" />
                Prognoz: {forecastDays} kun
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white gap-2"
                onClick={handleCreateOrder}
                disabled={selectedProducts.length === 0 || creatingOrders}
              >
                {creatingOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Buyurtma yaratish ({selectedProducts.length})
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Kritik mahsulotlar</span>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{criticalProducts.length}</p>
              <p className="text-xs text-gray-500 mt-1">Zudlik bilan buyurtma qiling</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Ogohlantirish</span>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{warningProducts.length}</p>
              <p className="text-xs text-gray-500 mt-1">Tez orada tugaydi</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami defitsit</span>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{Math.round(totalDeficit)}</p>
              <p className="text-xs text-gray-500 mt-1">Dona yetishmayapti</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Buyurtma summasi</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(totalOrderValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Kerakli investitsiya</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search and Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Mahsulot nomi, SKU yoki yetkazib beruvchini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="gap-2"
                disabled={filteredProducts.filter(p => p.needToOrder > 0).length === 0}
              >
                {selectedProducts.length === filteredProducts.filter(p => p.needToOrder > 0).length
                  ? "Tanlovni bekor qilish"
                  : "Hammasini tanlash"}
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.filter(p => p.needToOrder > 0).length}
                      onChange={handleSelectAll}
                      disabled={filteredProducts.filter(p => p.needToOrder > 0).length === 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Joriy qoldiq
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    O'rtacha sotuv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Prognoz ({forecastDays} kun)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Defitsit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Buyurtma qilish
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className={`hover:bg-gray-50 transition-colors ${product.status === 'critical' ? 'bg-red-50/30' :
                        product.status === 'warning' ? 'bg-yellow-50/30' : ''
                      }`}
                  >
                    <td className="px-4 py-4">
                      {product.needToOrder > 0 && (
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku} • {product.supplier}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className={`font-semibold ${product.quantity < (product.minQuantity || 10) ? 'text-red-600' : 'text-gray-900'
                          }`}>
                          {product.quantity} dona
                        </p>
                        <p className="text-xs text-gray-500">Min: {product.minQuantity || 10}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{product.dailyAverageSales.toFixed(1)} dona/kun</p>
                        <p className="text-xs text-gray-500">O'tgan hafta: {product.lastWeekSales}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {Math.round(product.dailyAverageSales * product.forecastDays)} dona
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${product.deficit < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {product.deficit < 0 ? Math.round(product.deficit) : `+${Math.round(product.deficit)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.needToOrder > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">
                            {Math.round(product.needToOrder)} dona
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {product.needToOrder > 0
                        ? formatCurrency(Math.round(product.needToOrder) * product.costPrice)
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)}
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Mahsulotlar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                Qidiruv shartini o'zgartiring
              </p>
            </div>
          )}
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Prognoz qanday hisoblanadi?
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>O'rtacha sotuv</strong> - O'tgan 7 kunlik sotuvlar tahlili</li>
                  <li>• <strong>Prognoz</strong> - Kunlik o'rtacha × {forecastDays} kun</li>
                  <li>• <strong>Defitsit</strong> - Joriy qoldiq - Prognoz miqdori</li>
                  <li>• Manfiy raqam = qancha tovar yetishmayotgani</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Avtomatik buyurtma yaratish
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Kerakli mahsulotlarni belgilang</li>
                  <li>• "Buyurtma yaratish" tugmasini bosing</li>
                  <li>• Tizim avtomatik ravishda yetkazib beruvchilarga buyurtma yaratadi</li>
                  <li>• Har bir yetkazib beruvchi uchun alohida hujjat</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Procurement;
