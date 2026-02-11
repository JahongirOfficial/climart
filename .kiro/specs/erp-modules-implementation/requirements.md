# Requirements Document: ERP Modules Implementation

## Introduction

This specification defines the requirements for implementing four core modules of an ERP system: Sales (Savdo), Warehouse (Ombor), Finance (Pul), and Contacts (Kontragentlar). The implementation will follow established patterns from the existing purchase/procurement modules, ensuring consistency in architecture, UI/UX, and data management approaches. Each module will be implemented sequentially to allow for iterative testing and refinement.

## Glossary

- **System**: The ERP web application built with React, TypeScript, Express, and SQLite
- **Module**: A functional area of the ERP system (Sales, Warehouse, Finance, Contacts)
- **Page**: A distinct UI view within a module that handles specific business operations
- **Modal**: A dialog component for data entry and editing operations
- **Hook**: A custom React hook following the useApi pattern for data management
- **Backend_Route**: An Express API endpoint that handles HTTP requests
- **Database_Model**: A Mongoose schema defining data structure in SQLite
- **User**: A person interacting with the ERP system through the web interface
- **Customer**: A business entity that purchases products or services
- **Partner**: A business entity in the contacts system (can be customer or supplier)
- **Warehouse**: A physical or logical location for storing inventory
- **Transaction**: A business operation that affects inventory, finances, or records
- **Invoice**: A document requesting payment for goods or services delivered
- **Order**: A request for goods or services to be delivered
- **Payment**: A financial transaction recording money received or paid
- **Balance**: The current quantity of products in a warehouse
- **Turnover**: The movement of products in and out of warehouses over time

## Requirements

### Requirement 1: Sales Module - Customer Invoices

**User Story:** As a sales manager, I want to create and manage customer invoices, so that I can track sales transactions and amounts owed by customers.

#### Acceptance Criteria

1. WHEN a user navigates to the Customer Invoices page, THE System SHALL display a list of all customer invoices with invoice number, customer name, date, total amount, paid amount, and status
2. WHEN a user clicks "Create Invoice", THE System SHALL open a modal with fields for customer selection, invoice date, line items (product, quantity, price), and notes
3. WHEN a user adds line items to an invoice, THE System SHALL automatically calculate the total amount based on quantity and price
4. WHEN a user saves a new invoice, THE System SHALL generate a unique invoice number, store the invoice in the database, and update the customer's account balance
5. WHEN a user searches for invoices, THE System SHALL filter results by invoice number, customer name, or date range
6. WHEN a user views invoice details, THE System SHALL display all line items, payment history, and remaining balance
7. WHEN an invoice is created, THE System SHALL reduce product quantities in the warehouse inventory

### Requirement 2: Sales Module - Customer Orders

**User Story:** As a sales representative, I want to manage customer orders, so that I can track order fulfillment and delivery status.

#### Acceptance Criteria

1. WHEN a user navigates to the Customer Orders page, THE System SHALL display all orders with order number, customer name, order date, status, and total amount
2. WHEN a user creates a new order, THE System SHALL allow selection of customer, products, quantities, and delivery date
3. WHEN an order status changes to "fulfilled", THE System SHALL automatically create a shipment record
4. WHEN a user searches orders, THE System SHALL filter by order number, customer name, status, or date range
5. WHEN an order is saved, THE System SHALL validate that requested quantities are available in inventory
6. WHEN a user views order details, THE System SHALL show all line items, current status, and fulfillment history

### Requirement 3: Sales Module - Profitability Analysis

**User Story:** As a business owner, I want to analyze sales profitability, so that I can understand which products and customers generate the most profit.

#### Acceptance Criteria

1. WHEN a user navigates to the Profitability page, THE System SHALL display profit metrics by product, customer, and time period
2. WHEN calculating profitability, THE System SHALL compute profit as selling price minus cost price for each transaction
3. WHEN a user selects a date range, THE System SHALL recalculate and display profitability metrics for that period
4. WHEN displaying product profitability, THE System SHALL show product name, units sold, revenue, cost, and profit margin
5. WHEN displaying customer profitability, THE System SHALL show customer name, total purchases, total profit, and profit percentage
6. THE System SHALL provide visual charts showing profit trends over time

### Requirement 4: Sales Module - Returns Management

**User Story:** As a sales manager, I want to process customer returns, so that I can handle product returns and issue refunds or credits.

#### Acceptance Criteria

1. WHEN a user navigates to the Returns page, THE System SHALL display all customer return records with return number, customer name, date, and total amount
2. WHEN a user creates a return, THE System SHALL allow selection of the original invoice and products being returned
3. WHEN a return is processed, THE System SHALL increase product quantities in warehouse inventory
4. WHEN a return is saved, THE System SHALL create a credit note and update the customer's account balance
5. WHEN a user specifies a return reason, THE System SHALL record the reason (defective, wrong item, customer request, other)
6. THE System SHALL prevent returns for quantities exceeding the original invoice quantities

### Requirement 5: Sales Module - Returns Report

**User Story:** As a quality manager, I want to view return statistics, so that I can identify product quality issues and return patterns.

#### Acceptance Criteria

1. WHEN a user navigates to the Returns Report page, THE System SHALL display return statistics by product, reason, and time period
2. WHEN displaying return metrics, THE System SHALL show total returns, return rate percentage, and most common return reasons
3. WHEN a user filters by date range, THE System SHALL recalculate statistics for the selected period
4. WHEN displaying product return rates, THE System SHALL show product name, units sold, units returned, and return percentage
5. THE System SHALL provide visual charts showing return trends and reason distribution
6. WHEN a user clicks on a product in the report, THE System SHALL display detailed return history for that product

### Requirement 6: Sales Module - Shipments

**User Story:** As a logistics coordinator, I want to manage product shipments, so that I can track deliveries to customers.

#### Acceptance Criteria

1. WHEN a user navigates to the Shipments page, THE System SHALL display all shipments with shipment number, customer name, order number, shipment date, and status
2. WHEN a user creates a shipment, THE System SHALL allow selection of customer order and products to ship
3. WHEN a shipment is created, THE System SHALL reduce product quantities from the designated warehouse
4. WHEN a user updates shipment status, THE System SHALL record status changes (pending, in transit, delivered, cancelled)
5. WHEN a shipment is marked as delivered, THE System SHALL update the related customer order status to fulfilled
6. THE System SHALL validate that shipment quantities do not exceed order quantities

### Requirement 7: Warehouse Module - Balance

**User Story:** As a warehouse manager, I want to view current inventory balances, so that I can monitor stock levels across all warehouses.

#### Acceptance Criteria

1. WHEN a user navigates to the Balance page, THE System SHALL display current quantities for all products across all warehouses
2. WHEN displaying balance information, THE System SHALL show product name, SKU, warehouse location, current quantity, and unit
3. WHEN a user filters by warehouse, THE System SHALL display only products in the selected warehouse
4. WHEN a user searches for products, THE System SHALL filter results by product name or SKU
5. THE System SHALL highlight products with quantities below minimum stock levels
6. WHEN a user exports balance data, THE System SHALL generate a report in CSV or Excel format

### Requirement 8: Warehouse Module - Expense

**User Story:** As a warehouse manager, I want to record warehouse expenses, so that I can track operational costs.

#### Acceptance Criteria

1. WHEN a user navigates to the Expense page, THE System SHALL display all warehouse expense records with date, category, amount, and description
2. WHEN a user creates an expense record, THE System SHALL allow input of expense date, category, amount, warehouse, and notes
3. WHEN a user selects an expense category, THE System SHALL provide predefined categories (utilities, maintenance, labor, supplies, other)
4. WHEN displaying expense summaries, THE System SHALL calculate total expenses by category and time period
5. WHEN a user filters by date range, THE System SHALL display expenses for the selected period
6. THE System SHALL validate that expense amounts are positive numbers

### Requirement 9: Warehouse Module - Internal Order

**User Story:** As a warehouse supervisor, I want to create internal transfer orders, so that I can request product movements between warehouses.

#### Acceptance Criteria

1. WHEN a user navigates to the Internal Order page, THE System SHALL display all internal orders with order number, source warehouse, destination warehouse, date, and status
2. WHEN a user creates an internal order, THE System SHALL allow selection of source warehouse, destination warehouse, products, and quantities
3. WHEN an internal order is approved, THE System SHALL create a transfer transaction
4. WHEN a user updates order status, THE System SHALL record status changes (pending, approved, in transit, completed, cancelled)
5. THE System SHALL validate that source warehouse has sufficient quantities for the requested transfer
6. WHEN an internal order is completed, THE System SHALL update inventory balances in both warehouses

### Requirement 10: Warehouse Module - Receipt

**User Story:** As a warehouse clerk, I want to record product receipts, so that I can track incoming inventory from suppliers.

#### Acceptance Criteria

1. WHEN a user navigates to the Receipt page, THE System SHALL display all receipt records with receipt number, supplier name, date, and total amount
2. WHEN a user creates a receipt, THE System SHALL allow selection of supplier, purchase order, products received, quantities, and warehouse location
3. WHEN a receipt is saved, THE System SHALL increase product quantities in the specified warehouse
4. WHEN a receipt references a purchase order, THE System SHALL update the purchase order status
5. THE System SHALL generate a unique receipt number for each new receipt
6. WHEN a user views receipt details, THE System SHALL display all received items with quantities and prices

### Requirement 11: Warehouse Module - Transfer

**User Story:** As a warehouse operator, I want to transfer products between warehouses, so that I can redistribute inventory based on demand.

#### Acceptance Criteria

1. WHEN a user navigates to the Transfer page, THE System SHALL display all transfer records with transfer number, source warehouse, destination warehouse, date, and status
2. WHEN a user creates a transfer, THE System SHALL allow selection of source warehouse, destination warehouse, products, and quantities
3. WHEN a transfer is executed, THE System SHALL decrease quantities in source warehouse and increase quantities in destination warehouse
4. THE System SHALL validate that source warehouse has sufficient quantities before allowing transfer
5. WHEN a user updates transfer status, THE System SHALL record status changes (pending, in transit, completed, cancelled)
6. THE System SHALL generate a unique transfer number for each new transfer

### Requirement 12: Warehouse Module - Turnover

**User Story:** As an inventory analyst, I want to view product turnover reports, so that I can analyze inventory movement patterns.

#### Acceptance Criteria

1. WHEN a user navigates to the Turnover page, THE System SHALL display product movement data with incoming quantities, outgoing quantities, and net change
2. WHEN calculating turnover, THE System SHALL include receipts, sales, transfers, and adjustments
3. WHEN a user selects a date range, THE System SHALL calculate turnover metrics for that period
4. WHEN displaying turnover data, THE System SHALL show product name, opening balance, receipts, shipments, transfers, and closing balance
5. THE System SHALL calculate turnover rate as (units sold / average inventory) for each product
6. WHEN a user filters by warehouse, THE System SHALL display turnover data for the selected warehouse only

### Requirement 13: Warehouse Module - Warehouses Management

**User Story:** As a system administrator, I want to manage warehouse locations, so that I can maintain accurate warehouse information.

#### Acceptance Criteria

1. WHEN a user navigates to the Warehouses page, THE System SHALL display all warehouse locations with name, address, capacity, and status
2. WHEN a user creates a new warehouse, THE System SHALL allow input of warehouse name, address, contact person, phone, and capacity
3. WHEN a user edits warehouse information, THE System SHALL update the warehouse record and preserve the change history
4. WHEN a user deactivates a warehouse, THE System SHALL prevent new transactions but preserve historical data
5. THE System SHALL validate that warehouse names are unique
6. WHEN displaying warehouse details, THE System SHALL show current inventory value and utilization percentage

### Requirement 14: Warehouse Module - Write-off

**User Story:** As a warehouse manager, I want to write off damaged or obsolete inventory, so that I can maintain accurate inventory records.

#### Acceptance Criteria

1. WHEN a user navigates to the Write-off page, THE System SHALL display all write-off records with write-off number, date, products, quantities, and reason
2. WHEN a user creates a write-off, THE System SHALL allow selection of warehouse, products, quantities, reason, and notes
3. WHEN a write-off is processed, THE System SHALL decrease product quantities in the specified warehouse
4. WHEN a user selects a write-off reason, THE System SHALL provide predefined reasons (damaged, expired, obsolete, lost, other)
5. THE System SHALL require approval for write-offs exceeding a specified value threshold
6. THE System SHALL generate a unique write-off number for each new write-off record

### Requirement 15: Finance Module - Cash Flow

**User Story:** As a financial controller, I want to view cash flow reports, so that I can monitor money coming in and going out of the business.

#### Acceptance Criteria

1. WHEN a user navigates to the Cash Flow page, THE System SHALL display cash inflows and outflows by category and time period
2. WHEN calculating cash flow, THE System SHALL include customer payments, supplier payments, expenses, and other transactions
3. WHEN a user selects a date range, THE System SHALL recalculate cash flow for that period
4. WHEN displaying cash flow data, THE System SHALL show opening balance, total inflows, total outflows, and closing balance
5. THE System SHALL categorize cash flows (operating activities, investing activities, financing activities)
6. THE System SHALL provide visual charts showing cash flow trends over time

### Requirement 16: Finance Module - Mutual Settlements

**User Story:** As an accountant, I want to view mutual settlement accounts, so that I can track balances with customers and suppliers.

#### Acceptance Criteria

1. WHEN a user navigates to the Mutual Settlements page, THE System SHALL display all partner accounts with partner name, account type, balance, and last transaction date
2. WHEN displaying customer accounts, THE System SHALL show total invoiced, total paid, and remaining receivables
3. WHEN displaying supplier accounts, THE System SHALL show total received, total paid, and remaining payables
4. WHEN a user clicks on a partner account, THE System SHALL display detailed transaction history
5. THE System SHALL highlight overdue accounts based on payment terms
6. WHEN a user filters by account type, THE System SHALL display only customer accounts or supplier accounts

### Requirement 17: Finance Module - Payments

**User Story:** As a cashier, I want to record payments, so that I can track all financial transactions.

#### Acceptance Criteria

1. WHEN a user navigates to the Payments page, THE System SHALL display all payment records with payment number, date, partner name, amount, and payment method
2. WHEN a user creates a payment, THE System SHALL allow selection of payment type (received from customer or paid to supplier), partner, amount, payment method, and notes
3. WHEN a payment is recorded, THE System SHALL update the partner's account balance
4. WHEN a user selects payment method, THE System SHALL provide options (cash, bank transfer, card, check)
5. THE System SHALL generate a unique payment number for each new payment
6. WHEN a payment is linked to an invoice, THE System SHALL update the invoice payment status

### Requirement 18: Finance Module - Profit and Loss

**User Story:** As a business owner, I want to view profit and loss statements, so that I can understand business financial performance.

#### Acceptance Criteria

1. WHEN a user navigates to the Profit and Loss page, THE System SHALL display revenue, costs, expenses, and net profit for a selected period
2. WHEN calculating profit and loss, THE System SHALL include sales revenue, cost of goods sold, operating expenses, and other income/expenses
3. WHEN a user selects a date range, THE System SHALL recalculate the profit and loss statement for that period
4. WHEN displaying the statement, THE System SHALL show revenue categories, expense categories, gross profit, operating profit, and net profit
5. THE System SHALL calculate profit margins (gross margin, operating margin, net margin)
6. THE System SHALL provide comparison with previous periods showing percentage changes

### Requirement 19: Contacts Module - Contracts

**User Story:** As a contracts manager, I want to manage business contracts, so that I can track agreements with partners.

#### Acceptance Criteria

1. WHEN a user navigates to the Contracts page, THE System SHALL display all contracts with contract number, partner name, start date, end date, and status
2. WHEN a user creates a contract, THE System SHALL allow input of partner, contract type, start date, end date, terms, and document upload
3. WHEN a contract expiration date approaches, THE System SHALL highlight contracts expiring within 30 days
4. WHEN a user updates contract status, THE System SHALL record status changes (draft, active, expired, terminated)
5. THE System SHALL validate that end date is after start date
6. WHEN a user searches contracts, THE System SHALL filter by partner name, contract number, or status

### Requirement 20: Contacts Module - Partners

**User Story:** As a relationship manager, I want to manage partner information, so that I can maintain accurate contact details for customers and suppliers.

#### Acceptance Criteria

1. WHEN a user navigates to the Partners page, THE System SHALL display all partners with name, type, contact person, phone, and email
2. WHEN a user creates a partner, THE System SHALL allow input of partner type (customer, supplier, both), name, contact person, phone, email, address, tax ID, and notes
3. WHEN a user edits partner information, THE System SHALL update the partner record and preserve change history
4. WHEN a user searches partners, THE System SHALL filter by name, type, phone, or email
5. THE System SHALL validate that partner names are unique within the same type
6. WHEN displaying partner details, THE System SHALL show transaction history and current account balance

### Requirement 21: Contacts Module - Telegram Integration

**User Story:** As a sales representative, I want to integrate with Telegram, so that I can communicate with customers through messaging.

#### Acceptance Criteria

1. WHEN a user navigates to the Telegram page, THE System SHALL display Telegram integration settings and connected contacts
2. WHEN a user connects a Telegram account, THE System SHALL authenticate using Telegram API and store the connection token
3. WHEN a partner has a Telegram account linked, THE System SHALL display the Telegram username in partner details
4. WHEN a user sends a message through the system, THE System SHALL deliver the message via Telegram API
5. THE System SHALL receive and display incoming messages from Telegram contacts
6. WHEN a user disconnects Telegram integration, THE System SHALL revoke the authentication token and clear connection data

## Implementation Notes

### Architectural Consistency

All modules MUST follow the established patterns from the purchase/procurement modules:

- **Frontend Structure**: Each page component in `client/pages/{module}/` directory
- **Custom Hooks**: Data management hooks in `client/hooks/` following the `useApi` pattern
- **Modal Components**: Reusable modal components in `client/components/` for data entry
- **Backend Routes**: Express routes in `server/routes/` directory
- **Database Models**: Mongoose models in `server/models/` directory
- **Shared Types**: TypeScript interfaces in `shared/api.ts`

### UI/UX Patterns

- Use TailwindCSS for styling with the existing design system
- Implement Radix UI components for consistent UI elements
- Follow the card-based layout with KPI metrics at the top
- Include search and filter functionality on list pages
- Use loading states with Loader2 icon during data fetching
- Display error states with AlertTriangle icon and error messages
- Implement pagination for large data sets

### Data Management

- All API calls through custom hooks with loading, error, and refetch states
- Optimistic UI updates where appropriate
- Form validation before submission
- Automatic number generation for document numbers (invoices, orders, etc.)
- Date formatting using Uzbek locale (uz-UZ)
- Currency formatting with "so'm" suffix

### Sequential Implementation

Modules MUST be implemented in the specified order:
1. Sales (Savdo) - 6 pages
2. Warehouse (Ombor) - 8 pages
3. Finance (Pul) - 4 pages
4. Contacts (Kontragentlar) - 3 pages

This order ensures that dependencies are implemented before dependent modules.
