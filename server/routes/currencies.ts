import { Router, Request, Response } from 'express';
import Currency from '../models/Currency';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET / — Barcha faol valyutalar
router.get('/', async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find({ isActive: true }).sort({ isBase: -1, code: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /all — Barcha valyutalar (active + inactive, admin uchun)
router.get('/all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find().sort({ isBase: -1, code: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /:id — Bitta valyuta
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Valyuta topilmadi' });
    }
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// POST /sync-cbu — CBU dan kurslarni yangilash
router.post('/sync-cbu', requireAdmin, async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://cbu.uz/oz/arkhiv-kursov-valyut/json/');
    if (!response.ok) {
      return res.status(502).json({ message: 'CBU API dan javob olishda xatolik' });
    }

    const cbuRates: Array<{
      Ccy: string;
      Rate: string;
      Nominal: string;
      CcyNm_UZ: string;
      CcyNm_RU: string;
    }> = await response.json();

    let updatedCount = 0;
    for (const entry of cbuRates) {
      const currency = await Currency.findOne({ code: entry.Ccy, isActive: true });
      if (currency && !currency.isBase) {
        const nominal = parseInt(entry.Nominal) || 1;
        const newRate = parseFloat(entry.Rate) / nominal;
        currency.exchangeRate = newRate;
        currency.nominal = nominal;
        currency.lastUpdated = new Date();
        await currency.save();
        updatedCount++;
      }
    }

    res.json({ message: `${updatedCount} ta valyuta kursi yangilandi`, updatedCount });
  } catch (error) {
    res.status(500).json({ message: 'CBU sinxronlashda xatolik', error });
  }
});

// POST / — Yangi valyuta yaratish (admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, name, symbol, nominal, exchangeRate } = req.body;

    const existing = await Currency.findOne({ code: code?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Bu valyuta kodi allaqachon mavjud' });
    }

    const currency = await Currency.create({
      code,
      name,
      symbol,
      nominal: nominal || 1,
      exchangeRate,
      isBase: false,
      isActive: true,
      lastUpdated: new Date(),
    });

    res.status(201).json(currency);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// PUT /:id — Valyutani tahrirlash (admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, symbol, nominal, exchangeRate, isActive } = req.body;

    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Valyuta topilmadi' });
    }

    if (name !== undefined) currency.name = name;
    if (symbol !== undefined) currency.symbol = symbol;
    if (nominal !== undefined) currency.nominal = nominal;
    if (exchangeRate !== undefined) {
      currency.exchangeRate = exchangeRate;
      currency.lastUpdated = new Date();
    }
    if (isActive !== undefined && !currency.isBase) currency.isActive = isActive;

    await currency.save();
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// PATCH /:id/rate — Kursni qo'lda o'rnatish
router.patch('/:id/rate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { rate } = req.body;
    if (!rate || rate <= 0) {
      return res.status(400).json({ message: 'Kurs musbat son bo\'lishi kerak' });
    }

    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Valyuta topilmadi' });
    }
    if (currency.isBase) {
      return res.status(400).json({ message: 'Asosiy valyuta kursini o\'zgartirib bo\'lmaydi' });
    }

    currency.exchangeRate = rate;
    currency.lastUpdated = new Date();
    await currency.save();

    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE /:id — Valyutani o'chirish (admin, faqat base bo'lmagan)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: 'Valyuta topilmadi' });
    }
    if (currency.isBase) {
      return res.status(400).json({ message: 'Asosiy valyutani o\'chirib bo\'lmaydi' });
    }

    await currency.deleteOne();
    res.json({ message: 'Valyuta o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
