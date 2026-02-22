import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Target,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Award,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/api';

interface KPITarget {
  id: string;
  employeeId: string;
  employeeName: string;
  metric: string;
  target: number;
  period: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

const metricLabels: Record<string, string> = {
  sales_amount: "Savdo summasi (so'm)",
  invoice_count: "Fakturalar soni",
  collection_rate: "To'lov yig'ish (%)",
  new_customers: "Yangi mijozlar soni",
};

const KPI = () => {
  const { toast } = useToast();
  const [targets, setTargets] = useState<KPITarget[]>(() => {
    try {
      const saved = localStorage.getItem("kpi_targets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const [newTarget, setNewTarget] = useState({
    employeeId: "",
    metric: "sales_amount",
    target: 0,
    period: "month",
  });

  const { data: employeesData, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees"],
    queryFn: () => api.get<{ employees: Employee[] }>("/api/employees"),
  });

  const { invoices } = useCustomerInvoices();
  const employees = employeesData?.employees?.filter((e) => e.isActive) || [];

  const saveTargets = (newTargets: KPITarget[]) => {
    setTargets(newTargets);
    localStorage.setItem("kpi_targets", JSON.stringify(newTargets));
  };

  const handleAddTarget = () => {
    if (!newTarget.employeeId || !newTarget.target) {
      toast({ title: "Xatolik", description: "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    const emp = employees.find((e) => e._id === newTarget.employeeId);
    const kpi: KPITarget = {
      id: Date.now().toString(),
      employeeId: newTarget.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      metric: newTarget.metric,
      target: newTarget.target,
      period: newTarget.period,
    };
    saveTargets([...targets, kpi]);
    setNewTarget({ employeeId: "", metric: "sales_amount", target: 0, period: "month" });
    setShowAddForm(false);
    toast({ title: "Muvaffaqiyatli", description: "KPI maqsad qo'shildi" });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    saveTargets(targets.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  };

  // Calculate actual performance
  const kpiWithProgress = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (selectedPeriod === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (selectedPeriod === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return targets
      .filter((t) => t.period === selectedPeriod)
      .map((t) => {
        const empInvoices = invoices.filter(
          (inv: any) =>
            inv.createdBy === t.employeeId &&
            new Date(inv.invoiceDate || inv.createdAt) >= startDate
        );

        let actual = 0;
        if (t.metric === "sales_amount") {
          actual = empInvoices.reduce(
            (sum: number, inv: any) => sum + (inv.finalAmount || inv.totalAmount || 0),
            0
          );
        } else if (t.metric === "invoice_count") {
          actual = empInvoices.length;
        } else if (t.metric === "collection_rate") {
          const totalSales = empInvoices.reduce(
            (s: number, inv: any) => s + (inv.finalAmount || inv.totalAmount || 0),
            0
          );
          const totalPaid = empInvoices.reduce(
            (s: number, inv: any) => s + (inv.paidAmount || 0),
            0
          );
          actual = totalSales > 0 ? (totalPaid / totalSales) * 100 : 0;
        }

        const progress = t.target > 0 ? (actual / t.target) * 100 : 0;
        return { ...t, actual, progress: Math.min(progress, 150) };
      });
  }, [targets, invoices, selectedPeriod]);

  const summary = useMemo(() => {
    const total = kpiWithProgress.length;
    const achieved = kpiWithProgress.filter((k) => k.progress >= 100).length;
    const avgProgress =
      total > 0 ? kpiWithProgress.reduce((s, k) => s + k.progress, 0) / total : 0;
    return { total, achieved, avgProgress };
  }, [kpiWithProgress]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  const formatValue = (metric: string, value: number) => {
    if (metric === "sales_amount") return value.toLocaleString("uz-UZ") + " so'm";
    if (metric === "collection_rate") return value.toFixed(0) + "%";
    return String(Math.round(value));
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KPI maqsadlari</h1>
            <p className="text-gray-600 mt-1">
              Xodimlar uchun maqsadlar belgilash va kuzatish
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Maqsad qo'shish
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami KPI lar</p>
                <p className="text-2xl font-bold mt-1">{summary.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bajarildi</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.achieved}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">O'rtacha bajarish</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {summary.avgProgress.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Period Filter */}
        <Card className="p-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Hafta</SelectItem>
              <SelectItem value="month">Oy</SelectItem>
              <SelectItem value="year">Yil</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* KPI Cards */}
        {kpiWithProgress.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            Bu davr uchun KPI maqsadlari yo'q. Yuqoridagi tugma orqali qo'shing.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiWithProgress.map((kpi) => (
              <Card key={kpi.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{kpi.employeeName}</p>
                    <p className="text-sm text-gray-500">{metricLabels[kpi.metric]}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500"
                    onClick={() => setDeleteId(kpi.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Haqiqiy: {formatValue(kpi.metric, kpi.actual)}
                    </span>
                    <span className="font-medium">
                      Maqsad: {formatValue(kpi.metric, kpi.target)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        kpi.progress >= 100
                          ? "bg-green-500"
                          : kpi.progress >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                    />
                  </div>
                  <p
                    className={`text-right text-sm font-semibold ${
                      kpi.progress >= 100
                        ? "text-green-600"
                        : kpi.progress >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {kpi.progress.toFixed(0)}%
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Form Dialog */}
      <AlertDialog open={showAddForm} onOpenChange={setShowAddForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yangi KPI maqsad</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Xodim</Label>
              <Select
                value={newTarget.employeeId}
                onValueChange={(v) => setNewTarget((p) => ({ ...p, employeeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Xodimni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ko'rsatkich</Label>
              <Select
                value={newTarget.metric}
                onValueChange={(v) => setNewTarget((p) => ({ ...p, metric: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(metricLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maqsad qiymati</Label>
              <Input
                type="number"
                value={newTarget.target || ""}
                onChange={(e) =>
                  setNewTarget((p) => ({ ...p, target: Number(e.target.value) }))
                }
                placeholder="Masalan: 50000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Davr</Label>
              <Select
                value={newTarget.period}
                onValueChange={(v) => setNewTarget((p) => ({ ...p, period: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Hafta</SelectItem>
                  <SelectItem value="month">Oy</SelectItem>
                  <SelectItem value="year">Yil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddTarget}>Qo'shish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>KPI ni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu maqsadni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default KPI;
