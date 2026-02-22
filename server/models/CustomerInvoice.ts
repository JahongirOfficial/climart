import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerInvoiceItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  discount: number;
  discountAmount: number;
  total: number;
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  costPricePending?: boolean;
}

export interface ICustomerInvoice extends Document {
  invoiceNumber: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  organization?: string;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName?: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  shippedStatus: 'not_shipped' | 'partial' | 'shipped';
  items: ICustomerInvoiceItem[];
  totalAmount: number;
  discountTotal: number;
  finalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  notes?: string;
  isMinusCorrection?: boolean;
  customerOrder?: mongoose.Types.ObjectId;
  orderNumber?: string;
  createdBy?: mongoose.Types.ObjectId;
  currency: string;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerInvoiceItemSchema = new Schema({
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
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
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
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
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
  costPricePending: {
    type: Boolean,
    default: false,
  },
});

const CustomerInvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
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
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid', 'overdue', 'cancelled'],
      default: 'unpaid',
    },
    shippedStatus: {
      type: String,
      enum: ['not_shipped', 'partial', 'shipped'],
      default: 'not_shipped',
    },
    items: [CustomerInvoiceItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shippedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    isMinusCorrection: {
      type: Boolean,
      default: false,
    },
    customerOrder: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerOrder',
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
CustomerInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
CustomerInvoiceSchema.index({ customer: 1 });
CustomerInvoiceSchema.index({ invoiceDate: 1 });
CustomerInvoiceSchema.index({ invoiceDate: -1 }); // For descending sort
CustomerInvoiceSchema.index({ dueDate: 1 });
CustomerInvoiceSchema.index({ status: 1 });
CustomerInvoiceSchema.index({ 'items.product': 1 }); // For product sales aggregation
CustomerInvoiceSchema.index({ customerOrder: 1 });

export default mongoose.models.CustomerInvoice || mongoose.model<ICustomerInvoice>('CustomerInvoice', CustomerInvoiceSchema);
