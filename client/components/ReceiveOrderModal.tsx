import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { PurchaseOrder } from "@shared/api";
import { Package, Warehouse, AlertCircle } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";

interface ReceiveOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (distributions: WarehouseDistribution[]) => Promise<void>;
  order: PurchaseOrder | null;
}

interface WarehouseDistribution {
  warehouse: string;
  warehouseName: string;
  items: {
    product: string;
    productName: string;
    quantity: number;
  }[];
}

interface ItemDistribution {
  product: string;
  productName: string;
  totalQuantity: number;
  distributions: {
    warehouse: string;
    quantity: number;
  }[];
}

export function ReceiveOrderModal({ open, onClose, onSave, order }: ReceiveOrderModalProps) {
  const { warehouses } = useWarehouses();
  const [itemDistributions, setItemDistributions] = useState<ItemDistribution[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order && open) {
      // Initialize distributions for each item
      const distributions: ItemDistribution[] = order.items.map(item => ({
        product: (typeof item.product === 'object' && item.product ? item.product._id : item.product) as string,
        productName: item.productName,
        totalQuantity: item.quantity,
        distributions: warehouses.length > 0 ? [{
          warehouse: warehouses[0]._id,
          quantity: item.quantity
        }] : []
      }));
      setItemDistributions(distributions);
    }
  }, [order, open, warehouses]);

  const handleAddWarehouse = (itemIndex: number) => {
    const newDistributions = [...itemDistributions];
    const availableWarehouse = warehouses.find(w => 
      !newDistributions[itemIndex].distributions.some(d => d.warehouse === w._id)
    );
    
    if (availableWarehouse) {
      newDistributions[itemIndex].distributions.push({
        warehouse: availableWarehouse._id,
        quantity: 0
      });
      setItemDistributions(newDistributions);
    }
  };

  const handleRemoveWarehouse = (itemIndex: number, distIndex: number) => {
    const newDistributions = [...itemDistributions];
    newDistributions[itemIndex].distributions.splice(distIndex, 1);
    setItemDistributions(newDistributions);
  };

  const handleWarehouseChange = (itemIndex: number, distIndex: number, warehouseId: string) => {
    const newDistributions = [...itemDistributions];
    newDistributions[itemIndex].distributions[distIndex].warehouse = warehouseId;
    setItemDistributions(newDistributions);
  };

  const handleQuantityChange = (itemIndex: number, distIndex: number, quantity: number) => {
    const newDistributions = [...itemDistributions];
    newDistributions[itemIndex].distributions[distIndex].quantity = quantity;
    setItemDistributions(newDistributions);
  };

  const getTotalDistributed = (itemIndex: number): number => {
    return itemDistributions[itemIndex].distributions.reduce((sum, d) => sum + d.quantity, 0);
  };

  const getRemaining = (itemIndex: number): number => {
    return itemDistributions[itemIndex].totalQuantity - getTotalDistributed(itemIndex);
  };

  const isValid = (): boolean => {
    return itemDistributions.every(item => {
      const total = item.distributions.reduce((sum, d) => sum + d.quantity, 0);
      return total === item.totalQuantity && item.distributions.every(d => d.quantity > 0);
    });
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    setSaving(true);
    try {
      // Group by warehouse
      const warehouseMap = new Map<string, WarehouseDistribution>();

      itemDistributions.forEach(item => {
        item.distributions.forEach(dist => {
          if (!warehouseMap.has(dist.warehouse)) {
            const warehouse = warehouses.find(w => w._id === dist.warehouse);
            warehouseMap.set(dist.warehouse, {
              warehouse: dist.warehouse,
              warehouseName: warehouse?.name || '',
              items: []
            });
          }

          warehouseMap.get(dist.warehouse)!.items.push({
            product: item.product,
            productName: item.productName,
            quantity: dist.quantity
          });
        });
      });

      await onSave(Array.from(warehouseMap.values()));
      // onClose will be called by parent component on success
    } catch (error) {
      console.error('Error saving:', error);
      // Error is handled by parent component
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Buyurtmani qabul qilish - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Mahsulotlarni omborlarga taqsimlang</p>
                <p>Har bir mahsulotni bir yoki bir nechta omborga bo'lib saqlashingiz mumkin. Jami miqdor to'liq taqsimlanishi kerak.</p>
              </div>
            </div>
          </div>

          {/* Items */}
          {itemDistributions.map((item, itemIndex) => {
            const remaining = getRemaining(itemIndex);
            const isComplete = remaining === 0;

            return (
              <div key={itemIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600">
                      Jami: {item.totalQuantity} dona
                      {!isComplete && (
                        <span className="ml-2 text-orange-600 font-medium">
                          • Qolgan: {remaining} dona
                        </span>
                      )}
                      {isComplete && (
                        <span className="ml-2 text-green-600 font-medium">
                          • ✓ To'liq taqsimlangan
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWarehouse(itemIndex)}
                    disabled={item.distributions.length >= warehouses.length}
                  >
                    + Ombor qo'shish
                  </Button>
                </div>

                {/* Warehouse distributions */}
                <div className="space-y-2">
                  {item.distributions.map((dist, distIndex) => {
                    const warehouse = warehouses.find(w => w._id === dist.warehouse);
                    const availableWarehouses = warehouses.filter(w => 
                      w._id === dist.warehouse || 
                      !item.distributions.some(d => d.warehouse === w._id)
                    );

                    return (
                      <div key={distIndex} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-6">
                          <Label className="text-xs">Ombor</Label>
                          <select
                            value={dist.warehouse}
                            onChange={(e) => handleWarehouseChange(itemIndex, distIndex, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          >
                            {availableWarehouses.map(w => (
                              <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4">
                          <Label className="text-xs">Miqdor</Label>
                          <Input
                            type="number"
                            min="0"
                            max={item.totalQuantity}
                            value={dist.quantity || ''}
                            onChange={(e) => handleQuantityChange(itemIndex, distIndex, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="text-sm"
                          />
                        </div>

                        <div className="col-span-2">
                          {item.distributions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveWarehouse(itemIndex, distIndex)}
                              className="w-full text-red-600 hover:text-red-700"
                            >
                              O'chirish
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid() || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saqlanmoqda...' : 'Qabul qilish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
