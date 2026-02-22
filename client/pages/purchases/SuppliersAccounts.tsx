import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  RefreshCw,
  Search,
  Eye,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Package,
  Undo2
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useSupplierInvoices } from "@/hooks/useSupplierInvoices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { PaymentModal } from "@/components/PaymentModal";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { SupplierReturnModal } from "@/components/SupplierReturnModal";
import { SupplierInvoice, PurchaseOrder } from "@shared/api";
import { api } from '@/lib/api';

const SuppliersAccounts = () => {
  const { invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices, createPayment } = useSupplierInvoices();
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = usePurchaseOrders();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [showOrderPaymentModal, setShowOrderPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningOrder, setReturningOrder] = useState<PurchaseOrder | null>(null);
  const [viewMode, setViewMode] = useState<'invoices' | 'orders'>('orders');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ');
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'paid') return 'bg-green-50 text-green-700 border-green-300';
    if (status === 'partial') return 'bg-blue-50 text-blue-700 border-blue-300';

    // Check if overdue
    if (dueDate && getDaysUntilDue(dueDate) < 0) {
      return 'bg-red-50 text-red-700 border-red-300';
    }

    return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  };

  const getStatusIcon = (status: string, dueDate?: string) => {
    if (status === 'paid') return <CheckCircle className="h-4 w-4" />;
    if (status === 'partial') return <Clock className="h-4 w-4" />;

    if (dueDate && getDaysUntilDue(dueDate) < 0) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    return <DollarSign className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string, dueDate?: string) => {
    if (status === 'paid') return 'To\'langan';
    if (status === 'partial') return 'Qisman to\'langan';

    if (dueDate && getDaysUntilDue(dueDate) < 0) {
      return 'Muddati o\'tib ketgan';
    }

    return 'To\'lanmagan';
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    invoice.orderNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handlePayment = async (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleOrderPayment = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowOrderPaymentModal(true);
  };

  const handleOrderPaymentSave = async (paymentData: any) => {
    try {
      // To'lovni buyurtma bilan bog'lash
      const paymentWithLink = {
        ...paymentData,
        linkedDocument: selectedOrder?._id,
        linkedDocumentType: 'PurchaseOrder',
        linkedDocumentNumber: selectedOrder?.orderNumber,
      };

      // To'lovni API ga yuborish
      await api.post('/api/payments', paymentWithLink);

      setShowOrderPaymentModal(false);
      setSelectedOrder(null);
      showSuccess('To\'lov muvaffaqiyatli amalga oshirildi!');
      refetchOrders(); // Buyurtmalar ro'yxatini yangilash
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      throw error; // Modal xatolikni ko'rsatishi uchun
    }
  };

  const handleSavePayment = async (amount: number, notes: string) => {
    if (!selectedInvoice) return;

    try {
      setPayingInvoice(selectedInvoice._id);
      await createPayment(selectedInvoice._id, amount, notes);
      showSuccess('To\'lov muvaffaqiyatli amalga oshirildi!');
      refetchInvoices();
    } catch (error) {
      throw error;
    } finally {
      setPayingInvoice(null);
    }
  };

  const handleReturnOrder = (order: PurchaseOrder) => {
    setReturningOrder(order);
    setShowReturnModal(true);
  };

  const handleSaveReturn = async (returnData: any) => {
    try {
      await api.post('/api/supplier-returns', returnData);

      showSuccess('Tovar qaytarish muvaffaqiyatli yaratildi!');
      refetch();
      setShowReturnModal(false);
      setReturningOrder(null);
    } catch (error) {
      throw error;
    }
  };

  const loading = invoicesLoading || ordersLoading;
  const error = invoicesError || ordersError;
  const refetch = () => {
    refetchInvoices();
    refetchOrders();
  };

  // Calculate totals
  const totalInvoices = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalRemaining = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
  const overdueCount = invoices.filter(i =>
    i.status !== 'paid' && getDaysUntilDue(i.dueDate) < 0
  ).length;

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
                <Button
                  onClick={refetch}
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
              <h1 className="text-2xl font-bold text-gray-900">Taminotchiga to'lov qilish</h1>
              <p className="text-sm text-gray-500 mt-1">
                Yetkazib beruvchilar hisoblarini boshqarish va to'lovlar
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-white gap-2"
              onClick={refetch}
            >
              <RefreshCw className="h-4 w-4" />
              Yangilash
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami hisoblar</span>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(totalInvoices)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Barcha hisoblar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">To'langan</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Amalga oshirilgan</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Qoldiq</span>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-xs text-gray-500 mt-1">To'lash kerak</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Muddati o'tib ketgan</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-gray-500 mt-1">Hisoblar</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setViewMode('orders')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Buyurtmalar ({orders.length})
                </div>
              </button>
              <button
                onClick={() => setViewMode('invoices')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'invoices'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hisoblar ({invoices.length})
                </div>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder={viewMode === 'invoices' ? "Hisob raqami, buyurtma yoki yetkazib beruvchini qidiring..." : "Buyurtma raqami yoki yetkazib beruvchini qidiring..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {viewMode === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Hisob raqami
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
                      Muddat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Jami summa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      To'langan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Qoldiq
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
                  {filteredInvoices.map((invoice) => {
                    const remainingAmount = invoice.totalAmount - invoice.paidAmount;
                    const isOverdue = getDaysUntilDue(invoice.dueDate) < 0 && invoice.status !== 'paid';

                    return (
                      <tr
                        key={invoice._id}
                        className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''
                          }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-primary">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {invoice.supplierName}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 hover:underline cursor-pointer">
                          {invoice.orderNumber || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span>{formatDate(invoice.dueDate)}</span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-semibold">
                                {Math.abs(getDaysUntilDue(invoice.dueDate))} kun o'tib ketgan
                              </span>
                            )}
                            {!isOverdue && invoice.status !== 'paid' && getDaysUntilDue(invoice.dueDate) <= 3 && (
                              <span className="text-xs text-yellow-600 font-semibold">
                                {getDaysUntilDue(invoice.dueDate)} kun qoldi
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          {formatCurrency(invoice.paidAmount)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                          {formatCurrency(remainingAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getStatusColor(invoice.status, invoice.dueDate)}`}>
                            {getStatusIcon(invoice.status, invoice.dueDate)}
                            {getStatusLabel(invoice.status, invoice.dueDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Ko'rish"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            {remainingAmount > 0 && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handlePayment(invoice)}
                                disabled={payingInvoice === invoice._id}
                              >
                                {payingInvoice === invoice._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'To\'lash'
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders Table */}
          {viewMode === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
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
                      Tovarlar
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
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-primary">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {order.supplierName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${
                            order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'received' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {order.status === 'pending' ? <Clock className="h-3 w-3" /> :
                             order.status === 'received' ? <CheckCircle className="h-3 w-3" /> :
                             <AlertTriangle className="h-3 w-3" />}
                            {order.status === 'pending' ? 'Kutilmoqda' :
                             order.status === 'received' ? 'Qabul qilindi' :
                             'Bekor qilindi'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Ko'rish"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                              onClick={() => handleOrderPayment(order)}
                            >
                              <DollarSign className="h-3 w-3" />
                              To'lov
                            </Button>
                            {order.status === 'received' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50 flex items-center gap-1"
                                onClick={() => handleReturnOrder(order)}
                              >
                                <Undo2 className="h-3 w-3" />
                                Qaytarish
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {((viewMode === 'invoices' && filteredInvoices.length === 0) || (viewMode === 'orders' && filteredOrders.length === 0)) && (
            <div className="text-center py-12">
              {viewMode === 'invoices' ? (
                <>
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Hisoblar topilmadi</p>
                </>
              ) : (
                <>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Buyurtmalar topilmadi</p>
                </>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Qidiruv shartini o'zgartiring
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {viewMode === 'invoices' ? filteredInvoices.length : filteredOrders.length} ta {viewMode === 'invoices' ? 'hisob' : 'buyurtma'}
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
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                To'lov tizimi haqida ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Hisoblar</strong> - Qabul qilingan tovarlar uchun yaratilgan hisoblar</li>
                <li>• <strong>Buyurtmalar</strong> - Taminotchiga berilgan buyurtmalar (tovar hali kelmagan)</li>
                <li>• <strong>To'lov muddatlari</strong> - Har bir hisob uchun to'lov muddati belgilanadi</li>
                <li>• <strong>Status nazorati</strong> - To'lanmagan, qisman va to'liq to'langan holatlar</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Payment Modal for Invoices */}
        <PaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSave={handleSavePayment}
          invoice={selectedInvoice}
        />

        {/* Payment Modal for Orders */}
        {selectedOrder && (
          <CreatePaymentModal
            open={showOrderPaymentModal}
            onClose={() => {
              setShowOrderPaymentModal(false);
              setSelectedOrder(null);
            }}
            onSave={handleOrderPaymentSave}
            type="outgoing"
            prefilledData={{
              type: 'outgoing',
              partner: typeof selectedOrder.supplier === 'string' ? selectedOrder.supplier : (selectedOrder.supplier?._id || ''),
              partnerName: selectedOrder.supplierName,
              amount: selectedOrder.totalAmount,
              purpose: `To'lov: ${selectedOrder.orderNumber}`,
              category: 'purchase'
            }}
          />
        )}

        {/* Supplier Return Modal */}
        <SupplierReturnModal
          open={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturningOrder(null);
          }}
          onSave={handleSaveReturn}
          receipt={returningOrder ? {
            _id: returningOrder._id,
            supplier: returningOrder.supplier,
            receiptNumber: returningOrder.orderNumber,
            items: returningOrder.items
          } : null}
        />
      </div>
    </Layout>
  );
};

export default SuppliersAccounts;