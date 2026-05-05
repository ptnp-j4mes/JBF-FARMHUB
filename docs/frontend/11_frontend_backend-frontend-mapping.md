# 11_frontend_backend-frontend-mapping.md

# Frontend Backend–Frontend Mapping

ไฟล์นี้กำหนดกติกาการแปลความหมายจาก backend contract ไปเป็น frontend model ที่ผู้ใช้เข้าใจได้

ขอบเขตหลักของไฟล์นี้คือ

- concept mapping ระหว่าง backend กับ frontend
- auth/access/permission/scope/workflow mapping
- list/detail/summary/document/validation-error mapping
- สิ่งที่ frontend ต้องเชื่อจาก backend และสิ่งที่ frontend ต้อง normalize เพิ่ม

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อลดการตีความไม่ตรงระหว่าง backend และ frontend

- DTO ไหนต้องแปลงเป็น model รูปแบบใดก่อน render
- code/status จาก backend ต้องแปล label/tone/state ที่ไหน
- validation error ต้อง map เข้า form อย่างไร
- access/scope/permission ต้องถือค่าไหนเป็น canonical
- field ใด frontend ห้ามเดาเองแม้ข้อมูลไม่ครบ

ไฟล์นี้ไม่แทน API spec แต่เป็นคู่มือแปลความหมายข้ามฝั่งให้ทุกทีมใช้แนวเดียวกัน

### อ่านต่อ

- type system -> `05_frontend_type-guidelines.md`
- mapper rules -> `06_frontend_mapper-guidelines.md`
- API flow -> `07_frontend_api-usage.md`
- auth/access model -> `04_frontend_auth-access.md`
- requirements และ states ระดับ product -> `13_frontend_requirements.md`

---

## 2. Mapping Principles

## 2.1 Backend Contract ไม่เท่ากับ UI Contract

backend ส่งข้อมูลมาเพื่อสื่อสารกับระบบ frontend  
แต่สิ่งที่ UI ต้องใช้จริงมักไม่เหมือน shape จาก backend ตรง ๆ

ดังนั้น

- backend contract = transport contract
- frontend model = UI contract

## 2.2 Frontend ต้องไม่แปล business ใหม่เองโดยไร้หลัก

frontend แปลได้ในเรื่อง

- field naming
- display labels
- default values
- view model grouping
- state wording
- UI-friendly flags

แต่ frontend ไม่ควร invent business truth ใหม่ เช่น

- เดา permission เอง
- เดา integration outcome เอง
- เดา workflow state เองถ้า backend มี state จริงอยู่แล้ว

## 2.3 Mapper คือจุดแปลภาษา

การแปล backend -> frontend ต้องเกิดผ่าน

- service orchestration
- mapper
- helper ที่มีเจ้าของชัด

ไม่ควรกระจายไปที่ page/component

## 2.4 Frontend ควรถือ user-facing meaning ไม่ใช่ transport-only meaning

ตัวอย่าง

backend ส่ง

- `status_code: 'PENDING_APPROVAL'`

frontend ควรถือ model ที่สื่อความหมายกับ UI เช่น

- `statusCode: 'PENDING_APPROVAL'`
- `statusLabel: 'รออนุมัติ'`
- `statusTone: 'warning'`

---

## 3. Backend Concept vs Frontend Concept Matrix

| Backend Concept           | Frontend Equivalent              | หมายเหตุ                                  |
| ------------------------- | -------------------------------- | ----------------------------------------- |
| Entity / Record           | Model                            | UI ใช้ model ไม่ใช้ entity/DTO ตรง        |
| DTO / Response Contract   | DTO                              | อยู่ที่ repository/api/mapping zone       |
| Request Payload           | DTO / Command Payload            | มักได้จาก FormModel -> DTO                |
| Session                   | Auth runtime state               | frontend รู้แค่ว่า session พร้อมหรือไม่   |
| User Principal            | CurrentUserModel                 | user-facing current user                  |
| Access Assignment         | AccessAssignmentModel            | object ที่ user เลือกใช้ได้               |
| Current Context           | Current Access                   | บริบทปัจจุบันของ frontend                 |
| Effective Permissions     | EffectiveAccessModel             | ใช้ guard ทั้งระบบ                        |
| Scope                     | ScopeType + scopeId + scopeLabel | frontend ใช้ทั้งเชิง guard และ UI         |
| Business Status Code      | Status code + label + tone       | mapper แปลให้พร้อมใช้                     |
| Validation Error Response | Field errors / form error model  | map ไปสู่ form UI                         |
| Audit Metadata            | Audit model / display fields     | createdBy, updatedAtLabel ฯลฯ             |
| File Reference            | Document/File model              | frontend ไม่ควรถือ raw storage details    |
| Notification Event        | NotificationItemModel            | ใช้ใน notification center                 |
| Integration Result        | IntegrationStatus model          | user-facing state ไม่ใช่ raw SAP response |
| Sync State                | SyncStatus model                 | pending/syncing/failed/conflict ฯลฯ       |
| Paged Response            | List model + pagination meta     | แยก rows กับ meta                         |

---

## 4. Entity / DTO / Model Mapping

## 4.1 Backend Entity ไม่ควรปรากฏใน Frontend ตรง ๆ

backend อาจมี entity ที่สะท้อน database หรือ domain object ภายใน  
frontend ไม่ควรพยายาม mirror entity นี้ตรง ๆ

### frontend ควรเห็น

- DTO ที่ส่งผ่าน API
- แล้วแปลงเป็น Model

## 4.2 DTO คือ transport contract

DTO อาจมีลักษณะเช่น

- snake_case
- null fields
- nested technical structure
- raw ids / raw codes
- raw timestamps

## 4.3 Model คือ UI-facing meaning

model ควรมีลักษณะเช่น

- camelCase
- default values
- labels พร้อมใช้
- grouped structure สำหรับ section/component
- user-facing flags เมื่อเหมาะสม

### ตัวอย่าง

```ts
// DTO
type PurchaseRequestDto = {
  request_id: string;
  request_no: string | null;
  status_code: string | null;
  created_at: string | null;
};

// Model
type PurchaseRequestListItemModel = {
  requestId: string;
  requestNo: string;
  statusCode: string | null;
  statusLabel: string;
  createdAtLabel: string;
};
```

---

## 5. Auth / Session Mapping

## 5.1 Backend Session -> Frontend Auth State

backend เป็น owner ของ session truth  
frontend แปลเป็น auth runtime state เช่น

- `isAuthenticated`
- `isAuthLoading`
- `currentUser`
- `sessionExpired`

## 5.2 Frontend ไม่ควรผูกกับ token internals

ถ้า architecture ใช้ BFF/cookies  
frontend ไม่ควร depend กับ token parsing ใน browser เป็น baseline

## 5.3 Current User Mapping

backend อาจส่ง current user contract แบบ technical มากกว่า  
frontend ควร map เป็น `CurrentUserModel`

### ตัวอย่าง

```ts
type CurrentUserDto = {
  user_id: string;
  employee_code: string | null;
  display_name: string | null;
  email: string | null;
  company_name: string | null;
};

type CurrentUserModel = {
  id: string;
  employeeCode: string | null;
  displayName: string;
  email: string | null;
  companyName: string | null;
};
```

---

## 6. Access / Assignment / Effective Access Mapping

auth กับ access เป็นคนละเรื่อง  
ดังนั้น backend access concepts ต้องถูกแปลแยกชัดใน frontend

## 6.1 Access Assignment

backend อาจส่ง access assignment มาเป็น contract ที่มี

- role code
- role name
- scope type
- scope id
- permission codes
- allowed area codes

frontend ควร map เป็น `AccessAssignmentModel`

## 6.2 Current Access

backend อาจ persist current assignment/current scope บางส่วนไว้  
frontend แปลสิ่งนี้เป็น `currentAccess`

## 6.3 Effective Access

effective access คือ runtime object ที่ frontend ใช้ guard จริง  
อาจ derive จาก assignment ตรง ๆ หรือจาก backend response ที่รวมมาแล้ว

### rule

frontend ต้องไม่ merge assignments เองจนเกิด super-access โดยไม่มีหลักจาก backend

---

## 7. Permission Mapping

## 7.1 Backend Permission Code -> Frontend Permission Code

โดย baseline แล้ว permission code ควรเป็น canonical string เดียวกันทั้งสองฝั่ง เช่น

- `warehouse.material_stock.view`
- `warehouse.purchase_request.create`
- `finance.closing.run`

frontend ควรใช้ code เดิมนี้ในการ guard  
แต่ไม่ควรกระจาย string ดิบไปทั่ว UI

## 7.2 Frontend Layering ของ Permission

backend ให้ raw permission codes มา  
frontend ต้องแปลสู่หลาย usage layers

- menu visibility
- page access
- section visibility
- action availability
- data query eligibility

เพื่อกันการตีความผิด ให้ยึด mapping 2 ชั้นนี้เสมอ

1. **Canonical Mapping (Backend -> Frontend Access Model)**  
   map payload สิทธิ์จาก backend ไปไว้ใน `EffectiveAccessModel.permissions` และ `allowedAreas` โดยไม่เปลี่ยนความหมายของ code
2. **Guard Projection Mapping (Frontend Runtime -> UI/Behavior)**  
   ใช้ canonical values เดิมไปคำนวณ guard หลายระดับ เช่น sidebar menu, page guard, action guard และ query enabled

สิ่งที่ห้ามทำ:

- ห้ามสร้าง permission code ใหม่จาก route
- ห้ามให้ menu visibility เป็นแหล่ง truth เดียวของสิทธิ์
- ห้ามตัดสิน data access จาก UI state โดยไม่อิง canonical permissions

---

## 8. Scope Mapping

scope จาก backend ไม่ควรถูกมองเป็นแค่ label

frontend ควรถืออย่างน้อย

- `scopeType`
- `scopeId`
- `scopeLabel`

### why

เพราะทั้ง 3 อย่างมีหน้าที่ต่างกัน

- `scopeType` ใช้แยกตรรกะระดับ domain
- `scopeId` ใช้ query/data guard
- `scopeLabel` ใช้แสดงใน shell และ UI

---

## 9. Workflow Status Mapping

backend มักส่ง business status มาเป็น code เช่น

- `DRAFT`
- `PENDING_APPROVAL`
- `APPROVED`
- `REJECTED`
- `CLOSED`
- `FAILED`

frontend ควรแปลเป็นอย่างน้อย

- `statusCode`
- `statusLabel`
- `statusTone` หรือ `statusVariant` เมื่อ UI ต้องใช้

### ตัวอย่าง model

```ts
type PurchaseRequestStatusModel = {
  statusCode: string | null;
  statusLabel: string;
  statusTone: 'default' | 'info' | 'warning' | 'success' | 'error';
};
```

### rule

- backend เป็น source ของ canonical status code
- frontend เป็น owner ของ display label/tone mapping

---

## 10. List / Detail / Summary Response Mapping

backend มักส่ง response คนละ shape ตาม use case  
frontend ต้องแยก model ให้ตรงจุดใช้

## 10.1 List Response

ใช้กับ table/list pages

frontend ควร map เป็น

- list item models
- pagination meta
- optional summary strip data

## 10.2 Detail Response

ใช้กับ detail/review pages

frontend ควร map เป็น

- detail model
- section models
- related sub-models

## 10.3 Summary Response

ใช้กับ dashboard/cards/widgets

frontend ควร map เป็น

- summary model
- metric cards
- chart input model
- alert indicators

### rule

อย่าใช้ model ตัวเดียวครอบ list/detail/summary พร้อมกัน ถ้า purpose ต่างกัน

---

## 11. Pagination / Sorting / Filtering Mapping

backend response ที่เป็น paged result มักมีโครงเช่น

- items
- page
- pageSize
- totalItems
- totalPages

frontend ควร map เป็น

- `rows`
- `paginationMeta`

### ตัวอย่าง

```ts
type PagedResponseDto<T> = {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
```

### rule

frontend ไม่ควรบังคับให้ every page ใช้ DTO pagination meta ตรง ๆ

---

## 12. Validation Error Mapping

backend validation errors ต้องถูก map ให้เหมาะกับ form UI

## 12.1 Backend อาจส่ง

- field errors
- summary error
- business rule error
- denied action
- invalid state transition

## 12.2 Frontend ควรแยกอย่างน้อย

- field-level errors
- form-level error
- action-level error
- page-level blocking error

### ตัวอย่าง conceptual mapping

```ts
type ValidationErrorDto = {
  message: string;
  field_errors?: Record<string, string[]>;
};

type FormValidationErrorModel = {
  message: string;
  fieldErrors: Record<string, string>;
};
```

### rule

- backend เป็น source ของ validation truth
- frontend เป็น owner ของการ map ไปสู่ form library/UI behavior

---

## 13. Audit Metadata Mapping

backend อาจส่งข้อมูล audit เช่น

- created_by
- created_at
- updated_by
- updated_at
- approved_by
- approved_at

frontend ควรแยกว่าข้อมูลเหล่านี้ใช้เพื่อ

- display labels
- timeline/history
- metadata panels

### ตัวอย่าง model

```ts
type AuditInfoModel = {
  createdByLabel: string;
  createdAtLabel: string;
  updatedByLabel: string;
  updatedAtLabel: string;
};
```

### rule

frontend ไม่จำเป็นต้อง expose raw audit fields ทุกอันสู่ทุก component  
ควร map ให้เป็น display-ready shape ตามหน้าที่ต้องใช้

---

## 14. Notification Mapping

backend notification/event response ต้องถูกแปลเป็นสิ่งที่ notification center ใช้จริง

## 14.1 Backend อาจส่ง

- notification id
- type code
- severity code
- title
- message
- created_at
- is_read
- target_url
- metadata

## 14.2 Frontend ควร map เป็น

- `NotificationItemModel`
- `severity`
- `createdAtLabel`
- `targetUrl`
- optional UI icon key / category label เมื่อจำเป็น

### ตัวอย่าง

```ts
type NotificationItemModel = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAtLabel: string;
  targetUrl: string | null;
};
```

### rule

notification center ต้องใช้ frontend-friendly model  
ไม่ควร render raw backend event payload ตรง ๆ

---

## 15. Integration / Sync Mapping

ระบบนี้มี SAP/integration-aware UX  
ดังนั้น backend integration concepts ต้องถูกแปลเป็น user-facing states

## 15.1 Backend อาจส่งสถานะเช่น

- `PENDING`
- `SUCCESS`
- `FAILED`
- `RETRYABLE`
- `CONFLICT`
- `NOT_REQUIRED`

## 15.2 Frontend ควร map เป็น

- `statusCode`
- `statusLabel`
- `statusTone`
- `canRetry`
- `lastSyncedAtLabel`
- `detailMessage` เมื่อเหมาะสม

### ตัวอย่าง

```ts
type IntegrationStatusModel = {
  statusCode: string | null;
  statusLabel: string;
  statusTone: 'default' | 'info' | 'warning' | 'success' | 'error';
  canRetry: boolean;
  lastSyncedAtLabel: string;
};
```

### rule

frontend ไม่ควรเอา SAP raw payload มาแสดงตรง ๆ  
แต่ต้องแปลเป็นภาษาที่ผู้ใช้เข้าใจได้

---

## 16. Offline / Draft / Queue Mapping

แม้ local draft และ queue จะเป็น concern ฝั่ง frontend มากกว่า  
แต่บางครั้ง backend response อาจต้องสัมพันธ์กับ state เหล่านี้ เช่น

- sync accepted
- partial failure
- retryable
- stale snapshot
- draft restored

frontend ต้องแยกให้ชัดว่าอะไรคือ

- backend truth
- frontend local state
- merged UI state

### rule

อย่าปน local draft state เข้ากับ backend DTO โดยไม่มีชั้นแยก

---

## 17. File / Document Mapping

backend อาจส่งข้อมูลเอกสาร/ไฟล์ เช่น

- file id
- file name
- mime type
- size
- storage path
- signed url
- attachment reference

frontend ควร map เป็น model ที่เหมาะกับ UI เช่น

```ts
type DocumentFileModel = {
  fileId: string;
  fileName: string;
  fileSizeLabel: string;
  mimeType: string;
  downloadUrl: string | null;
  previewable: boolean;
};
```

### rule

frontend ไม่ควร expose raw storage path เป็น concept หลักของ UI  
UI ต้องคิดในภาษาของ “ไฟล์ที่เปิดได้ / ดาวน์โหลดได้ / พรีวิวได้”

---

## 18. Summary / Widget Mapping

dashboard และ insight pages ใช้ summary responses จำนวนมาก  
backend summary มักเป็น technical aggregate หรือ grouped metrics

frontend ต้องแปลเป็น

- card models
- widget models
- chart input models
- warning indicators

### ตัวอย่าง

backend:

```ts
{
  pending_count: 12,
  failed_sync_count: 3,
  last_refreshed_at: '...'
}
```

frontend:

```ts
type DashboardOpsSummaryModel = {
  pendingCount: number;
  failedSyncCount: number;
  lastRefreshedAtLabel: string;
  hasAttentionRequired: boolean;
};
```

---

## 19. Backend-Friendly vs Frontend-Friendly Dates

backend date/time fields มักเป็น raw string/timestamp  
frontend ต้องแยกให้ออกอย่างน้อย 3 แบบ

1. raw dto date
2. model raw date ที่ยังใช้ใน logic
3. display label

### example

```ts
type FinanceClosingDto = {
  closing_date: string | null;
};

type FinanceClosingModel = {
  closingDate: string | null;
  closingDateLabel: string;
};
```

### rule

อย่าให้ทุก component แปลง date เองซ้ำ ๆ

---

## 20. Backend-Friendly vs Frontend-Friendly Numbers

backend อาจส่ง number ที่ยังไม่เหมาะกับ UI ตรง ๆ เช่น

- null
- decimal precision ดิบ
- quantity/currency ที่ยังไม่ format
- totals ที่ต้องสื่อด้วย tone หรือ warning เพิ่ม

frontend ควรแยก

- raw numeric value
- display label
- optional semantic flags

### example

```ts
type InventorySummaryModel = {
  quantityOnHand: number;
  quantityOnHandLabel: string;
  isLowStock: boolean;
};
```

---

## 21. What Frontend Should Trust vs What Frontend Should Derive

## 21.1 Frontend ควรเชื่อ backend ในเรื่อง

- current user
- assignments
- effective permissions ถ้า backend ส่งมา
- canonical status codes
- validation outcomes
- integration outcomes
- document/file references
- authoritative data values

## 21.2 Frontend ควร derive เองในเรื่อง

- display labels
- display formatting
- UI grouping
- state tone/color category
- section-ready models
- widget-ready models
- convenience booleans สำหรับ render เมื่อ derive จาก truth เดิมได้ชัดเจน

---

## 22. Mapping Use Cases

## 22.1 Backend ส่ง field ไม่ตรงกับ UI

backend:

```ts
req_no;
req_dt;
status_code;
```

frontend:

```ts
requestNo;
requestDateLabel;
statusLabel;
```

## 22.2 Backend ส่ง field ไม่ครบ

frontend combine หลาย source ผ่าน service + mapper

## 22.3 Backend ส่ง raw code

frontend map เป็น label/tone

## 22.4 Backend ส่งหลายก้อนข้อมูล

frontend service รวม แล้ว mapper สร้าง composite model

## 22.5 Backend ส่ง technical error

frontend map เป็น page/form/action state ที่เหมาะสม

---

## 23. Recommended Mapping Ownership

| Concern                                        | Recommended Owner              |
| ---------------------------------------------- | ------------------------------ |
| raw transport parsing                          | api/repository                 |
| DTO -> Model                                   | mapper                         |
| หลาย DTO -> composite model                    | service + mapper               |
| status code -> label/tone                      | module mapper/helper           |
| validation dto -> form error model             | service/hook integration layer |
| current user/access dto -> auth/access mappers | access/auth module             |
| integration dto -> integration status model    | mapper/helper                  |
| notification dto -> notification model         | mapper                         |

---

## 24. Anti-Patterns ที่ห้ามทำ

- render DTO ตรงใน UI
- ใช้ backend entity name เป็น UI vocabulary ทั้งระบบ
- ให้ component แปล status code เองทีละหน้า
- ให้ page combine หลาย response เองเพื่อสร้าง business object เดียว
- invent permission/status/integration truth เองจากการเดา
- แสดง SAP raw response ให้ user ตรง ๆ
- ใช้ model เดียวครอบทุก use case ทั้ง list/detail/widget/form
- ปล่อยให้ date/number formatting กระจายทั่วแอปโดยไม่มี mapping layer

---

## 25. Example Mapping Table by Concern

| Concern           | Backend Sends               | Frontend Uses                           |
| ----------------- | --------------------------- | --------------------------------------- |
| Current User      | `CurrentUserDto`            | `CurrentUserModel`                      |
| Access Assignment | `AccessAssignmentDto`       | `AccessAssignmentModel`                 |
| Effective Access  | permission/scope payload    | `EffectiveAccessModel`                  |
| Purchase Status   | `status_code`               | `statusCode + statusLabel + statusTone` |
| Notification      | event payload               | `NotificationItemModel`                 |
| Integration       | raw integration code/result | `IntegrationStatusModel`                |
| Audit             | timestamps/user ids         | `AuditInfoModel`                        |
| File              | storage/file reference      | `DocumentFileModel`                     |
| Validation Error  | backend validation payload  | `FormValidationErrorModel`              |
| Dashboard Summary | aggregates                  | widget/card models                      |

---

## 26. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **ภาษากลางระหว่าง backend กับ frontend**

### `05_frontend_type-guidelines.md`

กำหนด categories ของ types ที่ใช้ฝั่ง frontend

### `06_frontend_mapper-guidelines.md`

กำหนดวิธีแปลง DTO/response ให้เป็น models

### `07_frontend_api-usage.md`

กำหนด flow ที่ response เดินผ่าน repository/service/mapper

### `04_frontend_auth-access.md`

กำหนด how current access/effective access ถูกใช้ใน runtime

### `13_frontend_requirements.md`

กำหนด product-level expectations ของ sync/integration/notifications

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 27. Summary

สรุปสาระสำคัญที่สุดของ `11_frontend_backend-frontend-mapping.md` คือ

- backend contract กับ frontend UI contract เป็นคนละชั้น
- frontend ต้องใช้ DTO เป็น transport layer และใช้ Model เป็น UI layer
- auth/access/session/assignment/current access/effective access ต้องถูกแปลเป็น frontend concepts ที่ชัด
- workflow status, notification, integration, sync, audit และ document/file references ต้องถูกแปลเป็น user-facing models
- frontend ควรเชื่อ backend ใน canonical truths แต่ derive display meaning เองในชั้นที่เหมาะ
- service + mapper คือจุดสำคัญของการแปลภาษา backend -> frontend
- ห้ามให้ DTO, raw codes, technical payloads หรือ raw integration responses รั่วเข้า UI ตรง ๆ
- mapping ที่ดีทำให้ frontend อ่านง่าย, เปลี่ยน backend contract ได้ง่ายขึ้น และสื่อสารกับผู้ใช้ได้ดีขึ้น
