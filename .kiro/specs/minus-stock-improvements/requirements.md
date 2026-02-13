# Requirements Document: Minus Stock Improvements

## Introduction

This document specifies requirements for enhancing the minus stock management capabilities in the ERP inventory management system. The system currently supports selling products with negative inventory (minus stock) and has basic infrastructure for tracking pending cost prices. These improvements will provide comprehensive management of minus stock invoices, automatic cost price correction when stock arrives, accurate profit calculations, and dual receipt printing for customer and warehouse operations.

## Glossary

- **System**: The ERP inventory management application
- **Minus_Stock**: Inventory state where product quantity is below zero
- **Pending_Invoice**: A CustomerInvoice with one or more items where costPricePending is true
- **Cost_Price_Correction**: The process of updating invoice item cost prices when actual stock arrives
- **Customer_Receipt**: A printed document showing sales information for the customer
- **Warehouse_Receipt**: A printed document showing inventory and cost information for warehouse staff
- **Receipt**: An incoming stock document recording product arrivals from suppliers
- **CustomerInvoice**: A sales document recording products sold to customers
- **Profit_Report**: A financial report calculating profit margins based on selling price minus cost price

## Requirements

### Requirement 1: Pending Invoice Identification

**User Story:** As a warehouse manager, I want to identify which invoices have pending cost prices, so that I can track sales made with minus stock.

#### Acceptance Criteria

1. WHEN a CustomerInvoice item is created with negative available stock, THE System SHALL set costPricePending to true for that item
2. WHEN all items in a CustomerInvoice have costPricePending false, THE System SHALL ensure isMinusCorrection is false
3. WHEN at least one item in a CustomerInvoice has costPricePending true, THE System SHALL mark the invoice for tracking
4. THE System SHALL provide an API endpoint to retrieve all Pending_Invoices
5. WHEN querying Pending_Invoices, THE System SHALL return invoice number, customer name, date, items with pending cost prices, and total amount

### Requirement 2: Pending Invoice List View

**User Story:** As a warehouse manager, I want to view a list of all invoices with pending cost prices, so that I can monitor which sales need cost price corrections.

#### Acceptance Criteria

1. THE System SHALL provide a user interface page displaying all Pending_Invoices
2. WHEN displaying Pending_Invoices, THE System SHALL show invoice number, customer name, invoice date, and count of pending items
3. WHEN a user clicks on a Pending_Invoice, THE System SHALL display detailed information including all items and their pending status
4. THE System SHALL allow filtering Pending_Invoices by date range
5. THE System SHALL allow filtering Pending_Invoices by customer
6. WHEN no Pending_Invoices exist, THE System SHALL display an appropriate empty state message

### Requirement 3: Automatic Cost Price Correction

**User Story:** As a warehouse manager, I want the system to automatically update pending invoice cost prices when new stock arrives, so that I have accurate cost information without manual intervention.

#### Acceptance Criteria

1. WHEN a Receipt is created with a product that has Pending_Invoices, THE System SHALL call correctPendingInvoices with the product ID and actual cost price
2. WHEN correctPendingInvoices executes, THE System SHALL update all invoice items for that product where costPricePending is true
3. WHEN updating an invoice item cost price, THE System SHALL set costPricePending to false
4. WHEN at least one item in an invoice is updated, THE System SHALL set isMinusCorrection to true on the invoice
5. WHEN cost price correction occurs, THE System SHALL log the invoice number and product ID for audit purposes
6. IF cost price correction fails, THEN THE System SHALL log the error without blocking Receipt creation

### Requirement 4: Corrected Invoice List View

**User Story:** As a warehouse manager, I want to view which invoices had their cost prices corrected, so that I can verify the automatic correction process worked correctly.

#### Acceptance Criteria

1. THE System SHALL provide a user interface page displaying all invoices where isMinusCorrection is true
2. WHEN displaying corrected invoices, THE System SHALL show invoice number, customer name, correction date, and affected items
3. WHEN a user clicks on a corrected invoice, THE System SHALL display before and after cost price information
4. THE System SHALL allow filtering corrected invoices by date range
5. THE System SHALL allow filtering corrected invoices by product
6. WHEN no corrected invoices exist, THE System SHALL display an appropriate empty state message

### Requirement 5: Profit Calculation with Actual Costs

**User Story:** As a financial manager, I want profit reports to use actual cost prices after correction, so that I can see accurate profit margins.

#### Acceptance Criteria

1. WHEN calculating profit for an invoice item, THE System SHALL use the current costPrice value from the item
2. WHEN an invoice has items with costPricePending true, THE System SHALL mark the profit calculation as estimated
3. WHEN displaying profit reports, THE System SHALL clearly distinguish between estimated and actual profit
4. THE System SHALL calculate profit as (sellingPrice - costPrice) * quantity for each item
5. WHEN aggregating profit across multiple invoices, THE System SHALL sum individual item profits
6. THE System SHALL provide a flag indicating whether any invoices in the report have pending cost prices

### Requirement 6: Profit Report User Interface

**User Story:** As a financial manager, I want to view profit reports with clear indication of estimated vs actual profits, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE System SHALL provide a profit report page showing total revenue, total cost, and total profit
2. WHEN displaying profit reports, THE System SHALL show separate totals for confirmed profit and estimated profit
3. WHEN an invoice has pending cost prices, THE System SHALL visually indicate it in the report with a warning icon or badge
4. THE System SHALL allow filtering profit reports by date range
5. THE System SHALL allow filtering profit reports by customer
6. THE System SHALL allow filtering profit reports by product
7. WHEN exporting profit reports, THE System SHALL include the pending status for each invoice

### Requirement 7: Customer Receipt Generation

**User Story:** As a sales clerk, I want to print a customer receipt when creating an invoice, so that the customer has a record of their purchase.

#### Acceptance Criteria

1. WHEN a CustomerInvoice is created, THE System SHALL generate a Customer_Receipt
2. THE Customer_Receipt SHALL include invoice number, invoice date, and customer name
3. THE Customer_Receipt SHALL include a table with columns for product name, quantity, selling price, and total
4. THE Customer_Receipt SHALL include the total amount for all items
5. THE Customer_Receipt SHALL include payment status and amount paid
6. THE Customer_Receipt SHALL be formatted for printing on standard paper
7. THE System SHALL provide a print button that opens the browser print dialog with the Customer_Receipt

### Requirement 8: Warehouse Receipt Generation

**User Story:** As a warehouse clerk, I want to print a warehouse receipt when creating an invoice, so that I can track inventory movements and costs.

#### Acceptance Criteria

1. WHEN a CustomerInvoice is created, THE System SHALL generate a Warehouse_Receipt
2. THE Warehouse_Receipt SHALL include invoice number, invoice date, and customer name
3. THE Warehouse_Receipt SHALL include a table with columns for product name, quantity, warehouse location, and cost price
4. THE Warehouse_Receipt SHALL include the total cost for all items
5. WHEN an item has costPricePending true, THE Warehouse_Receipt SHALL mark the cost price as estimated
6. THE Warehouse_Receipt SHALL be formatted for printing on standard paper
7. THE System SHALL provide a print button that opens the browser print dialog with the Warehouse_Receipt

### Requirement 9: Dual Receipt Printing Interface

**User Story:** As a sales clerk, I want to print both customer and warehouse receipts from the same interface, so that I can efficiently complete the sales process.

#### Acceptance Criteria

1. WHEN viewing a CustomerInvoice, THE System SHALL provide a "Print Customer Receipt" button
2. WHEN viewing a CustomerInvoice, THE System SHALL provide a "Print Warehouse Receipt" button
3. WHEN viewing a CustomerInvoice, THE System SHALL provide a "Print Both Receipts" button
4. WHEN clicking "Print Both Receipts", THE System SHALL open both receipts in separate print dialogs sequentially
5. THE System SHALL allow printing receipts for existing invoices, not just newly created ones
6. WHEN printing fails, THE System SHALL display an error message to the user

### Requirement 10: Receipt Print Layout

**User Story:** As a user, I want printed receipts to be clearly formatted and professional, so that they are suitable for business use.

#### Acceptance Criteria

1. THE System SHALL use a clean, professional layout for all printed receipts
2. THE System SHALL include company branding or logo area in the receipt header
3. THE System SHALL use appropriate font sizes for readability when printed
4. THE System SHALL align numerical values to the right in tables
5. THE System SHALL include page breaks appropriately for multi-page receipts
6. WHEN printing, THE System SHALL hide web UI elements like navigation and buttons
7. THE System SHALL use print-specific CSS media queries for optimal print output

### Requirement 11: Pending Cost Price API Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for pending invoices, so that the frontend can efficiently retrieve this data.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint at /api/customer-invoices/pending
2. WHEN the endpoint is called, THE System SHALL return all invoices with at least one item where costPricePending is true
3. THE System SHALL support query parameters for date range filtering (startDate, endDate)
4. THE System SHALL support query parameters for customer filtering (customerId)
5. THE System SHALL return invoice data including invoice number, customer name, date, items, and pending item count
6. THE System SHALL return results sorted by invoice date descending
7. IF no pending invoices exist, THEN THE System SHALL return an empty array with 200 status

### Requirement 12: Corrected Invoices API Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for corrected invoices, so that the frontend can display correction history.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint at /api/customer-invoices/corrected
2. WHEN the endpoint is called, THE System SHALL return all invoices where isMinusCorrection is true
3. THE System SHALL support query parameters for date range filtering (startDate, endDate)
4. THE System SHALL support query parameters for product filtering (productId)
5. THE System SHALL return invoice data including invoice number, customer name, correction date, and affected items
6. THE System SHALL return results sorted by update date descending
7. IF no corrected invoices exist, THEN THE System SHALL return an empty array with 200 status
