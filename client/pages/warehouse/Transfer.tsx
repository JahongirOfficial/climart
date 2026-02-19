import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Plus, Trash2, AlertTriangle, FileText, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useWarehouseTransfers } from "@/hooks/useWarehouseTransfers";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { WarehouseTransferModal } from "@/components/WarehouseTransferModal";
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

const Transfer = () => {
  const { toast } = useToast();
  const { transfers, loading, refetch, createTransfer, updateStatus, deleteTransfer } = useWarehouseTransfers();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await createTransfer(data);
      toast({
        title: "Ko'chirish yaratildi",
        description: "Ko'chirish muvaffaqiyatli yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ko'chirishni yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status });
      toast({
        title: "Status o'zgartirildi",
        description: `Ko'chirish ${getStatusLabel(status)} holatiga o'tkazildi`,
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

  const handleDelete = async () => {
    if (!selectedTransfer) return;

    try {
      await deleteTransfer(selectedTransfer);
      toast({
        title: "O'chirildi",
        description: "Ko'chirish muvaffaqiyatli o'chirildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ko'chirishni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTransfer(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Kutilmoqda",
      in_transit: "Yo'lda",
      completed: "Bajarildi",
      cancelled: "Bekor qilindi"
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Bajarildi</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Yo'lda</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Bekor qilindi</Badge>;
      default:
        return <Badge variant="outline">Kutilmoqda</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  if (loading && transfers.length === 0) {
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
    pending: transfers.filter(t => t.status === 'pending').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length,
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ko'chirish (Перемещение)</h1>
            <p className="text-muted-foreground mt-1">
              Mahsulotlarni omborlar o'rtasida ko'chiring
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ko'chirish
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kutilmoqda</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yo'lda</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">{stats.inTransit}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  <th className="text-center p-4 font-medium">Mahsulotlar</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ArrowRightLeft className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ko'chirishlar topilmadi</p>
                        <p className="text-sm mt-2">Yangi ko'chirish yaratish uchun yuqoridagi tugmani bosing</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{transfer.transferNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(transfer.transferDate), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{transfer.sourceWarehouseName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{transfer.destinationWarehouseName}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-sm">
                          {transfer.items.length} ta mahsulot
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transfer.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(transfer.status)}
                          {getStatusBadge(transfer.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {transfer.status !== 'completed' && transfer.status !== 'cancelled' && (
                            <Select
                              value={transfer.status}
                              onValueChange={(value) => handleStatusChange(transfer._id, value)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Kutilmoqda</SelectItem>
                                <SelectItem value="in_transit">Yo'lda</SelectItem>
                                <SelectItem value="completed">Bajarildi</SelectItem>
                                <SelectItem value="cancelled">Bekor qilish</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {transfer.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTransfer(transfer._id);
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
            <AlertDialogTitle>Ko'chirishni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu ko'chirishni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

      {/* Create Modal */}
      <WarehouseTransferModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreate}
      />
    </Layout>
  );
};

export default Transfer;
