import { useState, useEffect, useMemo } from "react";
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
import { Plus, Trash2, Loader2, Package } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Combobox } from "@/components/ui/combobox";
import { formatCurrency } from "@/lib/format";

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
  const { warehouses } = useWarehouses();
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    warehouse: "",
    warehouseName: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "brak",
    notes: "",
  });
  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }
  ]);

  useEffect(() => {
    if (open && receipt) {
      const supplierId = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier._id;
      const supplierName = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier.name;
      const warehouseId = typeof receipt.warehouse === 'string' ? receipt.warehouse : receipt.warehouse?._id || '';
      const warehouseName = receipt.warehouseName || (typeof receipt.warehouse === 'object' ? receipt.warehouse?.name : '') || '';

      setFormData({
        supplier: supplierId,
        supplierName: supplierName,
        warehouse: warehouseId,
        warehouseName: warehouseName,
        returnDate: new Date().toISOString().split('T')[0],
        reason: "brak",
        notes: "",
      });

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
        warehouse: "",
        warehouseName: "",
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

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData({
      ...formData,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || "",
    });
  };

  // Get available stock for a product in the selected warehouse
  const getAvailableStock = (productId: string): number | null => {
    if (!productId || !formData.warehouse) return null;
    const product = products.find(p => p._id === productId);
    if (!product?.stockByWarehouse) return null;
    const warehouseStock = product.stockByWarehouse.find(
      (sw: any) => sw.warehouse === formData.warehouse || sw.warehouse?._id === formData.warehouse
    );
    return warehouseStock ? warehouseStock.quantity - (warehouseStock.reserved || 0) : 0;
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

    if (!formData.warehouse) {
      showWarning("Omborni tanlang");
      return;
    }

    if (items.some(item => !item.product || item.quantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring");
      return;
    }

    // Check stock availability
    for (const item of items) {
      const available = getAvailableStock(item.product);
      if (available !== null && item.quantity > available) {
        const product = products.find(p => p._id === item.product);
        showWarning(`${product?.name || 'Mahsulot'} uchun omborda yetarli miqdor yo'q (mavjud: ${available}, kerak: ${item.quantity})`);
        return;
      }
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
          {/* Supplier & Warehouse */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="warehouse">Ombor *</Label>
              <Combobox
                options={warehouses.filter(w => w.isActive).map(w => ({
                  label: w.name,
                  value: w._id
                }))}
                value={formData.warehouse}
                onValueChange={handleWarehouseChange}
                placeholder="Omborni tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Ombor topilmadi"
              />
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
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Mahsulot</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Miqdor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tan narx</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Jami</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {items.map((item, index) => {
                    const availableStock = getAvailableStock(item.product);
                    const isOverStock = availableStock !== null && item.quantity > availableStock;

                    return (
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
                          {availableStock !== null && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isOverStock ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              <Package className="h-3 w-3" />
                              Mavjud: {availableStock} dona
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className={`w-24 text-sm ${isOverStock ? 'border-red-400 focus:ring-red-400' : ''}`}
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
                          {formatCurrency(item.total)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jami summa:</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(calculateTotal())}
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
