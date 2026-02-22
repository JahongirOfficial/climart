import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { useContractDetail } from "@/hooks/useContractDetail";
import { usePartners } from "@/hooks/usePartners";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { formatCurrency } from "@/lib/format";
import type { StatusConfig } from "@/components/shared/StatusBadge";

// Shartnoma status konfiguratsiyasi
const CONTRACT_STATUS_CONFIG: Record<string, StatusConfig> = {
  active:    { label: "Faol",              color: "text-green-800",  bg: "bg-green-100" },
  expired:   { label: "Muddati tugagan",   color: "text-yellow-800", bg: "bg-yellow-100" },
  cancelled: { label: "Bekor qilingan",    color: "text-red-800",    bg: "bg-red-100" },
};

// Shartnoma turi opsiyalari
const contractTypeOptions: ComboboxOption[] = [
  { value: "sale", label: "Sotuv" },
  { value: "purchase", label: "Xarid" },
  { value: "service", label: "Xizmat" },
  { value: "other", label: "Boshqa" },
];

// To'lov shartlari opsiyalari
const paymentTermsOptions: ComboboxOption[] = [
  { value: "prepaid", label: "Oldindan to'lov" },
  { value: "postpaid", label: "Keyingi to'lov" },
  { value: "installment", label: "Bo'lib to'lash" },
];

// Status opsiyalari
const statusOptions: ComboboxOption[] = [
  { value: "active", label: "Faol" },
  { value: "expired", label: "Muddati tugagan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

const ContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { showWarning, showError } = useModal();

  const { contract, loading, save, saving, deleteContract, refetch } = useContractDetail(id);
  const { partners, loading: partnersLoading } = usePartners();
  const nav = useDocumentNavigation("contracts", "/contacts/contracts");

  const [formData, setFormData] = useState({
    partner: "",
    partnerName: "",
    contractDate: new Date().toISOString().split("T")[0],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalAmount: 0,
    currency: "UZS",
    exchangeRate: 1,
    paymentTerms: "",
    status: "active",
    isDefault: false,
    notes: "",
  });

  // Shartnoma yuklanganida formani to'ldirish
  useEffect(() => {
    if (contract) {
      setFormData({
        partner: typeof contract.partner === "string" ? contract.partner : contract.partner?._id || "",
        partnerName: contract.partnerName || "",
        contractDate: new Date(contract.contractDate).toISOString().split("T")[0],
        startDate: new Date(contract.startDate).toISOString().split("T")[0],
        endDate: new Date(contract.endDate).toISOString().split("T")[0],
        totalAmount: contract.totalAmount || 0,
        currency: contract.currency || "UZS",
        exchangeRate: contract.exchangeRate || 1,
        paymentTerms: contract.paymentTerms || "",
        status: contract.status || "active",
        isDefault: contract.isDefault || false,
        notes: contract.notes || "",
      });
    }
  }, [contract]);

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
    try {
      const result = await save(formData);

      if (isNew) {
        const newId = result._id;
        if (newId) {
          navigate(`/contacts/contracts/${newId}`, { replace: true });
        }
      } else {
        refetch();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Shartnomani o'chirishni xohlaysizmi?")) return;
    try {
      await deleteContract();
      navigate("/contacts/contracts");
    } catch {
      showError("O'chirishda xatolik");
    }
  };

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
      title="Shartnoma"
      documentNumber={contract?.contractNumber}
      documentDate={contract?.contractDate}
      isNew={isNew}
      listUrl="/contacts/contracts"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={contract?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      statusBadge={
        <StatusBadge status={formData.status} config={CONTRACT_STATUS_CONFIG} />
      }

      formFields={
        <div className="space-y-4">
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
                <Label className="text-xs text-gray-500">Shartnoma turi</Label>
                <Combobox
                  options={contractTypeOptions}
                  value=""
                  onValueChange={() => {}}
                  placeholder="Tur tanlang..."
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
                <Label className="text-xs text-gray-500">Holat</Label>
                <Combobox
                  options={statusOptions}
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  placeholder="Holat tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Shartnoma sanasi</Label>
                <Input
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contractDate: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Boshlanish sanasi</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tugash sanasi</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Summa</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.totalAmount || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
                {formData.currency !== "UZS" && formData.totalAmount > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ≈ {formatCurrency(Math.round(formData.totalAmount * formData.exchangeRate))}
                  </div>
                )}
              </div>
            </div>

            {/* 3-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">To'lov shartlari</Label>
                <Combobox
                  options={paymentTermsOptions}
                  value={formData.paymentTerms}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentTerms: value }))}
                  placeholder="Shart tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
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
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="text-xs text-gray-500 cursor-pointer">
                  Asosiy shartnoma
                </Label>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default ContractDetail;
