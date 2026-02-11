import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePartners } from "@/hooks/usePartners";
import { useProducts } from "@/hooks/useProducts";
import { CustomerOrder } from "@shared/api";
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { PartnerModal } from "@/components/PartnerModal";

interface CustomerOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  order?: CustomerOrder | null;
}

interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export const CustomerOrderModal = ({ open, onClose, onSave, order }: CustomerOrderModalProps) => {
  const { partners, loading: partnersLoading, refetch: refetchPartners } = usePartners('customer');
  const { products } = useProducts();
  const { showWarning, showError } = useModal();
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ""
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: "", productName: "", quantity: 1, price: 0, total: 0 }
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        customer: typeof order.customer === 'string' ? order.customer : order.customer._id,
        customerName: order.customerName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        notes: order.notes || ""
      });
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })));
    } else {
      setFormData({
        customer: "",
        customerName: "",
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ""
      });
      setItems([{ product: "", productName: "", quantity: 1, price: 0, total: 0 }]);
    }
  }, [order, open]);

  const handleCustomerChange = (customerId: string) => {
    const customer = partners.find(p => p._id === customerId);
    setFormData(prev => ({
      ...prev,
      customer: customerId,
      customerName: customer?.name || ""
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

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product: productId,
      productName: product ? product.name : "",
      price: product ? product.sellingPrice : 0
    };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || items.some(item => !item.product || item.quantity <= 0 || item.price <= 0)) {
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
            {order ? "Buyurtma ma'lumotlarini o'zgartiring" : "Mijozdan yangi buyurtma yarating"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Mijoz *</Label>
              <div className="flex gap-2">
                <select
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={partnersLoading}
                >
                  <option value="">Tanlang...</option>
                  {partners.map(partner => (
                    <option key={partner._id} value={partner._id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPartnerModalOpen(true)}
                  title="Yangi mijoz qo'shish"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
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
            <Label htmlFor="deliveryDate">Yetkazib berish sanasi *</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              required
            />
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
                    <Label className="text-xs">Mahsulot</Label>
                    <select
                      value={item.product}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                      required
                    >
                      <option value="">Tanlang...</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.quantity} {product.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Miqdor</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
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
                      value={item.price}
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
                      className="text-sm bg-gray-50"
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

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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

      <PartnerModal
        open={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSuccess={() => {
          refetchPartners();
        }}
        initialType="customer"
      />
    </Dialog >
  );
};
