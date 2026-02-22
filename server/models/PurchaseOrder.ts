import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
  product?: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  supplier: mongoose.Types.ObjectId;
  supplierName: string;
  orderDate: Date;
  status: 'pending' | 'received' | 'cancelled';
  items: IPurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  currency: string;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
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
  price: {
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

const PurchaseOrderSchema: Schema = new Schema(
  {
    orderNumber: {
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
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'received', 'cancelled'],
      default: 'pending',
    },
    items: [PurchaseOrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'UZS',
      uppercase: true,
      trim: true,
    },
    exchangeRate: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
