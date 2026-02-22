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
import { useSupplierInvoice } from "@/hooks/useSupplierInvoice";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Trash2, Loader2, ChevronDown, CreditCard, Plus,
} from "lucide-react";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, INVOICE_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

const ReceivedInvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError, showSuccess } = useModal();

  const { invoice, loading, save, saving, createPayment, deleteInvoice, refetch } = useSupplierInvoice(id);
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const nav = useDocumentNavigation('received-invoices', '/purchases/received-invoices');

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    notes: "",
    currency: "UZS",
    exchangeRate: 1,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { productName: "", quantity: 1, price: 0, total: 0 },
  ]);

  // Mavjud fakturani yuklash
  useEffect(() => {
    if (invoice) {
      setFormData({
        supplier: typeof invoice.supplier === 'string' ? invoice.supplier : invoice.supplier._id,
        supplierName: invoice.supplierName,
        invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        notes: invoice.notes || "",
        currency: (invoice as any).currency || 'UZS',
        exchangeRate: (invoice as any).exchangeRate || 1,
      });
      setItems(invoice.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })));
      // Default payment amount = remaining balance
      setPaymentAmount(invoice.totalAmount - invoice.paidAmount);
    }
  }, [invoice]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData(prev => ({ ...prev, supplier: supplierId, supplierName: supplier?.name || "" }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productName: "", quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const remainingBalance = (invoice?.totalAmount || totalAmount) - (invoice?.paidAmount || 0);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.supplier) { showWarning("Yetkazib beruvchini tanlang!"); return; }
    if (items.some(item => !item.productName || item.quantity <= 0)) {
      showWarning("Barcha mahsulotlarni to'ldiring!"); return;
    }
    try {
      const result = await save({
        ...formData,
        items,
        totalAmount,
        paidAmount: invoice?.paidAmount || 0,
        status: invoice?.status || 'unpaid',
      });
      if (isNew) {
        const newId = result._id || result.invoice?._id;
        if (newId) navigate(`/purchases/received-invoices/${newId}`, { replace: true });
      } else { refetch(); }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== TO'LOV =====
  const handlePayment = async () => {
    if (paymentAmount <= 0) { showWarning("To'lov summasini kiriting!"); return; }
    if (paymentAmount > remainingBalance) { showWarning("To'lov summasi qoldiqdan oshib ketdi!"); return; }
    try {
      await createPayment({ amount: paymentAmount, notes: paymentNotes, method: paymentMethod });
      setShowPaymentForm(false);
      setPaymentNotes("");
      refetch();
      showSuccess("To'lov muvaffaqiyatli amalga oshirildi");
    } catch (error) {
      showError(error instanceof Error ? error.message : "To'lov xatoligi");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Fakturani o'chirishni xohlaysizmi?")) return;
    try { await deleteInvoice(); navigate('/purchases/received-invoices'); } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printInvoice = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hisob-faktura ${invoice?.invoiceNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}
    .info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
    th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1 style="margin:0">YETKAZIB BERUVCHI HISOB-FAKTURASI</h1><p>${invoice?.invoiceNumber || 'Yangi'}</p>
    <p>Sana: ${formatDate(formData.invoiceDate)}</p></div>
    <div class="info-grid">
    <div class="info-item"><div class="info-label">Yetkazib beruvchi:</div><div class="info-value">${formData.supplierName}</div></div>
    <div class="info-item"><div class="info-label">To'lov muddati:</div><div class="info-value">${formatDate(formData.dueDate)}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th></tr></thead>
    <tbody>${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>`).join('')}</tbody></table>
    <div style="border-top:2px solid #333;padding-top:10px">
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:18px"><span>Jami:</span><span>${formatCurrency(invoice?.totalAmount || totalAmount)}</span></div>
    <div style="display:flex;justify-content:space-between;color:green;font-size:14px;margin-top:5px"><span>To'langan:</span><span>${formatCurrency(invoice?.paidAmount || 0)}</span></div>
    <div style="display:flex;justify-content:space-between;color:red;font-size:14px;margin-top:5px"><span>Qoldiq:</span><span>${formatCurrency(remainingBalance)}</span></div>
    </div></body></html>`;
    printViaIframe(html);
  };

  const currentStatus = invoice?.status || 'unpaid';

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DocumentDetailLayout
      title="Yetkazib beruvchi hisob-fakturasi"
      documentNumber={invoice?.invoiceNumber}
      documentDate={invoice?.invoiceDate}
      isNew={isNew}
      listUrl="/purchases/received-invoices"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={invoice?.updatedAt}

      editActions={!isNew ? [
        ...(currentStatus !== 'paid' ? [{ label: "To'lov qilish", icon: <CreditCard className="h-4 w-4" />, onClick: () => setShowPaymentForm(!showPaymentForm) }] : []),
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      printActions={[
        { label: "Hisob-faktura", onClick: printInvoice },
      ]}

      statusBadge={
        <StatusBadge status={currentStatus} config={INVOICE_STATUS_CONFIG} />
      }

      formFields={
        <div className="space-y-4">
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
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Faktura sanasi</Label>
                <Input type="date" value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="h-9 text-sm mt-1" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">* To'lov muddati</Label>
                <Input type="date" value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
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

          {/* To'lov form */}
          {showPaymentForm && !isNew && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <h4 className="font-medium text-sm text-blue-900">To'lov qilish</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Summa (qoldiq: {formatCurrency(remainingBalance)})</Label>
                  <Input type="number" min="0" max={remainingBalance} value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Usul</Label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white mt-1">
                    <option value="cash">Naqd</option>
                    <option value="card">Karta</option>
                    <option value="transfer">O'tkazma</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Izoh</Label>
                  <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                    className="h-9 text-sm mt-1" placeholder="To'lov izohi..." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handlePayment}>To'lash</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)}>Bekor</Button>
              </div>
            </div>
          )}
        </div>
      }

      itemsTable={
        <>
          <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Pozitsiyalar ({items.length})</span>
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
                        onValueChange={(value) => handleItemChange(index, 'productName', value)}
                        placeholder="Mahsulot nomi..."
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
            <span className="text-gray-500">Jami:</span> <span className="font-bold text-base">{formatCurrencyAmount(invoice?.totalAmount || totalAmount, formData.currency)}</span>
            {formData.currency !== 'UZS' && (
              <div className="text-xs text-gray-500 mt-1">
                UZS ekvivalenti <span className="font-medium text-gray-700 ml-2">
                  {formatCurrency(Math.round((invoice?.totalAmount || totalAmount) * formData.exchangeRate))}
                </span>
              </div>
            )}
          </div>
          {!isNew && (
            <>
              <div><span className="text-green-600">To'langan:</span> <span className="font-bold text-base text-green-600">{formatCurrency(invoice?.paidAmount || 0)}</span></div>
              <div><span className="text-red-600">Qoldiq:</span> <span className="font-bold text-base text-red-600">{formatCurrency(remainingBalance)}</span></div>
            </>
          )}
        </div>
      }
    />
  );
};

export default ReceivedInvoiceDetail;
