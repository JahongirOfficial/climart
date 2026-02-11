# Design Document: ERP Modules Implementation

## Overview

This design document outlines the technical architecture and implementation approach for four core ERP modules: Sales (Savdo), Warehouse (Ombor), Finance (Pul), and Contacts (Kontragentlar). The design follows established patterns from the existing purchase/procurement modules to ensure consistency, maintainability, and code reusability.

The implementation will leverage:
- **Frontend**: React 18 + TypeScript + React Router 6 + TailwindCSS + Radix UI
- **Backend**: Express + Mongoose (MongoDB)
- **State Management**: Custom hooks following the useApi pattern
- **UI Components**: Reusable modal components for data entry
- **Data Layer**: Mongoose models with TypeScript interfaces

Each module will be implemented sequentially, allowing for iterative testing and refinement before moving to the next module.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (SPA)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Sales    │  │ Warehouse  │  │  Finance   │  Contacts  │
│  │   Pages    │  │   Pages    │  │   Pages    │   Pages    │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───┬─────┘
│        │                │                │              │      │
│  ┌─────▼────────────────▼────────────────▼──────────────▼───┐ │
│  │              Custom Hooks (useApi Pattern)               │ │
│  └─────┬────────────────┬────────────────┬──────────────┬───┘ │
└────────┼────────────────┼────────────────┼──────────────┼─────┘
         │                │                │              │
    ┌────▼────────────────▼────────────────▼──────────────▼────┐
    │              Express REST API Layer                       │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
    │  │  Sales   │  │Warehouse │  │ Finance  │  │ Contacts │ │
    │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │ │
    │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
    └───────┼─────────────┼─────────────┼─────────────┼────────┘
            │             │             │             │
    ┌───────▼─────────────▼─────────────▼─────────────▼────────┐
    │              Mongoose Models (MongoDB)                    │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
    │  │Customer  │  │Warehouse │  │ Payment  │  │ Partner  │ │
    │  │Invoice   │  │Transfer  │  │          │  │          │ │
    │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
    └───────────────────────────────────────────────────────────┘
```

### Module Structure

Each module follows a consistent three-layer architecture:

1. **Presentation Layer** (React Components)
   - Page components in `client/pages/{module}/`
   - Modal components in `client/components/`
   - Shared UI components from `client/components/ui/`

2. **Data Management Layer** (Custom Hooks)
   - Custom hooks in `client/hooks/`
   - Follow the `useApi` pattern with loading, error, and refetch states
   - Handle API calls and state management

3. **API Layer** (Express Routes)
   - Route handlers in `server/routes/`
   - CRUD operations for each entity
   - Business logic and validation

4. **Data Layer** (Mongoose Models)
   - Model definitions in `server/models/`
   - Schema validation and relationships
   - Timestamps and indexing

### Routing Structure

Frontend routes will be added to `client/App.tsx`:

```typescript
// Sales Module
<Route path="/sales/customer-invoices" element={<CustomerInvoices />} />
<Route path="/sales/customer-orders" element={<CustomerOrders />} />
<Route path="/sales/profitability" element={<Profitability />} />
<Route path="/sales/returns" element={<Returns />} />
<Route path="/sales/returns-report" element={<ReturnsReport />} />
<Route path="/sales/shipments" element={<Shipments />} />

// Warehouse Module
<Route path="/warehouse/balance" element={<Balance />} />
<Route path="/warehouse/expense" element={<Expense />} />
<Route path="/warehouse/internal-order" element={<InternalOrder />} />
<Route path="/warehouse/receipt" element={<Receipt />} />
<Route path="/warehouse/transfer" element={<Transfer />} />
<Route path="/warehouse/turnover" element={<Turnover />} />
<Route path="/warehouse/warehouses" element={<Warehouses />} />
<Route path="/warehouse/writeoff" element={<Writeoff />} />

// Finance Module
<Route path="/finance/cash-flow" element={<CashFlow />} />
<Route path="/finance/mutual-settlements" element={<MutualSettlements />} />
<Route path="/finance/payments" element={<Payments />} />
<Route path="/finance/profit-loss" element={<ProfitLoss />} />

// Contacts Module
<Route path="/contacts/contracts" element={<Contracts />} />
<Route path="/contacts/partners" element={<Partners />} />
<Route path="/contacts/telegram" element={<Telegram />} />
```

## Components and Interfaces

### Sales Module Components

#### 1. CustomerInvoices Page

**Purpose**: Display and manage customer invoices

**Key Features**:
- List view with search and filter
- KPI cards showing total invoices, paid amount, outstanding amount, overdue count
- Create/edit invoice modal
- View invoice details modal
- Payment recording functionality

**Data Flow**:
```
CustomerInvoices → useCustomerInvoices hook → /api/customer-invoices → CustomerInvoice model
```

**UI Components**:
- `CustomerInvoiceModal`: Form for creating/editing invoices
- `ViewInvoiceModal`: Display invoice details and payment history
- `PaymentModal`: Record payments against invoices

#### 2. CustomerOrders Page

**Purpose**: Manage customer orders and track fulfillment

**Key Features**:
- Order list with status indicators
- KPI cards for pending, fulfilled, cancelled orders
- Create/edit order modal
- Status update functionality
- Link to create shipment from order

**Data Flow**:
```
CustomerOrders → useCustomerOrders hook → /api/customer-orders → CustomerOrder model
```

**UI Components**:
- `CustomerOrderModal`: Form for creating/editing orders
- `ViewOrderModal`: Display order details and status history

#### 3. Profitability Page

**Purpose**: Analyze sales profitability by product and customer

**Key Features**:
- Date range selector
- Product profitability table (product, units sold, revenue, cost, profit, margin)
- Customer profitability table (customer, purchases, profit, margin)
- Visual charts (profit trends, top products, top customers)
- Export functionality

**Data Flow**:
```
Profitability → useProfitability hook → /api/profitability → Aggregation queries
```

**Calculations**:
- Profit = Selling Price - Cost Price
- Margin = (Profit / Selling Price) × 100
- Aggregates from CustomerInvoice and Product data

#### 4. Returns Page

**Purpose**: Process customer returns and issue credits

**Key Features**:
- Returns list with search and filter
- KPI cards for total returns, return value, pending returns
- Create return modal with invoice selection
- Return reason selection
- Automatic inventory adjustment

**Data Flow**:
```
Returns → useCustomerReturns hook → /api/customer-returns → CustomerReturn model
```

**UI Components**:
- `CustomerReturnModal`: Form for creating returns with invoice lookup

#### 5. ReturnsReport Page

**Purpose**: Analyze return patterns and identify quality issues

**Key Features**:
- Date range selector
- Return statistics by product
- Return reason distribution chart
- Return rate calculations
- Product quality alerts

**Data Flow**:
```
ReturnsReport → useReturnsReport hook → /api/returns-report → Aggregation queries
```

**Calculations**:
- Return Rate = (Units Returned / Units Sold) × 100
- Aggregates from CustomerReturn and CustomerInvoice data

#### 6. Shipments Page

**Purpose**: Track product deliveries to customers

**Key Features**:
- Shipment list with status tracking
- KPI cards for pending, in transit, delivered shipments
- Create shipment from order
- Status update functionality
- Delivery confirmation

**Data Flow**:
```
Shipments → useShipments hook → /api/shipments → Shipment model
```

**UI Components**:
- `ShipmentModal`: Form for creating shipments from orders
- Status update buttons with confirmation

### Warehouse Module Components

#### 7. Balance Page

**Purpose**: View current inventory balances across warehouses

**Key Features**:
- Product balance table (product, SKU, warehouse, quantity, unit)
- Warehouse filter dropdown
- Search by product name or SKU
- Low stock highlighting
- Export to CSV/Excel

**Data Flow**:
```
Balance → useWarehouseBalance hook → /api/warehouse/balance → Product model (aggregated by warehouse)
```

**Calculations**:
- Aggregates product quantities by warehouse location
- Compares against minimum stock levels

#### 8. Expense Page

**Purpose**: Record and track warehouse operational expenses

**Key Features**:
- Expense list with category breakdown
- KPI cards for total expenses by category
- Create expense modal
- Date range filter
- Category-based filtering

**Data Flow**:
```
Expense → useWarehouseExpense hook → /api/warehouse/expense → WarehouseExpense model
```

**UI Components**:
- `WarehouseExpenseModal`: Form for recording expenses

#### 9. InternalOrder Page

**Purpose**: Create transfer requests between warehouses

**Key Features**:
- Internal order list with status
- KPI cards for pending, approved, completed orders
- Create order modal with source/destination warehouse selection
- Approval workflow
- Automatic transfer creation on approval

**Data Flow**:
```
InternalOrder → useInternalOrders hook → /api/warehouse/internal-orders → InternalOrder model
```

**UI Components**:
- `InternalOrderModal`: Form for creating transfer requests
- Approval buttons with validation

#### 10. Receipt Page

**Purpose**: Record incoming inventory from suppliers

**Key Features**:
- Receipt list with supplier and date
- KPI cards for total receipts, value
- Create receipt modal with purchase order lookup
- Warehouse location selection
- Automatic inventory increase

**Data Flow**:
```
Receipt → useReceipts hook → /api/receipts → Receipt model
```

**UI Components**:
- `ReceiptModal`: Form for recording receipts (already exists, may need updates)

#### 11. Transfer Page

**Purpose**: Execute product transfers between warehouses

**Key Features**:
- Transfer list with source/destination
- KPI cards for pending, completed transfers
- Create transfer modal
- Status tracking (pending, in transit, completed)
- Automatic inventory adjustment

**Data Flow**:
```
Transfer → useWarehouseTransfers hook → /api/warehouse/transfers → WarehouseTransfer model
```

**UI Components**:
- `WarehouseTransferModal`: Form for creating transfers

#### 12. Turnover Page

**Purpose**: Analyze inventory movement patterns

**Key Features**:
- Date range selector
- Turnover table (product, opening balance, receipts, shipments, transfers, closing balance)
- Turnover rate calculation
- Warehouse filter
- Visual charts for movement trends

**Data Flow**:
```
Turnover → useWarehouseTurnover hook → /api/warehouse/turnover → Aggregation queries
```

**Calculations**:
- Opening Balance = Previous period closing balance
- Closing Balance = Opening + Receipts - Shipments ± Transfers
- Turnover Rate = Units Sold / Average Inventory

#### 13. Warehouses Page

**Purpose**: Manage warehouse locations and information

**Key Features**:
- Warehouse list with details
- KPI cards for total warehouses, capacity utilization
- Create/edit warehouse modal
- Deactivate warehouse functionality
- View warehouse inventory value

**Data Flow**:
```
Warehouses → useWarehouses hook → /api/warehouses → Warehouse model
```

**UI Components**:
- `WarehouseModal`: Form for creating/editing warehouses

#### 14. Writeoff Page

**Purpose**: Record inventory write-offs for damaged/obsolete items

**Key Features**:
- Write-off list with reasons
- KPI cards for total write-offs, value
- Create write-off modal
- Reason selection (damaged, expired, obsolete, lost, other)
- Approval workflow for high-value write-offs
- Automatic inventory decrease

**Data Flow**:
```
Writeoff → useWriteoffs hook → /api/warehouse/writeoffs → Writeoff model
```

**UI Components**:
- `WriteoffModal`: Form for creating write-offs

### Finance Module Components

#### 15. CashFlow Page

**Purpose**: Monitor cash inflows and outflows

**Key Features**:
- Date range selector
- Cash flow statement (opening balance, inflows, outflows, closing balance)
- Category breakdown (operating, investing, financing)
- Visual charts for trends
- Export functionality

**Data Flow**:
```
CashFlow → useCashFlow hook → /api/finance/cash-flow → Aggregation queries
```

**Calculations**:
- Inflows: Customer payments, other income
- Outflows: Supplier payments, expenses, other costs
- Net Cash Flow = Inflows - Outflows

#### 16. MutualSettlements Page

**Purpose**: Track balances with customers and suppliers

**Key Features**:
- Partner account list (name, type, balance, last transaction)
- KPI cards for total receivables, total payables
- Filter by account type (customer/supplier)
- View detailed transaction history
- Overdue account highlighting

**Data Flow**:
```
MutualSettlements → useMutualSettlements hook → /api/finance/mutual-settlements → Aggregation queries
```

**Calculations**:
- Customer Balance = Total Invoiced - Total Paid
- Supplier Balance = Total Received - Total Paid

#### 17. Payments Page

**Purpose**: Record all financial transactions

**Key Features**:
- Payment list with type, partner, amount, method
- KPI cards for total received, total paid
- Create payment modal
- Payment type selection (received/paid)
- Payment method selection (cash, bank transfer, card, check)
- Link to invoices

**Data Flow**:
```
Payments → usePayments hook → /api/payments → Payment model
```

**UI Components**:
- `PaymentModal`: Form for recording payments (already exists, may need updates)

#### 18. ProfitLoss Page

**Purpose**: Display profit and loss statement

**Key Features**:
- Date range selector
- P&L statement (revenue, COGS, gross profit, expenses, operating profit, net profit)
- Margin calculations
- Period comparison
- Visual charts for trends
- Export functionality

**Data Flow**:
```
ProfitLoss → useProfitLoss hook → /api/finance/profit-loss → Aggregation queries
```

**Calculations**:
- Revenue = Total sales from customer invoices
- COGS = Cost of goods sold (from product cost prices)
- Gross Profit = Revenue - COGS
- Operating Profit = Gross Profit - Operating Expenses
- Net Profit = Operating Profit - Other Expenses + Other Income
- Margins = (Profit / Revenue) × 100

### Contacts Module Components

#### 19. Contracts Page

**Purpose**: Manage business contracts with partners

**Key Features**:
- Contract list with partner, dates, status
- KPI cards for active contracts, expiring soon
- Create/edit contract modal
- Document upload functionality
- Expiration alerts (30 days)
- Status management (draft, active, expired, terminated)

**Data Flow**:
```
Contracts → useContracts hook → /api/contracts → Contract model
```

**UI Components**:
- `ContractModal`: Form for creating/editing contracts

#### 20. Partners Page

**Purpose**: Manage customer and supplier information

**Key Features**:
- Partner list with type, contact info
- KPI cards for total customers, total suppliers
- Create/edit partner modal
- Partner type selection (customer, supplier, both)
- Search and filter
- View transaction history and balance

**Data Flow**:
```
Partners → usePartners hook → /api/partners → Partner model
```

**UI Components**:
- `PartnerModal`: Form for creating/editing partners

#### 21. Telegram Page

**Purpose**: Integrate Telegram messaging with partner communications

**Key Features**:
- Telegram connection settings
- Connected contacts list
- Authentication with Telegram API
- Send/receive messages
- Link Telegram accounts to partners
- Disconnect functionality

**Data Flow**:
```
Telegram → useTelegram hook → /api/telegram → TelegramConnection model
```

**UI Components**:
- `TelegramConnectModal`: Telegram authentication flow
- Message interface

## Data Models

### Sales Module Models

#### CustomerInvoice Model

```typescript
interface ICustomerInvoice extends Document {
  invoiceNumber: string;           // Auto-generated: CF-YYYY-NNN
  customer: ObjectId;               // Reference to Partner
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'unpaid' | 'partial' | 'paid';
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;              // For profit calculation
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: invoiceNumber (unique), customer, invoiceDate, status

#### CustomerOrder Model

```typescript
interface ICustomerOrder extends Document {
  orderNumber: string;              // Auto-generated: CO-YYYY-NNN
  customer: ObjectId;               // Reference to Partner
  customerName: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'pending' | 'fulfilled' | 'cancelled';
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: orderNumber (unique), customer, orderDate, status

#### CustomerReturn Model

```typescript
interface ICustomerReturn extends Document {
  returnNumber: string;             // Auto-generated: CR-YYYY-NNN
  customer: ObjectId;               // Reference to Partner
  customerName: string;
  invoice: ObjectId;                // Reference to CustomerInvoice
  invoiceNumber: string;
  returnDate: Date;
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
    price: number;
    total: number;
    reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  }>;
  totalAmount: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: returnNumber (unique), customer, invoice, returnDate

#### Shipment Model

```typescript
interface IShipment extends Document {
  shipmentNumber: string;           // Auto-generated: SH-YYYY-NNN
  customer: ObjectId;               // Reference to Partner
  customerName: string;
  order: ObjectId;                  // Reference to CustomerOrder
  orderNumber: string;
  shipmentDate: Date;
  warehouse: ObjectId;              // Reference to Warehouse
  warehouseName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
  }>;
  deliveryAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: shipmentNumber (unique), customer, order, shipmentDate, status

### Warehouse Module Models

#### Warehouse Model

```typescript
interface IWarehouse extends Document {
  name: string;
  code: string;                     // Short code: WH-001
  address: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number;                // Storage capacity
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: name (unique), code (unique), isActive

#### WarehouseExpense Model

```typescript
interface IWarehouseExpense extends Document {
  expenseNumber: string;            // Auto-generated: WE-YYYY-NNN
  warehouse: ObjectId;              // Reference to Warehouse
  warehouseName: string;
  expenseDate: Date;
  category: 'utilities' | 'maintenance' | 'labor' | 'supplies' | 'other';
  amount: number;
  description: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: expenseNumber (unique), warehouse, expenseDate, category

#### InternalOrder Model

```typescript
interface IInternalOrder extends Document {
  orderNumber: string;              // Auto-generated: IO-YYYY-NNN
  sourceWarehouse: ObjectId;        // Reference to Warehouse
  sourceWarehouseName: string;
  destinationWarehouse: ObjectId;   // Reference to Warehouse
  destinationWarehouseName: string;
  orderDate: Date;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
  }>;
  requestedBy?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: orderNumber (unique), sourceWarehouse, destinationWarehouse, status

#### WarehouseTransfer Model

```typescript
interface IWarehouseTransfer extends Document {
  transferNumber: string;           // Auto-generated: WT-YYYY-NNN
  sourceWarehouse: ObjectId;        // Reference to Warehouse
  sourceWarehouseName: string;
  destinationWarehouse: ObjectId;   // Reference to Warehouse
  destinationWarehouseName: string;
  transferDate: Date;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: transferNumber (unique), sourceWarehouse, destinationWarehouse, transferDate, status

#### Writeoff Model

```typescript
interface IWriteoff extends Document {
  writeoffNumber: string;           // Auto-generated: WO-YYYY-NNN
  warehouse: ObjectId;              // Reference to Warehouse
  warehouseName: string;
  writeoffDate: Date;
  items: Array<{
    product: ObjectId;              // Reference to Product
    productName: string;
    quantity: number;
    costPrice: number;
    total: number;
    reason: 'damaged' | 'expired' | 'obsolete' | 'lost' | 'other';
  }>;
  totalAmount: number;
  reason: 'damaged' | 'expired' | 'obsolete' | 'lost' | 'other';
  approvalRequired: boolean;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: writeoffNumber (unique), warehouse, writeoffDate

### Finance Module Models

Note: Finance module primarily uses aggregation queries on existing models (CustomerInvoice, Payment, SupplierInvoice, WarehouseExpense) rather than new models.

### Contacts Module Models

#### Partner Model

```typescript
interface IPartner extends Document {
  name: string;
  type: 'customer' | 'supplier' | 'both';
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;                   // INN or tax identification
  bankAccount?: string;
  telegramUsername?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: name (unique within type), type, isActive

#### Contract Model

```typescript
interface IContract extends Document {
  contractNumber: string;           // Auto-generated: CT-YYYY-NNN
  partner: ObjectId;                // Reference to Partner
  partnerName: string;
  contractType: string;             // e.g., "Sales Agreement", "Service Contract"
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  terms: string;                    // Contract terms and conditions
  documentUrl?: string;             // Uploaded contract document
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: contractNumber (unique), partner, status, endDate

#### TelegramConnection Model

```typescript
interface ITelegramConnection extends Document {
  partner: ObjectId;                // Reference to Partner
  partnerName: string;
  telegramUserId: string;
  telegramUsername: string;
  authToken: string;                // Encrypted token
  isActive: boolean;
  lastMessageDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: partner (unique), telegramUserId (unique), isActive

### Product Model Updates

The existing Product model needs to track warehouse locations:

```typescript
interface IProduct extends Document {
  name: string;
  sku?: string;
  category?: string;
  quantity: number;                 // Total quantity across all warehouses
  warehouseQuantities: Array<{      // NEW: Quantity by warehouse
    warehouse: ObjectId;
    warehouseName: string;
    quantity: number;
  }>;
  costPrice: number;
  sellingPrice: number;
  minQuantity?: number;
  unit?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Inventory Adjustment Properties (Consolidation)**:
- Properties 1.7 (invoice decreases inventory), 4.3 (return increases inventory), 6.3 (shipment decreases inventory), 10.3 (receipt increases inventory), 14.3 (write-off decreases inventory) all follow the same pattern: transaction affects inventory by exact quantities.
- **Consolidation**: Create a single comprehensive property for inventory adjustments that covers all transaction types.

**Uniqueness Properties (Pattern)**:
- Properties 1.4, 10.5, 11.6, 14.6, 17.5 all test uniqueness of document numbers.
- These are similar but apply to different entities, so they should remain separate but follow the same pattern.

**Warehouse Transfer Properties (Consolidation)**:
- Properties 9.6 (internal order completion) and 11.3 (transfer execution) both test that source decreases and destination increases by same quantities.
- **Consolidation**: These can be combined into a single property about warehouse transfers.

**Search/Filter Properties (Pattern)**:
- Properties 1.5, 2.4, 7.3, 7.4, 8.5, 12.6, 16.6, 19.6, 20.4 all test filtering/search functionality.
- These follow the same pattern but apply to different entities, so they should remain separate.

**Calculation Properties (Keep Separate)**:
- Properties 1.3 (invoice total), 3.2 (profit calculation), 8.4 (expense totals), 12.5 (turnover rate), 18.5 (profit margins) are all calculations but serve different purposes.
- These should remain separate as they validate different business logic.

### Correctness Properties

#### Property 1: Invoice Total Calculation
*For any* customer invoice with line items, the total amount should equal the sum of (quantity × price) for all line items.
**Validates: Requirements 1.3**

#### Property 2: Document Number Uniqueness
*For any* two documents of the same type (invoices, orders, returns, shipments, receipts, transfers, write-offs, payments, contracts), their document numbers should be different.
**Validates: Requirements 1.4, 10.5, 11.6, 14.6, 17.5**

#### Property 3: Inventory Adjustment Consistency
*For any* transaction that affects inventory (invoice creation, customer return, shipment, receipt, write-off, warehouse transfer), the inventory quantity change should exactly match the transaction quantities, with the correct sign (positive for additions, negative for reductions).
**Validates: Requirements 1.7, 4.3, 6.3, 10.3, 14.3**

#### Property 4: Search Result Filtering
*For any* search query with filter criteria (text search, date range, status, type), all returned results should match the specified criteria.
**Validates: Requirements 1.5, 2.4, 7.3, 7.4, 8.5, 12.6, 16.6, 19.6, 20.4**

#### Property 5: Order Fulfillment Creates Shipment
*For any* customer order that transitions to "fulfilled" status, a corresponding shipment record should exist with matching order reference and items.
**Validates: Requirements 2.3**

#### Property 6: Inventory Availability Validation
*For any* customer order or shipment, the requested quantities should not exceed the available inventory quantities at the time of creation.
**Validates: Requirements 2.5, 6.6**

#### Property 7: Profit Calculation
*For any* sales transaction, the profit should equal the selling price minus the cost price, and the profit margin should equal (profit / selling price) × 100.
**Validates: Requirements 3.2**

#### Property 8: Return Quantity Validation
*For any* customer return, the returned quantities for each product should not exceed the quantities on the original invoice.
**Validates: Requirements 4.6**

#### Property 9: Account Balance Update on Return
*For any* customer return, the customer's account balance should decrease by the total return amount.
**Validates: Requirements 4.4**

#### Property 10: Shipment Delivery Updates Order
*For any* shipment marked as "delivered", the related customer order status should be updated to "fulfilled".
**Validates: Requirements 6.5**

#### Property 11: Expense Total Calculation
*For any* expense summary filtered by category and time period, the total should equal the sum of all expense amounts matching those criteria.
**Validates: Requirements 8.4**

#### Property 12: Expense Amount Validation
*For any* warehouse expense record, the amount should be a positive number greater than zero.
**Validates: Requirements 8.6**

#### Property 13: Internal Order Creates Transfer
*For any* internal order that is approved, a corresponding warehouse transfer transaction should be created with matching source, destination, and items.
**Validates: Requirements 9.3**

#### Property 14: Transfer Source Validation
*For any* internal order or warehouse transfer, the source warehouse should have sufficient quantities of all requested products at the time of creation.
**Validates: Requirements 9.5, 11.4**

#### Property 15: Warehouse Transfer Inventory Balance
*For any* completed warehouse transfer, the source warehouse inventory should decrease and the destination warehouse inventory should increase by exactly the same quantities for each product.
**Validates: Requirements 9.6, 11.3**

#### Property 16: Receipt Updates Purchase Order
*For any* receipt that references a purchase order, the purchase order status should be updated to reflect the receipt (e.g., "received" or "partially received").
**Validates: Requirements 10.4**

#### Property 17: Turnover Calculation Completeness
*For any* product turnover calculation, the result should include all receipts, sales (shipments), transfers (in and out), and adjustments (write-offs) for the specified time period.
**Validates: Requirements 12.2**

#### Property 18: Turnover Rate Calculation
*For any* product with sales and inventory data, the turnover rate should equal (units sold / average inventory) where average inventory is (opening balance + closing balance) / 2.
**Validates: Requirements 12.5**

#### Property 19: Deactivated Warehouse Transaction Prevention
*For any* warehouse that is deactivated (isActive = false), new transactions (receipts, transfers, shipments, write-offs) should be prevented from being created for that warehouse.
**Validates: Requirements 13.4**

#### Property 20: Warehouse Name Uniqueness
*For any* two active warehouses, their names should be different (case-insensitive comparison).
**Validates: Requirements 13.5**

#### Property 21: Write-off Approval Requirement
*For any* write-off with a total amount exceeding the configured threshold, the approvalRequired flag should be set to true and the write-off should not be processed until approvedBy is set.
**Validates: Requirements 14.5**

#### Property 22: Cash Flow Calculation Completeness
*For any* cash flow calculation for a time period, the result should include all customer payments (inflows), supplier payments (outflows), and expense payments (outflows) within that period.
**Validates: Requirements 15.2**

#### Property 23: Payment Updates Account Balance
*For any* payment recorded (received from customer or paid to supplier), the partner's account balance should change by exactly the payment amount in the correct direction.
**Validates: Requirements 17.3**

#### Property 24: Payment Updates Invoice Status
*For any* payment linked to an invoice, the invoice's paidAmount should increase by the payment amount, and the invoice status should be updated based on the payment: "paid" if paidAmount equals totalAmount, "partial" if paidAmount is between 0 and totalAmount, "unpaid" if paidAmount is 0.
**Validates: Requirements 17.6**

#### Property 25: Profit and Loss Calculation Completeness
*For any* profit and loss statement for a time period, the calculation should include all sales revenue (from customer invoices), cost of goods sold (from invoice items' cost prices), operating expenses (from warehouse expenses), and other transactions within that period.
**Validates: Requirements 18.2**

#### Property 26: Profit Margin Calculations
*For any* profit and loss statement, the gross margin should equal (gross profit / revenue) × 100, the operating margin should equal (operating profit / revenue) × 100, and the net margin should equal (net profit / revenue) × 100.
**Validates: Requirements 18.5**

#### Property 27: Period Comparison Calculation
*For any* profit and loss statement with period comparison, the percentage change should equal ((current period value - previous period value) / previous period value) × 100 for each metric.
**Validates: Requirements 18.6**

#### Property 28: Contract Date Validation
*For any* contract, the end date should be after the start date (chronologically later).
**Validates: Requirements 19.5**

#### Property 29: Partner Name Uniqueness Within Type
*For any* two partners of the same type (both customers, both suppliers, or both "both"), their names should be different (case-insensitive comparison).
**Validates: Requirements 20.5**

## Error Handling

### Validation Errors

All API endpoints MUST validate input data and return appropriate error responses:

**HTTP Status Codes**:
- `400 Bad Request`: Invalid input data, validation failures
- `404 Not Found`: Resource not found
- `409 Conflict`: Uniqueness constraint violations, business rule violations
- `500 Internal Server Error`: Unexpected server errors

**Error Response Format**:
```typescript
{
  message: string;           // Human-readable error message
  error?: string;            // Technical error details (development only)
  field?: string;            // Field name for validation errors
}
```

### Common Validation Rules

1. **Required Fields**: All required fields must be present and non-empty
2. **Numeric Validation**: Quantities and amounts must be positive numbers
3. **Date Validation**: Dates must be valid and in correct chronological order
4. **Reference Validation**: Foreign key references must exist in the database
5. **Uniqueness Validation**: Unique fields (names, document numbers) must not duplicate existing values
6. **Business Rule Validation**: Custom business rules (e.g., inventory availability, return quantity limits)

### Frontend Error Handling

All custom hooks MUST implement error handling:

```typescript
const [error, setError] = useState<string | null>(null);

try {
  // API call
  setError(null);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

All page components MUST display error states:

```typescript
if (error) {
  return (
    <Layout>
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
```

### Database Transaction Handling

Operations that affect multiple collections MUST use transactions:

**Example: Invoice Creation with Inventory Update**
```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Create invoice
  const invoice = new CustomerInvoice({ ...data });
  await invoice.save({ session });
  
  // Update inventory for each item
  for (const item of invoice.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { quantity: -item.quantity } },
      { session }
    );
  }
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Operations Requiring Transactions**:
- Invoice creation (update inventory and customer balance)
- Customer return (update inventory and customer balance)
- Shipment creation (update inventory and order status)
- Warehouse transfer (update inventory in both warehouses)
- Payment recording (update invoice and partner balance)
- Write-off processing (update inventory)

## Testing Strategy

### Dual Testing Approach

The implementation MUST include both unit tests and property-based tests:

**Unit Tests**:
- Test specific examples and edge cases
- Test error conditions and validation
- Test integration points between components
- Focus on concrete scenarios

**Property-Based Tests**:
- Test universal properties across all inputs
- Use randomized input generation
- Verify correctness properties from the design document
- Run minimum 100 iterations per test

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Installation**:
```bash
pnpm add -D fast-check
```

**Test Structure**:
```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Feature: erp-modules-implementation', () => {
  it('Property 1: Invoice Total Calculation', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          quantity: fc.integer({ min: 1, max: 100 }),
          price: fc.integer({ min: 100, max: 100000 })
        }), { minLength: 1, maxLength: 10 }),
        (items) => {
          const calculatedTotal = items.reduce(
            (sum, item) => sum + (item.quantity * item.price),
            0
          );
          const invoice = { items, totalAmount: calculatedTotal };
          
          // Verify the property
          expect(invoice.totalAmount).toBe(
            invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Test Tagging**:
Each property test MUST include a comment referencing the design property:
```typescript
// Feature: erp-modules-implementation, Property 1: Invoice Total Calculation
```

### Unit Testing Patterns

**API Route Testing**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';

describe('Customer Invoices API', () => {
  let app: Express;
  
  beforeAll(() => {
    app = createServer();
  });
  
  it('should create a new invoice', async () => {
    const response = await request(app)
      .post('/api/customer-invoices')
      .send({
        customer: 'customer-id',
        customerName: 'Test Customer',
        items: [{ productName: 'Product 1', quantity: 2, price: 1000, total: 2000 }],
        totalAmount: 2000
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('invoiceNumber');
  });
  
  it('should reject invoice with negative quantity', async () => {
    const response = await request(app)
      .post('/api/customer-invoices')
      .send({
        customer: 'customer-id',
        items: [{ productName: 'Product 1', quantity: -1, price: 1000 }]
      });
    
    expect(response.status).toBe(400);
  });
});
```

**Custom Hook Testing**:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCustomerInvoices } from '../client/hooks/useCustomerInvoices';

describe('useCustomerInvoices', () => {
  it('should fetch invoices on mount', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ _id: '1', invoiceNumber: 'CF-2024-001' }])
      })
    );
    
    const { result } = renderHook(() => useCustomerInvoices());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].invoiceNumber).toBe('CF-2024-001');
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 70% code coverage
- **Property Test Coverage**: All 29 correctness properties implemented
- **Integration Test Coverage**: All critical user flows tested
- **Edge Case Coverage**: All validation rules and error conditions tested

### Testing Execution

**Run all tests**:
```bash
pnpm test
```

**Run tests in watch mode**:
```bash
pnpm test --watch
```

**Run tests with coverage**:
```bash
pnpm test --coverage
```

**Run property tests only**:
```bash
pnpm test --grep "Property"
```

## Implementation Sequence

The modules MUST be implemented in the following order:

### Phase 1: Sales Module (6 pages)
1. CustomerInvoices
2. CustomerOrders
3. Shipments
4. Returns
5. ReturnsReport
6. Profitability

**Rationale**: Sales module provides core revenue-generating functionality and establishes patterns for customer-facing operations.

### Phase 2: Warehouse Module (8 pages)
1. Warehouses (foundation for other warehouse features)
2. Balance
3. Receipt
4. Transfer
5. InternalOrder
6. Writeoff
7. Expense
8. Turnover

**Rationale**: Warehouse module builds on sales module by managing inventory that supports sales operations.

### Phase 3: Finance Module (4 pages)
1. Payments
2. MutualSettlements
3. CashFlow
4. ProfitLoss

**Rationale**: Finance module aggregates data from sales and warehouse modules to provide financial insights.

### Phase 4: Contacts Module (3 pages)
1. Partners
2. Contracts
3. Telegram

**Rationale**: Contacts module enhances existing customer/supplier management with additional relationship features.

## Performance Considerations

### Database Indexing

All models MUST include appropriate indexes for query performance:

```typescript
// Example: CustomerInvoice indexes
CustomerInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
CustomerInvoiceSchema.index({ customer: 1, invoiceDate: -1 });
CustomerInvoiceSchema.index({ status: 1 });
CustomerInvoiceSchema.index({ invoiceDate: -1 });
```

### Pagination

List endpoints MUST support pagination for large datasets:

```typescript
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Model.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Model.countDocuments()
  ]);
  
  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### Aggregation Optimization

Complex reports MUST use MongoDB aggregation pipelines:

```typescript
// Example: Profitability calculation
const profitability = await CustomerInvoice.aggregate([
  { $match: { invoiceDate: { $gte: startDate, $lte: endDate } } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.productName',
      unitsSold: { $sum: '$items.quantity' },
      revenue: { $sum: '$items.total' },
      cost: { $sum: { $multiply: ['$items.quantity', '$items.costPrice'] } }
    }
  },
  {
    $project: {
      productName: '$_id',
      unitsSold: 1,
      revenue: 1,
      cost: 1,
      profit: { $subtract: ['$revenue', '$cost'] },
      margin: {
        $multiply: [
          { $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] },
          100
        ]
      }
    }
  },
  { $sort: { profit: -1 } }
]);
```

### Frontend Optimization

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce search inputs (300ms)
- Cache API responses where appropriate
- Lazy load modal components

## Security Considerations

### Input Validation

All user inputs MUST be validated on both frontend and backend:

**Frontend Validation**:
- Required field checks
- Format validation (email, phone, dates)
- Range validation (positive numbers, date ranges)
- Real-time feedback to users

**Backend Validation**:
- Mongoose schema validation
- Custom validation middleware
- Sanitization of string inputs
- SQL injection prevention (using Mongoose)

### Authentication and Authorization

While not explicitly required in the current requirements, the system SHOULD be designed to support:

- User authentication (login/logout)
- Role-based access control (admin, manager, clerk)
- Permission checks on sensitive operations (approvals, deletions)
- Audit logging for critical operations

### Data Protection

- Sensitive data (tax IDs, bank accounts) should be encrypted at rest
- API tokens (Telegram) should be encrypted before storage
- HTTPS should be enforced in production
- CORS should be properly configured

## Deployment Considerations

### Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/erp-system

# Server
PORT=8080
NODE_ENV=production

# Telegram Integration (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_API_ID=your-api-id
TELEGRAM_API_HASH=your-api-hash

# Security (optional)
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Database Migration

For production deployment:

1. Backup existing database
2. Run migration scripts to add new collections
3. Create indexes for new collections
4. Verify data integrity
5. Test critical operations

### Monitoring

Production system should monitor:

- API response times
- Error rates
- Database query performance
- Inventory accuracy
- Financial calculation accuracy

## Documentation Requirements

Each module MUST include:

1. **README.md**: Overview of module functionality
2. **API Documentation**: Endpoint descriptions, request/response formats
3. **Component Documentation**: Props, usage examples
4. **Hook Documentation**: Parameters, return values, usage examples
5. **Model Documentation**: Schema fields, relationships, indexes

## Conclusion

This design document provides a comprehensive blueprint for implementing four core ERP modules following established architectural patterns. The sequential implementation approach ensures that each module builds upon the previous one, allowing for iterative testing and refinement. The dual testing strategy (unit tests + property-based tests) ensures both concrete correctness and universal property validation.
