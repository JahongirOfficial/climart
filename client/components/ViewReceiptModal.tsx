import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Receipt } from "@shared/api";
import { Package, Calendar, User, FileText, CheckCircle } from "lucide-react";

interface ViewReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const ViewReceiptModal = ({ open, onClose, receipt }: ViewReceiptModalProps) => {
  if (!receipt) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const supplierName = typeof receipt.supplier === 'string' ? receipt.supplierName : receipt.supplier.name;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Qabul qilish tafsilotlari</DialogTitle>
          <DialogDescription>
            Qabul qilingan tovarlar haqida to'liq ma'lumot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Qabul raqami</p>
              <p className="text-lg font-bold text-primary">{receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 border border-green-300 rounded">
                <CheckCircle className="h-4 w-4" />
                Qabul qilindi
              </span>
            </div>
          </div>

          {/* Supplier, Date and Order */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <User className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Yetkazib beruvchi</p>
                <p className="font-semibold text-gray-900">{supplierName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Qabul sanasi</p>
                <p className="font-semibold text-gray-900">{formatDate(receipt.receiptDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Buyurtma</p>
                <p className="font-semibold text-primary">{receipt.orderNumber || '-'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Qabul qilingan tovarlar</h3>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">№</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mahsulot</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Miqdor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Tan narx</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receipt.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.costPrice)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Jami summa:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                      {formatCurrency(receipt.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Izoh</p>
                <p className="text-sm text-blue-800">{receipt.notes}</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Eslatma:</strong> Ushbu tovarlar ombor zaxirasiga qo'shilgan va sotuvga tayyor.
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Yaratilgan</p>
              <p className="text-sm text-gray-700">{formatDate(receipt.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Oxirgi o'zgarish</p>
              <p className="text-sm text-gray-700">{formatDate(receipt.updatedAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
