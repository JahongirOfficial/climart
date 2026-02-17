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
import { SupplierInvoice } from "@shared/api";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (amount: number, notes: string) => Promise<void>;
  invoice: SupplierInvoice | null;
}

export function PaymentModal({ open, onClose, onSave, invoice }: PaymentModalProps) {
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (invoice && open) {
      const remaining = invoice.totalAmount - invoice.paidAmount;
      setAmount(remaining);
      setNotes("");
    }
  }, [invoice, open]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value) + " so'm";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    const remaining = invoice.totalAmount - invoice.paidAmount;

    if (amount <= 0) {
      showWarning("To'lov summasini kiriting");
      return;
    }

    if (amount > remaining) {
      showWarning(`To'lov summasi qoldiqdan oshib ketmasligi kerak: ${formatCurrency(remaining)}`);
      return;
    }

    setLoading(true);
    try {
      await onSave(amount, notes);
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  const remaining = invoice.totalAmount - invoice.paidAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>To'lov amalga oshirish</DialogTitle>
          <DialogDescription>
            {invoice.supplierName} uchun to'lov
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hisob raqami:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jami summa:</span>
              <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To'langan:</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-600 font-semibold">Qoldiq:</span>
              <span className="font-bold text-red-600">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">To'lov summasi *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              max={remaining}
              step="0.01"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              required
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(remaining / 2)}
              >
                50%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(remaining)}
              >
                To'liq to'lash
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="To'lov haqida qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 no-scale">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  To'lanmoqda...
                </>
              ) : (
                `${formatCurrency(amount)} to'lash`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
