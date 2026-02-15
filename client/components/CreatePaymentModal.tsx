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
import { usePartners } from "@/hooks/usePartners";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  type: 'incoming' | 'outgoing' | 'transfer';
}

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Ijara' },
  { value: 'salary', label: 'Ish haqi' },
  { value: 'utilities', label: 'Kommunal xizmatlar' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office_supplies', label: 'Ofis jihozlari' },
  { value: 'transport', label: 'Transport' },
  { value: 'maintenance', label: 'Ta\'mirlash' },
  { value: 'taxes', label: 'Soliqlar' },
  { value: 'insurance', label: 'Sug\'urta' },
  { value: 'other', label: 'Boshqa' },
];

export function CreatePaymentModal({ open, onClose, onSave, type }: CreatePaymentModalProps) {
  const { showWarning, showError } = useModal();
  const { partners } = usePartners();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    partner: '',
    account: 'bank' as 'cash' | 'bank',
    paymentMethod: 'bank_transfer' as 'cash' | 'bank_transfer' | 'card' | 'other',
    purpose: '',
    category: '',
    fromAccount: 'cash' as 'cash' | 'bank',
    toAccount: 'bank' as 'cash' | 'bank',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        partner: '',
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: '',
        category: '',
        fromAccount: 'cash',
        toAccount: 'bank',
        notes: '',
      });
    }
  }, [open, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showWarning("Summani kiriting");
      return;
    }

    if (type !== 'transfer' && !formData.purpose) {
      showWarning("To'lov maqsadini kiriting");
      return;
    }

    if (type === 'transfer' && formData.fromAccount === formData.toAccount) {
      showWarning("O'tkazma uchun turli hisoblarni tanlang");
      return;
    }

    setLoading(true);
    try {
      const paymentData: any = {
        type,
        paymentDate: formData.paymentDate,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        notes: formData.notes,
      };

      if (type === 'transfer') {
        paymentData.fromAccount = formData.fromAccount;
        paymentData.toAccount = formData.toAccount;
      } else {
        paymentData.account = formData.account;
        paymentData.paymentMethod = formData.paymentMethod;
        
        if (formData.partner) {
          paymentData.partner = formData.partner;
          const partner = partners.find(p => p._id === formData.partner);
          if (partner) {
            paymentData.partnerName = partner.name;
          }
        }

        if (type === 'outgoing' && formData.category) {
          paymentData.category = formData.category;
        }
      }

      await onSave(paymentData);
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'incoming':
        return 'Kirim to\'lovi';
      case 'outgoing':
        return 'Chiqim to\'lovi';
      case 'transfer':
        return 'Pul o\'tkazmasi';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'incoming':
        return 'Kassaga yoki bankga kirim to\'lovini qayd qiling';
      case 'outgoing':
        return 'Kassadan yoki bankdan chiqim to\'lovini qayd qiling';
      case 'transfer':
        return 'Kassadan bankga yoki aksincha pul o\'tkazing';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Sana *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Summa (so'm) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                required
              />
            </div>
          </div>

          {type === 'transfer' ? (
            /* Transfer specific fields */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromAccount">Qayerdan *</Label>
                <Select
                  value={formData.fromAccount}
                  onValueChange={(value: 'cash' | 'bank') => 
                    setFormData({ ...formData, fromAccount: value })
                  }
                >
                  <SelectTrigger id="fromAccount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kassa</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toAccount">Qayerga *</Label>
                <Select
                  value={formData.toAccount}
                  onValueChange={(value: 'cash' | 'bank') => 
                    setFormData({ ...formData, toAccount: value })
                  }
                >
                  <SelectTrigger id="toAccount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kassa</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              {/* Partner */}
              <div className="space-y-2">
                <Label htmlFor="partner">
                  {type === 'incoming' ? 'Kimdan' : 'Kimga'}
                </Label>
                <Select
                  value={formData.partner}
                  onValueChange={(value) => setFormData({ ...formData, partner: value })}
                >
                  <SelectTrigger id="partner">
                    <SelectValue placeholder="Kontragentni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tanlanmagan</SelectItem>
                    {partners.map((partner) => (
                      <SelectItem key={partner._id} value={partner._id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account */}
                <div className="space-y-2">
                  <Label htmlFor="account">Hisob *</Label>
                  <Select
                    value={formData.account}
                    onValueChange={(value: 'cash' | 'bank') => 
                      setFormData({ ...formData, account: value })
                    }
                  >
                    <SelectTrigger id="account">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Kassa</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">To'lov usuli *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: any) => 
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Naqd pul</SelectItem>
                      <SelectItem value="bank_transfer">Bank o'tkazmasi</SelectItem>
                      <SelectItem value="card">Karta</SelectItem>
                      <SelectItem value="other">Boshqa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category for outgoing payments */}
              {type === 'outgoing' && (
                <div className="space-y-2">
                  <Label htmlFor="category">Xarajat moddasi</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tanlanmagan</SelectItem>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">
              {type === 'transfer' ? 'Izoh' : 'To\'lov maqsadi *'}
            </Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder={
                type === 'incoming' 
                  ? "Masalan: Tovar sotish uchun to'lov" 
                  : type === 'outgoing'
                  ? "Masalan: Ofis ijarasi"
                  : "Masalan: Kassadan bankga o'tkazma"
              }
              required={type !== 'transfer'}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Qo'shimcha izoh</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="To'lov haqida qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          {/* Actions */}
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
