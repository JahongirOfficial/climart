import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { useSupplierInvoices } from "@/hooks/useSupplierInvoices";
import { formatCurrency, formatDate } from "@/lib/format";

const ReceivedInvoices = () => {
  const { invoices, loading, error, refetch } = useSupplierInvoices();
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-green-50 text-green-700 border-green-300';
    if (status === 'partial') return 'bg-blue-50 text-blue-700 border-blue-300';
    return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'paid') return <CheckCircle className="h-4 w-4" />;
    if (status === 'partial') return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'paid') return 'To\'langan';
    if (status === 'partial') return 'Qisman to\'langan';
    return 'To\'lanmagan';
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInvoices = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalUnpaid = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

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
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
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
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Qabul qilingan schot fakturalar</h1>
              <p className="text-sm text-gray-500 mt-1">
                Yetkazib beruvchilardan qabul qilingan hisob-fakturalar
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami fakturalar</span>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(totalInvoices)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{invoices.length} ta hujjat</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">To'langan</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Amalga oshirilgan</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">To'lanmagan</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(totalUnpaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Qoldiq</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Faktura raqami yoki yetkazib beruvchini qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Faktura raqami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Yetkazib beruvchi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Jami summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    To'langan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Qoldiq
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const remainingAmount = invoice.totalAmount - invoice.paidAmount;
                  
                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {invoice.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">
                        {formatCurrency(remainingAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Fakturalar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                {invoices.length === 0 ? "Hali fakturalar yo'q" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {filteredInvoices.length} ta faktura
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Oldingi
              </Button>
              <Button variant="outline" size="sm">
                Keyingi
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Schot-fakturalar haqida ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Avtomatik yaratilish</strong> - Qabul qilingan tovarlar asosida faktura yaratiladi</li>
                <li>• <strong>To'lov nazorati</strong> - Har bir faktura uchun to'lov holati kuzatiladi</li>
                <li>• <strong>Qarz hisoblash</strong> - To'lanmagan fakturalar kreditorlik qarzini tashkil qiladi</li>
                <li>• Fakturalar yetkazib beruvchilar bilan hisob-kitobni tartibga soladi</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ReceivedInvoices;
