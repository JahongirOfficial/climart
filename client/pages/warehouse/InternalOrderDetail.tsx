import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useInternalOrderDetail } from "@/hooks/useInternalOrderDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, CheckCircle,
} from "lucide-react";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";

interface OrderItem {
  product: string;
  productName: string;
  requestedQuantity: number;
  shippedQuantity: number;
  costPrice: number;
  total: number;
}

// Ichki buyurtma statuslari
const INTERNAL_ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "Yangi",             color: "text-yellow-800", bg: "bg-yellow-100" },
  approved:  { label: "Tasdiqlangan",      color: "text-blue-800",   bg: "bg-blue-100" },
  partial:   { label: "Qisman bajarildi",  color: "text-amber-800",  bg: "bg-amber-100" },
  completed: { label: "Bajarildi",         color: "text-green-800",  bg: "bg-green-100" },
  cancelled: { label: "Bekor qilindi",     color: "text-red-800",    bg: "bg-red-100" },
};

const InternalOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { order, loading, save, saving, approve, deleteOrder, refetch } = useInternalOrderDetail(id);
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('internal-orders', '/warehouse/internal-orders');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    sourceWarehouse: "",
    sourceWarehouseName: "",
    destinationWarehouse: "",
    destinationWarehouseName: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: "",
    notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: "", productName: "", requestedQuantity: 1, shippedQuantity: 0, costPrice: 0, total: 0 },
  ]);

  // Mavjud buyurtmani yuklash
  useEffect(() => {
    if (order) {
      setFormData({
        sourceWarehouse: typeof order.sourceWarehouse === 'string' ? order.sourceWarehouse : order.sourceWarehouse._id,
        sourceWarehouseName: order.sourceWarehouseName,
        destinationWarehouse: typeof order.destinationWarehouse === 'string' ? order.destinationWarehouse : order.destinationWarehouse._id,
        destinationWarehouseName: order.destinationWarehouseName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        expectedDate: order.expectedDate ? new Date(order.expectedDate).toISOString().split('T')[0] : "",
        notes: order.notes || "",
      });
      setItems(order.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        requestedQuantity: item.requestedQuantity,
        shippedQuantity: item.shippedQuantity,
        costPrice: item.costPrice,
        total: item.total,
      })));
    }
  }, [order]);

  const handleSourceWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, sourceWarehouse: warehouseId, sourceWarehouseName: warehouse?.name || "" }));
  };

  const handleDestinationWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, destinationWarehouse: warehouseId, destinationWarehouseName: warehouse?.name || "" }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product: productId,
        productName: product.name,
        costPrice: product.costPrice,
        total: newItems[index].requestedQuantity * product.costPrice,
      };
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'requestedQuantity' || field === 'costPrice') {
      newItems[index].total = newItems[index].requestedQuantity * newItems[index].costPrice;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", requestedQuantity: 1, shippedQuantity: 0, costPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.sourceWarehouse) { showWarning("Qayerdan omborni tanlang!"); return; }
    if (!formData.destinationWarehouse) { showWarning("Qayerga omborni tanlang!"); return; }
    if (formData.sourceWarehouse === formData.destinationWarehouse) { showWarning("Omborlar bir xil bo'lishi mumkin emas!"); return; }
    if (items.some(item => !item.product || item.requestedQuantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring!"); return;
    }
    try {
      const result = await save({
        ...formData,
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          requestedQuantity: item.requestedQuantity,
          costPrice: item.costPrice,
          total: item.total,
        })),
        totalAmount,
      });
      if (isNew) {
        const newId = result._id || result.order?._id;
        if (newId) navigate(`/warehouse/internal-orders/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== TASDIQLASH =====
  const handleApprove = async () => {
    if (!confirm("Ichki buyurtmani tasdiqlash va o'tkazmani yaratishni xohlaysizmi?")) return;
    try { await approve(); refetch(); } catch { showError("Tasdiqlashda xatolik"); }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Ichki buyurtmani o'chirishni xohlaysizmi?")) return;
    try { await deleteOrder(); navigate('/warehouse/internal-orders'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printOrder = () => {
    const statusLabel = INTERNAL_ORDER_STATUS_CONFIG[order?.status || 'new']?.label || order?.status;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ichki buyurtma ${order?.orderNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">ICHKI BUYURTMA</h1><p>${order?.orderNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.orderDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Qayerdan ombor:</div><div class="info-value">${formData.sourceWarehouseName}</div></div>
    <div class="info-item"><div class="info-label">Qayerga ombor:</div><div class="info-value">${formData.destinationWarehouseName}</div></div>
    <div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${statusLabel}</div></div>
    ${formData.expectedDate ? `<div class="info-item"><div class="info-label">Kutilayotgan sana:</div><div class="info-value">${formatDate(formData.expectedDate)}</div></div>` : ''}
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">So'ralgan</th><th class="text-right">Jo'natilgan</th><th class="text-right">Tan narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.requestedQuantity}</td><td class="text-right">${item.shippedQuantity}</td><td class="text-right">${formatCurrency(item.costPrice)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px"><span>Jami summa:</span><span>${formatCurrency(totalAmount)}</span></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  const currentStatus = order?.status || 'new';

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Ichki buyurtma"
      documentNumber={order?.orderNumber}
      documentDate={order?.orderDate}
      isNew={isNew}
      listUrl="/warehouse/internal-orders"
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
        ...(currentStatus === 'new' ? [{ label: "Tasdiqlash", icon: <CheckCircle className="h-4 w-4" />, onClick: handleApprove }] : []),
        ...(currentStatus === 'new' ? [{ label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true }] : []),
      ] : undefined}

      printActions={[
        { label: "Ichki buyurtma", onClick: printOrder },
      ]}

      statusBadge={!isNew ? (
        <StatusBadge status={currentStatus} config={INTERNAL_ORDER_STATUS_CONFIG} />
      ) : undefined}

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Qayerdan ombor</Label>
              <Combobox
                options={warehouses.filter(w => w.isActive).map(w => ({ value: w._id, label: w.name }))}
                value={formData.sourceWarehouse}
                onValueChange={handleSourceWarehouseChange}
                placeholder="Omborni tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Ombor topilmadi"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Qayerga ombor</Label>
              <Combobox
                options={warehouses.filter(w => w.isActive).map(w => ({ value: w._id, label: w.name }))}
                value={formData.destinationWarehouse}
                onValueChange={handleDestinationWarehouseChange}
                placeholder="Omborni tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Ombor topilmadi"
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
            <div>
              <Label className="text-xs text-gray-500">Kutilayotgan sana</Label>
              <Input type="date" value={formData.expectedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                className="h-9 text-sm mt-1" />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Izoh</Label>
              <Textarea value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot..." rows={3} className="text-sm mt-1" />
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">So'ralgan miqdor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Jo'natilgan</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tan narx</th>
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
                        options={products.map(p => ({ value: p._id, label: p.name }))}
                        value={item.product}
                        onValueChange={(value) => handleProductSelect(index, value)}
                        placeholder="Mahsulot tanlang..."
                        searchPlaceholder="Qidirish..."
                        emptyText="Mahsulot topilmadi"
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="1" value={item.requestedQuantity || ''}
                        onChange={(e) => handleItemChange(index, 'requestedQuantity', parseInt(e.target.value) || 0)}
                        className="w-28 text-sm text-right h-8" placeholder="0" />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {!isNew ? item.shippedQuantity : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="0" step="0.01" value={item.costPrice || ''}
                        onChange={(e) => handleItemChange(index, 'costPrice', parseFloat(e.target.value) || 0)}
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
          <div><span className="text-gray-500">Jami summa:</span> <span className="font-bold text-base">{formatCurrency(totalAmount)}</span></div>
          {!isNew && order && (
            <div><span className="text-gray-500">Bajarilish:</span> <span className="font-bold text-base">{order.fulfillmentPercentage}%</span></div>
          )}
        </div>
      }
    >
      {/* QuickProductModal */}
      <QuickProductModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onCreated={() => { refetchProducts(); setIsProductModalOpen(false); }}
      />
    </DocumentDetailLayout>
  );
};

export default InternalOrderDetail;
