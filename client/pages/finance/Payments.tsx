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
  Trash2,
  Check,
  X,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { useState, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { usePayments } from "@/hooks/usePayments";
import { api } from "@/lib/api";
import { usePartners } from "@/hooks/usePartners";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ImportPaymentsModal } from "@/components/ImportPaymentsModal";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
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
import { ExportButton } from "@/components/ExportButton";

// Jadval qatori komponenti - memo bilan optimizatsiya
const PaymentRow = memo(({
  payment,
  onConfirm,
  onCancel,
  onDelete,
  onView,
  getTypeIcon,
  getTypeBadge,
  getStatusBadge
}: any) => {
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {getTypeIcon(payment.type)}
          <button
            className="font-medium text-sm whitespace-nowrap text-blue-600 hover:text-blue-800 hover:underline"
            onClick={() => onView(payment._id)}
          >
            {payment.paymentNumber}
          </button>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm">
        {format(new Date(payment.paymentDate), 'dd.MM.yyyy')}
      </td>
      <td className="px-3 py-2">{getTypeBadge(payment.type)}</td>
      <td className="px-3 py-2">
        <div className="font-medium text-sm max-w-[120px] truncate">{payment.partnerName || '-'}</div>
      </td>
      <td className="px-3 py-2">
        <div className="text-sm max-w-[130px] truncate">{payment.purpose}</div>
      </td>
      <td className="px-3 py-2">
        <div className="text-sm max-w-[100px] truncate">
          {payment.type === 'transfer' ? (
            <span>{payment.fromAccount === 'cash' ? 'Kassa' : 'Bank'} → {payment.toAccount === 'cash' ? 'Kassa' : 'Bank'}</span>
          ) : (
            <span>{payment.paymentMethod === 'cash' ? 'Naqd' : payment.paymentMethod === 'card' ? 'Karta' : payment.paymentMethod === 'click' ? 'Click' : 'Bank'}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <Badge variant="outline" className="text-xs">
          {payment.account === 'cash' ? 'Kassa' : 'Bank'}
        </Badge>
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <span className={`font-medium text-sm ${
          payment.type === 'incoming' ? 'text-green-600' :
          payment.type === 'outgoing' ? 'text-red-600' :
          'text-blue-600'
        }`}>
          {payment.type === 'incoming' && '+'}
          {payment.type === 'outgoing' && '-'}
          {payment.amount.toLocaleString()} so'm
        </span>
      </td>
      <td className="px-3 py-2 text-center">{getStatusBadge(payment.status)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          {payment.status === 'draft' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConfirm(payment._id)} title="Tasdiqlash">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
          )}
          {payment.status === 'confirmed' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCancel(payment._id)} title="Bekor qilish">
              <X className="h-3.5 w-3.5 text-red-600" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(payment._id)} title="O'chirish">
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

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
  const debouncedSearch = useDebounce(searchTerm, 500);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Faqat sana filtri bilan API chaqiramiz
  const { payments, totals, loading, refetch } = usePayments({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  });

  const { partners } = usePartners();

  // Client-side filterlash - sahifa qayta render bo'lmaydi
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Search filter
      const matchesSearch = debouncedSearch === "" ||
        payment.paymentNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        payment.partnerName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        payment.purpose.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Type filter
      const matchesType = typeFilter === "all" || payment.type === typeFilter;

      // Account filter
      const matchesAccount = accountFilter === "all" || payment.account === accountFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

      // Partner filter
      const matchesPartner = partnerFilter === "" || payment.partnerName?.toLowerCase().includes(partnerFilter.toLowerCase());

      return matchesSearch && matchesType && matchesAccount && matchesStatus && matchesPartner;
    });
  }, [payments, debouncedSearch, typeFilter, accountFilter, statusFilter, partnerFilter]);

  const handleDelete = useCallback(async () => {
    if (!selectedPayment) return;

    try {
      await api.delete(`/api/payments/${selectedPayment}`);

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
  }, [selectedPayment, toast, refetch]);

  const handleConfirm = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/payments/${id}/confirm`);

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
  }, [toast, refetch]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/payments/${id}/cancel`);

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
  }, [toast, refetch]);

  const handleViewPayment = useCallback((id: string) => {
    storeDocumentIds('payments', payments.map(p => p._id));
    navigate(`/finance/payments/${id}`);
  }, [payments, navigate]);

  const getTypeIcon = useCallback((type: string) => {
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
  }, []);

  const getTypeBadge = useCallback((type: string) => {
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
  }, []);

  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6 max-w-[1920px] mx-auto">
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
      <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">To'lovlar</h1>
            <p className="text-muted-foreground mt-1">
              Kiruvchi va chiquvchi to'lovlarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/finance/payments/new?type=incoming')}>
              <Plus className="h-4 w-4 mr-2" />
              Kirim
            </Button>
            <Button variant="outline" onClick={() => navigate('/finance/payments/new?type=outgoing')}>
              <Plus className="h-4 w-4 mr-2" />
              Chiqim
            </Button>
            <Button variant="outline" onClick={() => navigate('/finance/payments/new?type=transfer')}>
              <Plus className="h-4 w-4 mr-2" />
              O'tkazma
            </Button>
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredPayments}
              filename="tolovlar"
              fieldsToInclude={["paymentNumber", "paymentDate", "type", "partnerName", "purpose", "account", "amount", "status"]}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Kassa</p>
                <p className="text-xl font-bold mt-1">
                  {totals.cashBalance.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Bank</p>
                <p className="text-xl font-bold mt-1">
                  {totals.bankBalance.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Jami Kirim</p>
                <p className="text-xl font-bold mt-1 text-green-600">
                  {totals.incoming.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Jami Chiqim</p>
                <p className="text-xl font-bold mt-1 text-red-600">
                  {totals.outgoing.toLocaleString()} so'm
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
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
                  <th className="text-left px-3 py-2 font-medium text-sm whitespace-nowrap">№</th>
                  <th className="text-left px-3 py-2 font-medium text-sm whitespace-nowrap">Sana</th>
                  <th className="text-left px-3 py-2 font-medium text-sm">Turi</th>
                  <th className="text-left px-3 py-2 font-medium text-sm">Kontragent</th>
                  <th className="text-left px-3 py-2 font-medium text-sm">Maqsad</th>
                  <th className="text-left px-3 py-2 font-medium text-sm">Manba</th>
                  <th className="text-center px-3 py-2 font-medium text-sm">Hisob</th>
                  <th className="text-right px-3 py-2 font-medium text-sm whitespace-nowrap">Summa</th>
                  <th className="text-center px-3 py-2 font-medium text-sm">Holat</th>
                  <th className="text-center px-3 py-2 font-medium text-sm">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">To'lovlar topilmadi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <PaymentRow
                      key={payment._id}
                      payment={payment}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      onDelete={(id: string) => {
                        setSelectedPayment(id);
                        setDeleteDialogOpen(true);
                      }}
                      onView={handleViewPayment}
                      getTypeIcon={getTypeIcon}
                      getTypeBadge={getTypeBadge}
                      getStatusBadge={getStatusBadge}
                    />
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
