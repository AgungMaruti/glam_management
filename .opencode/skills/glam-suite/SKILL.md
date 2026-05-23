---
name: glam-suite
description: Use when working on Glam Suite — a perfume business management app built with Next.js 16, React 19, Supabase, Tailwind CSS v4, and TypeScript. Covers inventory, products, cashflow, RAD/HPP, pricing, auth, and reseller management.
---

# Glam Suite — Perfume Business Management

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL), direct client-side queries (no API routes)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Auth:** Supabase Auth (email/password)
- **Language:** TypeScript, UI in Bahasa Indonesia

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (+ auth gate)
│   ├── globals.css             # Global styles, CSS classes, grids
│   ├── page.tsx                # Dashboard
│   ├── products/page.tsx       # Produk & Varian + reseller
│   ├── inventory/page.tsx      # Bahan baku, resep, produksi
│   ├── cashflow/page.tsx       # Cashflow + export CSV
│   ├── rad/page.tsx            # RAD & HPP calculator
│   ├── pricing/page.tsx        # Kalkulator harga (e-commerce + reseller)
│   └── login/page.tsx          # Login page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation sidebar + user info
│   │   └── RootLayoutClient.tsx # Auth gate wrapper
│   └── ui/
│       ├── Button.tsx, Modal.tsx, Select.tsx, NumInput.tsx
│       ├── PageHeader.tsx, StatCard.tsx, Toaster.tsx
├── context/
│   └── AuthContext.tsx         # Auth state, login/logout, redirect
├── lib/
│   ├── supabase.ts             # Supabase client (singleton)
│   ├── utils.ts                # formatRupiah helper
│   └── csv.ts                  # exportCSV utility
├── types/
│   └── index.ts                # All TypeScript interfaces
supabase/
├── schema.sql                  # Full database schema
├── migration_auth.sql          # Auth RLS policies
```

## Code Conventions

- **ALL components are 'use client'** — direct Supabase queries from browser
- **NO comments** unless absolutely necessary (user has a bad experience with them)
- **Inline styles** (`style={{...}}`) are used extensively, not Tailwind classes
- **CSS classes** are defined in `globals.css` for grids, cards, tabs, modals
- **NO API routes** — Supabase is called directly from 'use client' components
- **Variables in Bahasa Indonesia** (e.g., `bahanBaku`, `simpanProduk`)
- **File naming:** kebab-case for folders, PascalCase for components

## Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `raw_materials` | Bahan baku (name, unit, stock, min_stock, cost_per_unit) |
| `products` | Produk (name, description) |
| `variants` | Varian produk (name, size_ml, selling_price, stock, stock_reseller) |
| `recipes` | Resep/BOM (variant_id, raw_material_id, quantity_needed) |
| `productions` | Riwayat produksi (variant_id, quantity, notes) |
| `sales` | Riwayat penjualan (variant_id, quantity, unit_price, total_amount) |
| `cashflow` | Arus kas (type, category, amount, description, transaction_date) |
| `resellers` | Daftar reseller (name) |
| `distributions` | Catatan distribusi ke reseller |
| `reseller_payments` | Pembayaran dari reseller |
| `settings` | Key-value settings (selling_price, hpp_per_unit, modal_bisnis) |
| `rad` | Rencana Anggaran Dana (batch calculator) |
| `rad_items` | Item dalam RAD (nama bahan, qty, biaya, pemakaian) |

## Auth System

- **Supabase Auth** with email/password
- **RLS policies:** `authenticated only` (all 12 tables)
- **Login page:** `/login` → Supabase signInWithPassword
- **Redirect:** unauthenticated users → `/login`; logged-in users at `/login` → `/`
- **Logout:** button in sidebar → Supabase signOut → redirect `/login`

## Key Features Implemented

1. **Dashboard** — stats cards, profit tracker, BEP, charts, piutang reseller, critical stock alerts
2. **Produk & Varian** — CRUD products/variants, sell (Jual), distribute to reseller (Dist), reseller payment (Bayar)
3. **Inventory** — raw materials (no prices in UI, cost_per_unit = 0 by default), recipes/BOM (no HPP display), production batches, restock
4. **Cashflow** — income/expense tracking, period filters, print report, export CSV, pagination (20/item), search
5. **RAD & HPP** — standalone cost calculator (does NOT modify any stock), proportional cost per bottle
6. **Pricing Calculator** — e-commerce fee simulation (Shopee, Tokopedia, TikTok, Lazada), reseller pricing
7. **Toast notifications** — global Toaster component, success/error variants
8. **CSV export** — cashflow, products, materials

## Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: true, persistSession: true } }
)
```

## Business Flow

```
Bahan Baku (Inventory)
    ↓ resep/BOM menentukan: 1 botol butuh berapa bahan?
Produksi Batch → stok bahan berkurang, stok varian bertambah
    ↓
Produk Jadi (stok sendiri + stok reseller)
    ↓                  ↓
Jual Sendiri         Distribusi ke Reseller
(stok -1,            (stok sendiri -1, stok reseller +1,
 cashflow +)          cashflow TIDAK bergerak)
                           ↓
                      Reseller Bayar
                      (stok reseller -1, cashflow +)
```

## Key Rules

- **RAD is a calculator only** — never modifies stock or cashflow
- **Restock** updates `raw_materials.stock` and optionally `cost_per_unit` (weighted average)
- **Production** auto-deducts raw materials per recipe and adds variant stock
- **Distribusi** moves stock from self to reseller, does NOT modify cashflow
- **Sales/Jual** deducts variant stock and creates cashflow income entry
- **No API routes exist** — all `src/app/api/` folders have been deleted
- **Vercel deployment** — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set
