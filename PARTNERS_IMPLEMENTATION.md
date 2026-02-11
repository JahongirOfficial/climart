# Partners (Hamkorlar) Module Implementation

## Overview
Comprehensive Partners/Kontragentlar module with unified database for customers and suppliers, balance tracking, sales history analysis, and segmentation features.

## Features Implemented

### 1. Enhanced Partner Model (`server/models/Partner.ts`)
- **New Fields Added:**
  - `code`: Unique internal identifier (auto-generated: P000001, P000002, etc.)
  - `status`: Partner status (new, active, vip, inactive, blocked)
  - `group`: Custom grouping (e.g., "Ulgurji", "Chakana")
  - `legalAddress`: Legal address for official documents
  - `physicalAddress`: Physical/actual address
  - Removed generic `address` field in favor of specific address types

- **Indexes:**
  - Unique index on `code`
  - Performance indexes on `name`, `type`, `status`, `isActive`

### 2. Backend API (`server/routes/partners.ts`)
- **GET /api/partners** - Get all partners with calculated statistics
  - Query parameters: `type`, `status`, `group`, `search`
  - Returns partners with:
    - `balance`: Calculated from sales, payments, and returns
    - `totalSales`: Sum of all shipments
    - `totalPurchases`: Sum of all receipts
    - `lastPurchaseDate`: Most recent transaction date
    - `averageCheck`: Average transaction value
    - `debtorStatus`: 'ok' | 'debtor' | 'creditor'

- **GET /api/partners/:id** - Get partner details with transaction history
  - Returns complete transaction history (shipments, invoices, returns, receipts, payments)

- **POST /api/partners** - Create new partner
  - Auto-generates unique code

- **PUT /api/partners/:id** - Update partner

- **DELETE /api/partners/:id** - Soft delete (sets isActive to false)

### 3. Balance Calculation Logic
```
For Customers:
  Balance = Total Sales - Total Payments - Total Returns
  Positive balance = Customer owes us (Debtor)

For Suppliers:
  Balance = -(Total Purchases - Total Payments - Total Returns)
  Negative balance = We owe them (Creditor)

For Both:
  Balance = Customer Balance + Supplier Balance
```

### 4. Partner Modal Component (`client/components/PartnerModal.tsx`)
- **Three-tab interface:**
  - **Asosiy (Main):** Name, type, status, group
  - **Aloqa (Contact):** Contact person, phone, email, Telegram, addresses
  - **Qo'shimcha (Additional):** Tax ID, bank account, notes

- **Features:**
  - Create and edit modes
  - Form validation
  - Toast notifications
  - Loading states

### 5. Partners Page (`client/pages/contacts/Partners.tsx`)
- **KPI Cards:**
  - Total customers count
  - Total suppliers count
  - Total debt from debtors (red)
  - Total credit to creditors (orange)

- **Filters:**
  - Search by name, phone, or code
  - Filter by type (customer, supplier, both)
  - Filter by status (new, active, vip, inactive, blocked)

- **Data Table Columns:**
  - Code (internal ID)
  - Name (with group subtitle)
  - Type badge
  - Status badge
  - Phone
  - Balance (color-coded: red for debtors, orange for creditors)
  - Total sales
  - Average check
  - Last purchase date
  - Actions (edit, delete)

- **Action Buttons:**
  - Import (placeholder for future implementation)
  - Export (placeholder for future implementation)
  - Create new partner

### 6. Updated Hook (`client/hooks/usePartners.ts`)
- Returns `PartnerWithStats[]` instead of `Partner[]`
- Added `deletePartner` function
- Maintains `refetch` functionality

### 7. Shared Types (`shared/api.ts`)
- Updated `Partner` interface with new fields
- Added `PartnerWithStats` interface extending Partner with calculated fields
- Added `TaxInvoice` and `TaxInvoiceItem` types (bonus)

## Status Badges
- **Yangi (New)**: Blue
- **Faol (Active)**: Green
- **VIP**: Purple
- **Nofaol (Inactive)**: Gray
- **Bloklangan (Blocked)**: Red

## Type Badges
- **Mijoz (Customer)**: Blue
- **Yetkazib beruvchi (Supplier)**: Green
- **Ikkalasi (Both)**: Purple

## Integration Points
The Partners module automatically integrates with:
- **Shipments** - For customer sales tracking
- **Customer Invoices** - For payment tracking
- **Customer Returns** - For return adjustments
- **Receipts** - For supplier purchase tracking
- **Payments** - For supplier payment tracking
- **Supplier Returns** - For supplier return adjustments

## Future Enhancements (Not Yet Implemented)
1. **Import/Export Functionality**
   - Excel import for bulk partner creation
   - Excel export for reporting

2. **Bulk Messaging**
   - SMS/Email campaigns to selected partners
   - Telegram notifications

3. **Task Creation**
   - Create follow-up tasks for specific partners
   - Payment reminder tasks

4. **Partner Detail View**
   - Dedicated page showing full transaction history
   - Charts and analytics per partner

5. **Reconciliation Acts**
   - Generate mutual settlement acts (Akt sverki)
   - PDF export of transaction history

## Technical Notes
- All balance calculations are performed server-side for accuracy
- Statistics are calculated on-demand (not stored in database)
- Soft delete preserves data integrity
- Unique code generation prevents duplicates
- Currency formatting uses Uzbek locale (XXX so'm)

## Files Modified/Created
1. `server/models/Partner.ts` - Enhanced model
2. `server/routes/partners.ts` - Complete CRUD + statistics
3. `client/components/PartnerModal.tsx` - New component
4. `client/pages/contacts/Partners.tsx` - Completely rewritten
5. `client/hooks/usePartners.ts` - Enhanced hook
6. `shared/api.ts` - Updated types
