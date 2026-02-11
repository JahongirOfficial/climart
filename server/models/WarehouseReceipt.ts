import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouseReceiptItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface IWarehouseReceipt extends Document {
  receiptNumber: string;
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  organization?: string;
  receiptDate: Date;
  status: 'draft' | 'confirmed';
  items: IWarehouseReceiptItem[];
  totalAmount: number;
  reason: 'inventory_adjustment' | 'found_items' | 'production' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseReceiptItemSchema = new Schema({
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
}, { _id: false });

const WarehouseReceiptSchema: Schema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    warehouseName: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    receiptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed'],
      default: 'draft',
    },
    items: {
      type: [WarehouseReceiptItemSchema],
      required: true,
      validate: {
        validator: function(items: IWarehouseReceiptItem[]) {
          return items.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: ['inventory_adjustment', 'found_items', 'production', 'other'],
      default: 'other',
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
WarehouseReceiptSchema.index({ warehouse: 1 });
WarehouseReceiptSchema.index({ receiptDate: -1 });
WarehouseReceiptSchema.index({ status: 1 });

export default mongoose.models.WarehouseReceipt || mongoose.model<IWarehouseReceipt>('WarehouseReceipt', WarehouseReceiptSchema);
