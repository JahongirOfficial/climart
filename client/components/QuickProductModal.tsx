import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface QuickProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (product: any) => void;
  defaultName?: string;
}

export const QuickProductModal = ({ open, onClose, onCreated, defaultName = "" }: QuickProductModalProps) => {
  const [formData, setFormData] = useState({
    name: defaultName,
    sellingPrice: 0,
    costPrice: 0,
    unit: "dona",
    brand: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when defaultName changes
  useState(() => {
    setFormData(prev => ({ ...prev, name: defaultName }));
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Mahsulot nomini kiriting");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const product = await api.post("/api/products", {
        name: formData.name.trim(),
        sellingPrice: formData.sellingPrice,
        costPrice: formData.costPrice,
        unit: formData.unit,
        brand: formData.brand || undefined,
        category: formData.category || undefined,
        quantity: 0,
        status: "active",
      });
      onCreated(product);
      onClose();
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tezkor mahsulot yaratish</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs text-gray-500">* Nomi</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Mahsulot nomi"
              className="h-9 text-sm mt-1"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Sotuv narxi</Label>
              <Input
                type="number"
                min="0"
                value={formData.sellingPrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tan narxi</Label>
              <Input
                type="number"
                min="0"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="h-9 text-sm mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Birlik</Label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
              >
                <option value="dona">dona</option>
                <option value="kg">kg</option>
                <option value="litr">litr</option>
                <option value="metr">metr</option>
                <option value="komplekt">komplekt</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Brend</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brend"
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Kategoriya</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Kategoriya"
                className="h-9 text-sm mt-1"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
