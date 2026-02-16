import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WarehouseExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const WarehouseExpenseModal = ({ open, onClose, onSave }: WarehouseExpenseModalProps) => {
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { showError } = useModal();

  const [formData, setFormData] = useState({
    warehouse: "",
    warehouseName: "",
    expenseDate: new Date().toISOString().split('T')[0],
    category: "other" as 'rent' | 'utilities' | 'maintenance' | 'salaries' | 'equipment' | 'other',
    amount: "",
    description: ""
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setFormData({
        warehouse: "",
        warehouseName: "",
        expenseDate: new Date().toISOString().split('T')[0],
        category: "other",
        amount: "",
        description: ""
      });
      setErrors([]);
    }
  }, [open]);

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouse: warehouseId,
      warehouseName: warehouse?.name || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];

    if (!formData.warehouse) {
      validationErrors.push("Ombor tanlanmagan");
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      validationErrors.push("Summa 0 dan katta bo'lishi kerak");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  const categoryLabels = {
    rent: "Ijara to'lovi",
    utilities: "Kommunal xizmatlar",
    maintenance: "Ta'mirlash",
    salaries: "Ish haqi",
    equipment: "Jihozlar",
    other: "Boshqa"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ombor xarajati</DialogTitle>
          <DialogDescription>
            Ombor bilan bog'liq xarajatlarni qayd eting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouse">Ombor *</Label>
              <Select value={formData.warehouse} onValueChange={handleWarehouseChange} disabled={warehousesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expenseDate">Sana *</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Kategoriya *</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Summa *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Izoh</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
