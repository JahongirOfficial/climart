import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PurchaseOrder } from "@shared/api";
import { Package, Calendar, User, FileText, DollarSign } from "lucide-react";

interface ViewOrderModalProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

export const ViewOrderModal = ({ open, onClose, order }: ViewOrderModalProps) => {
  if (!order) return null;

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Kutilmoqda";
      case "received": return "Qabul qilindi";
      case "cancelled": return "Bekor qilindi";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "received": return "bg-green-100 text-green-800 border-green-300";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const supplierName = typeof order.supplier === 'string' 
    ? order.supplierName 
    : (order.supplier?.name || order.supplierName || 'Noma\'lum');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buyurtma tafsilotlari</DialogTitle>
          <DialogDescription>
            Buyurtma haqida to'liq ma'lumot va tovarlar ro'yxati
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Buyurtma raqami</p>
              <p className="text-lg font-bold text-primary">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium border rounded ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Supplier and Date */}
          <div className="grid grid-cols-2 gap-4">
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
                <p className="text-sm text-gray-600">Buyurtma sanasi</p>
                <p className="font-semibold text-gray-900">{formatDate(order.orderDate)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Tovarlar ro'yxati</h3>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">№</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mahsulot</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Miqdor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Narx</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Jami summa:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Izoh</p>
                <p className="text-sm text-blue-800">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Yaratilgan</p>
              <p className="text-sm text-gray-700">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Oxirgi o'zgarish</p>
              <p className="text-sm text-gray-700">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
