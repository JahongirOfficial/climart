import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Wallet,
  Building2,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { usePartners } from "@/hooks/usePartners";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { ImportPaymentsModal } from "@/components/ImportPaymentsModal";
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

const Payments = () => {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'incoming' | 'outgoing' | 'transfer'>('incoming');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { payments, totals, loading, refetch } = usePayments({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    account: accountFilter !== "all" ? accountFilter as any : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    partner: partnerFilter || undefined,
  });

  const { partners } = usePartners();

  const filteredPayments = payments.filter(payment =>
    payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/payments/${selectedPayment}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete payment');

      toast({
        title: "To'lov o'chirildi",
        description: "To'lov muvaffaqiyatli o'chirildi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lovni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}/confirm`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to confirm payment');

      toast({
        title: "To'lov tasdiqlandi",
        description: "To'lov muvaffaqiyatli tasdiqlandi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lovni tasdiqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to cancel payment');

      toast({
        title: "To'lov bekor qilindi",
        description: "To'lov muvaffaqiyatli bekor qilindi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lovni bekor qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleCreatePayment = async (data: any) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create payment');

      toast({
        title: "To'lov yaratildi",
        description: "To'lov muvaffaqiyatli yaratildi",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lovni yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'outgoing':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'incoming':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Kirim</Badge>;
      case 'outgoing':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Chiqim</Badge>;
      case 'transfer':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">O'tkazma</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Tasdiqlangan</Badge>;
      case 'draft':
        return <Badge variant="outline">Qoralama</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Bekor qilingan</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
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
            <h1 className="text-3xl font-bold">To'lovlar</h1>
            <p className="text-muted-foreground mt-1">
              Kiruvchi va chiquvchi to'lovlarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              setCreateModalType('incoming');
              setCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Kirim
            </Button>
            <Button variant="outline" onClick={() => {
              setCreateModalType('outgoing');
              setCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Chiqim
            </Button>
            <Button variant="outline" onClick={() => {
              setCreateModalType('transfer');
              setCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              O'tkazma
            </Button>
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kassa</p>
                <p className="text-2xl font-bold mt-2">
                  {totals.cashBalance.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank</p>
                <p className="text-2xl font-bold mt-2">
                  {totals.bankBalance.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Kirim</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  {totals.incoming.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <ArrowDownCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Chiqim</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {totals.outgoing.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <ArrowUpCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            />

            <Input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="incoming">Kirim</SelectItem>
                <SelectItem value="outgoing">Chiqim</SelectItem>
                <SelectItem value="transfer">O'tkazma</SelectItem>
              </SelectContent>
            </Select>

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Hisob" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha hisoblar</SelectItem>
                <SelectItem value="cash">Kassa</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="confirmed">Tasdiqlangan</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="text-left p-4 font-medium">Turi</th>
                  <th className="text-left p-4 font-medium">Kontragent</th>
                  <th className="text-left p-4 font-medium">Maqsad</th>
                  <th className="text-center p-4 font-medium">Hisob</th>
                  <th className="text-right p-4 font-medium">Summa</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">To'lovlar topilmadi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(payment.type)}
                          <span className="font-medium">{payment.paymentNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(payment.paymentDate), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="p-4">{getTypeBadge(payment.type)}</td>
                      <td className="p-4">
                        <div className="font-medium">{payment.partnerName || '-'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm max-w-xs truncate">{payment.purpose}</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline">
                          {payment.account === 'cash' ? 'Kassa' : 'Bank'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-medium ${
                          payment.type === 'incoming' ? 'text-green-600' : 
                          payment.type === 'outgoing' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {payment.type === 'incoming' && '+'}
                          {payment.type === 'outgoing' && '-'}
                          {payment.amount.toLocaleString()} so'm
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(payment.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {payment.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirm(payment._id)}
                              title="Tasdiqlash"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {payment.status === 'confirmed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(payment._id)}
                              title="Bekor qilish"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment._id);
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
            <AlertDialogTitle>To'lovni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu to'lovni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

      {/* Create Payment Modal */}
      <CreatePaymentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreatePayment}
        type={createModalType}
      />

      {/* Import Payments Modal */}
      <ImportPaymentsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </Layout>
  );
};

export default Payments;
