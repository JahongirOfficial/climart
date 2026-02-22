import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { usePartnerDetail } from "@/hooks/usePartnerDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import type { StatusConfig } from "@/components/shared/StatusBadge";

// Kontragent status konfiguratsiyasi
const PARTNER_STATUS_CONFIG: Record<string, StatusConfig> = {
  new:      { label: "Yangi",    color: "text-blue-800",   bg: "bg-blue-100" },
  active:   { label: "Faol",     color: "text-green-800",  bg: "bg-green-100" },
  vip:      { label: "VIP",      color: "text-purple-800", bg: "bg-purple-100" },
  inactive: { label: "Nofaol",   color: "text-gray-800",   bg: "bg-gray-100" },
  blocked:  { label: "Bloklangan", color: "text-red-800",  bg: "bg-red-100" },
};

// Tur opsiyalari
const typeOptions: ComboboxOption[] = [
  { value: "customer", label: "Mijoz" },
  { value: "supplier", label: "Yetkazib beruvchi" },
  { value: "both", label: "Ikkalasi" },
  { value: "worker", label: "Ishchi" },
];

// Status opsiyalari
const statusOptions: ComboboxOption[] = [
  { value: "new", label: "Yangi" },
  { value: "active", label: "Faol" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Nofaol" },
  { value: "blocked", label: "Bloklangan" },
];

const PartnerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { showWarning, showError } = useModal();

  const { partner, loading, save, saving, deletePartner, refetch } = usePartnerDetail(id);
  const nav = useDocumentNavigation("partners", "/contacts/partners");

  const [formData, setFormData] = useState({
    name: "",
    type: "customer" as string,
    code: "",
    status: "new" as string,
    phone: "",
    email: "",
    physicalAddress: "",
    taxId: "",
    legalAddress: "",
    contactPerson: "",
    bankAccount: "",
    telegramUsername: "",
    group: "",
    notes: "",
  });

  // Kontragent yuklanganida formani to'ldirish
  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || "",
        type: partner.type || "customer",
        code: partner.code || "",
        status: partner.status || "new",
        phone: partner.phone || "",
        email: partner.email || "",
        physicalAddress: partner.physicalAddress || "",
        taxId: partner.taxId || "",
        legalAddress: partner.legalAddress || "",
        contactPerson: partner.contactPerson || "",
        bankAccount: partner.bankAccount || "",
        telegramUsername: partner.telegramUsername || "",
        group: partner.group || "",
        notes: partner.notes || "",
      });
    }
  }, [partner]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.name) {
      showWarning("Iltimos, kontragent nomini kiriting!");
      return;
    }
    try {
      const result = await save(formData);

      if (isNew) {
        const newId = result._id;
        if (newId) {
          navigate(`/contacts/partners/${newId}`, { replace: true });
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
    if (!confirm("Kontragentni o'chirishni xohlaysizmi?")) return;
    try {
      await deletePartner();
      navigate("/contacts/partners");
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
      title="Kontragent"
      documentNumber={partner?.code}
      isNew={isNew}
      listUrl="/contacts/partners"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={partner?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      statusBadge={
        <StatusBadge status={formData.status} config={PARTNER_STATUS_CONFIG} />
      }

      formFields={
        <div className="space-y-4">
          {/* Asosiy maydonlar - 3 ustunli grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
            {/* 1-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Nomi</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Kontragent nomi"
                  className="h-9 text-sm mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Turi</Label>
                <Combobox
                  options={typeOptions}
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  placeholder="Tur tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kod</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Avtomatik generatsiya"
                  className="h-9 text-sm mt-1"
                  disabled={isNew}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Holat</Label>
                <Combobox
                  options={statusOptions}
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  placeholder="Holat tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Manzil</Label>
                <Input
                  value={formData.physicalAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, physicalAddress: e.target.value }))}
                  placeholder="Fizik manzil"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Telegram</Label>
                <Input
                  value={formData.telegramUsername}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramUsername: e.target.value }))}
                  placeholder="@username"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 3-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">INN</Label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="Soliq to'lovchi raqami"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Yuridik manzil</Label>
                <Input
                  value={formData.legalAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, legalAddress: e.target.value }))}
                  placeholder="Yuridik manzil"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kontakt shaxs</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Kontakt shaxs ismi"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Guruh</Label>
                <Input
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                  placeholder="Kontragent guruhi"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Qo'shimcha maydonlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-2 border-t">
            <div>
              <Label className="text-xs text-gray-500">Hisob raqami</Label>
              <Input
                value={formData.bankAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="Bank hisob raqami"
                className="h-9 text-sm mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Izoh</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot..."
                className="text-sm mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};

export default PartnerDetail;
