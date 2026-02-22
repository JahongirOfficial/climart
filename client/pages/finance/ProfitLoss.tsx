import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Download,
  Percent,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { api } from '@/lib/api';

interface ProfitLossData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    gross: number;
    returns: number;
    net: number;
  };
  costs: {
    costOfGoodsSold: number;
    writeoffs: number;
    total: number;
  };
  grossProfit: {
    amount: number;
    margin: number;
  };
  expenses: {
    byCategory: Record<string, number>;
    total: number;
  };
  operatingProfit: {
    amount: number;
  };
  netProfit: {
    amount: number;
    margin: number;
  };
  summary: {
    revenue: number;
    totalCosts: number;
    netProfit: number;
  };
}

const ProfitLoss = () => {
  const [dateFilter, setDateFilter] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { data, isLoading } = useQuery<ProfitLossData>({
    queryKey: ['profit-loss', dateFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      });
      return api.get<ProfitLossData>(`/api/profit-loss?${params}`);
    },
  });

  const exportToExcel = () => {
    if (!data) return;

    let csv = 'Ko\'rsatkich,Summa\n';
    csv += `Tushum (Gross),${data.revenue.gross}\n`;
    csv += `Qaytarishlar,${data.revenue.returns}\n`;
    csv += `Sof tushum,${data.revenue.net}\n`;
    csv += `Sotilgan tovarlar tannarxi,${data.costs.costOfGoodsSold}\n`;
    csv += `Hisobdan chiqarishlar,${data.costs.writeoffs}\n`;
    csv += `Yalpi foyda,${data.grossProfit.amount}\n`;
    csv += `Operatsion xarajatlar,${data.expenses.total}\n`;
    csv += `Operatsion foyda,${data.operatingProfit.amount}\n`;
    csv += `Sof foyda,${data.netProfit.amount}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit-loss-${dateFilter.startDate}-${dateFilter.endDate}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">Ma'lumotlarni yuklashda xatolik</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num) + " so'm";
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Foyda va zarar (Прибыли и убытки)</h1>
            <p className="text-muted-foreground mt-1">
              Moliyaviy natijalar tahlili
            </p>
          </div>
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sof Tushum</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">
                  {formatCurrency(data.revenue.net)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Qaytarishlar: -{formatCurrency(data.revenue.returns)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Xarajatlar</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {formatCurrency(data.summary.totalCosts)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tannarx + Xarajatlar
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
                <p className="text-sm font-medium text-muted-foreground">Sof Foyda</p>
                <p className={`text-2xl font-bold mt-2 ${data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.netProfit.amount >= 0 ? '+' : ''}{formatCurrency(data.netProfit.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {data.netProfit.margin.toFixed(1)}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                data.netProfit.amount >= 0 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {data.netProfit.amount >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Report */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Tushum (Выручка)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Yalpi tushum</span>
                <span className="font-medium">{formatCurrency(data.revenue.gross)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-red-600">Qaytarishlar</span>
                <span className="font-medium text-red-600">-{formatCurrency(data.revenue.returns)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Sof tushum</span>
                <span className="font-bold text-blue-600">{formatCurrency(data.revenue.net)}</span>
              </div>
            </div>
          </Card>

          {/* Costs Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              Tannarx (Себестоимость)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Sotilgan tovarlar tannarxi</span>
                <span className="font-medium">{formatCurrency(data.costs.costOfGoodsSold)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Hisobdan chiqarishlar</span>
                <span className="font-medium">{formatCurrency(data.costs.writeoffs)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Jami tannarx</span>
                <span className="font-bold text-red-600">{formatCurrency(data.costs.total)}</span>
              </div>
            </div>
          </Card>

          {/* Gross Profit */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-600" />
              Yalpi Foyda (Валовая прибыль)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Summa</span>
                <span className={`font-bold text-xl ${data.grossProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.grossProfit.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Margin</span>
                <span className="font-medium">{data.grossProfit.margin.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          {/* Operating Expenses */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Operatsion Xarajatlar
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(data.expenses.byCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{category}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Jami</span>
                <span className="text-orange-600">{formatCurrency(data.expenses.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Final Summary */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <h3 className="text-xl font-bold mb-6 text-center">Yakuniy Natija</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Operatsion Foyda</p>
              <p className={`text-2xl font-bold ${data.operatingProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.operatingProfit.amount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Sof Foyda</p>
              <p className={`text-3xl font-bold ${data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netProfit.amount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Foyda Margini</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.netProfit.margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfitLoss;
