import { PurchasesLayout } from "@/components/purchases/PurchasesLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Plus,
  Search,
  Eye,
  RotateCcw,
  AlertCircle,
  TrendingDown,
  Package,
  XCircle,
  Loader2,
  Trash2,
  Filter,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useSupplierReturns } from "../../hooks/useSupplierReturns";
import { useSuppliers } from "@/hooks/useSuppliers";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { SupplierReturnModal } from "@/components/SupplierReturnModal";
import { ViewReturnModal } from "@/components/ViewReturnModal";
import { SupplierReturn } from "@shared/api";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";

const REASON_OPTIONS = [
  { value: "",                label: "Barcha sabablar" },
  { value: "brak",            label: "Brak (ishlamaydi)" },
  { value: "nuqson",          label: "Nuqson (yoriq, singan)" },
  { value: "noto'g'ri_model", label: "Noto'g'ri model" },
  { value: "boshqa",          label: "Boshqa sabab" },
];

const Returns = () => {
  const navigate = useNavigate();
  const { returns, loading, error, refetch, createReturn, deleteReturn } = useSupplierReturns();
  const { suppliers } = useSuppliers();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [reasonFilter, setReasonFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deletingReturn, setDeletingReturn] = useState<string | null>(null);
  const [viewingReturn, setViewingReturn] = useState<SupplierReturn | null>(null);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s._id, label: s.name }))
  , [suppliers]);

  const activeFilterCount = [reasonFilter, supplierFilter].filter(Boolean).length;

  const getReasonLabel = (reason: string) => {
    const found = REASON_OPTIONS.find(r => r.value === reason);
    return found?.label || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'brak':             'bg-red-50 text-red-700 border-red-200',
      'nuqson':           'bg-orange-50 text-orange-700 border-orange-200',
      "noto'g'ri_model":  'bg-yellow-50 text-yellow-700 border-yellow-200',
      'boshqa':           'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[reason] || colors['boshqa'];
  };

  const handleCreateReturn = () => navigate('/purchases/returns/new');

  const handleViewReturn = (ret: any) => {
    storeDocumentIds('supplier-returns', filteredReturns.map(r => r._id));
    navigate(`/purchases/returns/${ret._id}`);
  };

  const handleSaveReturn = async (returnData: any) => {
    try {
      await createReturn(returnData);
      showSuccess('Qaytarish muvaffaqiyatli yaratildi!');
      refetch();
    } catch (error) { throw error; }
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('Qaytarishni o\'chirmoqchimisiz? Bu ombor zaxirasini oshiradi.')) return;
    try {
      setDeletingReturn(returnId);
      await deleteReturn(returnId);
      showSuccess('Qaytarish o\'chirildi');
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally { setDeletingReturn(null); }
  };

  const filteredReturns = useMemo(() => returns.filter(ret => {
    const supplierName = typeof ret.supplier === 'string' ? ret.supplier : ret.supplier?.name || '';
    const matchesSearch = !debouncedSearch || (
      supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      ret.returnNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      ret.receiptNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    const matchesReason = !reasonFilter || ret.reason === reasonFilter;
    const matchesSupplier = !supplierFilter ||
      (typeof ret.supplier === 'object' ? (ret.supplier as any)?._id : ret.supplier) === supplierFilter;
    return matchesSearch && matchesReason && matchesSupplier;
  }), [returns, debouncedSearch, reasonFilter, supplierFilter]);

  const totalReturned = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = returns.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0), 0);
  const defectiveCount = returns.filter(r => r.reason === 'brak' || r.reason === 'nuqson').length;

  if (loading) {
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
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
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
              <span className="text-sm font-medium text-gray-600">Jami qaytarishlar</span>
              <RotateCcw className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
            <p className="text-xs text-gray-500 mt-1">Barcha qaytarishlar</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Qaytarilgan</span>
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{totalItems}</p>
            <p className="text-xs text-gray-500 mt-1">Dona</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Jami summa</span>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-base font-bold text-red-600">{formatCurrency(totalReturned)}</p>
            <p className="text-xs text-gray-500 mt-1">Qaytarilgan</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Nuqsonli</span>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{defectiveCount}</p>
            <p className="text-xs text-gray-500 mt-1">Brak va nuqson</p>
          </Card>
        </div>

        <Card>
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
            <Button onClick={handleCreateReturn} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Yangi qaytarish
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
                placeholder="Qaytarish raqami, qabul yoki yetkazib beruvchi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <span className="text-sm text-gray-500 ml-auto">{filteredReturns.length} ta</span>
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
              <div className="w-52">
                <Combobox
                  options={REASON_OPTIONS}
                  value={reasonFilter}
                  onValueChange={setReasonFilter}
                  placeholder="Sabab"
                  searchPlaceholder="Qidirish..."
                  emptyText="Topilmadi"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setReasonFilter(""); setSupplierFilter(""); }}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qaytarish</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yetkazib beruvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ombor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sabab</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tovarlar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReturns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-red-600">
                      <button onClick={() => handleViewReturn(ret)} className="hover:underline">{ret.returnNumber}</button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {typeof ret.supplier === 'string' ? ret.supplier : (ret.supplier?.name || '-')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ret.warehouseName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ret.returnDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-full ${getReasonColor(ret.reason)}`}>
                        <AlertCircle className="h-3 w-3" />
                        {getReasonLabel(ret.reason)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {ret.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                      -{formatCurrencyAmount(ret.totalAmount, (ret as any).currency || 'UZS')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleViewReturn(ret)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteReturn(ret._id)}
                          disabled={deletingReturn === ret._id}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {deletingReturn === ret._id
                            ? <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                            : <Trash2 className="h-4 w-4 text-red-500" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReturns.length === 0 && (
            <div className="text-center py-12">
              <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Qaytarishlar topilmadi</p>
              <p className="text-sm text-gray-400 mt-1">
                {returns.length === 0 ? "Hali qaytarishlar yo'q" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 text-sm text-gray-500">
            Jami {filteredReturns.length} ta qaytarish
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Yetkazib beruvchilar bo'yicha
            </h3>
            <div className="space-y-2">
              {Array.from(new Set(returns.map(r => typeof r.supplier === 'string' ? r.supplier : r.supplier?.name || 'Noma\'lum'))).map(name => {
                const sr = returns.filter(r => (typeof r.supplier === 'string' ? r.supplier : r.supplier?.name || 'Noma\'lum') === name);
                return (
                  <div key={name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{name}</p>
                      <p className="text-xs text-gray-500">{sr.length} ta qaytarish</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(sr.reduce((s, r) => s + r.totalAmount, 0))}</p>
                  </div>
                );
              })}
              {returns.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Ma'lumot yo'q</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Qaytarish sabablari
            </h3>
            <div className="space-y-2">
              {['brak', 'nuqson', "noto'g'ri_model", 'boshqa'].map(reason => {
                const rr = returns.filter(r => r.reason === reason);
                if (rr.length === 0) return null;
                return (
                  <div key={reason} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${getReasonColor(reason)}`}>{getReasonLabel(reason)}</span>
                      <span className="text-sm text-gray-500">{rr.length} ta</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(rr.reduce((s, r) => s + r.totalAmount, 0))}</p>
                  </div>
                );
              })}
              {returns.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Ma'lumot yo'q</p>}
            </div>
          </Card>
        </div>

        {/* Modals */}
        <SupplierReturnModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={handleSaveReturn} />
        <ViewReturnModal open={showViewModal} onClose={() => { setShowViewModal(false); setViewingReturn(null); }} returnData={viewingReturn} />
      </div>
    </PurchasesLayout>
  );
};

export default Returns;
