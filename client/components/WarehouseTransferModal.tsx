import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WarehouseTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

interface TransferItem {
  product: string;
  productName: string;
  quantity: number;
  availableStock: number;
}

export const WarehouseTransferModal = ({ open, onClose, onSave }: WarehouseTransferModalProps) => {
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { products } = useProducts();
  const { showError } = useModal();

  const [formData, setFormData] = useState({
    sourceWarehouse: "",
    sourceWarehouseName: "",
    destinationWarehouse: "",
    destinationWarehouseName: "",
    transferDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const [items, setItems] = useState<TransferItem[]>([
    { product: "", productName: "", quantity: 0, availableStock: 0 }
  ]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setFormData({
        sourceWarehouse: "",
        sourceWarehouseName: "",
        destinationWarehouse: "",
        destinationWarehouseName: "",
        transferDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setItems([{ product: "", productName: "", quantity: 0, availableStock: 0 }]);
      setErrors([]);
    }
  }, [open]);

  const handleSourceWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      sourceWarehouse: warehouseId,
      sourceWarehouseName: warehouse?.name || ""
    }));
  };

  const handleDestinationWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      destinationWarehouse: warehouseId,
      destinationWarehouseName: warehouse?.name || ""
    }));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product: productId,
        productName: product.name,
        availableStock: product.quantity
      };
      setItems(newItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 0, availableStock: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];

    if (!formData.sourceWarehouse) {
      validationErrors.push("Manba ombor tanlanmagan");
    }

    if (!formData.destinationWarehouse) {
      validationErrors.push("Maqsad ombor tanlanmagan");
    }

    if (formData.sourceWarehouse === formData.destinationWarehouse) {
      validationErrors.push("Manba va maqsad omborlar bir xil bo'lishi mumkin emas");
    }

    if (items.some(item => !item.product)) {
      validationErrors.push("Barcha mahsulotlar tanlanishi kerak");
    }

    if (items.some(item => item.quantity <= 0)) {
      validationErrors.push("Mahsulot miqdori 0 dan katta bo'lishi kerak");
    }

    for (const item of items) {
      if (item.product && item.quantity > item.availableStock) {
        validationErrors.push(`${item.productName} uchun omborda yetarli mahsulot yo'q! Mavjud: ${item.availableStock}`);
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        items: items.map(({ availableStock, ...item }) => item),
        status: 'pending'
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
          <DialogTitle>Ko'chirish (Перемещение)</DialogTitle>
          <DialogDescription>
            Mahsulotlarni bir ombordan ikkinchisiga ko'chiring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sourceWarehouse">Qayerdan (Manba ombor) *</Label>
              <Select value={formData.sourceWarehouse} onValueChange={handleSourceWarehouseChange} disabled={warehousesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destinationWarehouse">Qayerga (Maqsad ombor) *</Label>
              <Select value={formData.destinationWarehouse} onValueChange={handleDestinationWarehouseChange} disabled={warehousesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="transferDate">Sana *</Label>
            <Input
              id="transferDate"
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData(prev => ({ ...prev, transferDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Mahsulotlar *</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Mahsulot qo'shish
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-8">
                    <Label className="text-xs">Mahsulot</Label>
                    <Select value={item.product} onValueChange={(value) => handleProductChange(index, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tanlang..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} (Mavjud: {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs">Miqdor</Label>
                    <Input
                      type="number"
                      min="0"
                      max={item.availableStock}
                      value={item.quantity || ''}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ko'chirish tasdiqlangandan keyin mahsulotlar manba ombordan kamayadi va maqsad omborga qo'shiladi.
            </AlertDescription>
          </Alert>

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
