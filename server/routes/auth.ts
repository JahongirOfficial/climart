import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with username/phone and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, username, password } = req.body;
    
    // Support both 'identifier' (old) and 'username' (new) for backward compatibility
    const loginIdentifier = identifier || username;
    
    console.log('Login attempt:', { identifier: loginIdentifier, password: '***' });
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user by username or phone number
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier.toLowerCase() },
        { phoneNumber: loginIdentifier }
      ]
    }).select('+passwordHash'); // Include passwordHash for verification
    
    console.log('User found:', user ? { username: user.username, phoneNumber: user.phoneNumber } : 'NOT FOUND');
    
    if (!user) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Hisob faol emas' });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      permissions: user.permissions,
    });
    
    // Return token and user profile (without passwordHash)
    const userProfile = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      permissions: user.permissions,
    };
    
    res.json({ token, user: userProfile });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userProfile = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      permissions: user.permissions,
    };
    
    res.json({ user: userProfile });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  // JWT is stateless, so logout is handled client-side
  res.json({ message: 'Logged out successfully' });
});

export default router;
