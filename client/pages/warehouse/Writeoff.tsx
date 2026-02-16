import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Check, AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";
import { useWriteoffs } from "@/hooks/useWriteoffs";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { WriteoffModal } from "@/components/WriteoffModal";
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

const Writeoff = () => {
  const { toast } = useToast();
  const { writeoffs, loading, refetch, createWriteoff, confirmWriteoff, deleteWriteoff } = useWriteoffs();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWriteoff, setSelectedWriteoff] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await createWriteoff(data);
      toast({
        title: "Hisobdan chiqarish yaratildi",
        description: "Hisobdan chiqarish muvaffaqiyatli yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Hisobdan chiqarishni yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmWriteoff(id);
      toast({
        title: "Tasdiqlandi",
        description: "Hisobdan chiqarish tasdiqlandi va mahsulotlar ombor qoldig'idan kamaydi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Hisobdan chiqarishni tasdiqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedWriteoff) return;

    try {
      await deleteWriteoff(selectedWriteoff);
      toast({
        title: "O'chirildi",
        description: "Hisobdan chiqarish muvaffaqiyatli o'chirildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Hisobdan chiqarishni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedWriteoff(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      damaged: "Shikastlangan",
      expired: "Muddati tugagan",
      lost: "Yo'qolgan",
      personal_use: "Shaxsiy ehtiyoj",
      inventory_shortage: "Inventarizatsiya",
      other: "Boshqa"
    };
    return labels[reason] || reason;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Tasdiqlangan</Badge>;
    }
    return <Badge variant="outline">Qoralama</Badge>;
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

  const totalLoss = writeoffs
    .filter(w => w.status === 'confirmed')
    .reduce((sum, w) => sum + w.totalAmount, 0);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chiqim qilish (Списания)</h1>
            <p className="text-muted-foreground mt-1">
              Zarar ko'rgan yoki eskirgan mahsulotlarni hisobdan chiqaring
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Chiqim qilish
          </Button>
        </div>

        {/* KPI Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jami zarar (tasdiqlangan)</p>
              <p className="text-2xl font-bold mt-2 text-red-600">
                {totalLoss.toLocaleString()} so'm
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">№</th>
                  <th className="text-left p-4 font-medium">Sana</th>
                  <th className="text-left p-4 font-medium">Ombor</th>
                  <th className="text-left p-4 font-medium">Sabab</th>
                  <th className="text-center p-4 font-medium">Mahsulotlar</th>
                  <th className="text-right p-4 font-medium">Summa</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {writeoffs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Hisobdan chiqarishlar topilmadi</p>
                        <p className="text-sm mt-2">Yangi hisobdan chiqarish yaratish uchun yuqoridagi tugmani bosing</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  writeoffs.map((writeoff) => (
                    <tr key={writeoff._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{writeoff.writeoffNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(writeoff.writeoffDate), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{writeoff.warehouseName}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{getReasonLabel(writeoff.reason)}</Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-sm">
                          {writeoff.items.length} ta mahsulot
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {writeoff.items.reduce((sum, item) => sum + item.quantity, 0)} dona
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium text-red-600">
                          {writeoff.totalAmount.toLocaleString()} so'm
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(writeoff.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {writeoff.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirm(writeoff._id)}
                              title="Tasdiqlash"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWriteoff(writeoff._id);
                              setDeleteDialogOpen(true);
                            }}
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
            <AlertDialogTitle>Hisobdan chiqarishni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu hisobdan chiqarishni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
      <WriteoffModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreate}
      />
    </Layout>
  );
};

export default Writeoff;
