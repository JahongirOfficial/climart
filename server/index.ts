import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import connectDB from "./config/database";
import { createSampleData } from "./utils/sampleData";
import suppliersRouter from "./routes/suppliers";
import purchaseOrdersRouter from "./routes/purchase-orders";
import supplierInvoicesRouter from "./routes/supplier-invoices";
import receiptsRouter from "./routes/receipts";
import productsRouter from "./routes/products";
import servicesRouter from "./routes/services";
import supplierReturnsRouter from "./routes/supplier-returns";
import paymentsRouter from "./routes/payments";
import debtsRouter from "./routes/debts";
import dashboardRouter from "./routes/dashboard";
import customerInvoicesRouter from "./routes/customer-invoices";
import partnersRouter from "./routes/partners";
import customerOrdersRouter from "./routes/customer-orders";
import shipmentsRouter from "./routes/shipments";
import warehousesRouter from "./routes/warehouses";
import customerReturnsRouter from "./routes/customer-returns";
import returnsReportRouter from "./routes/returns-report";
import profitabilityRouter from "./routes/profitability";
import internalOrdersRouter from "./routes/internal-orders";
import writeoffsRouter from "./routes/writeoffs";
import warehouseExpenseRouter from "./routes/warehouse-expense";
import warehouseTransfersRouter from "./routes/warehouse-transfers";
import taxInvoicesRouter from "./routes/tax-invoices";
import customerDebtsRouter from "./routes/customer-debts";
import contractsRouter from "./routes/contracts";
import warehouseReceiptsRouter from "./routes/warehouse-receipts";
import inventoryRouter from "./routes/inventory";
import balanceRouter from "./routes/balance";
import turnoverRouter from "./routes/turnover";
import cashFlowRouter from "./routes/cash-flow";
import profitLossRouter from "./routes/profit-loss";
import mutualSettlementsRouter from "./routes/mutual-settlements";
import authRouter from "./routes/auth";
import employeesRouter from "./routes/employees";
import reportsRouter from "./routes/reports";
import telegramRouter from "./routes/telegram";

// Connect to MongoDB
connectDB().then(() => {
  // Create sample data after DB connection
  createSampleData();
});

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Error handling middleware for body parser errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error('Body parser error:', err.message);
      return res.status(400).json({ 
        message: 'Invalid JSON format', 
        error: err.message 
      });
    }
    next(err);
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes (public)
  app.use("/api/auth", authRouter);
  
  // Employee management routes (admin only)
  app.use("/api/employees", employeesRouter);

  // Initialize sample data endpoint
  app.post("/api/init-data", async (req, res) => {
    try {
      const force = req.body?.force === true;
      await createSampleData(force);
      res.json({ message: "Sample data created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error creating sample data", error });
    }
  });

  // Business API routes
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/purchase-orders", purchaseOrdersRouter);
  app.use("/api/supplier-invoices", supplierInvoicesRouter);
  app.use("/api/receipts", receiptsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/supplier-returns", supplierReturnsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/debts", debtsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/customer-invoices", customerInvoicesRouter);
  app.use("/api/partners", partnersRouter);
  app.use("/api/customer-orders", customerOrdersRouter);
  app.use("/api/shipments", shipmentsRouter);
  app.use("/api/warehouses", warehousesRouter);
  app.use("/api/customer-returns", customerReturnsRouter);
  app.use("/api/returns-report", returnsReportRouter);
  app.use("/api/profitability", profitabilityRouter);
  app.use("/api/internal-orders", internalOrdersRouter);
  app.use("/api/writeoffs", writeoffsRouter);
  app.use("/api/warehouse-expense", warehouseExpenseRouter);
  app.use("/api/warehouse-transfers", warehouseTransfersRouter);
  app.use("/api/tax-invoices", taxInvoicesRouter);
  app.use("/api/customer-debts", customerDebtsRouter);
  app.use("/api/contracts", contractsRouter);
  app.use("/api/telegram", telegramRouter);
  app.use("/api/warehouse-receipts", warehouseReceiptsRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/balance", balanceRouter);
  app.use("/api/turnover", turnoverRouter);
  app.use("/api/cash-flow", cashFlowRouter);
  app.use("/api/profit-loss", profitLossRouter);
  app.use("/api/mutual-settlements", mutualSettlementsRouter);
  app.use("/api/reports", reportsRouter);

  return app;
}
