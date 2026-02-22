import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { useSalesFunnel, SalesFunnelFilters } from "@/hooks/useSalesFunnel";
import { formatCurrency } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { StatusBadge, ORDER_STATUS_CONFIG } from "@/components/shared/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  new: "Yangi",
  confirmed: "Tasdiqlangan",
  assembled: "Yig'ilgan",
  shipped: "Yuborilgan",
  delivered: "Yetkazilgan",
  returned: "Qaytarilgan",
  cancelled: "Bekor",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#4CAF50",
  confirmed: "#2196F3",
  assembled: "#FF9800",
  shipped: "#9C27B0",
  delivered: "#00BCD4",
  returned: "#F44336",
  cancelled: "#9E9E9E",
};

const SalesFunnel = () => {
  const [filters, setFilters] = useState<SalesFunnelFilters>({});
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    startDate: '',
    endDate: '',
  });

  const { data, loading, error } = useSalesFunnel(filters);
  const [activeTab, setActiveTab] = useState<'funnel' | 'customers'>('funnel');

  const filterFields: FilterField[] = [
    { key: 'startDate', label: 'Sana dan', type: 'date' },
    { key: 'endDate', label: 'Sana gacha', type: 'date' },
  ];

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    setFilters({ ...filterValues });
  }, [filterValues]);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ startDate: '', endDate: '' });
    setFilters({});
  }, []);

  // Find max count for bar width calculation
  const maxCount = Math.max(...data.funnel.map(s => s.count), 1);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Xatolik: {error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Savdo voronkasi</h1>
          <p className="text-gray-600 mt-1">Buyurtmalar bosqichlari bo'yicha tahlil</p>
        </div>

        {/* Filter */}
        <AdvancedFilter
          fields={filterFields}
          values={filterValues}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          defaultExpanded
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami buyurtmalar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalOrders}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umumiy summa</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(data.totalAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top mijozlar</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{data.topCustomers.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'funnel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('funnel')}
          >
            Voronka (Buyurtmalar)
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('customers')}
          >
            Top mijozlar
          </button>
        </div>

        {/* Funnel Table */}
        {activeTab === 'funnel' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bosqich</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Soni</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">O'rtacha vaqt (kun)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konversiya</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.funnel.map((stage) => (
                    <tr key={stage.status} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={stage.status} config={ORDER_STATUS_CONFIG} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {stage.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(stage.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {stage.avgDays > 0 ? `${stage.avgDays} kun` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {stage.conversion > 0 ? `${stage.conversion}%` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%`,
                              backgroundColor: STATUS_COLORS[stage.status] || '#9E9E9E',
                            }}
                          >
                            {stage.count > 0 && (
                              <span className="text-xs font-medium text-white">{stage.percentage}%</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Top Customers Table */}
        {activeTab === 'customers' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yetkazildi</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bekor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konversiya</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Ma'lumot topilmadi
                      </td>
                    </tr>
                  ) : (
                    data.topCustomers.map((customer, index) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{customer.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{customer.totalOrders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(customer.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {customer.deliveredCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {customer.cancelledCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-medium ${customer.conversionRate >= 80 ? 'text-green-600' : customer.conversionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {customer.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SalesFunnel;
