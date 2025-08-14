import mongoose, { Document, Schema } from 'mongoose';

/**
 * User role types
 */
export type UserRole = 'user' | 'driver' | 'admin';

/**
 * Payment method types
 */
export type PaymentMethod = 'card' | 'cash';

/**
 * Saved location interface
 */
export interface ISavedLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
  role: UserRole;
  defaultPaymentMethod: PaymentMethod;
  savedLocations: ISavedLocation[];
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
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
    profileImage: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'driver', 'admin'],
        message: 'Role must be user, driver, or admin'
      },
      default: 'user'
    },
    defaultPaymentMethod: {
      type: String,
      enum: {
        values: ['card', 'cash'],
        message: 'Payment method must be card or cash'
      },
      default: 'card'
    },
    savedLocations: [
      {
        label: {
          type: String,
          required: [true, 'Location label is required'],
          trim: true
        },
        address: {
          type: String,
          required: [true, 'Address is required'],
          trim: true
        },
        lat: {
          type: Number,
          required: [true, 'Latitude is required']
        },
        lng: {
          type: Number,
          required: [true, 'Longitude is required']
        }
      }
    ],
    resetPasswordToken: {
      type: String,
      default: null,
      index: true
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

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Create and export the User model
const User = mongoose.model<IUser>('User', userSchema);

export default User;
