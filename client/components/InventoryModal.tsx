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
import { Loader2, Plus, Trash2, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

interface InventoryItem {
  product: string;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceAmount: number;
}

export const InventoryModal = ({ open, onClose, onSave }: InventoryModalProps) => {
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { products } = useProducts();
  const { showError } = useModal();

  const [formData, setFormData] = useState({
    warehouse: "",
    warehouseName: "",
    organization: "",
    inventoryDate: new Date().toISOString().split('T')[0],
    category: "",
    notes: ""
  });

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setFormData({
        warehouse: "",
        warehouseName: "",
        organization: "",
        inventoryDate: new Date().toISOString().split('T')[0],
        category: "",
        notes: ""
      });
      setItems([]);
      setErrors([]);
    }
  }, [open]);

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || ""
    }));
  };

  const handleFillByStock = () => {
    if (!formData.warehouse) {
      showError("Avval omborni tanlang!");
      return;
    }

    const warehouseProducts = products.filter(p => p.quantity > 0);
    const inventoryItems: InventoryItem[] = warehouseProducts.map(product => ({
      product: product._id,
      productName: product.name,
      systemQuantity: product.quantity,
      actualQuantity: product.quantity,
      difference: 0,
      costPrice: product.costPrice,
      differenceAmount: 0
    }));

    setItems(inventoryItems);
  };

  const handleActualQuantityChange = (index: number, actualQuantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    item.actualQuantity = actualQuantity;
    item.difference = actualQuantity - item.systemQuantity;
    item.differenceAmount = item.difference * item.costPrice;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      product: "",
      productName: "",
      systemQuantity: 0,
      actualQuantity: 0,
      difference: 0,
      costPrice: 0,
      differenceAmount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        product: productId,
        productName: product.name,
        systemQuantity: product.quantity,
        actualQuantity: 0,
        difference: -product.quantity,
        costPrice: product.costPrice,
        differenceAmount: -product.quantity * product.costPrice
      };
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];

    if (!formData.warehouse) {
      validationErrors.push("Ombor tanlanmagan");
    }

    if (items.length === 0) {
      validationErrors.push("Kamida bitta mahsulot qo'shilishi kerak");
    }

    if (items.some(item => !item.product)) {
      validationErrors.push("Barcha mahsulotlar tanlanishi kerak");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const totalShortage = items.filter(i => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.difference), 0);
      const totalSurplus = items.filter(i => i.difference > 0).reduce((sum, i) => sum + i.difference, 0);
      const shortageAmount = items.filter(i => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.differenceAmount), 0);
      const surplusAmount = items.filter(i => i.difference > 0).reduce((sum, i) => sum + i.differenceAmount, 0);

      await onSave({
        ...formData,
        items,
        totalShortage,
        totalSurplus,
        shortageAmount,
        surplusAmount,
        status: 'draft'
      });

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  const totals = {
    shortage: items.filter(i => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.difference), 0),
    surplus: items.filter(i => i.difference > 0).reduce((sum, i) => sum + i.difference, 0),
    shortageAmount: items.filter(i => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.differenceAmount), 0),
    surplusAmount: items.filter(i => i.difference > 0).reduce((sum, i) => sum + i.differenceAmount, 0),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventarizatsiya (Инвентаризация)</DialogTitle>
          <DialogDescription>
            Ombordagi mahsulotlarning haqiqiy miqdorini tizim qoldig'i bilan solishtiring
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="warehouse">Ombor *</Label>
              <Select value={formData.warehouse} onValueChange={handleWarehouseChange} disabled={warehousesLoading}>
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
              <Label htmlFor="inventoryDate">Sana *</Label>
              <Input
                id="inventoryDate"
                type="date"
                value={formData.inventoryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inventoryDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Tashkilot nomi"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Mahsulotlar *</Label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleFillByStock} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Qoldiqlar bo'yicha to'ldirish
                </Button>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Mahsulot qo'shish
                </Button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Mahsulot</th>
                      <th className="text-right p-2 font-medium">Tizimda</th>
                      <th className="text-right p-2 font-medium">Haqiqatda</th>
                      <th className="text-right p-2 font-medium">Farq</th>
                      <th className="text-right p-2 font-medium">Tannarx</th>
                      <th className="text-right p-2 font-medium">Summa</th>
                      <th className="text-center p-2 font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          {item.product ? (
                            <span className="text-sm">{item.productName}</span>
                          ) : (
                            <Select value={item.product} onValueChange={(value) => handleProductChange(index, value)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Tanlang..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product._id} value={product._id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="p-2 text-right">{item.systemQuantity}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.actualQuantity || ''}
                            onChange={(e) => handleActualQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="h-8 text-right text-xs"
                            placeholder="0"
                            required
                          />
                        </td>
                        <td className={`p-2 text-right font-medium ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : ''}`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </td>
                        <td className="p-2 text-right text-xs text-muted-foreground">
                          {new Intl.NumberFormat('uz-UZ').format(item.costPrice)}
                        </td>
                        <td className={`p-2 text-right font-medium ${item.differenceAmount < 0 ? 'text-red-600' : item.differenceAmount > 0 ? 'text-green-600' : ''}`}>
                          {item.differenceAmount > 0 ? '+' : ''}{new Intl.NumberFormat('uz-UZ').format(item.differenceAmount)}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">JAMI:</td>
                      <td className="p-2 text-right">
                        <span className="text-red-600">-{totals.shortage}</span>
                        {' / '}
                        <span className="text-green-600">+{totals.surplus}</span>
                      </td>
                      <td></td>
                      <td className="p-2 text-right">
                        <span className="text-red-600">-{new Intl.NumberFormat('uz-UZ').format(totals.shortageAmount)}</span>
                        {' / '}
                        <span className="text-green-600">+{new Intl.NumberFormat('uz-UZ').format(totals.surplusAmount)}</span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <p>Mahsulotlar qo'shilmagan</p>
                <p className="text-sm mt-1">Yuqoridagi tugmalardan birini bosing</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Qo'shimcha ma'lumot..."
              rows={2}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Inventarizatsiya tasdiqlangandan keyin kamomad va ortiqcha mahsulotlar uchun alohida hujjatlar yaratishingiz mumkin.
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
