import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search, Truck, Package, CheckCircle, Clock, XCircle, Loader2, Printer, FileText
} from "lucide-react";
import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useShipments } from "@/hooks/useShipments";
import { TaxInvoiceModal } from "@/components/TaxInvoiceModal";
import { useTaxInvoices } from "@/hooks/useTaxInvoices";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate } from "@/lib/format";

const Shipments = () => {
  const { shipments, loading, error, refetch, updateStatus, deleteShipment } = useShipments();
  const { createInvoice } = useTaxInvoices();
  const { toast } = useToast();
  const { showError } = useModal();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaxInvoiceModalOpen, setIsTaxInvoiceModalOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | undefined>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_transit': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': "Kutilmoqda",
      'in_transit': "Yo'lda",
      'delivered': "Yetkazildi",
      'cancelled': "Bekor qilindi"
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle className="h-4 w-4" />;
    if (status === 'in_transit') return <Truck className="h-4 w-4" />;
    if (status === 'cancelled') return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate KPIs
  const pendingCount = shipments.filter(s => s.status === 'pending').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const totalShipments = shipments.length;

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
    try {
      await updateStatus(shipmentId, newStatus);
      refetch();
    } catch (error) {
      showError('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Yetkazib berishni o'chirishni xohlaysizmi?")) {
      try {
        await deleteShipment(id);
        toast({
          title: "Muvaffaqiyatli",
          description: "Yetkazib berish o'chirildi",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Yetkazib berishni o'chirishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateTaxInvoice = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setIsTaxInvoiceModalOpen(true);
  };

  const handleSaveTaxInvoice = async (data: any) => {
    try {
      await createInvoice(data);
      toast({
        title: "Muvaffaqiyatli",
        description: "Hisob-faktura yaratildi",
      });
      setIsTaxInvoiceModalOpen(false);
      setSelectedShipmentId(undefined);
      // Navigate to tax invoices page
      navigate('/sales/tax-invoices');
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Hisob-fakturani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePrint = (shipment: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Yuk xati ${shipment.shipmentNumber}</title>
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
          .summary-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; }
          .signature { display: flex; justify-content: space-between; margin-top: 40px; }
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
          <h1>YUK XATI (НАКЛАДНАЯ)</h1>
          <p>№ ${shipment.shipmentNumber}</p>
          <p>Sana: ${formatDate(shipment.shipmentDate)}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Mijoz:</div>
            <div class="info-value">${shipment.customerName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Buyurtma №:</div>
            <div class="info-value">${shipment.orderNumber}</div>
          </div>
          ${shipment.receiver ? `
          <div class="info-item">
            <div class="info-label">Yuk qabul qiluvchi:</div>
            <div class="info-value">${shipment.receiver}</div>
          </div>
          ` : ''}
          ${shipment.organization ? `
          <div class="info-item">
            <div class="info-label">Tashkilot:</div>
            <div class="info-value">${shipment.organization}</div>
          </div>
          ` : ''}
          <div class="info-item">
            <div class="info-label">Ombor:</div>
            <div class="info-value">${shipment.warehouseName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Yetkazib berish manzili:</div>
            <div class="info-value">${shipment.deliveryAddress}</div>
          </div>
          ${shipment.trackingNumber ? `
          <div class="info-item">
            <div class="info-label">Kuzatuv raqami:</div>
            <div class="info-value">${shipment.trackingNumber}</div>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Mahsulot</th>
              <th class="text-right">Miqdor</th>
              <th class="text-right">Narx</th>
              <th class="text-right">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${shipment.items.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row total">
            <span>Jami summa:</span>
            <span>${formatCurrency(shipment.totalAmount)}</span>
          </div>
          <div class="summary-row">
            <span>To'langan:</span>
            <span>${formatCurrency(shipment.paidAmount)}</span>
          </div>
          <div class="summary-row">
            <span>Qoldiq:</span>
            <span>${formatCurrency(shipment.totalAmount - shipment.paidAmount)}</span>
          </div>
        </div>

        ${shipment.notes ? `
        <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 5px;">
          <strong>Izoh:</strong><br>
          ${shipment.notes}
        </div>
        ` : ''}

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Topshiruvchi</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Qabul qiluvchi</div>
          </div>
        </div>

        <div class="footer">
          <p style="text-align: center; color: #666; font-size: 12px;">
            Chop etilgan: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}
          </p>
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

  if (loading && shipments.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Yetkazib berish</h1>
            <p className="text-gray-600 mt-1">Mijozlarga yetkazib berishni kuzatish</p>
          </div>
          <ExportButton
            data={filteredShipments}
            filename="yetkazish"
            fieldsToInclude={["shipmentNumber", "customerName", "shipmentDate", "trackingNumber", "totalAmount", "status"]}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kutilmoqda</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yo'lda</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{inTransitCount}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yetkazildi</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{deliveredCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalShipments}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Yetkazib berish raqami, mijoz yoki kuzatuv raqami bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Shipments Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raqam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">To'landi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Yetkazib berish topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{shipment.shipmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{shipment.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{shipment.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(shipment.shipmentDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(shipment.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={shipment.paidAmount >= shipment.totalAmount ? 'text-green-600 font-medium' : 'text-orange-600'}>
                          {formatCurrency(shipment.paidAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                          {getStatusIcon(shipment.status)}
                          {getStatusLabel(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTaxInvoice(shipment._id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            title="Hisob-faktura yaratish"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Hisob-faktura
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(shipment)}
                            className="text-gray-600"
                            title="Chop etish"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {shipment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(shipment._id, 'in_transit')}
                              className="text-blue-600"
                              title="Yo'lga chiqarish"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          {shipment.status === 'in_transit' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(shipment._id, 'delivered')}
                              className="text-green-600"
                              title="Yetkazildi"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {shipment.status !== 'delivered' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(shipment._id, 'cancelled')}
                              className="text-red-600"
                              title="Bekor qilish"
                            >
                              <XCircle className="h-4 w-4" />
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

      <TaxInvoiceModal
        open={isTaxInvoiceModalOpen}
        onClose={() => {
          setIsTaxInvoiceModalOpen(false);
          setSelectedShipmentId(undefined);
        }}
        onSave={handleSaveTaxInvoice}
        shipmentId={selectedShipmentId}
      />
    </Layout>
  );
};

export default Shipments;
