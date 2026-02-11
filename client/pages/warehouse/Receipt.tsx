import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Loader2, Package, CheckCircle, FileText,
  Edit, Trash2, Check, Printer
} from "lucide-react";
import { useState } from "react";
import { useWarehouseReceipts } from "@/hooks/useWarehouseReceipts";
import { WarehouseReceiptModal } from "@/components/WarehouseReceiptModal";
import { WarehouseReceipt } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

const Receipt = () => {
  const { receipts, loading, refetch, confirmReceipt, deleteReceipt } = useWarehouseReceipts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceipt | undefined>();

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = 
      r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.warehouseName.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    if (!confirm(`${receiptNumber} kirimni tasdiqlaysizmi? Tasdiqlangandan keyin mahsulot miqdorlari yangilanadi.`)) return;
    
    try {
      await confirmReceipt(id);
      toast({
        title: "Kirim tasdiqlandi",
        description: "Mahsulot miqdorlari yangilandi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirimni tasdiqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, receiptNumber: string) => {
    if (!confirm(`${receiptNumber} kirimni o'chirmoqchimisiz?`)) return;
    
    try {
      await deleteReceipt(id);
      toast({
        title: "Kirim o'chirildi",
        description: "Ma'lumotlar muvaffaqiyatli o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kirimni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (receipt: WarehouseReceipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Chop etish
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Yopish
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
                            onClick={() => handlePrint(receipt)}
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
      </div>
    </Layout>
  );
};

export default Receipt;
