import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Plus, Trash2, AlertCircle, Percent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PriceListModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  priceList?: any;
}

interface PriceListItem {
  product: string;
  productName: string;
  sku?: string;
  unit: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
}

export const PriceListModal = ({ open, onClose, onSave, priceList }: PriceListModalProps) => {
  const { products } = useProducts();

  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    validFrom: new Date().toISOString().split('T')[0],
    validTo: "",
    markupPercent: "",
    notes: "",
    status: "draft" as 'draft' | 'active' | 'archived'
  });

  const [items, setItems] = useState<PriceListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (open && priceList) {
      setFormData({
        name: priceList.name || "",
        organization: priceList.organization || "",
        validFrom: priceList.validFrom?.split('T')[0] || new Date().toISOString().split('T')[0],
        validTo: priceList.validTo?.split('T')[0] || "",
        markupPercent: priceList.markupPercent?.toString() || "",
        notes: priceList.notes || "",
        status: priceList.status || "draft"
      });
      setItems(priceList.items || []);
      setSelectedProducts(priceList.items?.map((i: any) => i.product) || []);
    } else if (open) {
      setFormData({
        name: "",
        organization: "",
        validFrom: new Date().toISOString().split('T')[0],
        validTo: "",
        markupPercent: "",
        notes: "",
        status: "draft"
      });
      setItems([]);
      setSelectedProducts([]);
    }
    setErrors([]);
  }, [open, priceList]);

  const handleProductAdd = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product && !selectedProducts.includes(productId)) {
      const newItem: PriceListItem = {
        product: product._id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        oldPrice: product.sellingPrice,
        newPrice: product.sellingPrice,
        priceChange: 0
      };
      setItems([...items, newItem]);
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const newItems = [...items];
    const oldPrice = newItems[index].oldPrice;
    newItems[index].newPrice = newPrice;
    newItems[index].priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const productId = items[index].product;
    setItems(items.filter((_, i) => i !== index));
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };

  const handleApplyMarkup = () => {
    const markup = parseFloat(formData.markupPercent);
    if (isNaN(markup) || markup < 0) {
      setErrors(["Ustama foizi noto'g'ri kiritilgan"]);
      return;
    }

    const newItems = items.map(item => {
      const product = products.find(p => p._id === item.product);
      if (product) {
        const newPrice = Math.round(product.costPrice * (1 + markup / 100));
        return {
          ...item,
          newPrice,
          priceChange: item.oldPrice > 0 ? ((newPrice - item.oldPrice) / item.oldPrice) * 100 : 0
        };
      }
      return item;
    });

    setItems(newItems);
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push("Narxlar ro'yxati nomi kiritilmagan");
    }

    if (items.length === 0) {
      validationErrors.push("Kamida bitta mahsulot qo'shilishi kerak");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        markupPercent: formData.markupPercent ? parseFloat(formData.markupPercent) : undefined,
        items
      });
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Noma\'lum xatolik']);
    } finally {
      setSaving(false);
    }
  };

  const availableProducts = products
    .filter(p => !selectedProducts.includes(p._id))
    .map(p => ({
      value: p._id,
      label: `${p.name} (${p.sellingPrice.toLocaleString()} so'm)`
    }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {priceList ? "Narxlar ro'yxatini tahrirlash" : "Yangi narxlar ro'yxati"}
          </DialogTitle>
          <DialogDescription>
            Mahsulotlar va xizmatlar uchun narxlar ro'yxatini yarating
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
              <Label htmlFor="name">Nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Dilerlar uchun 2026-yil"
                required
              />
            </div>

            <div>
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Tashkilot nomi"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="validFrom">Amal qilish sanasi *</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="validTo">Tugash sanasi</Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="markupPercent">Ustama foizi (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="markupPercent"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.markupPercent}
                  placeholder="0"
                  onChange={(e) => setFormData(prev => ({ ...prev, markupPercent: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyMarkup}
                  disabled={!formData.markupPercent || items.length === 0}
                  title="Barcha mahsulotlarga ustama qo'llash"
                >
                  <Percent className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Mahsulotlar *</Label>
              <div className="flex gap-2 items-center">
                <Combobox
                  options={availableProducts}
                  value=""
                  onValueChange={handleProductAdd}
                  placeholder="Mahsulot qo'shish..."
                  searchPlaceholder="Qidirish..."
                  emptyText="Mahsulot topilmadi"
                />
              </div>
            </div>

            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium">№</th>
                      <th className="text-left p-2 text-sm font-medium">Mahsulot</th>
                      <th className="text-left p-2 text-sm font-medium">Artikul</th>
                      <th className="text-left p-2 text-sm font-medium">O'lchov</th>
                      <th className="text-right p-2 text-sm font-medium">Eski narx</th>
                      <th className="text-right p-2 text-sm font-medium">Yangi narx</th>
                      <th className="text-center p-2 text-sm font-medium">Farq (%)</th>
                      <th className="text-center p-2 text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-sm">{index + 1}</td>
                        <td className="p-2 text-sm font-medium">{item.productName}</td>
                        <td className="p-2 text-sm text-muted-foreground">{item.sku || '-'}</td>
                        <td className="p-2 text-sm">{item.unit}</td>
                        <td className="p-2 text-sm text-right">{item.oldPrice.toLocaleString()}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.newPrice || ''}
                            placeholder="0"
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            className="text-sm text-right"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={item.priceChange > 0 ? "default" : item.priceChange < 0 ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {item.priceChange > 0 && '+'}
                            {item.priceChange.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Mahsulot qo'shish uchun yuqoridagi qidiruvdan foydalaning
                </AlertDescription>
              </Alert>
            )}
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
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
