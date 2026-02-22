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
import { useCustomerOrder } from "@/hooks/useCustomerOrder";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { CustomerOrderStatus } from "@shared/api";
import {
  Plus, Trash2, Loader2, UserPlus, Lock, DollarSign,
  Truck, FileText, CreditCard, Copy, ChevronDown,
} from "lucide-react";
import { PartnerModal } from "@/components/PartnerModal";
import { QuickProductModal } from "@/components/QuickProductModal";
import { printViaIframe } from "@/utils/print";
import { StatusBadge, ORDER_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency, formatCurrencyAmount } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  vat: number;
  total: number;
}

// Status o'tish qoidalari
const STATUS_TRANSITIONS: Record<string, CustomerOrderStatus[]> = {
  'new': ['confirmed', 'cancelled'],
  'confirmed': ['assembled', 'shipped', 'cancelled'],
  'assembled': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'returned'],
  'delivered': ['returned'],
  'returned': [],
  'cancelled': ['new'],
  'pending': ['confirmed', 'cancelled'],
  'fulfilled': [],
};

const STATUS_LABELS: Record<string, string> = {
  'new': 'Yangi',
  'confirmed': 'Tasdiqlangan',
  'assembled': "Yig'ilgan",
  'shipped': 'Yuborilgan',
  'delivered': 'Yetkazilgan',
  'returned': 'Qaytarilgan',
  'cancelled': 'Bekor qilingan',
  'pending': 'Kutilmoqda',
  'fulfilled': 'Bajarilgan',
};

const CustomerOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showWarning, showError } = useModal();

  const { order, loading, save, saving, updateStatus, deleteOrder, reserve, unreserve, refetch } = useCustomerOrder(id);
  const { partners, loading: partnersLoading, refetch: refetchPartners } = usePartners('customer');
  const { partners: workers } = usePartners('worker');
  const { products, refetch: refetchProducts } = useProducts();
  const { warehouses } = useWarehouses();
  const nav = useDocumentNavigation('customer-orders', '/sales/customer-orders');

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");
  const [quickProductIndex, setQuickProductIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    warehouse: "",
    warehouseName: "",
    assignedWorker: "",
    assignedWorkerName: "",
    notes: "",
    reserved: false,
    currency: "UZS",
    exchangeRate: 1,
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: "", productName: "", quantity: 1, price: 0, discount: 0, vat: 0, total: 0 }
  ]);

  // Buyurtma yuklanganida formani to'ldirish
  useEffect(() => {
    if (order) {
      setFormData({
        customer: typeof order.customer === 'string' ? order.customer : order.customer?._id || '',
        customerName: order.customerName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        warehouse: typeof order.warehouse === 'string' ? order.warehouse : order.warehouse?._id || '',
        warehouseName: order.warehouseName || '',
        assignedWorker: typeof order.assignedWorker === 'string' ? order.assignedWorker : order.assignedWorker?._id || '',
        assignedWorkerName: order.assignedWorkerName || '',
        notes: order.notes || "",
        reserved: order.reserved || false,
        currency: order.currency || 'UZS',
        exchangeRate: order.exchangeRate || 1,
      });
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        vat: item.vat || 0,
        total: item.total
      })));
    }
  }, [order]);

  // ===== HANDLERLAR =====

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "regular") {
      setFormData(prev => ({ ...prev, customer: "regular", customerName: "Oddiy mijoz" }));
    } else {
      const customer = partners.find(p => p._id === customerId);
      setFormData(prev => ({ ...prev, customer: customerId, customerName: customer?.name || "" }));
    }
  };

  const recalcItemTotal = (item: OrderItem) => {
    const base = (item.quantity || 0) * (item.price || 0);
    const afterDiscount = base * (1 - (item.discount || 0) / 100);
    return Math.round(afterDiscount);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = recalcItemTotal(newItems[index]);
    setItems(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    const basePrice = product ? product.sellingPrice : 0;
    const docPrice = formData.currency === 'UZS' ? basePrice : Math.round((basePrice / formData.exchangeRate) * 100) / 100;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product: productId,
      productName: product ? product.name : "",
      price: docPrice,
    };
    newItems[index].total = recalcItemTotal(newItems[index]);
    if (index === newItems.length - 1 && productId) {
      newItems.push({ product: "", productName: "", quantity: 1, price: 0, discount: 0, vat: 0, total: 0 });
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1, price: 0, discount: 0, vat: 0, total: 0 }]);
  };

  const handleCreateNewProduct = (searchTerm: string, index: number) => {
    setQuickProductName(searchTerm);
    setQuickProductIndex(index);
    setIsQuickProductOpen(true);
  };

  const handleQuickProductCreated = async (product: any) => {
    await refetchProducts();
    if (quickProductIndex !== null) {
      setTimeout(() => {
        handleProductSelect(quickProductIndex, product._id);
      }, 300);
    }
  };

  const handleApplyUniformPrice = () => {
    const defaultPrice = items.find(i => i.price > 0)?.price || 0;
    const input = prompt("Barcha mahsulotlar uchun narx:", String(defaultPrice));
    if (input !== null) {
      const price = parseFloat(input) || 0;
      setItems(items.map(item => {
        if (!item.product) return item;
        const updated = { ...item, price };
        updated.total = recalcItemTotal(updated);
        return updated;
      }));
    }
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Jami hisoblash
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalVat = useMemo(() => {
    return items.reduce((sum, item) => {
      const base = item.quantity * item.price * (1 - (item.discount || 0) / 100);
      return sum + (base * (item.vat || 0) / 100);
    }, 0);
  }, [items]);

  // To'lov holati badge
  const getPaymentBadge = () => {
    if (!order) return null;
    const paid = order.paidAmount || 0;
    if (paid >= order.totalAmount && order.totalAmount > 0) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ To'langan</span>;
    }
    if (paid > 0) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">⚠ Qisman to'langan</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">✗ To'lanmagan</span>;
  };

  // ===== SAQLASH =====
  const handleSave = async () => {
    const filledItemsForValidation = items.filter(i => i.product);
    if (!formData.customer || filledItemsForValidation.length === 0 || filledItemsForValidation.some(item => item.quantity <= 0 || item.price <= 0)) {
      showWarning("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    try {
      const filledItems = items.filter(i => i.product);
      const orderData: any = {
        ...formData,
        items: filledItems.map(i => ({
          product: i.product,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          vat: i.vat,
          total: i.total,
        })),
        totalAmount,
        vatSum: Math.round(totalVat),
        status: order ? order.status : 'new',
      };
      if (formData.customer === 'regular') delete orderData.customer;
      if (!formData.warehouse) { delete orderData.warehouse; delete orderData.warehouseName; }
      if (!formData.assignedWorker) { delete orderData.assignedWorker; delete orderData.assignedWorkerName; }

      const result = await save(orderData);

      if (isNew) {
        // Yangi buyurtma yaratildi — haqiqiy ID ga o'tish
        const newId = result._id || result.order?._id;
        if (newId) {
          navigate(`/sales/customer-orders/${newId}`, { replace: true });
        }
      } else {
        refetch();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== STATUS O'ZGARTIRISH =====
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus(newStatus);
      refetch();
    } catch {
      showError("Holatni o'zgartirishda xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Buyurtmani o'chirishni xohlaysizmi?")) return;
    try {
      await deleteOrder();
      navigate('/sales/customer-orders');
    } catch {
      showError("O'chirishda xatolik");
    }
  };

  // ===== REZERV =====
  const handleReserve = async () => {
    try {
      const result = await reserve();
      if (result.warnings && result.warnings.length > 0) {
        alert("Ogohlantirish: Ba'zi mahsulotlar yetarli emas:\n\n" +
          result.warnings.map((w: string) => `- ${w}`).join('\n'));
      }
      refetch();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleUnreserve = async () => {
    if (!confirm("Rezervni bekor qilishni xohlaysizmi?")) return;
    try {
      await unreserve();
      refetch();
    } catch (error: any) {
      showError(error.message);
    }
  };

  // ===== CHOP ETISH =====
  const buildOrderDataForPrint = () => {
    const filledItems = items.filter(i => i.product);
    return {
      ...formData,
      items: filledItems,
      totalAmount,
      orderNumber: order?.orderNumber || 'Yangi',
    };
  };

  const printCustomerReceipt = () => {
    const data = buildOrderDataForPrint();
    const currentDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const htmlString = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mijoz cheki</title>
    <style>@media print{@page{margin:10mm}body{margin:0}}body{font-family:'Courier New',monospace;max-width:80mm;margin:0 auto;padding:10px;font-size:12px}.header{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px}.company-name{font-size:18px;font-weight:bold}.info-row{display:flex;justify-content:space-between;margin:5px 0}.items{border-top:1px dashed #000;border-bottom:1px dashed #000;padding:10px 0;margin:10px 0}.item-row{margin:8px 0}.item-name{font-weight:bold}.item-details{display:flex;justify-content:space-between;font-size:11px;margin-top:2px}.total{border-top:2px solid #000;padding-top:10px;margin-top:10px;font-size:14px;font-weight:bold}.footer{text-align:center;margin-top:20px;padding-top:10px;border-top:1px dashed #000;font-size:11px}</style></head>
    <body><div class="header"><div class="company-name">CLIMART ERP</div><div>Buyurtma cheki</div><div style="font-size:10px;margin-top:5px">${currentDate}</div></div>
    <div style="font-size:14px;font-weight:bold;margin:10px 0">MIJOZ UCHUN CHECK</div>
    <div class="info-row"><span>Mijoz:</span><span><strong>${data.customerName}</strong></span></div>
    <div class="info-row"><span>Sana:</span><span>${new Date(data.orderDate).toLocaleDateString('uz-UZ')}</span></div>
    <div class="info-row"><span>Yetkazish:</span><span>${new Date(data.deliveryDate).toLocaleDateString('uz-UZ')}</span></div>
    <div class="items">${data.items.map((item: OrderItem, i: number) => `<div class="item-row"><div class="item-name">${i+1}. ${item.productName}</div><div class="item-details"><span>${item.quantity} x ${new Intl.NumberFormat('uz-UZ').format(item.price)}</span><span><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)} so'm</strong></span></div></div>`).join('')}</div>
    <div class="total"><div class="info-row"><span>JAMI:</span><span>${new Intl.NumberFormat('uz-UZ').format(data.totalAmount)} so'm</span></div></div>
    ${data.notes ? `<div style="margin-top:15px;font-size:11px"><strong>Izoh:</strong> ${data.notes}</div>` : ''}
    <div class="footer"><div>Rahmat!</div></div></body></html>`;
    printViaIframe(htmlString);
  };

  const printWarehouseReceipt = () => {
    const data = buildOrderDataForPrint();
    const currentDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const htmlString = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ombor cheki</title>
    <style>@media print{@page{margin:15mm;size:A4}body{margin:0}}body{font-family:Arial,sans-serif;max-width:210mm;margin:0 auto;padding:20px;font-size:12px}.header{text-align:center;border-bottom:3px double #000;padding-bottom:15px;margin-bottom:20px}.company-name{font-size:24px;font-weight:bold}.document-title{font-size:18px;font-weight:bold;margin:15px 0;text-transform:uppercase}.info-section{margin:20px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.info-row{display:flex;padding:5px 0}.info-label{font-weight:bold;min-width:150px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #000;padding:8px;text-align:left}th{background:#f0f0f0;font-weight:bold}.text-right{text-align:right}.text-center{text-align:center}.total-section{margin-top:20px;padding:15px;background:#f9f9f9;border:2px solid #000}.total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}.grand-total{font-size:18px;font-weight:bold;border-top:2px solid #000;padding-top:10px;margin-top:10px}.signatures{margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}.signature-box{text-align:center}.signature-line{border-top:1px solid #000;margin-top:50px;padding-top:5px}.footer{margin-top:30px;text-align:center;font-size:10px;color:#666;border-top:1px solid #ccc;padding-top:10px}</style></head>
    <body><div class="header"><div class="company-name">CLIMART ERP</div><div style="font-size:12px;color:#666">Ombor boshqaruv tizimi</div><div class="document-title">OMBOR UCHUN BUYURTMA</div><div style="font-size:11px;margin-top:5px">${currentDate}</div></div>
    <div class="info-section"><div><div class="info-row"><span class="info-label">Mijoz:</span><span><strong>${data.customerName}</strong></span></div><div class="info-row"><span class="info-label">Buyurtma sanasi:</span><span>${new Date(data.orderDate).toLocaleDateString('uz-UZ')}</span></div></div><div><div class="info-row"><span class="info-label">Yetkazish:</span><span>${new Date(data.deliveryDate).toLocaleDateString('uz-UZ')}</span></div><div class="info-row"><span class="info-label">Holat:</span><span><strong>${order ? STATUS_LABELS[order.status] || order.status : 'Yangi'}</strong></span></div></div></div>
    <table><thead><tr><th class="text-center" style="width:40px">№</th><th>Mahsulot</th><th class="text-center" style="width:80px">Miqdor</th><th class="text-right" style="width:120px">Tan narx</th><th class="text-right" style="width:120px">Sotuv narx</th><th class="text-right" style="width:140px">Jami</th></tr></thead><tbody>
    ${data.items.map((item: OrderItem, i: number) => { const p = products.find(pr => pr._id === item.product); const cost = p?.costPrice || 0; return `<tr><td class="text-center">${i+1}</td><td><strong>${item.productName}</strong></td><td class="text-center"><strong>${item.quantity}</strong></td><td class="text-right">${new Intl.NumberFormat('uz-UZ').format(cost)}</td><td class="text-right">${new Intl.NumberFormat('uz-UZ').format(item.price)}</td><td class="text-right"><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)}</strong></td></tr>`; }).join('')}
    </tbody></table>
    <div class="total-section"><div class="total-row"><span>Jami miqdor:</span><span><strong>${data.items.reduce((s: number, i: OrderItem) => s + i.quantity, 0)} dona</strong></span></div><div class="total-row grand-total"><span>JAMI SUMMA:</span><span>${new Intl.NumberFormat('uz-UZ').format(data.totalAmount)} so'm</span></div></div>
    ${data.notes ? `<div style="margin-top:20px;padding:10px;background:#fffbf0;border-left:4px solid #ffc107"><strong>Izoh:</strong> ${data.notes}</div>` : ''}
    <div class="signatures"><div class="signature-box"><div style="font-weight:bold">Tayyorlovchi</div><div class="signature-line"><div style="font-size:10px;color:#666">F.I.O. / Imzo</div></div></div><div class="signature-box"><div style="font-weight:bold">Ombor mudiri</div><div class="signature-line"><div style="font-size:10px;color:#666">F.I.O. / Imzo</div></div></div><div class="signature-box"><div style="font-weight:bold">Qabul qiluvchi</div><div class="signature-line"><div style="font-size:10px;color:#666">F.I.O. / Imzo</div></div></div></div>
    <div class="footer">CLIMART ERP tizimi tomonidan yaratilgan | ${currentDate}</div></body></html>`;
    printViaIframe(htmlString);
  };

  // ===== COMBOBOX OPSIYALARI =====
  const customerOptions: ComboboxOption[] = useMemo(() => [
    { value: 'regular', label: 'Oddiy mijoz', description: "Ro'yxatdan o'tmagan mijoz" },
    ...partners.map(p => ({ value: p._id, label: p.name, description: p.phone || '', keywords: `${p.name} ${p.phone || ''}` }))
  ], [partners]);

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

  const workerOptions: ComboboxOption[] = useMemo(() =>
    workers.map(w => ({
      value: w._id,
      label: w.name,
      description: w.phone || '',
      keywords: `${w.name} ${w.phone || ''}`
    })),
  [workers]);

  const currentStatus = order?.status || 'new';
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  // Yuklanmoqda
  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DocumentDetailLayout
        title="Mijoz buyurtmasi"
        documentNumber={order?.orderNumber}
        documentDate={order?.orderDate}
        isNew={isNew}
        listUrl="/sales/customer-orders"
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
          { label: "Nusxa ko'chirish", icon: <Copy className="h-4 w-4" />, disabled: true },
          { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
        ] : undefined}

        createActions={!isNew ? [
          { label: "Jo'natish (Otgruzka)", icon: <Truck className="h-4 w-4" />, onClick: () => navigate(`/sales/shipments/new?orderId=${id}`) },
          { label: "Hisob-faktura", icon: <FileText className="h-4 w-4" />, disabled: true },
          { label: "Kirim to'lov", icon: <CreditCard className="h-4 w-4" />, disabled: true },
        ] : undefined}

        printActions={[
          { label: "Mijoz uchun check", onClick: printCustomerReceipt },
          { label: "Ombor uchun check", onClick: printWarehouseReceipt },
          { label: "Ikkala check", onClick: () => { printCustomerReceipt(); setTimeout(printWarehouseReceipt, 1500); } },
        ]}

        paymentBadge={order ? getPaymentBadge() : undefined}

        statusBadge={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1">
                <StatusBadge status={currentStatus} config={ORDER_STATUS_CONFIG} />
                {availableTransitions.length > 0 && <ChevronDown className="h-3 w-3 text-gray-400" />}
              </button>
            </DropdownMenuTrigger>
            {availableTransitions.length > 0 && (
              <DropdownMenuContent>
                {availableTransitions.map(s => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                    <StatusBadge status={s} config={ORDER_STATUS_CONFIG} className="mr-2" />
                    {STATUS_LABELS[s] || s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        }

        headerExtra={
          <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={formData.reserved}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData(prev => ({ ...prev, reserved: checked }));
                if (!isNew && id) {
                  if (checked) handleReserve();
                  else handleUnreserve();
                }
              }}
              className="rounded border-gray-300"
            />
            <Lock className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-600">Rezerv</span>
          </label>
        }

        formFields={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
            {/* 1-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Kontragent</Label>
                <div className="flex gap-1 mt-1">
                  <Combobox
                    options={customerOptions}
                    value={formData.customer}
                    onValueChange={handleCustomerChange}
                    placeholder="Kontragent tanlang..."
                    searchPlaceholder="Nom yoki telefon..."
                    emptyText="Topilmadi"
                    disabled={partnersLoading}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setIsPartnerModalOpen(true)}
                    title="Yangi kontragent"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Plan. jo'natish sanasi</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Ombor</Label>
                <Combobox
                  options={warehouseOptions}
                  value={formData.warehouse}
                  onValueChange={(value) => {
                    const wh = warehouses.find(w => w._id === value);
                    setFormData(prev => ({ ...prev, warehouse: value, warehouseName: wh?.name || '' }));
                  }}
                  placeholder="Ombor tanlang..."
                  searchPlaceholder="Ombor qidirish..."
                  emptyText="Topilmadi"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Buyurtma sanasi</Label>
                <Input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  className="h-9 text-sm mt-1"
                  required
                />
              </div>
            </div>

            {/* 3-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Usta</Label>
                <Combobox
                  options={workerOptions}
                  value={formData.assignedWorker}
                  onValueChange={(value) => {
                    const worker = workers.find(w => w._id === value);
                    setFormData(prev => ({ ...prev, assignedWorker: value, assignedWorkerName: worker?.name || '' }));
                  }}
                  placeholder="Usta tanlang..."
                  emptyText="Usta topilmadi"
                  className="h-9 text-sm mt-1"
                />
              </div>
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
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  className="text-sm mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        }

        itemsTable={
          <>
            {/* Pozitsiyalar header */}
            <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Pozitsiyalar</span>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded">
                  Jami ({items.filter(i => i.product).length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={handleApplyUniformPrice} size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <DollarSign className="h-3 w-3" />
                  Umumiy narx
                </Button>
                <Button type="button" onClick={addItem} size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  Mahsulot qo'shish
                </Button>
              </div>
            </div>

            {/* Items jadval */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center text-xs font-medium text-gray-500">№</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 min-w-[220px]">Nomi</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-20">Miqdor</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-16">Mavjud</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-16">Qoldiq</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">Narx</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-16">Chegirma %</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">Summa</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(p => p._id === item.product);
                    const stock = selectedProduct ? selectedProduct.quantity : 0;
                    const available = selectedProduct ? selectedProduct.quantity - (selectedProduct.reserved || 0) : 0;

                    return (
                      <tr key={index} className="hover:bg-blue-50/30">
                        <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{index + 1}</td>
                        <td className="px-2 py-1">
                          <Combobox
                            options={productOptions}
                            value={item.product}
                            onValueChange={(value) => handleProductSelect(index, value)}
                            placeholder="Mahsulot tanlang..."
                            emptyText="Topilmadi"
                            className="h-8 text-sm border-0 shadow-none hover:bg-gray-50 px-1"
                            onCreateNew={(searchTerm) => handleCreateNewProduct(searchTerm, index)}
                            createNewLabel="Yangi tovar"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {selectedProduct ? (
                            <span className={`text-xs ${available > 0 ? 'text-green-600' : available < 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {available}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {selectedProduct ? (
                            <span className="text-xs text-gray-500">{stock}</span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            min="0"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || ''}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right w-full"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-sm">
                          {item.total > 0 ? formatCurrency(item.total) : '0'}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Qo'shish qatori */}
                  <tr className="bg-gray-50/50">
                    <td className="px-2 py-2 text-center text-gray-300">
                      <Plus className="h-3.5 w-3.5 mx-auto" />
                    </td>
                    <td colSpan={8} className="px-2 py-2">
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        Pozitsiya qo'shish — nom, kod yoki shtrix-kodni kiriting...
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
              <span>Miqdor: <strong className="text-gray-700">{totalQuantity}</strong></span>
              <span>Pozitsiyalar: <strong className="text-gray-700">{items.filter(i => i.product).length}</strong></span>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500">
                Oraliq jami <span className="font-medium text-gray-700 ml-4">{formatCurrencyAmount(totalAmount, formData.currency)}</span>
              </div>
              {totalVat > 0 && (
                <div className="text-sm text-gray-500">
                  QQS summasi <span className="font-medium text-gray-700 ml-4">{formatCurrencyAmount(Math.round(totalVat), formData.currency)}</span>
                </div>
              )}
              <div className="text-lg font-bold text-gray-900 pt-1 border-t">
                Umumiy summa <span className="ml-4">{formatCurrencyAmount(totalAmount + Math.round(totalVat), formData.currency)}</span>
              </div>
              {formData.currency !== 'UZS' && (
                <div className="text-sm text-gray-500 mt-1">
                  UZS ekvivalenti <span className="font-medium text-gray-700 ml-4">
                    {formatCurrency(Math.round((totalAmount + Math.round(totalVat)) * formData.exchangeRate))}
                  </span>
                </div>
              )}
            </div>
          </div>
        }
      />

      <PartnerModal
        open={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSuccess={() => { refetchPartners(); }}
        initialType="customer"
      />

      <QuickProductModal
        open={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        onCreated={handleQuickProductCreated}
        defaultName={quickProductName}
      />
    </>
  );
};

export default CustomerOrderDetail;
