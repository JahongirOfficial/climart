import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Download,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  MoreVertical,
  Package,
  Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { ExportButton } from "@/components/ExportButton";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { format, subMonths } from "date-fns";


const getStatusColor = (status: string) => {
  switch (status) {
    case "Bajarildi":
      return "bg-green-50 text-green-700 border border-green-200";
    case "Qabul qilindi":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "Kutilmoqda":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "Bekor qilindi":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

const Purchases = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { orders, loading, error, refetch } = usePurchaseOrders({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: statusFilter
  });

  const { totalAmount, completedCount, pendingCount, cancelledCount } = useMemo(() => {
    return {
      totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      completedCount: orders.filter(o => o.status === "Bajarildi" || o.status === "confirmed").length,
      pendingCount: orders.filter(o => o.status === "Kutilmoqda" || o.status === "pending").length,
      cancelledCount: orders.filter(o => o.status === "Bekor qilindi" || o.status === "cancelled").length,
    };
  }, [orders]);

  const filteredData = useMemo(() => {
    return orders.filter((purchase) => {
      const matchesSearch =
        !debouncedSearch ||
        purchase.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (typeof purchase.supplier === 'object' ? purchase.supplier?.name : purchase.supplier)?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [orders, debouncedSearch]);

  const uniqueSuppliers = Array.from(
    new Set(orders.map((p) => typeof p.supplier === 'object' ? p.supplier?.name : p.supplier).filter(Boolean))
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Xarid buyurtmalari</h1>
              <p className="text-sm text-gray-500 mt-1">
                Yetkazib beruvchilar va xarid buyurtmalarni boshqaring
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Plus className="h-4 w-4" />
                Yangi buyurtma
              </Button>
              <ExportButton
                data={filteredData}
                filename="xaridlar-hisoboti"
                fieldsToInclude={['orderNumber', 'supplier', 'createdAt', 'status', 'totalAmount', 'items']}
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Jami xaridlar</span>
                <div className="bg-blue-50 p-2" style={{ borderRadius: "3px" }}>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">{orders.length} buyurtma</p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Bajarildi</span>
                <div className="bg-green-50 p-2" style={{ borderRadius: "3px" }}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {completedCount}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                mufavvayatli
              </p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Kutilmoqda</span>
                <div className="bg-yellow-50 p-2" style={{ borderRadius: "3px" }}>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {pendingCount}
              </p>
              <p className="text-xs text-yellow-600 font-medium mt-1">
                faol
              </p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Bekor qilindi</span>
                <div className="bg-red-50 p-2" style={{ borderRadius: "3px" }}>
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {cancelledCount}
              </p>
              <p className="text-xs text-red-600 font-medium mt-1">
                arxivlandi
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="erp-card no-scale">
          {/* Filters Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buyurtma raqami yoki yetkazib beruvchini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white focus-visible:ring-primary"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 text-sm focus:ring-primary focus:border-primary bg-white text-gray-900 erp-input"
                >
                  <option value="all">Barcha statuslar</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="confirmed">Bajarildi</option>
                  <option value="cancelled">Bekor qilindi</option>
                </select>
              </div>

              <div>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="erp-table-header border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Buyurtma raqami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Yetkazib beruvchi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulotlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((purchase) => (
                  <tr
                    key={purchase._id}
                    className="border-b border-gray-100 erp-table-row"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {purchase.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {typeof purchase.supplier === 'object' ? purchase.supplier?.name : purchase.supplier}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(purchase.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {purchase.items.length} dona
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(
                          purchase.status
                        )}`}
                        style={{ borderRadius: "3px" }}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {purchase.totalAmount?.toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 hover:bg-[#F3F6FA] transition-colors duration-150 no-scale"
                          style={{ borderRadius: "3px" }}
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-[#F3F6FA] transition-colors duration-150 no-scale"
                          style={{ borderRadius: "3px" }}
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-[#F3F6FA] transition-colors duration-150 no-scale"
                          style={{ borderRadius: "3px" }}
                          title="Boshqa"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {filteredData.length} ta buyurtma
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-[#F3F6FA]"
                disabled
              >
                Oldingi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-[#F3F6FA]"
              >
                Keyingi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Purchases;
