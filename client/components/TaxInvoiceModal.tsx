import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useShipments } from "@/hooks/useShipments";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface TaxInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  shipmentId?: string;
}

export const TaxInvoiceModal = ({ open, onClose, onSave, shipmentId }: TaxInvoiceModalProps) => {
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { showWarning, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (shipmentId) {
      setSelectedShipment(shipmentId);
      loadShipmentData(shipmentId);
    }
  }, [shipmentId]);

  const loadShipmentData = (shipId: string) => {
    const shipment = shipments.find(s => s._id === shipId);
    if (shipment) {
      setOrganization(shipment.organization || "");
      const invoiceItems = shipment.items.map((item: any) => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        taxRate: 12, // Default QQS 12%
      }));
      setItems(invoiceItems);
    }
  };

  const handleShipmentChange = (shipId: string) => {
    setSelectedShipment(shipId);
    loadShipmentData(shipId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const shipment = shipments.find(s => s._id === selectedShipment);
    if (!shipment) {
      showWarning("Yuklab yuborish tanlanmagan");
      return;
    }

    if (items.length === 0) {
      showWarning("Mahsulotlar ro'yxati bo'sh");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        shipment: selectedShipment,
        shipmentNumber: shipment.shipmentNumber,
        customer: shipment.customer,
        customerName: shipment.customerName,
        organization,
        invoiceDate,
        items,
        notes,
      });
      handleClose();
    } catch (error) {
      console.error('Error saving tax invoice:', error);
      showError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedShipment("");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setOrganization("");
    setNotes("");
    setItems([]);
    onClose();
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const calculateItemSubtotal = (item: any) => {
    return item.quantity * item.price;
  };

  const calculateItemTax = (item: any) => {
    const subtotal = calculateItemSubtotal(item);
    return subtotal * (item.taxRate / 100);
  };

  const calculateItemTotal = (item: any) => {
    return calculateItemSubtotal(item) + calculateItemTax(item);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    const totalTax = items.reduce((sum, item) => sum + calculateItemTax(item), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hisob-faktura yaratish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipment">Yuklab yuborish *</Label>
              <Select value={selectedShipment} onValueChange={handleShipmentChange} required disabled={!!shipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Yuklab yuborishni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {shipmentsLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    shipments.map((shipment) => (
                      <SelectItem key={shipment._id} value={shipment._id}>
                        {shipment.shipmentNumber} - {shipment.customerName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceDate">Sana *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="organization">Tashkilot *</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Tashkilot nomini kiriting"
              required
            />
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Miqdor</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Narx</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Oraliq summa</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">QQS %</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">QQS summa</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {formatCurrency(calculateItemSubtotal(item))}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-orange-600 font-medium">
                          {formatCurrency(calculateItemTax(item))}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-bold">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold">Jami:</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(totals.subtotal)}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(totals.totalTax)}</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(totals.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha ma'lumotlar..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
