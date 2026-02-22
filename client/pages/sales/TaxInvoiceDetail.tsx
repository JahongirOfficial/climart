import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useShipments } from "@/hooks/useShipments";
import { useTaxInvoice } from "@/hooks/useTaxInvoice";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Loader2, Send, CheckCircle, XCircle } from "lucide-react";
import { printViaIframe } from "@/utils/print";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency, formatDate } from "@/lib/format";

interface TaxItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  taxRate: number;
}

const TaxInvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = id === "new";
  const { showWarning, showError } = useModal();

  const { invoice, loading, save, saving, updateStatus, deleteInvoice } = useTaxInvoice(id);
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { currentIndex, totalCount, hasPrev, hasNext, goToPrev, goToNext } =
    useDocumentNavigation("tax-invoices", "/sales/tax-invoices");

  // ---------- Form state ----------
  const [selectedShipment, setSelectedShipment] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TaxItem[]>([]);
  const [currency, setCurrency] = useState("UZS");
  const [exchangeRate, setExchangeRate] = useState(1);

  // ---------- Load existing invoice ----------
  useEffect(() => {
    if (invoice && !isNew) {
      setSelectedShipment(
        typeof invoice.shipment === "object" ? invoice.shipment._id : invoice.shipment || ""
      );
      setInvoiceDate(invoice.invoiceDate?.split("T")[0] || "");
      setOrganization(invoice.organization || "");
      setNotes(invoice.notes || "");
      setCurrency((invoice as any).currency || "UZS");
      setExchangeRate((invoice as any).exchangeRate || 1);
      setItems(
        (invoice.items || []).map((it: any) => ({
          product: typeof it.product === "object" ? it.product._id : it.product,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
          taxRate: it.taxRate ?? 12,
        }))
      );
    }
  }, [invoice, isNew]);

  // ---------- Pre-populate from ?shipmentId ----------
  useEffect(() => {
    if (isNew && shipments.length > 0) {
      const shipmentId = searchParams.get("shipmentId");
      if (shipmentId) {
        setSelectedShipment(shipmentId);
        loadShipmentData(shipmentId);
      }
    }
  }, [isNew, shipments]);

  // ---------- Helpers ----------
  const loadShipmentData = (shipId: string) => {
    const shipment = shipments.find((s) => s._id === shipId);
    if (shipment) {
      setOrganization(shipment.organization || "");
      setItems(
        (shipment.items || []).map((item: any) => ({
          product: typeof item.product === "object" ? item.product._id : item.product,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          taxRate: 12,
        }))
      );
    }
  };

  const handleShipmentChange = (shipId: string) => {
    setSelectedShipment(shipId);
    loadShipmentData(shipId);
  };

  // ---------- Calculations ----------
  const calcSubtotal = (it: TaxItem) => it.quantity * it.price;
  const calcTax = (it: TaxItem) => calcSubtotal(it) * (it.taxRate / 100);
  const calcTotal = (it: TaxItem) => calcSubtotal(it) + calcTax(it);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + calcSubtotal(it), 0);
    const totalTax = items.reduce((s, it) => s + calcTax(it), 0);
    return { subtotal, totalTax, total: subtotal + totalTax };
  }, [items]);

  // ---------- Save ----------
  const handleSave = async () => {
    const shipment = shipments.find((s) => s._id === selectedShipment);
    if (!shipment) {
      showWarning("Yuklab yuborish tanlanmagan");
      return;
    }
    if (!organization.trim()) {
      showWarning("Tashkilot kiriting");
      return;
    }
    if (items.length === 0) {
      showWarning("Mahsulotlar ro'yxati bo'sh");
      return;
    }

    try {
      const payload = {
        shipment: selectedShipment,
        shipmentNumber: shipment.shipmentNumber,
        customer: shipment.customer,
        customerName: shipment.customerName,
        organization,
        invoiceDate,
        items,
        notes,
        currency,
        exchangeRate,
      };

      const result = await save(payload);
      if (isNew && result?._id) {
        navigate(`/sales/tax-invoices/${result._id}`, { replace: true });
      }
    } catch (err: any) {
      showError(err?.message || "Xatolik yuz berdi");
    }
  };

  // ---------- Status ----------
  const handleStatusToggle = async () => {
    if (!invoice) return;
    const newStatus = invoice.status === "sent" ? "not_sent" : "sent";
    try {
      await updateStatus(newStatus);
    } catch {
      showError("Holatni o'zgartirishda xatolik");
    }
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!window.confirm("Hisob-fakturani o'chirishni xohlaysizmi?")) return;
    try {
      await deleteInvoice();
      navigate("/sales/tax-invoices");
    } catch {
      showError("O'chirishda xatolik");
    }
  };

  // ---------- Print ----------
  const handlePrint = () => {
    const selectedShip = shipments.find((s) => s._id === selectedShipment);
    const printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hisob-faktura ${invoice?.invoiceNumber || "yangi"}</title>
<style>body{font-family:Arial,sans-serif;padding:40px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}.header h1{margin:0;color:#333}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item{padding:10px;background:#f5f5f5;border-radius:5px}.info-label{font-size:12px;color:#666;margin-bottom:5px}.info-value{font-weight:bold;color:#333}table{width:100%;border-collapse:collapse;margin-bottom:30px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}th{background:#f5f5f5;font-weight:bold}.text-right{text-align:right}.summary{margin-top:20px}.summary-row{display:flex;justify-content:space-between;padding:10px 0}.summary-row.tax{color:#f97316;font-weight:600}.summary-row.total{border-top:2px solid #333;font-weight:bold;font-size:18px}.signature{display:flex;justify-content:space-between;margin-top:60px}.signature-box{width:45%}.signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;text-align:center}@media print{body{padding:20px}}</style></head><body>
<div class="header"><h1>HISOB-FAKTURA</h1><p>№ ${invoice?.invoiceNumber || ""}</p><p>Sana: ${formatDate(invoiceDate)}</p></div>
<div class="info-grid">
<div class="info-item"><div class="info-label">Tashkilot:</div><div class="info-value">${organization}</div></div>
<div class="info-item"><div class="info-label">Xaridor:</div><div class="info-value">${selectedShip?.customerName || invoice?.customerName || ""}</div></div>
<div class="info-item"><div class="info-label">Yuklab yuborish №:</div><div class="info-value">${selectedShip?.shipmentNumber || invoice?.shipmentNumber || ""}</div></div>
<div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${invoice?.status === "sent" ? "Yuborildi" : "Yuborilmadi"}</div></div>
</div>
<table><thead><tr><th>№</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Oraliq summa</th><th class="text-right">QQS %</th><th class="text-right">QQS summa</th><th class="text-right">Jami</th></tr></thead><tbody>
${items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.productName}</td><td class="text-right">${it.quantity}</td><td class="text-right">${formatCurrency(it.price)}</td><td class="text-right">${formatCurrency(calcSubtotal(it))}</td><td class="text-right">${it.taxRate}%</td><td class="text-right">${formatCurrency(calcTax(it))}</td><td class="text-right">${formatCurrency(calcTotal(it))}</td></tr>`).join("")}
</tbody></table>
<div class="summary">
<div class="summary-row" style="border-top:1px solid #ddd"><span>Oraliq summa:</span><span>${formatCurrency(totals.subtotal)}</span></div>
<div class="summary-row tax"><span>QQS (Qo'shimcha qiymat solig'i):</span><span>${formatCurrency(totals.totalTax)}</span></div>
<div class="summary-row total"><span>Jami to'lov summasi:</span><span>${formatCurrency(totals.total)}</span></div>
</div>
${notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px"><strong>Izoh:</strong><br>${notes}</div>` : ""}
<div class="signature"><div class="signature-box"><div class="signature-line">Rahbar</div></div><div class="signature-box"><div class="signature-line">Bosh hisobchi</div></div></div>
<div style="margin-top:50px;text-align:center;color:#666;font-size:12px"><p>Chop etilgan: ${new Date().toLocaleDateString("uz-UZ")} ${new Date().toLocaleTimeString("uz-UZ")}</p></div>
</body></html>`;
    printViaIframe(printContent);
  };

  // ---------- Loading ----------
  if (!isNew && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---------- Status badge ----------
  const statusBadge = !isNew && invoice ? (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        invoice.status === "sent"
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {invoice.status === "sent" ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {invoice.status === "sent" ? "Yuborildi" : "Yuborilmadi"}
    </span>
  ) : null;

  // ---------- Edit actions ----------
  const editActions = [];
  if (!isNew && invoice) {
    if (invoice.status === "not_sent") {
      editActions.push({
        label: "Yuborish",
        icon: <Send className="h-4 w-4" />,
        onClick: handleStatusToggle,
      });
    } else {
      editActions.push({
        label: "Yuborilmadi holatiga qaytarish",
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleStatusToggle,
      });
    }
    editActions.push({
      label: "O'chirish",
      onClick: handleDelete,
      destructive: true,
    });
  }

  // ---------- Form fields ----------
  const formFields = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label>Yuklab yuborish *</Label>
        <Select
          value={selectedShipment}
          onValueChange={handleShipmentChange}
          disabled={!isNew}
        >
          <SelectTrigger>
            <SelectValue placeholder="Yuklab yuborishni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {shipmentsLoading ? (
              <div className="p-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              shipments.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.shipmentNumber} — {s.customerName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Sana *</Label>
        <Input
          type="date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
        />
      </div>

      <div>
        <Label>Tashkilot *</Label>
        <Input
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Tashkilot nomini kiriting"
        />
      </div>

      <div>
        <Label>Valyuta</Label>
        <CurrencySelector
          value={currency}
          onValueChange={(code, rate) => { setCurrency(code); setExchangeRate(rate); }}
          className="h-9 text-sm"
        />
      </div>
      {currency !== "UZS" && (
        <div>
          <Label>Kurs (1 {currency} = ? so'm)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
          />
        </div>
      )}
      <div className="md:col-span-3">
        <Label>Izoh</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qo'shimcha ma'lumotlar..."
          rows={2}
        />
      </div>
    </div>
  );

  // ---------- Items table ----------
  const itemsTable = items.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Miqdor</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Narx</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-36">Oraliq summa</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">QQS %</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-36">QQS summa</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-36">Jami</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-2 text-sm">{item.productName}</td>
              <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
              <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.price)}</td>
              <td className="px-3 py-2 text-sm text-right font-medium">
                {formatCurrency(calcSubtotal(item))}
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  value={item.taxRate}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = { ...newItems[index], taxRate: parseFloat(e.target.value) || 0 };
                    setItems(newItems);
                  }}
                  className="w-20 text-right h-8"
                  min={0}
                  max={100}
                  step={0.1}
                />
              </td>
              <td className="px-3 py-2 text-sm text-right text-orange-600 font-medium">
                {formatCurrency(calcTax(item))}
              </td>
              <td className="px-3 py-2 text-sm text-right font-bold">
                {formatCurrency(calcTotal(item))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : null;

  // ---------- Footer ----------
  const footer = items.length > 0 ? (
    <div className="flex justify-end">
      <div className="w-72 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Oraliq summa:</span>
          <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-orange-600 font-semibold">
          <span>QQS:</span>
          <span>{formatCurrency(totals.totalTax)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-bold">
          <span>Jami:</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
        {currency !== "UZS" && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>UZS ekvivalenti:</span>
            <span>{formatCurrency(Math.round(totals.total * exchangeRate))}</span>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // ---------- Render ----------
  return (
    <DocumentDetailLayout
      title="Hisob-faktura"
      documentNumber={invoice?.invoiceNumber}
      documentDate={invoice?.invoiceDate}
      isNew={isNew}
      listUrl="/sales/tax-invoices"
      currentIndex={currentIndex}
      totalCount={totalCount}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onNavigatePrev={goToPrev}
      onNavigateNext={goToNext}
      onSave={handleSave}
      saving={saving}
      editActions={editActions}
      printActions={[{ label: "Hisob-faktura", onClick: handlePrint }]}
      statusBadge={statusBadge}
      lastModified={invoice?.updatedAt}
      formFields={formFields}
      itemsTable={itemsTable}
      footer={footer}
    />
  );
};

export default TaxInvoiceDetail;
