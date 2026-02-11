import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  code?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  duration?: number; // in minutes
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      sparse: true,
    },
    category: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      default: 'xizmat',
    },
    costPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 12, // QQS 12%
      min: 0,
      max: 100,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
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

// Indexes for performance
ServiceSchema.index({ name: 1 });
ServiceSchema.index({ code: 1 }, { unique: true, sparse: true });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
