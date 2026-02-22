import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Check,
  X,
  Trash2,
  Building2,
} from "lucide-react";``
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ExportButton } from "@/components/ExportButton";
import { usePayments } from "@/hooks/usePayments";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback, useState } from "react";
import { format } from "date-fns";
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

const Finance = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const startDate = format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const { payments, totals, loading, refetch } = usePayments({
    startDate,
    endDate,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Oylik grafik ma'lumotlari
  const monthlyData = useMemo(() => {
    const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
    const months: Record<number, { income: number; expense: number }> = {};

    payments.forEach(payment => {
      if (payment.status !== 'confirmed') return;
      const month = new Date(payment.paymentDate).getMonth();
      if (!months[month]) months[month] = { income: 0, expense: 0 };

      if (payment.type === 'incoming') {
        months[month].income += payment.amount;
      } else if (payment.type === 'outgoing') {
        months[month].expense += payment.amount;
      }
    });

    return Object.keys(months)
      .map(Number)
      .sort((a, b) => a - b)
      .map(month => ({
        month: monthNames[month],
        Tushum: months[month].income,
        Xarajat: months[month].expense,
      }));
  }, [payments]);

  // So'nggi 15 ta to'lov
  const recentPayments = useMemo(() => {
    return payments.slice(0, 15);
  }, [payments]);

  // Jami tushum va xarajat (barcha statuslar)
  const totalIncome = totals.incoming;
  const totalExpense = totals.outgoing;
  const netProfit = totalIncome - totalExpense;

  const handleConfirm = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/payments/${id}/confirm`);
      toast({ title: "To'lov tasdiqlandi" });
      refetch();
    } catch {
      toast({ title: "Xatolik", description: "Tasdiqlashda xatolik", variant: "destructive" });
    }
  }, [toast, refetch]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/payments/${id}/cancel`);
      toast({ title: "To'lov bekor qilindi" });
      refetch();
    } catch {
      toast({ title: "Xatolik", description: "Bekor qilishda xatolik", variant: "destructive" });
    }
  }, [toast, refetch]);

  const handleDelete = useCallback(async () => {
    if (!selectedPayment) return;
    try {
      await api.delete(`/api/payments/${selectedPayment}`);
      toast({ title: "To'lov o'chirildi" });
      refetch();
    } catch {
      toast({ title: "Xatolik", description: "O'chirishda xatolik", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  }, [selectedPayment, toast, refetch]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <ArrowDownLeft className="h-3 w-3 text-green-600" />;
      case 'outgoing': return <ArrowUpRight className="h-3 w-3 text-red-600" />;
      case 'transfer': return <ArrowRightLeft className="h-3 w-3 text-blue-600" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'incoming': return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Kirim</Badge>;
      case 'outgoing': return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Chiqim</Badge>;
      case 'transfer': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">O'tkazma</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Tasdiqlangan</Badge>;
      case 'draft': return <Badge variant="outline" className="text-xs">Qoralama</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Bekor</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pul</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Moliyaviy operatsiyalar va balanslarni boshqaring
            </p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kassa balansi
              </span>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totals.cashBalance.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Naqd pul qoldig'i</p>
            </div>
          </div>

          {/* Bank Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bank balansi
              </span>
              <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-md">
                <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totals.bankBalance.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bank hisobidagi qoldiq</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sof daromad
              </span>
              <div className={`p-2 rounded-md ${netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                <TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {netProfit >= 0 ? 'Foydali' : 'Zararli'} ({currentYear}-yil)
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income vs Expense Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Tushum vs Xarajatlar ({currentYear}-yil)
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                      }}
                      formatter={(value: number) => `${value.toLocaleString()} so'm`}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Tushum" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Xarajat" fill="#E74C3C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  Grafik uchun ma'lumot topilmadi
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  So'nggi to'lovlar
                </h3>
                <ExportButton
                  data={recentPayments}
                  filename="moliya-hisoboti"
                  fieldsToInclude={['paymentNumber', 'paymentDate', 'type', 'partnerName', 'purpose', 'amount', 'status']}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        №
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Sana
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Turi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Maqsad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Summa
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Holat
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          To'lovlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              {getTypeIcon(payment.type)}
                              <span className="font-medium whitespace-nowrap">{payment.paymentNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {format(new Date(payment.paymentDate), 'dd.MM.yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getTypeBadge(payment.type)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-[200px] truncate">{payment.purpose}</div>
                            {payment.partnerName && (
                              <div className="text-xs text-gray-500 truncate">{payment.partnerName}</div>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${
                            payment.type === 'incoming' ? 'text-green-600' :
                            payment.type === 'outgoing' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {payment.type === 'incoming' && '+'}
                            {payment.type === 'outgoing' && '-'}
                            {payment.amount.toLocaleString()} so'm
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {payment.status === 'draft' && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleConfirm(payment._id)} title="Tasdiqlash">
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                              )}
                              {payment.status === 'confirmed' && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancel(payment._id)} title="Bekor qilish">
                                  <X className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                setSelectedPayment(payment._id);
                                setDeleteDialogOpen(true);
                              }} title="O'chirish">
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Income Summary */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded-md">
                  <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Jami tushum</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {totalIncome.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {payments.filter(p => p.type === 'incoming').length} ta kirim
              </p>
            </div>

            {/* Expense Summary */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 dark:bg-red-800 p-2 rounded-md">
                  <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Jami xarajat
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600 mb-2">
                {totalExpense.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {payments.filter(p => p.type === 'outgoing').length} ta chiqim
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-4">
                Sof daromad
              </span>
              <p
                className={`text-2xl font-bold mb-2 ${
                  netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {netProfit >= 0 ? "Foydali" : "Zararli"}
              </p>
            </div>
          </div>
        </div>
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
    </Layout>
  );
};

export default Finance;
