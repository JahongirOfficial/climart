import { Router, Request, Response } from 'express';
import Contract from '../models/Contract';
import Partner from '../models/Partner';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Helper function to generate unique contract number
async function generateContractNumber(): Promise<string> {
  return generateDocNumber('SH', { padWidth: 4 });
}

// Get all contracts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { partner, status, search } = req.query;
    const filter: any = {};
    
    if (partner) {
      filter.partner = partner;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { partnerName: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Auto-update expired contracts
    const now = new Date();
    await Contract.updateMany(
      { status: 'active', endDate: { $lt: now } },
      { status: 'expired' }
    );
    
    const contracts = await Contract.find(filter)
      .sort({ contractDate: -1 })
      .populate('partner');
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get contract by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id).populate('partner');
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get contracts expiring soon (within 30 days)
router.get('/alerts/expiring', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringContracts = await Contract.find({
      status: 'active',
      endDate: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort({ endDate: 1 });
    
    res.json(expiringContracts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new contract
router.post('/', async (req: Request, res: Response) => {
  try {
    const contractNumber = await generateContractNumber();
    
    // Get partner name
    const partner = await Partner.findById(req.body.partner);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // If this is set as default, unset other defaults for this partner
    if (req.body.isDefault) {
      await Contract.updateMany(
        { partner: req.body.partner, isDefault: true },
        { isDefault: false }
      );
    }
    
    const contract = new Contract({
      ...req.body,
      contractNumber,
      partnerName: partner.name,
    });
    
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // If setting as default, unset other defaults for this partner
    if (req.body.isDefault) {
      const contract = await Contract.findById(req.params.id);
      if (contract) {
        await Contract.updateMany(
          { 
            partner: contract.partner, 
            isDefault: true, 
            _id: { $ne: contract._id } 
          },
          { isDefault: false }
        );
      }
    }
    
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Set contract as default for partner
router.patch('/:id/set-default', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    // Unset other defaults for this partner
    await Contract.updateMany(
      { partner: contract.partner, isDefault: true },
      { isDefault: false }
    );
    
    // Set this as default
    contract.isDefault = true;
    await contract.save();
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Cancel contract
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
