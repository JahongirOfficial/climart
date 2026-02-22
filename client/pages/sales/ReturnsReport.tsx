import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RotateCcw, TrendingUp, Package, Users, Loader2, AlertCircle, DollarSign
} from "lucide-react";
import { useState } from "react";
import { useReturnsReport } from "@/hooks/useReturnsReport";
import { formatCurrency } from "@/lib/format";

const ReturnsReport = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, loading, error } = useReturnsReport(startDate, endDate);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'defective': "Nuqsonli mahsulot",
      'wrong_item': "Noto'g'ri mahsulot",
      'customer_request': "Mijoz talabi",
      'other': "Boshqa"
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'defective': 'bg-red-500',
      'wrong_item': 'bg-orange-500',
      'customer_request': 'bg-blue-500',
      'other': 'bg-gray-500'
    };
    return colors[reason] || colors['other'];
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
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
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qaytarishlar hisoboti</h1>
            <p className="text-gray-600 mt-1">Qaytarishlar statistikasi va tahlili</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qaytarishlar</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.totalReturns}</p>
              </div>
              <RotateCcw className="h-10 w-10 text-gray-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qiymat</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(data.summary.totalValue)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">O'rtacha qaytarish</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(data.summary.averageReturnValue)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Returns by Reason */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sabablari bo'yicha</h2>
          <div className="space-y-4">
            {Object.entries(data.byReason).map(([reason, stats]) => (
              <div key={reason} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getReasonColor(reason)}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{getReasonLabel(reason)}</p>
                    <p className="text-sm text-gray-600">{stats.count} ta qaytarish</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(stats.value)}</p>
                  <p className="text-sm text-gray-600">
                    {((stats.count / data.summary.totalReturns) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Returned Products and Customers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Returned Products */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Eng ko'p qaytarilgan mahsulotlar
            </h2>
            {data.topReturnedProducts.length > 0 ? (
              <div className="space-y-3">
                {data.topReturnedProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-600">{product.quantity} dona</p>
                      </div>
                    </div>
                    <p className="font-bold text-red-600">{formatCurrency(product.value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Ma'lumot yo'q</p>
              </div>
            )}
          </Card>

          {/* Top Returning Customers */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Eng ko'p qaytargan mijozlar
            </h2>
            {data.topReturningCustomers.length > 0 ? (
              <div className="space-y-3">
                {data.topReturningCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.customerName}</p>
                        <p className="text-sm text-gray-600">{customer.returns} ta qaytarish</p>
                      </div>
                    </div>
                    <p className="font-bold text-orange-600">{formatCurrency(customer.value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Ma'lumot yo'q</p>
              </div>
            )}
          </Card>
        </div>

        {/* Monthly Trend */}
        {data.monthlyTrend.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Oylik tendensiya</h2>
            <div className="space-y-2">
              {data.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.count} ta qaytarish</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(month.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
    </div>
  );
};

export default ReturnsReport;
