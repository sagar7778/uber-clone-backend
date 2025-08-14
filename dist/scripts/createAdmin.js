"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("../db/mongoose");
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function createAdminUser() {
    try {
        console.log('🚀 Connecting to database...');
        await (0, mongoose_1.connectDB)();
        console.log('✅ Database connected successfully');
        const existingAdmin = await models_1.User.findOne({ email: 'admin@uberclone.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            process.exit(0);
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash('admin123', saltRounds);
        const adminUser = new models_1.User({
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
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    createAdminUser();
}
exports.default = createAdminUser;
//# sourceMappingURL=createAdmin.js.map