# 08_frontend_mock-usage.md

# Frontend Mock Usage

ไฟล์นี้เก็บไว้เป็น reference สำหรับ mock/demo ใน isolated context เท่านั้น

> หมายเหตุ: runtime ปัจจุบันของโปรเจกต์นี้ไม่ใช้ feature-level repository/mock switching แล้ว และ service จะเรียก API ตรงเป็น baseline

ขอบเขตหลักของไฟล์นี้คือ

- mock/demo data strategy
- isolated fixtures / seeds / factories
- กฎว่า mock ต้องคืน DTO shape เดียวกับ API
- mock awareness ใน UI/Shell เฉพาะ storybook/test/demo

> ใน baseline ปัจจุบัน feature runtime anatomy ไม่ใช้ `seeds/` folder, `repository` layer หรือ mock switching แล้ว หากต้องมี data ชุดทดสอบให้เก็บไว้ใน Storybook หรือ test harness แยกจาก runtime feature tree

> Project alignment: โครงจริงใช้ `src/features/*` และบาง feature เป็น nested path (เช่น `production/stock`) ให้ยึด owner จริงตามโค้ดปัจจุบัน

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อให้ทีมพัฒนา/ทดสอบแบบ mock ได้เร็วในบริบทที่แยกจาก runtime จริง

- จะเปิด mock ที่ระดับไหนและด้วย env ชุดใด
- mock/demo selection ควรอยู่ที่ storybook/test harness หรือ wrapper เฉพาะทาง
- mock ควรคืน DTO หรือ model
- seeds/fixtures/factories ควรแยกหน้าที่อย่างไร
- UI ควรแสดงสถานะ mock แค่ไหน
- จุดใดควรใช้ mock และจุดใดต้องกลับ API จริง

ไฟล์นี้เป็นคู่มือ mock path โดยตรง และต้องอ่านคู่กับ API usage เสมอ

### อ่านต่อ

- infrastructure, config, env และ package baseline -> `03_frontend_infrastructure.md`
- type system -> `05_frontend_type-guidelines.md`
- mapper rules -> `06_frontend_mapper-guidelines.md`
- API/service flow -> `07_frontend_api-usage.md`
- naming conventions -> `10_frontend_naming-conventions.md`

---

## 2. Mock Principles

## 2.1 Mock เป็น first-class development tool

mock ไม่ใช่ของชั่วคราวแบบไร้ระบบ  
แต่เป็นเครื่องมือสำหรับ

- พัฒนา UI ระหว่าง backend ยังไม่พร้อม
- ทดสอบ states หลายแบบ
- สร้าง demo flows
- ทำ visual QA
- พัฒนา component/page แยกจาก backend dependency
- ทำ regression checks ระดับ UI

## 2.2 Mock ต้องวิ่งผ่าน flow เดียวกับ API

แม้จะใช้ mock ใน context ที่แยกจาก runtime จริง แต่ flow ควรยังเป็น

```text
Page
-> Hook
-> Service
-> API or Mock transport
-> DTO
-> Mapper
-> Model
-> UI
```

ไม่ใช่

```text
Page -> Mock Model -> UI
```

เพราะถ้า mock ข้าม DTO/mapping path ไปเลย  
ระบบจะมี behavior คนละแบบระหว่าง mock กับ API

## 2.3 Mock selection ต้องไม่รั่วเข้า runtime feature flow

การเลือกว่าจะใช้ mock หรือ transport จริงต้องไม่เกิดที่

- page
- component
- hook
- service
- mapper

และไม่ควรผูกกับ feature runtime แบบ module-level repository อีกต่อไป

## 2.4 Mock ต้องคืน DTO shape เดียวกับ API

นี่เป็นกฎสำคัญที่สุดของไฟล์นี้

> **Mock path ต้องคืน DTO shape เดียวกับ API path**

เพราะถ้า mock คืน model ตรง แต่ API คืน DTO  
page/hook/service จะเดินคนละเส้นทาง และทำให้ bug โผล่ตอนเปลี่ยนจาก mock เป็น API จริง

## 2.5 Mock ต้องช่วยพัฒนา ไม่ใช่ซ่อนปัญหา

mock ควรทำให้ทีมพัฒนาเร็วขึ้น  
แต่ไม่ควร “สวยเกินจริง” จน UI ไม่เคยเจอเคสที่ backend จริงจะส่งมา เช่น

- null fields
- empty arrays
- unknown codes
- failed status
- stale timestamps
- long text
- missing optional fields

---

## 3. Historical Mock Strategy Reference

เอกสารส่วนนี้เก็บแนวคิดเดิมไว้เพื่ออ้างอิงเท่านั้น

> **Global Default + Per-Module Override**

แนวคิดนี้ไม่ใช่ runtime baseline ของโปรเจกต์ปัจจุบันแล้ว

### ทำไมต้องใช้แนวนี้

เพราะถ้าใช้ global อย่างเดียว

- จะเปิด mock หรือ api ได้ทั้งระบบพร้อมกัน
- ง่าย แต่ไม่ยืดหยุ่นพอเมื่อบาง module พร้อม บาง module ยังไม่พร้อม

ถ้าใช้ per-module อย่างเดียว

- จะยืดหยุ่นมาก
- แต่ config จะรก และ setup ยุ่งเกินจำเป็น

ดังนั้นระบบนี้ใช้

- **global default** เป็นฐาน
- **module override** เป็นข้อยกเว้นเมื่อจำเป็นจริง

---

## 4. Env Strategy

## 4.1 Global Default

ให้ใช้ตัวแปรกลาง

```env
NEXT_PUBLIC_DATA_SOURCE=api
```

ค่าที่รองรับ baseline คือ

- `api`
- `mock`

ตัวแปรนี้หมายถึงค่า default ของทั้งระบบ

## 4.2 Per-Module Override

ถ้าบาง module ต้อง override ให้ใช้รูปแบบ

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

### rule

- ถ้า module ไม่มี override -> ใช้ global default
- ถ้า module มี override -> ใช้ override นั้น
- component/page/hook/service ไม่ต้องรู้ logic นี้
- repository เป็นผู้เรียก helper เพื่อ resolve source

---

## 5. ถ้าใช้ Global อย่างเดียว ต้องส่ง parameter เข้า function ไหม

คำตอบคือ **ไม่ต้อง**

ถ้าตั้ง global หรือ global + override แล้ว  
การเลือก source ต้องถูก resolve ภายใน repository/config layer

นั่นแปลว่า function พวกนี้

```ts
getWarehouseStockListService();
getWarehouseStockListRepository();
```

ไม่ควรต้องมี parameter แบบ

```ts
getWarehouseStockListService({ source: 'mock' });
```

หรือ

```ts
getWarehouseStockListRepository(params, 'mock');
```

เพราะจะทำให้ source selection รั่วขึ้นมาใน API ของ function และไหลกระจายไปทั่วระบบ

### baseline rule

> **source selection เป็น concern ของ repository/config ไม่ใช่ concern ของ caller**

---

## 6. Recommended Config Helpers

ควรมี helper กลางสำหรับ resolve source อยู่ใน `src/lib/config/` หรือ `src/lib/data-source/`

ตัวอย่างโครง

```text
src/lib/config/
├── env.ts
├── getAppConfig.ts
├── resolveModuleDataSource.ts
└── index.ts
```

### ตัวอย่าง type

```ts
export type DataSource = 'api' | 'mock';
```

### ตัวอย่าง helper

```ts
// src/lib/config/resolveModuleDataSource.ts
import { getAppConfig } from './getAppConfig';

export function resolveModuleDataSource(moduleName: string): 'api' | 'mock' {
  const config = getAppConfig();

  const overrideMap: Record<string, 'api' | 'mock' | undefined> = {
    access: config.accessDataSource,
    farm: config.farmDataSource,
    master: config.masterDataSource,
    purchase: config.purchaseDataSource,
    warehouse: config.warehouseDataSource,
    production: config.productionDataSource,
    health: config.healthDataSource,
    maintenance: config.maintenanceDataSource,
    sales: config.salesDataSource,
    finance: config.financeDataSource,
    insight: config.insightDataSource,
    approval: config.approvalDataSource,
    document: config.documentDataSource,
    setting: config.settingDataSource,
  };

  return overrideMap[moduleName] ?? config.dataSource;
}
```

### ตัวอย่าง `getAppConfig()`

```ts
export type AppConfig = {
  dataSource: 'api' | 'mock';
  accessDataSource?: 'api' | 'mock';
  farmDataSource?: 'api' | 'mock';
  masterDataSource?: 'api' | 'mock';
  purchaseDataSource?: 'api' | 'mock';
  warehouseDataSource?: 'api' | 'mock';
  productionDataSource?: 'api' | 'mock';
  healthDataSource?: 'api' | 'mock';
  maintenanceDataSource?: 'api' | 'mock';
  salesDataSource?: 'api' | 'mock';
  financeDataSource?: 'api' | 'mock';
  insightDataSource?: 'api' | 'mock';
  approvalDataSource?: 'api' | 'mock';
  documentDataSource?: 'api' | 'mock';
  settingDataSource?: 'api' | 'mock';
  enableMockBadge: boolean;
};
```

---

## 7. Repository Source Selection

section นี้เก็บตัวอย่าง historical reference ของ pattern เดิม

### baseline example

```ts
// src/features/warehouse/services/warehouse.repository.ts
import { resolveModuleDataSource } from '@/lib/config/resolveModuleDataSource';
import { getWarehouseStockListApi } from './warehouse.api';
import { getWarehouseStockListMock } from './warehouse.mock';
import { WarehouseStockItemDto } from '../types/warehouse.dto';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export async function getWarehouseStockListRepository(
  params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemDto[]> {
  const source = resolveModuleDataSource('warehouse');

  if (source === 'mock') {
    return getWarehouseStockListMock(params);
  }

  return getWarehouseStockListApi(params);
}
```

### rule

- repository รู้ source
- service ไม่ต้องรู้
- hook ไม่ต้องรู้
- page ไม่ต้องรู้

---

## 8. Mock File Structure

baseline ภายใน module ให้ใช้โครงนี้

```text
src/features/<module>/
├── services/
│   ├── <module>.api.ts
│   ├── <module>.repository.ts
│   ├── <module>.service.ts
│   └── <module>.mock.ts
├── mocks/
│   ├── seeds/
│   ├── fixtures/
│   ├── factories/
│   └── index.ts
```

### ความหมาย

#### `<module>.mock.ts`

เป็น mock source entry  
ทำหน้าที่คืน DTO จาก seeds/fixtures/factories

#### `mocks/seeds/`

เก็บข้อมูลชุด baseline ที่ใช้ซ้ำได้ เช่น records เริ่มต้น

#### `mocks/fixtures/`

เก็บชุดข้อมูลเฉพาะ use case หรือ state เช่น

- empty list
- large dataset
- failed status
- pending approval
- stale sync state

#### `mocks/factories/`

เก็บฟังก์ชันสร้างข้อมูล mock แบบ dynamic

---

## 9. Seeds / Fixtures / Factories ต่างกันยังไง

## 9.1 Seeds

seeds คือข้อมูลตั้งต้นที่ reusable และค่อนข้าง stable

ตัวอย่าง

- รายการคลัง 10 รายการ
- รายการ purchase request baseline
- assignments baseline
- notification baseline

### ใช้เมื่อ

- ต้องการ baseline dataset
- ต้องการ data สำหรับ demo/dev ที่ใช้บ่อย
- ต้องการ data ชุดเริ่มต้นใน mock mode

## 9.2 Fixtures

fixtures คือข้อมูลที่เจาะจง use case หรือ state

ตัวอย่าง

- purchase request แบบ empty items
- warehouse stock list ที่มี blocked items
- approval detail ที่ rejected
- finance closing summary ที่ failed integration

### ใช้เมื่อ

- ต้องการทดสอบ state เฉพาะ
- ต้องการ story/use case ชัด ๆ
- ต้องการ visual QA เฉพาะสถานการณ์

## 9.3 Factories

factories คือฟังก์ชันที่สร้างข้อมูล mock แบบ dynamic

ตัวอย่าง

- สร้าง stock items ตามจำนวนที่ต้องการ
- สร้าง purchase requests แบบ random id/status
- สร้าง notifications หลายระดับ severity

### ใช้เมื่อ

- ต้องการ list ยาว
- ต้องการ data หลายแบบแต่โครงเดียวกัน
- ต้องการ generate state ตาม params

---

## 10. Example Mock Structure

ตัวอย่างสำหรับ warehouse

```text
src/features/warehouse/mocks/
├── seeds/
│   └── warehouse-stock.seed.ts
├── fixtures/
│   ├── warehouse-stock.empty.fixture.ts
│   ├── warehouse-stock.blocked.fixture.ts
│   └── warehouse-stock.large.fixture.ts
├── factories/
│   └── warehouse-stock.factory.ts
└── index.ts
```

### ตัวอย่าง seed

```ts
// warehouse-stock.seed.ts
import { WarehouseStockItemDto } from '../../types/warehouse.dto';

export const warehouseStockSeed: WarehouseStockItemDto[] = [
  {
    item_id: 'ITEM-001',
    item_name: 'ข้าวโพด',
    qty_on_hand: 1200,
    updated_at: '2026-03-16T08:00:00Z',
  },
  {
    item_id: 'ITEM-002',
    item_name: 'หัวอาหาร',
    qty_on_hand: 350,
    updated_at: '2026-03-16T08:10:00Z',
  },
];
```

### ตัวอย่าง fixture

```ts
// warehouse-stock.empty.fixture.ts
import { WarehouseStockItemDto } from '../../types/warehouse.dto';

export const warehouseStockEmptyFixture: WarehouseStockItemDto[] = [];
```

### ตัวอย่าง factory

```ts
// warehouse-stock.factory.ts
import { WarehouseStockItemDto } from '../../types/warehouse.dto';

export function createWarehouseStockDto(index: number): WarehouseStockItemDto {
  return {
    item_id: `ITEM-${String(index).padStart(3, '0')}`,
    item_name: `สินค้า ${index}`,
    qty_on_hand: index * 10,
    updated_at: '2026-03-16T08:00:00Z',
  };
}

export function createWarehouseStockListDto(
  count: number,
): WarehouseStockItemDto[] {
  return Array.from({ length: count }, (_, i) =>
    createWarehouseStockDto(i + 1),
  );
}
```

---

## 11. Mock DTO Shape Rule

กฎสำคัญของไฟล์นี้คือ

> **mock ต้องคืน DTO shape เดียวกับ API**

### ตัวอย่างที่ถูก

```ts
export async function getWarehouseStockListMock(): Promise<
  WarehouseStockItemDto[]
> {
  return warehouseStockSeed;
}
```

### ตัวอย่างที่ผิด

```ts
export async function getWarehouseStockListMock(): Promise<
  WarehouseStockItemModel[]
> {
  return warehouseStockSeed.map(mapWarehouseStockItemDtoToModel);
}
```

เหตุผลที่ผิดคือทำให้ mock path กับ api path คนละ flow

---

## 12. Mock Source Entry ควรทำอะไร

`<module>.mock.ts` ควรเป็น entry point สำหรับ mock path ของ module  
และควรทำหน้าที่ประมาณนี้

- รับ params แบบเดียวกับ api function
- คืน DTO shape เดียวกับ API
- ใช้ seeds / fixtures / factories ภายใน
- จำลอง filtering / paging / sorting เบื้องต้นเมื่อจำเป็น

### ตัวอย่าง

```ts
// src/features/purchase/services/purchase.mock.ts
import { PurchaseRequestDto } from '../types/purchase.dto';
import { purchaseRequestSeed } from '../mocks/seeds/purchase-request.seed';
import { PurchaseRequestListQueryParams } from '../types/purchase.query';

export async function getPurchaseRequestListMock(
  params: PurchaseRequestListQueryParams,
): Promise<PurchaseRequestDto[]> {
  let rows = [...purchaseRequestSeed];

  if (params.keyword) {
    rows = rows.filter((row) =>
      (row.request_no ?? '')
        .toLowerCase()
        .includes(params.keyword.toLowerCase()),
    );
  }

  return rows;
}
```

### rule

mock entry ทำ filtering/paging จำลองได้  
แต่ไม่ควรพยายาม replicate backend behavior 100% จนไฟล์ซับซ้อนเกินจำเป็น

---

## 13. Mock กับ Mapper ต้องสัมพันธ์กันยังไง

เพราะ mock คืน DTO shape เดียวกับ API  
mapper ไม่ต้องรู้เลยว่าตอนนี้ source มาจาก mock หรือ API

### flow ที่ถูก

```text
Mock DTO
-> Mapper
-> Model
```

และ

```text
API DTO
-> Mapper
-> Model
```

### ผลดี

- UI behavior เหมือนกัน
- เปลี่ยน source ได้โดยไม่กระทบ hook/page/component
- test mapping path ได้จริง

---

## 14. Mock กับ Access-Aware Data

บาง module ต้องใช้ current access หรือ scope ในการ query  
mock path ก็ควร respect สิ่งนี้ในระดับที่พอเหมาะ

### ตัวอย่าง

ถ้า warehouse query ใช้ `scopeId`
mock path ควรรับ `scopeId` ด้วย และสามารถ filter จำลองตาม scope ได้

```ts
export async function getWarehouseStockListMock(
  params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemDto[]> {
  let rows = [...warehouseStockSeed];

  if (params.scopeId) {
    rows = rows.filter((row) => row.warehouse_id === params.scopeId);
  }

  return rows;
}
```

### rule

mock ไม่จำเป็นต้องสมจริง 100%
แต่ต้องไม่ขัดกับ mental model ของระบบจนหน้า UI ทำงานคนละแบบกับ API จริง

---

## 15. Mock Badge / Mock Awareness

เพราะระบบนี้รองรับ mock อย่างจริงจัง  
ผู้ใช้ dev/test ควรรับรู้ได้ว่าตอนนี้ระบบอยู่ใน mock mode หรือไม่

## 15.1 Baseline Rule

ถ้าเปิด mock mode ควรมี **mock badge** หรือ visual cue ที่เหมาะสม

## 15.2 Placement

mock badge เป็น shell-level concern  
จึงควรแสดงใน shell เช่น

- sidebar utility zone
- page toolbar บางกรณี
- หรือ shell status strip

ไม่ควรไปแอบซ่อนใน component ย่อย

## 15.3 Enable Flag

สามารถควบคุมผ่าน env เช่น

```env
NEXT_PUBLIC_ENABLE_MOCK_BADGE=true
```

### rule

- badge มีไว้สำหรับ dev/staging/review builds
- production จริงไม่ควรใช้ถ้าไม่ได้มีเหตุผลชัดเจน

---

## 16. Mock กับ Notification / Integration / Offline States

mock ไม่ควรมีแค่ happy path  
แต่ควรช่วยจำลอง states สำคัญของระบบได้ เช่น

- failed sync
- pending integration
- stale data
- offline-recovered draft
- unread notifications
- empty notifications
- approval pending

### why

เพราะระบบนี้มี shell notification center และ offline/integration-aware UX  
ถ้า mock มีแต่ success state ทีมจะออกแบบ UI states ได้ไม่ครบ

---

## 17. Mock Latency / Async Behavior

mock functions ควรเป็น `async` เสมอ ถึงแม้ข้อมูลจะอยู่ใน memory

### why

- ให้ page/hook ใช้งานแบบเดียวกับ API
- ทำให้ loading states ยังทำงานจริง
- ลดปัญหาพอเปลี่ยนจาก mock ไป api แล้ว behavior เปลี่ยน

### helper ที่แนะนำ

```ts
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
```

### example

```ts
export async function getNotificationListMock(): Promise<
  NotificationItemDto[]
> {
  await sleep(300);
  return notificationSeed;
}
```

---

## 18. Mock กับ Pagination / Sorting / Filtering

ถ้า list page ของระบบมี

- page
- pageSize
- sort
- filter

mock path ควรรองรับสิ่งเหล่านี้ในระดับพื้นฐานอย่างสม่ำเสมอ  
เพื่อให้ UI list/table behavior ทดสอบได้จริง

### rule

- filtering เบื้องต้น ควรทำ
- pagination เบื้องต้น ควรทำ
- sorting เบื้องต้น ควรทำเมื่อหน้าใช้จริง
- ไม่ต้อง replicate SQL/backend logic ทุกจุด

### example

```ts
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
```

---

## 19. Mock กับ Mutation

mutation mock path ควรคืน response shape ที่พอใช้กับ flow จริงได้ เช่น

- create -> คืน dto/result ที่ใกล้เคียง API
- update -> คืน updated dto/result
- delete -> คืน success response
- retry sync -> คืน updated integration status

### rule

- mutation mock ควรยังวิ่งผ่าน service/repository flow เดียวกัน
- ถ้าต้องจำลอง persistence ใน memory ทำได้ แต่ต้องควบคุม complexity
- ถ้า mock mutation ต้องการ stateful behavior มาก ควรระบุให้ชัดว่าเป็น dev/test-only pattern

---

## 20. Seeds Versioning / Maintenance

เมื่อระบบโตขึ้น seeds/fixtures จะเยอะ  
ดังนั้นต้องมี discipline

### rules

- seed file ต้องใช้ชื่อที่บอก domain ชัด
- fixture file ต้องสื่อ state/use case ชัด
- อย่ากองทุกอย่างในไฟล์ mock file เดียว
- ถ้า DTO เปลี่ยน ต้องอัปเดต seeds/fixtures ด้วย
- ถ้ามี field ใหม่ที่สำคัญต่อ UI อย่าปล่อยให้ seed เก่าขาด field จน UI test หลอกตัวเอง

---

## 21. Example: End-to-End Source Switching

ตัวอย่างเต็มของ global + module override

### env

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_WAREHOUSE_DATA_SOURCE=mock
NEXT_PUBLIC_FINANCE_DATA_SOURCE=mock
NEXT_PUBLIC_ENABLE_MOCK_BADGE=true
```

### config

```ts
export type AppConfig = {
  dataSource: 'api' | 'mock';
  warehouseDataSource?: 'api' | 'mock';
  financeDataSource?: 'api' | 'mock';
  enableMockBadge: boolean;
};

export function getAppConfig(): AppConfig {
  return {
    dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'api') as
      | 'api'
      | 'mock',
    warehouseDataSource: process.env.NEXT_PUBLIC_WAREHOUSE_DATA_SOURCE as
      | 'api'
      | 'mock'
      | undefined,
    financeDataSource: process.env.NEXT_PUBLIC_FINANCE_DATA_SOURCE as
      | 'api'
      | 'mock'
      | undefined,
    enableMockBadge: process.env.NEXT_PUBLIC_ENABLE_MOCK_BADGE === 'true',
  };
}
```

### resolve helper

```ts
export function resolveModuleDataSource(moduleName: string): 'api' | 'mock' {
  const config = getAppConfig();

  const overrides: Record<string, 'api' | 'mock' | undefined> = {
    warehouse: config.warehouseDataSource,
    finance: config.financeDataSource,
  };

  return overrides[moduleName] ?? config.dataSource;
}
```

### repository

```ts
export async function getFinanceClosingSummaryRepository(): Promise<FinanceClosingSummaryDto> {
  const source = resolveModuleDataSource('finance');

  if (source === 'mock') {
    return getFinanceClosingSummaryMock();
  }

  return getFinanceClosingSummaryApi();
}
```

### service

```ts
export async function getFinanceClosingSummaryService(): Promise<FinanceClosingSummaryModel> {
  const dto = await getFinanceClosingSummaryRepository();
  return mapFinanceClosingSummaryDtoToModel(dto);
}
```

### page/hook

ไม่ต้องรู้เลยว่าใช้ mock หรือ api

---

## 22. Use Case Matrix

| Use Case                                        | Recommended Strategy                     |
| ----------------------------------------------- | ---------------------------------------- |
| backend ยังไม่พร้อมทั้งระบบ                     | ใช้ global `mock`                        |
| บาง module พร้อม บาง module ยังไม่พร้อม         | ใช้ global default + module override     |
| ต้องการทดสอบ empty state                        | ใช้ fixture                              |
| ต้องการทดสอบ large dataset                      | ใช้ factory                              |
| ต้องการ baseline dev data                       | ใช้ seed                                 |
| ต้องการทดสอบ list/table behavior                | mock รองรับ filtering/pagination/sorting |
| ต้องการทดสอบ notification center                | มี notification seeds/fixtures           |
| ต้องการทดสอบ pending/failed sync                | มี integration/sync fixtures             |
| ต้องการพัฒนา UI โดยไม่ให้ source selection รั่ว | เลือก source ที่ repository เท่านั้น     |

---

## 23. Anti-Patterns ที่ห้ามทำ

- page ส่ง parameter `source: 'mock'` ลงไปเอง
- hook รู้ว่าตอนนี้ใช้ api หรือ mock
- service เลือก source เอง
- mock path คืน model แต่ api path คืน DTO
- mock data อยู่กระจัดกระจายทั่ว components
- ไม่มี seeds/fixtures/factories แยกชัด
- mock มีแต่ happy path
- mock function ไม่เป็น async
- เปลี่ยน source โดยแก้หลายไฟล์แทนที่จะใช้ config/repository
- ใช้ mock เพื่อหลีกเลี่ยงการแก้ mapper/type ที่ถูกต้อง

---

## 24. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **mock strategy และ source switching rules**

### `03_frontend_infrastructure.md`

กำหนด config/env/persistence foundations

### `05_frontend_type-guidelines.md`

กำหนด DTO/model/form types

### `06_frontend_mapper-guidelines.md`

กำหนดว่า DTO ถูก map เป็น model ยังไง

### `07_frontend_api-usage.md`

กำหนด service/repository/api flow จริง

### `10_frontend_naming-conventions.md`

กำหนด naming ของ env files, mock files, seed/fixture/factory names

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 25. Summary

สรุปสาระสำคัญที่สุดของ `08_frontend_mock-usage.md` คือ

- mock strategy ในไฟล์นี้เป็น reference ของ pattern เก่า
- runtime ปัจจุบันของโปรเจกต์ไม่ใช้ module-level source selection แล้ว
- ถ้าต้องมี mock ให้ผูกกับ storybook/test/demo harness แยกจาก runtime
- mock path ยังควรคืน **DTO shape เดียวกับ API path**
- seeds, fixtures และ factories ควรแยกหน้าที่กันชัดใน isolated context
- mock ควรรองรับ async behavior, filter/pagination/sort baseline และ states สำคัญของระบบในบริบท demo/test
- shell ควรมี mock badge/cue เมื่อเปิด mock mode ในบริบท demo/test
- mock strategy ที่ดีช่วยให้พัฒนาเร็วขึ้น โดยไม่ทำลาย architecture กลางของระบบ
