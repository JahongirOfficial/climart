import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Partner } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatPhoneNumber, toDbFormat, toDisplayFormat } from "@/lib/phoneUtils";

interface PartnerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partner?: Partner;
  initialType?: 'customer' | 'supplier' | 'both' | 'worker';
}

export const PartnerModal = ({ open, onClose, onSuccess, partner, initialType = 'customer' }: PartnerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "customer" as "customer" | "supplier" | "both" | "worker",
    status: "new" as "new" | "active" | "vip" | "inactive" | "blocked",
    group: "",
    contactPerson: "",
    phone: "",
    email: "",
    legalAddress: "",
    physicalAddress: "",
    taxId: "",
    bankAccount: "",
    telegramUsername: "",
    notes: "",
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        type: partner.type,
        status: partner.status,
        group: partner.group || "",
        contactPerson: partner.contactPerson || "",
        phone: partner.phone || "",
        email: partner.email || "",
        legalAddress: partner.legalAddress || "",
        physicalAddress: partner.physicalAddress || "",
        taxId: partner.taxId || "",
        bankAccount: partner.bankAccount || "",
        telegramUsername: partner.telegramUsername || "",
        notes: partner.notes || "",
      });
    } else {
      setFormData({
        name: "",
        type: initialType,
        status: "new",
        group: "",
        contactPerson: "",
        phone: "",
        email: "",
        legalAddress: "",
        physicalAddress: "",
        taxId: "",
        bankAccount: "",
        telegramUsername: "",
        notes: "",
      });
    }
  }, [partner, open, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (partner) {
        await api.put(`/api/partners/${partner._id}`, formData);
      } else {
        await api.post("/api/partners", formData);
      }

      toast({
        title: partner ? "Kontragent yangilandi" : "Kontragent yaratildi",
        description: "Ma'lumotlar muvaffaqiyatli saqlandi",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner ? "Kontragentni tahrirlash" : "Yangi kontragent"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">Asosiy</TabsTrigger>
              <TabsTrigger value="contact">Aloqa</TabsTrigger>
              <TabsTrigger value="additional">Qo'shimcha</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nomi *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Turi *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as "customer" | "supplier" | "both" | "worker" })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Mijoz</SelectItem>
                      <SelectItem value="supplier">Yetkazib beruvchi</SelectItem>
                      <SelectItem value="both">Ikkalasi</SelectItem>
                      <SelectItem value="worker">Usta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as "new" | "active" | "vip" | "inactive" | "blocked" })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Statusni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yangi</SelectItem>
                      <SelectItem value="active">Faol</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Nofaol</SelectItem>
                      <SelectItem value="blocked">Bloklangan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Guruh</Label>
                  <Input
                    id="group"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    placeholder="Masalan: Ulgurji, Chakana"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Mas'ul shaxs</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegramUsername">Telegram</Label>
                  <Input
                    id="telegramUsername"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    placeholder="@username"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="legalAddress">Yuridik manzil</Label>
                  <Input
                    id="legalAddress"
                    value={formData.legalAddress}
                    onChange={(e) => setFormData({ ...formData, legalAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="physicalAddress">Jismoniy manzil</Label>
                  <Input
                    id="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">STIR</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank hisob raqami</Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Izohlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
