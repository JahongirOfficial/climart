import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouseTransferDetail } from "@/hooks/useWarehouseTransferDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2,
} from "lucide-react";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";

interface TransferItem {
  product: string;
  productName: string;
  quantity: number;
}

// Holat badge ranglari va labellar
const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: "Yo'lda", className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Bajarildi', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Bekor qilindi', className: 'bg-red-100 text-red-800' },
};

// Status o'tish variantlari
const statusTransitions: Record<string, string[]> = {
  pending: ['in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
};

const TransferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { transfer, loading, save, saving, updateStatus, deleteTransfer, refetch } = useWarehouseTransferDetail(id);
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('warehouse-transfers', '/warehouse/transfer');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    sourceWarehouse: "",
    sourceWarehouseName: "",
    destinationWarehouse: "",
    destinationWarehouseName: "",
    transferDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const [items, setItems] = useState<TransferItem[]>([
    { product: "", productName: "", quantity: 1 },
  ]);

  // Mavjud hujjatni yuklash
  useEffect(() => {
    if (transfer) {
      setFormData({
        sourceWarehouse: typeof transfer.sourceWarehouse === 'string' ? transfer.sourceWarehouse : transfer.sourceWarehouse._id,
        sourceWarehouseName: transfer.sourceWarehouseName,
        destinationWarehouse: typeof transfer.destinationWarehouse === 'string' ? transfer.destinationWarehouse : transfer.destinationWarehouse._id,
        destinationWarehouseName: transfer.destinationWarehouseName,
        transferDate: new Date(transfer.transferDate).toISOString().split('T')[0],
        notes: transfer.notes || "",
      });
      setItems(transfer.items.map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        quantity: item.quantity,
      })));
    }
  }, [transfer]);

  const handleSourceWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, sourceWarehouse: warehouseId, sourceWarehouseName: warehouse?.name || "" }));
  };

  const handleDestWarehouseChange = (warehouseId: string) => {
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
      };
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.sourceWarehouse) { showWarning("Qayerdan omborni tanlang!"); return; }
    if (!formData.destinationWarehouse) { showWarning("Qayerga omborni tanlang!"); return; }
    if (formData.sourceWarehouse === formData.destinationWarehouse) {
      showWarning("Qayerdan va qayerga omborlar bir xil bo'lmasligi kerak!"); return;
    }
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
        })),
      });
      if (isNew) {
        const newId = result._id || result.transfer?._id;
        if (newId) navigate(`/warehouse/transfer/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== STATUS O'ZGARTIRISH =====
  const handleStatusChange = async (newStatus: string) => {
    const statusLabel = statusConfig[newStatus]?.label || newStatus;
    if (!window.confirm(`Holatni "${statusLabel}" ga o'zgartirmoqchimisiz?`)) return;
    try {
      await updateStatus(newStatus);
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Holatni o'zgartirishda xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!window.confirm("Ko'chirish hujjatini o'chirishni xohlaysizmi?")) return;
    try { await deleteTransfer(); navigate('/warehouse/transfer'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printTransferDoc = () => {
    const status = transfer?.status || 'pending';
    const statusLabel = statusConfig[status]?.label || status;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ko'chirish ${transfer?.transferNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">KO'CHIRISH HUJJATI</h1><p>${transfer?.transferNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.transferDate)}</p><p>Holat: ${statusLabel}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Qayerdan:</div><div class="info-value">${formData.sourceWarehouseName}</div></div>
    <div class="info-item"><div class="info-label">Qayerga:</div><div class="info-value">${formData.destinationWarehouseName}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td></tr>`).join('')}</tbody></table>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const currentStatus = transfer?.status || 'pending';
  const availableTransitions = statusTransitions[currentStatus] || [];
  const isPending = currentStatus === 'pending';

  return (
    <DocumentDetailLayout
      title="Ko'chirish"
      documentNumber={transfer?.transferNumber}
      documentDate={transfer?.transferDate}
      isNew={isNew}
      listUrl="/warehouse/transfer"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={transfer?.updatedAt}

      statusBadge={!isNew && transfer ? (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[transfer.status]?.className || 'bg-gray-100 text-gray-800'}`}>
          {statusConfig[transfer.status]?.label || transfer.status}
        </span>
      ) : undefined}

      editActions={!isNew ? [
        // Status o'tish variantlari
        ...availableTransitions.map(status => ({
          label: statusConfig[status]?.label || status,
          onClick: () => handleStatusChange(status),
        })),
        // O'chirish faqat pending holatda
        ...(isPending ? [{ label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true }] : []),
      ] : undefined}

      printActions={[
        { label: "Ko'chirish hujjati", onClick: printTransferDoc },
      ]}

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Qayerdan</Label>
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
              <Label className="text-xs text-gray-500">* Qayerga</Label>
              <Combobox
                options={warehouses.filter(w => w.isActive).map(w => ({ value: w._id, label: w.name }))}
                value={formData.destinationWarehouse}
                onValueChange={handleDestWarehouseChange}
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
              <Label className="text-xs text-gray-500">* Ko'chirish sanasi</Label>
              <Input type="date" value={formData.transferDate}
                onChange={(e) => setFormData(prev => ({ ...prev, transferDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
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

export default TransferDetail;
