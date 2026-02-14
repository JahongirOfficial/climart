import mongoose, { Schema, Document } from 'mongoose';

export interface IPartner extends Document {
  code: string;
  name: string;
  type: 'customer' | 'supplier' | 'both' | 'worker';
  status: 'new' | 'active' | 'vip' | 'inactive' | 'blocked';
  group?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
  physicalAddress?: string;
  taxId?: string;
  bankAccount?: string;
  telegramUsername?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['customer', 'supplier', 'both', 'worker'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'active', 'vip', 'inactive', 'blocked'],
      default: 'new',
    },
    group: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    legalAddress: {
      type: String,
      trim: true,
    },
    physicalAddress: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    bankAccount: {
      type: String,
      trim: true,
    },
    telegramUsername: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance (unique index already defined in schema)
PartnerSchema.index({ name: 1, type: 1 });
PartnerSchema.index({ type: 1 });
PartnerSchema.index({ status: 1 });
PartnerSchema.index({ isActive: 1 });

export default mongoose.models.Partner || mongoose.model<IPartner>('Partner', PartnerSchema);
