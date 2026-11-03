import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUserDocument extends Document {
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  password?: string;
  passwordHash?: string;
  googleId?: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'guest';
  addresses?: ICustomerAddress[];
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  defaultShippingAddress?: string;
  resetOtp?: string | null;
  resetOtpExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSubSchema = new Schema<ICustomerAddress>(
  {
    id: { type: String, required: true },
    recipientName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    apartment: { type: String, default: '' },
    city: { type: String, default: 'Islamabad' },
    state: { type: String, default: 'ICT' },
    postalCode: { type: String, default: '44000' },
    country: { type: String, default: 'Pakistan' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: false, // Optional for Google-only authentication
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'guest'],
      default: 'email',
    },
    addresses: {
      type: [AddressSubSchema],
      default: [],
    },
    address: {
      type: String,
      default: '',
    },
    apartment: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'Pakistan',
    },
    defaultShippingAddress: {
      type: String,
      default: '',
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.fullName = ret.name;
        delete ret.password;
        delete ret.resetOtp;
        delete ret.resetOtpExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual fullName mapping for frontend compatibility
UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  return this.name;
});

// Pre-save hook: Hash password if modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: Compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static helper: Sanitize user object
export class UserModel {
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  public static async comparePassword(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) return false;
    return bcrypt.compare(plain, hashed);
  }

  public static sanitize(user: any): Record<string, any> {
    if (!user) return {};
    const obj = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    const id = obj._id ? obj._id.toString() : obj.id;
    return {
      id,
      _id: id,
      name: obj.name || obj.fullName || '',
      fullName: obj.name || obj.fullName || '',
      email: obj.email || '',
      phone: obj.phone || '',
      role: obj.role || 'customer',
      status: obj.status || 'active',
      authProvider: obj.authProvider || (obj.googleId ? 'google' : 'email'),
      avatarUrl: obj.avatarUrl || '',
      createdAt: obj.createdAt || new Date().toISOString(),
      lastLoginAt: obj.lastLoginAt || new Date().toISOString(),
    };
  }
}

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
