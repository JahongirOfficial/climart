import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { api } from '@/lib/api';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
}

const EmployeePerformance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [period, setPeriod] = useState("month");

  const { data: employeesData, isLoading: loadingEmployees } = useQuery<{
    employees: Employee[];
  }>({
    queryKey: ["employees"],
    queryFn: () => api.get<{ employees: Employee[] }>("/api/employees"),
  });

  const { invoices, loading: loadingInvoices } = useCustomerInvoices();

  const employees = employeesData?.employees || [];

  const performanceData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return employees
      .filter((e) => e.isActive)
      .map((emp) => {
        const empInvoices = invoices.filter(
          (inv: any) =>
            inv.createdBy === emp._id &&
            new Date(inv.invoiceDate || inv.createdAt) >= startDate
        );

        const totalSales = empInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.finalAmount || inv.totalAmount || 0),
          0
        );
        const totalCollected = empInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.paidAmount || 0),
          0
        );
        const invoiceCount = empInvoices.length;
        const avgCheck = invoiceCount > 0 ? totalSales / invoiceCount : 0;
        const collectionRate =
          totalSales > 0 ? (totalCollected / totalSales) * 100 : 0;

        return {
          ...emp,
          totalSales,
          totalCollected,
          invoiceCount,
          avgCheck,
          collectionRate,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [employees, invoices, period]);

  const filtered = performanceData.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.username.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totals = useMemo(() => {
    return {
      totalSales: performanceData.reduce((s, e) => s + e.totalSales, 0),
      totalCollected: performanceData.reduce((s, e) => s + e.totalCollected, 0),
      totalInvoices: performanceData.reduce((s, e) => s + e.invoiceCount, 0),
      activeEmployees: performanceData.length,
    };
  }, [performanceData]);

  const loading = loadingEmployees || loadingInvoices;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  const formatCurrency = (n: number) =>
    n.toLocaleString("uz-UZ") + " so'm";

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xodimlar samaradorligi</h1>
          <p className="text-gray-600 mt-1">
            Xodimlar bo'yicha savdo ko'rsatkichlari
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faol xodimlar</p>
                <p className="text-2xl font-bold mt-1">{totals.activeEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami savdo</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totals.totalSales)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yig'ilgan to'lov</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(totals.totalCollected)}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami fakturalar</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {totals.totalInvoices}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Xodim qidirish..."
                className="pl-9"
              />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Hafta</SelectItem>
                <SelectItem value="month">Oy</SelectItem>
                <SelectItem value="year">Yil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Xodim
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Savdo summasi
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Yig'ilgan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Fakturalar
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    O'rtacha chek
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Yig'ish %
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, idx) => (
                    <tr key={emp._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{emp.username}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(emp.totalSales)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {formatCurrency(emp.totalCollected)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{emp.invoiceCount}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(Math.round(emp.avgCheck))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                emp.collectionRate >= 80
                                  ? "bg-green-500"
                                  : emp.collectionRate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(emp.collectionRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {emp.collectionRate.toFixed(0)}%
                          </span>
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
    </Layout>
  );
};

export default EmployeePerformance;
