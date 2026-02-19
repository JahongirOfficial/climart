import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Search, Users, DollarSign, AlertTriangle, Loader2, AlertCircle, FileText, CreditCard, Calendar
} from "lucide-react";
import { useState } from "react";
import { useCustomerDebts, useReconciliationReport } from "@/hooks/useCustomerDebts";
import { CustomerPaymentModal } from "@/components/CustomerPaymentModal";
import { useToast } from "@/hooks/use-toast";
import { ExportButton } from "@/components/ExportButton";

const CustomerDebts = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  
  const { data, loading, error, refetch } = useCustomerDebts(startDate, endDate);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('uz-UZ');
  };

  const filteredDebts = data?.debts.filter(debt => 
    debt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (debt.customerPhone && debt.customerPhone.includes(searchTerm))
  ) || [];

  const handlePayment = (debt: any) => {
    setSelectedDebt(debt);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSave = async () => {
    toast({
      title: "Muvaffaqiyatli",
      description: "To'lov qabul qilindi",
    });
    setIsPaymentModalOpen(false);
    setSelectedDebt(null);
    refetch();
  };

  const handleReconciliation = (customerId: string, customerName: string) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>O'zaro hisob-kitob akti - ${customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .info-value { font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; }
          .summary-row { display: flex; justify-between; padding: 10px 0; }
          .summary-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
          .signature { display: flex; justify-content: space-between; margin-top: 60px; }
          .signature-box { width: 45%; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; text-align: center; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>O'ZARO HISOB-KITOB AKTI</h1>
          <p>Davr: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Mijoz:</div>
            <div class="info-value">${customerName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sana:</div>
            <div class="info-value">${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <p style="margin-bottom: 20px; color: #666;">
          Ushbu akt ${formatDate(startDate)} dan ${formatDate(endDate)} gacha bo'lgan davrdagi o'zaro hisob-kitoblarni aks ettiradi.
        </p>

        <div class="summary">
          <div class="summary-row">
            <span>Jami sotuvlar:</span>
            <span>${formatCurrency(filteredDebts.find(d => d.customerId === customerId)?.totalSales || 0)}</span>
          </div>
          <div class="summary-row">
            <span>To'langan:</span>
            <span>${formatCurrency(filteredDebts.find(d => d.customerId === customerId)?.totalPaid || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Qaytarilgan:</span>
            <span>${formatCurrency(filteredDebts.find(d => d.customerId === customerId)?.totalReturns || 0)}</span>
          </div>
          <div class="summary-row total">
            <span>Qoldiq qarz:</span>
            <span style="color: #dc2626;">${formatCurrency(filteredDebts.find(d => d.customerId === customerId)?.debt || 0)}</span>
          </div>
        </div>

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Tashkilot vakili</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Mijoz</div>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          <p>Chop etilgan: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            Chop etish
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Yopish
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Mendan qarzdorlar</h1>
            <p className="text-gray-600 mt-1">Mijozlarning qarzdorligi va o'zaro hisob-kitoblar</p>
          </div>
          <ExportButton
            data={filteredDebts}
            filename="qarzdorlar"
            fieldsToInclude={["customerName", "customerPhone", "totalSales", "totalPaid", "totalReturns", "debt"]}
          />
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
              <Label htmlFor="search">Qidirish</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Mijoz nomi yoki telefon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qarzdorlar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.customersWithDebt}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Jami: {data.summary.totalCustomers}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qarz</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(data.summary.totalDebt)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Muddati o'tgan</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(data.summary.totalOverdue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.summary.customersWithOverdue} ta mijoz
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">To'langan</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(data.summary.totalPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Jami: {formatCurrency(data.summary.totalSales)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Debts Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jami sotuv</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">To'langan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qaytarilgan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qarz</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Muddati o'tgan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oxirgi operatsiya</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Qarzdorlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map((debt) => (
                    <tr key={debt.customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{debt.customerName}</div>
                          {debt.customerPhone && (
                            <div className="text-xs text-gray-500">{debt.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(debt.totalSales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {formatCurrency(debt.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                        {formatCurrency(debt.totalReturns)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                        <span className={debt.debt > 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatCurrency(debt.debt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {debt.overdueAmount > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {formatCurrency(debt.overdueAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(debt.lastOperationDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReconciliation(debt.customerId, debt.customerName)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            title="Akt sverki"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Akt
                          </Button>
                          {debt.debt > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePayment(debt)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              title="To'lov qilish"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              To'lov
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {selectedDebt && (
        <CustomerPaymentModal
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDebt(null);
          }}
          onSave={handlePaymentSave}
          customerId={selectedDebt.customerId}
          customerName={selectedDebt.customerName}
          debtAmount={selectedDebt.debt}
        />
      )}
    </Layout>
  );
};

export default CustomerDebts;
