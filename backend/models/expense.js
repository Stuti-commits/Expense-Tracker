import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    month: {
      type: String,
      required: true
    },
    income: {
      type: Number,
      required: true
    },
    primaryExpenses: [
      {
        title: String,
        amount: Number
      }
    ],
    secondaryExpenses: [
      {
        title: String,
        amount: Number
      }
    ],
    investmentAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
