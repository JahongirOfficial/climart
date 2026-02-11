import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierReturnItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
  reason?: string; // Brak, nuqson, noto'g'ri model
}

export interface ISupplierReturn extends Document {
  returnNumber: string;
  supplier: mongoose.Types.ObjectId;
  supplierName: string;
  receipt?: mongoose.Types.ObjectId;
  receiptNumber?: string;
  returnDate: Date;
  items: ISupplierReturnItem[];
  totalAmount: number;
  reason: string; // Umumiy sabab
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierReturnItemSchema = new Schema({
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
  reason: {
    type: String,
    enum: ['brak', 'nuqson', 'noto\'g\'ri_model', 'boshqa'],
    default: 'boshqa',
  },
});

const SupplierReturnSchema: Schema = new Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    receipt: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
    },
    receiptNumber: {
      type: String,
    },
    returnDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [SupplierReturnItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      enum: ['brak', 'nuqson', 'noto\'g\'ri_model', 'boshqa'],
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

export default mongoose.models.SupplierReturn || mongoose.model<ISupplierReturn>('SupplierReturn', SupplierReturnSchema);
