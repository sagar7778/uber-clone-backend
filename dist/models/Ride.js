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
const rideSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    driverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Driver',
        required: [true, 'Driver ID is required']
    },
    pickupLocation: {
        address: {
            type: String,
            required: [true, 'Pickup address is required'],
            trim: true
        },
        lat: {
            type: Number,
            required: [true, 'Pickup latitude is required']
        },
        lng: {
            type: Number,
            required: [true, 'Pickup longitude is required']
        }
    },
    dropLocation: {
        address: {
            type: String,
            required: [true, 'Drop address is required'],
            trim: true
        },
        lat: {
            type: Number,
            required: [true, 'Drop latitude is required']
        },
        lng: {
            type: Number,
            required: [true, 'Drop longitude is required']
        }
    },
    distanceKm: {
        type: Number,
        required: [true, 'Distance is required'],
        min: [0.1, 'Distance must be at least 0.1 km']
    },
    estimatedFare: {
        type: Number,
        required: [true, 'Estimated fare is required'],
        min: [0, 'Estimated fare cannot be negative']
    },
    actualFare: {
        type: Number,
        min: [0, 'Actual fare cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'failed'],
            message: 'Payment status must be pending, paid, or failed'
        },
        default: 'pending'
    },
    status: {
        type: String,
        enum: {
            values: ['requested', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'],
            message: 'Ride status must be one of the valid statuses'
        },
        default: 'requested'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    ratingByUser: {
        type: Number,
        min: [1, 'User rating must be at least 1'],
        max: [5, 'User rating cannot exceed 5']
    },
    ratingByDriver: {
        type: Number,
        min: [1, 'Driver rating must be at least 1'],
        max: [5, 'Driver rating cannot exceed 5']
    }
}, {
    timestamps: true
});
rideSchema.index({ userId: 1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ paymentStatus: 1 });
rideSchema.index({ createdAt: -1 });
rideSchema.index({ 'pickupLocation.lat': 1, 'pickupLocation.lng': 1 });
rideSchema.index({ 'dropLocation.lat': 1, 'dropLocation.lng': 1 });
const Ride = mongoose_1.default.model('Ride', rideSchema);
exports.default = Ride;
//# sourceMappingURL=Ride.js.map