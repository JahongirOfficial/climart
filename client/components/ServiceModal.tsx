import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Service } from "@shared/api";

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void>;
  service: Service | null;
}

export function ServiceModal({ open, onClose, onSave, service }: ServiceModalProps) {
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    unit: "xizmat",
    price: 0,
    duration: 0,
    description: "",
    isActive: true,
  });

  const generateCode = () => {
    return `SRV-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  useEffect(() => {
    if (open) {
      if (service) {
        setFormData({
          name: service.name,
          code: service.code || "",
          category: service.category || "",
          unit: service.unit,
          price: service.price,
          duration: service.duration || 0,
          description: service.description || "",
          isActive: service.isActive,
        });
      } else {
        setFormData({
          name: "",
          code: generateCode(),
          category: "",
          unit: "xizmat",
          price: 0,
          duration: 0,
          description: "",
          isActive: true,
        });
      }
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.price <= 0) {
      showWarning("Xizmat nomi va narxini kiriting");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? "Xizmatni tahrirlash" : "Yangi xizmat"}</DialogTitle>
          <DialogDescription>
            Xizmat ma'lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Xizmat nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: Montaj xizmati"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Kod</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SRV-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategoriya</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Masalan: Montaj"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">O'lchov birligi *</Label>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="xizmat">Xizmat</option>
                <option value="soat">Soat</option>
                <option value="kun">Kun</option>
                <option value="dona">Dona</option>
                <option value="metr">Metr</option>
                <option value="m2">m²</option>
                <option value="m3">m³</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Narx (so'm) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Davomiyligi (daqiqa)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Xizmat haqida qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Faol xizmat
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                'Saqlash'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
