# Implementation Plan: ERP Modules Implementation

## Overview

This implementation plan breaks down the development of four core ERP modules (Sales, Warehouse, Finance, Contacts) into discrete, manageable tasks. The implementation follows a sequential approach, completing one module before moving to the next. Each task builds incrementally on previous work, with regular checkpoints to ensure quality and correctness.

The implementation uses TypeScript throughout, following established patterns from the existing purchase/procurement modules. All tasks reference specific requirements from the requirements document for traceability.

## Tasks

### Phase 1: Sales Module Foundation

- [x] 1. Set up Sales module data models and shared types
  - [x] 1.1 Create CustomerInvoice model in server/models/CustomerInvoice.ts
    - Define schema with invoiceNumber, customer, items array, totalAmount, paidAmount, status
    - Add indexes for invoiceNumber (unique), customer, invoiceDate, status
    - Implement auto-increment invoice number generation
    - _Requirements: 1.1, 1.4_
  
  - [x] 1.2 Create CustomerOrder model in server/models/CustomerOrder.ts
    - Define schema with orderNumber, customer, items array, status, deliveryDate
    - Add indexes for orderNumber (unique), customer, orderDate, status
    - _Requirements: 2.1, 2.2_
  
  - [x] 1.3 Create CustomerReturn model in server/models/CustomerReturn.ts
    - Define schema with returnNumber, customer, invoice reference, items, reason
    - Add indexes for returnNumber (unique), customer, invoice, returnDate
    - _Requirements: 4.1, 4.2_
  
  - [x] 1.4 Create Shipment model in server/models/Shipment.ts
    - Define schema with shipmentNumber, customer, order reference, warehouse, status
    - Add indexes for shipmentNumber (unique), customer, order, shipmentDate
    - _Requirements: 6.1, 6.2_
  
  - [x] 1.5 Add Sales module types to shared/api.ts
    - Export CustomerInvoice, CustomerOrder, CustomerReturn, Shipment interfaces
    - Include item interfaces for each document type
    - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [x] 2. Implement Customer Invoices backend API
  - [x] 2.1 Create customer-invoices route in server/routes/customer-invoices.ts
    - Implement GET / (list all invoices with population)
    - Implement GET /:id (get single invoice)
    - Implement POST / (create invoice with inventory update)
    - Implement PUT /:id (update invoice)
    - Implement DELETE /:id (delete invoice)
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 2.2 Implement invoice creation with transaction
    - Use Mongoose transaction to create invoice and update inventory
    - Validate inventory availability before creation
    - Update customer account balance
    - _Requirements: 1.4, 1.7_
  
  - [x] 2.3 Write property test for invoice total calculation
    - **Property 1: Invoice Total Calculation**
    - **Validates: Requirements 1.3**
  
  - [x] 2.4 Write property test for document number uniqueness
    - **Property 2: Document Number Uniqueness**
    - **Validates: Requirements 1.4**
  
  - [x] 2.5 Write property test for inventory adjustment
    - **Property 3: Inventory Adjustment Consistency**
    - **Validates: Requirements 1.7**
  
  - [x] 2.6 Register customer-invoices routes in server/index.ts
    - Import and mount router at /api/customer-invoices
    - _Requirements: 1.1_

- [x] 3. Implement Customer Invoices frontend
  - [x] 3.1 Create useCustomerInvoices hook in client/hooks/useCustomerInvoices.ts
    - Implement fetch, create, update, delete functions
    - Add loading, error, and refetch states
    - Follow useApi pattern from existing hooks
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Create CustomerInvoiceModal component in client/components/CustomerInvoiceModal.tsx
    - Form with customer selection, invoice date, line items, notes
    - Automatic total calculation
    - Product selection with price lookup
    - _Requirements: 1.2, 1.3_
  
  - [x] 3.3 Create ViewInvoiceModal component in client/components/ViewInvoiceModal.tsx
    - Display invoice details, line items, payment history
    - Show remaining balance
    - _Requirements: 1.6_
  
  - [x] 3.4 Create CustomerInvoices page in client/pages/sales/CustomerInvoices.tsx
    - List view with search and filter
    - KPI cards (total invoices, paid amount, outstanding, overdue)
    - Create/edit/view invoice functionality
    - Payment recording
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  
  - [x] 3.5 Write unit tests for CustomerInvoices page
    - Test invoice creation flow
    - Test search and filter functionality
    - Test error handling
    - _Requirements: 1.1, 1.5_
  
  - [x] 3.6 Add CustomerInvoices route to client/App.tsx
    - Add route at /sales/customer-invoices
    - _Requirements: 1.1_

- [x] 4. Implement Customer Orders backend and frontend
  - [x] 4.1 Create customer-orders route in server/routes/customer-orders.ts
    - Implement CRUD operations
    - Add inventory validation on order creation
    - Implement status update endpoint
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 4.2 Write property test for inventory availability validation
    - **Property 6: Inventory Availability Validation**
    - **Validates: Requirements 2.5**
  
  - [x] 4.3 Create useCustomerOrders hook in client/hooks/useCustomerOrders.ts
    - Implement fetch, create, update, delete functions
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.4 Create CustomerOrderModal component in client/components/CustomerOrderModal.tsx
    - Form with customer, products, quantities, delivery date
    - Inventory availability check
    - _Requirements: 2.2, 2.5_
  
  - [x] 4.5 Create CustomerOrders page in client/pages/sales/CustomerOrders.tsx
    - List view with status indicators
    - KPI cards (pending, fulfilled, cancelled)
    - Create/edit order functionality
    - Status update buttons
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 4.6 Add CustomerOrders route to client/App.tsx
    - Add route at /sales/customer-orders
    - _Requirements: 2.1_


- [ ] 5. Implement Shipments backend and frontend
  - [x] 5.1 Create shipments route in server/routes/shipments.ts
    - Implement CRUD operations
    - Add inventory update on shipment creation
    - Implement status update with order fulfillment logic
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 5.2 Write property test for shipment delivery updates order
    - **Property 10: Shipment Delivery Updates Order**
    - **Validates: Requirements 6.5**
  
  - [x] 5.3 Write property test for shipment quantity validation
    - **Property 6: Inventory Availability Validation** (covers shipments too)
    - **Validates: Requirements 6.6**
  
  - [x] 5.4 Create useShipments hook in client/hooks/useShipments.ts
    - Implement fetch, create, update functions
    - _Requirements: 6.1, 6.2_
  
  - [x] 5.5 Create ShipmentModal component in client/components/ShipmentModal.tsx
    - Form with order selection, products, warehouse
    - Quantity validation against order
    - _Requirements: 6.2, 6.6_
  
  - [x] 5.6 Create Shipments page in client/pages/sales/Shipments.tsx
    - List view with status tracking
    - KPI cards (pending, in transit, delivered)
    - Create shipment from order
    - Status update functionality
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  
  - [x] 5.7 Add Shipments route to client/App.tsx
    - Add route at /sales/shipments
    - _Requirements: 6.1_

- [ ] 6. Checkpoint - Sales Module Core Features
  - Ensure all tests pass for invoices, orders, and shipments
  - Verify inventory updates work correctly
  - Test order fulfillment workflow end-to-end
  - Ask the user if questions arise


- [ ] 7. Implement Customer Returns backend and frontend
  - [ ] 7.1 Create customer-returns route in server/routes/customer-returns.ts
    - Implement CRUD operations
    - Add return quantity validation against invoice
    - Implement inventory increase on return processing
    - Update customer account balance
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_
  
  - [ ] 7.2 Write property test for return quantity validation
    - **Property 8: Return Quantity Validation**
    - **Validates: Requirements 4.6**
  
  - [ ] 7.3 Write property test for account balance update on return
    - **Property 9: Account Balance Update on Return**
    - **Validates: Requirements 4.4**
  
  - [ ] 7.4 Create useCustomerReturns hook in client/hooks/useCustomerReturns.ts
    - Implement fetch, create functions
    - _Requirements: 4.1, 4.2_
  
  - [ ] 7.5 Create CustomerReturnModal component in client/components/CustomerReturnModal.tsx
    - Form with invoice lookup, product selection, reason
    - Quantity validation against original invoice
    - _Requirements: 4.2, 4.5, 4.6_
  
  - [ ] 7.6 Create Returns page in client/pages/sales/Returns.tsx
    - List view with search and filter
    - KPI cards (total returns, return value, pending)
    - Create return functionality
    - _Requirements: 4.1, 4.2_
  
  - [ ] 7.7 Add Returns route to client/App.tsx
    - Add route at /sales/returns
    - _Requirements: 4.1_


- [ ] 8. Implement Returns Report and Profitability pages
  - [ ] 8.1 Create returns-report route in server/routes/returns-report.ts
    - Implement aggregation query for return statistics
    - Calculate return rates by product
    - Group by return reason
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 8.2 Create useReturnsReport hook in client/hooks/useReturnsReport.ts
    - Implement fetch with date range filter
    - _Requirements: 5.1, 5.3_
  
  - [ ] 8.3 Create ReturnsReport page in client/pages/sales/ReturnsReport.tsx
    - Date range selector
    - Return statistics tables
    - Visual charts for trends and reason distribution
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 8.4 Create profitability route in server/routes/profitability.ts
    - Implement aggregation query for profit by product
    - Implement aggregation query for profit by customer
    - Calculate profit margins
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ] 8.5 Write property test for profit calculation
    - **Property 7: Profit Calculation**
    - **Validates: Requirements 3.2**
  
  - [ ] 8.6 Create useProfitability hook in client/hooks/useProfitability.ts
    - Implement fetch with date range filter
    - _Requirements: 3.1, 3.3_
  
  - [ ] 8.7 Create Profitability page in client/pages/sales/Profitability.tsx
    - Date range selector
    - Product profitability table
    - Customer profitability table
    - Visual charts for profit trends
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 8.8 Add ReturnsReport and Profitability routes to client/App.tsx
    - Add routes at /sales/returns-report and /sales/profitability
    - _Requirements: 3.1, 5.1_

- [ ] 9. Checkpoint - Sales Module Complete
  - Ensure all Sales module tests pass
  - Verify all 6 pages are functional
  - Test complete sales workflow (order → invoice → shipment → payment)
  - Test returns workflow (return → credit → inventory adjustment)
  - Ask the user if questions arise


### Phase 2: Warehouse Module Foundation

- [ ] 10. Set up Warehouse module data models
  - [ ] 10.1 Create Warehouse model in server/models/Warehouse.ts
    - Define schema with name, code, address, capacity, isActive
    - Add indexes for name (unique), code (unique), isActive
    - _Requirements: 13.1, 13.2, 13.5_
  
  - [ ] 10.2 Create WarehouseExpense model in server/models/WarehouseExpense.ts
    - Define schema with warehouse, expenseDate, category, amount
    - Add indexes for warehouse, expenseDate, category
    - _Requirements: 8.1, 8.2_
  
  - [ ] 10.3 Create InternalOrder model in server/models/InternalOrder.ts
    - Define schema with orderNumber, source/destination warehouses, items, status
    - Add indexes for orderNumber (unique), warehouses, status
    - _Requirements: 9.1, 9.2_
  
  - [ ] 10.4 Create WarehouseTransfer model in server/models/WarehouseTransfer.ts
    - Define schema with transferNumber, source/destination warehouses, items, status
    - Add indexes for transferNumber (unique), warehouses, transferDate
    - _Requirements: 11.1, 11.2_
  
  - [ ] 10.5 Create Writeoff model in server/models/Writeoff.ts
    - Define schema with writeoffNumber, warehouse, items, reason, approvalRequired
    - Add indexes for writeoffNumber (unique), warehouse, writeoffDate
    - _Requirements: 14.1, 14.2_
  
  - [ ] 10.6 Update Product model to include warehouseQuantities array
    - Add warehouseQuantities field with warehouse reference and quantity
    - Update existing inventory operations to use warehouse-specific quantities
    - _Requirements: 7.1, 7.2_
  
  - [ ] 10.7 Add Warehouse module types to shared/api.ts
    - Export all warehouse-related interfaces
    - _Requirements: 7.1, 8.1, 9.1, 11.1, 13.1, 14.1_


- [ ] 11. Implement Warehouses management backend and frontend
  - [ ] 11.1 Create warehouses route in server/routes/warehouses.ts
    - Implement CRUD operations
    - Add name uniqueness validation
    - Implement deactivation logic
    - Calculate inventory value and utilization
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 13.6_
  
  - [ ] 11.2 Write property test for warehouse name uniqueness
    - **Property 20: Warehouse Name Uniqueness**
    - **Validates: Requirements 13.5**
  
  - [ ] 11.3 Write property test for deactivated warehouse transaction prevention
    - **Property 19: Deactivated Warehouse Transaction Prevention**
    - **Validates: Requirements 13.4**
  
  - [ ] 11.4 Create useWarehouses hook in client/hooks/useWarehouses.ts
    - Implement fetch, create, update, deactivate functions
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 11.5 Create WarehouseModal component in client/components/WarehouseModal.tsx
    - Form with name, code, address, contact, capacity
    - Name uniqueness validation
    - _Requirements: 13.2, 13.5_
  
  - [ ] 11.6 Create Warehouses page in client/pages/warehouse/Warehouses.tsx
    - List view with warehouse details
    - KPI cards (total warehouses, capacity utilization)
    - Create/edit warehouse functionality
    - Deactivate warehouse button
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_
  
  - [ ] 11.7 Add Warehouses route to client/App.tsx
    - Add route at /warehouse/warehouses
    - _Requirements: 13.1_

- [ ] 12. Implement Warehouse Balance page
  - [ ] 12.1 Create warehouse-balance route in server/routes/warehouse-balance.ts
    - Implement aggregation query for product quantities by warehouse
    - Add warehouse filter support
    - Highlight low stock products
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [ ] 12.2 Write property test for warehouse filter
    - **Property 4: Search Result Filtering** (covers warehouse filter)
    - **Validates: Requirements 7.3**
  
  - [ ] 12.3 Create useWarehouseBalance hook in client/hooks/useWarehouseBalance.ts
    - Implement fetch with warehouse filter
    - _Requirements: 7.1, 7.3_
  
  - [ ] 12.4 Create Balance page in client/pages/warehouse/Balance.tsx
    - Product balance table
    - Warehouse filter dropdown
    - Search by product name or SKU
    - Low stock highlighting
    - Export functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 12.5 Add Balance route to client/App.tsx
    - Add route at /warehouse/balance
    - _Requirements: 7.1_


- [ ] 13. Implement Warehouse Receipt page (update existing)
  - [ ] 13.1 Update receipts route to support warehouse selection
    - Add warehouse field to receipt creation
    - Update inventory by warehouse location
    - _Requirements: 10.2, 10.3_
  
  - [ ] 13.2 Write property test for receipt updates purchase order
    - **Property 16: Receipt Updates Purchase Order**
    - **Validates: Requirements 10.4**
  
  - [ ] 13.3 Update ReceiptModal component to include warehouse selection
    - Add warehouse dropdown
    - _Requirements: 10.2_
  
  - [ ] 13.4 Update Receipt page in client/pages/warehouse/Receipt.tsx
    - Ensure warehouse information is displayed
    - _Requirements: 10.1, 10.2, 10.6_
  
  - [ ] 13.5 Add Receipt route to client/App.tsx if not already present
    - Add route at /warehouse/receipt
    - _Requirements: 10.1_

- [ ] 14. Implement Warehouse Transfer backend and frontend
  - [ ] 14.1 Create warehouse-transfers route in server/routes/warehouse-transfers.ts
    - Implement CRUD operations
    - Add source warehouse quantity validation
    - Implement transfer execution with inventory updates
    - Use transaction for atomic inventory updates
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 14.2 Write property test for transfer source validation
    - **Property 14: Transfer Source Validation**
    - **Validates: Requirements 11.4**
  
  - [ ] 14.3 Write property test for warehouse transfer inventory balance
    - **Property 15: Warehouse Transfer Inventory Balance**
    - **Validates: Requirements 11.3**
  
  - [ ] 14.4 Create useWarehouseTransfers hook in client/hooks/useWarehouseTransfers.ts
    - Implement fetch, create, update functions
    - _Requirements: 11.1, 11.2_
  
  - [ ] 14.5 Create WarehouseTransferModal component in client/components/WarehouseTransferModal.tsx
    - Form with source/destination warehouse, products, quantities
    - Source quantity validation
    - _Requirements: 11.2, 11.4_
  
  - [ ] 14.6 Create Transfer page in client/pages/warehouse/Transfer.tsx
    - List view with source/destination
    - KPI cards (pending, completed)
    - Create transfer functionality
    - Status tracking
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ] 14.7 Add Transfer route to client/App.tsx
    - Add route at /warehouse/transfer
    - _Requirements: 11.1_


- [ ] 15. Implement Internal Order backend and frontend
  - [ ] 15.1 Create internal-orders route in server/routes/internal-orders.ts
    - Implement CRUD operations
    - Add source warehouse quantity validation
    - Implement approval workflow
    - Create transfer on approval
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_
  
  - [ ] 15.2 Write property test for internal order creates transfer
    - **Property 13: Internal Order Creates Transfer**
    - **Validates: Requirements 9.3**
  
  - [ ] 15.3 Create useInternalOrders hook in client/hooks/useInternalOrders.ts
    - Implement fetch, create, approve functions
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 15.4 Create InternalOrderModal component in client/components/InternalOrderModal.tsx
    - Form with source/destination warehouse, products, quantities
    - Source quantity validation
    - _Requirements: 9.2, 9.5_
  
  - [ ] 15.5 Create InternalOrder page in client/pages/warehouse/InternalOrder.tsx
    - List view with status
    - KPI cards (pending, approved, completed)
    - Create order functionality
    - Approval buttons
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 15.6 Add InternalOrder route to client/App.tsx
    - Add route at /warehouse/internal-order
    - _Requirements: 9.1_

- [ ] 16. Checkpoint - Warehouse Core Features
  - Ensure all tests pass for warehouses, balance, transfers, internal orders
  - Verify warehouse-specific inventory tracking works correctly
  - Test transfer workflow end-to-end
  - Ask the user if questions arise


- [ ] 17. Implement Warehouse Expense backend and frontend
  - [ ] 17.1 Create warehouse-expense route in server/routes/warehouse-expense.ts
    - Implement CRUD operations
    - Add expense amount validation (positive numbers)
    - Implement aggregation for expense summaries
    - _Requirements: 8.1, 8.2, 8.4, 8.6_
  
  - [ ] 17.2 Write property test for expense amount validation
    - **Property 12: Expense Amount Validation**
    - **Validates: Requirements 8.6**
  
  - [ ] 17.3 Write property test for expense total calculation
    - **Property 11: Expense Total Calculation**
    - **Validates: Requirements 8.4**
  
  - [ ] 17.4 Create useWarehouseExpense hook in client/hooks/useWarehouseExpense.ts
    - Implement fetch, create functions with date filter
    - _Requirements: 8.1, 8.5_
  
  - [ ] 17.5 Create WarehouseExpenseModal component in client/components/WarehouseExpenseModal.tsx
    - Form with warehouse, date, category, amount, description
    - Amount validation
    - _Requirements: 8.2, 8.3, 8.6_
  
  - [ ] 17.6 Create Expense page in client/pages/warehouse/Expense.tsx
    - List view with category breakdown
    - KPI cards (total expenses by category)
    - Create expense functionality
    - Date range filter
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ] 17.7 Add Expense route to client/App.tsx
    - Add route at /warehouse/expense
    - _Requirements: 8.1_

- [ ] 18. Implement Warehouse Write-off backend and frontend
  - [ ] 18.1 Create writeoffs route in server/routes/writeoffs.ts
    - Implement CRUD operations
    - Add approval requirement logic for high-value write-offs
    - Implement inventory decrease on write-off processing
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ] 18.2 Write property test for write-off approval requirement
    - **Property 21: Write-off Approval Requirement**
    - **Validates: Requirements 14.5**
  
  - [ ] 18.3 Create useWriteoffs hook in client/hooks/useWriteoffs.ts
    - Implement fetch, create, approve functions
    - _Requirements: 14.1, 14.2_
  
  - [ ] 18.4 Create WriteoffModal component in client/components/WriteoffModal.tsx
    - Form with warehouse, products, quantities, reason
    - Approval indicator for high-value write-offs
    - _Requirements: 14.2, 14.4, 14.5_
  
  - [ ] 18.5 Create Writeoff page in client/pages/warehouse/Writeoff.tsx
    - List view with reasons
    - KPI cards (total write-offs, value)
    - Create write-off functionality
    - Approval workflow for high-value items
    - _Requirements: 14.1, 14.2, 14.5_
  
  - [ ] 18.6 Add Writeoff route to client/App.tsx
    - Add route at /warehouse/writeoff
    - _Requirements: 14.1_


- [ ] 19. Implement Warehouse Turnover page
  - [ ] 19.1 Create warehouse-turnover route in server/routes/warehouse-turnover.ts
    - Implement aggregation query for product movements
    - Include receipts, shipments, transfers, write-offs
    - Calculate opening/closing balances
    - Calculate turnover rate
    - _Requirements: 12.1, 12.2, 12.4, 12.5_
  
  - [ ] 19.2 Write property test for turnover calculation completeness
    - **Property 17: Turnover Calculation Completeness**
    - **Validates: Requirements 12.2**
  
  - [ ] 19.3 Write property test for turnover rate calculation
    - **Property 18: Turnover Rate Calculation**
    - **Validates: Requirements 12.5**
  
  - [ ] 19.4 Create useWarehouseTurnover hook in client/hooks/useWarehouseTurnover.ts
    - Implement fetch with date range and warehouse filter
    - _Requirements: 12.1, 12.3, 12.6_
  
  - [ ] 19.5 Create Turnover page in client/pages/warehouse/Turnover.tsx
    - Date range selector
    - Turnover table with all movement types
    - Warehouse filter
    - Visual charts for movement trends
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ] 19.6 Add Turnover route to client/App.tsx
    - Add route at /warehouse/turnover
    - _Requirements: 12.1_

- [ ] 20. Checkpoint - Warehouse Module Complete
  - Ensure all Warehouse module tests pass
  - Verify all 8 pages are functional
  - Test complete warehouse workflow (receipt → transfer → write-off)
  - Test expense tracking and turnover calculations
  - Ask the user if questions arise


### Phase 3: Finance Module

- [ ] 21. Implement Payments page (update existing)
  - [ ] 21.1 Update payments route to support both customer and supplier payments
    - Add payment type field (received/paid)
    - Update partner account balance on payment
    - Update invoice payment status when linked
    - _Requirements: 17.1, 17.2, 17.3, 17.6_
  
  - [ ] 21.2 Write property test for payment updates account balance
    - **Property 23: Payment Updates Account Balance**
    - **Validates: Requirements 17.3**
  
  - [ ] 21.3 Write property test for payment updates invoice status
    - **Property 24: Payment Updates Invoice Status**
    - **Validates: Requirements 17.6**
  
  - [ ] 21.4 Update usePayments hook to support payment type filter
    - Add payment type parameter
    - _Requirements: 17.1, 17.2_
  
  - [ ] 21.5 Update PaymentModal component to support payment type selection
    - Add payment type radio buttons (received/paid)
    - Add partner selection (customer or supplier based on type)
    - _Requirements: 17.2, 17.4_
  
  - [ ] 21.6 Create Payments page in client/pages/finance/Payments.tsx
    - List view with type, partner, amount, method
    - KPI cards (total received, total paid)
    - Create payment functionality
    - Payment method selection
    - _Requirements: 17.1, 17.2, 17.4_
  
  - [ ] 21.7 Add Payments route to client/App.tsx
    - Add route at /finance/payments
    - _Requirements: 17.1_

- [ ] 22. Implement Mutual Settlements page
  - [ ] 22.1 Create mutual-settlements route in server/routes/mutual-settlements.ts
    - Implement aggregation query for partner account balances
    - Calculate total invoiced/received and total paid
    - Identify overdue accounts
    - Support account type filter
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6_
  
  - [ ] 22.2 Write property test for account type filter
    - **Property 4: Search Result Filtering** (covers account type filter)
    - **Validates: Requirements 16.6**
  
  - [ ] 22.3 Create useMutualSettlements hook in client/hooks/useMutualSettlements.ts
    - Implement fetch with account type filter
    - _Requirements: 16.1, 16.6_
  
  - [ ] 22.4 Create MutualSettlements page in client/pages/finance/MutualSettlements.tsx
    - Partner account list
    - KPI cards (total receivables, total payables)
    - Account type filter
    - View detailed transaction history
    - Overdue account highlighting
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 22.5 Add MutualSettlements route to client/App.tsx
    - Add route at /finance/mutual-settlements
    - _Requirements: 16.1_


- [ ] 23. Implement Cash Flow page
  - [ ] 23.1 Create cash-flow route in server/routes/cash-flow.ts
    - Implement aggregation query for cash inflows and outflows
    - Include customer payments, supplier payments, expenses
    - Calculate opening and closing balances
    - Categorize by activity type
    - _Requirements: 15.1, 15.2, 15.4, 15.5_
  
  - [ ] 23.2 Write property test for cash flow calculation completeness
    - **Property 22: Cash Flow Calculation Completeness**
    - **Validates: Requirements 15.2**
  
  - [ ] 23.3 Create useCashFlow hook in client/hooks/useCashFlow.ts
    - Implement fetch with date range filter
    - _Requirements: 15.1, 15.3_
  
  - [ ] 23.4 Create CashFlow page in client/pages/finance/CashFlow.tsx
    - Date range selector
    - Cash flow statement (opening, inflows, outflows, closing)
    - Category breakdown
    - Visual charts for trends
    - Export functionality
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [ ] 23.5 Add CashFlow route to client/App.tsx
    - Add route at /finance/cash-flow
    - _Requirements: 15.1_

- [ ] 24. Implement Profit and Loss page
  - [ ] 24.1 Create profit-loss route in server/routes/profit-loss.ts
    - Implement aggregation query for P&L statement
    - Calculate revenue from customer invoices
    - Calculate COGS from invoice items' cost prices
    - Include operating expenses
    - Calculate profit margins
    - Support period comparison
    - _Requirements: 18.1, 18.2, 18.4, 18.5, 18.6_
  
  - [ ] 24.2 Write property test for P&L calculation completeness
    - **Property 25: Profit and Loss Calculation Completeness**
    - **Validates: Requirements 18.2**
  
  - [ ] 24.3 Write property test for profit margin calculations
    - **Property 26: Profit Margin Calculations**
    - **Validates: Requirements 18.5**
  
  - [ ] 24.4 Write property test for period comparison calculation
    - **Property 27: Period Comparison Calculation**
    - **Validates: Requirements 18.6**
  
  - [ ] 24.5 Create useProfitLoss hook in client/hooks/useProfitLoss.ts
    - Implement fetch with date range filter
    - Support period comparison
    - _Requirements: 18.1, 18.3, 18.6_
  
  - [ ] 24.6 Create ProfitLoss page in client/pages/finance/ProfitLoss.tsx
    - Date range selector
    - P&L statement display
    - Margin calculations
    - Period comparison
    - Visual charts for trends
    - Export functionality
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [ ] 24.7 Add ProfitLoss route to client/App.tsx
    - Add route at /finance/profit-loss
    - _Requirements: 18.1_

- [ ] 25. Checkpoint - Finance Module Complete
  - Ensure all Finance module tests pass
  - Verify all 4 pages are functional
  - Test payment recording and account balance updates
  - Test financial reports accuracy (cash flow, P&L)
  - Ask the user if questions arise


### Phase 4: Contacts Module

- [ ] 26. Set up Contacts module data models
  - [ ] 26.1 Create Partner model in server/models/Partner.ts
    - Define schema with name, type, contact info, telegramUsername
    - Add indexes for name (unique within type), type, isActive
    - _Requirements: 20.1, 20.2, 20.5_
  
  - [ ] 26.2 Create Contract model in server/models/Contract.ts
    - Define schema with contractNumber, partner, dates, status, terms
    - Add indexes for contractNumber (unique), partner, status, endDate
    - _Requirements: 19.1, 19.2_
  
  - [ ] 26.3 Create TelegramConnection model in server/models/TelegramConnection.ts
    - Define schema with partner, telegramUserId, authToken
    - Add indexes for partner (unique), telegramUserId (unique)
    - _Requirements: 21.1, 21.2_
  
  - [ ] 26.4 Add Contacts module types to shared/api.ts
    - Export Partner, Contract, TelegramConnection interfaces
    - _Requirements: 19.1, 20.1, 21.1_

- [ ] 27. Implement Partners backend and frontend
  - [ ] 27.1 Create partners route in server/routes/partners.ts
    - Implement CRUD operations
    - Add name uniqueness validation within type
    - Support search and filter by type
    - Include transaction history and balance calculation
    - _Requirements: 20.1, 20.2, 20.4, 20.5, 20.6_
  
  - [ ] 27.2 Write property test for partner name uniqueness within type
    - **Property 29: Partner Name Uniqueness Within Type**
    - **Validates: Requirements 20.5**
  
  - [ ] 27.3 Write property test for partner search filter
    - **Property 4: Search Result Filtering** (covers partner search)
    - **Validates: Requirements 20.4**
  
  - [ ] 27.4 Create usePartners hook in client/hooks/usePartners.ts
    - Implement fetch, create, update functions
    - Support type filter and search
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [ ] 27.5 Create PartnerModal component in client/components/PartnerModal.tsx
    - Form with type, name, contact info, tax ID, bank account
    - Name uniqueness validation within type
    - _Requirements: 20.2, 20.5_
  
  - [ ] 27.6 Create Partners page in client/pages/contacts/Partners.tsx
    - List view with type, contact info
    - KPI cards (total customers, total suppliers)
    - Create/edit partner functionality
    - Search and filter
    - View transaction history and balance
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.6_
  
  - [ ] 27.7 Add Partners route to client/App.tsx
    - Add route at /contacts/partners
    - _Requirements: 20.1_


- [ ] 28. Implement Contracts backend and frontend
  - [ ] 28.1 Create contracts route in server/routes/contracts.ts
    - Implement CRUD operations
    - Add date validation (end date after start date)
    - Implement expiration alerts (30 days)
    - Support search and filter
    - _Requirements: 19.1, 19.2, 19.3, 19.5, 19.6_
  
  - [ ] 28.2 Write property test for contract date validation
    - **Property 28: Contract Date Validation**
    - **Validates: Requirements 19.5**
  
  - [ ] 28.3 Write property test for contract search filter
    - **Property 4: Search Result Filtering** (covers contract search)
    - **Validates: Requirements 19.6**
  
  - [ ] 28.4 Create useContracts hook in client/hooks/useContracts.ts
    - Implement fetch, create, update functions
    - Support search and filter
    - _Requirements: 19.1, 19.2, 19.6_
  
  - [ ] 28.5 Create ContractModal component in client/components/ContractModal.tsx
    - Form with partner, type, dates, terms, document upload
    - Date validation (end after start)
    - _Requirements: 19.2, 19.5_
  
  - [ ] 28.6 Create Contracts page in client/pages/contacts/Contracts.tsx
    - List view with partner, dates, status
    - KPI cards (active contracts, expiring soon)
    - Create/edit contract functionality
    - Expiration alerts
    - Status management
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.6_
  
  - [ ] 28.7 Add Contracts route to client/App.tsx
    - Add route at /contacts/contracts
    - _Requirements: 19.1_

- [ ] 29. Implement Telegram Integration page
  - [ ] 29.1 Create telegram route in server/routes/telegram.ts
    - Implement connection authentication endpoint
    - Implement message send/receive endpoints
    - Implement disconnect endpoint
    - Store encrypted auth tokens
    - _Requirements: 21.2, 21.4, 21.5, 21.6_
  
  - [ ] 29.2 Create useTelegram hook in client/hooks/useTelegram.ts
    - Implement connect, disconnect, sendMessage, fetchMessages functions
    - _Requirements: 21.2, 21.4, 21.5, 21.6_
  
  - [ ] 29.3 Create TelegramConnectModal component in client/components/TelegramConnectModal.tsx
    - Telegram authentication flow
    - Partner linking
    - _Requirements: 21.2, 21.3_
  
  - [ ] 29.4 Create Telegram page in client/pages/contacts/Telegram.tsx
    - Connection settings display
    - Connected contacts list
    - Message interface
    - Connect/disconnect functionality
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  
  - [ ] 29.5 Add Telegram route to client/App.tsx
    - Add route at /contacts/telegram
    - _Requirements: 21.1_

- [ ] 30. Checkpoint - Contacts Module Complete
  - Ensure all Contacts module tests pass
  - Verify all 3 pages are functional
  - Test partner management and contract tracking
  - Test Telegram integration (if API credentials available)
  - Ask the user if questions arise


### Phase 5: Integration and Polish

- [ ] 31. Update Navigation component
  - [ ] 31.1 Add Sales module navigation items to client/components/Navigation.tsx
    - Add menu section for Sales (Savdo)
    - Add links to all 6 sales pages
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_
  
  - [ ] 31.2 Add Warehouse module navigation items
    - Add menu section for Warehouse (Ombor)
    - Add links to all 8 warehouse pages
    - _Requirements: 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 14.1_
  
  - [ ] 31.3 Add Finance module navigation items
    - Add menu section for Finance (Pul)
    - Add links to all 4 finance pages
    - _Requirements: 15.1, 16.1, 17.1, 18.1_
  
  - [ ] 31.4 Add Contacts module navigation items
    - Add menu section for Contacts (Kontragentlar)
    - Add links to all 3 contacts pages
    - _Requirements: 19.1, 20.1, 21.1_

- [ ] 32. Integration testing and bug fixes
  - [ ] 32.1 Test complete sales workflow
    - Create customer order → Create invoice → Create shipment → Record payment
    - Verify inventory updates at each step
    - Verify account balance updates
    - _Requirements: 1.1-6.6_
  
  - [ ] 32.2 Test complete warehouse workflow
    - Create warehouse → Receive products → Transfer between warehouses → Write-off
    - Verify inventory tracking by warehouse
    - Verify expense recording
    - _Requirements: 7.1-14.6_
  
  - [ ] 32.3 Test financial reporting accuracy
    - Create transactions across all modules
    - Verify cash flow calculations
    - Verify P&L calculations
    - Verify mutual settlements balances
    - _Requirements: 15.1-18.6_
  
  - [ ] 32.4 Test partner and contract management
    - Create partners (customers and suppliers)
    - Create contracts with expiration tracking
    - Verify transaction history display
    - _Requirements: 19.1-20.6_
  
  - [ ] 32.5 Run all property-based tests
    - Execute all 29 property tests
    - Verify 100+ iterations per test
    - Fix any failing properties
    - _Requirements: All_
  
  - [ ] 32.6 Run all unit tests
    - Execute complete test suite
    - Verify minimum 70% code coverage
    - Fix any failing tests
    - _Requirements: All_

- [ ] 33. Performance optimization
  - [ ] 33.1 Add database indexes for all models
    - Verify indexes are created for frequently queried fields
    - Test query performance with sample data
    - _Requirements: All_
  
  - [ ] 33.2 Implement pagination for all list pages
    - Add pagination to all list endpoints
    - Update frontend to support pagination
    - Test with large datasets
    - _Requirements: All list pages_
  
  - [ ] 33.3 Optimize aggregation queries
    - Review and optimize all aggregation pipelines
    - Add indexes to support aggregations
    - Test performance with sample data
    - _Requirements: 3.1, 5.1, 12.1, 15.1, 16.1, 18.1_

- [ ] 34. Documentation and deployment preparation
  - [ ] 34.1 Update README with module documentation
    - Document all 4 modules and their features
    - Add API endpoint documentation
    - Add setup and deployment instructions
    - _Requirements: All_
  
  - [ ] 34.2 Create environment variable template
    - Document all required environment variables
    - Create .env.example file
    - _Requirements: All_
  
  - [ ] 34.3 Prepare database migration scripts
    - Create scripts for adding new collections
    - Create scripts for creating indexes
    - Test migration on clean database
    - _Requirements: All_

- [ ] 35. Final checkpoint - Complete ERP System
  - Ensure all 21 pages are functional and tested
  - Verify all 29 correctness properties pass
  - Verify all integration workflows work end-to-end
  - Verify performance is acceptable with sample data
  - Review code quality and consistency
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test-related tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The sequential implementation ensures dependencies are met before dependent features

## Implementation Guidelines

### Code Consistency
- Follow patterns from existing purchase/procurement modules
- Use TailwindCSS for all styling
- Use Radix UI components for UI elements
- Follow the useApi pattern for all custom hooks
- Use Mongoose transactions for multi-collection operations

### Testing Requirements
- Write property tests for all 29 correctness properties
- Use fast-check library for property-based testing
- Run minimum 100 iterations per property test
- Write unit tests for edge cases and error conditions
- Aim for 70%+ code coverage

### Error Handling
- Validate all inputs on both frontend and backend
- Return appropriate HTTP status codes
- Display user-friendly error messages
- Use transactions for operations affecting multiple collections

### Performance
- Add indexes for all frequently queried fields
- Implement pagination for large datasets
- Use aggregation pipelines for complex reports
- Optimize frontend with React.memo and debouncing

