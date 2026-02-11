import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Package, Edit, Trash2, MapPin, User, Phone } from "lucide-react";
import { useState } from "react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { WarehouseModal } from "@/components/WarehouseModal";
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

interface WarehouseType {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number;
  isActive: boolean;
  notes?: string;
}

const Warehouses = () => {
  const { warehouses, loading, deleteWarehouse, refetch } = useWarehouses();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseType | null>(null);

  const handleEdit = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      await deleteWarehouse(warehouseToDelete._id);

      toast({
        title: "Muvaffaqiyatli",
        description: "Ombor o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Omborni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const confirmDelete = (warehouse: WarehouseType) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Omborlar</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Saqlash nuqtalarini boshqaring
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedWarehouse(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yangi ombor
          </Button>
        </div>

        {warehouses.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Hozircha omborlar yo'q</p>
            <Button
              onClick={() => {
                setSelectedWarehouse(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Birinchi omborni qo'shish
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(warehouses as WarehouseType[]).map((warehouse) => (
              <Card key={warehouse._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                      <p className="text-sm text-gray-600">{warehouse.code}</p>
                    </div>
                  </div>
                  <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                    {warehouse.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{warehouse.address}</span>
                  </div>

                  {warehouse.contactPerson && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>{warehouse.contactPerson}</span>
                    </div>
                  )}

                  {warehouse.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{warehouse.phone}</span>
                    </div>
                  )}

                  {warehouse.capacity && (
                    <div className="text-gray-600">
                      Sig'im: {warehouse.capacity} m²
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(warehouse)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Tahrirlash
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDelete(warehouse)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <WarehouseModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedWarehouse(null);
          }}
          warehouse={selectedWarehouse}
          onSuccess={refetch}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Omborni o'chirish</AlertDialogTitle>
              <AlertDialogDescription>
                Haqiqatan ham bu omborni o'chirmoqchimisiz? Bu amalni bekor
                qilib bo'lmaydi.
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
      </div>
    </Layout>
  );
};

export default Warehouses;
