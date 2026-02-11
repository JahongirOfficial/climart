import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Contract } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePartners } from "@/hooks/usePartners";

interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract?: Contract;
  preselectedPartnerId?: string;
}

export const ContractModal = ({ open, onClose, onSuccess, contract, preselectedPartnerId }: ContractModalProps) => {
  const { toast } = useToast();
  const { partners } = usePartners();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partner: "",
    organization: "",
    contractDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    currency: "UZS" as "UZS" | "USD" | "EUR" | "RUB",
    totalAmount: "",
    creditLimit: "",
    paymentTerms: "",
    isDefault: false,
    priceList: "",
    fileUrl: "",
    notes: "",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        partner: typeof contract.partner === 'string' ? contract.partner : contract.partner._id,
        organization: contract.organization || "",
        contractDate: contract.contractDate.split('T')[0],
        startDate: contract.startDate.split('T')[0],
        endDate: contract.endDate.split('T')[0],
        currency: contract.currency,
        totalAmount: contract.totalAmount?.toString() || "",
        creditLimit: contract.creditLimit?.toString() || "",
        paymentTerms: contract.paymentTerms || "",
        isDefault: contract.isDefault,
        priceList: contract.priceList || "",
        fileUrl: contract.fileUrl || "",
        notes: contract.notes || "",
      });
    } else if (preselectedPartnerId) {
      setFormData(prev => ({ ...prev, partner: preselectedPartnerId }));
    }
  }, [contract, preselectedPartnerId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      };

      const url = contract ? `/api/contracts/${contract._id}` : "/api/contracts";
      const method = contract ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save contract");

      toast({
        title: contract ? "Shartnoma yangilandi" : "Shartnoma yaratildi",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? "Shartnomani tahrirlash" : "Yangi shartnoma"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="partner">Kontragent *</Label>
              <Select
                value={formData.partner}
                onValueChange={(value) => setFormData({ ...formData, partner: value })}
                disabled={!!contract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kontragentni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner._id} value={partner._id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Tashkilot</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Tashkilot nomi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractDate">Shartnoma sanasi *</Label>
              <Input
                id="contractDate"
                type="date"
                value={formData.contractDate}
                onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Boshlanish sanasi *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tugash sanasi *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Valyuta</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Valyutani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UZS">UZS (so'm)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="RUB">RUB (₽)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Umumiy summa</Label>
              <Input
                id="totalAmount"
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Kredit limiti</Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceList">Narxlar ro'yxati</Label>
              <Input
                id="priceList"
                value={formData.priceList}
                onChange={(e) => setFormData({ ...formData, priceList: e.target.value })}
                placeholder="Narxlar ro'yxati nomi"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="paymentTerms">To'lov shartlari</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="Masalan: 30 kun ichida"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="fileUrl">Fayl URL</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="Shartnoma fayli havolasi"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 col-span-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Asosiy shartnoma sifatida belgilash
              </Label>
            </div>
          </div>

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
