import { useState, useEffect } from 'react';
import { Product } from '@shared/api';

interface ProcurementProduct extends Product {
  dailyAverageSales: number;
  lastWeekSales: number;
  supplier: string;
  forecastDays: number;
  deficit: number;
  needToOrder: number;
  status: 'critical' | 'warning' | 'ok';
}

export const useProcurement = () => {
  const [products, setProducts] = useState<ProcurementProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: Product[] = await response.json();
      
      // Generate procurement analysis from products
      const analysisData: ProcurementProduct[] = data.map((product: Product) => {
        // Simulate sales data (in real app, this would come from sales history)
        const dailyAverageSales = Math.random() * 5 + 0.5; // 0.5 to 5.5
        const lastWeekSales = Math.round(dailyAverageSales * 7);
        const forecastDays = 14;
        const predictedNeed = dailyAverageSales * forecastDays;
        const deficit = product.quantity - predictedNeed;
        const needToOrder = deficit < 0 ? Math.abs(deficit) : 0;
        
        let status: 'critical' | 'warning' | 'ok' = 'ok';
        if (product.quantity < (product.minQuantity || 10) && needToOrder > 0) {
          status = 'critical';
        } else if (product.quantity < (product.minQuantity || 10) || needToOrder > 0) {
          status = 'warning';
        }

        return {
          ...product,
          dailyAverageSales,
          lastWeekSales,
          supplier: 'Default Supplier', // In real app, get from product-supplier relation
          forecastDays,
          deficit,
          needToOrder,
          status
        };
      });
      
      setProducts(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createOrdersForProducts = async (productIds: string[]) => {
    try {
      const selectedProducts = products.filter(p => productIds.includes(p._id));
      
      // Group products by supplier
      const ordersBySupplier: Record<string, any[]> = {};
      selectedProducts.forEach(product => {
        if (!ordersBySupplier[product.supplier]) {
          ordersBySupplier[product.supplier] = [];
        }
        ordersBySupplier[product.supplier].push({
          productName: product.name,
          quantity: Math.round(product.needToOrder),
          price: product.costPrice,
          total: Math.round(product.needToOrder) * product.costPrice
        });
      });

      let ordersCreated = 0;
      
      // Create orders for each supplier
      for (const [supplierName, items] of Object.entries(ordersBySupplier)) {
        // Find supplier by name (in real app, you'd have proper supplier mapping)
        const suppliersResponse = await fetch('/api/suppliers');
        const suppliers = await suppliersResponse.json();
        const supplier = suppliers.find((s: any) => s.name === supplierName) || suppliers[0];
        
        const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
        
        const orderData = {
          supplier: supplier._id,
          supplierName: supplier.name,
          items,
          totalAmount,
          notes: 'Avtomatik yaratilgan buyurtma (Procurement tahlili asosida)'
        };

        const response = await fetch('/api/purchase-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          ordersCreated++;
        }
      }

      // Refresh products after creating orders
      await fetchProducts();
      
      return { ordersCreated };
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refetch = () => {
    fetchProducts();
  };

  return {
    products,
    loading,
    error,
    refetch,
    createOrdersForProducts
  };
};