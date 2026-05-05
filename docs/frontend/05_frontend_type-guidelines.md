# 05_frontend_type-guidelines.md

# Frontend Type Guidelines

ไฟล์นี้กำหนดกติกา type system ของ Frontend เพื่อให้แต่ละชั้นใช้ type ถูกบทบาทและ refactor ได้ปลอดภัย

ขอบเขตหลักของไฟล์นี้คือ

- การแยก DTO / Model / FormModel
- type placement (module vs shared)
- type ที่เกี่ยวกับ query/filter/pagination/access/integration/persistence
- กติกา reuse type vs create type ใหม่
- naming ของ type files และ type aliases

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อให้ทีมตัดสินใจเรื่อง type เหมือนกันทั้งระบบ

- UI ใช้ type อะไร และห้ามรับ DTO ตรงที่จุดไหน
- form ต้องมี FormModel แยกเมื่อไร
- type ใดควรอยู่ใน module และ type ใดค่อยย้าย shared
- query/filter/sort/pagination ควรแยกเป็นประเภทไหน
- สถานะ access/notification/integration/draft/queue ควรนิยามอย่างไร
- naming และ placement ของ type files ต้องเป็นแบบไหน

ไฟล์นี้ไม่ลงลึก flow การเรียก API แต่เป็นฐานนิยามข้อมูลที่ทุก flow ต้องอ้างร่วมกัน

### อ่านต่อ

- โครงสร้างโฟลเดอร์และ placement -> `02_frontend_architecture.md`
- auth/access concepts -> `04_frontend_auth-access.md`
- mapping rules -> `06_frontend_mapper-guidelines.md`
- API flow -> `07_frontend_api-usage.md`
- naming conventions -> `10_frontend_naming-conventions.md`

---

## 2. Type Principles

## 2.1 ห้ามใช้ DTO ตรงใน UI

DTO คือ shape ของข้อมูลจาก backend  
UI ไม่ควร render DTO ตรง เพราะจะทำให้

- field naming จาก backend รั่วเข้า component
- null/optional handling กระจัดกระจาย
- format/label/business meaning ไปอยู่ใน UI
- แก้ backend contract ทีเดียวกระทบหลายหน้า

## 2.2 Model คือ data shape ที่ UI ใช้จริง

Model คือ type ที่ถูก normalize แล้ว และพร้อมให้ UI ใช้งาน  
ต้องตอบโจทย์ว่า

- ชื่อ field อ่านง่าย
- มี fallback/normalization แล้ว
- relationship ของข้อมูลชัด
- ใช้งานใน component ได้ตรง mental model ของหน้าจอ

## 2.3 FormModel ไม่ใช่ DTO

ฟอร์มมักมีความต้องการคนละแบบกับทั้ง DTO และ display model เช่น

- ต้องมี string สำหรับ input
- ต้องมี optional fields ตาม UX
- ต้องมี nested states สำหรับ form sections
- ต้องรองรับ draft state

ดังนั้น form ไม่ควรใช้ DTO ตรง และไม่จำเป็นต้องใช้ display model ตรงเสมอไป

## 2.4 Type ต้องมี owner ชัดเจน

ถ้า type เป็นของ business domain ชัดเจน ควรอยู่ใน module นั้น  
ถ้า type ใช้ข้ามทั้งระบบจริง และไม่มี owner เฉพาะ ค่อยอยู่ shared layer

## 2.5 สร้าง type ใหม่เมื่อ meaning เปลี่ยน

แม้ shape จะคล้ายกัน แต่ถ้า meaning เปลี่ยน ก็ควรแยก type เช่น

- PurchaseRequestDto
- PurchaseRequestListItemModel
- PurchaseRequestDetailModel
- PurchaseRequestFormModel
- PurchaseRequestDraftModel

shape อาจคล้ายกันบางส่วน แต่ purpose ต่างกัน

---

## 3. Type Categories ของระบบนี้

type ในระบบนี้แบ่งเป็นหมวดหลัก ๆ ดังนี้

1. DTO
2. Model
3. FormModel
4. Query/Filter/Pagination types
5. Access/Auth types
6. Notification / Alert / Sync / Integration types
7. Persistence / Draft / Queue types
8. Shared technical types

---

## 4. DTO คืออะไร

DTO คือ Data Transfer Object จาก backend/API/mock source

### ลักษณะของ DTO

- field naming ตาม backend contract
- nullable ตาม backend จริง
- อาจมี nested shape ตาม transport
- อาจมี raw enums / codes
- อาจยังไม่พร้อมใช้ใน UI โดยตรง

### DTO ใช้ที่ไหน

- api layer
- service orchestration boundary
- mock DTO files เฉพาะกรณี storybook/test harness
- mapper input

### DTO ไม่ควรใช้ที่ไหน

- page components
- business sections
- tables/forms/charts
- shared UI components

### ตัวอย่าง

```ts
export type WarehouseStockItemDto = {
  item_id: string;
  item_name: string | null;
  warehouse_id: string | null;
  qty_on_hand: number | null;
  uom_code: string | null;
  is_blocked: boolean | null;
  updated_at: string | null;
};
```

---

## 5. Model คืออะไร

Model คือ type ที่ mapper แปลงแล้ว และพร้อมให้ UI ใช้งานจริง

### ลักษณะของ Model

- field naming สอดคล้องกับ frontend
- fallback / normalize แล้ว
- type shape ตรงกับสิ่งที่ page/component ต้องใช้
- business meaning ชัดกว่า DTO

### Model ใช้ที่ไหน

- service output
- hooks
- pages
- business components
- charts/tables/cards/forms ที่ใช้ display data

### ตัวอย่าง

```ts
export type WarehouseStockItemModel = {
  itemId: string;
  itemName: string;
  warehouseId: string | null;
  quantityOnHand: number;
  uomCode: string;
  isBlocked: boolean;
  updatedAtLabel: string;
};
```

---

## 6. FormModel คืออะไร

FormModel คือ type ที่ใช้กับ React Hook Form และ UI input state

### ลักษณะของ FormModel

- field types ตรงกับ input behavior
- อาจใช้ string สำหรับ numeric/date inputs ในบางกรณี
- อาจมี field เพิ่มเพื่อช่วย UX
- ไม่ควรถูกบังคับตาม DTO แบบตรงตัว

### FormModel ใช้ที่ไหน

- form hooks
- validation schema
- form components
- draft state

### ตัวอย่าง

```ts
export type PurchaseRequestFormModel = {
  requestDate: string;
  vendorId: string;
  reason: string;
  items: {
    itemId: string;
    quantity: string;
    note: string;
  }[];
};
```

---

## 7. ทำไมต้องแยก DTO / Model / FormModel

ตัวอย่าง use case:

### API ส่ง field มาไม่ตรงกับ UI

DTO:

```ts
{
  req_date: string | null;
  vendor_id: string | null;
}
```

UI อยากใช้:

```ts
{
  requestDate: string;
  vendorId: string;
}
```

### API ส่ง field มาไม่ครบ

DTO:

```ts
{
  item_name: string | null;
}
```

Model:

```ts
{
  itemName: dto.item_name ?? '-';
}
```

### UI ต้องประกอบข้อมูลจากหลาย API

Model อาจไม่ได้มี owner เป็น DTO ตัวเดียว  
แต่เกิดจากหลาย DTO ผ่าน service/mappers

### Form ต้องเก็บ string input

DTO:

```ts
qty: number | null;
```

FormModel:

```ts
quantity: string;
```

ดังนั้น 3 type นี้มี purpose คนละแบบ และไม่ควรรวมเป็นตัวเดียว

### 2.6 ไฟล์ type เหล่านี้ไม่จำเป็นต้องมีทุก module

ทำแค่เท่าที่มีประโยชน์จริง ไม่ต้องสร้างไฟล์เพราะ pattern ดูสวยอย่างเดียว

- `dto.ts` ใช้เมื่อ backend/API contract ไม่ตรงกับสิ่งที่ UI ใช้จริง
- `model.ts` ใช้เมื่อ UI ต้องการ shape ที่ normalize แล้วหรือแตกต่างจาก DTO
- `form.ts` ใช้เมื่อ module นั้นมี form state หรือ form UX แยกจาก DTO/model
- `mapper.ts` ใช้เมื่อมี transformation จริงระหว่าง DTO / Model / Form
- `permissions.ts` ไม่ควรเป็นไฟล์มาตรฐานของ module เพราะ permission truth ควรอยู่ใน guard กลาง เช่น `src/lib/access/modules/*.guard.ts`

ถ้า module ใดไม่ต้องแยก shape หรือ transformation เพิ่ม ก็ให้เก็บ type ไว้เฉพาะที่ใช้งานจริง ไม่จำเป็นต้องสร้างไฟล์แยกทุกตัว

---

## 8. Type Placement Strategy

## 8.1 Module Types

ถ้า type เป็นของ business domain ชัดเจน ให้อยู่ใน

```text
src/features/<module>/types/
```

> `types/` เป็น optional ต่อ module ไม่ได้บังคับว่าทุก module ต้องมีครบทุกไฟล์

ตัวอย่างไฟล์

```text
purchase.dto.ts
purchase.model.ts
purchase.form.ts
purchase.query.ts
purchase.draft.ts
```

## 8.2 Shared Types

ถ้า type ใช้ข้ามหลาย module จริง และไม่มี owner ชัดเจน ให้อยู่ใน

```text
src/types/
```

เช่น

- ApiErrorShape
- PaginationMeta
- SortDirection
- DateRangeValue
- SelectOption

## 8.3 Access/Auth Types

มี 2 ทางที่ใช้ได้ แต่เอกสารชุดนี้แนะนำแบบนี้

- auth/access business types ที่เป็นส่วนหนึ่งของ domain -> อยู่ใน `src/features/auth/types/` (หรือ feature owner ที่เกี่ยวข้อง)
- shared aliases หรือ technical generic ที่ใช้ทั้งระบบ -> อยู่ `src/types/` ได้เมื่อจำเป็น

### baseline ที่แนะนำ

ให้ type หลักของ access อยู่กับ owner ที่ใช้จริงในโปรเจกต์ (เช่น `src/features/auth/types/`) ก่อน  
ถ้าข้ามหลาย feature ค่อยย้ายขึ้น `src/types/`

---

## 9. Recommended Type File Structure

ตัวอย่างโครงภายใน module เมื่อ module นั้นต้องแยก type files จริง

```text
src/features/warehouse/types/
├── warehouse.dto.ts
├── warehouse.model.ts
├── warehouse.form.ts
├── warehouse.query.ts
├── warehouse.draft.ts
└── index.ts
```

### ความหมายของแต่ละไฟล์

#### `warehouse.dto.ts`

DTO ทั้งหมดของ module warehouse

#### `warehouse.model.ts`

display models / section models / page models

#### `warehouse.form.ts`

form-related models

#### `warehouse.query.ts`

filter/query/pagination/sort types

#### `warehouse.draft.ts`

local draft / queue item types ของ module นั้น

---

## 10. DTO Guidelines

## 10.1 DTO ต้องสะท้อน backend จริง

อย่าดัด field naming ของ DTO ให้สวยขึ้น  
เพราะ DTO มีหน้าที่เป็น contract layer

## 10.2 DTO ควรใช้เฉพาะใน service/api/mapper zone

ไม่ควรถูก import ไปใช้ใน components/presentational layers

## 10.3 Mock path ต้องใช้ DTO shape เดียวกับ API

เพื่อให้ mapping path เหมือนกัน

### ตัวอย่าง

```ts
export type PurchaseRequestDto = {
  request_id: string;
  request_no: string | null;
  request_date: string | null;
  vendor_id: string | null;
  status_code: string | null;
};
```

---

## 11. Model Guidelines

## 11.1 Model ต้องตอบโจทย์หน้าจอ

model ควรสะท้อนสิ่งที่ UI ต้องใช้จริง เช่น

- labels
- grouped data
- flags สำหรับ render
- normalized dates/numbers
- computed summary fields เมื่อเหมาะสม

## 11.2 Model อาจมีมากกว่า 1 แบบต่อ domain เดียว

เช่น

- `PurchaseRequestListItemModel`
- `PurchaseRequestDetailModel`
- `PurchaseRequestSummaryModel`
- `PurchaseRequestApprovalModel`

เพราะหน้าที่ใช้ต่างกัน

## 11.3 อย่ายัดทุกอย่างลง model เดียว

ถ้า model ใหญ่เกินไป หน้าอื่นจะเริ่มพึ่ง field ที่ไม่ควรพึ่ง

---

## 12. FormModel Guidelines

## 12.1 FormModel ต้องออกแบบเพื่อ form UX

ไม่ใช่เพื่อเอาใจ backend contract

## 12.2 FormModel อาจมี derived fields ได้

เช่น

- temporary display strings
- toggle states
- optional note fields
- field arrays

## 12.3 Validation schema ต้องผูกกับ FormModel

โดยเฉพาะเมื่อใช้ RHF + Zod

### ตัวอย่าง

```ts
export type FinanceClosingFormModel = {
  closingDate: string;
  confirmReason: string;
  acknowledgeWarnings: boolean;
};
```

---

## 13. Query / Filter / Pagination Types

ระบบนี้มี list-heavy pages จำนวนมาก  
ดังนั้น query/filter/pagination types ต้องถูกจัดการเป็นหมวดชัดเจน

## 13.1 QueryParams

ใช้กับ request ไป backend หรือ service

## 13.2 FilterState

ใช้กับ UI state ของ filter form

## 13.3 PaginationState

ใช้กับ table/list behavior

## 13.4 SortState

ใช้กับ sorting behavior

### ตัวอย่าง

```ts
export type PaginationState = {
  page: number;
  pageSize: number;
};

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  field: string;
  direction: SortDirection;
};

export type WarehouseStockFilterState = {
  keyword: string;
  warehouseId: string;
  includeBlocked: boolean;
};
```

### หมายเหตุ

FilterState ไม่จำเป็นต้องเท่ากับ QueryParams เสมอไป  
เพราะ UI อาจเก็บ field มากกว่าหรือต่างจาก transport params

---

## 14. Access / Auth Types

เนื่องจาก auth/access เป็น foundation ของระบบ  
type ของมันต้องชัดมาก

ตัวอย่างประเภทที่ควรมี

- `CurrentUserModel`
- `AccessAssignmentModel`
- `EffectiveAccessModel`
- `AreaCode`
- `ScopeType`
- `PermissionCode` (ถ้าจะ type แข็งขึ้นในอนาคต)
- `AccessSummaryModel`

### ตัวอย่าง

```ts
export type CurrentUserModel = {
  id: string;
  displayName: string;
  email: string | null;
  companyName: string | null;
};

export type AreaCode =
  | 'dashboard'
  | 'farm'
  | 'production'
  | 'warehouse'
  | 'purchase'
  | 'project'
  | 'sales'
  | 'finance'
  | 'insight'
  | 'approval'
  | 'admin';
```

---

## 15. Notification / Alert / Sync / Integration Types

เพราะระบบนี้มี notification center, inline alerts และ sync/integration states  
จึงควรมี type ที่เกี่ยวข้องอย่างชัดเจน

### ประเภทที่ควรมี

- `NotificationItemModel`
- `NotificationSeverity`
- `SyncStatus`
- `IntegrationStatus`
- `StaleState`
- `OfflineAwareState`

### ตัวอย่าง

```ts
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export type NotificationItemModel = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAtLabel: string;
  targetUrl: string | null;
};

export type SyncStatus =
  | 'synced'
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'conflict';

export type IntegrationStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'failed'
  | 'retryable';
```

### placement

ถ้าเป็น generic shared states อยู่ `src/types/` ได้  
แต่ถ้าเป็น business notification model เฉพาะ domain ให้เก็บใน module types

---

## 16. Persistence / Draft / Queue Types

เพราะระบบนี้เผื่อ offline/local draft/queue ตั้งแต่ต้น  
จึงควรมี type สำหรับ persistence layer ด้วย

### ตัวอย่าง

```ts
export type DraftMeta = {
  draftId: string;
  updatedAt: string;
  version: number;
};

export type QueueItemStatus = 'pending' | 'processing' | 'failed';

export type QueueItem<TPayload> = {
  id: string;
  type: string;
  status: QueueItemStatus;
  createdAt: string;
  retryCount: number;
  payload: TPayload;
};
```

### หลักสำคัญ

- persistence types ไม่ควรยัดปนกับ DTO files
- queue item shape อาจเป็น shared technical type
- payload ภายใน queue item มักเป็น module-owned type

---

## 17. Shared Technical Types

shared technical types ใช้เฉพาะสิ่งที่ shared จริง เช่น

- `Nullable<T>`
- `PaginationMeta`
- `ApiErrorShape`
- `SelectOption`
- `DateRangeValue`
- `IdLabelPair`

### ตัวอย่าง

```ts
export type SelectOption = {
  value: string;
  label: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
```

### อย่าทำ shared types ให้บวม

ห้ามเอา business domain types ไปกองที่ `src/types/` ทั้งหมดเพียงเพราะอยากหาง่าย

---

## 18. Use Case Matrix: ควรใช้ type อะไร

| Use Case                             | Recommended Type            |
| ------------------------------------ | --------------------------- |
| response จาก backend                 | DTO                         |
| response จาก mock API                | DTO                         |
| data ที่ส่งออกจาก service ไปหน้า     | Model                       |
| data ที่ render ใน table/card/detail | Model                       |
| data ใน React Hook Form              | FormModel                   |
| data ที่ persist เป็น local draft    | DraftModel / DraftPayload   |
| filter state ใน UI                   | FilterState                 |
| params ที่ยิง query                  | QueryParams                 |
| sort/pagination ของ table            | SortState / PaginationState |
| notification ใน shell                | NotificationItemModel       |
| current access ใน app runtime        | EffectiveAccessModel        |

---

## 19. When to Reuse vs When to Create New Type

## 19.1 Reuse type ได้เมื่อ

- meaning เดิม
- lifecycle เดิม
- owner เดิม
- shape เดิมเพราะ purpose เดิม

## 19.2 ควรสร้าง type ใหม่เมื่อ

- purpose เปลี่ยน
- UI ใช้คนละ shape
- form ใช้คนละ behavior
- list/detail ใช้ข้อมูลต่างกัน
- persistence ใช้คนละ concern
- backend contract ไม่ควรรั่วเข้า UI

### ตัวอย่าง

อย่าใช้ `PurchaseRequestDto` เป็น

- list item
- detail page
- form state
- draft payload

พร้อมกันทั้งระบบ

---

## 20. File Naming Guidelines for Types

recommended naming ของ type files เมื่อ module นั้นต้องแยกไฟล์เฉพาะจริง

- `<module>.dto.ts` *(optional)*
- `<module>.model.ts` *(optional)*
- `<module>.form.ts` *(optional)*
- `<module>.query.ts` *(optional)*
- `<module>.draft.ts` *(optional)*

ถ้าแตกย่อย ให้ใช้ pattern

- `<module>-<resource-purpose>.dto.ts` *(optional)*
- `<module>-<resource-purpose>.model.ts` *(optional)*
- `<module>-<resource-purpose>.form.ts` *(optional)*

### ตัวอย่าง

- `warehouse.dto.ts`
- `warehouse.model.ts`
- `warehouse.form.ts`
- `warehouse.query.ts`
- `warehouse.draft.ts`

ถ้า module ใหญ่มาก อาจแตกย่อยได้ เช่น

- `purchase-request.dto.ts`
- `purchase-request.model.ts`
- `purchase-request-approval.model.ts`

แต่ยังต้องยึด naming ที่อ่านแล้วเดาได้

### rules

- type files ใน module ต้องมี module prefix เสมอ
- ห้ามใช้ชื่อกลางที่ไม่บอก owner เช่น `dto.ts`, `model.ts`, `form.ts`
- ถ้าเป็น model ที่ใช้เฉพาะหน้ารายการ/รายละเอียด ให้สะท้อน purpose ในชื่อไฟล์
- ถ้า module ไม่ต้องแยก file จริง ให้ colocate type กับ hook/service ที่ใช้มันได้
- `permissions.ts` ไม่ใช่ type file มาตรฐานของ module และควรเลี่ยงการสร้างซ้ำถ้า guard กลางมีอยู่แล้ว

---

## 21. ตัวอย่างโครง type จริงใน module

```text
src/features/purchase/types/
├── purchase.dto.ts
├── purchase.model.ts
├── purchase.form.ts
├── purchase.query.ts
├── purchase.draft.ts
└── index.ts
```

ตัวอย่างเนื้อหา

```ts
// purchase.dto.ts
export type PurchaseRequestDto = {
  request_id: string;
  request_no: string | null;
  request_date: string | null;
  vendor_id: string | null;
  status_code: string | null;
};

// purchase.model.ts
export type PurchaseRequestListItemModel = {
  requestId: string;
  requestNo: string;
  requestDateLabel: string;
  vendorLabel: string;
  statusLabel: string;
};

// purchase.form.ts
export type PurchaseRequestFormModel = {
  requestDate: string;
  vendorId: string;
  reason: string;
};
```

---

## 22. Anti-Patterns ที่ห้ามทำ

- ใช้ DTO ตรงใน page/component
- ใช้ type ตัวเดียวครอบ DTO + Model + Form
- เอา business types ทั้งหมดไปกองใน `src/types/`
- สร้าง `permissions.ts` ใน module ทั้งที่ permission truth อยู่ใน guard กลางแล้ว
- ตั้งชื่อ type file แบบไม่เดา purpose ได้
- ใช้ `any` เพราะไม่อยากสร้าง type
- ให้ query params type เท่ากับ filter state เสมอโดยไม่ดู use case
- เอา persistence draft type ไปใช้แทน form model ตรง ๆ
- ใช้ display labels ปะปนกับ canonical values ใน type เดียวโดยไม่ชัดเจน

---

## 23. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **แนวทางเรื่อง type system**

### `04_frontend_auth-access.md`

ดูต่อเรื่อง access types และ effective access usage

### `06_frontend_mapper-guidelines.md`

ดูต่อเรื่อง DTO -> Model และ FormModel -> DTO mapping

### `07_frontend_api-usage.md`

ดูต่อเรื่อง query params, service output และ API DTO flow

### `08_frontend_mock-usage.md`

ดูต่อเรื่อง mock DTOs, storybook fixtures และ demo data สำหรับ isolated demo/test harness

### `10_frontend_naming-conventions.md`

ดูต่อเรื่อง naming conventions ของ type files

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 24. Summary

สรุปสาระสำคัญที่สุดของ `05_frontend_type-guidelines.md` คือ

- DTO, Model และ FormModel เป็นคนละอย่างและต้องแยกกัน
- ไม่ได้บังคับให้ทุก module ต้องมีไฟล์แยกครบทุกชนิด
- UI ห้ามใช้ DTO ตรง
- Model คือ shape ที่ UI ใช้จริง
- FormModel คือ shape ที่ออกแบบเพื่อ form UX
- Query/filter/pagination/sort types ต้องแยกเป็นหมวดให้ชัด
- access, notification, sync, integration, draft และ queue ควรมี type ของตัวเอง
- type ต้องมี owner ชัด
- business types ควรอยู่ใน module ก่อนเป็น baseline
- shared types ควร shared จริง
- `permissions.ts` ไม่ใช่ canonical module file; permission truth ควรอยู่ใน guard กลาง
- ควร reuse type เมื่อ meaning เดิมเท่านั้น
- ถ้า purpose เปลี่ยน ให้สร้าง type ใหม่
- file naming ของ types ต้องอ่านแล้วเดา purpose ได้ทันที
