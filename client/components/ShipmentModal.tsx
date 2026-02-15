import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  orderId?: string;
}

interface WarehouseAllocation {
  warehouse: string;
  warehouseName: string;
  quantity: number;
  availableStock?: number;
}

interface ShipmentItem {
  product: string;
  productName: string;
  totalQuantity: number;
  price: number;
  total: number;
  warehouses: WarehouseAllocation[];
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
    shipmentDate: new Date().toISOString().split('T')[0],
    deliveryAddress: "",
    trackingNumber: "",
    notes: ""
  });

  const [items, setItems] = useState<ShipmentItem[]>([]);
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
        
        // Initialize items with empty warehouse allocations
        setItems(order.items.map(item => ({
          product: typeof item.product === 'string' ? item.product : item.product._id,
          productName: item.productName,
          totalQuantity: item.quantity,
          price: item.price,
          total: item.total,
          warehouses: []
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
        totalQuantity: item.quantity,
        price: item.price,
        total: item.total,
        warehouses: []
      })));
    }
  };

  const addWarehouseToItem = (itemIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex].warehouses.push({
        warehouse: "",
        warehouseName: "",
        quantity: 0,
        availableStock: 0
      });
      return newItems;
    });
  };

  const removeWarehouseFromItem = (itemIndex: number, warehouseIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex].warehouses.splice(warehouseIndex, 1);
      return newItems;
    });
  };

  const updateWarehouseAllocation = (
    itemIndex: number,
    warehouseIndex: number,
    field: keyof WarehouseAllocation,
    value: any
  ) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex].warehouses[warehouseIndex] = {
        ...newItems[itemIndex].warehouses[warehouseIndex],
        [field]: value
      };
      
      // If warehouse changed, update warehouse name
      if (field === 'warehouse') {
        const warehouse = warehouses.find(w => w._id === value);
        if (warehouse) {
          newItems[itemIndex].warehouses[warehouseIndex].warehouseName = warehouse.name;
          // TODO: Fetch available stock for this product in this warehouse
          // For now, set a placeholder
          newItems[itemIndex].warehouses[warehouseIndex].availableStock = 0;
        }
      }
      
      return newItems;
    });
  };

  const getAllocatedQuantity = (item: ShipmentItem): number => {
    return item.warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0);
  };

  const isItemFullyAllocated = (item: ShipmentItem): boolean => {
    return getAllocatedQuantity(item) === item.totalQuantity;
  };

  const validateAllocations = (): boolean => {
    for (const item of items) {
      const allocated = getAllocatedQuantity(item);
      if (allocated !== item.totalQuantity) {
        showWarning(`${item.productName} uchun jami miqdor to'liq taqsimlanmagan! Kerak: ${item.totalQuantity}, Taqsimlangan: ${allocated}`);
        return false;
      }
      
      // Check if any warehouse is not selected
      for (const warehouse of item.warehouses) {
        if (!warehouse.warehouse) {
          showWarning(`${item.productName} uchun ombor tanlanmagan!`);
          return false;
        }
        if (warehouse.quantity <= 0) {
          showWarning(`${item.productName} uchun miqdor kiritilmagan!`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.order || !formData.deliveryAddress || items.length === 0) {
      showWarning("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    if (!validateAllocations()) {
      return;
    }

    setSaving(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      await onSave({
        ...formData,
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          quantity: item.totalQuantity,
          price: item.price,
          total: item.total,
          warehouseAllocations: item.warehouses
        })),
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi yetkazib berish yaratish</DialogTitle>
          <DialogDescription>
            Buyurtmadan yetkazib berish yarating va har bir mahsulot uchun omborlarni tanlang
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
              <Label htmlFor="shipmentDate">Yetkazib berish sanasi *</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={formData.shipmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                required
              />
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

          {items.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Mahsulotlar va omborlar</Label>
              
              {items.map((item, itemIndex) => {
                const allocated = getAllocatedQuantity(item);
                const remaining = item.totalQuantity - allocated;
                const isComplete = isItemFullyAllocated(item);
                
                return (
                  <div key={itemIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-gray-500">
                          Jami kerak: {item.totalQuantity} dona | 
                          Narx: {new Intl.NumberFormat('uz-UZ').format(item.price)} so'm
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                          Taqsimlangan: {allocated} / {item.totalQuantity}
                        </div>
                        {!isComplete && (
                          <div className="text-xs text-red-600">
                            Qolgan: {remaining} dona
                          </div>
                        )}
                      </div>
                    </div>

                    {!isComplete && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Ushbu mahsulot uchun omborlardan jami {item.totalQuantity} dona taqsimlash kerak
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      {item.warehouses.map((warehouse, warehouseIndex) => (
                        <div key={warehouseIndex} className="flex gap-2 items-end bg-gray-50 p-3 rounded">
                          <div className="flex-1">
                            <Label className="text-xs">Ombor</Label>
                            <select
                              value={warehouse.warehouse}
                              onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'warehouse', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              required
                            >
                              <option value="">Tanlang...</option>
                              {warehouses.map(w => (
                                <option key={w._id} value={w._id}>
                                  {w.name} ({w.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="w-32">
                            <Label className="text-xs">Miqdor</Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.totalQuantity}
                              value={warehouse.quantity || ''}
                              onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'quantity', parseInt(e.target.value) || 0)}
                              className="text-sm"
                              placeholder="0"
                              required
                            />
                          </div>

                          {warehouse.availableStock !== undefined && (
                            <div className="w-32 text-xs text-gray-600">
                              Mavjud: {warehouse.availableStock}
                            </div>
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWarehouseFromItem(itemIndex, warehouseIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addWarehouseToItem(itemIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ombor qo'shish
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Jami summa:</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                  </span>
                </div>
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
