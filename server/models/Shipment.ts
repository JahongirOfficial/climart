import mongoose, { Schema, Document } from 'mongoose';

export interface IShipmentItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IShipment extends Document {
  shipmentNumber: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  receiver?: string;
  organization?: string;
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  invoice?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  shipmentDate: Date;
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  items: IShipmentItem[];
  totalAmount: number;
  paidAmount: number;
  deliveryAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentItemSchema = new Schema({
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

const ShipmentSchema: Schema = new Schema(
  {
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
    receiver: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerOrder',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerInvoice',
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    shipmentDate: {
      type: Date,
      required: true,
      default: Date.now,
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
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: [ShipmentItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
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
ShipmentSchema.index({ shipmentNumber: 1 }, { unique: true });
ShipmentSchema.index({ customer: 1 });
ShipmentSchema.index({ order: 1 });
ShipmentSchema.index({ invoice: 1 });
ShipmentSchema.index({ shipmentDate: 1 });
ShipmentSchema.index({ status: 1 });

export default mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
