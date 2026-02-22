import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  FileText,
  Loader2,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { PurchaseOrderModal } from "@/components/PurchaseOrderModal";
import { ViewOrderModal } from "@/components/ViewOrderModal";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { ReceiveOrderModal } from "@/components/ReceiveOrderModal";
import { PurchaseOrder } from "@shared/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from '@/lib/api';

const Orders = () => {
  const { orders, loading, error, refetch, receiveOrder, deleteOrder, createOrder, updateOrder } = usePurchaseOrders();
  const { showSuccess, showError } = useModal();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [receivingOrder, setReceivingOrder] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PurchaseOrder | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Kutilmoqda",
          icon: Clock,
          className: "bg-yellow-50 text-yellow-700 border-yellow-200"
        };
      case "received":
        return {
          label: "Qabul qilindi",
          icon: CheckCircle,
          className: "bg-green-50 text-green-700 border-green-200"
        };
      case "cancelled":
        return {
          label: "Bekor qilindi",
          icon: XCircle,
          className: "bg-red-50 text-red-700 border-red-200"
        };
      default:
        return {
          label: "Noma'lum",
          icon: Clock,
          className: "bg-gray-50 text-gray-700 border-gray-200"
        };
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

      // Call API to receive order with warehouse distributions
      await api.post(`/api/purchase-orders/${orderToReceive._id}/receive`, { distributions });

      showSuccess('Buyurtma muvaffaqiyatli qabul qilindi!');
      setShowReceiveModal(false);
      setOrderToReceive(null);
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      // Don't re-throw the error to prevent modal from showing error
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

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setShowModal(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleSaveOrder = async (orderData: any) => {
    if (editingOrder) {
      await updateOrder(editingOrder._id, orderData);
    } else {
      await createOrder(orderData);
    }
    refetch();
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  const handlePayment = (order: PurchaseOrder) => {
    setPaymentOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSave = async (paymentData: any) => {
    try {
      // To'lovni buyurtma bilan bog'lash
      const paymentWithLink = {
        ...paymentData,
        linkedDocument: paymentOrder?._id,
        linkedDocumentType: 'PurchaseOrder',
        linkedDocumentNumber: paymentOrder?.orderNumber,
      };

      // To'lovni API ga yuborish
      await api.post('/api/payments', paymentWithLink);

      setShowPaymentModal(false);
      setPaymentOrder(null);
      showSuccess('To\'lov muvaffaqiyatli amalga oshirildi!');
      refetch(); // Buyurtmalar ro'yxatini yangilash
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      throw error; // Modal xatolikni ko'rsatishi uchun
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading && orders.length === 0) {
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ta'minotchiga buyurtma yaratish</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Yetkazib beruvchilarga buyurtmalar va ularni boshqarish
              </p>
            </div>
            <Button
              onClick={handleCreateOrder}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Yangi buyurtma
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami buyurtmalar</span>
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Barcha buyurtmalar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kutilmoqda</span>
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {orders.filter(o => o.status === "pending").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kutilayotgan buyurtmalar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Qabul qilindi</span>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter(o => o.status === "received").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qabul qilingan</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami summa</span>
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kutilayotgan xarajat</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buyurtma raqami yoki yetkazib beruvchini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-background text-foreground"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Barcha statuslar</option>
                <option value="pending">Kutilmoqda</option>
                <option value="received">Qabul qilindi</option>
                <option value="cancelled">Bekor qilindi</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Buyurtma raqami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Yetkazib beruvchi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tovarlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary dark:text-blue-400">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {order.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded ${statusInfo.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Tahrirlash"
                            disabled={order.status === 'received'}
                          >
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handlePayment(order)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                            title="To'lov qilish"
                          >
                            <DollarSign className="h-3 w-3" />
                            To'lov
                          </button>
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleReceiveOrder(order)}
                              disabled={receivingOrder === order._id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Tovar keldi"
                            >
                              {receivingOrder === order._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Qabul qilish'
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="O'chirish"
                            disabled={order.status === 'received'}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Buyurtmalar topilmadi</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Qidiruv shartini o'zgartiring yoki yangi buyurtma yarating
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Jami {filteredOrders.length} ta buyurtma
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
        <Card className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Buyurtmalar haqida ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• <strong>Kutilmoqda</strong> - Buyurtma yaratilgan, lekin tovar hali kelmagan</li>
                <li>• <strong>Qabul qilish</strong> tugmasi - Tovar kelganda bosing, avtomatik "Qabul qilish" hujjati yaratiladi</li>
                <li>• Buyurtma ombordagi tovarlar sonini o'zgartirmaydi</li>
                <li>• Narxlar kelishilgan holda saqlanadi</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Purchase Order Modal */}
        <PurchaseOrderModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
          order={editingOrder}
        />

        {/* View Order Modal */}
        <ViewOrderModal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingOrder(null);
          }}
          order={viewingOrder}
        />

        {/* Payment Modal */}
        {paymentOrder && (
          <CreatePaymentModal
            open={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentOrder(null);
            }}
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

        {/* Receive Order Modal */}
        <ReceiveOrderModal
          open={showReceiveModal}
          onClose={() => {
            setShowReceiveModal(false);
            setOrderToReceive(null);
          }}
          onSave={handleReceiveSave}
          order={orderToReceive}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Buyurtmani o'chirish</AlertDialogTitle>
              <AlertDialogDescription>
                Buyurtmani o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setOrderToDelete(null);
              }}>
                Bekor qilish
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }} 
                className="bg-red-600 hover:bg-red-700"
              >
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Orders;
