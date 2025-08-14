import mongoose, { Document, Schema } from 'mongoose';

/**
 * Vehicle type options
 */
export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'bike' | 'auto';

/**
 * Current location interface
 */
export interface ICurrentLocation {
  lat: number;
  lng: number;
  updatedAt: Date;
}

/**
 * Driver document interface
 */
export interface IDriver extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseImage: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleImage: string;
  rating: number;
  isAvailable: boolean;
  currentLocation: ICurrentLocation;
  totalEarnings: number;
  completedRides: number;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Driver schema definition
 */
const driverSchema = new Schema<IDriver>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
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
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Create indexes (only for fields that need custom indexing)
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });

// Create and export the Driver model
const Driver = mongoose.model<IDriver>('Driver', driverSchema);

export default Driver;
