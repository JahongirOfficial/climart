import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, Plus, Loader2, Package, CheckCircle, FileText,
  Edit, Trash2, Check, Printer
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useWarehouseReceipts } from "@/hooks/useWarehouseReceipts";
import { WarehouseReceiptModal } from "@/components/WarehouseReceiptModal";
import { WarehouseReceipt } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { printViaIframe } from "@/utils/print";

const Receipt = () => {
  const { receipts, loading, refetch, confirmReceipt, deleteReceipt } = useWarehouseReceipts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceipt | undefined>();
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<WarehouseReceipt | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<{ id: string; number: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [receiptToConfirm, setReceiptToConfirm] = useState<{ id: string; number: string } | null>(null);

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.warehouseName.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const draftReceipts = receipts.filter(r => r.status === 'draft');
  const confirmedReceipts = receipts.filter(r => r.status === 'confirmed');
  const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  const handleEdit = (receipt: WarehouseReceipt) => {
    if (receipt.status === 'confirmed') {
      toast({
        title: "Ogohlantirish",
        description: "Tasdiqlangan kirimni tahrirlash mumkin emas",
        variant: "destructive",
      });
      return;
    }
    setSelectedReceipt(receipt);
    setModalOpen(true);
  };

  const handleConfirm = async (id: string, receiptNumber: string) => {
    setReceiptToConfirm({ id, number: receiptNumber });
    setShowConfirmDialog(true);
  };

  const confirmReceiptAction = async () => {
    if (!receiptToConfirm) return;
    
    try {
      await confirmReceipt(receiptToConfirm.id);
      toast({
        title: "Kirim tasdiqlandi",
        description: "Mahsulot miqdorlari yangilandi",
      });
      setShowConfirmDialog(false);
      setReceiptToConfirm(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirimni tasdiqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, receiptNumber: string) => {
    setReceiptToDelete({ id, number: receiptNumber });
    setShowDeleteDialog(true);
  };

  const deleteReceiptAction = async () => {
    if (!receiptToDelete) return;
    
    try {
      await deleteReceipt(receiptToDelete.id);
      toast({
        title: "Kirim o'chirildi",
        description: "Ma'lumotlar muvaffaqiyatli o'chirildi",
      });
      setShowDeleteDialog(false);
      setReceiptToDelete(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirimni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handlePrintReceipt = (receipt: WarehouseReceipt) => {
    setReceiptToPrint(receipt);
    setShowPrintDialog(true);
  };

  const printSimpleReceipt = (receipt: WarehouseReceipt) => {
    const currentDate = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kirim cheki - ${receipt.receiptNumber}</title>
        <style>
          @media print {
            @page { margin: 10mm; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item-row {
            margin: 8px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-top: 2px;
          }
          .total {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">CLIMART ERP</div>
          <div>Kirim cheki</div>
          <div style="font-size: 10px; margin-top: 5px;">${currentDate}</div>
        </div>

        <div class="receipt-title">ODDIY CHECK</div>

        <div class="info-row">
          <span>Hujjat №:</span>
          <span><strong>${receipt.receiptNumber}</strong></span>
        </div>
        <div class="info-row">
          <span>Sana:</span>
          <span>${new Date(receipt.receiptDate).toLocaleDateString('uz-UZ')}</span>
        </div>
        <div class="info-row">
          <span>Ombor:</span>
          <span><strong>${receipt.warehouseName}</strong></span>
        </div>
        <div class="info-row">
          <span>Sabab:</span>
          <span>${getReasonLabel(receipt.reason)}</span>
        </div>

        <div class="items">
          ${receipt.items.map((item, index) => `
            <div class="item-row">
              <div class="item-name">${index + 1}. ${item.productName}</div>
              <div class="item-details">
                <span>${item.quantity} x ${new Intl.NumberFormat('uz-UZ').format(item.costPrice)} so'm</span>
                <span><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)} so'm</strong></span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="info-row">
            <span>JAMI SUMMA:</span>
            <span>${new Intl.NumberFormat('uz-UZ').format(receipt.totalAmount)} so'm</span>
          </div>
        </div>

        ${receipt.notes ? `
          <div style="margin-top: 15px; font-size: 11px;">
            <div><strong>Izoh:</strong></div>
            <div style="margin-top: 5px;">${receipt.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>Ombor kirim cheki</div>
        </div>
      </body>
      </html>
    `;

    printViaIframe(htmlContent);
    setShowPrintDialog(false);
  };

  const printDetailedReceipt = (receipt: WarehouseReceipt) => {
    const currentDate = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kirim dalolatnomasi - ${receipt.receiptNumber}</title>
        <style>
          @media print {
            @page { margin: 15mm; size: A4; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .document-title {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
          }
          .info-section {
            margin: 20px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-row {
            display: flex;
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            min-width: 150px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .total-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 2px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #fffbf0;
            border-left: 4px solid #ffc107;
          }
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">CLIMART ERP SYSTEM</div>
          <div style="font-size: 12px; color: #666;">Ombor boshqaruv tizimi</div>
          <div class="document-title">KIRIM DALOLATNOMASI</div>
          <div style="font-size: 11px; margin-top: 5px;">Chop etilgan: ${currentDate}</div>
        </div>

        <div class="info-section">
          <div>
            <div class="info-row">
              <span class="info-label">Hujjat raqami:</span>
              <span><strong>${receipt.receiptNumber}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Sana:</span>
              <span>${new Date(receipt.receiptDate).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ombor:</span>
              <span><strong>${receipt.warehouseName}</strong></span>
            </div>
          </div>
          <div>
            ${receipt.organization ? `
            <div class="info-row">
              <span class="info-label">Tashkilot:</span>
              <span>${receipt.organization}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Sabab:</span>
              <span>${getReasonLabel(receipt.reason)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Holat:</span>
              <span><strong>${receipt.status === 'confirmed' ? 'Tasdiqlangan' : 'Qoralama'}</strong></span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">№</th>
              <th>Mahsulot nomi</th>
              <th class="text-center" style="width: 100px;">Miqdor</th>
              <th class="text-right" style="width: 150px;">Tan narxi (so'm)</th>
              <th class="text-right" style="width: 150px;">Jami summa (so'm)</th>
            </tr>
          </thead>
          <tbody>
            ${receipt.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td><strong>${item.productName}</strong></td>
                <td class="text-center"><strong>${item.quantity}</strong></td>
                <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(item.costPrice)}</td>
                <td class="text-right"><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Jami mahsulotlar soni:</span>
            <span><strong>${receipt.items.reduce((sum, item) => sum + item.quantity, 0)} dona</strong></span>
          </div>
          <div class="total-row grand-total">
            <span>JAMI SUMMA:</span>
            <span>${new Intl.NumberFormat('uz-UZ').format(receipt.totalAmount)} so'm</span>
          </div>
        </div>

        ${receipt.notes ? `
          <div class="notes">
            <div style="font-weight: bold; margin-bottom: 5px;">📝 Izoh:</div>
            <div>${receipt.notes}</div>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Qabul qildi</div>
            <div class="signature-line">
              <div style="font-size: 10px; color: #666;">F.I.O. / Imzo</div>
            </div>
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Topshirdi</div>
            <div class="signature-line">
              <div style="font-size: 10px; color: #666;">F.I.O. / Imzo</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>Bu hujjat CLIMART ERP tizimi tomonidan avtomatik yaratilgan</div>
          <div style="margin-top: 5px;">Chop etilgan sana: ${currentDate}</div>
        </div>
      </body>
      </html>
    `;

    printViaIframe(htmlContent);
    setShowPrintDialog(false);
  };

  const handlePrint = (receipt: WarehouseReceipt) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kirim dalolatnomasi - ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; margin-bottom: 5px; }
            .info-label { font-weight: bold; width: 150px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>KIRIM DALOLATNOMASI</h1>
          <div class="info">
            <div class="info-row">
              <span class="info-label">Hujjat raqami:</span>
              <span>${receipt.receiptNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sana:</span>
              <span>${new Date(receipt.receiptDate).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ombor:</span>
              <span>${receipt.warehouseName}</span>
            </div>
            ${receipt.organization ? `
            <div class="info-row">
              <span class="info-label">Tashkilot:</span>
              <span>${receipt.organization}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Sabab:</span>
              <span>${getReasonLabel(receipt.reason)}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Mahsulot nomi</th>
                <th class="text-right">Miqdor</th>
                <th class="text-right">Tannarx</th>
                <th class="text-right">Jami</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.productName}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(item.costPrice)}</td>
                  <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(item.total)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4" class="text-right">JAMI:</td>
                <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(receipt.totalAmount)} so'm</td>
              </tr>
            </tbody>
          </table>

          ${receipt.notes ? `
          <div style="margin-top: 20px;">
            <strong>Izohlar:</strong>
            <p>${receipt.notes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 40px;">
            <p>Qabul qildi: ___________________ / ___________________</p>
            <p style="margin-top: 20px;">Topshirdi: ___________________ / ___________________</p>
          </div>
        </body>
      </html>
    `;

    printViaIframe(html);
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      inventory_adjustment: "Inventarizatsiya to'g'rilash",
      found_items: "Topilgan tovarlar",
      production: "Ishlab chiqarish",
      other: "Boshqa",
    };
    return labels[reason] || reason;
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedReceipt(undefined);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed') {
      return <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Qoralama</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
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

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kirim qilish</h1>
            <p className="text-gray-600 mt-1">Omborga tovar kiritish (manbasiz)</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi kirim
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qoralama</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{draftReceipts.length}</p>
              </div>
              <FileText className="h-10 w-10 text-gray-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasdiqlangan</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{confirmedReceipts.length}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami summa</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalAmount)}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hujjat raqami yoki ombor nomi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="confirmed">Tasdiqlangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raqam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ombor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sabab</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Kirimlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr key={receipt._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {receipt.receiptNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(receipt.receiptDate).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{receipt.warehouseName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {getReasonLabel(receipt.reason)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(receipt.totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm">{getStatusBadge(receipt.status)}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReceipt(receipt)}
                            title="Chop etish"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {receipt.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirm(receipt._id, receipt.receiptNumber)}
                                title="Tasdiqlash"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(receipt)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(receipt._id, receipt.receiptNumber)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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

        <WarehouseReceiptModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          receipt={selectedReceipt}
        />

        {/* Print Options Dialog */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Check chiqarish</DialogTitle>
              <DialogDescription>
                Qaysi turdagi check chiqarishni xohlaysiz?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <Button
                onClick={() => receiptToPrint && printSimpleReceipt(receiptToPrint)}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="flex items-start gap-3">
                  <Printer className="h-5 w-5 mt-1 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">Oddiy check</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Qisqa format - mahsulot nomlari, miqdor va narxlar
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => receiptToPrint && printDetailedReceipt(receiptToPrint)}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="flex items-start gap-3">
                  <Printer className="h-5 w-5 mt-1 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold">Batafsil dalolatnoma</div>
                    <div className="text-xs text-gray-500 mt-1">
                      To'liq format - barcha ma'lumotlar va imzo joylari
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => {
                  if (receiptToPrint) {
                    printSimpleReceipt(receiptToPrint);
                    setTimeout(() => printDetailedReceipt(receiptToPrint), 500);
                  }
                }}
                className="w-full justify-start h-auto py-4"
                variant="default"
              >
                <div className="flex items-start gap-3">
                  <Printer className="h-5 w-5 mt-1" />
                  <div className="text-left">
                    <div className="font-semibold">Ikkala checkni chiqarish</div>
                    <div className="text-xs text-white/80 mt-1">
                      Oddiy va batafsil formatlar
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Receipt Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kirimni tasdiqlash</AlertDialogTitle>
              <AlertDialogDescription>
                {receiptToConfirm?.number} kirimni tasdiqlaysizmi? Tasdiqlangandan keyin mahsulot miqdorlari yangilanadi va kirimni tahrirlash mumkin bo'lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReceiptAction}>
                Tasdiqlash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Receipt Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kirimni o'chirish</AlertDialogTitle>
              <AlertDialogDescription>
                {receiptToDelete?.number} kirimni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={deleteReceiptAction} className="bg-red-600 hover:bg-red-700">
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Receipt;
