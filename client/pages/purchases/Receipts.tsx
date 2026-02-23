import { PurchasesLayout } from "@/components/purchases/PurchasesLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Plus,
  Search,
  Eye,
  Package,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Loader2,
  XCircle,
  Trash2,
  Undo2,
  Filter,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useReceipts } from "@/hooks/useReceipts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useWarehouses } from "@/hooks/useWarehouses";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { ViewReceiptModal } from "@/components/ViewReceiptModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { SupplierReturnModal } from "@/components/SupplierReturnModal";
import { Receipt } from "@shared/api";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, subMonths, format } from "date-fns";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";
import { api } from "@/lib/api";

const PERIOD_OPTIONS = [
  { value: "all",        label: "Barcha vaqt" },
  { value: "today",      label: "Bugun" },
  { value: "week",       label: "Bu hafta" },
  { value: "month",      label: "Bu oy" },
  { value: "prev_month", label: "O'tgan oy" },
];

function getPeriodDates(period: string) {
  const now = new Date();
  if (period === "today")      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd") };
  if (period === "week")       return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
  if (period === "month")      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
  if (period === "prev_month") { const pm = subMonths(now, 1); return { start: format(startOfMonth(pm), "yyyy-MM-dd"), end: format(endOfMonth(pm), "yyyy-MM-dd") }; }
  return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
}

const Receipts = () => {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState("month");
  const periodDates = getPeriodDates(periodFilter);

  const { receipts, loading, error, refetch, createReceipt, deleteReceipt } = useReceipts(
    periodFilter === "all" ? {} : { startDate: periodDates.start, endDate: periodDates.end }
  );
  const { suppliers } = useSuppliers();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [returningReceipt, setReturningReceipt] = useState<Receipt | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<string | null>(null);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s._id, label: s.name }))
  , [suppliers]);

  const activeFilterCount = [supplierFilter, periodFilter !== "month" ? periodFilter : ""].filter(Boolean).length;

  const filteredReceipts = useMemo(() => receipts.filter(receipt => {
    const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
    const matchesSearch = !debouncedSearch || (
      receipt.receiptNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      receipt.orderNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    const matchesSupplier = !supplierFilter ||
      (typeof receipt.supplier === 'object' ? receipt.supplier?._id : receipt.supplier) === supplierFilter;
    return matchesSearch && matchesSupplier;
  }), [receipts, debouncedSearch, supplierFilter]);

  const totalReceived = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = receipts.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0), 0);

  const handleViewReceipt = (receipt: Receipt) => {
    storeDocumentIds('receipts', filteredReceipts.map(r => r._id));
    navigate(`/purchases/receipts/${receipt._id}`);
  };

  const handleCreateReceipt = () => navigate('/purchases/receipts/new');

  const handleSaveReceipt = async (receiptData: any) => {
    try {
      await createReceipt(receiptData);
      showSuccess('Qabul muvaffaqiyatli yaratildi!');
      refetch();
    } catch (error) { throw error; }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!confirm('Qabulni o\'chirmoqchimisiz? Bu ombor zaxirasini kamaytiradi.')) return;
    try {
      setDeletingReceipt(receiptId);
      await deleteReceipt(receiptId);
      showSuccess('Qabul o\'chirildi');
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally { setDeletingReceipt(null); }
  };

  const handleReturnReceipt = (receipt: Receipt) => {
    navigate(`/purchases/returns/new?receiptId=${receipt._id}`);
  };

  const handleSaveReturn = async (returnData: any) => {
    try {
      await api.post('/api/supplier-returns', returnData);
      showSuccess('Tovar qaytarish muvaffaqiyatli yaratildi!');
      refetch();
      setShowReturnModal(false);
      setReturningReceipt(null);
    } catch (error) { throw error; }
  };

  if (loading && receipts.length === 0) {
    return (
      <PurchasesLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
        </div>
      </PurchasesLayout>
    );
  }

  if (error) {
    return (
      <PurchasesLayout>
        <div className="p-6">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
                <Button onClick={() => refetch()} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">Qayta urinish</Button>
              </div>
            </div>
          </Card>
        </div>
      </PurchasesLayout>
    );
  }

  return (
    <PurchasesLayout>
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Jami qabullar</span>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
            <p className="text-xs text-gray-500 mt-1">Barcha qabullar</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Qabul qilingan</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{totalItems}</p>
            <p className="text-xs text-gray-500 mt-1">Dona tovar</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Jami summa</span>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-base font-bold text-purple-600">{formatCurrency(totalReceived)}</p>
            <p className="text-xs text-gray-500 mt-1">Qabul qilingan</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Bu oy</span>
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{receipts.length}</p>
            <p className="text-xs text-gray-500 mt-1">Qabul hujjatlari</p>
          </Card>
        </div>

        <Card>
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
            <Button onClick={handleCreateReceipt} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Yangi qabul
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className={`gap-1.5 ${showFilters || activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : ""}`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Qabul raqami, buyurtma yoki yetkazib beruvchi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <span className="text-sm text-gray-500 ml-auto">{filteredReceipts.length} ta</span>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-3 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2 items-center">
              <div className="w-52">
                <Combobox
                  options={supplierOptions}
                  value={supplierFilter}
                  onValueChange={setSupplierFilter}
                  placeholder="Yetkazib beruvchi"
                  searchPlaceholder="Qidirish..."
                  emptyText="Topilmadi"
                />
              </div>
              <div className="w-44">
                <Combobox
                  options={PERIOD_OPTIONS}
                  value={periodFilter}
                  onValueChange={setPeriodFilter}
                  placeholder="Sana davri"
                  searchPlaceholder="Qidirish..."
                  emptyText="Topilmadi"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setSupplierFilter(""); setPeriodFilter("month"); }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                  Tozalash
                </button>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qabul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yetkazib beruvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyurtma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tovarlar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceipts.map((receipt) => {
                  const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
                  const itemsCount = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={receipt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">
                        <button onClick={() => handleViewReceipt(receipt)} className="hover:underline">{receipt.receiptNumber}</button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{supplierName}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">{receipt.orderNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(receipt.receiptDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          {itemsCount} dona
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrencyAmount(receipt.totalAmount, (receipt as any).currency || 'UZS')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleViewReceipt(receipt)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Ochish">
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button onClick={() => handleReturnReceipt(receipt)} className="p-1.5 hover:bg-orange-50 rounded transition-colors" title="Qaytarish">
                            <Undo2 className="h-4 w-4 text-orange-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(receipt._id)}
                            disabled={deletingReceipt === receipt._id}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingReceipt === receipt._id
                              ? <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                              : <Trash2 className="h-4 w-4 text-red-500" />
                            }
                          </button>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Qabul qilindi
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Qabullar topilmadi</p>
              <p className="text-sm text-gray-400 mt-1">Qidiruv shartini o'zgartiring yoki yangi qabul yarating</p>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 text-sm text-gray-500">
            Jami {filteredReceipts.length} ta qabul
          </div>
        </Card>

        {/* Modals */}
        <ViewReceiptModal open={showViewModal} onClose={() => { setShowViewModal(false); setViewingReceipt(null); }} receipt={viewingReceipt} />
        <ReceiptModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={handleSaveReceipt} />
        <SupplierReturnModal open={showReturnModal} onClose={() => { setShowReturnModal(false); setReturningReceipt(null); }} receipt={returningReceipt} onSave={handleSaveReturn} />
      </div>
    </PurchasesLayout>
  );
};

export default Receipts;
