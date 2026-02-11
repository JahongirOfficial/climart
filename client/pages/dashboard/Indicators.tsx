import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { useDashboard, DashboardPeriod } from "@/hooks/useDashboard";
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

const Indicators = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("this_month");
  const { stats, loading, error, refetch } = useDashboard(period);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all periods for instant switching
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </Card>
            ))}
          </div>

          {/* Debt Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </Card>
            ))}
          </div>

          {/* Warehouse Card Skeleton */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-4">
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>

          {/* Top-5 Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300">Xatolik yuz berdi</h3>
                <p className="text-red-700 dark:text-red-400">{error || 'Ma\'lumotlarni yuklashda xatolik'}</p>
                <Button
                  onClick={() => refetch()}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Qayta urinish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ko'rsatkichlar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Biznes ko'rsatkichlari va tahlil</p>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod("today")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${period === "today"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Kun
            </button>
            <button
              onClick={() => setPeriod("this_week")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${period === "this_week"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${period === "this_month"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Oy
            </button>
            <button
              onClick={() => setPeriod("this_year")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${period === "this_year"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Yil
            </button>
          </div>
        </div>

        {/* 1. Savdo va Foyda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Umumiy tushum */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Umumiy tushum</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Выручка</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.revenue.current)}
              </p>
              <div className={`flex items-center gap-2 text-sm font-medium ${getChangeColor(stats.revenue.change)}`}>
                {stats.revenue.change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(stats.revenue.change)}%</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal">o'tgan davrga nisbatan</span>
              </div>
            </div>
          </Card>

          {/* Sof foyda */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sof foyda</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Прибыль</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.profit.current)}
              </p>
              <div className={`flex items-center gap-2 text-sm font-medium ${getChangeColor(stats.profit.change)}`}>
                {stats.profit.change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(stats.profit.change)}%</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal">o'tgan davrga nisbatan</span>
              </div>
            </div>
          </Card>

          {/* O'rtacha chek */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${stats.averageCheck.change >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/30'}`}>
                  <Users className={`h-6 w-6 ${stats.averageCheck.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">O'rtacha chek</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Средний чек</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.averageCheck.current)}
              </p>
              <div className={`flex items-center gap-2 text-sm font-medium ${getChangeColor(stats.averageCheck.change)}`}>
                {stats.averageCheck.change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(stats.averageCheck.change)}%</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal">o'tgan davrga nisbatan</span>
              </div>
              {stats.averageCheck.change < 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ O'rtacha chek pasaygan - arzon tovarlar ko'proq sotilmoqda yoki sotuvchilar samaradorligi kamaygan
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 2. Qarzlar va Majburiyatlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Debitorlik qarzi</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mijozlar qarzi</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {formatCurrency(stats.debtorDebt)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mijozlar (ustalar, qurilish ob'ektlari) qarzi
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Kreditorlik qarzi</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Yetkazib beruvchilarga qarz</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {formatCurrency(stats.creditorDebt)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zavod va yetkazib beruvchilarga qarz
            </p>
          </Card>
        </div>

        {/* 3. Tovar qoldiqlari */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Tovar qoldiqlari</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ombor holati</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ombor qiymati</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(stats.warehouseValue)}
              </p>
            </div>
          </div>

          {stats.lowStockItems.length > 0 ? (
            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="font-medium text-gray-900 dark:text-white">Tugayotgan tovarlar</p>
              </div>
              <div className="space-y-3">
                {stats.lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Minimal: {item.minStock} dona
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{item.quantity} dona</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">Zaxira qilish kerak!</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t dark:border-gray-700 pt-4">
              <div className="text-center py-6">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Barcha tovarlar yetarli miqdorda</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Tugayotgan tovarlar yo'q</p>
              </div>
            </div>
          )}
        </Card>

        {/* 4. Top-5 Mahsulot va Mijozlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top-5 Mahsulotlar */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top-5 Mahsulotlar
            </h3>
            {stats.topProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.quantity} dona sotildi</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary">
                      {formatCurrency(product.sales)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Hali sotuvlar yo'q</p>
              </div>
            )}
          </Card>

          {/* Top-5 Suppliers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top-5 Yetkazib beruvchilar
            </h3>
            {stats.topSuppliers.length > 0 ? (
              <div className="space-y-3">
                {stats.topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-600 dark:bg-green-700 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.orders} ta qabul</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(supplier.sales)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Hali qabullar yo'q</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Indicators;
