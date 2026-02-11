import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Writeoff } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Package } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";

interface WriteoffModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  writeoff?: Writeoff;
}

interface WriteoffItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export const WriteoffModal = ({ open, onClose, onSuccess, writeoff }: WriteoffModalProps) => {
  const { toast } = useToast();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouse: "",
    organization: "",
    writeoffDate: new Date().toISOString().split('T')[0],
    reason: "" as "" | "damaged" | "expired" | "lost" | "personal_use" | "inventory_shortage" | "other",
    notes: "",
  });
  const [items, setItems] = useState<WriteoffItem[]>([]);

  useEffect(() => {
    if (writeoff) {
      setFormData({
        warehouse: typeof writeoff.warehouse === 'string' ? writeoff.warehouse : writeoff.warehouse,
        organization: writeoff.organization || "",
        writeoffDate: writeoff.writeoffDate.split('T')[0],
        reason: writeoff.reason,
        notes: writeoff.notes || "",
      });
      setItems(writeoff.items.map(item => ({
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
        writeoffDate: new Date().toISOString().split('T')[0],
        reason: "",
        notes: "",
      });
      setItems([]);
    }
  }, [writeoff, open]);

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

  const updateItem = (index: number, field: keyof WriteoffItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product') {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].costPrice = product.costPrice;
      }
    }
    
    if (field === 'quantity' || field === 'costPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].costPrice;
    }
    
    setItems(newItems);
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

      const url = writeoff ? `/api/writeoffs/${writeoff._id}` : "/api/writeoffs";
      const method = writeoff ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save writeoff");
      }

      toast({
        title: writeoff ? "Hisobdan chiqarish yangilandi" : "Hisobdan chiqarish yaratildi",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {writeoff ? "Hisobdan chiqarishni tahrirlash" : "Yangi hisobdan chiqarish"}
          </DialogTitle>
          <DialogDescription>
            Ombordan mahsulotlarni hisobdan chiqarish
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse" className="text-sm font-medium">Ombor *</Label>
              <Select
                value={formData.warehouse}
                onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
                disabled={!!writeoff}
              >
                <SelectTrigger className="h-10">
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
              <Label htmlFor="writeoffDate" className="text-sm font-medium">Sana *</Label>
              <Input
                id="writeoffDate"
                type="date"
                value={formData.writeoffDate}
                onChange={(e) => setFormData({ ...formData, writeoffDate: e.target.value })}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-sm font-medium">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Tashkilot nomi"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">Sabab *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value: any) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sababni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Shikastlangan</SelectItem>
                  <SelectItem value="expired">Muddati o'tgan</SelectItem>
                  <SelectItem value="lost">Yo'qolgan</SelectItem>
                  <SelectItem value="personal_use">Shaxsiy ehtiyoj</SelectItem>
                  <SelectItem value="inventory_shortage">Inventarizatsiya kamomadi</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Mahsulotlar *</Label>
              <Button type="button" size="sm" onClick={addItem} className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Mahsulot qo'shish
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mahsulot
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Miqdor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tannarx
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jami
                      </th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Package className="h-12 w-12 text-gray-300 mb-2" />
                            <p>Mahsulot qo'shilmagan</p>
                            <p className="text-sm text-gray-400">Yuqoridagi tugma orqali mahsulot qo'shing</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3">
                            <Select
                              value={item.product}
                              onValueChange={(value) => updateItem(index, 'product', value)}
                            >
                              <SelectTrigger className="h-9 min-w-[200px]">
                                <SelectValue placeholder="Mahsulotni tanlang" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product._id} value={product._id}>
                                    <div className="flex flex-col">
                                      <span>{product.name}</span>
                                      <span className="text-xs text-gray-500">Qoldiq: {product.quantity}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-9 text-right w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) => updateItem(index, 'costPrice', parseFloat(e.target.value) || 0)}
                              className="h-9 text-right w-28"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {new Intl.NumberFormat('uz-UZ').format(item.total)} so'm
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 p-0 text-red-600 no-scale"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700">
                          Jami zarar:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 text-lg">
                          {new Intl.NumberFormat('uz-UZ').format(totalAmount)} so'm
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Izohlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Qo'shimcha ma'lumotlar..."
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-6">
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className="h-10 px-6">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
