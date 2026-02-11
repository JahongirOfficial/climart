import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword, generatePassword } from '../utils/password';
import { generateUsername } from '../utils/username';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All employee routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/employees
 * Get all employees
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await User.find();
    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/employees
 * Create new employee
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber, address, password, permissions = [] } = req.body;
    
    console.log('Creating employee:', { firstName, lastName, phoneNumber, address, password: '***', permissions });
    
    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !password) {
      return res.status(400).json({ error: 'First name, last name, phone number, and password are required' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check for duplicate phone number
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({ error: 'Phone number already exists' });
    }
    
    // Generate username from first and last name
    const username = await generateUsername(firstName, lastName);
    console.log('Generated username:', username);
    
    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('Password hashed successfully');
    
    // Create employee
    const employee = await User.create({
      username,
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      address: address || '',
      role: 'employee',
      permissions,
      isActive: true,
    });
    
    console.log('Employee created:', { username: employee.username, phoneNumber: employee.phoneNumber });
    
    // Return employee data and credentials
    const employeeData = {
      _id: employee._id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber,
      role: employee.role,
      permissions: employee.permissions,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
    
    res.status(201).json({
      employee: employeeData,
      credentials: {
        username,
        password,
        phoneNumber: employee.phoneNumber, // Use the saved phone number from database
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/employees/:id
 * Get employee by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/employees/:id
 * Update employee
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber, permissions, isActive } = req.body;
    
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Update fields if provided
    if (firstName !== undefined) employee.firstName = firstName;
    if (lastName !== undefined) employee.lastName = lastName;
    if (phoneNumber !== undefined) {
      // Check for duplicate phone number
      const existingUser = await User.findOne({ 
        phoneNumber, 
        _id: { $ne: employee._id } 
      });
      if (existingUser) {
        return res.status(409).json({ error: 'Phone number already exists' });
      }
      employee.phoneNumber = phoneNumber;
    }
    if (permissions !== undefined) employee.permissions = permissions;
    if (isActive !== undefined) employee.isActive = isActive;
    
    await employee.save();
    
    res.json({ employee });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/employees/:id
 * Permanently delete employee
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Prevent deleting admin users
    if (employee.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }
    
    // Permanently delete
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
