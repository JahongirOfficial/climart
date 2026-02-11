import mongoose, { Schema, Document } from 'mongoose';

export interface ISerialNumber extends Document {
  serialNumber: string;
  product: mongoose.Types.ObjectId;
  productName: string;
  status: 'in_stock' | 'sold' | 'returned' | 'defective';
  purchaseDate?: Date;
  saleDate?: Date;
  supplier?: mongoose.Types.ObjectId;
  supplierName?: string;
  customer?: string;
  warranty?: {
    startDate: Date;
    endDate: Date;
    duration: number; // in months
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SerialNumberSchema: Schema = new Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['in_stock', 'sold', 'returned', 'defective'],
      default: 'in_stock',
    },
    purchaseDate: {
      type: Date,
    },
    saleDate: {
      type: Date,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
    },
    customer: {
      type: String,
    },
    warranty: {
      startDate: Date,
      endDate: Date,
      duration: Number,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SerialNumber || mongoose.model<ISerialNumber>('SerialNumber', SerialNumberSchema);
