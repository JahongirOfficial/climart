import mongoose, { Schema, Document } from 'mongoose';

export interface IWriteoffItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface IWriteoff extends Document {
  writeoffNumber: string;
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  organization?: string;
  writeoffDate: Date;
  status: 'draft' | 'confirmed';
  items: IWriteoffItem[];
  totalAmount: number;
  reason: 'damaged' | 'expired' | 'lost' | 'personal_use' | 'inventory_shortage' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WriteoffItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const WriteoffSchema: Schema = new Schema(
  {
    writeoffNumber: {
      type: String,
      required: true,
      unique: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    warehouseName: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    writeoffDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed'],
      default: 'draft',
    },
    items: [WriteoffItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: ['damaged', 'expired', 'lost', 'personal_use', 'inventory_shortage', 'other'],
      required: true,
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
WriteoffSchema.index({ warehouse: 1 });
WriteoffSchema.index({ writeoffDate: -1 });
WriteoffSchema.index({ status: 1 });

export default mongoose.models.Writeoff || mongoose.model<IWriteoff>('Writeoff', WriteoffSchema);
