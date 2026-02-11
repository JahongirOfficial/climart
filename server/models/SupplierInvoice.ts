import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierInvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ISupplierInvoice extends Document {
  invoiceNumber: string;
  supplier: mongoose.Types.ObjectId;
  supplierName: string;
  purchaseOrder?: mongoose.Types.ObjectId;
  orderNumber?: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'unpaid' | 'partial' | 'paid';
  items: ISupplierInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierInvoiceItemSchema = new Schema({
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

const SupplierInvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
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
    purchaseOrder: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    orderNumber: {
      type: String,
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
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    items: [SupplierInvoiceItemSchema],
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update status based on paid amount
SupplierInvoiceSchema.pre('save', function(this: ISupplierInvoice, next: () => void) {
  if (this.paidAmount === 0) {
    this.status = 'unpaid';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  next();
});

export default mongoose.models.SupplierInvoice || mongoose.model<ISupplierInvoice>('SupplierInvoice', SupplierInvoiceSchema);
