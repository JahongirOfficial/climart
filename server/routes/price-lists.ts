import { Router, Request, Response } from 'express';
import PriceList from '../models/PriceList';
import Product from '../models/Product';

const router = Router();

// Get all price lists
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, organization } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (organization) filter.organization = organization;

    const priceLists = await PriceList.find(filter)
      .sort({ createdAt: -1 });

    res.json(priceLists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get single price list
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    
    if (!priceList) {
      return res.status(404).json({ message: 'Price list not found' });
    }

    res.json(priceList);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create price list
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, organization, validFrom, validTo, markupPercent, items, notes, status } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Calculate price changes
    const processedItems = items.map((item: any) => ({
      ...item,
      priceChange: item.oldPrice > 0 
        ? ((item.newPrice - item.oldPrice) / item.oldPrice) * 100 
        : 0
    }));

    const priceList = new PriceList({
      name,
      organization,
      validFrom: validFrom || new Date(),
      validTo,
      markupPercent,
      items: processedItems,
      notes,
      status: status || 'draft',
    });

    await priceList.save();

    res.status(201).json(priceList);
  } catch (error) {
    console.error('Error creating price list:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update price list
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, organization, validFrom, validTo, markupPercent, items, notes, status } = req.body;

    const priceList = await PriceList.findById(req.params.id);
    
    if (!priceList) {
      return res.status(404).json({ message: 'Price list not found' });
    }

    // Calculate price changes
    const processedItems = items.map((item: any) => ({
      ...item,
      priceChange: item.oldPrice > 0 
        ? ((item.newPrice - item.oldPrice) / item.oldPrice) * 100 
        : 0
    }));

    priceList.name = name;
    priceList.organization = organization;
    priceList.validFrom = validFrom;
    priceList.validTo = validTo;
    priceList.markupPercent = markupPercent;
    priceList.items = processedItems;
    priceList.notes = notes;
    if (status) priceList.status = status;

    await priceList.save();

    res.json(priceList);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete price list
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    
    if (!priceList) {
      return res.status(404).json({ message: 'Price list not found' });
    }

    await PriceList.findByIdAndDelete(req.params.id);

    res.json({ message: 'Price list deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Change status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const priceList = await PriceList.findById(req.params.id);
    
    if (!priceList) {
      return res.status(404).json({ message: 'Price list not found' });
    }

    priceList.status = status;
    await priceList.save();

    res.json(priceList);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Apply markup to products
router.post('/apply-markup', async (req: Request, res: Response) => {
  try {
    const { productIds, markupPercent } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }

    if (markupPercent === undefined || markupPercent < 0) {
      return res.status(400).json({ message: 'Valid markup percent is required' });
    }

    const products = await Product.find({ _id: { $in: productIds } });

    const items = products.map(product => {
      const oldPrice = product.sellingPrice;
      const newPrice = Math.round(product.costPrice * (1 + markupPercent / 100));
      const priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

      return {
        product: product._id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        oldPrice,
        newPrice,
        priceChange
      };
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Apply price list to products
router.post('/:id/apply', async (req: Request, res: Response) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    
    if (!priceList) {
      return res.status(404).json({ message: 'Price list not found' });
    }

    if (priceList.status !== 'active') {
      return res.status(400).json({ message: 'Only active price lists can be applied' });
    }

    // Update product prices
    for (const item of priceList.items) {
      await Product.findByIdAndUpdate(item.product, {
        sellingPrice: item.newPrice
      });
    }

    res.json({ message: 'Price list applied successfully', count: priceList.items.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
