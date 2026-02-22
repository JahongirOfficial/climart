import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Search,
  Eye,
  Edit,
  MoreVertical,
  Loader2,
  Package
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { ExportButton } from "@/components/ExportButton";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { format, subMonths, isToday, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";


const getPaymentStatusColor = (status: "unpaid" | "partial" | "paid" | "cancelled") => {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700 border border-green-200";
    case "partial":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "unpaid":
      return "bg-red-50 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [dateFilter, setDateFilter] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { invoices = [], loading, error, refetch } = useCustomerInvoices({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate
  });

  const { todaySales, totalSales, paidCount, unpaidCount } = useMemo(() => {
    const now = new Date();
    return {
      todaySales: invoices
        .filter(inv => isToday(new Date(inv.invoiceDate)) && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      totalSales: invoices
        .filter(inv => inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      paidCount: invoices.filter(inv => inv.status === 'paid').length,
      unpaidCount: invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partial').length,
    };
  }, [invoices]);

  const filteredData = useMemo(() => {
    return invoices.filter(
      (sale) =>
        sale.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [invoices, debouncedSearch]);

  return (
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Savdo buyurtmalari</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sotuv buyurtmalari va invoyslarni boshqaring
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Plus className="h-4 w-4" />
                Yangi sotuv
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-[#F3F6FA] gap-2"
              >
                <FileText className="h-4 w-4" />
                Invoice
              </Button>
              <ExportButton
                data={filteredData}
                filename="savdo-hisoboti"
                fieldsToInclude={['invoiceNumber', 'customerName', 'invoiceDate', 'status', 'totalAmount']}
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Bugungi savdo</span>
                <div className="bg-blue-50 p-2" style={{ borderRadius: "3px" }}>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {todaySales.toLocaleString()} so'm
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">Bugungi sotuvlar</p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Jami savdo (tanlangan davr)</span>
                <div className="bg-green-50 p-2" style={{ borderRadius: "3px" }}>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalSales.toLocaleString()} so'm
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                {invoices.length} sotuv
              </p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">To'langan</span>
                <div className="bg-green-50 p-2" style={{ borderRadius: "3px" }}>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
              <p className="text-xs text-green-600 font-medium mt-1">buyurtma</p>
            </div>

            <div className="erp-card p-4 no-scale">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">To'lanmagan</span>
                <div className="bg-red-50 p-2" style={{ borderRadius: "3px" }}>
                  <DollarSign className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{unpaidCount}</p>
              <p className="text-xs text-red-600 font-medium mt-1">buyurtma</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="erp-card no-scale">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buyurtma ID yoki mijoz nomini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white focus-visible:ring-primary"
                />
              </div>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-[#F3F6FA] gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtr
              </Button>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-10"
                />
                <Input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
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
                    Buyurtma ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mijoz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulotlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    To'lov holati
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
                {filteredData.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b border-gray-100 erp-table-row"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {sale.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(sale.invoiceDate), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        {sale.items.length} dona
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium ${getPaymentStatusColor(
                          sale.status
                        )}`}
                        style={{ borderRadius: "3px" }}
                      >
                        {sale.status === 'paid' ? "To'langan" : sale.status === 'partial' ? "Qisman" : "To'lanmagan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {sale.totalAmount.toLocaleString()} so'm
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
  );
};

export default Sales;
