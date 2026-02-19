import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePartners } from "@/hooks/usePartners";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { CustomerInvoice } from "@shared/api";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";

interface CustomerInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  invoice?: CustomerInvoice | null;
}

interface InvoiceItem {
  product: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  discount: number;
  discountAmount: number;
  total: number;
  warehouse: string;
  warehouseName: string;
}

export const CustomerInvoiceModal = ({ open, onClose, onSave, invoice }: CustomerInvoiceModalProps) => {
  const { partners, loading: partnersLoading } = usePartners('customer');
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { orders } = useCustomerOrders();
  const { showWarning, showError } = useModal();

  const [showOrderSelect, setShowOrderSelect] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [creditInfo, setCreditInfo] = useState<{ hasCreditLimit: boolean; creditLimit: number; currentDebt: number; available: number } | null>(null);

  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    organization: "",
    warehouse: "",
    warehouseName: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ""
  });

  const emptyItem: InvoiceItem = { product: "", productName: "", quantity: 1, sellingPrice: 0, costPrice: 0, discount: 0, discountAmount: 0, total: 0, warehouse: "", warehouseName: "" };

  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        customer: (typeof invoice.customer === 'object' && invoice.customer ? invoice.customer._id : invoice.customer) as string,
        customerName: invoice.customerName,
        organization: invoice.organization || "",
        warehouse: (typeof invoice.warehouse === 'object' && invoice.warehouse ? invoice.warehouse._id : invoice.warehouse) as string || "",
        warehouseName: invoice.warehouseName || "",
        invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        notes: invoice.notes || ""
      });
      setItems(invoice.items.map(item => ({
        product: (typeof item.product === 'object' && item.product ? item.product._id : item.product) as string,
        productName: item.productName,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        discount: item.discount || 0,
        discountAmount: item.discountAmount || 0,
        total: item.total,
        warehouse: (typeof item.warehouse === 'object' && item.warehouse ? item.warehouse._id : item.warehouse) as string || "",
        warehouseName: item.warehouseName || ""
      })));
    } else {
      setFormData({
        customer: "",
        customerName: "",
        organization: "",
        warehouse: "",
        warehouseName: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ""
      });
      setItems([{ ...emptyItem }]);
    }
  }, [invoice, open]);

  const handleCustomerChange = async (customerId: string) => {
    const customer = partners.find(p => p._id === customerId);
    setFormData(prev => ({
      ...prev,
      customer: customerId,
      customerName: customer?.name || ""
    }));

    // Fetch credit limit info
    if (customerId) {
      try {
        const res = await fetch(`/api/customer-invoices/credit-check/${customerId}`);
        if (res.ok) {
          setCreditInfo(await res.json());
        }
      } catch { setCreditInfo(null); }
    } else {
      setCreditInfo(null);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || ""
    }));

    // Auto-set warehouse for all items that don't have one
    setItems(items.map(item => ({
      ...item,
      warehouse: item.warehouse || warehouseId,
      warehouseName: item.warehouseName || (warehouse?.name || "")
    })));
  };

  const handleLoadFromOrder = () => {
    if (!selectedOrder) {
      showWarning("Iltimos, buyurtmani tanlang!");
      return;
    }

    const order = orders.find(o => o._id === selectedOrder);
    if (!order) return;

    // Load customer info
    setFormData(prev => ({
      ...prev,
      customer: (typeof order.customer === 'object' && order.customer ? order.customer._id : order.customer) as string,
      customerName: order.customerName,
    }));

    // Load items from order
    const orderItems: InvoiceItem[] = order.items.map(oItem => {
      const prodId = (typeof oItem.product === 'object' && oItem.product ? oItem.product._id : oItem.product) as string;
      const product = products.find(p => p._id === prodId);
      return {
        product: prodId,
        productName: oItem.productName,
        quantity: oItem.quantity,
        sellingPrice: oItem.price,
        costPrice: product ? product.costPrice : 0,
        discount: 0,
        discountAmount: 0,
        total: oItem.total,
        warehouse: formData.warehouse,
        warehouseName: formData.warehouseName
      };
    });

    setItems(orderItems);
    setShowOrderSelect(false);
    setSelectedOrder("");
  };

  const recalcItemTotal = (item: InvoiceItem): InvoiceItem => {
    const subtotal = item.quantity * item.sellingPrice;
    const discountAmt = subtotal * (item.discount / 100);
    return { ...item, discountAmount: Math.round(discountAmt), total: Math.round(subtotal - discountAmt) };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'warehouse') {
      const warehouse = warehouses.find(w => w._id === value);
      newItems[index] = { ...newItems[index], warehouse: value.toString(), warehouseName: warehouse?.name || "" };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    if (field === 'quantity' || field === 'sellingPrice' || field === 'discount') {
      newItems[index] = recalcItemTotal(newItems[index]);
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
      sellingPrice: product ? product.sellingPrice : 0,
      costPrice: product ? product.costPrice : 0,
      warehouse: newItems[index].warehouse || formData.warehouse,
      warehouseName: newItems[index].warehouseName || formData.warehouseName
    };
    newItems[index] = recalcItemTotal(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem, warehouse: formData.warehouse, warehouseName: formData.warehouseName }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || items.some(item => !item.product || item.quantity <= 0 || item.sellingPrice <= 0)) {
      showWarning("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
      const discountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Remove empty warehouse field
      const dataToSave: any = {
        ...formData,
        items,
        totalAmount: subtotal,
        discountTotal,
        finalAmount: totalAmount,
        paidAmount: invoice ? invoice.paidAmount : 0,
        shippedAmount: invoice ? invoice.shippedAmount : 0,
        status: invoice ? invoice.status : 'unpaid',
        shippedStatus: invoice ? invoice.shippedStatus : 'not_shipped'
      };

      // Remove warehouse if it's empty
      if (!dataToSave.warehouse) {
        delete dataToSave.warehouse;
        delete dataToSave.warehouseName;
      }

      await onSave(dataToSave);

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
            {invoice ? "Hisob-fakturani tahrirlash" : "Yangi hisob-faktura yaratish"}
          </DialogTitle>
          <DialogDescription>
            {invoice ? "Hisob-faktura ma'lumotlarini o'zgartiring" : "Mijozga yangi hisob-faktura yarating"}
          </DialogDescription>
        </DialogHeader>

        {!invoice && !showOrderSelect && (
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOrderSelect(true)}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Buyurtma asosida yaratish
            </Button>
          </div>
        )}

        {showOrderSelect && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <Label htmlFor="orderSelect">Buyurtmani tanlang</Label>
            <div className="flex gap-2 mt-2">
              <select
                id="orderSelect"
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tanlang...</option>
                {orders
                  .filter(o => o.status !== 'cancelled')
                  .map(order => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber} - {order.customerName} ({new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm)
                    </option>
                  ))}
              </select>
              <Button type="button" onClick={handleLoadFromOrder}>
                Yuklash
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowOrderSelect(false);
                setSelectedOrder("");
              }}>
                Bekor qilish
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Mijoz *</Label>
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
              {creditInfo?.hasCreditLimit && (
                <div className={`mt-1 text-xs px-2 py-1 rounded ${creditInfo.available > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  Kredit limit: {new Intl.NumberFormat('uz-UZ').format(creditInfo.creditLimit)} | Qarz: {new Intl.NumberFormat('uz-UZ').format(creditInfo.currentDebt)} | Mavjud: {new Intl.NumberFormat('uz-UZ').format(Math.max(0, creditInfo.available))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Tashkilot nomi..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouse">Ombor</Label>
              <select
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tanlang...</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="invoiceDate">Hisob-faktura sanasi *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">To'lov muddati *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
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

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs font-semibold">Mahsulot *</Label>
                      <select
                        value={item.product}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Mahsulotni tanlang...</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.quantity} {product.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4">
                      <Label className="text-xs font-semibold">Ombor *</Label>
                      <select
                        value={item.warehouse}
                        onChange={(e) => handleItemChange(index, 'warehouse', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Omborni tanlang...</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse._id} value={warehouse._id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        O'chirish
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold">Miqdor *</Label>
                      <Input
                        type="number"
                        step={products.find(p => p._id === item.product)?.unitType === 'uncount' ? "any" : "1"}
                        min="0"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm mt-1"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs font-semibold">Sotish narxi (dona) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.sellingPrice || ''}
                        onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className="text-sm mt-1"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs font-semibold">Chegirma %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount || ''}
                        onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="text-sm mt-1"
                        placeholder="0"
                      />
                    </div>

                    <div className="col-span-5">
                      <Label className="text-xs font-semibold">Jami</Label>
                      <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700 font-bold text-sm">
                        {item.discountAmount > 0 && (
                          <span className="text-red-500 text-xs line-through mr-2">
                            {new Intl.NumberFormat('uz-UZ').format(item.quantity * item.sellingPrice)}
                          </span>
                        )}
                        {new Intl.NumberFormat('uz-UZ').format(item.total)} so'm
                      </div>
                    </div>
                  </div>

                  {/* Stock hint */}
                  {item.product && item.warehouse && (
                    <div className="text-[10px] text-gray-500 flex gap-4">
                      <span>Ombordagi qoldiq:
                        <span className="font-bold ml-1">
                          {products.find(p => p._id === item.product)?.stockByWarehouse?.find((sw: any) => sw.warehouse === item.warehouse)?.quantity || 0}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div className="text-gray-600">
                  Jami <span className="font-bold text-gray-900">{items.length}</span> turdagi tovarlar
                </div>
                <div className="text-right space-y-1">
                  {items.some(item => item.discountAmount > 0) && (
                    <>
                      <div className="text-xs text-gray-500">
                        Summa: {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0))} so'm
                      </div>
                      <div className="text-xs text-red-500 font-semibold">
                        Chegirma: -{new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.discountAmount, 0))} so'm
                      </div>
                    </>
                  )}
                  <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold italic">Jami to'lov:</div>
                  <div className="text-2xl font-black text-primary">
                    {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                  </div>
                </div>
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
                invoice ? "Saqlash" : "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
