import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerInvoice } from "@shared/api";
import { X, Calendar, User, FileText, DollarSign, Printer, Download, FileCheck } from "lucide-react";
import { printCustomerReceipt, printWarehouseReceipt, printBothReceipts } from "@/utils/print";

interface ViewInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: CustomerInvoice | null;
}

export const ViewInvoiceModal = ({ open, onClose, invoice }: ViewInvoiceModalProps) => {
  if (!invoice) return null;

  const remainingBalance = invoice.totalAmount - invoice.paidAmount;
  const statusColors = {
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    unpaid: "To'lanmagan",
    partial: "Qisman to'langan",
    paid: "To'langan",
    cancelled: "Bekor qilingan"
  };

  const handleDualPrint = () => {
    printBothReceipts(invoice);
  };

  const handleCustomerPrint = () => {
    printCustomerReceipt(invoice);
  };

  const handleWarehousePrint = () => {
    printWarehouseReceipt(invoice);
  };

  const handleExportPDF = () => {
    handleDualPrint();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Hisob-faktura #{invoice.invoiceNumber}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCustomerPrint} title="Mijoz cheki">
                <Printer className="h-4 w-4 mr-2" />
                Mijoz
              </Button>
              <Button variant="outline" size="sm" onClick={handleWarehousePrint} title="Ombor cheki">
                <FileCheck className="h-4 w-4 mr-2" />
                Ombor
              </Button>
              <Button variant="default" size="sm" onClick={handleDualPrint} title="Ikkala chekni chop etish">
                <Printer className="h-4 w-4 mr-2" />
                Ikkalasi
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
              {statusLabels[invoice.status]}
            </span>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Mijoz</p>
                <p className="font-semibold">{invoice.customerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Hisob-faktura sanasi</p>
                <p className="font-semibold">
                  {new Date(invoice.invoiceDate).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">To'lov muddati</p>
                <p className="font-semibold">
                  {new Date(invoice.dueDate).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Yaratilgan sana</p>
                <p className="font-semibold">
                  {new Date(invoice.createdAt).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>

            {invoice.organization && (
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Tashkilot</p>
                  <p className="font-semibold">{invoice.organization}</p>
                </div>
              </div>
            )}

            {invoice.warehouseName && (
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ombor</p>
                  <p className="font-semibold">{invoice.warehouseName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-3">Tovarlar</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mahsulot</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Miqdor</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Narx</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {new Intl.NumberFormat('uz-UZ').format(item.sellingPrice)} so'm
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {new Intl.NumberFormat('uz-UZ').format(item.total)} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jami summa:</span>
                <span className="text-lg font-semibold">
                  {new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount)} so'm
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">To'langan:</span>
                <span className="text-lg font-semibold text-green-600">
                  {new Intl.NumberFormat('uz-UZ').format(invoice.paidAmount)} so'm
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-900 font-semibold">Qoldiq:</span>
                <span className={`text-xl font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {new Intl.NumberFormat('uz-UZ').format(remainingBalance)} so'm
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Izoh:</p>
              <p className="text-sm text-blue-800">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
