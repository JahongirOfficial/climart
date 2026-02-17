import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useReceipts } from "@/hooks/useReceipts";

interface ReturnItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

interface SupplierReturnModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function SupplierReturnModal({ open, onClose, onSave }: SupplierReturnModalProps) {
  const { suppliers } = useSuppliers();
  const { receipts } = useReceipts();
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    receipt: "",
    receiptNumber: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "brak",
    notes: "",
  });
  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }
  ]);

  useEffect(() => {
    if (!open) {
      setFormData({
        supplier: "",
        supplierName: "",
        receipt: "",
        receiptNumber: "",
        returnDate: new Date().toISOString().split('T')[0],
        reason: "brak",
        notes: "",
      });
      setItems([{ product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }]);
    }
  }, [open]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData({
      ...formData,
      supplier: supplierId,
      supplierName: supplier?.name || "",
      receipt: "",
      receiptNumber: "",
    });
    setItems([{ product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }]);
  };

  const handleReceiptChange = (receiptId: string) => {
    const receipt = receipts.find(r => r._id === receiptId);
    if (receipt) {
      setFormData({
        ...formData,
        receipt: receiptId,
        receiptNumber: receipt.receiptNumber,
      });

      // Pre-fill items from receipt
      setItems(receipt.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: 1,
        costPrice: item.costPrice,
        total: item.costPrice,
      })));
    }
  };

  const handleItemChange = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'costPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].costPrice;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier) {
      showWarning("Yetkazib beruvchini tanlang");
      return;
    }

    if (items.some(item => !item.product || item.quantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          total: item.total,
        })),
        totalAmount: calculateTotal(),
      });
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setLoading(false);
    }
  };

  const supplierReceipts = receipts.filter(r =>
    (typeof r.supplier === 'string' ? r.supplier : r.supplier._id) === formData.supplier
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tovar qaytarish</DialogTitle>
          <DialogDescription>
            Yetkazib beruvchiga tovarlarni qaytarish va ombor zaxirasini kamaytirish
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier and Receipt */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Yetkazib beruvchi *</Label>
              <select
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Tanlang...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Qabul hujjati</Label>
              <select
                id="receipt"
                value={formData.receipt}
                onChange={(e) => handleReceiptChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!formData.supplier}
              >
                <option value="">Tanlang...</option>
                {supplierReceipts.map((receipt) => (
                  <option key={receipt._id} value={receipt._id}>
                    {receipt.receiptNumber} - {new Date(receipt.receiptDate).toLocaleDateString('uz-UZ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="returnDate">Qaytarish sanasi *</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Qaytarish sababi *</Label>
              <select
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="brak">Brak (ishlamaydi)</option>
                <option value="nuqson">Nuqson (yoriq, singan)</option>
                <option value="noto'g'ri_model">Noto'g'ri model</option>
                <option value="boshqa">Boshqa sabab</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Qaytariladigan tovarlar *</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Tovar qo'shish
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Mahsulot</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Miqdor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Tan narx</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Jami</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <Input
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          className="text-sm"
                          placeholder="Mahsulot nomi"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-24 text-sm"
                          placeholder="0"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.costPrice || ''}
                          onChange={(e) => handleItemChange(index, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-32 text-sm"
                          placeholder="0"
                          required
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        {new Intl.NumberFormat('uz-UZ').format(item.total)} so'm
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="p-1 rounded disabled:opacity-30 no-scale"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <span className="text-sm font-medium text-gray-700">Jami summa:</span>
              <span className="text-lg font-bold text-red-600">
                {new Intl.NumberFormat('uz-UZ').format(calculateTotal())} so'm
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Qaytarish sababi va qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 no-scale">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                'Qaytarish'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
