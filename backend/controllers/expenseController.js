import Expense from "../models/expense.js";

export const addMonthlyExpense = async (req, res) => {
  try {
    const { month, income, primaryExpenses, secondaryExpenses } = req.body;

    const primaryTotal = primaryExpenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const secondaryTotal = secondaryExpenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const investmentAmount = income - (primaryTotal + secondaryTotal);

    if (investmentAmount < 0) {
      return res.status(400).json({
        message: "Expenses exceed income"
      });
    }

    const expense = await Expense.create({
      user: req.user._id,
      month,
      income,
      primaryExpenses,
      secondaryExpenses,
      investmentAmount
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
