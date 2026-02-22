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
import { useInventoryDetail } from "@/hooks/useInventoryDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, CheckCircle, ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";

interface InventoryItem {
  product: string;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceAmount: number;
}

// Inventarizatsiya statuslari
const INVENTORY_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Qoralama",     color: "text-gray-800",  bg: "bg-gray-100" },
  confirmed: { label: "Tasdiqlangan", color: "text-green-800", bg: "bg-green-100" },
};

const InventoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { inventory, loading, save, saving, confirm, createWriteoff, createReceipt, deleteInventory, loadProducts, refetch } = useInventoryDetail(id);
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('inventories', '/warehouse/inventory');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    warehouse: "",
    warehouseName: "",
    inventoryDate: new Date().toISOString().split('T')[0],
    category: "",
    notes: "",
  });

  const [items, setItems] = useState<InventoryItem[]>([
    { product: "", productName: "", systemQuantity: 0, actualQuantity: 0, difference: 0, costPrice: 0, differenceAmount: 0 },
  ]);

  // Mavjud inventarizatsiyani yuklash
  useEffect(() => {
    if (inventory) {
      setFormData({
        warehouse: typeof inventory.warehouse === 'string' ? inventory.warehouse : inventory.warehouse._id,
        warehouseName: inventory.warehouseName,
        inventoryDate: new Date(inventory.inventoryDate).toISOString().split('T')[0],
        category: inventory.category || "",
        notes: inventory.notes || "",
      });
      setItems(inventory.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        systemQuantity: item.systemQuantity,
        actualQuantity: item.actualQuantity,
        difference: item.difference,
        costPrice: item.costPrice,
        differenceAmount: item.differenceAmount,
      })));
    }
  }, [inventory]);

  // Ombor tanlanganda mahsulotlarni auto-yuklash (faqat yangi hujjat uchun)
  const handleWarehouseChange = async (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, warehouse: warehouseId, warehouseName: warehouse?.name || "" }));

    // Yangi hujjat uchun ombor mahsulotlarini auto-fill
    if (isNew && warehouseId) {
      try {
        const warehouseProducts = await loadProducts(warehouseId);
        if (warehouseProducts && warehouseProducts.length > 0) {
          setItems(warehouseProducts.map((p: any) => ({
            product: p._id || p.product,
            productName: p.productName || p.name,
            systemQuantity: p.systemQuantity || p.quantity || 0,
            actualQuantity: p.systemQuantity || p.quantity || 0,
            difference: 0,
            costPrice: p.costPrice || 0,
            differenceAmount: 0,
          })));
        }
      } catch {
        // Xatolik bo'lsa bo'sh qoldirish
      }
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      const systemQty = product.quantity || 0;
      const diff = newItems[index].actualQuantity - systemQty;
      newItems[index] = {
        ...newItems[index],
        product: productId,
        productName: product.name,
        systemQuantity: systemQty,
        costPrice: product.costPrice,
        difference: diff,
        differenceAmount: diff * product.costPrice,
      };
      setItems(newItems);
    }
  };

  const handleActualQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    const diff = value - newItems[index].systemQuantity;
    newItems[index] = {
      ...newItems[index],
      actualQuantity: value,
      difference: diff,
      differenceAmount: diff * newItems[index].costPrice,
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof InventoryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Farq va summani qayta hisoblash
    const diff = newItems[index].actualQuantity - newItems[index].systemQuantity;
    newItems[index].difference = diff;
    newItems[index].differenceAmount = diff * newItems[index].costPrice;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", systemQuantity: 0, actualQuantity: 0, difference: 0, costPrice: 0, differenceAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  // Kamomad va ortiqcha hisoblash
  const totals = useMemo(() => {
    let shortageCount = 0;
    let shortageAmount = 0;
    let surplusCount = 0;
    let surplusAmount = 0;
    items.forEach(item => {
      if (item.difference < 0) {
        shortageCount += Math.abs(item.difference);
        shortageAmount += Math.abs(item.differenceAmount);
      } else if (item.difference > 0) {
        surplusCount += item.difference;
        surplusAmount += item.differenceAmount;
      }
    });
    return { shortageCount, shortageAmount, surplusCount, surplusAmount };
  }, [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.warehouse) { showWarning("Omborni tanlang!"); return; }
    if (items.some(item => !item.product)) {
      showWarning("Barcha mahsulotlarni to'ldiring!"); return;
    }
    try {
      const result = await save({
        ...formData,
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          difference: item.difference,
          costPrice: item.costPrice,
          differenceAmount: item.differenceAmount,
        })),
      });
      if (isNew) {
        const newId = result._id || result.inventory?._id;
        if (newId) navigate(`/warehouse/inventory/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== TASDIQLASH =====
  const handleConfirm = async () => {
    if (!confirm("Inventarizatsiyani tasdiqlashni xohlaysizmi?")) return;
    try { await confirm(); refetch(); } catch { showError("Tasdiqlashda xatolik"); }
  };

  // ===== CHIQIM YARATISH =====
  const handleCreateWriteoff = async () => {
    if (!confirm("Kamomad uchun chiqim yaratishni xohlaysizmi?")) return;
    try { await createWriteoff(); refetch(); } catch { showError("Chiqim yaratishda xatolik"); }
  };

  // ===== KIRIM YARATISH =====
  const handleCreateReceipt = async () => {
    if (!confirm("Ortiqcha uchun kirim yaratishni xohlaysizmi?")) return;
    try { await createReceipt(); refetch(); } catch { showError("Kirim yaratishda xatolik"); }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Inventarizatsiyani o'chirishni xohlaysizmi?")) return;
    try { await deleteInventory(); navigate('/warehouse/inventory'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printInventory = () => {
    const statusLabel = INVENTORY_STATUS_CONFIG[inventory?.status || 'draft']?.label || inventory?.status;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inventarizatsiya ${inventory?.inventoryNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}.text-red{color:#dc2626}.text-green{color:#16a34a}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">INVENTARIZATSIYA</h1><p>${inventory?.inventoryNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.inventoryDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>
    <div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${statusLabel}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Tizim</th><th class="text-right">Haqiqiy</th><th class="text-right">Farq</th><th class="text-right">Tan narx</th><th class="text-right">Farq summasi</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.systemQuantity}</td><td class="text-right">${item.actualQuantity}</td><td class="text-right ${item.difference < 0 ? 'text-red' : item.difference > 0 ? 'text-green' : ''}">${item.difference}</td><td class="text-right">${formatCurrency(item.costPrice)}</td><td class="text-right ${item.differenceAmount < 0 ? 'text-red' : item.differenceAmount > 0 ? 'text-green' : ''}">${formatCurrency(item.differenceAmount)}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-size:14px;font-weight:bold">
    <span style="color:#dc2626">Kamomad: ${totals.shortageCount} dona / ${formatCurrency(totals.shortageAmount)}</span>
    <span style="color:#16a34a">Ortiqcha: ${totals.surplusCount} dona / ${formatCurrency(totals.surplusAmount)}</span>
    </div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  const currentStatus = inventory?.status || 'draft';

  // Edit amallar ro'yxatini tuzish
  const buildEditActions = () => {
    if (isNew) return undefined;
    const actions: any[] = [];
    if (currentStatus === 'draft') {
      actions.push({ label: "Tasdiqlash", icon: <CheckCircle className="h-4 w-4" />, onClick: handleConfirm });
    }
    if (currentStatus === 'confirmed' && totals.shortageCount > 0 && !inventory?.writeoffCreated) {
      actions.push({ label: "Chiqim yaratish", icon: <ArrowDownCircle className="h-4 w-4" />, onClick: handleCreateWriteoff });
    }
    if (currentStatus === 'confirmed' && totals.surplusCount > 0 && !inventory?.receiptCreated) {
      actions.push({ label: "Kirim yaratish", icon: <ArrowUpCircle className="h-4 w-4" />, onClick: handleCreateReceipt });
    }
    if (currentStatus === 'draft') {
      actions.push({ label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true });
    }
    return actions.length > 0 ? actions : undefined;
  };

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Inventarizatsiya"
      documentNumber={inventory?.inventoryNumber}
      documentDate={inventory?.inventoryDate}
      isNew={isNew}
      listUrl="/warehouse/inventory"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={inventory?.updatedAt}

      editActions={buildEditActions()}

      printActions={[
        { label: "Inventarizatsiya hujjati", onClick: printInventory },
      ]}

      statusBadge={!isNew ? (
        <StatusBadge status={currentStatus} config={INVENTORY_STATUS_CONFIG} />
      ) : undefined}

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
              <Label className="text-xs text-gray-500">* Inventarizatsiya sanasi</Label>
              <Input type="date" value={formData.inventoryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inventoryDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Kategoriya</Label>
              <Input type="text" value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Kategoriya..." className="h-9 text-sm mt-1" />
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
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tizim qoldig'i</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Haqiqiy miqdor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Farq</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tan narx</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Farq summasi</th>
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
                    <td className="px-3 py-2 text-right text-gray-500">
                      {item.systemQuantity}
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="0" value={item.actualQuantity || ''}
                        onChange={(e) => handleActualQuantityChange(index, parseInt(e.target.value) || 0)}
                        className="w-28 text-sm text-right h-8" placeholder="0" />
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min="0" step="0.01" value={item.costPrice || ''}
                        onChange={(e) => handleItemChange(index, 'costPrice', parseFloat(e.target.value) || 0)}
                        className="w-28 text-sm text-right h-8" placeholder="0" />
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${item.differenceAmount < 0 ? 'text-red-600' : item.differenceAmount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {formatCurrency(item.differenceAmount)}
                    </td>
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
            <span className="text-red-600">Kamomad: {totals.shortageCount} dona / </span>
            <span className="font-bold text-base text-red-600">{formatCurrency(totals.shortageAmount)}</span>
          </div>
          <div>
            <span className="text-green-600">Ortiqcha: {totals.surplusCount} dona / </span>
            <span className="font-bold text-base text-green-600">{formatCurrency(totals.surplusAmount)}</span>
          </div>
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

export default InventoryDetail;
