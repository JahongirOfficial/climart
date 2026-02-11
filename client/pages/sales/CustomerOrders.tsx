import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search, Plus, Eye, Edit, Trash2, CheckCircle, Clock, XCircle, Loader2, Truck, Lock, Unlock
} from "lucide-react";
import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { CustomerOrderModal } from "@/components/CustomerOrderModal";
import { ShipmentModal } from "@/components/ShipmentModal";
import { useShipments } from "@/hooks/useShipments";
import { CustomerOrder } from "@shared/api";

const CustomerOrders = () => {
  const { orders, loading, error, refetch, createOrder, updateOrder, updateStatus, deleteOrder } = useCustomerOrders();
  const { createShipment } = useShipments();
  const { showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'fulfilled': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': "Kutilmoqda",
      'confirmed': "Tasdiqlandi",
      'shipped': "Jo'natildi",
      'fulfilled': "Bajarildi",
      'cancelled': "Bekor qilindi"
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'fulfilled') return <CheckCircle className="h-4 w-4" />;
    if (status === 'cancelled') return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate KPIs
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const fulfilledCount = orders.filter(o => o.status === 'fulfilled').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleCreate = () => {
    setSelectedOrder(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (isEditMode && selectedOrder) {
        await updateOrder(selectedOrder._id, data);
      } else {
        await createOrder(data);
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Buyurtmani o'chirishni xohlaysizmi?")) {
      try {
        await deleteOrder(id);
        refetch();
      } catch (error) {
        showError('Xatolik yuz berdi');
      }
    }
  };

  const handleStatusChange = async (order: CustomerOrder, newStatus: string) => {
    try {
      await updateStatus(order._id, newStatus);
      refetch();
    } catch (error) {
      showError('Xatolik yuz berdi');
    }
  };

  const handleReserve = async (orderId: string) => {
    try {
      const response = await fetch(`/api/customer-orders/${orderId}/reserve`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      
      const result = await response.json();
      
      // Check for warnings about insufficient inventory
      if (result.warnings && result.warnings.length > 0) {
        const warningMessage = "⚠️ Ogohlantirish: Ba'zi mahsulotlar yetarli emas:\n\n" + 
          result.warnings.map((w: string) => `• ${w}`).join('\n') +
          "\n\nBuyurtma rezerv qilindi, lekin inventar minusga tushdi.";
        setTimeout(() => alert(warningMessage), 100);
      }
      
      refetch();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleUnreserve = async (orderId: string) => {
    if (window.confirm("Rezervni bekor qilishni xohlaysizmi?")) {
      try {
        const response = await fetch(`/api/customer-orders/${orderId}/unreserve`, {
          method: 'PATCH',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
        refetch();
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  const handleCreateShipment = (orderId: string) => {
    setSelectedOrderForShipment(orderId);
    setIsShipmentModalOpen(true);
  };

  const handleSaveShipment = async (data: any) => {
    try {
      await createShipment(data);
      setIsShipmentModalOpen(false);
      setSelectedOrderForShipment(undefined);
      refetch();
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mijozlar buyurtmalari</h1>
            <p className="text-gray-600 mt-1">Mijozlardan kelgan buyurtmalarni boshqaring</p>
          </div>
          <Button onClick={handleCreate} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Yangi buyurtma
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kutilmoqda</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bajarildi</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{fulfilledCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bekor qilindi</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{cancelledCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami summa</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buyurtma raqami yoki mijoz nomi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtma №</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yetkazish</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'landi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jo'natildi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Buyurtmalar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const paidPercent = (order.paidAmount / order.totalAmount) * 100;
                    const shippedPercent = (order.shippedAmount / order.totalAmount) * 100;

                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(order.orderDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(order.deliveryDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{paidPercent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${paidPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{shippedPercent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${shippedPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                          {order.reserved && (
                            <Lock className="h-3 w-3 text-orange-600 inline ml-1" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!order.reserved && order.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReserve(order._id)}
                                className="text-orange-600"
                                title="Rezerv qilish"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                            {order.reserved && order.status !== 'fulfilled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnreserve(order._id)}
                                className="text-gray-600"
                                title="Rezervni bekor qilish"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCreateShipment(order._id)}
                                className="text-blue-600"
                                title="Yetkazib berish yaratish"
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(order, 'fulfilled')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(order._id)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <CustomerOrderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        order={isEditMode ? selectedOrder : null}
      />

      <ShipmentModal
        open={isShipmentModalOpen}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setSelectedOrderForShipment(undefined);
        }}
        onSave={handleSaveShipment}
        orderId={selectedOrderForShipment}
      />
    </Layout>
  );
};

export default CustomerOrders;
