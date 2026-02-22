import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Loader2, FileText, AlertTriangle,
  Trash2, Star, XCircle, Download
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContracts } from "@/hooks/useContracts";
import { Contract } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";

const Contracts = () => {
  const { contracts, loading, refetch, setAsDefault, cancelContract, deleteContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredContracts = contracts.filter(c => {
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeContracts = contracts.filter(c => c.status === 'active');
  const expiredContracts = contracts.filter(c => c.status === 'expired');
  const expiringContracts = contracts.filter(c => {
    if (c.status !== 'active') return false;
    const daysUntilExpiry = Math.ceil((new Date(c.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const handleView = (contract: Contract) => {
    storeDocumentIds('contracts', filteredContracts.map(c => c._id));
    navigate(`/contacts/contracts/${contract._id}`);
  };

  const handleSetDefault = async (id: string, partnerName: string) => {
    try {
      await setAsDefault(id);
      toast({
        title: "Asosiy shartnoma o'zgartirildi",
        description: `${partnerName} uchun asosiy shartnoma belgilandi`,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Shartnomani asosiy qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string, contractNumber: string) => {
    if (!confirm(`${contractNumber} shartnomani bekor qilmoqchimisiz?`)) return;
    
    try {
      await cancelContract(id);
      toast({
        title: "Shartnoma bekor qilindi",
        description: "Shartnoma muvaffaqiyatli bekor qilindi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Shartnomani bekor qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, contractNumber: string) => {
    if (!confirm(`${contractNumber} shartnomani o'chirmoqchimisiz?`)) return;
    
    try {
      await deleteContract(id);
      toast({
        title: "Shartnoma o'chirildi",
        description: "Shartnoma muvaffaqiyatli o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Shartnomani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Faol", className: "bg-green-100 text-green-800" },
      expired: { label: "Muddati tugagan", className: "bg-red-100 text-red-800" },
      cancelled: { label: "Bekor qilingan", className: "bg-gray-100 text-gray-800" },
    };
    
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      UZS: "so'm",
      USD: "$",
      EUR: "€",
      RUB: "₽",
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('uz-UZ').format(amount) + " " + getCurrencySymbol(currency);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shartnomalar</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Kontragentlar bilan tuzilgan shartnomalarni boshqaring</p>
          </div>
          <Button onClick={() => navigate('/contacts/contracts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi shartnoma
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Faol shartnomalar</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{activeContracts.length}</p>
              </div>
              <FileText className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Muddati tugayotgan</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{expiringContracts.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">30 kun ichida</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Muddati tugagan</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{expiredContracts.length}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </Card>
        </div>

        {expiringContracts.length > 0 && (
          <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Diqqat! Muddati tugayotgan shartnomalar</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {expiringContracts.length} ta shartnomaning muddati 30 kun ichida tugaydi. Ularni yangilashni unutmang.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Shartnoma raqami yoki kontragent nomi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="expired">Muddati tugagan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raqam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontragent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boshlanish</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tugash</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valyuta</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Shartnomalar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
                    const isExpiringSoon = contract.status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    
                    return (
                      <tr key={contract._id} className={`hover:bg-gray-50 ${isExpiringSoon ? 'bg-orange-50' : ''}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {contract.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <button
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => handleView(contract)}
                            >
                              {contract.contractNumber}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{contract.partnerName}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(contract.startDate).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div>
                            <p className="text-gray-900">{new Date(contract.endDate).toLocaleDateString('uz-UZ')}</p>
                            {isExpiringSoon && (
                              <p className="text-xs text-orange-600 mt-1">
                                {daysUntilExpiry} kun qoldi
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{contract.currency}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-600">
                          {formatCurrency(contract.totalAmount, contract.currency)}
                        </td>
                        <td className="px-4 py-4 text-sm">{getStatusBadge(contract.status)}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center justify-center gap-1">
                            {!contract.isDefault && contract.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(contract._id, contract.partnerName)}
                                title="Asosiy qilish"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            {contract.fileUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(contract.fileUrl, '_blank')}
                                title="Faylni ko'rish"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {contract.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(contract._id, contract.contractNumber)}
                                title="Bekor qilish"
                              >
                                <XCircle className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(contract._id, contract.contractNumber)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
    </Layout>
  );
};

export default Contracts;
