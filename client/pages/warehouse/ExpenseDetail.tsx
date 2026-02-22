import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouseExpenseDetail } from "@/hooks/useWarehouseExpenseDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2 } from "lucide-react";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { printViaIframe } from "@/utils/print";

// Xarajat kategoriyalari
const CATEGORY_OPTIONS = [
  { value: 'rent', label: 'Ijara' },
  { value: 'utilities', label: 'Kommunal' },
  { value: 'maintenance', label: "Ta'mirlash" },
  { value: 'salaries', label: 'Ish haqi' },
  { value: 'equipment', label: 'Jihozlar' },
  { value: 'other', label: 'Boshqa' },
];

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Ijara',
  utilities: 'Kommunal',
  maintenance: "Ta'mirlash",
  salaries: 'Ish haqi',
  equipment: 'Jihozlar',
  other: 'Boshqa',
};

const ExpenseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { expense, loading, save, saving, deleteExpense, refetch } = useWarehouseExpenseDetail(id);
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('warehouse-expenses', '/warehouse/expenses');

  const [formData, setFormData] = useState({
    warehouse: "",
    warehouseName: "",
    expenseDate: new Date().toISOString().split('T')[0],
    category: "" as string,
    amount: 0,
    description: "",
  });

  // Mavjud xarajatni yuklash
  useEffect(() => {
    if (expense) {
      setFormData({
        warehouse: typeof expense.warehouse === 'string' ? expense.warehouse : expense.warehouse._id,
        warehouseName: expense.warehouseName,
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
        category: expense.category,
        amount: expense.amount,
        description: expense.description || "",
      });
    }
  }, [expense]);

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, warehouse: warehouseId, warehouseName: warehouse?.name || "" }));
  };

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.warehouse) { showWarning("Omborni tanlang!"); return; }
    if (!formData.category) { showWarning("Kategoriyani tanlang!"); return; }
    if (!formData.amount || formData.amount <= 0) { showWarning("Summani kiriting!"); return; }
    try {
      const result = await save({
        warehouse: formData.warehouse,
        warehouseName: formData.warehouseName,
        expenseDate: formData.expenseDate,
        category: formData.category,
        amount: formData.amount,
        description: formData.description,
      });
      if (isNew) {
        const newId = result._id || result.expense?._id;
        if (newId) navigate(`/warehouse/expenses/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Ombor xarajatini o'chirishni xohlaysizmi?")) return;
    try { await deleteExpense(); navigate('/warehouse/expenses'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printExpense = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ombor xarajati</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">OMBOR XARAJATI</h1>
    <p>Sana: ${formatDate(formData.expenseDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>
    <div class="info-item"><div class="info-label">Kategoriya:</div><div class="info-value">${CATEGORY_LABELS[formData.category] || formData.category}</div></div>
    <div class="info-item"><div class="info-label">Summa:</div><div class="info-value">${formatCurrency(formData.amount)}</div></div>
    </div>
    ${formData.description ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.description}</div>` : ''}
    </body></html>`;
    printViaIframe(html);
  };

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Ombor xarajati"
      documentNumber={undefined}
      documentDate={expense?.expenseDate}
      isNew={isNew}
      listUrl="/warehouse/expenses"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={expense?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Xarajat hujjati", onClick: printExpense },
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
              <Label className="text-xs text-gray-500">* Xarajat sanasi</Label>
              <Input type="date" value={formData.expenseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Kategoriya</Label>
              <Combobox
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                placeholder="Kategoriyani tanlang..."
                searchPlaceholder="Qidirish..."
                emptyText="Topilmadi"
                className="mt-1"
              />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Summa</Label>
              <Input type="number" min="0" step="0.01" value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Summani kiriting..." className="h-9 text-sm mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Izoh</Label>
              <Textarea value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot..." rows={2} className="text-sm mt-1" />
            </div>
          </div>
        </div>
      }
    />
  );
};

export default ExpenseDetail;
