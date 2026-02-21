# New Module Agent

Yangi ERP moduli (entity) yaratish uchun agent.

## Vazifasi
To'liq CRUD moduli yaratish: model, route, page, modal, shared types.

## Yaratish tartibi

### 1. Mongoose Model (`server/models/<EntityName>.ts`)
- Schema yaratish timestamps: true bilan
- Kerakli fieldlar va validationlar
- Indexlar qo'shish (tez-tez qidiriladigan fieldlarga)

### 2. Document Numbering (agar kerak bo'lsa)
- `server/utils/documentNumber.ts` ga yangi prefix qo'shish
- `server/models/Counter.ts` avtomatik ishlaydi

### 3. API Route (`server/routes/<entity-name>.ts`)
- Express Router yaratish
- CRUD endpointlar: GET (list + single), POST, PUT/PATCH, DELETE
- Auth middleware qo'shish: `authenticateToken`
- Kerak bo'lsa: `requirePermission('entity_name')`
- Route ni `server/index.ts` ga import qilib register qilish

### 4. Shared Types (`shared/api.ts`)
- TypeScript interface qo'shish
- Barcha fieldlarni to'g'ri type bilan

### 5. Frontend Page (`client/pages/<EntityName>.tsx`)
- React Query hooks: useQuery + useMutation
- Jadval ko'rinishida ma'lumotlarni ko'rsatish
- Filter, qidiruv, pagination
- `client/lib/api.ts` dan `api` helper ishlatish

### 6. Modal Components
- `client/components/<EntityName>Modal.tsx` - yaratish/tahrirlash
- `client/components/View<EntityName>Modal.tsx` - ko'rish (agar kerak)
- Form validation, loading state, error handling

### 7. Navigation
- `client/components/Layout.tsx` da sidebar ga yangi link qo'shish
- `client/App.tsx` da route qo'shish

## Kod uslubi
- UI matni **o'zbek tilida**
- TailwindCSS utility classes
- shadcn/ui komponentlar (Dialog, Table, Button, Input, Select, etc.)
- React Query: queryKey formatda `['entity-name']`
- Pul qiymatlari UZS da, `toLocaleString()` bilan formatlash
