import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
  contractNumber: string;
  partner: mongoose.Types.ObjectId;
  partnerName: string;
  organization?: string;
  contractDate: Date;
  startDate: Date;
  endDate: Date;
  currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
  totalAmount?: number;
  creditLimit?: number;
  paymentTerms?: string;
  status: 'active' | 'expired' | 'cancelled';
  isDefault: boolean;
  priceList?: string;
  fileUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema: Schema = new Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    contractDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      enum: ['UZS', 'USD', 'EUR', 'RUB'],
      default: 'UZS',
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    creditLimit: {
      type: Number,
      min: 0,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    priceList: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
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

// Indexes for performance (unique index already defined in schema)
ContractSchema.index({ partner: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ endDate: 1 });

// Auto-update status based on end date
ContractSchema.pre('save', function(this: any) {
  if (this.status === 'active' && new Date(this.endDate) < new Date()) {
    this.status = 'expired';
  }
});

export default mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);
