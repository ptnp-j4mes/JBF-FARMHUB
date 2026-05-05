# Permission System — JBFarmHUB

> **Last Updated:** 2026-04-27
> **Status:** Production (v0.1.1)
> **Coverage:** Dynamic DB-driven (`permissions` table) — fully synchronized with Backend

---

## สารบัญ

1. [สถาปัตยกรรมภาพรวม](#1-สถาปัตยกรรมภาพรวม)
2. [แบบจำลอง RBAC + Scope + Override](#2-แบบจำลอง-rbac--scope--override)
3. [Permission Catalog (จาก DB)](#3-permission-catalog-จาก-db)
4. [สถานะ Enforcement (Backend)](#4-สถานะ-enforcement-backend)
5. [Canonicalization](#5-canonicalization-frontend)
6. [โครงสร้าง Role ปัจจุบัน](#6-โครงสร้าง-role-ปัจจุบัน)
7. [Frontend Integration](#7-frontend-integration)
   - [วิธีใช้ guard ในหน้า feature จริง](#75-วิธีใช้-guard-ในหน้า-feature-จริง)
   - [Endpoint matrix per tab](#76-endpoint-matrix-per-tab)
8. [หน้าจัดการผู้ใช้ — UI Issues](#8-หน้าจัดการผู้ใช้--ui-issues)
9. [API Reference](#9-api-reference)
10. [เอกสารที่เกี่ยวข้อง](#10-เอกสารที่เกี่ยวข้อง)

---

## 1. สถาปัตยกรรมภาพรวม

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ผู้ใช้งาน (Browser)                          │
│  ┌───────────────────┐  ┌────────────────────────────────────────┐  │
│  │  Login Page        │  │  หน้าจัดการผู้ใช้ (/admin/user-assignment)│  │
│  │  → POST /api/auth  │  │  Tabs: กำหนดสิทธิ | ผู้ใช้ | บทบาท | คลัง│ │
│  │  → ได้ JWT Token    │  │  → เรียก CRUD APIs                     │  │
│  └───────────────────┘  └────────────────────────────────────────┘  │
│            ↓ localStorage(user_info)                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Frontend Guards:                                               ││
│  │  • authService.hasPermission(code, { facilityId })              ││
│  │  • canAccessMenu(requiredPermissionCodes) → ซ่อน/แสดงเมนูจาก tree││
│  │  • AccessGuard component → ปิดกั้นหน้าที่ไม่มีสิทธิ               ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP + JWT
┌─────────────────────────────────────────────────────────────────────┐
│                       Backend (.NET 8 / Kestrel)                    │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Controllers (ทุก endpoint ที่มี permission)           │          │
│  │  → เรียก EnsureXxxPermissionAsync(action)             │          │
│  │  → ภายในเรียก AccessControlService.EvaluateByCodeAsync│          │
│  └─────────────────────┬────────────────────────────────┘          │
│                        ↓                                            │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  AccessControlService (Source of Truth)               │          │
│  │  1. ใช้ resource/action ตาม DB (ไม่ทำ resource alias) │          │
│  │  2. แปลง action   → BuildActionCandidates (action variants) │       │
│  │  3. ดึง Role Permissions จาก DB                       │          │
│  │  4. ดึง User Overrides (allow/deny) จาก DB            │          │
│  │  5. ตรวจสอบ Facility Scope (user_assignments)        │          │
│  │  6. คืนค่า AccessEvaluationResult {IsAllowed, ...}    │          │
│  └──────────────────────────────────────────────────────┘          │
│                        ↓                                            │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  PostgreSQL Database                                  │          │
│  │  Tables: permissions, roles, role_permissions,        │          │
│  │          user_assignments, user_permission_overrides,  │          │
│  │          facility_nodes, navigation_menu_node_permissions,│          │
│  │          navigation_menu_nodes                         │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. แบบจำลอง RBAC + Scope + Override

### 2.1 ลำดับการตัดสินใจ (Decision Order)

```
1. User Override (deny)   → ❌ ถูกปิดกั้น (สูงสุด)
2. User Override (allow)  → ✅ อนุญาต
3. Role Permission        → ✅ อนุญาต (ถ้ามีอย่างน้อย 1 role ที่มี permission นั้น)
4. Default                → ❌ ปิดกั้น
```

### 2.2 Hierarchy Scope (ขอบเขตลำดับชั้นแบบยืดหยุ่น)

ระบบสนับสนุนโครงสร้างสถานที่แบบไม่คงที่ (Flexible Hierarchy) โดยสิทธิ์จะไหลตามเส้นทางใน `facility_nodes`:

| รูปแบบโครงสร้าง | ลำดับการไหลของสิทธิ์ (Inheritance Path) |
|---|---|
| **แบบทางตรง** | `Farm` ──→ `House` (โรงเรือนกิ่งฟาร์มโดยตรง) |
| **แบบมีโซน** | `Farm` ──→ `Zone` ──→ `House` (โรงเรือนภายใต้โซน) |

**พฤติกรรมการเข้าถึง:**
- **Cascade Down:** ถ้าได้สิทธิ์ที่ Node บน (เช่น Farm) จะครอบคลุมทุกอย่างที่อยู่ "ใต้" กิ่งนั้นทั้งหมด ไม่ว่าจะผ่านโซนหรือไม่ก็ตาม
- **Scoped Only:** ถ้าได้สิทธิ์ที่ Node ล่างสุด (House) สิทธิ์จะจำกัดอยู่แค่ในห้องนั้นเท่านั้น

### 2.3 Super Admin vs Admin Role

1. **Super Admin (`user.is_super_admin`):**
   - เป็น break-glass / maintenance flag ระดับสูงสุด ไม่ใช่ role ปกติ
   - ข้ามผ่านการเช็คทุกลำดับชั้น ทั้ง role, scope, user override, menu visibility และ backend permission enforcement
   - **ไม่ต้องมี** Role หรือ Assignment ใดๆ ก็เข้าถึงได้หมด
   - ไม่ควรถูกเก็บเป็น permission code หรือ action row ใน `permissions`
   - ควรใช้เฉพาะงานดูแลระบบหรือเหตุฉุกเฉิน และควรมี audit log ทุกครั้งที่ใช้งาน

2. **Admin Role (`role.code = 'ADMIN'`):**
   - มีอำนาจจัดการทั้งหมด (Manage) ใน Resource นั้นๆ
   - **ต้องอยู่ภายใต้ Scope** ที่ได้รับมอบหมายใน `user_assignments` (Admin ประจำฟาร์ม)

### 2.4 Navigation & Menu Visibility

เมนูใน Sidebar จะถูกกรองผ่านตาราง `navigation_menu_node_permissions`:
- ถ้า Node เมนูนั้นผูกกับ Permission ID ใดๆ
- User ต้องมี Permission นั้น (ผ่าน Role หรือ Override) เมนูถึงจะตื่นขึ้นมาแสดงผล
- *หมายเหตุ:* ถ้า Node ไหนไม่ได้ผูกสิทธิ์ ใครๆ ก็อาจจะมองเห็นได้ (Public menu)

### 2.4 Permission Schema (DB)

- ใช้ตาราง `permissions` เป็นแหล่งข้อมูลหลัก
  - `module` = กลุ่มโดเมน (snake_case, ไม่มี `.`)
  - `resource` = ทรัพยากร (snake_case, optional)
  - `action` = การกระทำ (snake_case)
  - `code` = `module.resource.action` หรือ `module.action` (unique, lowercase)
- ตาราง `user_permission_overrides` ใช้สำหรับกำหนดสิทธิ์ยกเว้นรายบุคคล (Allow/Deny)
- runtime ไม่ทำ legacy alias mapping; action ใน DB ต้องเป็น canonical เท่านั้น (`view`, `add`, `edit`, `submit`, `soft_delete`, `hard_delete`, `approve`, `reject`, `export`, `manage`, `upload`)

---

## 3. Permission Catalog (จาก DB)

> รูปแบบ canonical: `code = module.resource.action` หรือ `module.action` (lowercase)  
> `module`/`resource` เป็น `snake_case` และ `.` ใช้เป็นตัวคั่นระหว่าง `module.resource.action` เท่านั้น

### 3.1 Naming convention

- `module`: กลุ่มโดเมน/เมนูหลัก เช่น `admin`, `production`, `reports`
- `resource`: คำนามแบบ `snake_case` (optional)
- `action`: `view|add|edit|submit|soft_delete|hard_delete|approve|reject|export|manage|upload`
- `code` ควรเป็น lowercase และ unique

### 3.2 Warehouse guard pattern

ฝั่งคลังสินค้าไม่ได้ hardcode permission list ต่อ route แล้ว

- `warehouse.guard.ts` โหลด `/api/AuthModels/permissions`
- filter `module === 'warehouse'`
- group ตาม `resource` และ `action`
- ใช้ permission codes ใน session/JWT ของผู้ใช้มาเช็กกับ catalog ที่ได้จาก DB
- route-level access อิงจาก resource group ที่ตรงกับ DB ไม่ใช่ list permission แบบคงที่ในโค้ด

> action-specific helper ยังเช็ค permission code แบบตรง ๆ ได้ แต่ route-level access จะไม่ผูกกับ hardcoded list รายหน้าอีก

### 3.3 Production guard pattern

ฝั่ง production แยก guard ออกจาก warehouse แล้วเพื่อไม่ให้ permission module ปนกัน

- `production.guard.ts` ใช้กับ permission จริงของ `production.activity`, `production.building_opening`, `production.construction`
- หน้าที่ route อยู่ใต้ `/production/*` ไม่ได้แปลว่าต้องใช้ `production.guard` เสมอไป
- หน้ากลุ่ม stock/purchase/issue/adjustment ที่ route อยู่ใต้ `/production/*` แต่ permission canonical ยังเป็น `warehouse.*` จะยังใช้ `warehouse.guard.ts`
- ถ้าวันไหน backend ย้าย canonical permission ของหน้ากลุ่มนั้นไปเป็น `production.*` จริง ค่อยสลับ guard ตาม module ใหม่

### 3.4 User-assignment guard pattern

ฝั่งจัดการผู้ใช้/บทบาท/สิทธิ์ใช้ guard เฉพาะ module เช่นกัน

- `user-assignment.guard.ts` ใช้กับ permission code `admin.user_assignment.*`
- helper ภายใน page ต่าง ๆ เรียกผ่าน guard กลางแทนการเขียน `authService.hasAnyPermission([...])` ซ้ำ ๆ
- guard นี้ warm catalog จาก `/api/AuthModels/permissions` แล้ว resolve code ตาม action จาก DB snapshot ที่โหลดมา

| # | Resource Module | Actions | คำอธิบาย |
|---|---|---|---|
| 1 | `activity.daily_approvals` | 7 | อนุมัติกิจกรรมประจำวัน |
| 2 | `admin.documents` | 7 | ระบบเอกสาร |
| 3 | `admin.master_data` | 7 | ข้อมูลหลัก (Items, Breeds, UOMs, etc.) |
| 4 | `admin.menu_management` | 7 | จัดการเมนู |
| 5 | `admin.settings` | 7 | ตั้งค่าระบบ |
| 6 | `admin.user_assignment` | 11 | จัดการผู้ใช้และการกำหนดสิทธิ์ |
| 7 | `data.farm_information` | 7 | ข้อมูลฟาร์ม / FI Standard |
| 8 | `operations.feeding` | 7 | การให้อาหาร |
| 9 | `operations.stock` | 7 | สต็อกสุกร |
| 10 | `production.activity` | 7 | บันทึกข้อมูลประจำวัน |
| 11 | `production.building_opening` | 7 | เปิดโรงเรือน |
| 12 | `production.building_opening_approvals` | 7 | อนุมัติเปิดโรงเรือน |
| 13 | `production.construction` | 7 | งานก่อสร้าง |
| 14 | `warehouse.material_stock` | 7 | คลังสินค้า / วัสดุ |
| 15 | `warehouse.purchase_request` | 7 | ใบขอซื้อวัสดุ |
| 16 | `warehouse.stock_issue_request` | 7 | ใบขอตัดสต็อก |
| 17 | `reports.activity_daily` | 7 | รายงานกิจกรรมประจำวัน |
| 18 | `reports.approvals` | 7 | รายการอนุมัติ |
| 19 | `reports.building_opening_approvals` | 7 | รายงานอนุมัติเปิดโรงเรือน |
| 20 | `reports.center` | 7 | ศูนย์รายงาน |
| 21 | `reports.stock` | 7 | รายงานสต็อก |
| 22 | `reports.stock_issue_approvals` | 7 | รายงานอนุมัติตัดสต็อก |

---

## 4. สถานะ Enforcement (Backend)

### 4.1 สรุปภาพรวม

| สถานะ | จำนวน Module | Modules |
|---|---|---|
| ✅ ผูกกับ Logic ครบ | 5 | `admin.user_assignment`, `production.activity`, `production.building_opening`, `warehouse.material_stock`, `warehouse.purchase_request` |
| ✅ ผูกบางส่วน | 5 | `admin.master_data`, `admin.menu_management`, `operations.feeding`, `data.farm_information`, `warehouse.stock_issue_request` |
| ⚠️ Dynamic Detection | 2 | `reports.activity_daily`, `activity_daily_approvals` |
| ❌ ยังไม่มี Logic | 10 | `admin.documents`, `admin.settings`, `operations.stock`, `production.construction`, `production.building_opening_approvals`, `reports.approvals`, `reports.building_opening_approvals`, `reports.center`, `reports.stock`, `reports.stock_issue_approvals` |

### 4.2 รายละเอียด: Module ที่ Enforce จริง

#### `admin.user_assignment` — ✅ ครบ (41+ endpoints)

| Controller | ไฟล์ | Actions ที่ใช้ |
|---|---|---|
| `UsersController` | `Controllers/Admin/UsersController.cs` | view, add, edit, soft_delete, manage |
| `AuthModelsController` | `Controllers/Admin/AuthModelsController.cs` | view, add, edit, soft_delete, manage |
| `FacilitiesController` | `Controllers/Facility/FacilitiesController.cs` | view, manage |
| `LogsController` | `Controllers/Admin/LogsController.cs` | view |

#### `production.activity` — ✅ ครบ

| Controller | ไฟล์ | Actions |
|---|---|---|
| `ProductionActivitiesController` | `Controllers/Production/ProductionActivitiesController.cs` | view, manage, approve |
| `BatchClosingReportsController` | `Controllers/Production/BatchClosingReportsController.cs` | view, manage, approve |
| `FcrController` | `Controllers/Production/FcrController.cs` | view, manage |
| `FeedingController` | `Controllers/Operations/FeedingController.cs` | [ผ่าน pair: `operations.feeding` + `production.activity`] |

#### `production.building_opening` — ✅ ครบ

| Controller | ไฟล์ | Actions |
|---|---|---|
| `BuildingOpeningsController` | `Controllers/Production/BuildingOpeningsController.cs` | view, manage, approve |
| — | Legacy alias (frontend): `production_open_house` | |

#### `warehouse.material_stock` — ✅ ผ่าน pair กับ `warehouse`

| Controller | ไฟล์ | Actions |
|---|---|---|
| `WarehousesController` | `Controllers/Warehouse/WarehousesController.cs` | view, manage |
| `InventoriesController` | `Controllers/Warehouse/InventoriesController.cs` | view, manage |
| `PigBatchesController` | `Controllers/Warehouse/PigBatchesController.cs` | view, manage |
| `PigTransactionsController` | `Controllers/Operations/PigTransactionsController.cs` | view, manage |

#### `warehouse.purchase_request` — ✅ Enforce แล้ว

| Controller | ไฟล์ | Actions |
|---|---|---|
| `PurchaseRequestsController` | `Controllers/Purchase/PurchaseRequestsController.cs` | view, manage, approve |
| `ApprovalsController` | `Controllers/Workflow/ApprovalsController.cs` | approve |

#### `admin.master_data` — ✅ บางส่วน

| Controller | Actions ที่ผูก | Actions ที่ไม่ผูก |
|---|---|---|
| `PrefixesController` | view, manage | approve, export |
| `PrefixCategoriesController` | view, manage | approve, export |
| `BusinessPartnersController` | view, add, edit, soft_delete, hard_delete, manage | approve, export |
| MasterData อื่นๆ (Items, Breeds, UOMs ฯลฯ) | Enforce ผ่าน `admin.master_data.*` | |

> หมายเหตุ: `hard_delete` มีใช้ในบาง endpoint ของ Master Data เช่น `BusinessPartnersController`; ตารางนี้สรุป action หลักที่แชร์ร่วมกันเป็นส่วนใหญ่

#### `admin.menu_management` — ✅ บางส่วน

| Controller | Actions ที่ผูก | Actions ที่ไม่ผูก |
|---|---|---|
| `MenuModelsController` | view, add, edit, soft_delete, manage | approve, export |

#### `operations.feeding` — ✅ บางส่วน

| Controller | Actions |
|---|---|
| `FeedingController` | [ผ่าน pair: `operations.feeding` + `production.activity`] |

#### `warehouse.stock_issue_request` — ✅ ผูกแล้ว

| Controller | Actions |
|---|---|
| `StockIssueRequestsController` | `warehouse.stock_issue_request.*` |

### 4.3 Module ที่ยังไม่ Enforce (9 modules = 63 permissions)

Module เหล่านี้มี record ใน DB แต่**ยังไม่มี controller เรียก `EvaluateByCodeAsync`**:

- `admin.documents` — ยังไม่มี controller  
- `admin.settings` — ยังไม่มี controller
- `operations.stock` — ยังไม่มี controller
- `production.construction` — ยังไม่มี controller  
- `production.building_opening_approvals` — ยังไม่มี controller
- `reports.building_opening_approvals` — ยังไม่มี controller
- `reports.center` — ยังไม่มี controller
- `reports.stock` — ยังไม่มี controller
- `reports.stock_issue_approvals` — ยังไม่มี controller

> **หมายเหตุ:** Module เหล่านี้ยังคงทำงานในด้าน **Frontend** (ซ่อน/แสดงเมนู) แต่ไม่มี backend enforcement — หมายความว่าถ้า user รู้ API URL สามารถเรียกได้ตรงโดยไม่ถูกตรวจสอบ (ยกเว้น `[Authorize]` attribute ที่ตรวจแค่ว่า login แล้ว)

---

## 5. Canonical Permission Codes

### 5.1 Canonical permission code (Backend ยึด DB)

- Backend ใช้ข้อมูลจากตาราง `permissions` เป็น source of truth (ไม่ทำ resource alias ใน backend)
- รูปแบบ canonical: `module.resource.action` (lowercase)
- `module`/`resource` ใช้ `snake_case` ได้ และ `resource` สามารถ nested ด้วย `.` ได้
- `action` มาตรฐาน: `view`, `add`, `edit`, `submit`, `soft_delete`, `hard_delete`, `approve`, `reject`, `export`, `manage`, `upload`
- ไม่มี legacy alias mapping ใน backend หรือ frontend runtime; ค่าที่เก็บใน DB ต้องเป็น canonical ตรงตามรายการด้านบน

### 5.2 Dynamic Mapping (Frontend)

- ระบบ Frontend เลิกใช้ไฟล์ Hardcoded Mapping (`enforcement.ts` ถูกลบออกแล้ว)
- **Dynamic Action Detection:** UI ตารางสิทธิ์ (`PermissionMatrixEditor`) จะกวาดเอา Action ทุกตัวที่มีอยู่จริงใน Database ของ Module นั้นๆ มาแสดงผลแบบอัตโนมัติ
- **Dynamic Count:** ตัวเลขจำนวนสิทธิ์ (Permission Count) จะนับจากสิทธิ์ที่มีอยู่จริงใน DB (เช่น 189 สิทธิ์) โดยไม่ผ่านการกรองทิ้งด้วย List ที่ Hardcode ไว้
- **Normalization:** runtime ไม่ infer permission code จาก menu slug/path อีกแล้ว; ฝั่ง frontend จะใช้ `requiredPermissionCodes` จาก tree ของ DB เป็นหลัก และใช้ normalize แค่กับ string parsing/lookup ขั้นพื้นฐานเท่านั้น

---

## 6. โครงสร้าง Role ปัจจุบัน

| ID | Code | ชื่อ Role | สิทธิพื้นฐาน | สถานะ |
|---|---|---|---|---|
| 1 | ADMIN | Admin | **154** (ทั้งหมด) | ใช้งาน |
| 2 | EXECUTIVE | Executive | 1 | ใช้งาน |
| 3 | FARMADMINISTRATOR | FarmAdministrator | 0 | ใช้งาน |
| 4 | FARMMANAGER | FarmManager | 2 | ใช้งาน |
| 5 | HERDSUPERVISOR | HerdSupervisor | 0 | ใช้งาน |
| 6 | LINEHEAD | LineHead | 0 | ใช้งาน |
| 7 | MAINTENANCEMANAGER | MaintenanceManager | 0 | ใช้งาน |
| 8 | MAINTENANCETECHNICIAN | MaintenanceTechnician | 0 | ใช้งาน |
| 9 | QAAUTHROLE_* | QAAuthRole | 0 | **ระงับ** |
| 10 | STAFF | Staff | 1 | ใช้งาน |
| 11 | SUPERVISOR | Supervisor | 1 | ใช้งาน |
| 12 | TEST_ROLE_UPDATED | Test Role Updated | 0 | **ระงับ** |
| 13 | VETERINARIAN | Veterinarian | 0 | ใช้งาน |

> **หมายเหตุ:** Role ที่มี 0 สิทธิพื้นฐานยังสามารถมีสิทธิได้ผ่าน **User-level Override** (เพิ่มรายบุคคล)

### จำนวน Users ต่อ Role (ข้อมูลจากระบบ)

- Admin: 1 user (System Administrator)
- FarmManager: 2 users
- Supervisor: 1 user
- Staff: 1 user
- FarmAdministrator: ~50+ users
- อื่นๆ: 0 users (ยังไม่มีผู้ใช้)

---

## 7. Frontend Integration

### 7.1 Authentication Flow

```
Login → POST /api/auth/login
  → ได้ { token, user: { id, username, roles, permissions, scopes, ... } }
  → เก็บใน localStorage('user_info') + cookie('accessToken')
```

### 7.2 Permission Check Methods

**ไฟล์หลัก:** `frontend/src/features/auth/services/auth.service.ts`

```typescript
// ตรวจสอบ 1 permission
authService.hasPermission(resource: string, action: string, facilityId?: number): boolean

// ตรวจสอบว่ามีอย่างน้อย 1 permission
authService.hasAnyPermission(checks: {resource, action}[]): boolean

// ตรวจสอบเมนูว่าเข้าถึงได้ไหม (ใช้ requiredPermissionCodes จาก tree)
canAccessMenu(
  menuSlugOrPath: string,
  options: { requiredPermissionCodes?: string[] },
): boolean
```

### 7.3 Frontend Guard Components

| Component / Utility | ไฟล์ | หน้าที่ |
|---|---|---|
| `AccessGuard` | `src/lib/access-context.ts` | ซ่อน/แสดง UI component ตาม permission |
| `canAccessMenu()` | `src/features/auth/services/auth.service.ts` | กรองเมนูจาก `requiredPermissionCodes` ที่ได้จาก tree |
| `canAccessRoute()` | `src/lib/access/guard/route.guard.ts` | lookup tree จาก DB ก่อนเช็คสิทธิ์ route |
| Module guards | `src/lib/access/modules/*.guard.ts` | helper ระดับ module สำหรับ route guard / render guard / action guard |

### 7.4 หน้าที่เกี่ยวกับ Permission

| หน้า | Path | Component |
|---|---|---|
| กำหนดสิทธิ (User Assignment) | `/admin/user-assignment` | Tab: กำหนดสิทธิ \| ผู้ใช้ \| บทบาท \| คลังสิทธิ |
| Dialog กำหนดสิทธิ | — (modal) | `AddUserDialog.tsx` |

### 7.5 วิธีใช้ guard ในหน้า feature จริง

guard ของ repo นี้ไม่ได้มีไว้แค่ซ่อนเมนู แต่เป็น primitive กลางสำหรับ 3 ชั้นที่ต่างกัน:

- `route guard` ใช้ปิดทั้งหน้าเมื่อผู้ใช้เข้าหน้าแล้วไม่มีสิทธิ์
- `render guard` ใช้ซ่อน section, tab, card, หรือปุ่มในหน้า
- `action guard` ใช้เช็ก action แบบ 1:1 เช่น `view`, `add`, `edit`, `submit`, `soft_delete`, `hard_delete`, `approve`, `reject`, `export`, `manage`, `upload`

#### 7.5.1 เลือก guard จาก `permissions.module` ไม่ใช่จากชื่อ folder

| Module ใน DB | Guard ที่ใช้ | ใช้กับอะไร |
|---|---|---|
| `warehouse` | `warehouse.guard.ts` | `material_stock`, `stock_booking`, `stock_issue_request`, `stock_adjustment_request`, `purchase_request` |
| `production` | `production.guard.ts` | `activity`, `building_opening`, `construction` |
| `admin.user_assignment` | `user-assignment.guard.ts` | ผู้ใช้, บทบาท, สิทธิ์, org assignment |

> route path ไม่ได้บอก guard เสมอไป
> ตัวอย่างเช่นบางหน้าอยู่ใต้ `/production/*` แต่ permission canonical ยังเป็น `warehouse.*` จึงต้องใช้ `warehouse.guard.ts`

#### 7.5.2 เมื่อไหร่ควร warm catalog

ถ้าหน้าหรือ feature นั้นใช้ guard หลายจุด ให้ warm catalog ไว้ตั้งแต่ต้นทาง:

- data provider
- layout ของ module
- shell ที่ครอบหลาย page

การ warm ทำครั้งเดียวช่วยลดการ resolve permission ซ้ำ และทำให้ action helpers ตอบเร็วขึ้นเมื่อหน้า render หลายครั้ง

#### 7.5.3 ตัวอย่าง: route guard ของ warehouse

`frontend/src/app/(main)/warehouse/layout.tsx`

```tsx
useEffect(() => {
  let isActive = true;

  const checkRouteAccess = async () => {
    if (!authService.isAuthenticated()) {
      router.replace('/auth/login');
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const facilityId = getCurrentFacilityId();
    const routeAllowed = await canAccessWarehouseRoute(pathname, facilityId);
    if (!isActive) {
      return;
    }

    if (!routeAllowed) {
      router.replace('/operations/dashboard');
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    setLoading(false);
  };

  setLoading(true);
  void checkRouteAccess();
}, [pathname, router]);
```

หลักการของ pattern นี้คือ:

1. เช็ก session ก่อน
2. ดึง `facilityId` ปัจจุบันถ้ามี scope ผูกกับฟาร์ม/โรงเรือน
3. เรียก guard ด้วย `pathname`
4. ถ้าไม่มีสิทธิ์ให้ redirect ออกทันที
5. ถ้าผ่านค่อย render children

#### 7.5.4 ตัวอย่าง: warm catalog และใช้ action guard ใน `user-assignment`

`frontend/src/features/admin/user-assignment/components/UserAssignmentDataProvider.tsx`

```tsx
useEffect(() => {
  void warmUserAssignmentPermissionCatalog();
}, []);
```

จากนั้นใน page ค่อยใช้ helper แบบ 1:1:

`frontend/src/features/admin/user-assignment/pages/UserPage.tsx`

```tsx
const canCreateUser = canAddUserAssignment();
const canUpdateUser = canEditUserAssignment();
const canDeleteUser = canSoftDeleteUserAssignment();
const canResetPassword = canManageUserAssignment();
```

ตัวอย่างการ render:

```tsx
<Button disabled={!canUpdateUser}>แก้ไข</Button>
{canDeleteUser ? <Button color="error">ลบ</Button> : null}
{canResetPassword ? <Button>รีเซ็ตรหัสผ่าน</Button> : null}
```

#### 7.5.5 ตัวอย่าง: production page ที่ยังใช้ warehouse permission

บางหน้าถูกวาง route ไว้ใต้ `/production/*` แต่ permission canonical ยังเป็น `warehouse.*`

`frontend/src/features/production/stock-issue-request/StockIssueRequestPage.tsx`

```tsx
import {
  canManageWarehouseIssueRequests,
  canViewWarehouseIssueRequests,
} from '@/lib/access/modules/warehouse.guard';

const canViewIssue = canViewWarehouseIssueRequests();
const canManageIssue = canManageWarehouseIssueRequests();
```

เหตุผลคือ route family กับ permission module ไม่จำเป็นต้องตรงกัน 100%

- route บอกว่า user อยู่หน้าไหน
- permission module บอกว่า data/action นั้นเป็นของใครใน DB

#### 7.5.6 กฎเวลาเขียน guard ใหม่

- ใช้ helper ชื่อ 1:1 ตาม action จริง
- อย่าซ่อนหลาย action ไว้ในฟังก์ชันเดียวถ้าไม่จำเป็น
- ถ้ามี module ใหม่จริง ๆ ค่อยสร้าง guard ใหม่จาก `createModuleGuard(...)`
- ถ้าเป็นหน้าเดิมที่ route เปลี่ยน แต่ canonical permission ยังเหมือนเดิม ให้ reuse guard เดิม
- อย่า infer permission code จาก slug/path ถ้า DB มี `requiredPermissionCodes` ให้ใช้จาก DB ตรง ๆ

### 7.6 Endpoint matrix per tab

ตารางนี้สรุปว่าแต่ละแท็บใน `user-assignment` ใช้ endpoint อะไรเป็นหลัก

| Tab | ใช้ดูข้อมูลอะไร | Endpoint หลัก | Endpoint สนับสนุน |
|---|---|---|---|
| `กำหนดสิทธิ` (`assignment`) | `user_permission_overrides` + role scopes ของ assignment ที่เลือก | `GET /api/AuthModels/assignments/summary`<br>`GET /api/AuthModels/user-permission-overrides/{userAssignmentId}` | `PUT /api/AuthModels/user-permission-overrides/{userAssignmentId}`<br>`GET /api/AuthModels/permissions`<br>`GET /api/AuthModels/roles`<br>`GET /api/AuthModels/scope-catalog/facilities`<br>`GET /api/Facilities`<br>`GET /api/FeedSilos`<br>`GET /api/MenuModels/tree` |
| `ผู้ใช้` (`user`) | รายชื่อผู้ใช้ และข้อมูลสำหรับฟอร์มสร้าง/แก้ user | `GET /api/Users`<br>`GET /api/Users/{id}`<br>`POST /api/Users`<br>`PUT /api/Users/{id}`<br>`DELETE /api/Users/{id}`<br>`POST /api/Users/{id}/reset-password` | `GET /api/AuthModels/companies` |
| `องค์กร` (`organization`) | รายชื่อบริษัท/องค์กร | `GET /api/AuthModels/companies`<br>`GET /api/AuthModels/companies/{id}`<br>`POST /api/AuthModels/companies`<br>`PUT /api/AuthModels/companies/{id}`<br>`DELETE /api/AuthModels/companies/{id}`<br>`PATCH /api/AuthModels/companies/{id}/status` | - |
| `บทบาท` (`role`) | รายชื่อ role และ mapping role -> permissions | `GET /api/AuthModels/roles`<br>`GET /api/AuthModels/roles/{id}`<br>`POST /api/AuthModels/roles`<br>`PUT /api/AuthModels/roles/{id}`<br>`DELETE /api/AuthModels/roles/{id}`<br>`PATCH /api/AuthModels/roles/{id}/status`<br>`GET /api/AuthModels/roles/{roleId}/permissions`<br>`PUT /api/AuthModels/roles/{roleId}/permissions`<br>`POST /api/AuthModels/roles/{roleId}/permissions/{permissionId}`<br>`DELETE /api/AuthModels/roles/{roleId}/permissions/{permissionId}` | `GET /api/AuthModels/permissions`<br>`GET /api/MenuModels/tree` |
| `คลังสิทธิ` (`permission-pool`) | master permission catalog ในตาราง `permissions` | `GET /api/AuthModels/permissions`<br>`GET /api/AuthModels/permissions/{id}`<br>`POST /api/AuthModels/permissions`<br>`PUT /api/AuthModels/permissions/{id}`<br>`DELETE /api/AuthModels/permissions/{id}`<br>`PATCH /api/AuthModels/permissions/{id}/status` | `GET /api/AuthModels/roles` (ถ้าต้องโชว์ role count/สัมพันธ์) |

> หมายเหตุ:
> - `PermissionPage` คือแท็บ `คลังสิทธิ` ไม่ใช่แท็บ `กำหนดสิทธิ`
> - ถ้าต้องการดู `user_permission_overrides` ของ assignment ให้ดูในแท็บ `กำหนดสิทธิ` ผ่าน `GET /api/AuthModels/user-permission-overrides/{userAssignmentId}`
> - แท็บ `กำหนดสิทธิ` จะอ่าน `PermissionOverrides` จาก response ของ assignment-overrides endpoint โดยตรง

---

## 8. หน้าจัดการผู้ใช้ — UI Issues

### 🔴 Bug #1: Developer Note แสดงให้ผู้ใช้เห็น

**ไฟล์:** `frontend/src/features/admin/user-assignment/components/AddUserDialog.tsx` บรรทัด 1229-1238

ฟิลด์ "เบอร์โทรศัพท์" แสดง `helperText="ยังไม่เชื่อมกับ backend field นี้"` ซึ่งเป็น dev note ไม่ควรแสดงให้ user จริง

**แนะนำ:** ซ่อนฟิลด์ทั้งหมด หรือเปลี่ยน helperText เป็น `" "` จนกว่า backend จะเพิ่ม field

---

### 🟡 Bug #2: ฟิลด์ "ชื่อบริษัท" เป็น free text แทนที่จะเป็น dropdown

**ไฟล์:** `AddUserDialog.tsx` บรรทัด 1264-1274

Backend API `POST /api/Users` ต้องการ `companyId` (integer FK) แต่ UI ส่ง string ชื่อบริษัท → ต้องแปลง name→id ก่อนส่ง

**แนะนำ:** เปลี่ยนเป็น `<Select>` ดึงข้อมูลจาก `GET /api/AuthModels/companies`

---

### 🟢 Bug #3: Permission Count ไม่ตรงกัน (Resolved)

- ระบบเปลี่ยนมาใช้ Dynamic Count ที่นับจาก Database โดยตรง
- แก้ไขปัญหาเลข 154 vs 208 โดยการนำตัวกรอง Hardcode ออก ทำให้แสดงผลครบ 189 สิทธิ์ (หรือตามที่มีใน DB ขณะนั้น)

---

### 🟢 Minor #4: ไม่มี Confirmation Dialog เมื่อปิด modal ขณะแก้ไข

เมื่อกด X ปิด dialog ขณะมีข้อมูลที่แก้ไขแล้ว → ปิดทันทีไม่มีคำถามยืนยัน

---

## 9. API Reference

### 9.1 Authentication

| Method | Path | หน้าที่ |
|---|---|---|
| POST | `/api/auth/login` | Login ได้ JWT + user info |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/user-info` | ข้อมูล user + permissions ปักจจุบัน |

### 9.2 User Assignment (ต้องมี `admin.user_assignment.*`)

| Method | Path | Permission |
|---|---|---|
| GET | `/api/Users` | admin.user_assignment.view |
| GET | `/api/Users/{id}` | admin.user_assignment.view |
| POST | `/api/Users` | admin.user_assignment.add |
| PUT | `/api/Users/{id}` | admin.user_assignment.edit |
| DELETE | `/api/Users/{id}` | admin.user_assignment.soft_delete |

### 9.3 Auth Models (Companies, Roles, Permissions)

| Method | Path | Permission |
|---|---|---|
| GET | `/api/AuthModels/companies` | admin.user_assignment.view |
| POST | `/api/AuthModels/companies` | admin.user_assignment.add |
| PUT | `/api/AuthModels/companies/{id}` | admin.user_assignment.edit |
| DELETE | `/api/AuthModels/companies/{id}` | admin.user_assignment.soft_delete |
| GET | `/api/AuthModels/roles` | admin.user_assignment.view |
| POST | `/api/AuthModels/roles` | admin.user_assignment.add |
| PUT | `/api/AuthModels/roles/{id}` | admin.user_assignment.edit |
| DELETE | `/api/AuthModels/roles/{id}` | admin.user_assignment.soft_delete |
| GET | `/api/AuthModels/permissions` | admin.user_assignment.view |
| POST | `/api/AuthModels/permissions` | admin.user_assignment.add |
| PUT | `/api/AuthModels/permissions/{id}` | admin.user_assignment.edit |
| DELETE | `/api/AuthModels/permissions/{id}` | admin.user_assignment.soft_delete |
| GET | `/api/AuthModels/roles/{id}/permissions` | admin.user_assignment.view |
| PUT | `/api/AuthModels/roles/{id}/permissions` | admin.user_assignment.edit |
| GET | `/api/AuthModels/users/{id}/roles` | admin.user_assignment.view |
| PUT | `/api/AuthModels/users/{id}/roles` | admin.user_assignment.edit |
| GET | `/api/AuthModels/users/{id}/permissions` | admin.user_assignment.view |
| GET | `/api/AuthModels/users/{id}/scopes` | admin.user_assignment.view |

### 9.4 Detailed Endpoint-to-Permission Map

> ดูเอกสารฉบับเต็มที่: [`docs/permission-code-endpoint-map.md`](../../docs/permission-code-endpoint-map.md)

---

## 10. เอกสารที่เกี่ยวข้อง

| เอกสาร | Path | เนื้อหา |
|---|---|---|
| Permission → Endpoint Map (ฉบับเต็ม 154 codes) | `docs/permission-code-endpoint-map.md` | Mapping ทุก permission code → bundles ของ endpoints |
| Frontend Auth & Access Guide | `frontend/docs/frontend/04_frontend_auth-access.md` | รายละเอียด auth flow, guards, scope logic |
| Backend Team Guide | `backend/docs/BACKEND_TEAM_GUIDE_TH.md` | แนวทาง backend รวมถึง access control |
| Building Opening Module | `backend/docs/building_opening_module.md` | ตัวอย่าง module ที่ enforce permission ครบ |
| Menu Taxonomy (TH) | `frontend/docs/frontend/15_frontend_menu-taxonomy-th.md` | โครงสร้างเมนูและ permission module mapping |

---

> **สำหรับนักพัฒนา:** เมื่อสร้าง module ใหม่ที่ต้องมี permission ให้ทำตามขั้นตอน:
>
> 1. เพิ่ม permission records ใน DB (เช่น module.resource.action)
> 2. เพิ่ม `EnsureXxxPermissionAsync` ใน backend controller
> 3. ตรวจสอบชื่อ resource ให้ตรงกันระหว่าง DB และ Backend
> 4. Assign permission ให้ role ที่ต้องการผ่านหน้า Admin
> 5. ตารางสิทธิ์ใน Frontend จะแสดงผล Action ใหม่โดยอัตโนมัติแบบ Dynamic
