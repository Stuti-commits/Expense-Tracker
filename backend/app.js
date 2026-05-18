import express from "express";
import cors from "cors";
import authRoutes from "./routes/authroutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors());         // Allow requests from frontend

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API running");
});

export default app;
