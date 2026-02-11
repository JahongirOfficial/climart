import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouseTransferItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
}

export interface IWarehouseTransfer extends Document {
  transferNumber: string;
  sourceWarehouse: mongoose.Types.ObjectId;
  sourceWarehouseName: string;
  destinationWarehouse: mongoose.Types.ObjectId;
  destinationWarehouseName: string;
  transferDate: Date;
  items: IWarehouseTransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseTransferItemSchema = new Schema({
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
});

const WarehouseTransferSchema: Schema = new Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
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
    transferDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [WarehouseTransferItemSchema],
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'completed', 'cancelled'],
      default: 'pending',
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
WarehouseTransferSchema.index({ sourceWarehouse: 1 });
WarehouseTransferSchema.index({ destinationWarehouse: 1 });
WarehouseTransferSchema.index({ transferDate: 1 });
WarehouseTransferSchema.index({ status: 1 });

export default mongoose.models.WarehouseTransfer || mongoose.model<IWarehouseTransfer>('WarehouseTransfer', WarehouseTransferSchema);
