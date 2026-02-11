import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxInvoiceItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface ITaxInvoice extends Document {
  invoiceNumber: string;
  shipment: mongoose.Types.ObjectId;
  shipmentNumber: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  organization: string;
  invoiceDate: Date;
  items: ITaxInvoiceItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'sent' | 'not_sent';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaxInvoiceItemSchema = new Schema({
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
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 12, // QQS 12%
  },
  taxAmount: {
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

const TaxInvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
    },
    shipment: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    shipmentNumber: {
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
      required: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [TaxInvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTax: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['sent', 'not_sent'],
      default: 'not_sent',
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
TaxInvoiceSchema.index({ shipment: 1 });
TaxInvoiceSchema.index({ customer: 1 });
TaxInvoiceSchema.index({ invoiceDate: 1 });

export default mongoose.models.TaxInvoice || mongoose.model<ITaxInvoice>('TaxInvoice', TaxInvoiceSchema);
