import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Driver } from '../models';

/**
 * User Management Controller
 * Handles CRUD operations for users
 */

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'driver' | 'admin';
  profileImage?: string;
  defaultPaymentMethod?: 'card' | 'cash';
  savedLocations?: Array<{
    label: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  defaultPaymentMethod?: 'card' | 'cash';
  savedLocations?: Array<{
    label: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

/**
 * GET /api/users
 * Get all users (admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const query: any = {};
    
    // Filter by role if specified
    if (role && ['user', 'driver', 'admin'].includes(role as string)) {
      query.role = role;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalUsers: total,
          hasNextPage: skip + users.length < total,
          hasPrevPage: Number(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users'
    });
  }
};

/**
 * GET /api/users/:id
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user'
    });
  }
};

/**
 * POST /api/users
 * Create a new user (admin only)
 */
export const createUser = async (req: Request<{}, {}, CreateUserBody>, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      role, 
      profileImage, 
      defaultPaymentMethod,
      savedLocations 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      profileImage,
      defaultPaymentMethod: defaultPaymentMethod || 'card',
      savedLocations: savedLocations || []
    });

    await user.save();

    // If role is driver, create driver document
    if (role === 'driver') {
      const driver = new Driver({
        userId: user._id,
        licenseNumber: '',
        licenseImage: '',
        vehicleType: 'sedan',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleImage: '',
        currentLocation: {
          lat: 0,
          lng: 0,
          updatedAt: new Date()
        }
      });
      await driver.save();
    }

    // Return user info (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      defaultPaymentMethod: user.defaultPaymentMethod,
      savedLocations: user.savedLocations,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating user'
    });
  }
};

/**
 * PUT /api/users/:id
 * Update user by ID
 */
export const updateUser = async (req: Request<{ id: string }, {}, UpdateUserBody>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated
    delete (updateData as any).password;
    delete (updateData as any).role; // Role changes should go through a separate process
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating user'
    });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user by ID (admin only)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Prevent deletion of admin users
    if (user.role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
      return;
    }
    
    // Delete associated driver document if exists
    if (user.role === 'driver') {
      await Driver.findOneAndDelete({ userId: user._id });
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user'
    });
  }
};

/**
 * POST /api/users/:id/change-role
 * Change user role (admin only)
 */
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    
    if (!['user', 'driver', 'admin'].includes(newRole)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, driver, or admin'
      });
      return;
    }
    
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const oldRole = user.role;
    user.role = newRole;
    await user.save();
    
    // Handle driver-specific logic
    if (newRole === 'driver' && oldRole !== 'driver') {
      // Create driver document
      const existingDriver = await Driver.findOne({ userId: user._id });
      if (!existingDriver) {
        const driver = new Driver({
          userId: user._id,
          licenseNumber: '',
          licenseImage: '',
          vehicleType: 'sedan',
          vehicleModel: '',
          vehicleNumber: '',
          vehicleImage: '',
          currentLocation: {
            lat: 0,
            lng: 0,
            updatedAt: new Date()
          }
        });
        await driver.save();
      }
    } else if (oldRole === 'driver' && newRole !== 'driver') {
      // Remove driver document
      await Driver.findOneAndDelete({ userId: user._id });
    }
    
    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${newRole}`,
      data: { user: { ...user.toObject(), password: undefined } }
    });
    
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while changing user role'
    });
  }
};

/**
 * POST /api/users/:id/reset-password
 * Reset user password (admin only)
 */
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }
    
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User password reset successfully'
    });
    
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password'
    });
  }
};

/**
 * GET /api/users/stats
 * Get user statistics (admin only)
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    
    // Get users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalAdmins,
        totalRegularUsers,
        newUsersThisMonth,
        userDistribution: {
          regular: totalRegularUsers,
          drivers: totalDrivers,
          admins: totalAdmins
        }
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user statistics'
    });
  }
};
