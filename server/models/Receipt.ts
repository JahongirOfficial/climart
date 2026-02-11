import mongoose, { Schema, Document } from 'mongoose';

export interface IReceiptItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  costPrice: number; // Tan narx
  total: number;
}

export interface IReceipt extends Document {
  receiptNumber: string;
  supplier: mongoose.Types.ObjectId;
  supplierName: string;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName?: string;
  purchaseOrder?: mongoose.Types.ObjectId;
  orderNumber?: string;
  receiptDate: Date;
  items: IReceiptItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema({
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

const ReceiptSchema: Schema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseName: {
      type: String,
      trim: true,
    },
    purchaseOrder: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    orderNumber: {
      type: String,
    },
    receiptDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    items: [ReceiptItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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

export default mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);
