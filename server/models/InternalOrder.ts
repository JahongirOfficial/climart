import mongoose, { Schema, Document } from 'mongoose';

export interface IInternalOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  requestedQuantity: number;
  shippedQuantity: number;
  costPrice: number;
  total: number;
}

export interface IInternalOrder extends Document {
  orderNumber: string;
  organization?: string;
  sourceWarehouse: mongoose.Types.ObjectId;
  sourceWarehouseName: string;
  destinationWarehouse: mongoose.Types.ObjectId;
  destinationWarehouseName: string;
  orderDate: Date;
  expectedDate?: Date;
  items: IInternalOrderItem[];
  totalAmount: number;
  shippedAmount: number;
  fulfillmentPercentage: number;
  status: 'new' | 'approved' | 'partial' | 'completed' | 'cancelled';
  transferCreated: boolean;
  transferId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternalOrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  shippedQuantity: {
    type: Number,
    default: 0,
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

const InternalOrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    sourceWarehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    sourceWarehouseName: {
      type: String,
      required: true,
    },
    destinationWarehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    destinationWarehouseName: {
      type: String,
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedDate: {
      type: Date,
    },
    items: {
      type: [InternalOrderItemSchema],
      required: true,
      validate: {
        validator: function(items: IInternalOrderItem[]) {
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
    shippedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fulfillmentPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['new', 'approved', 'partial', 'completed', 'cancelled'],
      default: 'new',
    },
    transferCreated: {
      type: Boolean,
      default: false,
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseTransfer',
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

InternalOrderSchema.index({ orderNumber: 1 }, { unique: true });
InternalOrderSchema.index({ sourceWarehouse: 1 });
InternalOrderSchema.index({ destinationWarehouse: 1 });
InternalOrderSchema.index({ status: 1 });
InternalOrderSchema.index({ orderDate: -1 });

export default mongoose.models.InternalOrder || mongoose.model<IInternalOrder>('InternalOrder', InternalOrderSchema);
