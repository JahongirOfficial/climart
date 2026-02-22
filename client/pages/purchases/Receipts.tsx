import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Undo2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useReceipts } from "@/hooks/useReceipts";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { ViewReceiptModal } from "@/components/ViewReceiptModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { SupplierReturnModal } from "@/components/SupplierReturnModal";
import { Receipt } from "@shared/api";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from "@/lib/api";

const Receipts = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { receipts, loading, error, refetch, createReceipt, deleteReceipt } = useReceipts(dateFilter);
  const { showSuccess, showError } = useModal();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [returningReceipt, setReturningReceipt] = useState<Receipt | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<string | null>(null);

  const filteredReceipts = receipts.filter(receipt => {
    const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
    return (
      receipt.receiptNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      receipt.orderNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  });

  // Calculate totals
  const totalReceived = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = receipts.reduce((sum, r) => sum + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const handleViewReceipt = (receipt: Receipt) => {
    storeDocumentIds('receipts', filteredReceipts.map(r => r._id));
    navigate(`/purchases/receipts/${receipt._id}`);
  };

  const handleCreateReceipt = () => {
    navigate('/purchases/receipts/new');
  };

  const handleSaveReceipt = async (receiptData: any) => {
    try {
      await createReceipt(receiptData);
      showSuccess('Qabul muvaffaqiyatli yaratildi!');
      refetch();
    } catch (error) {
      throw error;
    }
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
    } finally {
      setDeletingReceipt(null);
    }
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
    } catch (error) {
      throw error;
    }
  };

  if (loading && receipts.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-gray-500 font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Qabul qilish</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tovarlarni omborga qabul qilish va zaxirani yangilash
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                data={filteredReceipts}
                filename="qabullar"
                fieldsToInclude={["receiptNumber", "orderNumber", "receiptDate", "totalAmount"]}
              />
              <Button
                onClick={handleCreateReceipt}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Yangi qabul
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <span className="text-sm font-medium text-gray-600">Qabul qilingan tovarlar</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {totalItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dona</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami summa</span>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(totalReceived)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Qabul qilingan</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Bu oy</span>
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {receipts.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Qabul hujjatlari</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2 relative">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Qidiruv</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Qabul raqami, buyurtma yoki yetkazib beruvchini..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sana dan</label>
                <Input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sana gacha</label>
                <Input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Qabul raqami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Yetkazib beruvchi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Buyurtma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Tovarlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredReceipts.map((receipt) => {
                  const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
                  const itemsCount = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={receipt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        <button onClick={() => handleViewReceipt(receipt)} className="hover:underline">
                          {receipt.receiptNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 hover:underline cursor-pointer">
                        {receipt.orderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(receipt.receiptDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          {itemsCount} dona
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(receipt.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewReceipt(receipt)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleReturnReceipt(receipt)}
                            className="p-1.5 hover:bg-orange-50 rounded transition-colors"
                            title="Qaytarish"
                          >
                            <Undo2 className="h-4 w-4 text-orange-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(receipt._id)}
                            disabled={deletingReceipt === receipt._id}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="O'chirish"
                          >
                            {deletingReceipt === receipt._id ? (
                              <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </button>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded">
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

          {/* Empty State */}
          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Qabullar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                Qidiruv shartini o'zgartiring yoki yangi qabul yarating
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {filteredReceipts.length} ta qabul
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

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-green-50 border-green-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Qabul qilish haqida muhim ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Ombor zaxirasi</strong> - Qabul qilingan tovarlar avtomatik ravishda ombor zaxirasiga qo'shiladi</li>
                <li>• <strong>Tan narx</strong> - Har bir tovarning kelish narxi (себестоимость) saqlanadi</li>
                <li>• <strong>Buyurtmadan yaratish</strong> - "Buyurtmalar" bo'limida "Qabul qilish" tugmasini bosing</li>
                <li>• <strong>Avtomatik hisoblash</strong> - Foyda hisoblash uchun tan narx ishlatiladi</li>
                <li>• Qabul qilingan tovarlar darhol sotuvga chiqadi</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* View Receipt Modal */}
        <ViewReceiptModal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingReceipt(null);
          }}
          receipt={viewingReceipt}
        />

        {/* Create Receipt Modal */}
        <ReceiptModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveReceipt}
        />

        {/* Supplier Return Modal */}
        <SupplierReturnModal
          open={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturningReceipt(null);
          }}
          receipt={returningReceipt}
          onSave={handleSaveReturn}
        />
      </div>
    </Layout>
  );
};

export default Receipts;
