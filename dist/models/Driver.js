"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const driverSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    licenseImage: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=License+Image'
    },
    vehicleType: {
        type: String,
        enum: {
            values: ['sedan', 'suv', 'hatchback', 'bike', 'auto'],
            message: 'Vehicle type must be sedan, suv, hatchback, bike, or auto'
        },
        required: [true, 'Vehicle type is required']
    },
    vehicleModel: {
        type: String,
        required: [true, 'Vehicle model is required'],
        trim: true
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    vehicleImage: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=Vehicle+Image'
    },
    rating: {
        type: Number,
        default: 5,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        lat: {
            type: Number,
            default: 0
        },
        lng: {
            type: Number,
            default: 0
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: [0, 'Total earnings cannot be negative']
    },
    completedRides: {
        type: Number,
        default: 0,
        min: [0, 'Completed rides cannot be negative']
    },
    resetPasswordToken: {
        type: String,
        default: null,
        index: true
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});
driverSchema.index({ email: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ vehicleNumber: 1 });
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
driverSchema.index({ resetPasswordToken: 1 });
const Driver = mongoose_1.default.model('Driver', driverSchema);
exports.default = Driver;
//# sourceMappingURL=Driver.js.map