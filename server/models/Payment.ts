import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  type: 'incoming' | 'outgoing' | 'transfer'; // Kiruvchi, Chiquvchi, O'tkazma
  paymentDate: Date;
  amount: number;
  
  // Partner info (customer or supplier)
  partner?: mongoose.Types.ObjectId;
  partnerName?: string;
  
  // Organization info
  organization?: string;
  
  // Account info
  account: 'cash' | 'bank'; // Kassa yoki Bank
  accountNumber?: string; // Bank hisob raqami
  
  // Payment method
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other';
  
  // Purpose and category
  purpose: string; // To'lov maqsadi
  category?: string; // Xarajat moddasi (ijara, maosh, marketing, etc.)
  
  // Linked documents
  linkedDocument?: mongoose.Types.ObjectId; // Bog'langan hujjat (invoice, order, etc.)
  linkedDocumentType?: string; // Hujjat turi
  linkedDocumentNumber?: string;
  
  // Transfer specific (for cash-bank transfers)
  fromAccount?: 'cash' | 'bank';
  toAccount?: 'cash' | 'bank';
  
  // Status
  status: 'draft' | 'confirmed' | 'cancelled';
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['incoming', 'outgoing', 'transfer'],
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
    },
    partnerName: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    account: {
      type: String,
      required: true,
      enum: ['cash', 'bank'],
      default: 'bank',
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'bank_transfer', 'card', 'other'],
      default: 'bank_transfer',
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    linkedDocument: {
      type: Schema.Types.ObjectId,
    },
    linkedDocumentType: {
      type: String,
      trim: true,
    },
    linkedDocumentNumber: {
      type: String,
      trim: true,
    },
    fromAccount: {
      type: String,
      enum: ['cash', 'bank'],
    },
    toAccount: {
      type: String,
      enum: ['cash', 'bank'],
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PaymentSchema.index({ paymentNumber: 1 }, { unique: true });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ paymentDate: 1 });
PaymentSchema.index({ partner: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ account: 1 });
PaymentSchema.index({ category: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);