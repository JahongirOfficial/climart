import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { useShipment } from "@/hooks/useShipment";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, AlertTriangle, ChevronDown, FileText,
} from "lucide-react";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, SHIPMENT_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['in_transit', 'cancelled'],
  'in_transit': ['delivered', 'cancelled'],
  'delivered': [],
  'cancelled': ['pending'],
};

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Kutilmoqda',
  'in_transit': "Yo'lda",
  'delivered': 'Yetkazildi',
  'cancelled': 'Bekor qilindi',
};

const ShipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const orderIdParam = urlParams.get('orderId') || '';

  const { shipment, loading, save, saving, updateStatus, deleteShipment, refetch } = useShipment(id);
  const { orders, loading: ordersLoading } = useCustomerOrders();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const nav = useDocumentNavigation('shipments', '/sales/shipments');

  const [formData, setFormData] = useState({
    order: orderIdParam,
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
    allowNegativeStock: false,
    currency: "UZS",
    exchangeRate: 1,
  });

  const [items, setItems] = useState<ShipmentItem[]>([]);

  // Mavjud jo'natishni yuklash
  useEffect(() => {
    if (shipment) {
      setFormData({
        order: typeof shipment.order === 'string' ? shipment.order : shipment.order?._id || '',
        orderNumber: shipment.orderNumber || '',
        customer: typeof shipment.customer === 'string' ? shipment.customer : shipment.customer?._id || '',
        customerName: shipment.customerName || '',
        warehouse: typeof shipment.warehouse === 'string' ? shipment.warehouse : shipment.warehouse?._id || '',
        warehouseName: shipment.warehouseName || '',
        receiver: shipment.receiver || '',
        organization: shipment.organization || '',
        shipmentDate: new Date(shipment.shipmentDate).toISOString().split('T')[0],
        deliveryAddress: shipment.deliveryAddress || '',
        trackingNumber: shipment.trackingNumber || '',
        notes: shipment.notes || '',
        allowNegativeStock: false,
        currency: (shipment as any).currency || 'UZS',
        exchangeRate: (shipment as any).exchangeRate || 1,
      });
      setItems((shipment.items || []).map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        totalQuantity: item.quantity,
        price: item.price,
        total: item.total,
        warehouses: item.warehouseAllocations || [],
      })));
    }
  }, [shipment]);

  // URL dan orderId bo'lsa, buyurtmani yuklash
  useEffect(() => {
    if (isNew && orderIdParam && orders.length > 0 && !formData.orderNumber) {
      handleOrderChange(orderIdParam);
    }
  }, [orderIdParam, orders, isNew]);

  const handleOrderChange = (selectedOrderId: string) => {
    const order = orders.find(o => o._id === selectedOrderId);
    if (order) {
      const warehouseVal = order.warehouse
        ? (typeof order.warehouse === 'string' ? order.warehouse : order.warehouse._id)
        : '';
      setFormData(prev => ({
        ...prev,
        order: order._id, orderNumber: order.orderNumber,
        customer: typeof order.customer === 'string' ? order.customer : order.customer?._id || '',
        customerName: order.customerName,
        warehouse: warehouseVal, warehouseName: order.warehouseName || '',
      }));
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        totalQuantity: item.quantity, price: item.price, total: item.total,
        warehouses: [],
      })));
    }
  };

  const addWarehouseToItem = (itemIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex] = { ...newItems[itemIndex], warehouses: [...newItems[itemIndex].warehouses, { warehouse: "", warehouseName: "", quantity: 0, availableStock: 0 }] };
      return newItems;
    });
  };

  const removeWarehouseFromItem = (itemIndex: number, warehouseIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const newWarehouses = [...newItems[itemIndex].warehouses];
      newWarehouses.splice(warehouseIndex, 1);
      newItems[itemIndex] = { ...newItems[itemIndex], warehouses: newWarehouses };
      return newItems;
    });
  };

  const updateWarehouseAllocation = (itemIndex: number, warehouseIndex: number, field: keyof WarehouseAllocation, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const newWarehouses = [...newItems[itemIndex].warehouses];
      newWarehouses[warehouseIndex] = { ...newWarehouses[warehouseIndex], [field]: value };
      if (field === 'warehouse') {
        const warehouse = warehouses.find(w => w._id === value);
        if (warehouse) {
          newWarehouses[warehouseIndex].warehouseName = warehouse.name;
          const product = products.find(p => p._id === newItems[itemIndex].product);
          const warehouseStock = product?.stockByWarehouse?.find((sw: any) => sw.warehouse === value);
          newWarehouses[warehouseIndex].availableStock = warehouseStock ? warehouseStock.quantity - (warehouseStock.reserved || 0) : 0;
        }
      }
      newItems[itemIndex] = { ...newItems[itemIndex], warehouses: newWarehouses };
      return newItems;
    });
  };

  const getAllocatedQuantity = (item: ShipmentItem): number =>
    item.warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0);

  const isItemFullyAllocated = (item: ShipmentItem): boolean =>
    getAllocatedQuantity(item) === item.totalQuantity;

  const validateAllocations = (): boolean => {
    for (const item of items) {
      const allocated = getAllocatedQuantity(item);
      if (allocated !== item.totalQuantity) {
        showWarning(`${item.productName} uchun jami miqdor to'liq taqsimlanmagan! Kerak: ${item.totalQuantity}, Taqsimlangan: ${allocated}`);
        return false;
      }
      for (const warehouse of item.warehouses) {
        if (!warehouse.warehouse) { showWarning(`${item.productName} uchun ombor tanlanmagan!`); return false; }
        if (warehouse.quantity <= 0) { showWarning(`${item.productName} uchun miqdor kiritilmagan!`); return false; }
        if (!formData.allowNegativeStock && warehouse.availableStock !== undefined && warehouse.quantity > warehouse.availableStock) {
          showWarning(`${item.productName} uchun ${warehouse.warehouseName} omborida yetarli mahsulot yo'q!`);
          return false;
        }
      }
    }
    return true;
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.totalQuantity, 0), [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.order || !formData.deliveryAddress || !formData.warehouse || items.length === 0) {
      showWarning("Iltimos, barcha majburiy maydonlarni to'ldiring (buyurtma, ombor, manzil)!");
      return;
    }
    if (!validateAllocations()) return;
    try {
      const result = await save({
        ...formData,
        items: items.map(item => ({
          product: item.product, productName: item.productName,
          quantity: item.totalQuantity, price: item.price, total: item.total,
          warehouseAllocations: item.warehouses,
        })),
        totalAmount, paidAmount: 0, status: shipment?.status || 'pending',
      });
      if (isNew) {
        const newId = result._id || result.shipment?._id;
        if (newId) navigate(`/sales/shipments/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== STATUS =====
  const handleStatusChange = async (newStatus: string) => {
    try { await updateStatus(newStatus); refetch(); } catch { showError("Holatni o'zgartirishda xatolik"); }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Jo'natishni o'chirishni xohlaysizmi?")) return;
    try { await deleteShipment(); navigate('/sales/shipments'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printWaybill = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Yuk xati ${shipment?.shipmentNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    .signature{display:flex;justify-content:space-between;margin-top:40px}.signature-box{width:45%}
    .signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;text-align:center}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">YUK XATI</h1><p>${shipment?.shipmentNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.shipmentDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Mijoz:</div><div class="info-value">${formData.customerName}</div></div>
    <div class="info-item"><div class="info-label">Buyurtma №:</div><div class="info-value">${formData.orderNumber}</div></div>
    ${formData.receiver ? `<div class="info-item"><div class="info-label">Yuk qabul qiluvchi:</div><div class="info-value">${formData.receiver}</div></div>` : ''}
    <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>
    <div class="info-item"><div class="info-label">Manzil:</div><div class="info-value">${formData.deliveryAddress}</div></div>
    ${formData.trackingNumber ? `<div class="info-item"><div class="info-label">Kuzatuv raqami:</div><div class="info-value">${formData.trackingNumber}</div></div>` : ''}
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.totalQuantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="margin-top:20px"><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px"><span>Jami summa:</span><span>${formatCurrency(totalAmount)}</span></div></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    <div class="signature"><div class="signature-box"><div class="signature-line">Topshiruvchi</div></div><div class="signature-box"><div class="signature-line">Qabul qiluvchi</div></div></div>
    </body></html>`;
    printViaIframe(html);
  };

  const currentStatus = shipment?.status || 'pending';
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'confirmed' || (o.status as string) === 'pending');

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Jo'natish"
      documentNumber={shipment?.shipmentNumber}
      documentDate={shipment?.shipmentDate}
      isNew={isNew}
      listUrl="/sales/shipments"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={shipment?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      createActions={!isNew ? [
        { label: "Hisob-faktura yaratish", icon: <FileText className="h-4 w-4" />, onClick: () => navigate(`/sales/tax-invoices/new?shipmentId=${id}`) },
      ] : undefined}

      printActions={[
        { label: "Yuk xati", onClick: printWaybill },
      ]}

      statusBadge={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1">
              <StatusBadge status={currentStatus} config={SHIPMENT_STATUS_CONFIG} />
              {availableTransitions.length > 0 && <ChevronDown className="h-3 w-3 text-gray-400" />}
            </button>
          </DropdownMenuTrigger>
          {availableTransitions.length > 0 && (
            <DropdownMenuContent>
              {availableTransitions.map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                  <StatusBadge status={s} config={SHIPMENT_STATUS_CONFIG} className="mr-2" />
                  {STATUS_LABELS[s] || s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      }

      formFields={
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
            {/* 1-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Buyurtma</Label>
                <select value={formData.order} onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1"
                  required disabled={ordersLoading || (!!shipment && !isNew)}>
                  <option value="">Tanlang...</option>
                  {pendingOrders.map(order => (
                    <option key={order._id} value={order._id}>{order.orderNumber} - {order.customerName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kontragent</Label>
                <Input value={formData.customerName} readOnly className="h-9 text-sm bg-gray-50 mt-1" placeholder="Buyurtma tanlang" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Yuk qabul qiluvchi</Label>
                <Input value={formData.receiver} onChange={(e) => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
                  className="h-9 text-sm mt-1" placeholder="Qabul qiluvchi shaxs" />
              </div>
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Ombor</Label>
                <select value={formData.warehouse} onChange={(e) => {
                  const wh = warehouses.find(w => w._id === e.target.value);
                  setFormData(prev => ({ ...prev, warehouse: e.target.value, warehouseName: wh?.name || '' }));
                }} className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1" required>
                  <option value="">Tanlang...</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">* Jo'natish sanasi</Label>
                <Input type="date" value={formData.shipmentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                  className="h-9 text-sm mt-1" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">* Yetkazib berish manzili</Label>
                <Input value={formData.deliveryAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="h-9 text-sm mt-1" placeholder="To'liq manzilni kiriting" required />
              </div>
            </div>

            {/* 3-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Tashkilot</Label>
                <Input value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  className="h-9 text-sm mt-1" placeholder="Tashkilot nomi" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kuzatuv raqami</Label>
                <Input value={formData.trackingNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="h-9 text-sm mt-1" placeholder="Masalan: TRK123456" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Valyuta</Label>
                <CurrencySelector
                  value={formData.currency}
                  onValueChange={(code, rate) =>
                    setFormData(prev => ({ ...prev, currency: code, exchangeRate: rate }))
                  }
                  className="h-9 text-sm mt-1"
                />
              </div>
              {formData.currency !== 'UZS' && (
                <div>
                  <Label className="text-xs text-gray-500">Kurs (1 {formData.currency} = ? so'm)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))}
                    className="h-9 text-sm mt-1"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Izoh</Label>
                <Textarea value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..." rows={2} className="text-sm mt-1" />
              </div>
            </div>
          </div>

          {/* Minusga sotish */}
          <div className="flex items-center space-x-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
            <Checkbox id="allowNegativeStock" checked={formData.allowNegativeStock}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowNegativeStock: checked as boolean }))} />
            <Label htmlFor="allowNegativeStock" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
              Minusga sotishga ruxsat berish
            </Label>
          </div>
        </div>
      }

      itemsTable={
        items.length > 0 ? (
          <>
            <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Pozitsiyalar ({items.length})</span>
            </div>
            <div className="overflow-x-auto">
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
                                <select value={warehouse.warehouse}
                                  onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'warehouse', e.target.value)}
                                  className="flex-1 h-7 px-2 text-xs border border-gray-300 rounded bg-white">
                                  <option value="">Ombor...</option>
                                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                                <Input type="number" min="0" max={item.totalQuantity}
                                  value={warehouse.quantity || ''}
                                  onChange={(e) => updateWarehouseAllocation(itemIndex, warehouseIndex, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-16 h-7 text-xs text-center" placeholder="0" />
                                {warehouse.warehouse && warehouse.availableStock !== undefined && (
                                  <span className={`text-[10px] whitespace-nowrap ${
                                    !formData.allowNegativeStock && warehouse.quantity > warehouse.availableStock
                                      ? 'text-red-600 font-medium' : 'text-gray-400'
                                  }`}>({warehouse.availableStock})</span>
                                )}
                                <Button type="button" variant="ghost" size="sm"
                                  onClick={() => removeWarehouseFromItem(itemIndex, warehouseIndex)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="ghost" size="sm"
                              onClick={() => addWarehouseToItem(itemIndex)}
                              className="h-6 text-xs text-blue-600 hover:text-blue-800 gap-1 px-2">
                              <Plus className="h-3 w-3" /> Ombor
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                            {allocated}/{item.totalQuantity}
                          </div>
                          {!isComplete && <div className="text-[10px] text-red-500">-{remaining}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr className="text-sm">
                    <td colSpan={2} className="px-3 py-2 text-right text-gray-500">Pozitsiyalar: {items.length}</td>
                    <td className="px-3 py-2 text-right font-medium">{totalQuantity}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatCurrencyAmount(totalAmount, formData.currency)}
                      {formData.currency !== 'UZS' && (
                        <div className="text-xs font-normal text-gray-500">
                          {formatCurrency(Math.round(totalAmount * formData.exchangeRate))}
                        </div>
                      )}
                    </td>
                    <td colSpan={2} className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm border-b">
            {formData.order ? 'Buyurtmada mahsulotlar topilmadi' : "Jo'natish yaratish uchun buyurtmani tanlang"}
          </div>
        )
      }
    />
  );
};

export default ShipmentDetail;
