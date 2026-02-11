import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Loader2 } from "lucide-react";

interface ShipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  orderId?: string;
}

export const ShipmentModal = ({ open, onClose, onSave, orderId }: ShipmentModalProps) => {
  const { orders, loading: ordersLoading } = useCustomerOrders();
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { showWarning, showError } = useModal();

  const [formData, setFormData] = useState({
    order: orderId || "",
    orderNumber: "",
    customer: "",
    customerName: "",
    receiver: "",
    organization: "",
    warehouse: "",
    warehouseName: "",
    shipmentDate: new Date().toISOString().split('T')[0],
    deliveryAddress: "",
    trackingNumber: "",
    notes: ""
  });

  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setFormData(prev => ({
          ...prev,
          order: order._id,
          orderNumber: order.orderNumber,
          customer: typeof order.customer === 'string' ? order.customer : order.customer._id,
          customerName: order.customerName,
        }));
        setItems(order.items.map(item => ({
          product: typeof item.product === 'string' ? item.product : item.product._id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })));
      }
    }
  }, [orderId, orders, open]);

  const handleOrderChange = (selectedOrderId: string) => {
    const order = orders.find(o => o._id === selectedOrderId);
    if (order) {
      setFormData(prev => ({
        ...prev,
        order: order._id,
        orderNumber: order.orderNumber,
        customer: typeof order.customer === 'string' ? order.customer : order.customer._id,
        customerName: order.customerName,
      }));
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })));
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.order || !formData.warehouse || !formData.deliveryAddress || items.length === 0) {
      showWarning("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      await onSave({
        ...formData,
        items,
        totalAmount,
        paidAmount: 0,
        status: 'pending'
      });

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi yetkazib berish yaratish</DialogTitle>
          <DialogDescription>
            Buyurtmadan yetkazib berish yarating
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order">Buyurtma *</Label>
              <select
                id="order"
                value={formData.order}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={ordersLoading || !!orderId}
              >
                <option value="">Tanlang...</option>
                {pendingOrders.map(order => (
                  <option key={order._id} value={order._id}>
                    {order.orderNumber} - {order.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="warehouse">Ombor *</Label>
              <select
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={warehousesLoading}
              >
                <option value="">Tanlang...</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiver">Yuk qabul qiluvchi</Label>
              <Input
                id="receiver"
                type="text"
                value={formData.receiver}
                onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
                placeholder="Qabul qiluvchi shaxs"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipmentDate">Yetkazib berish sanasi *</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={formData.shipmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="trackingNumber">Kuzatuv raqami</Label>
              <Input
                id="trackingNumber"
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Masalan: TRK123456"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryAddress">Yetkazib berish manzili *</Label>
            <Input
              id="deliveryAddress"
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
              placeholder="To'liq manzilni kiriting"
              required
            />
          </div>

          {items.length > 0 && (
            <div>
              <Label>Mahsulotlar</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Miqdor</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Narx</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('uz-UZ').format(item.price)} so'm</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{new Intl.NumberFormat('uz-UZ').format(item.total)} so'm</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-right">Jami:</td>
                      <td className="px-4 py-2 text-sm font-bold text-right">
                        {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

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
                "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
