import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  vat: number;
  total: number;
  shipped: number;
  reserved: number;
}

export interface ICustomerOrder extends Document {
  orderNumber: string;
  customer?: mongoose.Types.ObjectId;
  customerName: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'new' | 'confirmed' | 'assembled' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  items: ICustomerOrderItem[];
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  invoicedSum: number;
  reservedSum: number;
  vatEnabled: boolean;
  vatIncluded: boolean;
  vatSum: number;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName?: string;
  reserved: boolean;
  assignedWorker?: mongoose.Types.ObjectId;
  assignedWorkerName?: string;
  salesChannel?: string;
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
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  vat: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  shipped: {
    type: Number,
    default: 0,
    min: 0,
  },
  reserved: {
    type: Number,
    default: 0,
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
      required: false,
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
      enum: ['new', 'confirmed', 'assembled', 'shipped', 'delivered', 'returned', 'cancelled'],
      default: 'new',
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
    invoicedSum: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedSum: {
      type: Number,
      default: 0,
      min: 0,
    },
    vatEnabled: {
      type: Boolean,
      default: false,
    },
    vatIncluded: {
      type: Boolean,
      default: true,
    },
    vatSum: {
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
    assignedWorker: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
    },
    assignedWorkerName: {
      type: String,
      trim: true,
    },
    salesChannel: {
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

// Indexes for performance
CustomerOrderSchema.index({ orderNumber: 1 }, { unique: true });
CustomerOrderSchema.index({ customer: 1 });
CustomerOrderSchema.index({ orderDate: 1 });
CustomerOrderSchema.index({ status: 1 });
CustomerOrderSchema.index({ warehouse: 1 });

export default mongoose.models.CustomerOrder || mongoose.model<ICustomerOrder>('CustomerOrder', CustomerOrderSchema);
