import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomerReturn } from "@/hooks/useCustomerReturn";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, RETURN_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReturnItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  reason: string;
  maxQuantity: number;
}

const REASON_LABELS: Record<string, string> = {
  'defective': "Nuqsonli mahsulot",
  'wrong_item': "Noto'g'ri mahsulot",
  'customer_request': "Mijoz talabi",
  'other': "Boshqa",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['accepted', 'cancelled'],
  'accepted': [],
  'cancelled': [],
};

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Kutilmoqda',
  'accepted': 'Qabul qilindi',
  'cancelled': 'Bekor qilindi',
};

const ReturnDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { customerReturn, loading, save, saving, updateStatus, deleteReturn, refetch } = useCustomerReturn(id);
  const { invoices, loading: invoicesLoading } = useCustomerInvoices();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('customer-returns', '/sales/returns');

  const [formData, setFormData] = useState({
    invoice: "",
    invoiceNumber: "",
    customer: "",
    customerName: "",
    organization: "",
    warehouse: "",
    warehouseName: "",
    returnDate: new Date().toISOString().split('T')[0],
    reason: "customer_request",
    notes: "",
  });

  const [items, setItems] = useState<ReturnItem[]>([]);

  // Mavjud qaytarishni yuklash
  useEffect(() => {
    if (customerReturn) {
      setFormData({
        invoice: typeof customerReturn.invoice === 'string' ? customerReturn.invoice : customerReturn.invoice?._id || '',
        invoiceNumber: customerReturn.invoiceNumber || '',
        customer: typeof customerReturn.customer === 'string' ? customerReturn.customer : customerReturn.customer?._id || '',
        customerName: customerReturn.customerName || '',
        organization: customerReturn.organization || '',
        warehouse: typeof customerReturn.warehouse === 'string' ? customerReturn.warehouse : customerReturn.warehouse?._id || '',
        warehouseName: customerReturn.warehouseName || '',
        returnDate: new Date(customerReturn.returnDate).toISOString().split('T')[0],
        reason: customerReturn.reason || 'customer_request',
        notes: customerReturn.notes || '',
      });
      setItems((customerReturn.items || []).map((item: any) => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id || '',
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        reason: item.reason || customerReturn.reason || 'customer_request',
        maxQuantity: item.maxQuantity || item.quantity,
      })));
    }
  }, [customerReturn]);

  const handleInvoiceChange = (invoiceId: string) => {
    const inv = invoices.find(i => i._id === invoiceId);
    if (inv) {
      const warehouseId = typeof inv.warehouse === 'string' ? inv.warehouse : inv.warehouse?._id;
      const warehouseNameVal = typeof inv.warehouse === 'string'
        ? (inv.warehouseName || '') : (inv.warehouse?.name || inv.warehouseName || '');
      setFormData(prev => ({
        ...prev, invoice: inv._id, invoiceNumber: inv.invoiceNumber,
        customer: typeof inv.customer === 'string' ? inv.customer : inv.customer._id,
        customerName: inv.customerName,
        warehouse: warehouseId || '', warehouseName: warehouseNameVal,
      }));
      setItems(inv.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName, quantity: 0,
        price: item.sellingPrice, total: 0,
        reason: 'customer_request', maxQuantity: item.quantity,
      })));
    }
  };

  const handleItemChange = (index: number, field: keyof ReturnItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity') {
      const qty = Math.min(Number(value), newItems[index].maxQuantity);
      newItems[index].quantity = qty;
      newItems[index].total = qty * newItems[index].price;
    }
    setItems(newItems);
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    const returnItems = items.filter(item => item.quantity > 0);
    if (!formData.invoice || returnItems.length === 0) {
      showWarning("Iltimos, hisob-fakturani tanlang va qaytariladigan mahsulotlarni kiriting!");
      return;
    }
    try {
      const result = await save({
        ...formData, items: returnItems, totalAmount, status: customerReturn?.status || 'pending',
      });
      if (isNew) {
        const newId = result._id;
        if (newId) navigate(`/sales/returns/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try { await updateStatus(newStatus); refetch(); } catch { showError("Holatni o'zgartirishda xatolik"); }
  };

  const handleDelete = async () => {
    if (!confirm("Qaytarishni o'chirishni xohlaysizmi?")) return;
    try { await deleteReturn(); navigate('/sales/returns'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printReturnAct = () => {
    const returnItems = items.filter(i => i.quantity > 0);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Qaytarish akti ${customerReturn?.returnNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    .signature{display:flex;justify-content:space-between;margin-top:40px}.signature-box{width:45%}
    .signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;text-align:center}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">QAYTARISH AKTI</h1>
    <p>${customerReturn?.returnNumber || 'Yangi'}</p><p>Sana: ${formatDate(formData.returnDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Mijoz:</div><div class="info-value">${formData.customerName}</div></div>
    <div class="info-item"><div class="info-label">Hisob-faktura №:</div><div class="info-value">${formData.invoiceNumber}</div></div>
    ${formData.organization ? `<div class="info-item"><div class="info-label">Tashkilot:</div><div class="info-value">${formData.organization}</div></div>` : ''}
    ${formData.warehouseName ? `<div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${formData.warehouseName}</div></div>` : ''}
    <div class="info-item"><div class="info-label">Qaytarish sababi:</div><div class="info-value">${REASON_LABELS[formData.reason] || formData.reason}</div></div>
    <div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${STATUS_LABELS[customerReturn?.status || 'pending']}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th><th>Sabab</th></tr></thead>
    <tbody>${returnItems.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td><td>${REASON_LABELS[item.reason] || item.reason}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;font-weight:bold;font-size:18px"><span>Jami qaytarish summasi:</span><span>${formatCurrency(totalAmount)}</span></div>
    ${formData.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${formData.notes}</div>` : ''}
    <div class="signature"><div class="signature-box"><div class="signature-line">Topshiruvchi (Mijoz)</div></div><div class="signature-box"><div class="signature-line">Qabul qiluvchi</div></div></div>
    </body></html>`;
    printViaIframe(html);
  };

  const currentStatus = customerReturn?.status || 'pending';
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'partial');

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Qaytarish"
      documentNumber={customerReturn?.returnNumber}
      documentDate={customerReturn?.returnDate}
      isNew={isNew}
      listUrl="/sales/returns"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={customerReturn?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Qaytarish akti", onClick: printReturnAct },
      ]}

      statusBadge={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1">
              <StatusBadge status={currentStatus} config={RETURN_STATUS_CONFIG} />
              {availableTransitions.length > 0 && <ChevronDown className="h-3 w-3 text-gray-400" />}
            </button>
          </DropdownMenuTrigger>
          {availableTransitions.length > 0 && (
            <DropdownMenuContent>
              {availableTransitions.map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                  <StatusBadge status={s} config={RETURN_STATUS_CONFIG} className="mr-2" />
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
              <Label className="text-xs text-gray-500">* Hisob-faktura</Label>
              <select value={formData.invoice} onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1"
                required disabled={invoicesLoading || (!isNew && !!customerReturn)}>
                <option value="">Tanlang...</option>
                {paidInvoices.map(inv => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} - {inv.customerName} ({new Intl.NumberFormat('uz-UZ').format(inv.totalAmount)} so'm)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Kontragent</Label>
              <Input value={formData.customerName} readOnly className="h-9 text-sm bg-gray-50 mt-1" placeholder="Faktura tanlang" />
            </div>
          </div>

          {/* 2-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Ombor</Label>
              <select value={formData.warehouse}
                onChange={(e) => {
                  const wh = warehouses.find(w => w._id === e.target.value);
                  setFormData(prev => ({ ...prev, warehouse: e.target.value, warehouseName: wh?.name || '' }));
                }}
                className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1">
                <option value="">Tanlang...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Qaytarish sanasi</Label>
              <Input type="date" value={formData.returnDate}
                onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                className="h-9 text-sm mt-1" required />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Tashkilot</Label>
              <Input value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Tashkilot nomi..." className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">* Qaytarish sababi</Label>
              <select value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1" required>
                <option value="defective">Nuqsonli mahsulot</option>
                <option value="wrong_item">Noto'g'ri mahsulot</option>
                <option value="customer_request">Mijoz talabi</option>
                <option value="other">Boshqa</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Izoh</Label>
              <Textarea value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot..." className="text-sm mt-1 resize-none" rows={2} />
            </div>
          </div>
        </div>
      }

      itemsTable={
        items.length > 0 ? (
          <>
            <div className="px-4 py-2.5 border-b bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Qaytariladigan mahsulotlar</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-10 px-3 py-2 text-center text-xs font-medium text-gray-500">№</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Miqdor (max)</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Narx</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Jami</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-36">Sabab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50/30">
                      <td className="px-3 py-1.5 text-center text-gray-400 text-xs">{index + 1}</td>
                      <td className="px-3 py-1.5 font-medium">{item.productName}</td>
                      <td className="px-3 py-1">
                        <div className="flex items-center gap-1 justify-end">
                          <Input type="number" min="0" max={item.maxQuantity}
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-20" placeholder="0" />
                          <span className="text-xs text-gray-400">/ {item.maxQuantity}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{item.total > 0 ? formatCurrency(item.total) : '0'}</td>
                      <td className="px-3 py-1">
                        <select value={item.reason}
                          onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-gray-200 rounded bg-white">
                          <option value="defective">Nuqsonli</option>
                          <option value="wrong_item">Noto'g'ri</option>
                          <option value="customer_request">Mijoz</option>
                          <option value="other">Boshqa</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm border-b">
            Qaytarish yaratish uchun hisob-fakturani tanlang
          </div>
        )
      }

      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Qaytariladigan: <strong className="text-gray-700">{items.filter(i => i.quantity > 0).length}</strong> pozitsiya
          </div>
          <div className="text-lg font-bold text-red-600">
            Jami qaytarish: {formatCurrency(totalAmount)} so'm
          </div>
        </div>
      }
    />
  );
};

export default ReturnDetail;
