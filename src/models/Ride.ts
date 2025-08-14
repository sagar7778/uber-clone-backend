import mongoose, { Document, Schema } from 'mongoose';

/**
 * Ride status options
 */
export type RideStatus = 'requested' | 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Payment status options
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed';

/**
 * Location interface
 */
export interface ILocation {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Ride document interface
 */
export interface IRide extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  pickupLocation: ILocation;
  dropLocation: ILocation;
  distanceKm: number;
  estimatedFare: number;
  actualFare?: number;
  paymentStatus: PaymentStatus;
  status: RideStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  ratingByUser?: number;
  ratingByDriver?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ride schema definition
 */
const rideSchema = new Schema<IRide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    driverId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true
  }
);

// Create indexes
rideSchema.index({ userId: 1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ paymentStatus: 1 });
rideSchema.index({ createdAt: -1 });
rideSchema.index({ 'pickupLocation.lat': 1, 'pickupLocation.lng': 1 });
rideSchema.index({ 'dropLocation.lat': 1, 'dropLocation.lng': 1 });

// Create and export the Ride model
const Ride = mongoose.model<IRide>('Ride', rideSchema);

export default Ride;
