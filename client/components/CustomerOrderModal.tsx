import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePartners } from "@/hooks/usePartners";
import { useProducts } from "@/hooks/useProducts";
import { CustomerOrder } from "@shared/api";
import { Plus, Trash2, Loader2, UserPlus, Printer } from "lucide-react";
import { PartnerModal } from "@/components/PartnerModal";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

interface CustomerOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  order?: CustomerOrder | null;
}

interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export const CustomerOrderModal = ({ open, onClose, onSave, order }: CustomerOrderModalProps) => {
  const { partners, loading: partnersLoading, refetch: refetchPartners } = usePartners('customer');
  const { products } = useProducts();
  const { showWarning, showError } = useModal();
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ""
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: "", productName: "", quantity: 1, price: 0, total: 0 }
  ]);

  const [saving, setSaving] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [savedOrderData, setSavedOrderData] = useState<any>(null);
  const [productSearchTerms, setProductSearchTerms] = useState<string[]>([]);

  useEffect(() => {
    if (order) {
      setFormData({
        customer: typeof order.customer === 'string' ? order.customer : order.customer._id,
        customerName: order.customerName,
        orderDate: new Date(order.orderDate).toISOString().split('T')[0],
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        notes: order.notes || ""
      });
      setItems(order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })));
    } else {
      setFormData({
        customer: "",
        customerName: "",
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ""
      });
      setItems([{ product: "", productName: "", quantity: 1, price: 0, total: 0 }]);
    }
    setProductSearchTerms(items.map(() => ""));
  }, [order, open]);

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "regular") {
      setFormData(prev => ({
        ...prev,
        customer: "regular",
        customerName: "Oddiy mijoz"
      }));
    } else {
      const customer = partners.find(p => p._id === customerId);
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customerName: customer?.name || ""
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }

    setItems(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product: productId,
      productName: product ? product.name : "",
      price: product ? product.sellingPrice : 0
    };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
    
    // Clear search term after selection
    const newSearchTerms = [...productSearchTerms];
    newSearchTerms[index] = "";
    setProductSearchTerms(newSearchTerms);
  };

  const handleProductSearchChange = (index: number, searchTerm: string) => {
    const newSearchTerms = [...productSearchTerms];
    newSearchTerms[index] = searchTerm;
    setProductSearchTerms(newSearchTerms);
  };

  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index]?.toLowerCase() || "";
    if (!searchTerm) return products;
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku?.toLowerCase().includes(searchTerm) ||
      product.barcode?.toLowerCase().includes(searchTerm)
    );
  };

  const addItem = () => {
    setItems([...items, { product: "", productName: "", quantity: 1, price: 0, total: 0 }]);
    setProductSearchTerms([...productSearchTerms, ""]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setProductSearchTerms(productSearchTerms.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || items.some(item => !item.product || item.quantity <= 0 || item.price <= 0)) {
      showWarning("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        ...formData,
        items,
        totalAmount,
        status: order ? order.status : 'pending'
      };

      await onSave(orderData);

      // Save order data for printing
      setSavedOrderData(orderData);
      setShowPrintOptions(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
      setSaving(false);
    }
  };

  const handleClosePrintOptions = () => {
    setShowPrintOptions(false);
    setSavedOrderData(null);
    setSaving(false);
    onClose();
  };

  const printCustomerReceipt = () => {
    if (!savedOrderData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mijoz uchun check</title>
        <style>
          @media print {
            @page { margin: 10mm; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item-row {
            margin: 8px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-top: 2px;
          }
          .total {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">CLIMART ERP</div>
          <div>Buyurtma cheki</div>
          <div style="font-size: 10px; margin-top: 5px;">${currentDate}</div>
        </div>

        <div class="receipt-title">MIJOZ UCHUN CHECK</div>

        <div class="info-row">
          <span>Mijoz:</span>
          <span><strong>${savedOrderData.customerName}</strong></span>
        </div>
        <div class="info-row">
          <span>Buyurtma sanasi:</span>
          <span>${new Date(savedOrderData.orderDate).toLocaleDateString('uz-UZ')}</span>
        </div>
        <div class="info-row">
          <span>Yetkazish sanasi:</span>
          <span>${new Date(savedOrderData.deliveryDate).toLocaleDateString('uz-UZ')}</span>
        </div>

        <div class="items">
          ${savedOrderData.items.map((item: OrderItem, index: number) => `
            <div class="item-row">
              <div class="item-name">${index + 1}. ${item.productName}</div>
              <div class="item-details">
                <span>${item.quantity} x ${new Intl.NumberFormat('uz-UZ').format(item.price)} so'm</span>
                <span><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)} so'm</strong></span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="info-row">
            <span>JAMI SUMMA:</span>
            <span>${new Intl.NumberFormat('uz-UZ').format(savedOrderData.totalAmount)} so'm</span>
          </div>
        </div>

        ${savedOrderData.notes ? `
          <div style="margin-top: 15px; font-size: 11px;">
            <div><strong>Izoh:</strong></div>
            <div style="margin-top: 5px;">${savedOrderData.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>Rahmat!</div>
          <div style="margin-top: 5px;">Yana buyurtma bering!</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Auto-close window after printing
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const printWarehouseReceipt = () => {
    if (!savedOrderData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ombor uchun check</title>
        <style>
          @media print {
            @page { margin: 15mm; size: A4; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .document-title {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
          }
          .info-section {
            margin: 20px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-row {
            display: flex;
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            min-width: 150px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .total-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 2px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #fffbf0;
            border-left: 4px solid #ffc107;
          }
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">CLIMART ERP SYSTEM</div>
          <div style="font-size: 12px; color: #666;">Ombor boshqaruv tizimi</div>
          <div class="document-title">OMBOR UCHUN BUYURTMA CHEKI</div>
          <div style="font-size: 11px; margin-top: 5px;">Chop etilgan: ${currentDate}</div>
        </div>

        <div class="info-section">
          <div>
            <div class="info-row">
              <span class="info-label">Mijoz:</span>
              <span><strong>${savedOrderData.customerName}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Buyurtma sanasi:</span>
              <span>${new Date(savedOrderData.orderDate).toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>
          <div>
            <div class="info-row">
              <span class="info-label">Yetkazish sanasi:</span>
              <span>${new Date(savedOrderData.deliveryDate).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Holat:</span>
              <span><strong>Yangi buyurtma</strong></span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">№</th>
              <th>Mahsulot nomi</th>
              <th class="text-center" style="width: 80px;">Miqdor</th>
              <th class="text-right" style="width: 120px;">Tan narxi (so'm)</th>
              <th class="text-right" style="width: 120px;">Sotuv narxi (so'm)</th>
              <th class="text-right" style="width: 140px;">Jami summa (so'm)</th>
            </tr>
          </thead>
          <tbody>
            ${savedOrderData.items.map((item: OrderItem, index: number) => {
              const product = products.find(p => p._id === item.product);
              const costPrice = product?.costPrice || 0;
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><strong>${item.productName}</strong></td>
                  <td class="text-center"><strong>${item.quantity}</strong></td>
                  <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(costPrice)}</td>
                  <td class="text-right">${new Intl.NumberFormat('uz-UZ').format(item.price)}</td>
                  <td class="text-right"><strong>${new Intl.NumberFormat('uz-UZ').format(item.total)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Jami mahsulotlar soni:</span>
            <span><strong>${savedOrderData.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)} dona</strong></span>
          </div>
          <div class="total-row">
            <span>Jami tan narxi:</span>
            <span><strong>${new Intl.NumberFormat('uz-UZ').format(
              savedOrderData.items.reduce((sum: number, item: OrderItem) => {
                const product = products.find(p => p._id === item.product);
                return sum + (product?.costPrice || 0) * item.quantity;
              }, 0)
            )} so'm</strong></span>
          </div>
          <div class="total-row grand-total">
            <span>JAMI SUMMA:</span>
            <span>${new Intl.NumberFormat('uz-UZ').format(savedOrderData.totalAmount)} so'm</span>
          </div>
          <div class="total-row" style="color: #28a745;">
            <span>Kutilayotgan foyda:</span>
            <span><strong>${new Intl.NumberFormat('uz-UZ').format(
              savedOrderData.totalAmount - savedOrderData.items.reduce((sum: number, item: OrderItem) => {
                const product = products.find(p => p._id === item.product);
                return sum + (product?.costPrice || 0) * item.quantity;
              }, 0)
            )} so'm</strong></span>
          </div>
        </div>

        ${savedOrderData.notes ? `
          <div class="notes">
            <div style="font-weight: bold; margin-bottom: 5px;">📝 Izoh:</div>
            <div>${savedOrderData.notes}</div>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Tayyorlovchi</div>
            <div class="signature-line">
              <div style="font-size: 10px; color: #666;">F.I.O. / Imzo</div>
            </div>
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Ombor mudiri</div>
            <div class="signature-line">
              <div style="font-size: 10px; color: #666;">F.I.O. / Imzo</div>
            </div>
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Qabul qiluvchi</div>
            <div class="signature-line">
              <div style="font-size: 10px; color: #666;">F.I.O. / Imzo</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>Bu hujjat CLIMART ERP tizimi tomonidan avtomatik yaratilgan</div>
          <div style="margin-top: 5px;">Chop etilgan sana: ${currentDate}</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Auto-close window after printing
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {order ? "Buyurtmani tahrirlash" : "Yangi buyurtma yaratish"}
            </DialogTitle>
            <DialogDescription>
              {order ? "Buyurtma ma'lumotlarini o'zgartiring" : "Mijozdan yangi buyurtma yarating"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Mijoz *</Label>
                <div className="flex gap-2">
                  <select
                    id="customer"
                    value={formData.customer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={partnersLoading}
                  >
                    <option value="">Tanlang...</option>
                    <option value="regular">Oddiy mijoz</option>
                    {partners.map(partner => (
                      <option key={partner._id} value={partner._id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPartnerModalOpen(true)}
                    title="Yangi mijoz qo'shish"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="orderDate">Buyurtma sanasi *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Yetkazib berish sanasi *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tovarlar *</Label>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Tovar qo'shish
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => {
                  const productOptions: ComboboxOption[] = products.map(p => ({
                    value: p._id,
                    label: p.name,
                    description: `Mavjud: ${p.quantity} ${p.unit} • Narx: ${p.sellingPrice.toLocaleString()} so'm`,
                    keywords: `${p.name} ${p.sku || ''} ${p.barcode || ''}`
                  }));

                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Label className="text-xs">Mahsulot</Label>
                        <Combobox
                          options={productOptions}
                          value={item.product}
                          onValueChange={(value) => handleProductSelect(index, value)}
                          placeholder="Mahsulot tanlang..."
                          searchPlaceholder="Mahsulot qidirish..."
                          emptyText="Mahsulot topilmadi"
                        />
                      </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Miqdor</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Narx</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Jami</Label>
                      <Input
                        type="text"
                        value={new Intl.NumberFormat('uz-UZ').format(item.total)}
                        readOnly
                        className="text-sm bg-gray-50"
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 no-scale"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Jami summa:</span>
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('uz-UZ').format(items.reduce((sum, item) => sum + item.total, 0))} so'm
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Izoh</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  order ? "Saqlash" : "Yaratish"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>

        <PartnerModal
          open={isPartnerModalOpen}
          onClose={() => setIsPartnerModalOpen(false)}
          onSuccess={() => {
            refetchPartners();
          }}
          initialType="customer"
        />
      </Dialog>

      {/* Print Options Dialog */}
      <Dialog open={showPrintOptions} onOpenChange={handleClosePrintOptions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buyurtma muvaffaqiyatli saqlandi! ✅</DialogTitle>
            <DialogDescription>
              Check chiqarishni xohlaysizmi?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                printCustomerReceipt();
                handleClosePrintOptions();
              }}
              className="w-full justify-start h-auto py-4"
              variant="outline"
            >
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 mt-1 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">Mijoz uchun check</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Oddiy kvitansiya - mahsulot nomlari, miqdor va narxlar
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                printWarehouseReceipt();
                handleClosePrintOptions();
              }}
              className="w-full justify-start h-auto py-4"
              variant="outline"
            >
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 mt-1 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">Ombor uchun check</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Batafsil ma'lumot - tan narxi, sotuv narxi, foyda hisoblari
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                printCustomerReceipt();
                setTimeout(() => printWarehouseReceipt(), 500);
                handleClosePrintOptions();
              }}
              className="w-full justify-start h-auto py-4"
              variant="default"
            >
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 mt-1" />
                <div className="text-left">
                  <div className="font-semibold">Ikkala checkni chiqarish</div>
                  <div className="text-xs text-white/80 mt-1">
                    Mijoz va ombor uchun checklar
                  </div>
                </div>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClosePrintOptions}>
              Keyinroq
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
