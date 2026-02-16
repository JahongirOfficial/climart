import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Plus, Trash2, AlertTriangle, FileText, Check, FileDown, FilePlus } from "lucide-react";
import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { InventoryModal } from "@/components/InventoryModal";
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

const Inventory = () => {
  const { toast } = useToast();
  const { inventories, loading, refetch, createInventory, confirmInventory, createWriteoff, createReceipt, deleteInventory } = useInventory();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await createInventory(data);
      toast({
        title: "Inventarizatsiya yaratildi",
        description: "Inventarizatsiya muvaffaqiyatli yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Inventarizatsiyani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmInventory(id);
      toast({
        title: "Tasdiqlandi",
        description: "Inventarizatsiya tasdiqlandi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Inventarizatsiyani tasdiqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCreateWriteoff = async (id: string) => {
    try {
      await createWriteoff(id);
      toast({
        title: "Chiqim yaratildi",
        description: "Kamomad uchun chiqim hujjati yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Chiqim hujjatini yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCreateReceipt = async (id: string) => {
    try {
      await createReceipt(id);
      toast({
        title: "Kirim yaratildi",
        description: "Ortiqcha uchun kirim hujjati yaratildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirim hujjatini yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedInventory) return;

    try {
      await deleteInventory(selectedInventory);
      toast({
        title: "O'chirildi",
        description: "Inventarizatsiya muvaffaqiyatli o'chirildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Inventarizatsiyani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedInventory(null);
    }
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

  const stats = {
    total: inventories.length,
    draft: inventories.filter(i => i.status === 'draft').length,
    confirmed: inventories.filter(i => i.status === 'confirmed').length,
    totalShortage: inventories.filter(i => i.status === 'confirmed').reduce((sum, i) => sum + i.shortageAmount, 0),
    totalSurplus: inventories.filter(i => i.status === 'confirmed').reduce((sum, i) => sum + i.surplusAmount, 0),
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventarizatsiya (Инвентаризация)</h1>
            <p className="text-muted-foreground mt-1">
              Ombordagi mahsulotlarning haqiqiy miqdorini tizim qoldig'i bilan solishtiring
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Inventarizatsiya
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami</p>
                <p className="text-2xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qoralama</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{stats.draft}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kamomad</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(stats.totalShortage)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortiqcha</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  {new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(stats.totalSurplus)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <FilePlus className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                  <th className="text-left p-4 font-medium">Ombor</th>
                  <th className="text-center p-4 font-medium">Mahsulotlar</th>
                  <th className="text-right p-4 font-medium">Kamomad</th>
                  <th className="text-right p-4 font-medium">Ortiqcha</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {inventories.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ClipboardCheck className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Inventarizatsiyalar topilmadi</p>
                        <p className="text-sm mt-2">Yangi inventarizatsiya yaratish uchun yuqoridagi tugmani bosing</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventories.map((inventory) => (
                    <tr key={inventory._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{inventory.inventoryNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(inventory.inventoryDate), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{inventory.warehouseName}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-sm">{inventory.items.length} ta</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm text-red-600 font-medium">
                          {inventory.totalShortage > 0 && (
                            <>
                              {inventory.totalShortage} dona
                              <div className="text-xs">
                                {new Intl.NumberFormat('uz-UZ').format(inventory.shortageAmount)} so'm
                              </div>
                            </>
                          )}
                          {inventory.totalShortage === 0 && '-'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm text-green-600 font-medium">
                          {inventory.totalSurplus > 0 && (
                            <>
                              {inventory.totalSurplus} dona
                              <div className="text-xs">
                                {new Intl.NumberFormat('uz-UZ').format(inventory.surplusAmount)} so'm
                              </div>
                            </>
                          )}
                          {inventory.totalSurplus === 0 && '-'}
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(inventory.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {inventory.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirm(inventory._id)}
                                title="Tasdiqlash"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInventory(inventory._id);
                                  setDeleteDialogOpen(true);
                                }}
                                title="O'chirish"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {inventory.status === 'confirmed' && (
                            <>
                              {inventory.totalShortage > 0 && !inventory.writeoffCreated && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateWriteoff(inventory._id)}
                                  title="Chiqim yaratish"
                                >
                                  <FileDown className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                              {inventory.totalSurplus > 0 && !inventory.receiptCreated && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateReceipt(inventory._id)}
                                  title="Kirim yaratish"
                                >
                                  <FilePlus className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </>
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
            <AlertDialogTitle>Inventarizatsiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu inventarizatsiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
      <InventoryModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreate}
      />
    </Layout>
  );
};

export default Inventory;
