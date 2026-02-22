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
import priceListsRouter from "./routes/price-lists";
import auditRouter from "./routes/audit";
import tasksRouter from "./routes/tasks";
import salesFunnelRouter from "./routes/sales-funnel";
import unitEconomicsRouter from "./routes/unit-economics";
import currenciesRouter from "./routes/currencies";
import { authenticateToken } from "./middleware/auth";

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

  // Barcha business routelar uchun authentication middleware
  app.use("/api/suppliers", authenticateToken, suppliersRouter);
  app.use("/api/purchase-orders", authenticateToken, purchaseOrdersRouter);
  app.use("/api/supplier-invoices", authenticateToken, supplierInvoicesRouter);
  app.use("/api/receipts", authenticateToken, receiptsRouter);
  app.use("/api/products", authenticateToken, productsRouter);
  app.use("/api/services", authenticateToken, servicesRouter);
  app.use("/api/supplier-returns", authenticateToken, supplierReturnsRouter);
  app.use("/api/payments", authenticateToken, paymentsRouter);
  app.use("/api/debts", authenticateToken, debtsRouter);
  app.use("/api/dashboard", authenticateToken, dashboardRouter);
  app.use("/api/customer-invoices", authenticateToken, customerInvoicesRouter);
  app.use("/api/partners", authenticateToken, partnersRouter);
  app.use("/api/customer-orders", authenticateToken, customerOrdersRouter);
  app.use("/api/shipments", authenticateToken, shipmentsRouter);
  app.use("/api/warehouses", authenticateToken, warehousesRouter);
  app.use("/api/customer-returns", authenticateToken, customerReturnsRouter);
  app.use("/api/returns-report", authenticateToken, returnsReportRouter);
  app.use("/api/profitability", authenticateToken, profitabilityRouter);
  app.use("/api/internal-orders", authenticateToken, internalOrdersRouter);
  app.use("/api/writeoffs", authenticateToken, writeoffsRouter);
  app.use("/api/warehouse-expense", authenticateToken, warehouseExpenseRouter);
  app.use("/api/warehouse-transfers", authenticateToken, warehouseTransfersRouter);
  app.use("/api/tax-invoices", authenticateToken, taxInvoicesRouter);
  app.use("/api/customer-debts", authenticateToken, customerDebtsRouter);
  app.use("/api/contracts", authenticateToken, contractsRouter);
  app.use("/api/telegram", authenticateToken, telegramRouter);
  app.use("/api/warehouse-receipts", authenticateToken, warehouseReceiptsRouter);
  app.use("/api/inventory", authenticateToken, inventoryRouter);
  app.use("/api/balance", authenticateToken, balanceRouter);
  app.use("/api/turnover", authenticateToken, turnoverRouter);
  app.use("/api/cash-flow", authenticateToken, cashFlowRouter);
  app.use("/api/profit-loss", authenticateToken, profitLossRouter);
  app.use("/api/mutual-settlements", authenticateToken, mutualSettlementsRouter);
  app.use("/api/reports", authenticateToken, reportsRouter);
  app.use("/api/price-lists", authenticateToken, priceListsRouter);
  app.use("/api/audit", authenticateToken, auditRouter);
  app.use("/api/tasks", authenticateToken, tasksRouter);
  app.use("/api/sales-funnel", authenticateToken, salesFunnelRouter);
  app.use("/api/unit-economics", authenticateToken, unitEconomicsRouter);
  app.use("/api/currencies", authenticateToken, currenciesRouter);

  return app;
}
