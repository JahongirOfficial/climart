import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, toDbFormat, toDisplayFormat } from "@/lib/phoneUtils";

interface Warehouse {
  _id?: string;
  name: string;
  code: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number;
  isActive: boolean;
  notes?: string;
}

interface WarehouseModalProps {
  open: boolean;
  onClose: () => void;
  warehouse?: Warehouse | null;
  onSuccess: () => void;
}

export function WarehouseModal({ open, onClose, warehouse, onSuccess }: WarehouseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Warehouse>({
    name: "",
    code: "",
    address: "",
    contactPerson: "",
    phone: "",
    capacity: 0,
    isActive: true,
    notes: "",
  });

  const generateCode = () => {
    return `WH-${Math.floor(100 + Math.random() * 900)}`;
  };

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse);
    } else if (open) {
      setFormData({
        name: "",
        code: generateCode(),
        address: "",
        contactPerson: "",
        phone: "",
        capacity: 0,
        isActive: true,
        notes: "",
      });
    }
  }, [warehouse, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = warehouse?._id
        ? `/api/warehouses/${warehouse._id}`
        : "/api/warehouses";
      const method = warehouse?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save warehouse");

      toast({
        title: "Muvaffaqiyatli",
        description: warehouse?._id
          ? "Ombor yangilandi"
          : "Yangi ombor qo'shildi",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Omborni saqlashda xatolik yuz berdi",
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
            {warehouse?._id ? "Omborni tahrirlash" : "Yangi ombor"}
          </DialogTitle>
          <DialogDescription>
            Ombor ma'lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Asosiy ombor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Kod <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
                placeholder="WH-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Manzil <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              placeholder="Toshkent sh., Chilonzor tumani"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Mas'ul shaxs</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                placeholder="Ism Familiya"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                }
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Sig'im (m²)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Qo'shimcha ma'lumotlar..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked as boolean })
              }
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Faol
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {warehouse?._id ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
