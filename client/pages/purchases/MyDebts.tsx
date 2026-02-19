import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Eye,
  Filter,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useDebts } from "@/hooks/useDebts";
import { formatCurrency, formatDate } from "@/lib/format";

const MyDebts = () => {
  const { debts, paymentSchedule, overduePayments, loading, error, refetch } = useDebts();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'with-debt'>('all');
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'overdue': 'bg-red-50 text-red-700 border-red-300',
      'due-soon': 'bg-yellow-50 text-yellow-700 border-yellow-300',
      'ok': 'bg-green-50 text-green-700 border-green-300'
    };
    return colors[status] || colors['ok'];
  };

  const getStatusIcon = (status: string) => {
    if (status === 'overdue') return <AlertTriangle className="h-4 w-4" />;
    if (status === 'due-soon') return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'overdue': 'Muddati o\'tib ketgan',
      'due-soon': 'Tez orada to\'lash kerak',
      'ok': 'Vaqtida'
    };
    return labels[status] || status;
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'overdue') {
      return matchesSearch && debt.status === 'overdue';
    }
    if (filterType === 'with-debt') {
      return matchesSearch && debt.remainingDebt > 0;
    }
    return matchesSearch;
  });

  // Calculate totals
  const totalDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingDebt, 0);
  const overdueCount = debts.filter(d => d.status === 'overdue').length;
  const overdueAmount = debts
    .filter(d => d.status === 'overdue')
    .reduce((sum, d) => sum + d.remainingDebt, 0);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
                <Button
                  onClick={refetch}
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
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mening qarzlarim</h1>
              <p className="text-sm text-gray-500 mt-1">
                Yetkazib beruvchilarga qarzdorlik va to'lov muddatlari
              </p>
            </div>
            <Button onClick={refetch} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Yangilash
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami qarz</span>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(totalDebt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Barcha operatsiyalar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">To'langan</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Qilingan to'lovlar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Qoldiq</span>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-xs text-gray-500 mt-1">To'lash kerak</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Muddati o'tib ketgan</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(overdueAmount)}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">To'lov foizi</span>
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Jami to'langan</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Debts Table */}
          <div className="lg:col-span-2">
            <Card>
              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Yetkazib beruvchi nomini qidiring..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                    className="gap-2"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Hammasini ko'rsatish
                  </Button>
                  <Button
                    variant={filterType === 'with-debt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('with-debt')}
                    className="gap-2"
                  >
                    Faqat qarzim borlar
                  </Button>
                  <Button
                    variant={filterType === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('overdue')}
                    className="gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  >
                    Muddati o'tib ketgan
                  </Button>
                </div>
              </div>

              {/* Debts List */}
              <div className="divide-y divide-gray-100">
                {filteredDebts.map((debt) => (
                  <div key={debt.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedDebt(expandedDebt === debt.id ? null : debt.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{debt.supplier}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Oxirgi operatsiya: {formatDate(debt.lastOperationDate)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getStatusColor(debt.status)}`}>
                          {getStatusIcon(debt.status)}
                          {getStatusLabel(debt.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Jami qarz</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(debt.totalDebt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">To'langan</p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(debt.paidAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Qoldiq</p>
                          <p className={`text-sm font-semibold ${debt.remainingDebt > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {formatCurrency(debt.remainingDebt)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${debt.remainingDebt === 0 ? 'bg-green-600' : 'bg-orange-600'
                            }`}
                          style={{
                            width: `${debt.totalDebt > 0 ? (debt.paidAmount / debt.totalDebt) * 100 : 0}%`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {debt.dueDate ? (
                            <>
                              To'lov muddati: {formatDate(debt.dueDate)}
                              {getDaysUntilDue(debt.dueDate) < 0 && (
                                <span className="text-red-600 font-semibold">
                                  ({Math.abs(getDaysUntilDue(debt.dueDate))} kun o'tib ketgan)
                                </span>
                              )}
                              {getDaysUntilDue(debt.dueDate) >= 0 && getDaysUntilDue(debt.dueDate) <= 3 && (
                                <span className="text-yellow-600 font-semibold">
                                  ({getDaysUntilDue(debt.dueDate)} kun qoldi)
                                </span>
                              )}
                            </>
                          ) : (
                            'To\'lov muddati belgilanmagan'
                          )}
                        </div>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedDebt === debt.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Qabul qilish hujjatlari</h4>
                            <div className="space-y-2">
                              {debt.receipts.map((receipt, idx) => (
                                <div key={idx} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                                  <p className="font-medium text-blue-900">{receipt.receiptNumber}</p>
                                  <p className="text-blue-700">{formatDate(receipt.receiptDate)}</p>
                                  <p className="text-blue-700 font-semibold">{formatCurrency(receipt.totalAmount)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">To'lov hujjatlari</h4>
                            <div className="space-y-2">
                              {debt.payments.length > 0 ? (
                                debt.payments.map((payment, idx) => (
                                  <div key={idx} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                                    <p className="font-medium text-green-900">{payment.paymentNumber}</p>
                                    <p className="text-green-700">{formatDate(payment.paymentDate)}</p>
                                    <p className="text-green-700 font-semibold">{formatCurrency(payment.amount)}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 italic">To'lovlar yo'q</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredDebts.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Qarzlar topilmadi</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Qidiruv shartini o'zgartiring
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Payment Schedule */}
          <div>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                To'lov rejasi
              </h3>
              <div className="space-y-3">
                {paymentSchedule.map((payment, idx) => {
                  const daysFromNow = Math.ceil(
                    (new Date(payment.date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${daysFromNow < 0
                          ? 'bg-red-50 border-red-200'
                          : daysFromNow <= 2
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-900">
                          {formatDate(payment.date)}
                        </p>
                        {daysFromNow < 0 && (
                          <span className="text-xs font-bold text-red-600">
                            {Math.abs(daysFromNow)} kun o'tib ketgan
                          </span>
                        )}
                        {daysFromNow >= 0 && daysFromNow <= 2 && (
                          <span className="text-xs font-bold text-yellow-600">
                            {daysFromNow} kun qoldi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{payment.supplier}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(payment.remainingAmount)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Jami to'lash kerak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      paymentSchedule.reduce((sum, p) => sum + p.remainingAmount, 0)
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Qarz hisoblash formulasi
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Umumiy qarz</strong> = Barcha qabul qilish summalari - Barcha to'lovlar - Barcha qaytarishlar</li>
                <li>• <strong>Muddati o'tib ketgan</strong> - To'lov muddati bugundan o'tib ketgan</li>
                <li>• <strong>Tez orada to'lash kerak</strong> - To'lov muddati 3 kundan kam qolgan</li>
                <li>• Har bir yetkazib beruvchi uchun alohida hisoblash</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default MyDebts;