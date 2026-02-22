import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerReturnItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
}

export interface ICustomerReturn extends Document {
  returnNumber: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  organization?: string;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName?: string;
  invoice: mongoose.Types.ObjectId;
  invoiceNumber: string;
  shipment?: mongoose.Types.ObjectId;
  shipmentNumber?: string;
  customerOrder?: mongoose.Types.ObjectId;
  orderNumber?: string;
  returnDate: Date;
  status: 'pending' | 'accepted' | 'cancelled';
  items: ICustomerReturnItem[];
  totalAmount: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  notes?: string;
  currency: string;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerReturnItemSchema = new Schema({
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
  reason: {
    type: String,
    enum: ['defective', 'wrong_item', 'customer_request', 'other'],
    required: true,
  },
});

const CustomerReturnSchema: Schema = new Schema(
  {
    returnNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseName: {
      type: String,
      trim: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerInvoice',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    shipment: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    shipmentNumber: {
      type: String,
      trim: true,
    },
    customerOrder: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerOrder',
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    returnDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'cancelled'],
      default: 'pending',
    },
    items: [CustomerReturnItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: ['defective', 'wrong_item', 'customer_request', 'other'],
      required: true,
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

// Indexes for performance
CustomerReturnSchema.index({ returnNumber: 1 }, { unique: true });
CustomerReturnSchema.index({ customer: 1 });
CustomerReturnSchema.index({ invoice: 1 });
CustomerReturnSchema.index({ shipment: 1 });
CustomerReturnSchema.index({ customerOrder: 1 });
CustomerReturnSchema.index({ returnDate: 1 });

export default mongoose.models.CustomerReturn || mongoose.model<ICustomerReturn>('CustomerReturn', CustomerReturnSchema);
