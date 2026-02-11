import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, DollarSign, Package, Loader2, AlertCircle, TrendingDown, RotateCcw, ShoppingCart
} from "lucide-react";
import { useState } from "react";
import { useProfitability } from "@/hooks/useProfitability";

const Profitability = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<string>("products");
  
  const { data, loading, error } = useProfitability(startDate, endDate, groupBy);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + "%";
  };

  const getGroupByLabel = (value: string) => {
    const labels: Record<string, string> = {
      'products': 'Mahsulotlar',
      'customers': 'Mijozlar',
      'employees': 'Xodimlar',
      'channels': 'Savdo kanallari'
    };
    return labels[value] || value;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error || 'Ma\'lumotlarni yuklashda xatolik'}</p>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Foydalilik</h1>
            <p className="text-gray-600 mt-1">Sotuvlar va qaytarmalar bo'yicha foyda tahlili</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="groupBy">Guruhlash</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Guruhlashni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Mahsulotlar bo'yicha</SelectItem>
                  <SelectItem value="customers">Mijozlar bo'yicha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sof tushum</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(data.summary.net.revenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sotuvlar: {formatCurrency(data.summary.sales.revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sof xarajat</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(data.summary.net.cost)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sotuvlar: {formatCurrency(data.summary.sales.cost)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sof foyda</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(data.summary.net.profit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sotuvlar: {formatCurrency(data.summary.sales.profit)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rentabellik</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {formatPercent(data.summary.net.profitMargin)}
                </p>
              </div>
              <div className="text-purple-600 text-2xl font-bold">%</div>
            </div>
          </Card>
        </div>

        {/* Sales vs Returns Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Sotuvlar</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Tushum:</span>
                <span className="font-bold text-green-700">{formatCurrency(data.summary.sales.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Xarajat:</span>
                <span className="font-medium text-gray-700">{formatCurrency(data.summary.sales.cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="font-semibold text-gray-900">Foyda:</span>
                <span className="font-bold text-green-600">{formatCurrency(data.summary.sales.profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Miqdor:</span>
                <span className="text-gray-900">{data.summary.sales.quantity} dona</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Yuklab yuborishlar:</span>
                <span className="text-gray-900">{data.summary.sales.count} ta</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Qaytarmalar</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Tushum:</span>
                <span className="font-bold text-red-700">{formatCurrency(data.summary.returns.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Xarajat:</span>
                <span className="font-medium text-gray-700">{formatCurrency(data.summary.returns.cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-red-300">
                <span className="font-semibold text-gray-900">Yo'qotilgan foyda:</span>
                <span className="font-bold text-red-600">{formatCurrency(data.summary.returns.loss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Miqdor:</span>
                <span className="text-gray-900">{data.summary.returns.quantity} dona</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Qaytarishlar:</span>
                <span className="text-gray-900">{data.summary.returns.count} ta</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {getGroupByLabel(groupBy)} bo'yicha tahlil
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" rowSpan={2}>
                    {groupBy === 'products' ? 'Mahsulot' : 'Mijoz'}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l border-r" colSpan={4}>
                    Sotuvlar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r" colSpan={4}>
                    Qaytarmalar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase" colSpan={3}>
                    Sof natija
                  </th>
                </tr>
                <tr>
                  {/* Sales columns */}
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-l">Miqdor</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tushum</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Xarajat</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-r">Foyda</th>
                  {/* Returns columns */}
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tushum</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Xarajat</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-r">Zarar</th>
                  {/* Net columns */}
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tushum</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Foyda</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Marja %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.groupedData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  data.groupedData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                      {/* Sales */}
                      <td className="px-4 py-4 text-sm text-right border-l">{item.salesQuantity}</td>
                      <td className="px-4 py-4 text-sm text-right">{formatCurrency(item.salesRevenue)}</td>
                      <td className="px-4 py-4 text-sm text-right">{formatCurrency(item.salesCost)}</td>
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 border-r">
                        {formatCurrency(item.salesProfit)}
                      </td>
                      {/* Returns */}
                      <td className="px-4 py-4 text-sm text-right">{item.returnQuantity}</td>
                      <td className="px-4 py-4 text-sm text-right">{formatCurrency(item.returnRevenue)}</td>
                      <td className="px-4 py-4 text-sm text-right">{formatCurrency(item.returnCost)}</td>
                      <td className="px-4 py-4 text-sm text-right font-medium text-red-600 border-r">
                        {formatCurrency(item.returnLoss)}
                      </td>
                      {/* Net */}
                      <td className="px-4 py-4 text-sm text-right font-medium">{formatCurrency(item.netRevenue)}</td>
                      <td className="px-4 py-4 text-sm text-right font-bold text-blue-600">
                        {formatCurrency(item.netProfit)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-bold text-purple-600">
                        {formatPercent(item.profitMargin)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.groupedData.length > 0 && (
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr className="font-bold">
                    <td className="px-6 py-4 text-sm text-gray-900">JAMI</td>
                    {/* Sales totals */}
                    <td className="px-4 py-4 text-sm text-right border-l">{data.summary.sales.quantity}</td>
                    <td className="px-4 py-4 text-sm text-right">{formatCurrency(data.summary.sales.revenue)}</td>
                    <td className="px-4 py-4 text-sm text-right">{formatCurrency(data.summary.sales.cost)}</td>
                    <td className="px-4 py-4 text-sm text-right text-green-600 border-r">
                      {formatCurrency(data.summary.sales.profit)}
                    </td>
                    {/* Returns totals */}
                    <td className="px-4 py-4 text-sm text-right">{data.summary.returns.quantity}</td>
                    <td className="px-4 py-4 text-sm text-right">{formatCurrency(data.summary.returns.revenue)}</td>
                    <td className="px-4 py-4 text-sm text-right">{formatCurrency(data.summary.returns.cost)}</td>
                    <td className="px-4 py-4 text-sm text-right text-red-600 border-r">
                      {formatCurrency(data.summary.returns.loss)}
                    </td>
                    {/* Net totals */}
                    <td className="px-4 py-4 text-sm text-right">{formatCurrency(data.summary.net.revenue)}</td>
                    <td className="px-4 py-4 text-sm text-right text-blue-600">
                      {formatCurrency(data.summary.net.profit)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-purple-600">
                      {formatPercent(data.summary.net.profitMargin)}
                    </td>
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

export default Profitability;
