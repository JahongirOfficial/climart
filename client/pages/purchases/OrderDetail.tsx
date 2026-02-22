import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { usePurchaseOrder } from "@/hooks/usePurchaseOrder";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, ChevronDown, Package,
} from "lucide-react";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, ORDER_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderItem {
  product?: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

const PURCHASE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Kutilmoqda",   color: "text-yellow-800", bg: "bg-yellow-100" },
  draft:     { label: "Qoralama",     color: "text-gray-800",   bg: "bg-gray-100" },
  confirmed: { label: "Tasdiqlangan", color: "text-blue-800",   bg: "bg-blue-100" },
  received:  { label: "Qabul qilingan", color: "text-green-800", bg: "bg-green-100" },
  cancelled: { label: "Bekor qilingan", color: "text-gray-800", bg: "bg-gray-100" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['confirmed', 'cancelled'],
  'draft': ['confirmed', 'cancelled'],
  'confirmed': ['received', 'cancelled'],
  'received': [],
  'cancelled': ['pending'],
};

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Kutilmoqda',
  'draft': 'Qoralama',
  'confirmed': 'Tasdiqlangan',
  'received': 'Qabul qilingan',
  'cancelled': 'Bekor qilingan',
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { order, loading, save, saving, updateStatus, deleteOrder, receive, refetch } = usePurchaseOrder(id);
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { products, refetch: refetchProducts } = useProducts();
  const nav = useDocumentNavigation('purchase-orders', '/purchases/orders');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    orderDate: new Date().toISOString().split('T')[0],
    notes: "",
    currency: "UZS",
    exchangeRate: 1,
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: undefined, productName: "", quantity: 1, price: 0, total: 0 },
  ]);

  // Mavjud buyurtmani yuklash
  useEffect(() => {
    if (order) {
      setFormData({
        supplier: typeof order.supplier === 'string' ? order.supplier : order.supplier._id,
        supplierName: order.supplierName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        notes: order.notes || "",
        currency: (order as any).currency || 'UZS',
        exchangeRate: (order as any).exchangeRate || 1,
      });
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })));
    }
  }, [order]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier: supplierId,
      supplierName: supplier?.name || "",
    }));
  };

  const handleProductSelect = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    const basePrice = product ? product.costPrice : 0;
    const docPrice = formData.currency === 'UZS' ? basePrice : Math.round((basePrice / formData.exchangeRate) * 100) / 100;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product: product?._id,
      productName,
      price: docPrice,
    };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: undefined, productName: "", quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.supplier) { showWarning("Yetkazib beruvchini tanlang!"); return; }
    if (items.some(item => !item.productName || item.quantity <= 0 || item.price <= 0)) {
      showWarning("Iltimos, barcha tovarlarni to'ldiring!"); return;
    }
    try {
      const result = await save({
        ...formData,
        items,
        totalAmount,
        status: order?.status || 'pending',
      });
      if (isNew) {
        const newId = result._id || result.order?._id;
        if (newId) navigate(`/purchases/orders/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== STATUS =====
  const handleStatusChange = async (newStatus: string) => {
    try { await updateStatus(newStatus); refetch(); } catch { showError("Holatni o'zgartirishda xatolik"); }
  };

  // ===== QABUL QILISH =====
  const handleReceive = async () => {
    if (!confirm("Buyurtma tovarlarini qabul qilishni tasdiqlaysizmi?")) return;
    try { await receive(); refetch(); } catch { showError("Qabul qilishda xatolik"); }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Buyurtmani o'chirishni xohlaysizmi?")) return;
    try { await deleteOrder(); navigate('/purchases/orders'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printOrder = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Xarid buyurtmasi ${order?.orderNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">XARID BUYURTMASI</h1><p>${order?.orderNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.orderDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Yetkazib beruvchi:</div><div class="info-value">${formData.supplierName}</div></div>
    <div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${STATUS_LABELS[order?.status || 'pending']}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px"><span>Jami summa:</span><span>${formatCurrency(totalAmount)}</span></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  const currentStatus = order?.status || 'pending';
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Xarid buyurtmasi"
      documentNumber={order?.orderNumber}
      documentDate={order?.orderDate}
      isNew={isNew}
      listUrl="/purchases/orders"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={order?.updatedAt}

      editActions={!isNew ? [
        ...(currentStatus === 'confirmed' ? [{ label: "Tovarni qabul qilish", icon: <Package className="h-4 w-4" />, onClick: handleReceive }] : []),
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Buyurtma", onClick: printOrder },
      ]}

      statusBadge={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1">
              <StatusBadge status={currentStatus} config={PURCHASE_STATUS_CONFIG} />
              {availableTransitions.length > 0 && <ChevronDown className="h-3 w-3 text-gray-400" />}
            </button>
          </DropdownMenuTrigger>
          {availableTransitions.length > 0 && (
            <DropdownMenuContent>
              {availableTransitions.map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                  <StatusBadge status={s} config={PURCHASE_STATUS_CONFIG} className="mr-2" />
                  {STATUS_LABELS[s] || s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      }

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Yetkazib beruvchi</Label>
              <Combobox
                options={suppliers.map(s => ({
                  value: s._id,
                  label: s.name,
                  description: s.phone ? `Tel: ${s.phone}` : undefined,
                  keywords: `${s.name} ${s.phone || ''} ${s.email || ''}`,
                }))}
                value={formData.supplier}
                onValueChange={handleSupplierChange}
                placeholder="Yetkazib beruvchini tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Yetkazib beruvchi topilmadi"
                disabled={suppliersLoading}
                className="mt-1"
              />
            </div>
          </div>

          {/* 2-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Buyurtma sanasi</Label>
              <Input type="date" value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
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
      }

      itemsTable={
        <>
          <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Pozitsiyalar ({items.length})</span>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => setIsProductModalOpen(true)} size="sm" variant="ghost" className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Yangi mahsulot
              </Button>
              <Button type="button" onClick={addItem} size="sm" variant="outline" className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Qo'shish
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">№</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Miqdor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Narx</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Jami</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2">
                      <Combobox
                        options={products.map(p => ({ value: p.name, label: p.name }))}
                        value={item.productName}
                        onValueChange={(value) => handleProductSelect(index, value)}
                        placeholder="Mahsulot qidiring..."
                        emptyText="Mahsulot topilmadi"
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="1" value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-24 text-sm text-right h-8" placeholder="0" />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="0" value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-28 text-sm text-right h-8" placeholder="0" />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1}
                        className="p-1 rounded disabled:opacity-30 no-scale">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }

      footer={
        <div className="flex justify-end gap-6 text-sm">
          <div>
            <span className="text-gray-500">Jami:</span> <span className="font-bold text-base">{formatCurrencyAmount(totalAmount, formData.currency)}</span>
            {formData.currency !== 'UZS' && (
              <div className="text-xs text-gray-500 mt-1">
                UZS ekvivalenti <span className="font-medium text-gray-700 ml-2">
                  {formatCurrency(Math.round(totalAmount * formData.exchangeRate))}
                </span>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};

export default OrderDetail;
