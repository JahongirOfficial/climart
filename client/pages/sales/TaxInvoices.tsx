import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Search, Plus, Trash2, Loader2, FileText, DollarSign, Send, Printer, CheckCircle, XCircle
} from "lucide-react";
import { useState } from "react";
import { useTaxInvoices } from "@/hooks/useTaxInvoices";
import { TaxInvoiceModal } from "@/components/TaxInvoiceModal";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";

const TaxInvoices = () => {
  const { invoices, loading, error, refetch, createInvoice, updateStatus, deleteInvoice } = useTaxInvoices();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'sent': "Yuborildi",
      'not_sent': "Yuborilmadi"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'sent': 'bg-green-100 text-green-800',
      'not_sent': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['not_sent'];
  };

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);
  const sentCount = invoices.filter(inv => inv.status === 'sent').length;

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      await createInvoice(data);
      toast({
        title: "Muvaffaqiyatli",
        description: "Hisob-faktura yaratildi",
      });
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Hisob-fakturani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hisob-fakturani o'chirishni xohlaysizmi?")) {
      try {
        await deleteInvoice(id);
        toast({
          title: "Muvaffaqiyatli",
          description: "Hisob-faktura o'chirildi",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Hisob-fakturani o'chirishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus(id, newStatus);
      toast({
        title: "Muvaffaqiyatli",
        description: `Holat ${getStatusLabel(newStatus)} ga o'zgartirildi`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Holatni o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (invoice: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hisob-faktura ${invoice.invoiceNumber}</title>
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
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .summary-row.subtotal { border-top: 1px solid #ddd; }
          .summary-row.tax { color: #f97316; font-weight: 600; }
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
          <h1>HISOB-FAKTURA</h1>
          <p>№ ${invoice.invoiceNumber}</p>
          <p>Sana: ${formatDate(invoice.invoiceDate)}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Tashkilot:</div>
            <div class="info-value">${invoice.organization}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Xaridor:</div>
            <div class="info-value">${invoice.customerName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Yuklab yuborish №:</div>
            <div class="info-value">${invoice.shipmentNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Holat:</div>
            <div class="info-value">${getStatusLabel(invoice.status)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Mahsulot</th>
              <th class="text-right">Miqdor</th>
              <th class="text-right">Narx</th>
              <th class="text-right">Oraliq summa</th>
              <th class="text-right">QQS %</th>
              <th class="text-right">QQS summa</th>
              <th class="text-right">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(item.subtotal)}</td>
                <td class="text-right">${item.taxRate}%</td>
                <td class="text-right">${formatCurrency(item.taxAmount)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row subtotal">
            <span>Oraliq summa:</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>
          <div class="summary-row tax">
            <span>QQS (Qo'shimcha qiymat solig'i):</span>
            <span>${formatCurrency(invoice.totalTax)}</span>
          </div>
          <div class="summary-row total">
            <span>Jami to'lov summasi:</span>
            <span>${formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 5px;">
          <strong>Izoh:</strong><br>
          ${invoice.notes}
        </div>
        ` : ''}

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Rahbar</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Bosh hisobchi</div>
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

  if (loading && invoices.length === 0) {
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

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Berilgan hisob-fakturalar</h1>
            <p className="text-gray-600 mt-1">Soliq hujjatlarini boshqaring</p>
          </div>
          <Button onClick={handleCreate} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Yangi hisob-faktura
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami hisob-fakturalar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qiymat</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami QQS</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalTax)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yuborilgan</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{sentCount}</p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hisob-faktura raqami, mijoz yoki yuklab yuborish bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Barchasi
              </Button>
              <Button
                variant={statusFilter === "not_sent" ? "default" : "outline"}
                onClick={() => setStatusFilter("not_sent")}
                size="sm"
              >
                Yuborilmadi
              </Button>
              <Button
                variant={statusFilter === "sent" ? "default" : "outline"}
                onClick={() => setStatusFilter("sent")}
                size="sm"
              >
                Yuborildi
              </Button>
            </div>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hisob-faktura №</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yuklab yuborish</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xaridor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oraliq summa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QQS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jami</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Hisob-fakturalar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.shipmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(invoice.invoiceDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(invoice.subtotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        {formatCurrency(invoice.totalTax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status === 'not_sent' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleStatusChange(invoice._id, 'sent')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              title="Yuborish"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handlePrint(invoice)}
                            className="text-gray-600"
                            title="Chop etish"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(invoice._id)} 
                            className="text-red-600"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <TaxInvoiceModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  );
};

export default TaxInvoices;
