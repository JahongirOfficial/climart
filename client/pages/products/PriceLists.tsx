import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Download,
  CheckCircle,
  Archive,
  FileEdit,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { usePriceLists } from "@/hooks/usePriceLists";
import { useToast } from "@/hooks/use-toast";
import { PriceListModal } from "@/components/PriceListModal";
import { format } from "date-fns";
import { ExportButton } from "@/components/ExportButton";
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

const PriceLists = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceListToDelete, setPriceListToDelete] = useState<string | null>(null);

  const { priceLists, loading, refetch } = usePriceLists({
    status: statusFilter !== "all" ? statusFilter : undefined
  });

  const filteredPriceLists = priceLists.filter(pl =>
    pl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pl.priceListNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pl.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedPriceList(null);
    setModalOpen(true);
  };

  const handleEdit = (priceList: any) => {
    setSelectedPriceList(priceList);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      const url = selectedPriceList
        ? `/api/price-lists/${selectedPriceList._id}`
        : '/api/price-lists';
      
      const method = selectedPriceList ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save price list');

      toast({
        title: selectedPriceList ? "Narxlar ro'yxati yangilandi" : "Narxlar ro'yxati yaratildi",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!priceListToDelete) return;

    try {
      const response = await fetch(`/api/price-lists/${priceListToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete price list');

      toast({
        title: "Narxlar ro'yxati o'chirildi",
        description: "Ma'lumotlar muvaffaqiyatli o'chirildi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Narxlar ro'yxatini o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPriceListToDelete(null);
    }
  };

  const handleChangeStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/price-lists/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to change status');

      toast({
        title: "Holat o'zgartirildi",
        description: `Narxlar ro'yxati ${status === 'active' ? 'faollashtirildi' : status === 'archived' ? 'arxivlandi' : 'qoralama qilindi'}`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Holatni o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleApplyPriceList = async (id: string) => {
    try {
      const response = await fetch(`/api/price-lists/${id}/apply`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply price list');
      }

      const result = await response.json();

      toast({
        title: "Narxlar qo'llandi",
        description: `${result.count} ta mahsulot narxi yangilandi`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Narxlarni qo'llashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Faol</Badge>;
      case 'draft':
        return <Badge variant="outline">Qoralama</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Arxivlangan</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Yuklanmoqda...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Narxlar ro'yxati</h1>
            <p className="text-muted-foreground mt-1">
              Mahsulotlar va xizmatlar narxlarini boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={filteredPriceLists}
              filename="narxlar-royxati"
              fieldsToInclude={["number", "name", "status", "validFrom", "validTo"]}
            />
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yangi narxlar ro'yxati
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="archived">Arxivlangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Price Lists Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPriceLists.map((priceList) => (
            <Card key={priceList._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{priceList.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {priceList.priceListNumber}
                  </p>
                  {priceList.organization && (
                    <p className="text-sm text-muted-foreground">
                      {priceList.organization}
                    </p>
                  )}
                </div>
                {getStatusBadge(priceList.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mahsulotlar:</span>
                  <span className="font-medium">{priceList.items.length} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amal qilish:</span>
                  <span className="font-medium">
                    {format(new Date(priceList.validFrom), 'dd.MM.yyyy')}
                  </span>
                </div>
                {priceList.validTo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tugash:</span>
                    <span className="font-medium">
                      {format(new Date(priceList.validTo), 'dd.MM.yyyy')}
                    </span>
                  </div>
                )}
                {priceList.markupPercent !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ustama:</span>
                    <span className="font-medium">{priceList.markupPercent}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(priceList)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Tahrirlash
                </Button>

                {priceList.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus(priceList._id, 'active')}
                    title="Faollashtirish"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}

                {priceList.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPriceList(priceList._id)}
                      title="Narxlarni qo'llash"
                    >
                      <FileEdit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus(priceList._id, 'archived')}
                      title="Arxivlash"
                    >
                      <Archive className="h-4 w-4 text-gray-600" />
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPriceListToDelete(priceList._id);
                    setDeleteDialogOpen(true);
                  }}
                  title="O'chirish"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPriceLists.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Narxlar ro'yxati topilmadi</h3>
              <p className="text-muted-foreground mb-4">
                Yangi narxlar ro'yxati yaratish uchun yuqoridagi tugmani bosing
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Yangi narxlar ro'yxati
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Price List Modal */}
      <PriceListModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPriceList(null);
        }}
        onSave={handleSave}
        priceList={selectedPriceList}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Narxlar ro'yxatini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu narxlar ro'yxatini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

export default PriceLists;
