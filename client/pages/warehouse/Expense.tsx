import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Plus, Trash2, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWarehouseExpense } from "@/hooks/useWarehouseExpense";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { format } from "date-fns";
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

const Expense = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { expenses, summary, loading, refetch, deleteExpense } = useWarehouseExpense();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  // Detail sahifaga o'tish
  const handleView = (expenseId: string) => {
    storeDocumentIds('warehouse-expenses', expenses.map(e => e._id));
    navigate(`/warehouse/expense/${expenseId}`);
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      await deleteExpense(selectedExpense);
      toast({
        title: "O'chirildi",
        description: "Xarajat muvaffaqiyatli o'chirildi",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xarajatni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      rent: "Ijara",
      utilities: "Kommunal",
      maintenance: "Ta'mirlash",
      salaries: "Ish haqi",
      equipment: "Jihozlar",
      other: "Boshqa"
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      rent: "bg-purple-100 text-purple-800 border-purple-200",
      utilities: "bg-blue-100 text-blue-800 border-blue-200",
      maintenance: "bg-orange-100 text-orange-800 border-orange-200",
      salaries: "bg-green-100 text-green-800 border-green-200",
      equipment: "bg-indigo-100 text-indigo-800 border-indigo-200",
      other: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[category] || colors.other;
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

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ombor xarajatlari (Расходы склада)</h1>
            <p className="text-muted-foreground mt-1">
              Ombor bilan bog'liq barcha xarajatlarni boshqaring
            </p>
          </div>
          <Button onClick={() => navigate('/warehouse/expense/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Xarajat qo'shish
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami xarajatlar</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {new Intl.NumberFormat('uz-UZ').format(summary?.totalAmount || 0)} so'm
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Xarajatlar soni</p>
                <p className="text-2xl font-bold mt-2">{expenses.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategoriyalar</p>
                <p className="text-2xl font-bold mt-2">{summary?.byCategory?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Category Summary */}
        {summary?.byCategory && summary.byCategory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Kategoriyalar bo'yicha</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {summary.byCategory.map((cat) => (
                <div key={cat.category} className="text-center">
                  <Badge className={getCategoryColor(cat.category)}>
                    {getCategoryLabel(cat.category)}
                  </Badge>
                  <p className="text-sm font-medium mt-2">
                    {new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(cat.total)} so'm
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Sana</th>
                  <th className="text-left p-4 font-medium">Ombor</th>
                  <th className="text-left p-4 font-medium">Kategoriya</th>
                  <th className="text-right p-4 font-medium">Summa</th>
                  <th className="text-left p-4 font-medium">Izoh</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Xarajatlar topilmadi</p>
                        <p className="text-sm mt-2">Yangi xarajat qo'shish uchun yuqoridagi tugmani bosing</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <button
                          className="text-blue-600 hover:underline font-medium text-sm"
                          onClick={() => handleView(expense._id)}
                        >
                          {format(new Date(expense.expenseDate), 'dd.MM.yyyy')}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{expense.warehouseName}</div>
                      </td>
                      <td className="p-4">
                        <Badge className={getCategoryColor(expense.category)}>
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium text-red-600">
                          {new Intl.NumberFormat('uz-UZ').format(expense.amount)} so'm
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {expense.description || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense._id);
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
            <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu xarajatni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

export default Expense;
