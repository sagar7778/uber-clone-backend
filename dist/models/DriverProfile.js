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
const driverProfileSchema = new mongoose_1.Schema({
    driverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Driver',
        required: [true, 'Driver ID is required'],
        unique: true
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'APPROVED', 'REJECTED'],
            message: 'Status must be PENDING, APPROVED, or REJECTED'
        },
        default: 'PENDING'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    documentsVerified: {
        type: Boolean,
        default: false
    },
    backgroundCheckPassed: {
        type: Boolean,
        default: false
    },
    insuranceValid: {
        type: Boolean,
        default: false
    },
    vehicleInspectionPassed: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    }
}, {
    timestamps: true
});
driverProfileSchema.index({ driverId: 1 });
driverProfileSchema.index({ status: 1 });
driverProfileSchema.index({ createdAt: -1 });
const DriverProfile = mongoose_1.default.model('DriverProfile', driverProfileSchema);
exports.default = DriverProfile;
//# sourceMappingURL=DriverProfile.js.map