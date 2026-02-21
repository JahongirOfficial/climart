# Climart ERP

O'zbekiston bozori uchun ERP tizimi - Climart kompaniyasi.

## Tech Stack

- **Frontend**: React 18 + Vite 7 + TailwindCSS 3 + Radix UI + shadcn/ui
- **Backend**: Express 5 + MongoDB (Mongoose 9)
- **Auth**: JWT (admin/employee roles with permissions)
- **Language**: TypeScript (strict: false), UI text in **Uzbek**
- **Testing**: Vitest + Testing Library + Playwright (e2e)
- **Deploy**: VPS (167.86.95.237), PM2, nginx

## Project Structure

```
client/           # React SPA
  pages/          # Route pages (Dashboard, Sales, Purchases, Warehouse, Finance, etc.)
  components/     # Modals, Layout, UI components
  components/ui/  # shadcn/ui primitives
  lib/api.ts      # Centralized fetch helper with JWT auth
  lib/utils.ts    # cn() helper, formatters
  hooks/          # React Query hooks per module
server/
  index.ts        # Express app factory (createServer)
  routes/         # REST API endpoints per module
  models/         # Mongoose schemas
  middleware/     # auth.ts (authenticateToken, requireAdmin, requirePermission)
  utils/          # auditLogger, documentNumber, jwt, inventory, sampleData
  config/         # database.ts (MongoDB connection)
  scripts/        # seed.ts, test scripts
shared/
  api.ts          # Shared TypeScript interfaces (Partner, Product, Order, Invoice, etc.)
```

## Key Conventions

### API Pattern
- All routes: `/api/<resource>` (kebab-case)
- Auth: Bearer token in Authorization header
- Client uses `api.get/post/put/patch/delete` from `client/lib/api.ts`
- Server routes export Express Router, registered in `server/index.ts`

### Models & Document Numbering
- Auto-generated document numbers via `server/utils/documentNumber.ts`
- Counter model tracks sequential numbering per document type
- All models use Mongoose with timestamps: true

### Component Pattern
- Pages in `client/pages/` - one per ERP module
- Modal components: `<EntityName>Modal.tsx` for create/edit
- View modals: `View<EntityName>Modal.tsx` for read-only views
- shadcn/ui components in `client/components/ui/`
- State: React Query (@tanstack/react-query) for server state, local state for forms

### Styling
- TailwindCSS utility classes, no CSS modules
- `cn()` from `client/lib/utils.ts` for conditional classes
- Dark/light theme via next-themes

### Auth & Permissions
- Roles: `admin` (full access), `employee` (permission-based)
- Middleware chain: `authenticateToken` -> `requireAdmin` or `requirePermission('permission_name')`
- Token stored in localStorage as `auth_token`

## Commands

```bash
npm run dev              # Start dev server (Vite)
npm run build            # Build client + server
npm run build:client     # Build only client
npm run build:server     # Build only server
npm start                # Start production server
npm test                 # Run all tests
npm run test:client      # Client tests only
npm run test:server      # Server tests only
npm run test:e2e         # Playwright e2e tests
npm run typecheck        # TypeScript check
npx tsx server/scripts/seed.ts  # Seed database
```

## Deployment

Production VPS: `ssh root@167.86.95.237`
```bash
cd /var/www/climart && git pull origin main
npm install && npm run build
pm2 restart climart
```

## Important Notes

- UI text must be in **Uzbek** (O'zbek tili)
- ESM project (`"type": "module"` in package.json) - use `import`, not `require()`
- Express 5 (not 4) - async error handling built-in
- Path aliases: `@/*` -> `./client/*`, `@shared/*` -> `./shared/*`
- All monetary values in UZS (Uzbek Sum) unless specified
- Audit logging via `server/utils/auditLogger.ts` for important operations
