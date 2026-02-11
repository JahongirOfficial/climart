import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouseExpense extends Document {
  warehouse: mongoose.Types.ObjectId;
  warehouseName: string;
  expenseDate: Date;
  category: 'rent' | 'utilities' | 'maintenance' | 'salaries' | 'equipment' | 'other';
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseExpenseSchema: Schema = new Schema(
  {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    warehouseName: {
      type: String,
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      enum: ['rent', 'utilities', 'maintenance', 'salaries', 'equipment', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

WarehouseExpenseSchema.index({ warehouse: 1 });
WarehouseExpenseSchema.index({ expenseDate: 1 });
WarehouseExpenseSchema.index({ category: 1 });

export default mongoose.models.WarehouseExpense || mongoose.model<IWarehouseExpense>('WarehouseExpense', WarehouseExpenseSchema);
