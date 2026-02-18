import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceListItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  sku?: string;
  unit: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number; // Foiz o'zgarishi
}

export interface IPriceList extends Document {
  priceListNumber: string;
  name: string;
  organization?: string;
  validFrom: Date;
  validTo?: Date;
  status: 'draft' | 'active' | 'archived';
  markupPercent?: number; // Ustama foizi
  items: IPriceListItem[];
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PriceListItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
  },
  unit: {
    type: String,
    required: true,
  },
  oldPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  newPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  priceChange: {
    type: Number,
    default: 0,
  },
});

const PriceListSchema: Schema = new Schema(
  {
    priceListNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validTo: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    markupPercent: {
      type: Number,
      min: 0,
    },
    items: [PriceListItemSchema],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PriceListSchema.index({ priceListNumber: 1 }, { unique: true });
PriceListSchema.index({ status: 1 });
PriceListSchema.index({ validFrom: 1 });

// Auto-generate price list number
PriceListSchema.pre('save', async function (this: IPriceList) {
  if (this.isNew && !this.priceListNumber) {
    const count = await mongoose.model('PriceList').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.priceListNumber = `PL-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
});

export default mongoose.models.PriceList || mongoose.model<IPriceList>('PriceList', PriceListSchema);
