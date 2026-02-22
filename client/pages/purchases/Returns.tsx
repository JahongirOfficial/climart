import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useSupplierReturns } from "../../hooks/useSupplierReturns";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { SupplierReturnModal } from "@/components/SupplierReturnModal";
import { ViewReturnModal } from "@/components/ViewReturnModal";
import { SupplierReturn } from "@shared/api";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate } from "@/lib/format";

const Returns = () => {
  const navigate = useNavigate();
  const { returns, loading, error, refetch, createReturn, deleteReturn } = useSupplierReturns();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deletingReturn, setDeletingReturn] = useState<string | null>(null);
  const [viewingReturn, setViewingReturn] = useState<SupplierReturn | null>(null);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'brak': 'Brak (ishlamaydi)',
      'nuqson': 'Nuqson (yoriq, singan)',
      'noto\'g\'ri_model': 'Noto\'g\'ri model',
      'boshqa': 'Boshqa sabab'
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'brak': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      'nuqson': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      'noto\'g\'ri_model': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      'boshqa': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    };
    return colors[reason] || colors['boshqa'];
  };

  const handleCreateReturn = () => {
    navigate('/purchases/returns/new');
  };

  const handleViewReturn = (returnData: any) => {
    storeDocumentIds('supplier-returns', filteredReturns.map(r => r._id));
    navigate(`/purchases/returns/${returnData._id}`);
  };

  const handleSaveReturn = async (returnData: any) => {
    try {
      await createReturn(returnData);
      showSuccess('Qaytarish muvaffaqiyatli yaratildi!');
      refetch();
    } catch (error) {
      throw error;
    }
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
    } finally {
      setDeletingReturn(null);
    }
  };

  const filteredReturns = returns.filter(ret =>
    (ret.supplierName || (typeof ret.supplier === 'string' ? ret.supplier : ret.supplier?.name) || '')
      .toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    ret.returnNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    ret.receiptNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Calculate totals
  const totalReturned = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = returns.reduce((sum, r) => sum + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const defectiveCount = returns.filter(r => r.reason === 'brak' || r.reason === 'nuqson').length;

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300">Xatolik yuz berdi</h3>
                <p className="text-red-700 dark:text-red-400">{error}</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tovar qaytarish</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Yetkazib beruvchiga tovarlarni qaytarish va ombor zaxirasini kamaytirish
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                data={filteredReturns}
                filename="yetkazuvchi-qaytarishlar"
                fieldsToInclude={["returnNumber", "returnDate", "totalAmount", "reason", "status"]}
              />
              <Button
                onClick={handleCreateReturn}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Yangi qaytarish
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami qaytarishlar</span>
                <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{returns.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Barcha qaytarishlar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Qaytarilgan tovarlar</span>
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalItems}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dona</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami summa</span>
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalReturned)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qaytarilgan</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nuqsonli tovarlar</span>
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {defectiveCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Brak va nuqson</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Qaytarish raqami, qabul yoki yetkazib beruvchini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Returns Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Qaytarish raqami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Yetkazib beruvchi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Ombor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sabab
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tovarlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
                {filteredReturns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400">
                      <button onClick={() => handleViewReturn(ret)} className="hover:underline">
                        {ret.returnNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {typeof ret.supplier === 'string' ? ret.supplier : (ret.supplier?.name || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {ret.warehouseName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(ret.returnDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getReasonColor(ret.reason)}`}>
                        <AlertCircle className="h-3 w-3" />
                        {getReasonLabel(ret.reason)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {ret.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(ret.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReturn(ret)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteReturn(ret._id)}
                          disabled={deletingReturn === ret._id}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                          title="O'chirish"
                        >
                          {deletingReturn === ret._id ? (
                            <Loader2 className="h-4 w-4 text-red-600 dark:text-red-400 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredReturns.length === 0 && (
            <div className="text-center py-12">
              <RotateCcw className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Qaytarishlar topilmadi</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {returns.length === 0 ? "Hali qaytarishlar yo'q" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Jami {filteredReturns.length} ta qaytarish
            </div>
          </div>
        </Card>

        {/* Statistics by Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Yetkazib beruvchilar bo'yicha statistika
            </h3>
            <div className="space-y-3">
              {Array.from(new Set(returns.map(r => typeof r.supplier === 'string' ? r.supplier : r.supplier?.name || 'Noma\'lum'))).map(supplierName => {
                const supplierReturns = returns.filter(r =>
                  (typeof r.supplier === 'string' ? r.supplier : r.supplier?.name || 'Noma\'lum') === supplierName
                );
                const supplierTotal = supplierReturns.reduce((sum, r) => sum + r.totalAmount, 0);
                const supplierItems = supplierReturns.reduce((sum, r) =>
                  sum + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                );

                return (
                  <div key={supplierName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{supplierName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{supplierReturns.length} ta qaytarish, {supplierItems} dona tovar</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(supplierTotal)}
                    </p>
                  </div>
                );
              })}
              {returns.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Ma'lumot yo'q</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Qaytarish sabablari
            </h3>
            <div className="space-y-3">
              {['brak', 'nuqson', 'noto\'g\'ri_model', 'boshqa'].map(reason => {
                const reasonReturns = returns.filter(r => r.reason === reason);
                const reasonTotal = reasonReturns.reduce((sum, r) => sum + r.totalAmount, 0);

                if (reasonReturns.length === 0) return null;

                return (
                  <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium border rounded ${getReasonColor(reason)}`}>
                        {getReasonLabel(reason)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{reasonReturns.length} ta</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(reasonTotal)}
                    </p>
                  </div>
                );
              })}
              {returns.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Ma'lumot yo'q</p>
              )}
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Tovar qaytarish haqida muhim ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• <strong>Ombor zaxirasi</strong> - Qaytarilgan tovarlar avtomatik ravishda ombor zaxirasidan kamayadi</li>
                <li>• <strong>Kreditorlik qarzi</strong> - Yetkazib beruvchi oldidagi qarz kamayadi</li>
                <li>• <strong>Qabuldan yaratish</strong> - "Qabul qilish" bo'limida "Qaytarish" tugmasini bosing</li>
                <li>• <strong>Sabab ko'rsatish</strong> - Har bir qaytarish uchun sabab (brak, nuqson, noto'g'ri model) ko'rsating</li>
                <li>• Qaytarilgan tovarlar statistikasi yetkazib beruvchi sifatini baholashda yordam beradi</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Supplier Return Modal */}
        <SupplierReturnModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveReturn}
        />

        <ViewReturnModal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingReturn(null);
          }}
          returnData={viewingReturn}
        />
      </div>
    </Layout>
  );
};

export default Returns;
