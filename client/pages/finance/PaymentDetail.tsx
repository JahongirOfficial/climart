import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { usePaymentDetail } from "@/hooks/usePaymentDetail";
import { usePartners } from "@/hooks/usePartners";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency } from "@/lib/format";
import type { StatusConfig } from "@/components/shared/StatusBadge";

// To'lov status konfiguratsiyasi
const PAYMENT_DETAIL_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft:     { label: "Qoralama",        color: "text-gray-800",   bg: "bg-gray-100" },
  confirmed: { label: "Tasdiqlangan",    color: "text-green-800",  bg: "bg-green-100" },
  cancelled: { label: "Bekor qilingan",  color: "text-red-800",    bg: "bg-red-100" },
};

// Yo'nalish opsiyalari
const typeOptions: ComboboxOption[] = [
  { value: "incoming", label: "Kirim" },
  { value: "outgoing", label: "Chiqim" },
  { value: "transfer", label: "O'tkazma" },
];

// To'lov usuli opsiyalari
const paymentMethodOptions: ComboboxOption[] = [
  { value: "cash", label: "Naqd" },
  { value: "bank_transfer", label: "O'tkazma" },
  { value: "card", label: "Karta" },
  { value: "click", label: "Click" },
  { value: "other", label: "Boshqa" },
];

// Hisob opsiyalari
const accountOptions: ComboboxOption[] = [
  { value: "cash", label: "Kassa" },
  { value: "bank", label: "Bank" },
];

// Status opsiyalari
const statusOptions: ComboboxOption[] = [
  { value: "draft", label: "Qoralama" },
  { value: "confirmed", label: "Tasdiqlangan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { showWarning, showError } = useModal();

  const { payment, loading, save, saving, deletePayment, confirmPayment, cancelPayment, refetch } =
    usePaymentDetail(id);
  const { partners, loading: partnersLoading } = usePartners();
  const nav = useDocumentNavigation("payments", "/finance/payments");

  const [formData, setFormData] = useState({
    partner: "",
    partnerName: "",
    type: "incoming" as string,
    amount: 0,
    paymentMethod: "bank_transfer" as string,
    account: "bank" as string,
    paymentDate: new Date().toISOString().split("T")[0],
    purpose: "",
    status: "draft" as string,
    notes: "",
    currency: "UZS",
    exchangeRate: 1,
  });

  // To'lov yuklanganida formani to'ldirish
  useEffect(() => {
    if (payment) {
      setFormData({
        partner: typeof payment.partner === "string"
          ? payment.partner
          : payment.partner?._id || "",
        partnerName: payment.partnerName || "",
        type: payment.type || "incoming",
        amount: payment.amount || 0,
        paymentMethod: payment.paymentMethod || "bank_transfer",
        account: payment.account || "bank",
        paymentDate: payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        purpose: payment.purpose || "",
        status: payment.status || "draft",
        notes: payment.notes || "",
        currency: payment.currency || "UZS",
        exchangeRate: payment.exchangeRate || 1,
      });
    }
  }, [payment]);

  // Kontragent opsiyalari
  const partnerOptions: ComboboxOption[] = useMemo(
    () =>
      partners.map((p) => ({
        value: p._id,
        label: p.name,
        description: p.phone || "",
        keywords: `${p.name} ${p.phone || ""}`,
      })),
    [partners]
  );

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.partner) {
      showWarning("Iltimos, kontragentni tanlang!");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      showWarning("Iltimos, summani kiriting!");
      return;
    }
    if (!formData.purpose) {
      showWarning("Iltimos, to'lov maqsadini kiriting!");
      return;
    }
    try {
      const result = await save(formData);

      if (isNew) {
        const newId = result._id;
        if (newId) {
          navigate(`/finance/payments/${newId}`, { replace: true });
        }
      } else {
        refetch();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== TASDIQLASH =====
  const handleConfirm = async () => {
    try {
      await confirmPayment();
      refetch();
    } catch (error: any) {
      showError(error.message || "Tasdiqlashda xatolik");
    }
  };

  // ===== BEKOR QILISH =====
  const handleCancel = async () => {
    if (!confirm("To'lovni bekor qilishni xohlaysizmi?")) return;
    try {
      await cancelPayment();
      refetch();
    } catch (error: any) {
      showError(error.message || "Bekor qilishda xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("To'lovni o'chirishni xohlaysizmi?")) return;
    try {
      await deletePayment();
      navigate("/finance/payments");
    } catch {
      showError("O'chirishda xatolik");
    }
  };

  // Edit actions
  const editActions = useMemo(() => {
    if (isNew) return undefined;
    const actions: any[] = [];

    // Tasdiqlash (faqat draft bo'lsa)
    if (payment?.status === "draft") {
      actions.push({
        label: "Tasdiqlash",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleConfirm,
      });
    }

    // Bekor qilish (faqat draft yoki confirmed bo'lsa)
    if (payment?.status && payment.status !== "cancelled") {
      actions.push({
        label: "Bekor qilish",
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleCancel,
      });
    }

    // O'chirish
    actions.push({
      label: "O'chirish",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      destructive: true,
    });

    return actions;
  }, [isNew, payment?.status]);

  // Yuklanmoqda
  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DocumentDetailLayout
      title="To'lov"
      documentNumber={payment?.paymentNumber}
      documentDate={payment?.paymentDate}
      isNew={isNew}
      listUrl="/finance/payments"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={payment?.updatedAt}
      editActions={editActions}

      statusBadge={
        <StatusBadge
          status={formData.status}
          config={PAYMENT_DETAIL_STATUS_CONFIG}
        />
      }

      formFields={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
          {/* 1-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Kontragent</Label>
              <Combobox
                options={partnerOptions}
                value={formData.partner}
                onValueChange={(value) => {
                  const p = partners.find((p) => p._id === value);
                  setFormData((prev) => ({
                    ...prev,
                    partner: value,
                    partnerName: p?.name || "",
                  }));
                }}
                placeholder="Kontragent tanlang..."
                searchPlaceholder="Nom yoki telefon..."
                emptyText="Topilmadi"
                disabled={partnersLoading}
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Yo'nalish</Label>
              <Combobox
                options={typeOptions}
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                placeholder="Yo'nalish tanlang..."
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Hisob</Label>
              <Combobox
                options={accountOptions}
                value={formData.account}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, account: value }))}
                placeholder="Hisob tanlang..."
                className="h-9 text-sm mt-1"
              />
            </div>
          </div>

          {/* 2-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Summa</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0"
                className="h-9 text-sm mt-1"
              />
              {formData.currency !== "UZS" && formData.amount > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  ≈ {formatCurrency(Math.round(formData.amount * formData.exchangeRate))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-500">To'lov usuli</Label>
              <Combobox
                options={paymentMethodOptions}
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                placeholder="Usul tanlang..."
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">To'lov sanasi</Label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                className="h-9 text-sm mt-1"
              />
            </div>
          </div>

          {/* 3-ustun */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">* Maqsad</Label>
              <Input
                value={formData.purpose}
                onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="To'lov maqsadi"
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Holat</Label>
              <Combobox
                options={statusOptions}
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                placeholder="Holat tanlang..."
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Valyuta</Label>
              <CurrencySelector
                value={formData.currency}
                onValueChange={(code, rate) =>
                  setFormData((prev) => ({ ...prev, currency: code, exchangeRate: rate }))
                }
                className="h-9 text-sm mt-1"
              />
            </div>
            {formData.currency !== "UZS" && (
              <div>
                <Label className="text-xs text-gray-500">
                  Kurs (1 {formData.currency} = ? so'm)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.exchangeRate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))
                  }
                  className="h-9 text-sm mt-1"
                />
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-500">Izoh</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot..."
                className="text-sm mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};

export default PaymentDetail;
