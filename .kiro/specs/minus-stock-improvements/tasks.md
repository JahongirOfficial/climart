# Implementation Plan: Minus Stock Improvements

## Overview

This implementation plan breaks down the minus stock improvements feature into discrete, incremental coding tasks. Each task builds on previous work and includes testing sub-tasks to validate functionality early. The implementation follows a backend-first approach, then adds frontend pages, and finally integrates print functionality.

## Tasks

- [x] 1. Add shared TypeScript interfaces for new API responses
  - Create interfaces in `shared/api.ts` for PendingInvoiceResponse, CorrectedInvoiceResponse, and ProfitReportResponse
  - Export interfaces for use in both client and server
  - _Requirements: 11.5, 12.5_

- [x] 2. Implement pending invoices API endpoint
  - [x] 2.1 Create GET /api/customer-invoices/pending endpoint in `server/routes/customer-invoices.ts`
    - Add route handler that queries invoices with 'items.costPricePending': true
    - Support query parameters: startDate, endDate, customerId
    - Calculate pendingItemsCount for each invoice
    - Return results sorted by invoiceDate descending
    - _Requirements: 1.4, 1.5, 2.4, 2.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 2.2 Write property test for pending invoice query correctness
    - **Property 7: Pending Invoice Query Correctness**
    - **Validates: Requirements 11.2**
  
  - [ ]* 2.3 Write property test for date range filtering
    - **Property 5: API Date Range Filtering**
    - **Validates: Requirements 2.4, 11.3**
  
  - [ ]* 2.4 Write property test for customer filtering
    - **Property 6: API Entity Filtering**
    - **Validates: Requirements 2.5, 11.4**
  
  - [ ]* 2.5 Write unit tests for pending invoices endpoint
    - Test with valid filters
    - Test empty results edge case
    - Test invalid parameters error handling
    - _Requirements: 11.7_

- [x] 3. Implement corrected invoices API endpoint
  - [x] 3.1 Create GET /api/customer-invoices/corrected endpoint in `server/routes/customer-invoices.ts`
    - Add route handler that queries invoices with isMinusCorrection: true
    - Support query parameters: startDate, endDate, productId
    - Return results sorted by updatedAt descending
    - _Requirements: 4.4, 4.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ]* 3.2 Write property test for corrected invoice query correctness
    - **Property 8: Corrected Invoice Query Correctness**
    - **Validates: Requirements 12.2**
  
  - [ ]* 3.3 Write property test for result sorting
    - **Property 9: Result Sorting Consistency**
    - **Validates: Requirements 11.6, 12.6**
  
  - [ ]* 3.4 Write unit tests for corrected invoices endpoint
    - Test with valid filters
    - Test empty results edge case
    - Test product filtering
    - _Requirements: 12.7_

- [x] 4. Implement profit report API endpoint
  - [x] 4.1 Create new file `server/routes/reports.ts` with profit report endpoint
    - Create GET /api/reports/profit endpoint
    - Query invoices in date range with optional customer/product filters
    - Calculate revenue, cost, and profit for each invoice
    - Separate confirmed vs estimated profit based on costPricePending flags
    - Return aggregated totals and per-invoice details
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 6.4, 6.5, 6.6_
  
  - [x] 4.2 Register profit report route in `server/index.ts`
    - Import and register the new reports route
    - _Requirements: 5.1_
  
  - [ ]* 4.3 Write property test for profit calculation accuracy
    - **Property 10: Profit Calculation Accuracy**
    - **Validates: Requirements 5.1, 5.4, 5.5**
  
  - [ ]* 4.4 Write property test for pending cost flag in reports
    - **Property 11: Pending Cost Flag in Reports**
    - **Validates: Requirements 5.2, 5.6**
  
  - [ ]* 4.5 Write unit tests for profit report endpoint
    - Test profit calculations with sample data
    - Test confirmed vs estimated profit separation
    - Test filtering by customer and product
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

- [x] 5. Enhance correctPendingInvoices utility function
  - [x] 5.1 Update `server/utils/inventory.ts` to improve logging and error handling
    - Add detailed logging for corrected invoices
    - Return correction results (count and invoice numbers)
    - Improve error handling to not block receipt creation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 5.2 Write property test for cost price correction completeness
    - **Property 2: Cost Price Correction Completeness**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ]* 5.3 Write property test for correction flag propagation
    - **Property 3: Correction Flag Propagation**
    - **Validates: Requirements 3.4**
  
  - [ ]* 5.4 Write property test for receipt creation resilience
    - **Property 4: Receipt Creation Resilience**
    - **Validates: Requirements 3.6**
  
  - [ ]* 5.5 Write unit tests for correctPendingInvoices
    - Test with multiple pending invoices
    - Test with no pending invoices
    - Test error handling
    - _Requirements: 3.2, 3.3, 3.4, 3.6_

- [ ] 6. Checkpoint - Ensure backend tests pass
  - Run all backend tests and verify they pass
  - Test API endpoints manually with Postman or similar tool
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Create custom hooks for data fetching
  - [x] 7.1 Create `client/hooks/usePendingInvoices.ts`
    - Implement hook to fetch pending invoices with filters
    - Handle loading, error, and data states
    - Support refetch functionality
    - _Requirements: 1.4, 2.4, 2.5_
  
  - [x] 7.2 Create `client/hooks/useCorrectedInvoices.ts`
    - Implement hook to fetch corrected invoices with filters
    - Handle loading, error, and data states
    - Support refetch functionality
    - _Requirements: 4.4, 4.5_
  
  - [x] 7.3 Create `client/hooks/useProfitReport.ts`
    - Implement hook to fetch profit report data with filters
    - Handle loading, error, and data states
    - Support refetch functionality
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [ ]* 7.4 Write unit tests for custom hooks
    - Test data fetching and state management
    - Test error handling
    - Test filter parameter passing
    - _Requirements: 1.4, 4.4, 6.4_

- [-] 8. Create Pending Invoices page
  - [-] 8.1 Create `client/pages/sales/PendingInvoices.tsx`
    - Build page layout with header and filters
    - Use usePendingInvoices hook for data
    - Display table with invoice number, customer, date, pending items count
    - Add date range and customer filters
    - Handle loading, error, and empty states
    - Add click handler to view invoice details (reuse existing ViewInvoiceModal)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 8.2 Add route for Pending Invoices page in `client/App.tsx`
    - Add route: /sales/pending-invoices
    - _Requirements: 2.1_
  
  - [ ]* 8.3 Write unit tests for PendingInvoices component
    - Test rendering with data
    - Test empty state
    - Test error state
    - Test filter interactions
    - _Requirements: 2.1, 2.2, 2.6_

- [ ] 9. Create Corrected Invoices page
  - [ ] 9.1 Create `client/pages/sales/CorrectedInvoices.tsx`
    - Build page layout with header and filters
    - Use useCorrectedInvoices hook for data
    - Display table with invoice number, customer, correction date, items
    - Add date range and product filters
    - Add "Corrected" badge to invoices
    - Handle loading, error, and empty states
    - Add click handler to view invoice details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 9.2 Add route for Corrected Invoices page in `client/App.tsx`
    - Add route: /sales/corrected-invoices
    - _Requirements: 4.1_
  
  - [ ]* 9.3 Write unit tests for CorrectedInvoices component
    - Test rendering with data
    - Test empty state
    - Test error state
    - Test filter interactions
    - _Requirements: 4.1, 4.2, 4.6_

- [ ] 10. Enhance Profit Report page
  - [ ] 10.1 Update `client/pages/finance/ProfitLoss.tsx` to use profit report API
    - Replace existing profit calculation logic with useProfitReport hook
    - Add summary cards for total profit, confirmed profit, estimated profit
    - Add warning indicator when hasPendingCosts is true
    - Display detailed table with per-invoice profit
    - Add visual badge for invoices with pending costs
    - Add date range, customer, and product filters
    - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 10.2 Write unit tests for enhanced ProfitLoss component
    - Test rendering with confirmed and estimated profits
    - Test pending cost indicators
    - Test filter interactions
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. Checkpoint - Ensure frontend pages work correctly
  - Manually test all three new/updated pages
  - Verify filters work correctly
  - Verify data displays correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 12. Create print utility functions
  - [ ] 12.1 Create `client/utils/print.ts` with receipt printing utilities
    - Implement printCustomerReceipt function
    - Implement printWarehouseReceipt function
    - Implement printBothReceipts function
    - Implement HTML generation functions with inline styles
    - Add print-specific CSS styles
    - _Requirements: 7.7, 8.7, 9.4, 10.6, 10.7_
  
  - [ ]* 12.2 Write unit tests for print utility functions
    - Test HTML generation for customer receipt
    - Test HTML generation for warehouse receipt
    - Test popup blocker handling
    - _Requirements: 7.7, 8.7, 9.6_

- [ ] 13. Create receipt component templates
  - [ ] 13.1 Create `client/components/receipts/CustomerReceipt.tsx`
    - Build customer receipt template with clean layout
    - Include invoice details, items table, payment summary
    - Use print-friendly styling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 13.2 Create `client/components/receipts/WarehouseReceipt.tsx`
    - Build warehouse receipt template with warehouse-specific layout
    - Include invoice details, items table with cost prices, profit calculation
    - Add "Estimated" badge for items with costPricePending
    - Add signature lines
    - Use print-friendly styling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 13.3 Write unit tests for receipt components
    - Test customer receipt rendering
    - Test warehouse receipt rendering
    - Test pending cost indicator in warehouse receipt
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Integrate print functionality into CustomerInvoices page
  - [ ] 14.1 Update `client/pages/sales/CustomerInvoices.tsx` to add print buttons
    - Update existing print handlers to use new print utility functions
    - Ensure "Print Customer Receipt" button works
    - Ensure "Print Warehouse Receipt" button works
    - Ensure "Print Both Receipts" button works
    - Add error handling for popup blockers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 14.2 Write integration tests for print functionality
    - Test print button clicks
    - Test print window opening
    - Test error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

- [ ] 15. Add database indexes for performance
  - [ ] 15.1 Update `server/models/CustomerInvoice.ts` to add new indexes
    - Add index on 'items.costPricePending' for pending invoice queries
    - Add compound index on isMinusCorrection and updatedAt for corrected invoice queries
    - _Requirements: 1.4, 4.1_
  
  - [ ]* 15.2 Write performance tests
    - Test query performance with large datasets
    - Verify indexes are being used
    - _Requirements: 1.4, 4.1_

- [ ] 16. Update invoice creation logic to set costPricePending flag
  - [ ] 16.1 Update invoice creation in `server/routes/customer-invoices.ts`
    - Check product stock availability before creating invoice items
    - Set costPricePending to true when stock goes negative
    - _Requirements: 1.1_
  
  - [ ]* 16.2 Write property test for minus stock flag setting
    - **Property 1: Minus Stock Flag Setting**
    - **Validates: Requirements 1.1**
  
  - [ ]* 16.3 Write unit tests for invoice creation with minus stock
    - Test flag is set when stock is negative
    - Test flag is not set when stock is sufficient
    - _Requirements: 1.1_

- [ ] 17. Final checkpoint - End-to-end testing
  - [ ] 17.1 Test complete minus stock flow
    - Create invoice with minus stock, verify pending flag
    - Create receipt, verify cost correction
    - View pending invoices page, verify invoice appears
    - View corrected invoices page, verify invoice appears after correction
    - View profit report, verify estimated vs actual profit
    - Print both receipts, verify correct content
  
  - [ ] 17.2 Test all filters across all pages
    - Test date range filters
    - Test customer filters
    - Test product filters
  
  - [ ] 17.3 Test error scenarios
    - Test with network errors
    - Test with invalid data
    - Test popup blockers
  
  - [ ] 17.4 Verify all tests pass
    - Run full test suite
    - Ensure all tests pass, ask the user if questions arise

- [ ] 18. Update navigation to include new pages
  - [ ] 18.1 Add links to Pending Invoices and Corrected Invoices pages in sidebar navigation
    - Update navigation component to include new menu items under Sales section
    - _Requirements: 2.1, 4.1_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across random inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a backend-first approach to establish data layer before UI
- Print functionality is implemented last as it depends on invoice data being available
- All new API endpoints follow RESTful conventions and existing project patterns
- All React components follow existing project patterns (Layout, Card, Button, etc.)
- Use existing UI components from `client/components/ui/` for consistency
- Follow existing localization patterns (Uzbek language for UI text)
