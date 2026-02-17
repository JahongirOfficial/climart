import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CustomerReturnModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

interface ReturnItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  maxQuantity: number;
}

export const CustomerReturnModal = ({ open, onClose, onSave }: CustomerReturnModalProps) => {
  const { invoices, loading: invoicesLoading } = useCustomerInvoices();
  const { warehouses } = useWarehouses();
  const { showWarning, showError } = useModal();

  const [formData, setFormData] = useState({
    invoice: "",
    invoiceNumber: "",
    customer: "",
    customerName: "",
    organization: "",
    warehouse: "",
    warehouseName: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "customer_request" as 'defective' | 'wrong_item' | 'customer_request' | 'other',
    notes: ""
  });

  const [items, setItems] = useState<ReturnItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        invoice: "",
        invoiceNumber: "",
        customer: "",
        customerName: "",
        organization: "",
        warehouse: "",
        warehouseName: "",
        returnDate: new Date().toISOString().split('T')[0],
        reason: "customer_request",
        notes: ""
      });
      setItems([]);
    }
  }, [open]);

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoice: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        customer: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer._id,
        customerName: invoice.customerName,
      }));

      // Initialize items from invoice
      setItems(invoice.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: 0,
        price: item.sellingPrice,
        total: 0,
        reason: 'customer_request' as const,
        maxQuantity: item.quantity
      })));
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || ""
    }));
  };

  const handleItemChange = (index: number, field: keyof ReturnItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity') {
      const qty = Math.min(Number(value), newItems[index].maxQuantity);
      newItems[index].quantity = qty;
      newItems[index].total = qty * newItems[index].price;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const returnItems = items.filter(item => item.quantity > 0);

    if (!formData.invoice || returnItems.length === 0) {
      showWarning("Iltimos, hisob-fakturani tanlang va qaytariladigan mahsulotlarni kiriting!");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = returnItems.reduce((sum, item) => sum + item.total, 0);

      await onSave({
        ...formData,
        items: returnItems,
        totalAmount,
        status: 'pending'
      });

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'partial');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mijozdan qaytarish</DialogTitle>
          <DialogDescription>
            Hisob-fakturadan mahsulot qaytarishni ro'yxatdan o'tkazing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice">Hisob-faktura *</Label>
              <select
                id="invoice"
                value={formData.invoice}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={invoicesLoading}
              >
                <option value="">Tanlang...</option>
                {paidInvoices.map(invoice => (
                  <option key={invoice._id} value={invoice._id}>
                    {invoice.invoiceNumber} - {invoice.customerName} ({new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount)} so'm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="returnDate">Qaytarish sanasi *</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouse">Ombor</Label>
              <select
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tanlang...</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Tashkilot nomi..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Qaytarish sababi *</Label>
            <select
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="defective">Nuqsonli mahsulot</option>
              <option value="wrong_item">Noto'g'ri mahsulot</option>
              <option value="customer_request">Mijoz talabi</option>
              <option value="other">Boshqa</option>
            </select>
          </div>

          {items.length > 0 && (
            <div>
              <Label>Qaytariladigan mahsulotlar *</Label>
              <div className="mt-2 space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-4">
                      <Label className="text-xs">Mahsulot</Label>
                      <Input
                        type="text"
                        value={item.productName}
                        readOnly
                        className="text-sm bg-gray-50"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Miqdor (max: {item.maxQuantity})</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.maxQuantity}
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Narx</Label>
                      <Input
                        type="text"
                        value={new Intl.NumberFormat('uz-UZ').format(item.price)}
                        readOnly
                        className="text-sm bg-gray-50"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Jami</Label>
                      <Input
                        type="text"
                        value={new Intl.NumberFormat('uz-UZ').format(item.total)}
                        readOnly
                        className="text-sm bg-gray-50"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Sabab</Label>
                      <select
                        value={item.reason}
                        onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                      >
                        <option value="defective">Nuqsonli</option>
                        <option value="wrong_item">Noto'g'ri</option>
                        <option value="customer_request">Mijoz</option>
                        <option value="other">Boshqa</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Jami qaytarish summasi:</span>
                  <span className="text-lg font-bold text-red-600">
                    {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
