import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ICustomerOrder extends Document {
  orderNumber: string;
  customer?: mongoose.Types.ObjectId; // Optional for regular customers
  customerName: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'fulfilled' | 'cancelled';
  items: ICustomerOrderItem[];
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName?: string;
  reserved: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerOrderItemSchema = new Schema({
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

const CustomerOrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: false, // Optional for regular customers
    },
    customerName: {
      type: String,
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    items: [CustomerOrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseName: {
      type: String,
      trim: true,
    },
    reserved: {
      type: Boolean,
      default: false,
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
CustomerOrderSchema.index({ orderNumber: 1 }, { unique: true });
CustomerOrderSchema.index({ customer: 1 });
CustomerOrderSchema.index({ orderDate: 1 });
CustomerOrderSchema.index({ status: 1 });

export default mongoose.models.CustomerOrder || mongoose.model<ICustomerOrder>('CustomerOrder', CustomerOrderSchema);
