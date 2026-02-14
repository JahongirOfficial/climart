import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  name: string; // e.g., "L", "XL", "Qizil"
  sku?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
}

export interface IProductStock {
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  quantity: number;
  reserved: number;
}

export type UnitType = 'count' | 'uncount';

export interface IProduct extends Document {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit: string;
  unitType: UnitType;
  weight?: number;
  weightUnit?: string;
  country?: string;
  supplier?: mongoose.Types.ObjectId;
  supplierName?: string;
  quantity: number;
  reserved: number;
  costPrice: number;
  sellingPrice: number;
  minStock?: number;
  description?: string;
  image?: string;
  qrCode?: string;
  variants: IProductVariant[];
  stockByWarehouse: IProductStock[];
  files: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const ProductStockSchema = new Schema({
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  warehouseName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  reserved: {
    type: Number,
    default: 0,
  },
});

const ProductFileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      sparse: true, // Allow null values but enforce uniqueness if present
      trim: true,
    },
    barcode: {
      type: String,
      sparse: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      default: 'dona',
    },
    unitType: {
      type: String,
      enum: ['count', 'uncount'],
      default: 'count',
    },
    weight: {
      type: Number,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'litr', 'metr', 'boshqa'],
      default: 'kg',
    },
    country: {
      type: String,
      trim: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    reserved: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String,
      trim: true,
    },
    variants: [ProductVariantSchema],
    stockByWarehouse: [ProductStockSchema],
    files: [ProductFileSchema],
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ProductSchema.index({ name: 1 });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ barcode: 1 }, { sparse: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
