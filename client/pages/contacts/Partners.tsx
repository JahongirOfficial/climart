import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Users, TrendingUp, TrendingDown,
  Edit, Trash2, FileDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { usePartners } from "@/hooks/usePartners";
import { PartnerModal } from "@/components/PartnerModal";
import { PartnerExportModal } from "@/components/PartnerExportModal";
import { PartnerWithStats } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

const Partners = () => {
  const { partners, loading, refetch, deletePartner } = usePartners();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithStats | undefined>();

  const filteredPartners = partners.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || p.type === typeFilter || p.type === "both";
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const customers = partners.filter(p => p.type === 'customer' || p.type === 'both');
  const suppliers = partners.filter(p => p.type === 'supplier' || p.type === 'both');
  const debtors = partners.filter(p => p.balance > 0);
  const creditors = partners.filter(p => p.balance < 0);

  const totalDebt = debtors.reduce((sum, p) => sum + p.balance, 0);
  const totalCredit = Math.abs(creditors.reduce((sum, p) => sum + p.balance, 0));

  const handleEdit = (partner: PartnerWithStats) => {
    setSelectedPartner(partner);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} kontragentini o'chirmoqchimisiz?`)) return;

    try {
      await deletePartner(id);
      toast({
        title: "Kontragent o'chirildi",
        description: "Ma'lumotlar muvaffaqiyatli o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kontragentni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPartner(undefined);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      new: { label: "Yangi", className: "bg-blue-100 text-blue-800" },
      active: { label: "Faol", className: "bg-green-100 text-green-800" },
      vip: { label: "VIP", className: "bg-purple-100 text-purple-800" },
      inactive: { label: "Nofaol", className: "bg-gray-100 text-gray-800" },
      blocked: { label: "Bloklangan", className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      customer: { label: "Mijoz", className: "bg-blue-100 text-blue-800" },
      supplier: { label: "Yetkazib beruvchi", className: "bg-green-100 text-green-800" },
      both: { label: "Ikkalasi", className: "bg-purple-100 text-purple-800" },
    };

    const variant = variants[type];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
            <div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-32" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Card key={i} className="p-4"><Skeleton className="h-4 w-28 mb-2" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20 mt-1" /></Card>)}
          </div>
          <Card>
            <div className="p-4 border-b"><Skeleton className="h-10 w-full" /></div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 ml-auto" />
              </div>
            ))}
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hamkorlar</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Mijozlar va yetkazib beruvchilarni boshqaring</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              Eksport
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yangi kontragent
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mijozlar</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{customers.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yetkazib beruvchilar</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{suppliers.length}</p>
              </div>
              <Users className="h-10 w-10 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qarzdorlar</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDebt)}</p>
                <p className="text-xs text-gray-500 mt-1">{debtors.length} ta hamkor</p>
              </div>
              <TrendingUp className="h-10 w-10 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kreditorlar</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(totalCredit)}</p>
                <p className="text-xs text-gray-500 mt-1">{creditors.length} ta hamkor</p>
              </div>
              <TrendingDown className="h-10 w-10 text-orange-600" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nomi, telefon yoki kod bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="customer">Mijozlar</SelectItem>
                <SelectItem value="supplier">Yetkazib beruvchilar</SelectItem>
                <SelectItem value="both">Ikkalasi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="new">Yangi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="blocked">Bloklangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balans</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jami sotuvlar</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Kontragentlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => (
                    <tr key={partner._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-600">{partner.code}</td>
                      <td className="px-4 py-4 wrap-text">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                          {partner.group && (
                            <p className="text-xs text-gray-500">{partner.group}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{getTypeBadge(partner.type)}</td>
                      <td className="px-4 py-4 text-sm">{getStatusBadge(partner.status)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{partner.phone || '-'}</td>
                      <td className="px-4 py-4 text-sm text-right">
                        <span className={`font-medium ${partner.balance > 0 ? 'text-red-600' :
                          partner.balance < 0 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                          {formatCurrency(partner.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-600">
                        {formatCurrency(partner.totalSales)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(partner._id, partner.name)}
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

        <PartnerModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          partner={selectedPartner}
        />

        <PartnerExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          partners={filteredPartners}
        />
      </div>
    </Layout>
  );
};

export default Partners;
