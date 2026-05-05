# 16_frontend_migration-blueprint.md

# Frontend Migration Blueprint

ไฟล์นี้เป็นแผนปรับโครงสร้าง frontend ทั้งหมด ครอบคลุมทุกด้านที่ต้องเปลี่ยน

ขอบเขตหลักของไฟล์นี้คือ

- target architecture ของ `src/` ทั้งหมด (module anatomy, file-by-file)
- service/API boundary strategy (ไม่ใช้ module-level repository/mock switching)
- permission code redesign (route-based → domain-based)
- RBAC + Scope flow ที่ถูกต้อง (role defaults + per-user override)
- migration steps ทีละ module
- backend changes ที่เกี่ยวข้อง

> หมายเหตุ: ตัวอย่างบางส่วนในไฟล์นี้ยังเป็น blueprint เก่าที่เก็บไว้เพื่ออ้างอิงตอน migrate; runtime ใหม่ควรยึด service/API direct เป็น baseline

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่ออ้างอิงเวลาทำ refactor ว่า

- module ไหนต้องย้ายไปไหน
- ไฟล์แต่ละตัวใน module ทำอะไร
- permission code ใช้ pattern ไหน
- service/API boundary ทำงานอย่างไร
- backend ต้องเปลี่ยนอะไรคู่กัน

### อ่านต่อ

- architecture baseline → `02_frontend_architecture.md`
- auth/access model → `04_frontend_auth-access.md`
- type guidelines → `05_frontend_type-guidelines.md`
- mapper guidelines → `06_frontend_mapper-guidelines.md`
- API flow → `07_frontend_api-usage.md`
- mock usage → `08_frontend_mock-usage.md`
- project alignment → `00_frontend_project-alignment.md`
- requirements → `13_frontend_requirements.md`

---

## 2. เหตุผลที่ต้องปรับ

| ปัญหาปัจจุบัน | ผลกระทบ |
|--------------|---------|
| Module จัดตาม route (`operations/`, `admin/`) | เปลี่ยน URL = ต้องย้าย business logic |
| ไม่มี DTO/Model แยก | Backend เปลี่ยน field = แก้ทุกหน้า |
| ไม่มี mapper | null/date/format กระจัดกระจายทุก component |
| ไม่มี service/API boundary ชัดเจน | data flow ซ้อนกันและ refactor ยาก |
| Module anatomy ไม่คงที่ | คนใหม่ไม่รู้จะวาง file ตรงไหน |
| Permission code ผูก route | เปลี่ยน route = เปลี่ยน permission ด้วย |

สิ่งที่ดีอยู่แล้ว: `modules/master` เป็นตัวอย่าง service/API anatomy ที่ค่อนข้างสะอาด → ใช้เป็นต้นแบบ

---

## 3. Target Architecture — โครง `src/` ระดับบน

```text
src/
├── app/                        # Route Layer (Next.js App Router)
│   ├── (auth)/                 # Public routes (login)
│   ├── (main)/                 # Protected routes (มี shell layout)
│   ├── api/                    # BFF / API route handlers
│   ├── layout.tsx              # Root layout (providers)
│   ├── loading.tsx             # Root loading state
│   └── manifest.ts             # PWA manifest
│
├── features/                   # ★ Business Modules (owner ของ business logic)
│   ├── access/                 # จัดการ users / roles / permissions / scopes
│   ├── approval/               # workflow อนุมัติ
│   ├── auth/                   # login / session
│   ├── document/               # เอกสาร
│   ├── farm/                   # ปฏิบัติการฟาร์ม (entry, feeding, stock, record)
│   ├── finance/                # การเงิน
│   ├── health/                 # สุขภาพสัตว์
│   ├── insight/                # dashboard / analytics / reports
│   ├── maintenance/            # โครงการ / ซ่อมบำรุง
│   ├── master/                 # ข้อมูลหลัก (items, partners, uom, ...)
│   ├── production/             # การผลิต (building-opening, batch, ...)
│   ├── purchase/               # จัดซื้อ
│   ├── sales/                  # ขาย
│   ├── setting/                # ตั้งค่าระบบ / integration / audit
│   └── warehouse/              # คลัง (receive, transfer, issue, adjust)
│
├── components/                 # Shared UI Components (ใช้ข้าม module)
│   ├── common/                 # StatusChip, EmptyState, ErrorState, DataTable
│   ├── forms/                  # FormTextField, FormDatePicker, FormSelect
│   ├── guards/                 # PermissionGuard, RouteGuard, AccessGuard
│   ├── layout/                 # AppShell, Sidebar, PageToolbar
│   └── feedback/               # ConfirmDialog, LoadingOverlay
│
├── contexts/                   # App-level Contexts
│   ├── RoleContext.tsx          # Access guard bridge
│   ├── ThemeContext.tsx         # Light/Dark theme
│   └── NotificationContext.tsx  # Notification center state
```

> หมายเหตุ: auth/session bootstrap และ access bootstrap ใน implementation ปัจจุบันควรอยู่ใน guard/runtime flow แทน standalone Auth/Access context files

├── core/                       # Shared Runtime / Infrastructure
│   ├── api/                    # HTTP client, interceptors
│   ├── config/                 # App config, menu config
│   ├── i18n/                   # Internationalization
│   ├── theme/                  # MUI theme tokens
│   └── ui-patterns/            # Shared UI patterns
│
├── lib/                        # Helper Libraries (ไม่ผูก business)
│   ├── access/                 # Permission helpers, usePermission
│   ├── data-source/            # ★ Data source resolver (API/Mock switching)
│   └── utils/                  # Date, number, string formatters
│
├── types/                      # Shared Types
│   ├── api.types.ts
│   ├── common.types.ts
│   └── ui.types.ts
│
├── assets/                     # Static assets
└── middleware.ts                # Next.js middleware
```

---

## 4. Module Anatomy — โครงมาตรฐานทุก Module

ใช้ `features/master` เป็นต้นแบบ (ตรง docs 100%)

```text
src/features/<module>/
│
├── pages/                        # Business Pages
│   ├── <Module>ListPage.tsx      # หน้ารายการ (table + filter + toolbar)
│   ├── <Module>DetailPage.tsx    # หน้ารายละเอียด
│   └── index.ts                  # re-export
│
├── components/                   # Business Components (ใช้เฉพาะ module)
│   ├── <Module>Table.tsx         # ตารางของ module
│   ├── <Module>FormDialog.tsx    # dialog สร้าง/แก้ไข
│   ├── <Module>DetailSection.tsx # section ย่อยใน detail page
│   └── index.ts
│
├── hooks/                        # React Query Hooks
│   ├── use<Module>ListQuery.ts   # useQuery สำหรับ list
│   ├── use<Module>CreateMutation.ts
│   ├── use<Module>UpdateMutation.ts
│   ├── use<Module>DeleteMutation.ts
│   └── index.ts
│
├── services/                     # Data Access Layer
│   ├── <module>.api.ts           # API calls จริง → return DTO
│   ├── <module>.mock.ts          # Mock responses → return DTO (shape เดียวกัน)
│   ├── <module>.repository.ts    # ★ เลือก API/Mock ตาม data-source config
│   ├── <module>.service.ts       # Business orchestration → return Model
│   └── index.ts
│
├── types/                        # Types แยกตาม Purpose
│   ├── <module>.dto.ts           # DTO — backend contract (snake_case, nullable)
│   ├── <module>.model.ts         # Model — UI-ready (camelCase, labels)
│   ├── <module>.form.ts          # FormModel — Zod schema + RHF values
│   ├── <module>.query.ts         # Query params, filter types
│   └── index.ts
│
├── utils/                        # Module Utilities
│   ├── <module>.mapper.ts        # ★ DTO↔Model, FormModel→DTO conversion
│   ├── <module>.constants.ts     # Module constants
│   ├── <module>.permissions.ts   # Permission code registry
│   ├── <module>.query-keys.ts    # TanStack Query keys
│   └── index.ts
│
├── mocks/                        # Mock Fixtures (optional)
│   └── index.ts
│
└── index.ts                      # Public API surface
```

---

## 5. Data Flow Pipeline

```text
Page → Hook (useQuery/useMutation) → Service → Repository → API or Mock
                                                                 ↓
                                                               DTO
                                                                 ↓
                                                     Service calls Mapper
                                                                 ↓
                                                              Model
                                                                 ↓
                                                       Hook returns Model
                                                                 ↓
                                                      Page renders Model
```

---

## 6. Mock Data Source Switching

### หลักการ

ENV มีแค่ `NEXT_PUBLIC_API_URL` ตามที่กำหนด ดังนั้นใช้ **TypeScript config file** สลับ data source

### ไฟล์ที่ต้องสร้าง

`src/lib/data-source/data-source.config.ts`

```ts
export type DataSource = 'api' | 'mock';

// ★ ค่า default: ใช้ API จริง
const GLOBAL_DEFAULT: DataSource = 'api';

// ★ override เฉพาะ module (uncomment เพื่อใช้ mock)
const MODULE_OVERRIDES: Partial<Record<string, DataSource>> = {
  // master: 'mock',
  // farm: 'mock',
};

export function resolveDataSource(moduleName: string): DataSource {
  return MODULE_OVERRIDES[moduleName] ?? GLOBAL_DEFAULT;
}
```

### วิธีใช้ใน Repository

```ts
// features/master/services/master.repository.ts
import { resolveDataSource } from '@/lib/data-source';
import * as api from './master.api';
import * as mock from './master.mock';

export const masterRepository = {
  getList: (params) => {
    const source = resolveDataSource('master');
    return source === 'mock' ? mock.getMasterList(params) : api.getMasterList(params);
  },
};
```

### กติกา

- commit ค่า default เป็น `'api'` เสมอ
- dev สามารถ uncomment module ที่ต้องการ mock ได้เอง
- API และ Mock ต้อง return DTO shape เดียวกัน
- repository เป็น owner เดียวของการเลือก source

---

## 7. RBAC + Scope Flow

### Overview

```text
┌─────────────────────────────────────────────────────┐
│                   LOGIN FLOW                        │
│                                                     │
│  1. User login (username + password)                │
│  2. Backend resolves:                               │
│     • User → UserRoles → Roles                     │
│     • Roles → RolePermissions → Permissions         │
│     • User → UserPermissions (override allow/deny)  │
│     • User → UserScopes → FacilityNodes             │
│     • User → PermissionScopes (per-facility perms)  │
│  3. Returns: token + effective data                 │
└─────────────────────────────────────────────────────┘
```

### Permission Resolution (Backend)

```text
Step 1: ดึง Role Permissions
  User → UserRoles → RolePermissions → effective base set
  
Step 2: Apply User Overrides
  UserPermissions (FacilityNodeId = null):
    effect = 'allow' → เพิ่มสิทธิ์
    effect = 'deny'  → ถอดสิทธิ์
  
Step 3: Resolve Scopes
  UserScopes → FacilityNodes (ฟาร์ม/โรงเรือนที่เข้าถึงได้)
  
Step 4: Resolve Permission Scopes
  UserPermissions (FacilityNodeId != null):
    สิทธิ์ที่ผูกกับ facility เฉพาะ
```

### ตัวอย่าง

```text
Role: "FarmManager"
  └─ RolePermissions: [farm.entry.view, farm.entry.create, farm.stock.view]

User: "สมชาย" (role = FarmManager)
  └─ UserPermission overrides:
       allow: production.opening.view     ← เพิ่มสิทธิ์นอก role
       deny:  farm.entry.create           ← ถอดสิทธิ์ที่ได้จาก role
  └─ UserScopes:
       FacilityNode: [Farm-A, Farm-B]     ← เข้าได้เฉพาะฟาร์ม A, B
  └─ PermissionScopes:
       farm.stock.view @ Farm-A only      ← ดูสต็อกได้เฉพาะฟาร์ม A

Effective permissions ของสมชาย:
  ✅ farm.entry.view      (จาก role)
  ❌ farm.entry.create    (role ให้ แต่ถูก deny)
  ✅ farm.stock.view      (จาก role, แต่ scoped เฉพาะ Farm-A)
  ✅ production.opening.view  (จาก user override allow)
```

### Frontend Guard System (Target)

```text
Guard Level    │ อยู่ที่ไหน              │ ทำอะไร
───────────────┼─────────────────────────┼──────────────────────────
Menu Guard     │ SideMenu.tsx            │ ซ่อน/แสดงเมนูตาม permission
Page Guard     │ AccessGuard / layout    │ redirect ถ้าไม่มีสิทธิ์เข้า route
Section Guard  │ <PermissionGuard>       │ ซ่อน section/panel ย่อย
Action Guard   │ hasPermission() check   │ disable/hide ปุ่ม action
Data Guard     │ useQuery({ enabled })   │ query เฉพาะเมื่อมีสิทธิ์+scope
```

---

## 8. Permission Code Redesign

### Pattern ที่ใช้

```text
{business_domain}.{resource}.{action}
```

- `business_domain` = ตรงกับ module name ใน `features/`
- `resource` = สิ่งที่จัดการ
- `action` = สิ่งที่ทำ

### Standard Actions

| Action | ความหมาย |
|--------|----------|
| view | ดูข้อมูล |
| create | สร้างใหม่ |
| update | แก้ไข |
| delete | ลบ |
| approve | อนุมัติ |
| export | ส่งออก |
| manage | full access (ครอบคลุม view+create+update+delete) |

### ตาราง Migration: ก่อน → หลัง

| Permission เดิม (route-based) | Permission ใหม่ (domain-based) | Module |
|-------------------------------|-------------------------------|--------|
| admin_users.view | access.user.view | access |
| admin_users.add | access.user.create | access |
| admin_users.update | access.user.update | access |
| admin_users.delete | access.user.delete | access |
| admin_users.manage | access.user.manage | access |
| admin_master_data.view | master.item.view | master |
| admin_master_data.update | master.item.update | master |
| admin_documents.view | document.doc.view | document |
| admin_settings.view | setting.system.view | setting |
| operations_dashboard.view | insight.dashboard.view | insight |
| operations_record.view | farm.entry.view | farm |
| operations_record.add | farm.entry.create | farm |
| operations_farm_info.view | farm.info.view | farm |
| operations_stock.view | farm.stock.view | farm |
| operations_feeding.view | farm.feeding.view | farm |
| operations_health.view | health.treatment.view | health |
| production_open_house.view | production.opening.view | production |
| production_building_opening.view | production.building.view | production |
| production_construction.view | maintenance.project.view | maintenance |
| reports_center.view | insight.report.view | insight |
| reports_analytics.view | insight.analytics.view | insight |
| reports_approvals.view | approval.request.view | approval |

### ตัวอย่างการใช้ (Code)

```ts
// features/access/utils/access.permissions.ts
export const accessPermissions = Object.freeze({
  user: {
    view:   'access.user.view',
    create: 'access.user.create',
    update: 'access.user.update',
    delete: 'access.user.delete',
    manage: 'access.user.manage',
  },
  role: {
    view:   'access.role.view',
    create: 'access.role.create',
    update: 'access.role.update',
    delete: 'access.role.delete',
    manage: 'access.role.manage',
  },
});

// ใช้ในหน้า
const canCreate = authService.hasAnyPermission([
  accessPermissions.user.create,
  accessPermissions.user.manage,
]);
```

### Backend Changes ที่ต้องทำ

ต้องแก้ `Permission` seed data ใน database:

```text
PermissionModule: "admin_users"  → "access"
PermissionCode:   "add"          → "create"
PermissionModule: "operations_stock" → "farm"
...
```

หรือสร้าง migration script ที่ rename ทั้งหมด

---

## 9. Route → Module Owner Mapping

route path ไม่จำเป็นต้องเปลี่ยน แค่เปลี่ยน module ที่ import จาก

```text
Route Path                    │ Module Owner     │ Page Component ที่ import
──────────────────────────────┼──────────────────┼────────────────────────
/operations/dashboard         │ insight          │ DashboardPage
/operations/record            │ farm             │ FarmEntryListPage
/operations/farm-info         │ farm             │ FarmInfoPage
/operations/stock             │ farm             │ FarmStockPage
/operations/feeding           │ farm             │ FarmFeedingPage
/operations/health            │ health           │ HealthListPage
/production/open-house        │ production       │ OpenHousePage
/production/building-opening  │ production       │ BuildingOpeningPage
/production/activity-daily    │ production       │ ActivityDailyPage
/warehouse/material-stock     │ warehouse        │ WarehouseStockPage
/warehouse/purchase-request   │ purchase         │ PurchaseRequestPage
/production/construction      │ maintenance      │ MaintenanceProjectPage
/reports/center               │ insight          │ ReportCenterPage
/reports/approvals            │ approval         │ ApprovalListPage
/reports/analytics            │ insight          │ AnalyticsPage
/admin/users                  │ access           │ AccessUserPage
/admin/master-data            │ master           │ MasterDataPage
/admin/documents              │ document         │ DocumentListPage
/admin/settings               │ setting          │ SettingPage
/admin/menu-management        │ access           │ MenuManagementPage
```

---

## 10. Module Migration Map

```text
FROM                                │ TO
────────────────────────────────────┼─────────────────────
modules/master/                     │ features/master/
features/admin/user-assignment/               │ features/access/
features/admin/documents/           │ features/document/
features/admin/settings/            │ features/setting/
features/operations/dashboard/      │ features/insight/
features/operations/farm-info/      │ features/farm/
features/operations/feeding/        │ features/farm/
features/operations/record/         │ features/farm/
features/operations/stock/          │ features/farm/
features/operations/health 2/       │ features/health/
features/production/building-opening/   │ features/production/
features/production/open-house/         │ features/production/
features/production/activity-daily/     │ features/production/
features/production/stock/              │ features/warehouse/
features/production/purchase/           │ features/purchase/
features/production/construction/       │ features/maintenance/
features/reports/approvals/             │ features/approval/
features/reports/center/                │ features/insight/
features/reports/analytics/             │ features/insight/
```

---

## 11. Migration Steps (ลำดับที่แนะนำ)

### Phase 1: Stabilize (ไม่เปลี่ยนโครง ไม่เสี่ยง)

1. สร้าง `src/lib/data-source/` เฉพาะกรณีต้องใช้ใน demo/test harness
2. ย้าย `modules/master/` → `features/master/` + update imports
3. ลบ `src/modules/`

### Phase 2: Align (ทีละ module)

4. แตก `features/admin/user-assignment/` → `features/access/`
5. แตก `features/admin/documents/` → `features/document/`
6. แตก `features/admin/settings/` → `features/setting/`
7. แตก `features/operations/` → `features/farm/` + `features/health/` + `features/insight/`
8. แตก `features/production/` → `features/production/` (clean) + `features/purchase/` + `features/warehouse/` + `features/maintenance/`
9. แตก `features/reports/` → `features/approval/` + `features/insight/` (merge)

### Phase 3: Converge

10. ปรับ module anatomy ให้ครบ (dto/model/mapper/hooks/service)
11. สร้าง shared permission helper (`usePermission`, `PermissionGuard`)
12. ทำ permission code migration (frontend + backend)

---

## 14. เมนูและสิทธิ์ทั้งหมด (Menu + Permission Taxonomy)

### โครงสร้างเมนู: สูงสุด 3 ระดับ

```text
Level 1 — กลุ่มเมนู (Menu Group)      เช่น "การดำเนินงาน"
  Level 2 — เมนู (Menu Item)           เช่น "บันทึกข้อมูล"
    Level 3 — สิทธิ์/Action            เช่น ดู, สร้าง, แก้ไข, ลบ, อนุมัติ
```

### Standard Actions (ใช้ทุก permission)

| Action | Code | ชื่อไทย |
|--------|------|--------|
| ดู | view | ดู |
| สร้าง | create | สร้าง |
| แก้ไข | update | แก้ไข |
| ลบ | delete | ลบ |
| อนุมัติ | approve | อนุมัติ |
| ส่งออก | export | ส่งออก |
| จัดการทั้งหมด | manage | จัดการทั้งหมด |

---

### กลุ่มที่ 1: การดำเนินงาน

| เมนู (Level 2) | Route | Module | Permission Code | ชื่อสิทธิ์ (Level 3) |
|----------------|-------|--------|-----------------|---------------------|
| **แดชบอร์ด** | /operations/dashboard | insight | `insight.dashboard.view` | ดูแดชบอร์ด |
| | | | `insight.dashboard.export` | ส่งออกแดชบอร์ด |
| **บันทึกข้อมูล** | /operations/record | farm | `farm.entry.view` | ดูบันทึกข้อมูล |
| | | | `farm.entry.create` | สร้างบันทึกข้อมูล |
| | | | `farm.entry.update` | แก้ไขบันทึกข้อมูล |
| | | | `farm.entry.delete` | ลบบันทึกข้อมูล |
| | | | `farm.entry.manage` | จัดการบันทึกข้อมูลทั้งหมด |
| **ข้อมูลรายฟาร์ม** | /operations/farm-info | farm | `farm.info.view` | ดูข้อมูลรายฟาร์ม |
| | | | `farm.info.update` | แก้ไขข้อมูลรายฟาร์ม |
| | | | `farm.info.manage` | จัดการข้อมูลรายฟาร์มทั้งหมด |
| **สต็อกสุกร** | /operations/stock | farm | `farm.stock.view` | ดูสต็อกสุกร |
| | | | `farm.stock.update` | แก้ไขสต็อกสุกร |
| | | | `farm.stock.export` | ส่งออกสต็อกสุกร |
| | | | `farm.stock.manage` | จัดการสต็อกสุกรทั้งหมด |
| **การให้อาหาร** | /operations/feeding | farm | `farm.feeding.view` | ดูข้อมูลการให้อาหาร |
| | | | `farm.feeding.create` | บันทึกการให้อาหาร |
| | | | `farm.feeding.update` | แก้ไขการให้อาหาร |
| | | | `farm.feeding.delete` | ลบข้อมูลการให้อาหาร |
| | | | `farm.feeding.manage` | จัดการการให้อาหารทั้งหมด |
| **สุขภาพและการรักษา** | /operations/health | health | `health.treatment.view` | ดูข้อมูลสุขภาพ |
| | | | `health.treatment.create` | บันทึกการรักษา |
| | | | `health.treatment.update` | แก้ไขข้อมูลการรักษา |
| | | | `health.treatment.delete` | ลบข้อมูลการรักษา |
| | | | `health.treatment.manage` | จัดการสุขภาพและการรักษาทั้งหมด |

---

### กลุ่มที่ 2: การผลิตและคลัง

| เมนู (Level 2) | Route | Module | Permission Code | ชื่อสิทธิ์ (Level 3) |
|----------------|-------|--------|-----------------|---------------------|
| **ข้อมูลโรงเรือน** | /production/open-house | production | `production.opening.view` | ดูข้อมูลโรงเรือน |
| | | | `production.opening.create` | สร้างข้อมูลโรงเรือน |
| | | | `production.opening.update` | แก้ไขข้อมูลโรงเรือน |
| | | | `production.opening.delete` | ลบข้อมูลโรงเรือน |
| | | | `production.opening.manage` | จัดการข้อมูลโรงเรือนทั้งหมด |
| **บันทึกกิจกรรมประจำวัน** | /production/activity-daily | production | `production.activity.view` | ดูกิจกรรมประจำวัน |
| | | | `production.activity.create` | บันทึกกิจกรรมประจำวัน |
| | | | `production.activity.update` | แก้ไขกิจกรรมประจำวัน |
| | | | `production.activity.delete` | ลบกิจกรรมประจำวัน |
| | | | `production.activity.approve` | อนุมัติกิจกรรมประจำวัน |
| | | | `production.activity.manage` | จัดการกิจกรรมประจำวันทั้งหมด |
| **เปิดโรงเรือน** | /production/building-opening | production | `production.building.view` | ดูเปิดโรงเรือน |
| | | | `production.building.create` | สร้างเปิดโรงเรือน |
| | | | `production.building.update` | แก้ไขเปิดโรงเรือน |
| | | | `production.building.approve` | อนุมัติเปิดโรงเรือน |
| | | | `production.building.manage` | จัดการเปิดโรงเรือนทั้งหมด |
| **คลังวัสดุ** | /warehouse/material-stock | warehouse | `warehouse.material_stock.view` | ดูคลังวัสดุ |
| | | | `warehouse.stock.create` | รับเข้าคลัง |
| | | | `warehouse.stock.update` | แก้ไขข้อมูลคลัง |
| | | | `warehouse.stock.delete` | ลบข้อมูลคลัง |
| | | | `warehouse.stock.export` | ส่งออกข้อมูลคลัง |
| | | | `warehouse.stock.manage` | จัดการคลังวัสดุทั้งหมด |
| **ใบขอซื้อวัสดุ** | /warehouse/purchase-request | warehouse.purchase_request | `warehouse.purchase_request.view` | ดูใบขอซื้อ |
| | | | `warehouse.purchase_request.add` | สร้างใบขอซื้อ |
| | | | `warehouse.purchase_request.edit` | แก้ไขใบขอซื้อ |
| | | | `warehouse.purchase_request.delete` | ลบใบขอซื้อ |
| | | | `warehouse.purchase_request.approve` | อนุมัติใบขอซื้อ |
| | | | `warehouse.purchase_request.manage` | จัดการใบขอซื้อทั้งหมด |
| **โครงการก่อสร้าง** | /production/construction | maintenance | `maintenance.project.view` | ดูโครงการก่อสร้าง |
| | | | `maintenance.project.create` | สร้างโครงการ |
| | | | `maintenance.project.update` | แก้ไขโครงการ |
| | | | `maintenance.project.delete` | ลบโครงการ |
| | | | `maintenance.project.approve` | อนุมัติโครงการ |
| | | | `maintenance.project.manage` | จัดการโครงการทั้งหมด |

---

### กลุ่มที่ 3: รายงาน

| เมนู (Level 2) | Route | Module | Permission Code | ชื่อสิทธิ์ (Level 3) |
|----------------|-------|--------|-----------------|---------------------|
| **ศูนย์รวมรายงาน** | /reports/center | insight | `insight.report.view` | ดูรายงาน |
| | | | `insight.report.export` | ส่งออกรายงาน |
| | | | `insight.report.manage` | จัดการรายงานทั้งหมด |
| **รายงานคลังสินค้า** | /reports/stock | insight | `insight.warehouse-report.view` | ดูรายงานคลังสินค้า |
| | | | `insight.warehouse-report.export` | ส่งออกรายงานคลัง |
| **รายงานบันทึกข้อมูลประจำวัน** | /reports/activity-daily | insight | `insight.activity-report.view` | ดูรายงานบันทึกประจำวัน |
| | | | `insight.activity-report.export` | ส่งออกรายงานบันทึกประจำวัน |
| **อนุมัติบันทึกข้อมูลประจำวัน** | /reports/activity-daily-approvals | approval | `approval.activity.view` | ดูรายการอนุมัติบันทึกประจำวัน |
| | | | `approval.activity.approve` | อนุมัติบันทึกประจำวัน |
| | | | `approval.activity.manage` | จัดการอนุมัติบันทึกประจำวัน |
| **อนุมัติปิดรุ่นการเลี้ยง** | /reports/batch-closing-approvals | approval | `approval.batch-closing.view` | ดูรายการอนุมัติปิดรุ่น |
| | | | `approval.batch-closing.approve` | อนุมัติปิดรุ่น |
| | | | `approval.batch-closing.manage` | จัดการอนุมัติปิดรุ่น |
| **วิเคราะห์ข้อมูล** | /reports/analytics | insight | `insight.analytics.view` | ดูวิเคราะห์ข้อมูล |
| | | | `insight.analytics.export` | ส่งออกวิเคราะห์ข้อมูล |
| **การแจ้งเตือน** | /reports/notifications | insight | `insight.notification.view` | ดูการแจ้งเตือน |
| | | | `insight.notification.update` | ตั้งค่าการแจ้งเตือน |
| | | | `insight.notification.manage` | จัดการการแจ้งเตือนทั้งหมด |

---

### กลุ่มที่ 4: ผู้ดูแลระบบ

| เมนู (Level 2) | Route | Module | Permission Code | ชื่อสิทธิ์ (Level 3) |
|----------------|-------|--------|-----------------|---------------------|
| **จัดการผู้ใช้งาน** | /admin/users | access | `access.user.view` | ดูผู้ใช้งาน |
| | | | `access.user.create` | สร้างผู้ใช้งาน |
| | | | `access.user.update` | แก้ไขผู้ใช้งาน |
| | | | `access.user.delete` | ลบผู้ใช้งาน |
| | | | `access.user.manage` | จัดการผู้ใช้งานทั้งหมด |
| **จัดการบทบาท** | /admin/users/role | access | `access.role.view` | ดูบทบาท |
| | | | `access.role.create` | สร้างบทบาท |
| | | | `access.role.update` | แก้ไขบทบาท |
| | | | `access.role.delete` | ลบบทบาท |
| | | | `access.role.manage` | จัดการบทบาททั้งหมด |
| **จัดการสิทธิ์** | /admin/users/permission | access | `access.permission.view` | ดูสิทธิ์ |
| | | | `access.permission.update` | แก้ไขสิทธิ์ |
| | | | `access.permission.manage` | จัดการสิทธิ์ทั้งหมด |
| **จัดการขอบเขต** | /admin/users/scope | access | `access.scope.view` | ดูขอบเขต |
| | | | `access.scope.update` | แก้ไขขอบเขต |
| | | | `access.scope.manage` | จัดการขอบเขตทั้งหมด |
| **ข้อมูลหลัก** | /admin/master-data | master | `master.item.view` | ดูข้อมูลหลัก |
| | | | `master.item.create` | สร้างข้อมูลหลัก |
| | | | `master.item.update` | แก้ไขข้อมูลหลัก |
| | | | `master.item.delete` | ลบข้อมูลหลัก |
| | | | `master.item.manage` | จัดการข้อมูลหลักทั้งหมด |
| **ระบบเอกสาร** | /admin/documents | document | `document.doc.view` | ดูเอกสาร |
| | | | `document.doc.create` | สร้างเอกสาร |
| | | | `document.doc.update` | แก้ไขเอกสาร |
| | | | `document.doc.delete` | ลบเอกสาร |
| | | | `document.doc.manage` | จัดการเอกสารทั้งหมด |
| **ตั้งค่าระบบ** | /admin/settings | setting | `setting.system.view` | ดูตั้งค่าระบบ |
| | | | `setting.system.update` | แก้ไขตั้งค่าระบบ |
| | | | `setting.system.manage` | จัดการตั้งค่าระบบทั้งหมด |
| **จัดการเมนู** | /admin/menu-management | access | `access.menu.view` | ดูเมนู |
| | | | `access.menu.update` | แก้ไขเมนู |
| | | | `access.menu.manage` | จัดการเมนูทั้งหมด |

---

### สรุป Tree เมนู (3 ระดับ)

```text
FarmHUB
├── การดำเนินงาน                           (Level 1: กลุ่มเมนู)
│   ├── แดชบอร์ด                           (Level 2: เมนู → insight.dashboard)
│   │   └── ดู, ส่งออก                     (Level 3: สิทธิ์)
│   ├── บันทึกข้อมูล                        (Level 2: เมนู → farm.entry)
│   │   └── ดู, สร้าง, แก้ไข, ลบ, จัดการ   (Level 3: สิทธิ์)
│   ├── ข้อมูลรายฟาร์ม                     (Level 2: เมนู → farm.info)
│   │   └── ดู, แก้ไข, จัดการ              (Level 3: สิทธิ์)
│   ├── สต็อกสุกร                          (Level 2: เมนู → farm.stock)
│   │   └── ดู, แก้ไข, ส่งออก, จัดการ      (Level 3: สิทธิ์)
│   ├── การให้อาหาร                        (Level 2: เมนู → farm.feeding)
│   │   └── ดู, สร้าง, แก้ไข, ลบ, จัดการ   (Level 3: สิทธิ์)
│   └── สุขภาพและการรักษา                  (Level 2: เมนู → health.treatment)
│       └── ดู, สร้าง, แก้ไข, ลบ, จัดการ   (Level 3: สิทธิ์)
│
├── การผลิตและคลัง
│   ├── ข้อมูลโรงเรือน                     → production.opening
│   ├── บันทึกกิจกรรมประจำวัน              → production.activity
│   ├── เปิดโรงเรือน                       → production.building
│   ├── คลังวัสดุ                          → warehouse.stock
│   ├── ใบขอซื้อวัสดุ                      → warehouse.purchase_request
│   └── โครงการก่อสร้าง                    → maintenance.project
│
├── รายงาน
│   ├── ศูนย์รวมรายงาน                     → insight.report
│   ├── รายงานคลังสินค้า                    → insight.warehouse-report
│   ├── รายงานบันทึกข้อมูลประจำวัน          → insight.activity-report
│   ├── อนุมัติบันทึกข้อมูลประจำวัน         → approval.activity
│   ├── อนุมัติปิดรุ่นการเลี้ยง             → approval.batch-closing
│   ├── วิเคราะห์ข้อมูล                     → insight.analytics
│   └── การแจ้งเตือน                       → insight.notification
│
└── ผู้ดูแลระบบ
    ├── จัดการผู้ใช้งาน                    → access.user
    ├── จัดการบทบาท                        → access.role
    ├── จัดการสิทธิ์                        → access.permission
    ├── จัดการขอบเขต                       → access.scope
    ├── ข้อมูลหลัก                         → master.item
    ├── ระบบเอกสาร                         → document.doc
    ├── ตั้งค่าระบบ                        → setting.system
    └── จัดการเมนู                         → access.menu
```

---

## เมื่อไรต้องอัปเดตไฟล์นี้

- เมื่อ module ใหม่ถูกเพิ่มเข้าระบบ
- เมื่อ permission code pattern เปลี่ยน
- เมื่อทำ migration step เสร็จ (update status)
- เมื่อ data flow หรือ mock strategy เปลี่ยน
- เมื่อเพิ่มเมนูหรือสิทธิ์ใหม่
