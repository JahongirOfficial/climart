import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Trash2, AlertTriangle, ArrowRightLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInternalOrders } from "@/hooks/useInternalOrders";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const InternalOrder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { orders, loading, refetch, updateStatus, createTransfer, deleteOrder } = useInternalOrders();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Detail sahifaga o'tish
  const handleView = (orderId: string) => {
    storeDocumentIds('warehouse-internal-orders', orders.map(o => o._id));
    navigate(`/warehouse/internal-order/${orderId}`);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status });
      toast({
        title: "Status o'zgartirildi",
        description: `Buyurtma ${getStatusLabel(status)} holatiga o'tkazildi`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Statusni o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCreateTransfer = async (id: string) => {
    try {
      await createTransfer(id);
      toast({
        title: "Ko'chirish yaratildi",
        description: "Buyurtma asosida ko'chirish hujjati yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ko'chirish hujjatini yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      await deleteOrder(selectedOrder);
      toast({
        title: "O'chirildi",
        description: "Ichki buyurtma muvaffaqiyatli o'chirildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ichki buyurtmani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "Yangi",
      approved: "Tasdiqlangan",
      partial: "Qisman bajarildi",
      completed: "Bajarildi",
      cancelled: "Bekor qilindi"
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Bajarildi</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Tasdiqlangan</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Qisman</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Bekor qilindi</Badge>;
      default:
        return <Badge variant="outline">Yangi</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    approved: orders.filter(o => o.status === 'approved').length,
    partial: orders.filter(o => o.status === 'partial').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ichki buyurtmalar (Внутренние заказы)</h1>
            <p className="text-muted-foreground mt-1">
              Filiallar uchun mahsulot so'rovlarini boshqaring
            </p>
          </div>
          <Button onClick={() => navigate('/warehouse/internal-order/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Ichki buyurtma
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yangi</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{stats.new}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasdiqlangan</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qisman</p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.partial}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bajarildi</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">№</th>
                  <th className="text-left p-4 font-medium">Sana</th>
                  <th className="text-left p-4 font-medium">Qayerdan</th>
                  <th className="text-left p-4 font-medium">Qayerga</th>
                  <th className="text-right p-4 font-medium">Summa</th>
                  <th className="text-center p-4 font-medium">Bajarildi</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ichki buyurtmalar topilmadi</p>
                        <p className="text-sm mt-2">Yangi buyurtma yaratish uchun yuqoridagi tugmani bosing</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <button
                            className="text-blue-600 hover:underline font-medium"
                            onClick={() => handleView(order._id)}
                          >
                            {order.orderNumber}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(order.orderDate), 'dd.MM.yyyy')}
                        </div>
                        {order.expectedDate && (
                          <div className="text-xs text-muted-foreground">
                            Kutilmoqda: {format(new Date(order.expectedDate), 'dd.MM.yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{order.sourceWarehouseName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{order.destinationWarehouseName}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} ta mahsulot
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-sm font-medium">{order.fulfillmentPercentage}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${order.fulfillmentPercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(order.status)}
                          {getStatusBadge(order.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusChange(order._id, value)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">Yangi</SelectItem>
                                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                                  <SelectItem value="partial">Qisman</SelectItem>
                                  <SelectItem value="completed">Bajarildi</SelectItem>
                                  <SelectItem value="cancelled">Bekor qilish</SelectItem>
                                </SelectContent>
                              </Select>
                              {!order.transferCreated && order.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateTransfer(order._id)}
                                  title="Ko'chirish yaratish"
                                >
                                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                            </>
                          )}
                          {order.status === 'new' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order._id);
                                setDeleteDialogOpen(true);
                              }}
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ichki buyurtmani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu buyurtmani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
};

export default InternalOrder;
