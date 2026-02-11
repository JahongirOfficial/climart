import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Package,
  Download,
  ChevronDown,
  Loader2,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDashboard, DashboardPeriod } from "@/hooks/useDashboard";
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Bajarildi":
      return "bg-green-50 text-green-700 border border-green-200";
    case "Kutilmoqda":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "Bekor qilindi":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

const Dashboard = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("this_month");
  const { stats, loading, error, refetch } = useDashboard(period);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch other periods for instant switching
    const periods: DashboardPeriod[] = ['today', 'this_week', 'this_month', 'this_year'];
    periods.forEach(p => {
      if (p !== period) {
        queryClient.prefetchQuery({
          queryKey: ['dashboard-stats', p],
          queryFn: async () => {
            const response = await fetch(`/api/dashboard/stats?period=${p}`);
            return response.json();
          },
          staleTime: 1000 * 60 * 5,
        });
      }
    });
  }, [queryClient, period]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'bugunga nisbatan';
      case 'this_week': return 'o\'tgan haftaga nisbatan';
      case 'this_year': return 'o\'tgan yilga nisbatan';
      case 'this_month':
      default: return 'o\'tgan oyga nisbatan';
    }
  };

  if (loading && !stats) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-500 animate-pulse">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !stats) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center text-red-600">
          Xatolik yuz berdi: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Boshqaruv paneli</h1>
            <p className="text-sm text-gray-500 mt-1">Tizim bo'yicha umumiy statistik ma'lumotlar</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Davrni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="this_week">Shu hafta</SelectItem>
                <SelectItem value="this_month">Shu oy</SelectItem>
                <SelectItem value="this_year">Shu yil</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="border-gray-200 bg-white" onClick={() => refetch()}>
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Savdo hajmi */}
          <div className="erp-card p-6 no-scale">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Savdo hajmi
              </span>
              <div className="bg-blue-50 p-2" style={{ borderRadius: '3px' }}>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats.revenue.current.toLocaleString()} so'm
              </p>
              <p className={`text-xs font-medium ${stats.revenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.revenue.change >= 0 ? "+" : ""}{stats.revenue.change}% {getPeriodLabel()}
              </p>
            </div>
          </div>

          {/* Daromad */}
          <div className="erp-card p-6 no-scale">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Daromad (Foyda)</span>
              <div className="bg-green-50 p-2" style={{ borderRadius: '3px' }}>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats.profit.current.toLocaleString()} so'm
              </p>
              <p className={`text-xs font-medium ${stats.profit.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.profit.change >= 0 ? "+" : ""}{stats.profit.change}% {getPeriodLabel()}
              </p>
            </div>
          </div>

          {/* Kreditor qarzdorlik (Xarajatlar o'rniga yoki shunga o'xshash) */}
          {/* Aslida 'Xarajatlar' backendda CreditorDebt sifatida qaytmayapti, bizda 'creditorDebt' bor */}
          <div className="erp-card p-6 no-scale">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Kreditor qarzdorlik
              </span>
              <div className="bg-red-50 p-2" style={{ borderRadius: '3px' }}>
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats.creditorDebt.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 font-medium">To'lanmagan hisoblar</p>
            </div>
          </div>

          {/* Ombor qoldig'i */}
          <div className="erp-card p-6 no-scale">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Ombor qiymati
              </span>
              <div className="bg-purple-50 p-2" style={{ borderRadius: '3px' }}>
                <Package className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats.warehouseValue.toLocaleString()} so'm
              </p>
              <p className="text-xs text-gray-500 font-medium">Jami mahsulotlar tannarxi</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 erp-card p-6 no-scale">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Savdo statistikasi (Oylik)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                  formatter={(value: number) => value.toLocaleString() + " so'm"}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="savdo"
                  name="Savdo"
                  stroke="#1E88E5"
                  strokeWidth={2}
                  dot={{ fill: "#1E88E5", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="erp-card p-6 no-scale">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Eng ko'p sotilgan mahsulotlar
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                  formatter={(value: number) => value.toLocaleString() + " so'm"}
                />
                <Bar
                  dataKey="sales"
                  name="Sotuv summasi"
                  fill="#2ECC71"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="erp-card overflow-hidden no-scale">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Oxirgi tranzaksiyalar
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Sana
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="erp-table-header border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Hujjat turi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id + index}
                    className="border-b border-gray-100 erp-table-row"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transaction.amount.toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                        style={{ borderRadius: '3px' }}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Tranzaksiyalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
