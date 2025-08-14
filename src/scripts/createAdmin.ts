import { connectDB } from '../db/mongoose';
import { User } from '../models';
import bcrypt from 'bcryptjs';

/**
 * Script to create an admin user for testing
 * Run with: npm run create-admin
 */

async function createAdminUser() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();
    
    console.log('✅ Database connected successfully');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@uberclone.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }
    
    // Create admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@uberclone.com',
      password: hashedPassword,
      phone: '1234567890',
      role: 'admin',
      defaultPaymentMethod: 'card'
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@uberclone.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');
    console.log('\n🔐 You can now login with these credentials');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

export default createAdminUser;
