import { PurchasesLayout } from "@/components/purchases/PurchasesLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  FileText,
  Loader2,
  DollarSign,
  Filter,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { PurchaseOrderModal } from "@/components/PurchaseOrderModal";
import { ViewOrderModal } from "@/components/ViewOrderModal";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { ReceiveOrderModal } from "@/components/ReceiveOrderModal";
import { PurchaseOrder } from "@shared/api";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";
import { api } from '@/lib/api';
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const PERIOD_OPTIONS = [
  { value: "all",        label: "Barcha vaqt" },
  { value: "today",      label: "Bugun" },
  { value: "week",       label: "Bu hafta" },
  { value: "month",      label: "Bu oy" },
  { value: "prev_month", label: "O'tgan oy" },
];

const STATUS_OPTIONS = [
  { value: "",           label: "Barcha statuslar" },
  { value: "pending",    label: "Kutilmoqda" },
  { value: "received",   label: "Qabul qilindi" },
  { value: "cancelled",  label: "Bekor qilindi" },
];

function getPeriodDates(period: string) {
  const now = new Date();
  if (period === "today")      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd") };
  if (period === "week")       return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
  if (period === "month")      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
  if (period === "prev_month") { const pm = subMonths(now, 1); return { start: format(startOfMonth(pm), "yyyy-MM-dd"), end: format(endOfMonth(pm), "yyyy-MM-dd") }; }
  return { start: "", end: "" };
}

const Orders = () => {
  const navigate = useNavigate();
  const { orders, loading, error, refetch, receiveOrder, deleteOrder, createOrder, updateOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { showSuccess, showError } = useModal();

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PurchaseOrder | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s._id, label: s.name }))
  , [suppliers]);

  const activeFilterCount = [statusFilter, supplierFilter, periodFilter !== "all" ? periodFilter : ""].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":   return { label: "Kutilmoqda",    icon: Clock,         className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "received":  return { label: "Qabul qilindi", icon: CheckCircle,   className: "bg-green-50 text-green-700 border-green-200" };
      case "cancelled": return { label: "Bekor qilindi", icon: XCircle,       className: "bg-red-50 text-red-700 border-red-200" };
      default:          return { label: "Noma'lum",      icon: Clock,         className: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setShowReceiveModal(true);
  };

  const handleReceiveSave = async (distributions: any[]) => {
    if (!orderToReceive) return;
    try {
      setReceivingOrder(orderToReceive._id);
      await api.post(`/api/purchase-orders/${orderToReceive._id}/receive`, { distributions });
      showSuccess('Buyurtma muvaffaqiyatli qabul qilindi!');
      setShowReceiveModal(false);
      setOrderToReceive(null);
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setReceivingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete);
        showSuccess('Buyurtma o\'chirildi');
        setShowDeleteDialog(false);
        setOrderToDelete(null);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      }
    }
  };

  const handleCreateOrder = () => navigate('/purchases/orders/new');

  const handleEditOrder = (order: PurchaseOrder) => {
    storeDocumentIds('purchase-orders', filteredOrders.map(o => o._id));
    navigate(`/purchases/orders/${order._id}`);
  };

  const handleSaveOrder = async (orderData: any) => {
    if (editingOrder) await updateOrder(editingOrder._id, orderData);
    else await createOrder(orderData);
    refetch();
  };

  const handlePayment = (order: PurchaseOrder) => {
    setPaymentOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSave = async (paymentData: any) => {
    try {
      await api.post('/api/payments', {
        ...paymentData,
        linkedDocument: paymentOrder?._id,
        linkedDocumentType: 'PurchaseOrder',
        linkedDocumentNumber: paymentOrder?.orderNumber,
      });
      setShowPaymentModal(false);
      setPaymentOrder(null);
      showSuccess('To\'lov muvaffaqiyatli amalga oshirildi!');
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      throw error;
    }
  };

  const periodDates = getPeriodDates(periodFilter);

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesSearch =
      !debouncedSearch ||
      order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    const matchesSupplier = !supplierFilter ||
      (typeof order.supplier === 'object' ? order.supplier?._id : order.supplier) === supplierFilter;

    let matchesPeriod = true;
    if (periodFilter !== "all" && periodDates.start && periodDates.end) {
      const orderDate = new Date(order.orderDate || order.createdAt);
      matchesPeriod = orderDate >= new Date(periodDates.start) && orderDate <= new Date(periodDates.end + "T23:59:59");
    }

    return matchesSearch && matchesStatus && matchesSupplier && matchesPeriod;
  }), [orders, debouncedSearch, statusFilter, supplierFilter, periodFilter]);

  const clearFilters = () => {
    setStatusFilter("");
    setSupplierFilter("");
    setPeriodFilter("all");
  };

  if (loading && orders.length === 0) {
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
              <span className="text-sm font-medium text-gray-600">Jami buyurtmalar</span>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-1">Barcha buyurtmalar</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Kutilmoqda</span>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === "pending").length}</p>
            <p className="text-xs text-gray-500 mt-1">Kutilayotgan</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Qabul qilindi</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === "received").length}</p>
            <p className="text-xs text-gray-500 mt-1">Qabul qilingan</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Jami summa</span>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-base font-bold text-purple-600">{formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}</p>
            <p className="text-xs text-gray-500 mt-1">Kutilayotgan xarajat</p>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
            <Button onClick={handleCreateOrder} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Yangi buyurtma
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
                placeholder="Buyurtma raqami yoki yetkazib beruvchi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <span className="text-sm text-gray-500 ml-auto">{filteredOrders.length} ta</span>
          </div>

          {/* Collapsible Filter Panel */}
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
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Holat"
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
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                  Tozalash
                </button>
              )}
            </div>
          )}

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyurtma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yetkazib beruvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tovarlar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">
                        <button onClick={() => handleEditOrder(order)} className="hover:underline">
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{order.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${statusInfo.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrencyAmount(order.totalAmount, order.currency || 'UZS')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Ochish"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handlePayment(order)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" />
                            To'lov
                          </button>
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleReceiveOrder(order)}
                              disabled={receivingOrder === order._id}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {receivingOrder === order._id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              Qabul
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            disabled={order.status === 'received'}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Buyurtmalar topilmadi</p>
              <p className="text-sm text-gray-400 mt-1">Qidiruv shartini o'zgartiring yoki yangi buyurtma yarating</p>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 text-sm text-gray-500">
            Jami {filteredOrders.length} ta buyurtma
          </div>
        </Card>

        {/* Modals */}
        <PurchaseOrderModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingOrder(null); }}
          onSave={handleSaveOrder}
          order={editingOrder}
        />
        <ViewOrderModal
          open={showViewModal}
          onClose={() => { setShowViewModal(false); setViewingOrder(null); }}
          order={viewingOrder}
        />
        {paymentOrder && (
          <CreatePaymentModal
            open={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); setPaymentOrder(null); }}
            onSave={handlePaymentSave}
            type="outgoing"
            prefilledData={{
              type: 'outgoing',
              partner: typeof paymentOrder.supplier === 'string' ? paymentOrder.supplier : (paymentOrder.supplier?._id || ''),
              partnerName: paymentOrder.supplierName,
              amount: paymentOrder.totalAmount,
              purpose: `To'lov: ${paymentOrder.orderNumber}`,
            }}
          />
        )}
        <ReceiveOrderModal
          open={showReceiveModal}
          onClose={() => { setShowReceiveModal(false); setOrderToReceive(null); }}
          onSave={handleReceiveSave}
          order={orderToReceive}
        />
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Buyurtmani o'chirish</AlertDialogTitle>
              <AlertDialogDescription>Buyurtmani o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setOrderToDelete(null); }}>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-red-600 hover:bg-red-700">O'chirish</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PurchasesLayout>
  );
};

export default Orders;
