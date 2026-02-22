import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { usePartners } from "@/hooks/usePartners";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useCustomerInvoice } from "@/hooks/useCustomerInvoice";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import {
  Plus, Trash2, Loader2, UserPlus, FileText, ChevronDown,
} from "lucide-react";
import { PartnerModal } from "@/components/PartnerModal";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, INVOICE_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency } from "@/lib/format";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const CustomerInvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { invoice, loading, save, saving, deleteInvoice, refetch } = useCustomerInvoice(id);
  const { partners, loading: partnersLoading, refetch: refetchPartners } = usePartners('customer');
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const { orders } = useCustomerOrders();
  const nav = useDocumentNavigation('customer-invoices', '/sales/customer-invoices');

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");
  const [quickProductIndex, setQuickProductIndex] = useState<number | null>(null);
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
    notes: "",
  });

  const emptyItem: InvoiceItem = { product: "", productName: "", quantity: 1, sellingPrice: 0, costPrice: 0, discount: 0, discountAmount: 0, total: 0, warehouse: "", warehouseName: "" };

  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);

  // Hisob-faktura yuklanganida formani to'ldirish
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
        notes: invoice.notes || "",
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
        warehouseName: item.warehouseName || "",
      })));
    }
  }, [invoice]);

  // ===== HANDLERLAR =====

  const handleCustomerChange = async (customerId: string) => {
    const customer = partners.find(p => p._id === customerId);
    setFormData(prev => ({ ...prev, customer: customerId, customerName: customer?.name || "" }));
    if (customerId) {
      try {
        setCreditInfo(await api.get(`/api/customer-invoices/credit-check/${customerId}`));
      } catch { setCreditInfo(null); }
    } else {
      setCreditInfo(null);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({ ...prev, warehouse: warehouseId, warehouseName: warehouse?.name || "" }));
    setItems(prev => prev.map(item => ({
      ...item,
      warehouse: item.warehouse || warehouseId,
      warehouseName: item.warehouseName || (warehouse?.name || ""),
    })));
  };

  const handleLoadFromOrder = () => {
    if (!selectedOrder) { showWarning("Iltimos, buyurtmani tanlang!"); return; }
    const order = orders.find(o => o._id === selectedOrder);
    if (!order) return;
    setFormData(prev => ({
      ...prev,
      customer: (typeof order.customer === 'object' && order.customer ? order.customer._id : order.customer) as string,
      customerName: order.customerName,
    }));
    const orderItems: InvoiceItem[] = order.items.map(oItem => {
      const prodId = (typeof oItem.product === 'object' && oItem.product ? oItem.product._id : oItem.product) as string;
      const product = products.find(p => p._id === prodId);
      return {
        product: prodId, productName: oItem.productName, quantity: oItem.quantity,
        sellingPrice: oItem.price, costPrice: product ? product.costPrice : 0,
        discount: 0, discountAmount: 0, total: oItem.total,
        warehouse: formData.warehouse, warehouseName: formData.warehouseName,
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
      product: productId, productName: product ? product.name : "",
      sellingPrice: product ? product.sellingPrice : 0,
      costPrice: product ? product.costPrice : 0,
      warehouse: newItems[index].warehouse || formData.warehouse,
      warehouseName: newItems[index].warehouseName || formData.warehouseName,
    };
    newItems[index] = recalcItemTotal(newItems[index]);
    if (index === newItems.length - 1 && productId) {
      newItems.push({ ...emptyItem, warehouse: formData.warehouse, warehouseName: formData.warehouseName });
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem, warehouse: formData.warehouse, warehouseName: formData.warehouseName }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateNewProduct = (searchTerm: string, index: number) => {
    setQuickProductName(searchTerm);
    setQuickProductIndex(index);
    setIsQuickProductOpen(true);
  };

  const handleQuickProductCreated = async (product: any) => {
    await refetchProducts();
    if (quickProductIndex !== null) {
      setTimeout(() => handleProductSelect(quickProductIndex, product._id), 300);
    }
  };

  // Jami hisoblash
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0), [items]);
  const discountTotal = useMemo(() => items.reduce((sum, item) => sum + item.discountAmount, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // To'lov holati badge
  const getPaymentBadge = () => {
    if (!invoice) return null;
    const paid = invoice.paidAmount || 0;
    if (paid >= invoice.totalAmount && invoice.totalAmount > 0)
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ To'langan</span>;
    if (paid > 0)
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">⚠ Qisman to'langan</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">✗ To'lanmagan</span>;
  };

  // ===== SAQLASH =====
  const handleSave = async () => {
    const filledItems = items.filter(i => i.product);
    if (!formData.customer || filledItems.length === 0 || filledItems.some(item => item.quantity <= 0 || item.sellingPrice <= 0)) {
      showWarning("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    try {
      const dataToSave: any = {
        ...formData, items: filledItems,
        totalAmount: subtotal, discountTotal, finalAmount: totalAmount,
        paidAmount: invoice ? invoice.paidAmount : 0,
        shippedAmount: invoice ? invoice.shippedAmount : 0,
        status: invoice ? invoice.status : 'unpaid',
        shippedStatus: invoice ? invoice.shippedStatus : 'not_shipped',
      };
      if (!dataToSave.warehouse) { delete dataToSave.warehouse; delete dataToSave.warehouseName; }

      const result = await save(dataToSave);
      if (isNew) {
        const newId = result._id || result.invoice?._id;
        if (newId) navigate(`/sales/customer-invoices/${newId}`, { replace: true });
      } else {
        refetch();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Hisob-fakturani o'chirishni xohlaysizmi?")) return;
    try {
      await deleteInvoice();
      navigate('/sales/customer-invoices');
    } catch { showError("O'chirishda xatolik"); }
  };

  // ===== CHOP ETISH =====
  const printCustomerReceipt = () => {
    const filledItems = items.filter(i => i.product);
    const itemsRows = filledItems.map((item, i) => `
      <tr><td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.sellingPrice)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.total)}</td></tr>
    `).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mijoz cheki - ${invoice?.invoiceNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse;margin:15px 0}
    .header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px}
    @media print{.no-print{display:none}}</style></head><body>
    <div class="header"><h2 style="margin:0">SOTUV CHEKI</h2><p style="margin:5px 0;color:#666">Mijoz nusxasi</p>
    <p style="margin:5px 0"><strong>${invoice?.invoiceNumber || 'Yangi'}</strong></p></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:15px">
    <div><strong>Mijoz:</strong> ${formData.customerName}</div>
    <div><strong>Sana:</strong> ${new Date(formData.invoiceDate).toLocaleDateString('uz-UZ')}</div></div>
    <table><thead><tr style="background:#f5f5f5">
    <th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Mahsulot</th>
    <th style="padding:8px;text-align:center">Miqdor</th><th style="padding:8px;text-align:right">Narx</th>
    <th style="padding:8px;text-align:right">Jami</th></tr></thead><tbody>${itemsRows}</tbody>
    <tfoot><tr style="font-weight:bold;font-size:16px"><td colspan="4" style="padding:10px;text-align:right">JAMI:</td>
    <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(totalAmount)} so'm</td></tr></tfoot></table>
    ${invoice ? `<div style="margin-top:10px"><strong>To'langan:</strong> ${new Intl.NumberFormat('uz-UZ').format(invoice.paidAmount)} so'm</div>
    <div><strong>Qoldiq:</strong> ${new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount - invoice.paidAmount)} so'm</div>` : ''}
    <div style="margin-top:20px;border-top:1px dashed #ccc;padding-top:15px;text-align:center;font-size:12px">Xaridingiz uchun rahmat!</div>
    </body></html>`;
    printViaIframe(html);
  };

  const printWarehouseReceipt = () => {
    const filledItems = items.filter(i => i.product);
    const itemsRows = filledItems.map((item, i) => `
      <tr><td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.warehouseName || '-'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.costPrice)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.quantity * item.costPrice)}</td></tr>
    `).join('');
    const totalCost = filledItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ombor cheki - ${invoice?.invoiceNumber || 'Yangi'}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse;margin:15px 0}
    .header{text-align:center;border-bottom:2px solid #d97706;padding-bottom:15px;margin-bottom:20px}
    @media print{.no-print{display:none}}</style></head><body>
    <div class="header"><h2 style="margin:0;color:#d97706">OMBOR CHEKI</h2>
    <p style="margin:5px 0;color:#666">Ombor nusxasi</p><p style="margin:5px 0"><strong>${invoice?.invoiceNumber || 'Yangi'}</strong></p></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:15px">
    <div><strong>Mijoz:</strong> ${formData.customerName}</div>
    <div><strong>Sana:</strong> ${new Date(formData.invoiceDate).toLocaleDateString('uz-UZ')}</div></div>
    <div style="margin-bottom:10px"><strong>Ombor:</strong> ${formData.warehouseName || '-'}</div>
    <table><thead><tr style="background:#fef3c7">
    <th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Mahsulot</th>
    <th style="padding:8px;text-align:center">Miqdor</th><th style="padding:8px;text-align:left">Ombor</th>
    <th style="padding:8px;text-align:right">Tan narx</th><th style="padding:8px;text-align:right">Jami tan narx</th>
    </tr></thead><tbody>${itemsRows}</tbody>
    <tfoot><tr style="font-weight:bold;font-size:16px"><td colspan="5" style="padding:10px;text-align:right">JAMI TAN NARX:</td>
    <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(totalCost)} so'm</td></tr>
    <tr style="font-weight:bold;color:#16a34a"><td colspan="5" style="padding:10px;text-align:right">SOTUV NARXI:</td>
    <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(totalAmount)} so'm</td></tr>
    <tr style="font-weight:bold;color:#2563eb"><td colspan="5" style="padding:10px;text-align:right">FOYDA:</td>
    <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(totalAmount - totalCost)} so'm</td></tr></tfoot></table>
    <div style="margin-top:20px;border-top:1px dashed #ccc;padding-top:15px;display:flex;justify-content:space-between">
    <div>Topshirdi: _______________</div><div>Qabul qildi: _______________</div></div>
    </body></html>`;
    printViaIframe(html);
  };

  // ===== COMBOBOX OPSIYALARI =====
  const customerOptions: ComboboxOption[] = useMemo(() =>
    partners.map(p => ({ value: p._id, label: p.name, description: p.phone || '', keywords: `${p.name} ${p.phone || ''}` })),
  [partners]);

  const warehouseOptions: ComboboxOption[] = useMemo(() => [
    { value: '', label: 'Tanlanmagan' },
    ...warehouses.map(w => ({ value: w._id, label: w.name }))
  ], [warehouses]);

  const productOptions: ComboboxOption[] = useMemo(() =>
    products.map(p => ({
      value: p._id,
      label: p.brand ? `${p.brand} • ${p.name}` : p.name,
      description: `Mavjud: ${p.quantity - (p.reserved || 0)} ${p.unit || 'dona'} • ${(p.sellingPrice || 0).toLocaleString()} so'm`,
      keywords: `${p.name} ${p.sku || ''} ${p.barcode || ''} ${p.brand || ''} ${p.category || ''}`
    })),
  [products]);

  if (loading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <DocumentDetailLayout
        title="Hisob-faktura"
        documentNumber={invoice?.invoiceNumber}
        documentDate={invoice?.invoiceDate}
        isNew={isNew}
        listUrl="/sales/customer-invoices"
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
          { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
        ] : undefined}

        printActions={[
          { label: "Mijoz uchun chek", onClick: printCustomerReceipt },
          { label: "Ombor uchun chek", onClick: printWarehouseReceipt },
          { label: "Ikkala chek", onClick: () => { printCustomerReceipt(); setTimeout(printWarehouseReceipt, 1500); } },
        ]}

        paymentBadge={invoice ? getPaymentBadge() : undefined}
        statusBadge={invoice ? <StatusBadge status={invoice.status} config={INVOICE_STATUS_CONFIG} /> : undefined}

        formFields={
          <div className="space-y-4">
            {/* Buyurtmadan yuklash */}
            {isNew && !showOrderSelect && (
              <Button type="button" variant="outline" onClick={() => setShowOrderSelect(true)} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Buyurtma asosida yaratish
              </Button>
            )}
            {showOrderSelect && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <Label>Buyurtmani tanlang</Label>
                <div className="flex gap-2 mt-2">
                  <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Tanlang...</option>
                    {orders.filter(o => o.status !== 'cancelled').map(order => (
                      <option key={order._id} value={order._id}>
                        {order.orderNumber} - {order.customerName} ({new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm)
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={handleLoadFromOrder} size="sm">Yuklash</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowOrderSelect(false); setSelectedOrder(""); }}>Bekor</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              {/* 1-ustun */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">* Kontragent</Label>
                  <div className="flex gap-1 mt-1">
                    <Combobox options={customerOptions} value={formData.customer} onValueChange={handleCustomerChange}
                      placeholder="Kontragent tanlang..." searchPlaceholder="Nom yoki telefon..." emptyText="Topilmadi"
                      disabled={partnersLoading} className="h-9 text-sm" />
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => setIsPartnerModalOpen(true)} title="Yangi kontragent">
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {creditInfo?.hasCreditLimit && (
                    <div className={`mt-1 text-xs px-2 py-1 rounded ${creditInfo.available > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      Kredit limit: {new Intl.NumberFormat('uz-UZ').format(creditInfo.creditLimit)} | Qarz: {new Intl.NumberFormat('uz-UZ').format(creditInfo.currentDebt)} | Mavjud: {new Intl.NumberFormat('uz-UZ').format(Math.max(0, creditInfo.available))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">To'lov muddati</Label>
                  <Input type="date" value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="h-9 text-sm mt-1" required />
                </div>
              </div>

              {/* 2-ustun */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Ombor</Label>
                  <Combobox options={warehouseOptions} value={formData.warehouse} onValueChange={handleWarehouseChange}
                    placeholder="Ombor tanlang..." emptyText="Topilmadi" className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">* Hisob-faktura sanasi</Label>
                  <Input type="date" value={formData.invoiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
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
                  <Label className="text-xs text-gray-500">Izoh</Label>
                  <Textarea value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Qo'shimcha ma'lumot..." className="text-sm mt-1 resize-none" rows={3} />
                </div>
              </div>
            </div>
          </div>
        }

        itemsTable={
          <>
            <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Pozitsiyalar</span>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded">
                  Jami ({items.filter(i => i.product).length})
                </span>
              </div>
              <Button type="button" onClick={addItem} size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Mahsulot qo'shish
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center text-xs font-medium text-gray-500">№</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 min-w-[200px]">Nomi</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-32">Ombor</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-20">Miqdor</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">Sotish narxi</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-16">Chegirma %</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">Summa</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(p => p._id === item.product);
                    const warehouseStock = selectedProduct?.stockByWarehouse?.find((sw: any) => sw.warehouse === item.warehouse);
                    return (
                      <tr key={index} className="hover:bg-blue-50/30">
                        <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{index + 1}</td>
                        <td className="px-2 py-1">
                          <Combobox options={productOptions} value={item.product}
                            onValueChange={(value) => handleProductSelect(index, value)}
                            placeholder="Mahsulot tanlang..." emptyText="Topilmadi"
                            className="h-8 text-sm border-0 shadow-none hover:bg-gray-50 px-1"
                            onCreateNew={(searchTerm) => handleCreateNewProduct(searchTerm, index)}
                            createNewLabel="Yangi tovar" />
                        </td>
                        <td className="px-2 py-1">
                          <select value={item.warehouse} onChange={(e) => handleItemChange(index, 'warehouse', e.target.value)}
                            className="w-full h-8 px-2 text-xs border border-gray-200 rounded bg-white">
                            <option value="">Ombor...</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <Input type="number" min="0"
                            step={selectedProduct?.unitType === 'uncount' ? "any" : "1"}
                            value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full" />
                        </td>
                        <td className="px-2 py-1">
                          <Input type="number" min="0" value={item.sellingPrice || ''}
                            onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full" />
                        </td>
                        <td className="px-2 py-1">
                          <Input type="number" min="0" max="100" value={item.discount || ''}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full" placeholder="0" />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-sm">
                          {item.total > 0 ? formatCurrency(item.total) : '0'}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <Button type="button" onClick={() => removeItem(index)} size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" disabled={items.length === 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50/50">
                    <td className="px-2 py-2 text-center text-gray-300"><Plus className="h-3.5 w-3.5 mx-auto" /></td>
                    <td colSpan={7} className="px-2 py-2">
                      <button type="button" onClick={addItem} className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
                        Pozitsiya qo'shish...
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        }

        footer={
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Pozitsiyalar: <strong className="text-gray-700">{items.filter(i => i.product).length}</strong></span>
            </div>
            <div className="text-right space-y-1">
              {discountTotal > 0 && (
                <>
                  <div className="text-sm text-gray-500">
                    Summa <span className="font-medium text-gray-700 ml-4">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="text-sm text-red-500">
                    Chegirma <span className="font-semibold ml-4">-{formatCurrency(discountTotal)}</span>
                  </div>
                </>
              )}
              <div className="text-lg font-bold text-gray-900 pt-1 border-t">
                Jami to'lov <span className="ml-4">{formatCurrency(totalAmount)} so'm</span>
              </div>
            </div>
          </div>
        }
      />

      <PartnerModal open={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)}
        onSuccess={() => refetchPartners()} initialType="customer" />
      <QuickProductModal open={isQuickProductOpen} onClose={() => setIsQuickProductOpen(false)}
        onCreated={handleQuickProductCreated} defaultName={quickProductName} />
    </>
  );
};

export default CustomerInvoiceDetail;
