import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrency extends Document {
  code: string;          // ISO 4217: 'USD', 'EUR', 'RUB', 'UZS'
  name: string;          // "AQSH dollari"
  symbol: string;        // "$", "€", "₽", "so'm"
  nominal: number;       // Usually 1
  exchangeRate: number;  // How much 1 unit costs in UZS (for UZS itself: 1)
  isBase: boolean;       // true only for UZS
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CurrencySchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    nominal: {
      type: Number,
      default: 1,
    },
    exchangeRate: {
      type: Number,
      required: true,
      min: 0,
    },
    isBase: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CurrencySchema.index({ isActive: 1 });

export default mongoose.models.Currency || mongoose.model<ICurrency>('Currency', CurrencySchema);
