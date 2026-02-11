# Contracts (Shartnomalar) Module Implementation

## Overview
Comprehensive Contracts module for managing legal and financial agreements with partners (customers and suppliers). Includes contract lifecycle management, expiration tracking, and default contract selection.

## Features Implemented

### 1. Contract Model (`server/models/Contract.ts`)
- **Fields:**
  - `contractNumber`: Unique identifier (auto-generated: SH-2026-0001)
  - `partner`: Reference to Partner
  - `partnerName`: Partner name (denormalized for performance)
  - `organization`: Your organization name
  - `contractDate`: Contract signing date
  - `startDate`: Contract start date
  - `endDate`: Contract end date
  - `currency`: UZS, USD, EUR, or RUB
  - `totalAmount`: Optional total contract value
  - `creditLimit`: Maximum debt allowed under this contract
  - `paymentTerms`: Payment conditions (e.g., "30 kun ichida")
  - `status`: active, expired, or cancelled
  - `isDefault`: Whether this is the default contract for the partner
  - `priceList`: Associated price list name
  - `fileUrl`: Link to contract document (PDF/scan)
  - `notes`: Additional notes

- **Auto-status Update:**
  - Automatically sets status to 'expired' when endDate passes
  - Runs on save and on GET requests

- **Indexes:**
  - Unique index on `contractNumber`
  - Performance indexes on `partner`, `status`, `endDate`

### 2. Backend API (`server/routes/contracts.ts`)
- **GET /api/contracts** - Get all contracts
  - Query parameters: `partner`, `status`, `search`
  - Auto-updates expired contracts before returning
  - Returns contracts sorted by date (newest first)

- **GET /api/contracts/:id** - Get contract by ID
  - Includes populated partner data

- **GET /api/contracts/alerts/expiring** - Get contracts expiring within 30 days
  - Returns active contracts with endDate within next 30 days
  - Sorted by endDate (soonest first)

- **POST /api/contracts** - Create new contract
  - Auto-generates unique contract number
  - Fetches partner name automatically
  - If isDefault=true, unsets other defaults for same partner

- **PUT /api/contracts/:id** - Update contract
  - Manages default contract logic
  - Validates all fields

- **PATCH /api/contracts/:id/set-default** - Set as default contract
  - Unsets other defaults for the partner
  - Sets this contract as default

- **PATCH /api/contracts/:id/cancel** - Cancel contract
  - Changes status to 'cancelled'

- **DELETE /api/contracts/:id** - Delete contract
  - Permanently removes contract

### 3. Contract Modal Component (`client/components/ContractModal.tsx`)
- **Features:**
  - Create and edit modes
  - Partner selection dropdown
  - Date pickers for contract dates
  - Currency selection (UZS, USD, EUR, RUB)
  - Optional fields: total amount, credit limit, price list
  - Payment terms input
  - File URL for contract document
  - Notes textarea
  - "Set as default" checkbox
  - Form validation
  - Toast notifications
  - Loading states

- **Smart Defaults:**
  - Pre-fills partner if provided
  - Sets today's date as default contract date
  - Disables partner selection when editing

### 4. Contracts Hook (`client/hooks/useContracts.ts`)
- **Functions:**
  - `fetchContracts()`: Load contracts (optionally filtered by partner)
  - `setAsDefault(id)`: Mark contract as default
  - `cancelContract(id)`: Cancel a contract
  - `deleteContract(id)`: Delete a contract
  - `refetch()`: Reload contracts

- **State Management:**
  - Contracts list
  - Loading state
  - Error handling

### 5. Contracts Page (`client/pages/contacts/Contracts.tsx`)
- **KPI Cards:**
  - Active contracts count (green)
  - Expiring soon count (orange) - within 30 days
  - Expired contracts count (red)

- **Expiration Alert:**
  - Orange warning banner when contracts are expiring soon
  - Shows count and reminder message

- **Filters:**
  - Search by contract number or partner name
  - Filter by status (all, active, expired, cancelled)

- **Data Table Columns:**
  - Contract number (with star icon if default)
  - Partner name
  - Start date
  - End date (with days remaining if expiring soon)
  - Currency
  - Total amount (formatted)
  - Status badge
  - Actions

- **Row Highlighting:**
  - Orange background for contracts expiring within 30 days
  - Visual "days remaining" indicator

- **Action Buttons:**
  - **Star**: Set as default (only for non-default active contracts)
  - **Download**: Open contract file (if fileUrl exists)
  - **Edit**: Open edit modal
  - **Cancel**: Cancel active contract (with confirmation)
  - **Delete**: Delete contract (with confirmation)

### 6. Status Badges
- **Faol (Active)**: Green
- **Muddati tugagan (Expired)**: Red
- **Bekor qilingan (Cancelled)**: Gray

### 7. Currency Support
- **UZS**: so'm
- **USD**: $
- **EUR**: €
- **RUB**: ₽

## Business Logic

### Default Contract Management
- Each partner can have one default contract
- When setting a contract as default, all other defaults for that partner are automatically unset
- Default contracts are marked with a star icon
- Used for automatic contract selection in sales/purchase documents

### Expiration Tracking
- Contracts automatically expire when endDate passes
- System shows warning for contracts expiring within 30 days
- Orange highlighting for expiring contracts in table
- Separate KPI card for expiring contracts

### Contract Lifecycle
1. **Active**: Contract is valid and in use
2. **Expiring Soon**: Active but within 30 days of expiration
3. **Expired**: End date has passed (auto-updated)
4. **Cancelled**: Manually cancelled by user

## Integration Points
The Contracts module integrates with:
- **Partners** - Each contract belongs to a partner
- **Sales Documents** - Can reference default contract
- **Purchase Documents** - Can reference default contract
- **Credit Limits** - Enforces credit limits defined in contracts
- **Price Lists** - Associates specific price lists with contracts

## Future Enhancements (Not Yet Implemented)
1. **Contract Templates**
   - Pre-defined contract templates
   - Auto-fill from templates

2. **Document Generation**
   - Generate contract PDFs from templates
   - Digital signatures

3. **Automatic Renewals**
   - Auto-create renewal contracts
   - Notification before expiration

4. **Contract Amendments**
   - Track contract changes
   - Amendment history

5. **Multi-currency Calculations**
   - Exchange rate tracking
   - Currency conversion

6. **Contract Approval Workflow**
   - Multi-level approval process
   - Approval history

## Technical Notes
- Contract numbers use format: SH-YYYY-NNNN (e.g., SH-2026-0001)
- Auto-status update runs on save and on GET requests
- Default contract logic prevents multiple defaults per partner
- Soft delete not implemented - contracts are permanently deleted
- File storage not implemented - only URL storage
- Currency formatting uses Uzbek locale

## Files Created/Modified
1. `server/models/Contract.ts` - New model
2. `server/routes/contracts.ts` - New routes
3. `client/components/ContractModal.tsx` - New component
4. `client/hooks/useContracts.ts` - New hook
5. `client/pages/contacts/Contracts.tsx` - New page
6. `shared/api.ts` - Added Contract type
7. `server/index.ts` - Registered contracts route
8. `client/App.tsx` - Route already existed

## Usage Example

### Creating a Contract
1. Navigate to Contacts > Contracts
2. Click "Yangi shartnoma"
3. Select partner
4. Fill in dates and terms
5. Optionally set as default
6. Save

### Managing Expiring Contracts
1. Check orange KPI card for expiring count
2. Review orange-highlighted rows in table
3. Edit contract to extend end date
4. Or create new contract for partner

### Setting Default Contract
1. Find contract in table
2. Click star icon
3. Contract becomes default for that partner
4. Other defaults are automatically unset
