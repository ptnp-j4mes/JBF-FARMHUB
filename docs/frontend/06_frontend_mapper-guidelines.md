# 06_frontend_mapper-guidelines.md

# Frontend Mapper Guidelines

ไฟล์นี้กำหนดกติกา mapping ระหว่างข้อมูลจาก backend กับข้อมูลที่ UI ใช้จริง เมื่อมี transformation boundary จริง เพื่อกัน contract รั่วเข้าหน้าจอและลด logic ซ้ำ

ไฟล์นี้ครอบคลุม

- DTO -> Model
- FormModel -> DTO
- Draft/Persistence -> FormModel
- normalization, fallback และ code translation
- placement/naming ของ mapper
- use cases ที่ backend field ไม่ตรงหรือไม่ครบ

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อปิดประเด็นที่ทีมมักทำไม่ตรงกันเรื่อง mapping

- mapper ทำอะไรและไม่ทำอะไร
- mapping ควรเกิดที่ layer ไหน
- เมื่อไร “ไม่ต้องมี mapper” ก็ได้
- fallback/default/normalization ควรนิยามแบบไหน
- เมื่อ field เปลี่ยนจาก backend ต้องแก้ตรงไหนก่อน
- multi-source composition ควรประกอบและ map จุดใด
- function naming ต้องบอกทิศทางข้อมูลอย่างไร

ไฟล์นี้ไม่แทน service orchestration หรือ API transport docs แต่เป็นกติกากลางของการแปลงข้อมูลทั้งระบบ

### อ่านต่อ

- type categories และ placement -> `05_frontend_type-guidelines.md`
- service/API flow -> `07_frontend_api-usage.md`
- mock flow (reference / demo only) -> `08_frontend_mock-usage.md`
- naming conventions -> `10_frontend_naming-conventions.md`

---

## 2. Mapper Principles

## 2.1 Mapper คือ Anti-Corruption Layer ฝั่ง Frontend

mapper มีหน้าที่กันไม่ให้ backend contract ไหลเข้ามาถึง UI ตรง ๆ  
นี่คือเหตุผลหลักที่ระบบนี้แยก DTO กับ Model และต้องมี mapper อย่างชัดเจนเมื่อมี transformation จริง

## 2.2 Mapper ต้อง pure ให้มากที่สุด

โดย baseline แล้ว mapper ควรเป็น **pure functions** ที่

- รับ input
- คืน output
- ไม่มี side effects
- ไม่ยิง network
- ไม่แตะ localStorage
- ไม่ mutate arguments

## 2.3 Mapper ไม่ใช่ Service

mapper มีหน้าที่แปลงข้อมูล  
service มีหน้าที่ orchestrate/use case

ดังนั้น

- mapper ไม่ควรตัดสินใจเรื่อง fetch ไหนก่อนหลัง
- mapper ไม่ควรถือ state
- mapper ไม่ควรทำ retry
- mapper ไม่ควรเรียก transport/API ตรง

## 2.4 Mapper ต้อง normalize ก่อนส่งให้ UI

UI ไม่ควรต้องเขียน logic แบบนี้ซ้ำ ๆ ในทุกหน้า

- `dto.xxx ?? '-'`
- `dto.status_code === 'A' ? 'อนุมัติแล้ว' : ...`
- `formatDate(dto.created_at)`
- `Number(dto.qty ?? 0)`

สิ่งเหล่านี้ควรถูกจัดการที่ mapper หรือ helper ที่ mapper เรียกใช้

## 2.5 Mapper ต้องสื่อ purpose ชัด

mapping คนละทิศ คนละ purpose ควรแยก function ชัด เช่น

- `mapPurchaseRequestDtoToListItemModel`
- `mapPurchaseRequestDtoToDetailModel`
- `mapPurchaseRequestFormModelToCreateDto`
- `mapPurchaseRequestDraftToFormModel`

## 2.6 Mapper เป็น optional เมื่อ shape ไม่ต้องแปลง

ถ้า service/output shape ใช้กับ UI ได้ตรง และไม่มี normalization/fallback/translation ที่มีนัยสำคัญ ก็ไม่จำเป็นต้องสร้าง mapper file

ใช้ mapper เมื่อมีอย่างน้อยหนึ่งอย่าง:

- field name ไม่ตรงกันระหว่าง source กับ UI
- ต้องมี fallback/default/format/normalize
- raw codes หรือ enums ต้อง translate ให้ UI อ่านง่าย
- form/draft ต้องแปลงกลับไปเป็น payload
- มี multi-source composition ที่ต้องรวมข้อมูลก่อน render

ถ้าไม่มีเงื่อนไขเหล่านี้ ให้เก็บ logic ไว้ตรง service หรือ helper เฉพาะที่จำเป็นแทนการสร้าง mapper แบบฝืน pattern

---

## 3. Mapper Categories

ระบบนี้ควรมี mapper หลัก ๆ 4 กลุ่ม

1. DTO -> Model
2. FormModel -> DTO
3. Draft/Persistence -> FormModel
4. Multi-source -> Composite Model

---

## 4. DTO -> Model Mapping

นี่คือ mapper ที่ใช้บ่อยที่สุด

### หน้าที่

- เปลี่ยน field naming
- เติม fallback
- แปลง raw codes เป็น model-friendly values
- normalize null/undefined
- format fields ระดับที่เหมาะกับ UI model
- compute flags/derived fields เมื่อสมเหตุผล

### ตัวอย่าง

```ts
export type WarehouseStockItemDto = {
  item_id: string;
  item_name: string | null;
  qty_on_hand: number | null;
  uom_code: string | null;
  is_blocked: boolean | null;
  updated_at: string | null;
};

export type WarehouseStockItemModel = {
  itemId: string;
  itemName: string;
  quantityOnHand: number;
  uomCode: string;
  isBlocked: boolean;
  updatedAtLabel: string;
};

export function mapWarehouseStockItemDtoToModel(
  dto: WarehouseStockItemDto,
): WarehouseStockItemModel {
  return {
    itemId: dto.item_id,
    itemName: dto.item_name ?? '-',
    quantityOnHand: dto.qty_on_hand ?? 0,
    uomCode: dto.uom_code ?? '-',
    isBlocked: dto.is_blocked ?? false,
    updatedAtLabel: formatDateTimeOrDash(dto.updated_at),
  };
}
```

---

## 5. FormModel -> DTO Mapping

ใช้ตอน submit form ไป backend

### หน้าที่

- แปลง input values ให้เป็น API contract
- แปลง string -> number/date เมื่อจำเป็น
- ตัด fields ที่ UI ใช้เฉพาะภายใน
- จัดโครง payload ให้ตรงกับ backend

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

export type CreatePurchaseRequestDto = {
  request_date: string;
  vendor_id: string;
  reason: string | null;
  items: {
    item_id: string;
    qty: number;
    note: string | null;
  }[];
};

export function mapPurchaseRequestFormModelToCreateDto(
  form: PurchaseRequestFormModel,
): CreatePurchaseRequestDto {
  return {
    request_date: form.requestDate,
    vendor_id: form.vendorId,
    reason: form.reason.trim() || null,
    items: form.items.map((item) => ({
      item_id: item.itemId,
      qty: Number(item.quantity || 0),
      note: item.note.trim() || null,
    })),
  };
}
```

---

## 6. Draft / Persistence -> FormModel Mapping

ใช้เมื่อมี local draft หรือ draft ที่ persist ไว้ใน browser

### หน้าที่

- แปลง persisted shape กลับเป็น form state
- เติม default fields ที่ draft ไม่มี
- normalize version differences ถ้ามี

### ตัวอย่าง

```ts
export type PurchaseRequestDraftModel = {
  requestDate?: string;
  vendorId?: string;
  reason?: string;
  items?: {
    itemId?: string;
    quantity?: string;
    note?: string;
  }[];
};

export function mapPurchaseRequestDraftToFormModel(
  draft: PurchaseRequestDraftModel | null,
): PurchaseRequestFormModel {
  return {
    requestDate: draft?.requestDate ?? '',
    vendorId: draft?.vendorId ?? '',
    reason: draft?.reason ?? '',
    items:
      draft?.items?.map((item) => ({
        itemId: item.itemId ?? '',
        quantity: item.quantity ?? '',
        note: item.note ?? '',
      })) ?? [],
  };
}
```

---

## 7. Multi-Source Composition Mapping

บางหน้าต้องประกอบข้อมูลจากหลาย API เพื่อสร้าง model เดียว

### rule สำคัญ

- การ orchestrate ว่าจะเอาข้อมูลจากไหนมา combine ควรอยู่ใน **service**
- การแปลง final composite data ให้เป็น model-friendly shape ควรอยู่ใน **mapper**

### ตัวอย่าง use case

หน้า approval detail ต้องใช้

- document dto
- approval history dto
- comments dto
- integration status dto

แล้วสุดท้ายสร้าง `ApprovalDetailModel`

### ตัวอย่าง

```ts
export type ApprovalDetailModel = {
  documentTitle: string;
  statusLabel: string;
  approvalSteps: ApprovalStepModel[];
  comments: ApprovalCommentModel[];
  integrationStatusLabel: string;
};

export function mapApprovalSourcesToDetailModel(args: {
  document: ApprovalDocumentDto;
  history: ApprovalHistoryDto[];
  comments: ApprovalCommentDto[];
  integration: IntegrationStatusDto | null;
}): ApprovalDetailModel {
  return {
    documentTitle: args.document.document_title ?? '-',
    statusLabel: mapApprovalStatusCodeToLabel(args.document.status_code),
    approvalSteps: args.history.map(mapApprovalHistoryDtoToStepModel),
    comments: args.comments.map(mapApprovalCommentDtoToModel),
    integrationStatusLabel: mapIntegrationStatusToLabel(
      args.integration?.status_code ?? null,
    ),
  };
}
```

---

## 8. Mapper Placement

baseline placement ของ mapper ควรอยู่ใน module utils หรือ types-adjacent utils ของ module

ตัวอย่าง

```text
src/features/purchase/utils/
├── purchase.mapper.ts
├── purchase.helpers.ts
└── purchase.constants.ts
```

หรือถ้า module ใหญ่

```text
src/features/purchase/utils/mappers/
├── purchase-request.mapper.ts
├── purchase-approval.mapper.ts
└── purchase-draft.mapper.ts
```

### rule

- mapper ของ module อยู่กับ module
- shared generic mappers ค่อยอยู่ shared layer
- อย่าเอา mapper business-specific ไปไว้ `src/lib/` หรือ `src/utils/` แบบกว้างเกินจำเป็น

---

## 9. Mapper Naming Conventions

mapper ของ module ต้องตั้งชื่อที่อ่านแล้วรู้ 3 อย่างพร้อมกัน

1. มาจาก module ไหน
2. รับ source type อะไร
3. ส่ง target type อะไร

### baseline naming

- `map<Module><ResourcePurpose>DtoTo<ModelPurpose>Model`
- `map<Module><ResourcePurpose>FormModelTo<DtoPurpose>Dto`
- `map<Module><ResourcePurpose>DraftTo<FormPurpose>FormModel`
- `map<Module><SourcesPurpose>SourcesTo<ModelPurpose>Model`

### ตัวอย่าง

- `mapWarehouseStockItemDtoToModel`
- `mapPurchaseRequestDtoToListItemModel`
- `mapPurchaseRequestDtoToDetailModel`
- `mapPurchaseRequestFormModelToCreateDto`
- `mapPurchaseRequestDraftToFormModel`
- `mapApprovalSourcesToDetailModel`

### file naming

- `warehouse.mapper.ts`
- `purchase.mapper.ts`
- `approval.mapper.ts`

หรือแตกย่อยเมื่อ file เริ่มใหญ่เกินไป

### rules

- อย่าใช้ชื่อกลาง เช่น `mapDtoToModel` ใน module files
- ถ้าเป็น module mapper ต้องมี domain prefix เช่น `Warehouse`, `Purchase`, `Approval`
- ชื่อ function ต้องตรงกับทิศทางจริงของข้อมูลเสมอ

---

## 10. Fallback Rules

หนึ่งในหน้าที่สำคัญของ mapper คือกำหนด fallback อย่างสม่ำเสมอ

## 10.1 String fallback

ถ้าข้อมูลเป็น string ที่ user เห็นจริง อาจ fallback เป็น `'-'` หรือ `''` ตาม purpose

### guideline

- display model มักใช้ `'-'`
- form model มักใช้ `''`

## 10.2 Number fallback

ถ้าเป็น display/summary อาจ fallback เป็น `0`
แต่ต้องระวังไม่ซ่อนความหมายของ “ไม่มีข้อมูล” กับ “ค่าจริงคือศูนย์” โดยไม่ตั้งใจ

## 10.3 Boolean fallback

มัก fallback เป็น `false` เมื่อ DTO เป็น null/undefined และ semantics สมเหตุผล

## 10.4 Date fallback

- display label ใช้ `'-'`
- raw model field อาจใช้ `null`
- form field ใช้ `''`

### ตัวอย่าง helper

```ts
export function formatDateOrDash(value: string | null | undefined): string {
  return value ? value : '-';
}
```

---

## 11. Normalization Rules

mapper ควร normalize อย่างน้อยเรื่องต่อไปนี้เมื่อเหมาะสม

- snake_case -> camelCase
- null -> UI-safe defaults
- raw status code -> label/enum-friendly value
- string number -> number
- missing arrays -> `[]`
- missing objects -> `null` หรือ default model shape
- trim strings เมื่อเหมาะสม
- nested optional data -> flattened/normalized shape

---

## 12. Enum / Code Translation

backend มักส่ง status หรือ code มาเป็น raw values เช่น

- `DRAFT`
- `PENDING`
- `APPROVED`
- `FAILED`

frontend ไม่ควรแปล label กระจายทุกหน้า  
ควรแปลผ่าน mapper หรือ status helper กลาง

### ตัวอย่าง

```ts
export function mapPurchaseStatusCodeToLabel(
  code: string | null | undefined,
): string {
  switch (code) {
    case 'DRAFT':
      return 'แบบร่าง';
    case 'PENDING':
      return 'รออนุมัติ';
    case 'APPROVED':
      return 'อนุมัติแล้ว';
    case 'FAILED':
      return 'ล้มเหลว';
    default:
      return '-';
  }
}
```

### rule

- ถ้าเป็น domain-specific label ให้ owner อยู่ใน module
- ถ้าเป็น technical/shared label ค่อยพิจารณา shared helper

---

## 13. Date / Number / String Transformation

mapper สามารถใช้ helper จาก `src/lib/date/` หรือ `src/utils/format/` ได้  
แต่ไม่ควรใส่ formatting logic ซ้ำ ๆ แบบกระจัดกระจาย

### ตัวอย่าง

```ts
export function formatDateTimeOrDash(value: string | null | undefined): string {
  if (!value) return '-';
  return value; // placeholder example
}
```

### rule

- formatting helper เป็น shared utility ได้
- แต่การตัดสินว่า field ไหนควรใช้ helper ไหน ยังเป็น responsibility ของ mapper

---

## 14. Access-Aware Mapping

บาง model อาจต้อง derive fields จาก access context ด้วย เช่น

- `canEdit`
- `canApprove`
- `canRetrySync`
- `isReadOnlyView`

### rule

- ถ้าการ derive นี้เป็นเรื่อง render convenience และใช้ effective access ชัดเจน สามารถเกิดใน service หรือ mapper composition layer ได้
- แต่ถ้ามันเป็น guard logic หลักของหน้า อย่ายัดทุกอย่างเป็น field ใน model จน guard model หายไป

### ตัวอย่าง

```ts
export type PurchaseRequestDetailModel = {
  requestId: string;
  requestNo: string;
  statusLabel: string;
  canApprove: boolean;
};

export function mapPurchaseRequestDetailDtoToModel(
  dto: PurchaseRequestDto,
  canApprove: boolean,
): PurchaseRequestDetailModel {
  return {
    requestId: dto.request_id,
    requestNo: dto.request_no ?? '-',
    statusLabel: mapPurchaseStatusCodeToLabel(dto.status_code),
    canApprove,
  };
}
```

---

## 15. Notification / Sync / Integration Mapping

เพราะระบบนี้มี notification center, sync states และ integration statuses  
mapper ควรมีบทบาทช่วย translate technical response ให้ UI ใช้ได้ง่าย

### ตัวอย่าง Notification Mapping

```ts
export function mapNotificationDtoToModel(
  dto: NotificationItemDto,
): NotificationItemModel {
  return {
    id: dto.id,
    title: dto.title ?? 'การแจ้งเตือน',
    message: dto.message ?? '-',
    severity: mapNotificationSeverity(dto.severity_code),
    isRead: dto.is_read ?? false,
    createdAtLabel: formatDateTimeOrDash(dto.created_at),
    targetUrl: dto.target_url ?? null,
  };
}
```

### ตัวอย่าง Integration Mapping

```ts
export function mapIntegrationStatusToLabel(
  code: string | null | undefined,
): string {
  switch (code) {
    case 'PENDING':
      return 'รอส่งข้อมูล';
    case 'SUCCESS':
      return 'ส่งข้อมูลสำเร็จ';
    case 'FAILED':
      return 'ส่งข้อมูลไม่สำเร็จ';
    case 'RETRYABLE':
      return 'ลองส่งใหม่ได้';
    default:
      return '-';
  }
}
```

---

## 16. API ส่งฟิลด์มาไม่ตรง -> ทำอย่างไร

use case นี้เจอบ่อยมาก

### ตัวอย่าง

API:

```ts
{
  req_no: string | null;
  req_dt: string | null;
}
```

UI อยากใช้:

```ts
{
  requestNo: string;
  requestDateLabel: string;
}
```

### คำตอบ

อย่าไปแก้ใน UI  
ให้ใช้ mapper

```ts
export function mapPurchaseRequestDtoToListItemModel(
  dto: PurchaseRequestDto,
): PurchaseRequestListItemModel {
  return {
    requestId: dto.request_id,
    requestNo: dto.req_no ?? '-',
    requestDateLabel: formatDateOrDash(dto.req_dt),
    vendorLabel: dto.vendor_name ?? '-',
    statusLabel: mapPurchaseStatusCodeToLabel(dto.status_code),
  };
}
```

---

## 17. API ส่งฟิลด์มาไม่ครบ -> ทำอย่างไร

ถ้า API ไม่ส่งทุก field ที่ UI ต้องการ  
มี 3 กรณีหลัก

### กรณี 1: field ขาด แต่ UI ใช้ fallback ได้

mapper เติม fallback

### กรณี 2: field ขาดและต้องใช้ API อื่นเติม

service orchestrates หลาย API แล้วค่อย map เป็น model

### กรณี 3: field ขาดและจริง ๆ UI ไม่ควรพยายามเดา

mapper ไม่ควร invent data เอง  
ให้สะท้อนเป็น `null`, `'-'` หรือ state ที่ UI เข้าใจได้

### rule สำคัญ

mapper เติม fallback ได้  
แต่ mapper ไม่ควร “แต่งเรื่อง” ให้ดูเหมือนมีข้อมูลจริงทั้งที่ไม่มี

---

## 18. UI ต้องประกอบข้อมูลเดียวจากหลาย API -> ทำอย่างไร

นี่เป็น use case สำคัญของ ERP

### ตัวอย่าง

หน้า `PurchaseRequestDetailPage` ต้องใช้

- purchase request dto
- vendor dto
- approval history dtos
- integration status dto

### baseline flow

- service fetch หลาย source
- service ส่งชุดข้อมูลให้ mapper
- mapper สร้าง detail model

### rule

- อย่าให้ page เรียกหลาย hooks แล้ว compose เองถ้าเป็น business object เดียวกัน
- อย่าให้ mapper ยิง API
- orchestration อยู่ที่ service
- transformation อยู่ที่ mapper

---

## 19. Mapper กับ Validation

mapper ไม่ใช่ validator หลักของระบบ  
validation หลักควรอยู่ใน

- backend
- zod schema / form validation layer
- business rules layer เมื่อเหมาะสม

### mapper ทำอะไรเกี่ยวกับ validation ได้

- trim data
- normalize types
- discard UI-only fields
- ensure DTO shape ตรง transport contract

### mapper ไม่ควรทำ

- ตัดสิน business validity ทั้งหมด
- แอบแก้ข้อมูลผิดโดยไม่แจ้งใคร
- ซ่อน validation problems ที่ควรถูกเห็น

---

## 20. Mapper กับ Side Effects

mapper ต้องไม่ทำ side effects เช่น

- ไม่ยิง API
- ไม่เขียน localStorage
- ไม่ enqueue jobs
- ไม่ trigger notifications
- ไม่ redirect
- ไม่ set state

สิ่งเหล่านี้เป็น responsibility ของ service/hook/page layer

---

## 21. Mapper Testing Recommendations

mapper เป็น pure function จึงเป็นจุดที่ test ได้ง่ายมาก

### ควร test อย่างน้อย

- null handling
- missing fields
- status code mapping
- date/number normalization
- multi-source composition
- form -> dto conversion
- draft -> form conversion

### ตัวอย่าง test cases

- dto ที่ field บางตัวเป็น null
- dto ที่ array หาย
- dto ที่ status code unknown
- form model ที่ quantity เป็น `''`
- draft ที่ไม่มี items

---

## 22. Recommended Mapper File Structure

ตัวอย่างแบบกลาง

```text
src/features/purchase/utils/
├── purchase.mapper.ts
├── purchase.helpers.ts
├── purchase.constants.ts
└── index.ts
```

ถ้า module ใหญ่

```text
src/features/purchase/utils/mappers/
├── purchase-request.mapper.ts
├── purchase-approval.mapper.ts
├── purchase-notification.mapper.ts
└── index.ts
```

---

## 23. Example: End-to-End Mapping Flow

```text
API returns DTO
-> Service receives DTO
-> Mapper converts DTO to Model
-> Hook returns Model
-> Page renders Model
```

อีก flow หนึ่ง

```text
Form submits FormModel
-> Mapper converts FormModel to DTO
-> Service sends DTO
-> API posts DTO
```

อีก flow หนึ่ง

```text
Draft loaded from IndexedDB
-> Mapper converts Draft to FormModel
-> Form renders FormModel
```

---

## 24. Anti-Patterns ที่ห้ามทำ

- render DTO ตรงใน UI
- format field กระจัดกระจายในทุก component
- map status labels ในหลายหน้าแบบคนละชุด
- ให้ page compose ข้อมูลหลาย API เองเพื่อสร้าง business object เดียว
- ให้ mapper ยิง API
- ให้ mapper trigger side effects
- ใช้ model เดียวสำหรับ list/detail/form/draft ทั้งหมด
- invent business data เองตอน API ไม่ส่งมา
- ใส่ business logic orchestration หนัก ๆ ใน mapper

---

## 25. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **กฎการแปลงข้อมูล**

### `05_frontend_type-guidelines.md`

กำหนดว่ามี type อะไรบ้าง

### `07_frontend_api-usage.md`

กำหนดว่าข้อมูลไหลจาก page/hook/service ยังไง

### `08_frontend_mock-usage.md`

กำหนดว่า mock DTO ต้องใช้ shape เดียวกับ API

### `09_frontend_component-guidelines.md`

กำหนดว่า page/component ควรรับ model แบบไหน

### `10_frontend_naming-conventions.md`

กำหนดชื่อไฟล์และชื่อฟังก์ชัน mapper

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

สรุปสาระสำคัญที่สุดของ `06_frontend_mapper-guidelines.md` คือ

- mapper คือ anti-corruption layer ระหว่าง backend contract กับ UI
- DTO -> Model, FormModel -> DTO, Draft -> FormModel และ Multi-source -> Composite Model ต้องแยกกันชัด
- ถ้า shape ไม่ต้องแปลงจริง ก็ไม่จำเป็นต้องสร้าง mapper file
- mapper ควร pure และไม่มี side effects
- service orchestrates, mapper transforms
- fallback และ normalization ต้องเกิดที่ mapper หรือ helper ที่ mapper เรียกใช้
- status/code/date/number translation ต้องไม่กระจายทั่ว UI
- ถ้า API ส่ง field ไม่ตรงหรือไม่ครบ ให้จัดการด้วย mapper/service ตามกรณี
- ถ้า UI ต้องใช้ข้อมูลจากหลาย API ให้ service รวม แล้ว mapper สร้าง final model
- mapper ของ module ควรอยู่ใน module นั้น
- helper/constant ที่ไม่เกี่ยวกับ transformation ไม่ต้องถูกเรียกว่า mapper
- naming ของ mapper ต้องบอก direction และ purpose ชัด
- mapper เป็นจุดที่ควร test มาก เพราะ pure และ critical ต่อ quality ของ UI
