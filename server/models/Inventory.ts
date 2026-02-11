import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceAmount: number;
}

export interface IInventory extends Document {
  inventoryNumber: string;
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  organization?: string;
  inventoryDate: Date;
  status: 'draft' | 'confirmed';
  category?: string;
  items: IInventoryItem[];
  totalShortage: number;
  totalSurplus: number;
  shortageAmount: number;
  surplusAmount: number;
  writeoffCreated: boolean;
  receiptCreated: boolean;
  writeoffId?: mongoose.Types.ObjectId;
  receiptId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  systemQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  actualQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  difference: {
    type: Number,
    required: true,
    default: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  differenceAmount: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

const InventorySchema: Schema = new Schema(
  {
    inventoryNumber: {
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
    inventoryDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed'],
      default: 'draft',
    },
    category: {
      type: String,
      trim: true,
    },
    items: {
      type: [InventoryItemSchema],
      required: true,
      validate: {
        validator: function(items: IInventoryItem[]) {
          return items.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    totalShortage: {
      type: Number,
      default: 0,
    },
    totalSurplus: {
      type: Number,
      default: 0,
    },
    shortageAmount: {
      type: Number,
      default: 0,
    },
    surplusAmount: {
      type: Number,
      default: 0,
    },
    writeoffCreated: {
      type: Boolean,
      default: false,
    },
    receiptCreated: {
      type: Boolean,
      default: false,
    },
    writeoffId: {
      type: Schema.Types.ObjectId,
      ref: 'Writeoff',
    },
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseReceipt',
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
InventorySchema.index({ warehouse: 1 });
InventorySchema.index({ inventoryDate: -1 });
InventorySchema.index({ status: 1 });

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
