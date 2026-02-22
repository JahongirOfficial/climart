import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import {
  Loader2, Plus, Trash2, AlertTriangle, X, Printer, ChevronDown,
  Save
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { StatusBadge, SHIPMENT_STATUS_CONFIG } from "@/components/shared/StatusBadge";

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
  const { products } = useProducts();
  const { showWarning, showError } = useModal();

  const [formData, setFormData] = useState({
    order: orderId || "",
    orderNumber: "",
    customer: "",
    customerName: "",
    warehouse: "",
    warehouseName: "",
    receiver: "",
    organization: "",
    shipmentDate: new Date().toISOString().split('T')[0],
    deliveryAddress: "",
    trackingNumber: "",
    notes: "",
    allowNegativeStock: false
  });

  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        const warehouseVal = order.warehouse
          ? (typeof order.warehouse === 'string' ? order.warehouse : order.warehouse._id)
          : '';
        setFormData(prev => ({
          ...prev,
          order: order._id,
          orderNumber: order.orderNumber,
          customer: typeof order.customer === 'string' ? order.customer : order.customer?._id || '',
          customerName: order.customerName,
          warehouse: warehouseVal,
          warehouseName: order.warehouseName || '',
        }));
        setItems(order.items.map(item => ({
          product: typeof item.product === 'string' ? item.product : item.product?._id || '',
          productName: item.productName,
          totalQuantity: item.quantity,
          price: item.price,
          total: item.total,
          warehouses: []
        })));
      }
    }
  }, [orderId, orders, open]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setFormData({
        order: orderId || "",
        orderNumber: "",
        customer: "",
        customerName: "",
        warehouse: "",
        warehouseName: "",
        receiver: "",
        organization: "",
        shipmentDate: new Date().toISOString().split('T')[0],
        deliveryAddress: "",
        trackingNumber: "",
        notes: "",
        allowNegativeStock: false
      });
      setItems([]);
    }
  }, [open, orderId]);

  const handleOrderChange = (selectedOrderId: string) => {
    const order = orders.find(o => o._id === selectedOrderId);
    if (order) {
      const warehouseVal = order.warehouse
        ? (typeof order.warehouse === 'string' ? order.warehouse : order.warehouse._id)
        : '';
      setFormData(prev => ({
        ...prev,
        order: order._id,
        orderNumber: order.orderNumber,
        customer: typeof order.customer === 'string' ? order.customer : order.customer?._id || '',
        customerName: order.customerName,
        warehouse: warehouseVal,
        warehouseName: order.warehouseName || '',
      }));
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
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
      if (field === 'warehouse') {
        const warehouse = warehouses.find(w => w._id === value);
        if (warehouse) {
          newItems[itemIndex].warehouses[warehouseIndex].warehouseName = warehouse.name;
          const product = products.find(p => p._id === newItems[itemIndex].product);
          const warehouseStock = product?.stockByWarehouse?.find(sw => sw.warehouse === value);
          newItems[itemIndex].warehouses[warehouseIndex].availableStock = warehouseStock
            ? warehouseStock.quantity - (warehouseStock.reserved || 0)
            : 0;
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
      for (const warehouse of item.warehouses) {
        if (!warehouse.warehouse) {
          showWarning(`${item.productName} uchun ombor tanlanmagan!`);
          return false;
        }
        if (warehouse.quantity <= 0) {
          showWarning(`${item.productName} uchun miqdor kiritilmagan!`);
          return false;
        }
        if (!formData.allowNegativeStock && warehouse.availableStock !== undefined && warehouse.quantity > warehouse.availableStock) {
          showWarning(`${item.productName} uchun ${warehouse.warehouseName} omborida yetarli mahsulot yo'q! Mavjud: ${warehouse.availableStock}, Kerak: ${warehouse.quantity}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.order || !formData.deliveryAddress || !formData.warehouse || items.length === 0) {
      showWarning("Iltimos, barcha majburiy maydonlarni to'ldiring (buyurtma, ombor, manzil)!");
      return;
    }

    if (!validateAllocations()) return;

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
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    } finally {
      setSaving(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'confirmed' || (o.status as string) === 'pending');
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0">
        <VisuallyHidden><DialogTitle>Yangi jo'natish</DialogTitle></VisuallyHidden>
        {/* ===== TOOLBAR ===== */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Saqlash
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onClose} disabled={saving}>
            <X className="h-3.5 w-3.5" />
            Yopish
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          {/* Chop etish dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled>
                <Printer className="h-3.5 w-3.5" />
                Chop etish
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem disabled>
                <Printer className="h-4 w-4 mr-2" />
                Yuk xati
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Holat */}
          <StatusBadge status="pending" config={SHIPMENT_STATUS_CONFIG} />
        </div>

        {/* ===== CONTENT ===== */}
        <div className="overflow-y-auto max-h-[calc(95vh-52px)] p-4 space-y-4">
          {/* Header row */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-gray-800">Yangi jo'natish</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{new Date().toLocaleDateString('uz-UZ')}</span>
          </div>

          {/* ===== 3-USTUNLI FORMA ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ustun 1: Buyurtma va mijoz */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Buyurtma *</Label>
                <select
                  value={formData.order}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
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
                <Label className="text-xs text-gray-500">Kontragent</Label>
                <Input
                  value={formData.customerName}
                  readOnly
                  className="h-9 text-sm bg-gray-50"
                  placeholder="Buyurtma tanlang"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Yuk qabul qiluvchi</Label>
                <Input
                  value={formData.receiver}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Qabul qiluvchi shaxs"
                />
              </div>
            </div>

            {/* Ustun 2: Ombor, sana, manzil */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Ombor *</Label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => {
                    const wh = warehouses.find(w => w._id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      warehouse: e.target.value,
                      warehouseName: wh?.name || '',
                    }));
                  }}
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
                  required
                >
                  <option value="">Tanlang...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Jo'natish sanasi *</Label>
                <Input
                  type="date"
                  value={formData.shipmentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Yetkazib berish manzili *</Label>
                <Input
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="To'liq manzilni kiriting"
                  required
                />
              </div>
            </div>

            {/* Ustun 3: Tashkilot, kuzatuv, izoh */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Tashkilot</Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Tashkilot nomi"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kuzatuv raqami</Label>
                <Input
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Masalan: TRK123456"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Izoh</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Minusga sotish */}
          <div className="flex items-center space-x-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
            <Checkbox
              id="allowNegativeStock"
              checked={formData.allowNegativeStock}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowNegativeStock: checked as boolean }))}
            />
            <Label htmlFor="allowNegativeStock" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
              Minusga sotishga ruxsat berish
            </Label>
          </div>

          {/* ===== POZITSIYALAR JADVALI ===== */}
          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">№</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-20">Kerak</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Narx</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Summa</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Omborlar</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, itemIndex) => {
                    const allocated = getAllocatedQuantity(item);
                    const isComplete = isItemFullyAllocated(item);
                    const remaining = item.totalQuantity - allocated;

                    return (
                      <tr key={itemIndex} className="align-top">
                        <td className="px-3 py-2 text-gray-400">{itemIndex + 1}</td>
                        <td className="px-3 py-2 font-medium">{item.productName}</td>
                        <td className="px-3 py-2 text-right">{item.totalQuantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            {item.warehouses.map((warehouse, warehouseIndex) => (
                              <div key={warehouseIndex} className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1">
                                <select
                                  value={warehouse.warehouse}
                                  onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'warehouse', e.target.value)}
                                  className="flex-1 h-7 px-2 text-xs border border-gray-300 rounded bg-white"
                                >
                                  <option value="">Ombor...</option>
                                  {warehouses.map(w => (
                                    <option key={w._id} value={w._id}>
                                      {w.name}
                                    </option>
                                  ))}
                                </select>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.totalQuantity}
                                  value={warehouse.quantity || ''}
                                  onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-16 h-7 text-xs text-center"
                                  placeholder="0"
                                />
                                {warehouse.warehouse && warehouse.availableStock !== undefined && (
                                  <span className={`text-[10px] whitespace-nowrap ${
                                    !formData.allowNegativeStock && warehouse.quantity > warehouse.availableStock
                                      ? 'text-red-600 font-medium'
                                      : 'text-gray-400'
                                  }`}>
                                    ({warehouse.availableStock})
                                  </span>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWarehouseFromItem(itemIndex, warehouseIndex)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addWarehouseToItem(itemIndex)}
                              className="h-6 text-xs text-blue-600 hover:text-blue-800 gap-1 px-2"
                            >
                              <Plus className="h-3 w-3" />
                              Ombor
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                            {allocated}/{item.totalQuantity}
                          </div>
                          {!isComplete && (
                            <div className="text-[10px] text-red-500">
                              -{remaining}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary footer */}
                <tfoot className="bg-gray-50 border-t">
                  <tr className="text-sm">
                    <td colSpan={2} className="px-3 py-2 text-right text-gray-500">
                      Pozitsiyalar: {items.length}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{totalQuantity}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrency(totalAmount)}</td>
                    <td colSpan={2} className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {items.length === 0 && formData.order && (
            <div className="text-center py-8 text-gray-400 text-sm border rounded-lg">
              Buyurtmada mahsulotlar topilmadi
            </div>
          )}

          {!formData.order && (
            <div className="text-center py-8 text-gray-400 text-sm border rounded-lg border-dashed">
              Jo'natish yaratish uchun buyurtmani tanlang
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
