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
import { useWarehouseReceiptDetail } from "@/hooks/useWarehouseReceiptDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, CheckCircle,
} from "lucide-react";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";

interface ReceiptItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

// Sabab variantlari
const reasonOptions = [
  { value: 'inventory_adjustment', label: "Inventarizatsiya to'g'rilash" },
  { value: 'found_items', label: 'Topilgan tovarlar' },
  { value: 'production', label: 'Ishlab chiqarish' },
  { value: 'other', label: 'Boshqa' },
];

// Holat badge ranglari
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Qoralama', className: 'bg-gray-100 text-gray-800' },
  confirmed: { label: 'Tasdiqlangan', className: 'bg-green-100 text-green-800' },
};

const WarehouseReceiptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { receipt, loading, save, saving, confirm: confirmReceipt, deleteReceipt, refetch } = useWarehouseReceiptDetail(id);
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('warehouse-receipts', '/warehouse/receipt');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    warehouse: "",
    warehouseName: "",
    receiptDate: new Date().toISOString().split('T')[0],
    reason: "inventory_adjustment" as string,
    notes: "",
  });

  const [items, setItems] = useState<ReceiptItem[]>([
    { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 },
  ]);

  // Mavjud hujjatni yuklash
  useEffect(() => {
    if (receipt) {
      setFormData({
        warehouse: typeof receipt.warehouse === 'string' ? receipt.warehouse : receipt.warehouse._id,
        warehouseName: receipt.warehouseName,
        receiptDate: new Date(receipt.receiptDate).toISOString().split('T')[0],
        reason: receipt.reason || 'inventory_adjustment',
        notes: receipt.notes || "",
      });
      setItems(receipt.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        total: item.total,
      })));
    }
  }, [receipt]);

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, warehouse: warehouseId, warehouseName: warehouse?.name || "" }));
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
        total: newItems[index].quantity * product.costPrice,
      };
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'costPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].costPrice;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.warehouse) { showWarning("Omborni tanlang!"); return; }
    if (items.some(item => !item.product || item.quantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring!"); return;
    }
    try {
      const result = await save({
        ...formData,
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          total: item.total,
        })),
        totalAmount,
      });
      if (isNew) {
        const newId = result._id || result.receipt?._id;
        if (newId) navigate(`/warehouse/receipt/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== TASDIQLASH =====
  const handleConfirm = async () => {
    if (!window.confirm("Hujjatni tasdiqlashni xohlaysizmi? Tasdiqlangandan keyin o'zgartirish mumkin emas.")) return;
    try {
      await confirmReceipt();
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Tasdiqlashda xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!window.confirm("Kirim hujjatini o'chirishni xohlaysizmi?")) return;
    try { await deleteReceipt(); navigate('/warehouse/receipt'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printReceiptDoc = () => {
    const reasonLabel = reasonOptions.find(r => r.value === formData.reason)?.label || formData.reason;
    const status = receipt?.status || 'draft';
    const statusLabel = statusConfig[status]?.label || status;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kirim ${receipt?.receiptNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">OMBOR KIRIM HUJJATI</h1><p>${receipt?.receiptNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.receiptDate)}</p><p>Holat: ${statusLabel}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>
    <div class="info-item"><div class="info-label">Sabab:</div><div class="info-value">${reasonLabel}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Tan narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.costPrice)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px"><span>Jami summa:</span><span>${formatCurrency(totalAmount)}</span></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isDraft = !receipt || receipt.status === 'draft';

  return (
    <DocumentDetailLayout
      title="Ombor kirim hujjati"
      documentNumber={receipt?.receiptNumber}
      documentDate={receipt?.receiptDate}
      isNew={isNew}
      listUrl="/warehouse/receipt"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={receipt?.updatedAt}

      statusBadge={!isNew && receipt ? (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[receipt.status]?.className || 'bg-gray-100 text-gray-800'}`}>
          {statusConfig[receipt.status]?.label || receipt.status}
        </span>
      ) : undefined}

      editActions={!isNew ? [
        ...(isDraft ? [{ label: "Tasdiqlash", icon: <CheckCircle className="h-4 w-4" />, onClick: handleConfirm }] : []),
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Kirim hujjati", onClick: printReceiptDoc },
      ]}

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Ombor</Label>
              <Combobox
                options={warehouses.filter(w => w.isActive).map(w => ({ value: w._id, label: w.name }))}
                value={formData.warehouse}
                onValueChange={handleWarehouseChange}
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
              <Label className="text-xs text-gray-500">* Kirim sanasi</Label>
              <Input type="date" value={formData.receiptDate}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Sabab</Label>
              <Combobox
                options={reasonOptions}
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                placeholder="Sababni tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Sabab topilmadi"
                className="mt-1"
              />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">{"\u2116"}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Miqdor</th>
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
                      <Input type="number" min="1" value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-24 text-sm text-right h-8" placeholder="0" />
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
          <div><span className="text-gray-500">Jami:</span> <span className="font-bold text-base">{formatCurrency(totalAmount)}</span></div>
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

export default WarehouseReceiptDetail;
