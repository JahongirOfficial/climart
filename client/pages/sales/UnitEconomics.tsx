import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { useUnitEconomics, UnitEconomicsFilters } from "@/hooks/useUnitEconomics";
import { formatCurrency } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { ExportButton } from "@/components/ExportButton";

const UnitEconomics = () => {
  const [filters, setFilters] = useState<UnitEconomicsFilters>({});
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    startDate: '',
    endDate: '',
  });

  const { data, loading, error } = useUnitEconomics(filters);

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

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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

  const { summary, products } = data;
  const profitableCount = products.filter(p => p.profit > 0).length;
  const unprofitableCount = products.filter(p => p.profit <= 0).length;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unit ekonomika</h1>
            <p className="text-gray-600 mt-1">Mahsulotlar bo'yicha rentabellik tahlili</p>
          </div>
          <ExportButton
            data={products}
            filename="unit-ekonomika"
            fieldsToInclude={["productName", "totalQuantity", "totalRevenue", "totalCost", "profit", "profitMargin", "breakEven"]}
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umumiy tushum</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sof foyda</p>
                <p className={`text-2xl font-bold mt-1 ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.totalProfit)}
                </p>
              </div>
              {summary.totalProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rentabellik</p>
                <p className={`text-2xl font-bold mt-1 ${summary.overallMargin >= 20 ? 'text-green-600' : summary.overallMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {summary.overallMargin}%
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mahsulotlar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  <span className="text-green-600">{profitableCount}</span>
                  {unprofitableCount > 0 && (
                    <span className="text-red-600 ml-1">/ {unprofitableCount}</span>
                  )}
                </p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tushum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tan narx</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Foyda</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rentabellik</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Zarar chegarasi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {product.productName}
                          {product.hasPendingCosts && (
                            <span title="Tan narx aniqlanmagan">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{product.totalQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(product.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={product.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(product.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          product.profitMargin >= 30 ? 'bg-green-100 text-green-800' :
                          product.profitMargin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                          product.profitMargin >= 0 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.profitMargin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {product.breakEven > 0 ? `${product.breakEven} dona` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {products.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr className="font-bold">
                    <td className="px-6 py-4" colSpan={2}>JAMI</td>
                    <td className="px-6 py-4 text-right">
                      {products.reduce((sum, p) => sum + p.totalQuantity, 0)}
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.totalRevenue)}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(summary.totalCost)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(summary.totalProfit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        summary.overallMargin >= 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {summary.overallMargin}%
                      </span>
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default UnitEconomics;
