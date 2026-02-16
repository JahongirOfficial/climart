import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface CashFlowData {
  opening: {
    cash: number;
    bank: number;
    total: number;
  };
  closing: {
    cash: number;
    bank: number;
    total: number;
  };
  incoming: {
    cash: number;
    bank: number;
    total: number;
  };
  outgoing: {
    cash: number;
    bank: number;
    total: number;
  };
  grouped: Array<{
    date: string;
    cashIncoming: number;
    cashOutgoing: number;
    bankIncoming: number;
    bankOutgoing: number;
    cashBalance: number;
    bankBalance: number;
    payments: any[];
  }>;
}

const CashFlow = () => {
  const [dateFilter, setDateFilter] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [groupBy, setGroupBy] = useState<'date' | 'category'>('date');

  const { data, isLoading } = useQuery<CashFlowData>({
    queryKey: ['cash-flow', dateFilter, groupBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        groupBy,
      });
      const response = await fetch(`/api/cash-flow?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cash flow');
      return response.json();
    },
  });

  const exportToExcel = () => {
    if (!data) return;

    let csv = 'Sana,Kassa Kirim,Kassa Chiqim,Bank Kirim,Bank Chiqim,Kassa Balans,Bank Balans,Jami Balans\n';
    
    data.grouped.forEach(movement => {
      const totalBalance = movement.cashBalance + movement.bankBalance;
      csv += `${movement.date},${movement.cashIncoming},${movement.cashOutgoing},${movement.bankIncoming},${movement.bankOutgoing},${movement.cashBalance},${movement.bankBalance},${totalBalance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cash-flow-${dateFilter.startDate}-${dateFilter.endDate}.csv`;
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

  const netChange = data?.closing?.total && data?.opening?.total 
    ? data.closing.total - data.opening.total 
    : 0;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pul Aylanmasi</h1>
            <p className="text-muted-foreground mt-1">
              Kassa va bank hisoblaridagi pul oqimi tahlili
            </p>
          </div>
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
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
            <Select value={groupBy} onValueChange={(value: 'date' | 'category') => setGroupBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sana bo'yicha</SelectItem>
                <SelectItem value="category">Kategoriya bo'yicha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Boshlang'ich Balans</p>
                <p className="text-2xl font-bold mt-2">
                  {(data?.opening?.total || 0).toLocaleString()} so'm
                </p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Kassa: {(data?.opening?.cash || 0).toLocaleString()}</span>
                  <span>Bank: {(data?.opening?.bank || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yakuniy Balans</p>
                <p className="text-2xl font-bold mt-2">
                  {(data?.closing?.total || 0).toLocaleString()} so'm
                </p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Kassa: {(data?.closing?.cash || 0).toLocaleString()}</span>
                  <span>Bank: {(data?.closing?.bank || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sof O'zgarish</p>
                <p className={`text-2xl font-bold mt-2 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()} so'm
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {netChange >= 0 ? 'O\'sish' : 'Kamayish'}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                netChange >= 0 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {netChange >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Movements Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Sana</th>
                  <th className="text-right p-4 font-medium">Kassa Kirim</th>
                  <th className="text-right p-4 font-medium">Kassa Chiqim</th>
                  <th className="text-right p-4 font-medium">Bank Kirim</th>
                  <th className="text-right p-4 font-medium">Bank Chiqim</th>
                  <th className="text-right p-4 font-medium">Kassa Balans</th>
                  <th className="text-right p-4 font-medium">Bank Balans</th>
                  <th className="text-right p-4 font-medium">Jami Balans</th>
                </tr>
              </thead>
              <tbody>
                {data.grouped.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ma'lumotlar topilmadi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.grouped.map((movement, index) => {
                    const totalBalance = movement.cashBalance + movement.bankBalance;
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">
                            {format(new Date(movement.date), 'dd.MM.yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {movement.payments.length} ta to'lov
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-green-600 font-medium">
                            +{movement.cashIncoming.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-red-600 font-medium">
                            -{movement.cashOutgoing.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-green-600 font-medium">
                            +{movement.bankIncoming.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-red-600 font-medium">
                            -{movement.bankOutgoing.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {movement.cashBalance.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-medium">
                          {movement.bankBalance.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {totalBalance.toLocaleString()}
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

export default CashFlow;
