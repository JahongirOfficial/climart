import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useSupplierReturn } from "@/hooks/useSupplierReturn";
import { useReceipts } from "@/hooks/useReceipts";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, Package,
} from "lucide-react";
import { printViaIframe } from "@/utils/print";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";

interface ReturnItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

const REASON_OPTIONS = [
  { label: 'Brak (ishlamaydi)', value: 'brak' },
  { label: 'Nuqson (yoriq, singan)', value: 'nuqson' },
  { label: "Noto'g'ri model", value: "noto'g'ri_model" },
  { label: 'Boshqa sabab', value: 'boshqa' },
];

const ReturnDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const receiptIdParam = urlParams.get('receiptId') || '';

  const { returnDoc, loading, save, saving, deleteReturn, refetch } = useSupplierReturn(id);
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { receipts } = useReceipts();
  const nav = useDocumentNavigation('supplier-returns', '/purchases/returns');

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    warehouse: "",
    warehouseName: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "brak",
    notes: "",
  });

  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", productName: "", quantity: 1, costPrice: 0, total: 0 },
  ]);

  // Mavjud qaytarishni yuklash
  useEffect(() => {
    if (returnDoc) {
      setFormData({
        supplier: typeof returnDoc.supplier === 'string' ? returnDoc.supplier : returnDoc.supplier._id,
        supplierName: returnDoc.supplierName,
        warehouse: typeof returnDoc.warehouse === 'string' ? returnDoc.warehouse : returnDoc.warehouse || '',
        warehouseName: returnDoc.warehouseName || '',
        returnDate: new Date(returnDoc.returnDate).toISOString().split('T')[0],
        reason: returnDoc.reason || 'brak',
        notes: returnDoc.notes || "",
      });
      setItems(returnDoc.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        total: item.total,
      })));
    }
  }, [returnDoc]);

  // receiptId dan pre-fill
  useEffect(() => {
    if (isNew && receiptIdParam && receipts.length > 0 && !formData.supplier) {
      const receipt = receipts.find(r => r._id === receiptIdParam);
      if (receipt) {
        const supplierId = typeof receipt.supplier === 'string' ? receipt.supplier : receipt.supplier._id;
        const supplierObj = suppliers.find(s => s._id === supplierId);
        const warehouseId = typeof receipt.warehouse === 'string' ? receipt.warehouse : receipt.warehouse?._id || '';
        const warehouseObj = warehouses.find(w => w._id === warehouseId);

        setFormData(prev => ({
          ...prev,
          supplier: supplierId,
          supplierName: supplierObj?.name || receipt.supplierName || '',
          warehouse: warehouseId,
          warehouseName: warehouseObj?.name || receipt.warehouseName || '',
        }));
        setItems(receipt.items.map((item: any) => ({
          product: typeof item.product === 'string' ? item.product : item.product?._id || '',
          productName: item.productName,
          quantity: 1,
          costPrice: item.costPrice,
          total: item.costPrice,
        })));
      }
    }
  }, [receiptIdParam, receipts, suppliers, warehouses, isNew]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData(prev => ({ ...prev, supplier: supplierId, supplierName: supplier?.name || "" }));
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, warehouse: warehouseId, warehouseName: warehouse?.name || "" }));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product: productId,
        productName: product.name,
        costPrice: product.costPrice || 0,
        total: newItems[index].quantity * (product.costPrice || 0),
      };
      setItems(newItems);
    }
  };

  const getAvailableStock = (productId: string): number | null => {
    if (!productId || !formData.warehouse) return null;
    const product = products.find(p => p._id === productId);
    if (!product?.stockByWarehouse) return null;
    const warehouseStock = product.stockByWarehouse.find(
      (sw: any) => sw.warehouse === formData.warehouse || sw.warehouse?._id === formData.warehouse
    );
    return warehouseStock ? warehouseStock.quantity - (warehouseStock.reserved || 0) : 0;
  };

  const handleItemChange = (index: number, field: keyof ReturnItem, value: any) => {
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
    if (!formData.supplier) { showWarning("Yetkazib beruvchini tanlang!"); return; }
    if (!formData.warehouse) { showWarning("Omborni tanlang!"); return; }
    if (items.some(item => !item.product || item.quantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring!"); return;
    }
    // Stock check
    for (const item of items) {
      const available = getAvailableStock(item.product);
      if (available !== null && item.quantity > available) {
        const product = products.find(p => p._id === item.product);
        showWarning(`${product?.name || 'Mahsulot'} uchun omborda yetarli miqdor yo'q (mavjud: ${available}, kerak: ${item.quantity})`);
        return;
      }
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
        const newId = result._id || result.return?._id;
        if (newId) navigate(`/purchases/returns/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Qaytarishni o'chirishni xohlaysizmi?")) return;
    try { await deleteReturn(); navigate('/purchases/returns'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printReturn = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Qaytarish ${returnDoc?.returnNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0;color:#c00">YETKAZIB BERUVCHIGA QAYTARISH</h1><p>${returnDoc?.returnNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.returnDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Yetkazib beruvchi:</div><div class="info-value">${formData.supplierName}</div></div>
    <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>
    <div class="info-item"><div class="info-label">Sabab:</div><div class="info-value">${REASON_OPTIONS.find(r => r.value === formData.reason)?.label || formData.reason}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Tan narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.costPrice)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px;color:#c00"><span>Jami summa:</span><span>${formatCurrency(totalAmount)}</span></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#fff0f0;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Yetkazib beruvchiga qaytarish"
      documentNumber={returnDoc?.returnNumber}
      documentDate={returnDoc?.returnDate}
      isNew={isNew}
      listUrl="/purchases/returns"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={returnDoc?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Qaytarish hujjati", onClick: printReturn },
      ]}

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Yetkazib beruvchi</Label>
              <Combobox
                options={suppliers.map(s => ({ value: s._id, label: s.name }))}
                value={formData.supplier}
                onValueChange={handleSupplierChange}
                placeholder="Yetkazib beruvchini tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Yetkazib beruvchi topilmadi"
                className="mt-1"
              />
            </div>
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
              <Label className="text-xs text-gray-500">* Qaytarish sanasi</Label>
              <Input type="date" value={formData.returnDate}
                onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Sabab</Label>
              <Combobox
                options={REASON_OPTIONS}
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                placeholder="Sabab tanlang..."
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
                placeholder="Qaytarish sababi va qo'shimcha ma'lumot..." rows={3} className="text-sm mt-1" />
            </div>
          </div>
        </div>
      }

      itemsTable={
        <>
          <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Qaytariladigan tovarlar ({items.length})</span>
            <Button type="button" onClick={addItem} size="sm" variant="outline" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Qo'shish
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">№</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Miqdor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tan narx</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Jami</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const availableStock = getAvailableStock(item.product);
                  const isOverStock = availableStock !== null && item.quantity > availableStock;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2">
                        <Combobox
                          options={products.map(p => ({ value: p._id, label: p.name }))}
                          value={item.product}
                          onValueChange={(value) => handleProductChange(index, value)}
                          placeholder="Mahsulot tanlang..."
                          searchPlaceholder="Qidirish..."
                          emptyText="Mahsulot topilmadi"
                          className="w-full"
                        />
                        {availableStock !== null && (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${isOverStock ? 'text-red-500' : 'text-gray-500'}`}>
                            <Package className="h-3 w-3" />
                            Mavjud: {availableStock} dona
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" min="1" value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className={`w-24 text-sm text-right h-8 ${isOverStock ? 'border-red-400' : ''}`} placeholder="0" />
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      }

      footer={
        <div className="flex justify-end gap-6 text-sm">
          <div><span className="text-red-600">Jami qaytarish:</span> <span className="font-bold text-base text-red-600">{formatCurrency(totalAmount)}</span></div>
        </div>
      }
    />
  );
};

export default ReturnDetail;
