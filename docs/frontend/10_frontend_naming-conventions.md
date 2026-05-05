# 10_frontend_naming-conventions.md

# Frontend Naming Conventions

ไฟล์นี้กำหนดกติกาการตั้งชื่อทั้งระบบ เพื่อให้ route/module/file/component/hook/type/service ใช้ภาษาเดียวกันและค้นหาได้จากชื่อ

ไฟล์นี้ครอบคลุม

- route/module/folder/file naming
- page/component/hook naming
- service/repository/api/mock naming
- type/mapper/context/provider/env naming
- naming anti-pattern ที่ต้องห้าม

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อลดปัญหาโค้ดอ่านยากและชื่อไม่ตรงกันข้ามทีม

- คำที่ใช้ใน route/menu/module ต้องสอดคล้องกันอย่างไร
- pattern ชื่อไฟล์ของ page/component/hook/service/repository/api/mock ควรเป็นแบบไหน
- naming formula ของ module components ต้องระบุ domain owner อย่างไร
- context/provider/env/query-key ควรตั้งชื่อให้เดา purpose ได้อย่างไร
- คำย่อใดอนุญาตและคำย่อใดห้ามใช้

ไฟล์นี้ไม่แทน architecture docs แต่เป็นมาตรฐานภาษากลางของโค้ดทั้งระบบ

### อ่านต่อ

- ภาพรวมระบบ -> `01_frontend_overview.md`
- โครงสร้าง app/features/contexts และ owner mapping -> `02_frontend_architecture.md`
- type system -> `05_frontend_type-guidelines.md`
- mapper guidelines -> `06_frontend_mapper-guidelines.md`
- mock/env strategy -> `08_frontend_mock-usage.md`

---

## 2. Naming Principles

## 2.1 ชื่อต้องสั้นแต่ไม่เสียความหมาย

ระบบนี้ชอบชื่อที่สั้น ชัด และคงที่ เช่น

- `master`
- `docs`
- `settings`
- `users`

แต่ถ้าสั้นจนเสียความหมาย ก็ไม่ควรฝืน

## 2.2 ใช้คำเดียวกันซ้ำให้คงที่

ถ้าระบบเลือกใช้คำว่า `purchase` แล้ว  
ไม่ควรมีบางไฟล์ใช้ `purchase-request`, บางไฟล์ใช้ `procurement`, บางไฟล์ใช้ `pr` โดยไม่มีเหตุผลชัด

## 2.3 คนอ่านต้องเดา purpose ได้จากชื่อ

เช่น

- `PurchaseRequestForm`
- `usePurchaseRequestListQuery`
- `purchase.repository.ts`
- `mapPurchaseRequestDtoToDetailModel`

อ่านชื่อแล้วต้องพอเดาได้ว่าไฟล์/ฟังก์ชันนี้ทำอะไร

## 2.4 naming ต้องสะท้อน ownership

ชื่อควรบอกว่ามันเป็นของใคร เช่น

- shared layer
- module layer
- page
- section
- service
- mapper
- dto/model/form

## 2.5 อย่าตั้งชื่อแบบ “เผื่ออนาคต” จนกำกวม

เช่น

- `CommonData`
- `BaseThing`
- `GeneralHelper`
- `Manager`
- `Handler`

ถ้าชื่อไม่บอก purpose จริง จะทำให้ codebase อ่านยากมากเมื่อระบบโตขึ้น

---

## 3. Character & Case Rules

## 3.1 Route Paths

ใช้ **lowercase + kebab-case เมื่อมีหลายคำ**

ตัวอย่าง

- `/dashboard`
- `/purchase/create`
- `/finance/profit-loss`
- `/admin/master/items`

## 3.2 Folder Names

ใช้ **lowercase** และถ้าหลายคำใช้ **kebab-case** เมื่อเหมาะสม

ตัวอย่าง

- `components`
- `contexts`
- `purchase`
- `profit-loss`

## 3.3 File Names

ขึ้นกับชนิดของไฟล์

- React component files -> `PascalCase.tsx`
- hooks -> `camelCase` ที่ขึ้นต้นด้วย `use`
- utility/config/service/type files -> `kebab-case` หรือ `<module>.<suffix>.ts` ตาม pattern ของระบบ

## 3.4 TypeScript Types / Components / Context Names

ใช้ **PascalCase**

ตัวอย่าง

- `PurchaseRequestDto`
- `PurchaseRequestFormModel`
- `WarehouseStockTable`
- `RoleContext`

## 3.5 Functions / Hooks / Variables

ใช้ **camelCase**

ตัวอย่าง

- `mapPurchaseRequestDtoToModel`
- `useWarehouseStockListQuery`
- `createAppTheme`

---

## 4. Route Naming Rules

route เป็น navigation layer  
ต้องสั้น อ่านง่าย และไม่ใช้แทน permission model

### baseline routes

```text
/login
/access

/dashboard

/farm
/farm/entry
/farm/overview
/farm/stock
/farm/feed
/farm/health

/production
/production/open

/warehouse
/warehouse/receive
/warehouse/transfer
/warehouse/issue
/warehouse/adjust

/purchase
/purchase/create
/purchase/[id]

/project
/project/request
/project/orders
/project/[id]

/sales
/sales/orders
/sales/deliveries
/sales/weighing
/sales/invoices

/finance
/finance/costing
/finance/closing
/finance/profit-loss

/insight
/insight/reports
/insight/analytics
/insight/alerts

/approvals
/approvals/[id]

/admin
/admin/user-assignment
/admin/user-assignment?tab=user
/admin/user-assignment?tab=role
/admin/user-assignment?tab=permission-pool
/admin/master
/admin/master/items
/admin/master/partners
/admin/master/facility
/admin/master/uoms
/admin/master/categories
/admin/master/rules
/admin/docs
/admin/docs/[id]
/admin/settings
/admin/settings/system
/admin/settings/integration
/admin/settings/audit
```

### route naming rules

- ใช้ lowercase
- ใช้คำสั้นที่สื่อ domain
- อย่าใส่ business verbs ยาวเกินจำเป็น
- อย่าใช้ route path เป็น permission code
- route path เปลี่ยนได้ แต่ควรพยายามคงเสถียร

### ตัวอย่างที่แนะนำ

- `master-data` -> ไม่ใช้
- `master` -> ใช้
- `documents` -> ไม่ใช้
- `docs` -> ใช้
- `system-settings` -> ไม่ใช้
- `settings` -> ใช้

---

## 5. Module Naming Rules

module names เป็น owner ของ business logic  
ควรนิ่งกว่า route และ menu

### baseline module names

- `auth`
- `access`
- `farm`
- `master`
- `purchase`
- `warehouse`
- `production`
- `health`
- `maintenance`
- `sales`
- `finance`
- `insight`
- `approval`
- `document`
- `setting`

### rules

- ใช้ lowercase
- ใช้คำเดียวเมื่อเป็นไปได้
- เลือกคำกลางของ domain
- อย่าใช้คำย่อที่เฉพาะทีมเกินไป
- อย่าใช้ route เป็นตัวบังคับชื่อ module เสมอไป

### ตัวอย่าง

route `/project/...` แต่ module owner คือ `maintenance` ได้  
ถ้าทาง business ownership เป็นแบบนั้นจริง

---

## 6. Folder Naming Rules

## 6.1 Top-Level Folders

```text
app
components
contexts
hooks
lib
modules
theme
types
utils
```

ทั้งหมดใช้ lowercase

## 6.2 Module Internal Folders

```text
pages
components
hooks
services
mocks
types
utils
contexts
```

ทั้งหมดใช้ lowercase  
และ `components/` ให้เป็น flat folder (ไม่ซ้อน `components/<subfolder>/...` เป็น baseline)

## 6.3 Optional Nested Folders

ใช้ lowercase หรือ kebab-case เมื่อหลายคำ เช่น

- `query-keys`
- `state-components`
- `adapters`
- `constants`

หมายเหตุ:

- รายการนี้เป็น option สำหรับโฟลเดอร์ประเภทอื่นหรือกรณีพิเศษเท่านั้น
- สำหรับ `src/features/<module>/components/` ให้ใช้การตั้งชื่อไฟล์ที่ชัดแทนการซ้อนโฟลเดอร์
- ถ้าต้องการจัดกลุ่ม component เพิ่ม ให้ใช้ชื่อไฟล์นำหน้าด้วย domain/purpose แทนการสร้าง subfolders

---

## 7. Page Naming Rules

page components ของ module ใช้ **PascalCase** และ suffix `Page`

### ตัวอย่าง

- `PurchaseCreatePage.tsx`
- `WarehouseStockPage.tsx`
- `FinanceClosingPage.tsx`
- `ApprovalDetailPage.tsx`

### rules

- ชื่อ page ต้องสื่อ use case หรือหน้าที่
- ถ้ามีหลาย page ใน module เดียว ให้ใช้ศัพท์ที่ชัด เช่น `List`, `Detail`, `Create`, `Edit`, `Summary`
- อย่าตั้งกว้างเกินไป เช่น `PurchasePage.tsx` ถ้ามันจริง ๆ คือหน้า create

### route entry page

ใน `src/app/.../page.tsx` ให้คงชื่อไฟล์ตาม Next.js คือ `page.tsx`  
แต่ component จริงควร import จาก module page ที่ชื่อชัด

---

## 8. Component Naming Rules

React components ใช้ **PascalCase**

## 8.1 Shared Components

ควรใช้ชื่อ generic ที่บอกหน้าที่ชัด เช่น

- `PageContainer`
- `PageToolbar`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `ConfirmDialog`
- `DataTableShell`
- `FormActionBar`
- `ChartShell`

## 8.2 Module Components

ควรสะท้อน domain และ purpose

### naming formula (บังคับใช้)

`ModuleName + Purpose + Suffix`

ตัวอย่าง:

- `AccessUserTable`
- `AccessRolePermissionDialog`
- `WarehouseStockFilterSection`
- `PurchaseRequestSummaryCard`

ห้ามใช้ชื่อที่หลุด domain owner เช่น

- อยู่ module `access` แต่ตั้ง `UsersTable.tsx` (กำกวม)  
  ให้ใช้ `AccessUserTable.tsx`
- อยู่ module `approval` แต่ตั้ง `RequestsList.tsx` (ไม่บอก domain)  
  ให้ใช้ `ApprovalRequestListTable.tsx`

### examples

- `WarehouseStockTable`
- `WarehouseStockFilterSection`
- `PurchaseRequestForm`
- `PurchaseRequestSummarySection`
- `FinanceClosingStatusCard`
- `ApprovalHistorySection`

## 8.3 Component Suffix Recommendations

### `Page`

ใช้กับ page components

- `WarehouseStockPage`

### `Section`

ใช้กับ page sections

- `WarehouseStockTableSection`

### `Table`

ใช้กับ business table

- `ApprovalInboxTable`

### `Form`

ใช้กับ business form

- `PurchaseRequestForm`

### `Dialog`

ใช้กับ modal/dialog

- `DeleteConfirmDialog`

### `Drawer`

ใช้กับ side panel

- `NotificationPanelDrawer` หรือ `NotificationPanel`

### `Card`

ใช้กับ card-based display unit

- `FinanceSummaryCard`

### `Chart`

ใช้กับ chart components

- `ProfitLossChart`

### `State`

ใช้กับ state-specific components

- `AccessDeniedState`

---

## 9. Hook Naming Rules

hooks ใช้ **camelCase** และขึ้นต้นด้วย `use` เสมอ

### pattern ที่บังคับใช้

#### module page hooks

`use + <Module> + <PagePurpose> + Page`

ตัวอย่าง

- `usePurchaseCreatePage`
- `useWarehouseStockPage`
- `useAccessUserListPage`

#### module query hooks (React Query)

`use + <Module> + <ResourcePurpose> + Query`

ตัวอย่าง

- `useWarehouseStockListQuery`
- `usePurchaseRequestDetailQuery`
- `useApprovalInboxSummaryQuery`

#### module mutation hooks (React Query)

`use + <Module> + <Action> + <ResourcePurpose> + Mutation`

ตัวอย่าง

- `usePurchaseCreateRequestMutation`
- `useWarehouseAdjustStockMutation`
- `useApprovalApproveRequestMutation`

#### shared utility hooks (`src/hooks/`)

`use + <Purpose>`

ตัวอย่าง

- `useConnectivity`
- `useCurrentBreakpoint`

### rules

- hooks ใน `src/features/<module>/hooks/` ต้องมี `<Module>` ในชื่อเสมอ
- hooks ที่ห่อ `useQuery` ต้องลงท้าย `Query`
- hooks ที่ห่อ `useMutation` ต้องลงท้าย `Mutation`
- page hooks ต้องลงท้าย `Page`
- อย่าตั้งชื่อกว้างเกินไป เช่น `useData`, `useThing`, `useHandler`
- อย่าใช้ชื่อ resource ลอย ๆ แบบไร้ domain owner เช่น `useUsersListQuery` (ถูกต้อง: `useAccessUserListQuery`)

---

## 10. Service / Repository / API / Mock Naming Rules

service layer ใช้ pattern `<module>.<suffix>.ts`

### baseline files

- `purchase.api.ts`
- `purchase.repository.ts`
- `purchase.service.ts`
- `purchase.mock.ts`

### function naming

#### API functions

ใช้ pattern `verb + Module + ResourcePurpose + Api`

- `getWarehouseStockListApi`
- `getPurchaseRequestDetailApi`
- `createPurchaseRequestApi`
- `deleteWarehouseAdjustApi`

#### Repository functions

ใช้ pattern `verb + Module + ResourcePurpose + Repository`

- `getWarehouseStockListRepository`
- `createPurchaseRequestRepository`

#### Service functions

ใช้ pattern `verb + Module + ResourcePurpose + Service`

- `getWarehouseStockListService`
- `createPurchaseRequestService`

#### Mock functions

ใช้ pattern `verb + Module + ResourcePurpose + Mock`

- `getWarehouseStockListMock`
- `createPurchaseRequestMock`

### rules

- ใช้ action verb ที่ชัด เช่น `get`, `create`, `update`, `delete`, `approve`, `reject`, `sync`
- อย่าตั้งชื่อ generic เกินไป เช่น `fetchDataApi`
- ต้องรู้จากชื่อว่ามาจาก module ไหนและทำกับ resource อะไร
- คง pattern เดียวทั้งระบบ

---

## 11. Type File Naming Rules

type files ใช้ pattern ชัดเจนตาม purpose

### recommended patterns

- `<module>.<suffix>.ts`
- `<module>-<resource-purpose>.<suffix>.ts`

โดย `suffix` จำกัดที่ `dto`, `model`, `form`, `query`, `draft`

### examples

- `warehouse.dto.ts`
- `warehouse.model.ts`
- `warehouse.form.ts`
- `warehouse.query.ts`
- `warehouse.draft.ts`

### rules

- อย่ากองทุก type ไว้ใน `types.ts` เดียว
- อย่าตั้งชื่อไฟล์กว้างเกินไป เช่น `models.ts` ถ้าเป็นของ module ใหญ่
- type file ใน module ต้องมี module prefix เสมอ
- ถ้าต้องแตกย่อย ใช้คำ domain เพิ่มได้ เช่น
  - `purchase-request.dto.ts`
  - `approval-history.model.ts`

---

## 12. Type Naming Rules

types ใช้ **PascalCase**

### DTO

suffix `Dto`

- `PurchaseRequestDto`
- `WarehouseStockItemDto`

### Model

suffix `Model`

- `PurchaseRequestDetailModel`
- `NotificationItemModel`

### Form Model

suffix `FormModel`

- `PurchaseRequestFormModel`
- `FinanceClosingFormModel`

### Query Types

suffix ตาม purpose

- `WarehouseStockListQueryParams`
- `PaginationState`
- `SortState`

### Draft Types

suffix `DraftModel` หรือ `DraftPayload`

- `PurchaseRequestDraftModel`
- `WarehouseAdjustDraftPayload`

---

## 13. Mapper Naming Rules

mapper functions ต้องบอกทิศทางและ purpose ชัด

### recommended patterns

- `map<Module><ResourcePurpose>DtoTo<ModelPurpose>Model`
- `map<Module><ResourcePurpose>FormModelTo<DtoPurpose>Dto`
- `map<Module><ResourcePurpose>DraftTo<FormPurpose>FormModel`
- `map<Module><SourcesPurpose>SourcesTo<ModelPurpose>Model`

### examples

- `mapWarehouseStockItemDtoToModel`
- `mapPurchaseRequestDtoToDetailModel`
- `mapPurchaseRequestFormModelToCreateDto`
- `mapPurchaseRequestDraftToFormModel`
- `mapApprovalSourcesToDetailModel`

### mapper files

- `warehouse.mapper.ts`
- `purchase.mapper.ts`
- `approval.mapper.ts`

### rules

- อย่าตั้งชื่อแค่ `mapData`
- อย่าซ่อน direction ของการแปลง
- mapper ใน module ต้องระบุ module context ในชื่อ function
- ถ้ามีหลาย mapper ในไฟล์เดียว ให้ function names ต้องชัดมากพอ

---

## 14. Context / Provider Naming Rules

ระบบนี้กำหนดชัดว่า shared app-level contexts อยู่ใน `src/contexts/`

### file naming

ใช้ **PascalCase** และให้ชื่อสื่อ owner / responsibility ชัดเจน

- `RoleContext.tsx`
- `ShellContext.tsx`
- `ThemeContext.tsx`

### exports

ในแต่ละไฟล์ควรมีอย่างน้อย

- `XxxContext`
- `XxxProvider`
- `useXxx`

### examples

- `RoleContext`, `AccessGuard`
- `ShellContext`, `ShellProvider`, `useShell`
- `ThemeContext`, `ThemeProvider`, `useTheme`

### note

- auth/session bootstrap และ access bootstrap ใน codebase ปัจจุบันอยู่ใน guard/runtime flow ไม่ได้อยู่ใน standalone auth/access context files
- ถ้าจะเพิ่ม compatibility wrapper ให้ตั้งชื่อให้สื่อว่าเป็น legacy และไม่ควรเป็น owner หลักของ state ใหม่

### rules

- ไฟล์ context ต้องไม่ใช้ชื่อ generic เช่น `context.tsx`
- provider ต้องไม่ใช้ชื่อหลวม ๆ เช่น `ProviderWrapper`
- shared app-level providers ต้องไม่กระจายไปหลายโฟลเดอร์

---

## 15. Env Naming Rules

env variables ใช้ **UPPER_SNAKE_CASE**

## 15.1 Global Baseline

```env
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_HTTP_TIMEOUT_MS=15000
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_ENABLE_MOCK_BADGE=true
NEXT_PUBLIC_ENABLE_PWA=false
```

## 15.2 Module Override Naming

ใช้ pattern

```env
NEXT_PUBLIC_<MODULE>_DATA_SOURCE
```

### examples

```env
NEXT_PUBLIC_ACCESS_DATA_SOURCE=api
NEXT_PUBLIC_FARM_DATA_SOURCE=mock
NEXT_PUBLIC_MASTER_DATA_SOURCE=api
NEXT_PUBLIC_PURCHASE_DATA_SOURCE=mock
NEXT_PUBLIC_WAREHOUSE_DATA_SOURCE=api
NEXT_PUBLIC_PRODUCTION_DATA_SOURCE=api
NEXT_PUBLIC_HEALTH_DATA_SOURCE=mock
NEXT_PUBLIC_MAINTENANCE_DATA_SOURCE=api
NEXT_PUBLIC_SALES_DATA_SOURCE=api
NEXT_PUBLIC_FINANCE_DATA_SOURCE=mock
NEXT_PUBLIC_INSIGHT_DATA_SOURCE=mock
NEXT_PUBLIC_APPROVAL_DATA_SOURCE=api
NEXT_PUBLIC_DOCUMENT_DATA_SOURCE=api
NEXT_PUBLIC_SETTING_DATA_SOURCE=api
```

### rules

- ใช้ prefix `NEXT_PUBLIC_` เฉพาะตัวที่ frontend ต้องเห็น
- ใช้คำ module ให้ตรงกับ module names ของระบบ
- อย่าใช้ชื่อ env สองแบบสำหรับ concept เดียวกัน

---

## 16. Config / Helper Naming Rules

config helpers ควรตั้งชื่อให้บอก purpose ชัด

### examples

- `getAppConfig`
- `resolveModuleDataSource`
- `createAppTheme`
- `buildPageSizeOptions`
- `formatDateOrDash`

### rules

- function ที่คืนค่า config ใช้ `get...`
- function ที่คำนวณ/resolve ใช้ `resolve...`
- function ที่สร้าง object ใช้ `create...`
- function ที่ format ใช้ `format...`
- function ที่ map ใช้ `map...`

---

## 17. Query Key Helper Naming Rules

แต่ละ module ควรมี query key helper ของตัวเอง

### file naming

- `warehouse.query-keys.ts`
- `purchase.query-keys.ts`

### exported object naming

ใช้ `<module>QueryKeys`

### examples

- `warehouseQueryKeys`
- `purchaseQueryKeys`
- `financeQueryKeys`

### object shape

```ts
export const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  stock: ['warehouse', 'stock'] as const,
  stockList: (params: WarehouseStockListQueryParams) =>
    ['warehouse', 'stock', 'list', params] as const,
};
```

### rules

- key helper object ต้องเป็น noun ชัด
- อย่าตั้งชื่อแค่ `queryKeys`
- ใส่ namespace ของ module ในชื่อเสมอ

---

## 18. Permission Naming Rules

permission constants ควรอยู่ module utils และใช้ชื่อ object แบบ `<module>Permissions`

### file naming

- `warehouse.permissions.ts`
- `purchase.permissions.ts`

### examples

```ts
export const warehousePermissions = {
  viewStock: 'warehouse.material_stock.view',
  adjustStock: 'warehouse.stock_adjustment_request.manage',
  transferStock: 'warehouse.stock_issue_request.manage',
} as const;
```

### rules

- object name ใช้ camelCase
- field name ใช้ verb + resource หรือ action-friendly naming
- string value ต้องตรง canonical permission code จาก backend
- อย่ากระจาย permission strings ดิบทั่วหน้า

---

## 19. Mock / Seed / Fixture / Factory Naming Rules

## 19.1 Mock Entry Files

- `warehouse.mock.ts`
- `purchase.mock.ts`

## 19.2 Seed Files

ใช้ suffix `.seed.ts`

### examples

- `warehouse-stock.seed.ts`
- `purchase-request.seed.ts`
- `notification.seed.ts`

## 19.3 Fixture Files

ใช้ suffix `.fixture.ts`

### examples

- `warehouse-stock.empty.fixture.ts`
- `purchase-request.pending.fixture.ts`
- `approval-history.rejected.fixture.ts`

## 19.4 Factory Files

ใช้ suffix `.factory.ts`

### examples

- `warehouse-stock.factory.ts`
- `notification.factory.ts`

### rules

- ชื่อไฟล์ต้องสื่อ state/use case ชัด
- อย่าตั้งชื่อ generic เช่น `data.fixture.ts`
- ใช้ศัพท์เดียวกับ domain ของ module

---

## 20. Shared Component Naming Rules

shared components ต้องใช้ชื่อ generic ที่อ่านแล้วไม่ผูกกับ domain

### good examples

- `PageContainer`
- `PageToolbar`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `ConfirmDialog`
- `DataTableShell`
- `ChartShell`
- `FilterBar`

### bad examples

- `PurchaseLikeTable` ใน shared layer
- `FinanceCardBase` ใน shared layer
- `WarehouseWidget` ใน shared layer

---

## 21. Shell Component Naming Rules

shell components อยู่ shared layer และใช้ชื่อชัดเจนตาม role ของ shell

### examples

- `AppShell`
- `Sidebar`
- `SidebarNavigation`
- `NotificationBell`
- `NotificationPanelHost`
- `UserPanel`
- `MainContent`
- `PageContainer`
- `PageToolbar`

### rules

- ชื่อบอก ownership เชิง shell ชัด
- ไม่ใช้ชื่อกว้างเกินไป เช่น `LayoutMain`
- อย่าผสมศัพท์ business domain เข้ามาใน shell component names

---

## 22. Abbreviation Rules

ระบบนี้ยอมให้ย่อคำได้เมื่อเป็นคำที่คนทั้งทีมเดาได้ง่ายและคงที่

### allowed / preferred

- `docs`
- `settings`
- `uoms`
- `api`
- `dto`

### ใช้ด้วยความระวัง

- `cfg`
- `mgr`
- `svc`
- `util`

### rules

- ถ้าคำย่อทำให้คนอ่านใหม่เดาไม่ได้ อย่าใช้
- ชื่อ file/function/component ควรอ่านได้ชัดมากกว่าประหยัดตัวอักษร

---

## 23. Anti-Patterns ที่ห้ามทำ

- ตั้งชื่อกว้าง ๆ เช่น `data.ts`, `helper.ts`, `manager.ts`, `common.ts`
- ใช้ชื่อคนละคำสำหรับ concept เดียวกัน เช่น `purchase`, `procurement`, `pr`
- route ใช้คำยาวเกินจำเป็น
- component ชื่อไม่บอก role เช่น `Section1`, `CustomBox`
- hook ชื่อไม่ขึ้นต้น `use`
- mapper ชื่อไม่บอกทิศทาง
- type files กองรวมกันใน `types.ts`
- context/provider ตั้งชื่อไม่คงที่
- env variables ใช้ชื่อไม่ตรงกับ module names
- file naming ปนกันทั้ง camelCase, snake_case, kebab-case แบบไร้ระบบ

---

## 24. Example Naming Matrix

| Concern             | Pattern                        | Example                           |
| ------------------- | ------------------------------ | --------------------------------- |
| Route               | lowercase / kebab-case         | `/finance/profit-loss`            |
| Module              | lowercase                      | `warehouse`                       |
| Page component      | `PascalCase + Page`            | `WarehouseStockPage`              |
| Section component   | `PascalCase + Section`         | `WarehouseStockTableSection`      |
| Form component      | `PascalCase + Form`            | `PurchaseRequestForm`             |
| Table component     | `PascalCase + Table`           | `ApprovalInboxTable`              |
| Dialog component    | `PascalCase + Dialog`          | `DeleteConfirmDialog`             |
| Drawer component    | `PascalCase + Drawer/Panel`    | `NotificationPanel`               |
| Hook                | `use + Module + Purpose + Query/Mutation/Page` | `useWarehouseStockListQuery`      |
| API function        | `verb + Module + Resource + Api`               | `getWarehouseStockListApi`        |
| Repository function | `verb + Module + Resource + Repository`        | `getWarehouseStockListRepository` |
| Service function    | `verb + Module + Resource + Service`           | `getWarehouseStockListService`    |
| Mock function       | `verb + Module + Resource + Mock`              | `getWarehouseStockListMock`       |
| DTO type            | `PascalCase + Dto`             | `WarehouseStockItemDto`           |
| Model type          | `PascalCase + Model`           | `NotificationItemModel`           |
| Form type           | `PascalCase + FormModel`       | `FinanceClosingFormModel`         |
| Context file        | `PascalCase + Context.tsx`     | `ThemeContext.tsx`                |
| Provider export     | `PascalCase + Provider`        | `ThemeProvider`                   |
| Env variable        | `UPPER_SNAKE_CASE`             | `NEXT_PUBLIC_DATA_SOURCE`         |
| Query key helper    | `<module>QueryKeys`            | `warehouseQueryKeys`              |
| Permission object   | `<module>Permissions`          | `warehousePermissions`            |

---

## 25. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **กติกาการตั้งชื่อของทั้งระบบ**

### `02_frontend_architecture.md`

กำหนดว่าอะไรอยู่ตรงไหน

### `05_frontend_type-guidelines.md`

กำหนด categories ของ types

### `06_frontend_mapper-guidelines.md`

กำหนด pattern ของ mapper naming และ placement

### `08_frontend_mock-usage.md`

กำหนด env/source naming และ mock file naming

### `09_frontend_component-guidelines.md`

กำหนด naming ของ page/section/dialog/table/form/chart components

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 26. Summary

สรุปสาระสำคัญที่สุดของ `10_frontend_naming-conventions.md` คือ

- ระบบนี้ใช้ naming แบบสั้น ชัด และคงที่
- route ใช้ lowercase และใช้คำกลางของ domain
- module names ต้องนิ่งกว่า route
- page/component/type/context names ใช้ PascalCase ตาม role ที่ชัด
- hooks ใช้ camelCase และขึ้นต้นด้วย `use`
- service/repository/api/mock functions ต้องบอก role ชัดในชื่อ
- type files ต้องใช้ suffix ตาม category เช่น `.dto.ts`, `.model.ts`, `.form.ts`
- mapper ต้องบอก direction ของการแปลง
- context files ต้องใช้ `XxxContext.tsx` และ export `XxxProvider`
- env variables ต้องตั้งแบบเป็นระบบ และ module overrides ต้องอิง module names จริง
- shared layer ห้ามใช้ชื่อที่ผูกกับ business domain
- หลีกเลี่ยงชื่อกว้าง ๆ หรือชื่อที่เดา purpose ไม่ได้
- naming ที่ดีช่วยให้ทั้ง architecture, refactorability และ onboarding ของทีมดีขึ้นอย่างมาก
