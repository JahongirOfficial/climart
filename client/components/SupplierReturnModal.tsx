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
import { useProducts } from "@/hooks/useProducts";
import { Combobox } from "@/components/ui/combobox";

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
  receipt?: any | null;
}

export function SupplierReturnModal({ open, onClose, onSave, receipt }: SupplierReturnModalProps) {
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "brak",
    notes: "",
  });
  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }
  ]);

  useEffect(() => {
    if (open && receipt) {
      // Pre-fill from receipt
      const supplierId = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier._id;
      const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
      
      setFormData({
        supplier: supplierId,
        supplierName: supplierName,
        returnDate: new Date().toISOString().split('T')[0],
        reason: "brak",
        notes: "",
      });

      // Pre-fill items from receipt
      setItems(receipt.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: 1,
        costPrice: item.costPrice,
        total: item.costPrice,
      })));
    } else if (!open) {
      setFormData({
        supplier: "",
        supplierName: "",
        returnDate: new Date().toISOString().split('T')[0],
        reason: "brak",
        notes: "",
      });
      setItems([{ product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }]);
    }
  }, [open, receipt]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData({
      ...formData,
      supplier: supplierId,
      supplierName: supplier?.name || "",
    });
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product: productId,
        productName: product.name,
        costPrice: product.costPrice || 0,
        total: newItems[index].quantity * (product.costPrice || 0),
      };
      setItems(newItems);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tovar qaytarish</DialogTitle>
          <DialogDescription>
            Yetkazib beruvchiga tovarlarni qaytarish va ombor zaxirasini kamaytirish
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1">
          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Yetkazib beruvchi *</Label>
            <Combobox
              options={suppliers.map(s => ({
                label: s.name,
                value: s._id
              }))}
              value={formData.supplier}
              onValueChange={handleSupplierChange}
              placeholder="Yetkazib beruvchini tanlang..."
              searchPlaceholder="Qidirish..."
              emptyText="Yetkazib beruvchi topilmadi"
            />
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
              <Combobox
                options={[
                  { label: 'Brak (ishlamaydi)', value: 'brak' },
                  { label: 'Nuqson (yoriq, singan)', value: 'nuqson' },
                  { label: 'Noto\'g\'ri model', value: 'noto\'g\'ri_model' },
                  { label: 'Boshqa sabab', value: 'boshqa' }
                ]}
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
                placeholder="Sabab tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Sabab topilmadi"
              />
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
                        <Combobox
                          options={products.map(p => ({
                            label: p.name,
                            value: p._id
                          }))}
                          value={item.product}
                          onValueChange={(value) => handleProductChange(index, value)}
                          placeholder="Mahsulot tanlang..."
                          searchPlaceholder="Qidirish..."
                          emptyText="Mahsulot topilmadi"
                          className="w-full"
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
