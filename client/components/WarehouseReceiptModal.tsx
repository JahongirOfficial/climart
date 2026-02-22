import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WarehouseReceipt, Product } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { api } from "@/lib/api";

interface WarehouseReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  receipt?: WarehouseReceipt;
}

interface ReceiptItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export const WarehouseReceiptModal = ({ open, onClose, onSuccess, receipt }: WarehouseReceiptModalProps) => {
  const { toast } = useToast();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouse: "",
    organization: "",
    receiptDate: new Date().toISOString().split('T')[0],
    reason: "" as "" | "inventory_adjustment" | "found_items" | "production" | "other",
    notes: "",
  });

  // Sabablar ro'yxati: tannarx avtomatik 0 bo'lishi kerak
  const zeroCostReasons = ["inventory_adjustment", "found_items", "production"];
  const isZeroCostReason = zeroCostReasons.includes(formData.reason);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    if (receipt) {
      setFormData({
        warehouse: (typeof receipt.warehouse === 'object' && receipt.warehouse ? receipt.warehouse._id : receipt.warehouse) as string,
        organization: receipt.organization || "",
        receiptDate: receipt.receiptDate.split('T')[0],
        reason: receipt.reason,
        notes: receipt.notes || "",
      });
      setItems(receipt.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        total: item.total,
      })));
    } else {
      setFormData({
        warehouse: "",
        organization: "",
        receiptDate: new Date().toISOString().split('T')[0],
        reason: "",
        notes: "",
      });
      setItems([]);
    }
  }, [receipt, open]);

  const addItem = () => {
    setItems([...items, {
      product: "",
      productName: "",
      quantity: 1,
      costPrice: 0,
      total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Update product name when product is selected
    if (field === 'product') {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index].productName = product.name;
        // Agar sabab inventarizatsiya/topilgan/ishlab chiqarish bo'lsa, tannarx 0
        newItems[index].costPrice = isZeroCostReason ? 0 : product.costPrice;
      }
    }

    // Recalculate total
    if (field === 'quantity' || field === 'costPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].costPrice;
    }

    setItems(newItems);
  };

  // Sabab o'zgarganda barcha itemlarning tannarxini 0 ga tushirish
  const handleReasonChange = (value: any) => {
    setFormData({ ...formData, reason: value });
    if (zeroCostReasons.includes(value) && items.length > 0) {
      setItems(items.map(item => ({
        ...item,
        costPrice: 0,
        total: 0,
      })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot qo'shing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        items,
        status: 'draft',
      };

      const url = receipt ? `/api/warehouse-receipts/${receipt._id}` : "/api/warehouse-receipts";

      if (receipt) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }

      toast({
        title: receipt ? "Kirim yangilandi" : "Kirim yaratildi",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {receipt ? "Kirimni tahrirlash" : "Yangi kirim"}
          </DialogTitle>
          <DialogDescription>
            Omborga mahsulot kirimini ro'yxatdan o'tkazing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Ombor *</Label>
              <Select
                value={formData.warehouse}
                onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
                disabled={!!receipt}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Omborni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptDate">Sana *</Label>
              <Input
                id="receiptDate"
                type="date"
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Tashkilot nomi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Sabab</Label>
              <Select
                value={formData.reason}
                onValueChange={handleReasonChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sababni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory_adjustment">Inventarizatsiya to'g'rilash</SelectItem>
                  <SelectItem value="found_items">Topilgan tovarlar</SelectItem>
                  <SelectItem value="production">Ishlab chiqarish</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mahsulotlar *</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Mahsulot qo'shish
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Miqdor</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tannarx</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Jami</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                        Mahsulot qo'shilmagan
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <Select
                            value={item.product}
                            onValueChange={(value) => updateItem(index, 'product', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product._id} value={product._id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.costPrice || ''}
                            onChange={(e) => updateItem(index, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {new Intl.NumberFormat('uz-UZ').format(item.total)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">Jami:</td>
                    <td className="px-3 py-2 text-right font-bold">
                      {new Intl.NumberFormat('uz-UZ').format(totalAmount)} so'm
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Izohlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Qo'shimcha ma'lumotlar..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
