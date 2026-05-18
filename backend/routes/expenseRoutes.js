import express from "express";
import protect from "../middleware/authMiddleware.js";
import { addMonthlyExpense } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", protect, addMonthlyExpense);

export default router;
