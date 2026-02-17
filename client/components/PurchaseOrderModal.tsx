import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { PurchaseOrder } from "@shared/api";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  order?: PurchaseOrder | null;
}

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export const PurchaseOrderModal = ({ open, onClose, onSave, order }: PurchaseOrderModalProps) => {
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { products } = useProducts();
  const { showWarning, showError } = useModal();

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    orderDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const [items, setItems] = useState<OrderItem[]>([
    { productName: "", quantity: 1, price: 0, total: 0 }
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        supplier: typeof order.supplier === 'string' ? order.supplier : order.supplier._id,
        supplierName: order.supplierName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        notes: order.notes || ""
      });
      setItems(order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })));
    } else {
      setFormData({
        supplier: "",
        supplierName: "",
        orderDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setItems([{ productName: "", quantity: 1, price: 0, total: 0 }]);
    }
  }, [order, open]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier: supplierId,
      supplierName: supplier?.name || ""
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }

    setItems(newItems);
  };

  const handleProductSelect = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productName: productName,
      price: product ? product.costPrice : 0
    };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productName: "", quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier || items.some(item => !item.productName || item.quantity <= 0 || item.price <= 0)) {
      showWarning("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      await onSave({
        ...formData,
        items,
        totalAmount,
        status: order ? order.status : 'pending'
      });

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? "Buyurtmani tahrirlash" : "Yangi buyurtma yaratish"}
          </DialogTitle>
          <DialogDescription>
            {order ? "Buyurtma ma'lumotlarini o'zgartiring" : "Yetkazib beruvchiga yangi buyurtma yarating"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Yetkazib beruvchi *</Label>
              <Combobox
                options={suppliers.map(s => ({
                  value: s._id,
                  label: s.name,
                  description: s.phone ? `Tel: ${s.phone}` : undefined,
                  keywords: `${s.name} ${s.phone || ''} ${s.email || ''}`
                }))}
                value={formData.supplier}
                onValueChange={handleSupplierChange}
                placeholder="Yetkazib beruvchini tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Yetkazib beruvchi topilmadi"
                disabled={suppliersLoading}
              />
            </div>

            <div>
              <Label htmlFor="orderDate">Buyurtma sanasi *</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tovarlar *</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Tovar qo'shish
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-5">
                    <Label className="text-xs">Mahsulot nomi</Label>
                    <Combobox
                      options={products.map(p => ({ value: p.name, label: p.name }))}
                      value={item.productName}
                      onValueChange={(value) => handleProductSelect(index, value)}
                      placeholder="Mahsulot qidiring..."
                      emptyText="Mahsulot topilmadi"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Miqdor</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      placeholder="0"
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Narx</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.price || ''}
                      placeholder="0"
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Jami</Label>
                    <Input
                      type="text"
                      value={new Intl.NumberFormat('uz-UZ').format(item.total)}
                      readOnly
                      className="text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 no-scale"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Jami summa:</span>
                <span className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                </span>
              </div>
            </div>
          </div>

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
                order ? "Saqlash" : "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
