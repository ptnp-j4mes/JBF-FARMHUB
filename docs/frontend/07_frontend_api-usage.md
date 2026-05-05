# 07_frontend_api-usage.md

# Frontend API Usage

ไฟล์นี้กำหนด flow การเรียกข้อมูลของ Frontend ตั้งแต่ page ถึง API และกลับมาสู่ UI

ไฟล์นี้ครอบคลุม

- page -> hook -> service -> api -> mapper
- query/mutation และ invalidation strategy
- access-aware fetching และ params flow
- error/loading states สำหรับ data flow
- current runtime boundary ระหว่าง service, api และ mapper

> Project alignment: ใน repo ปัจจุบัน `<module>` อาจเป็น path แบบ nested เช่น `admin/users`, `production/stock`, `reports/*` ภายใต้ `src/features/`

> หมายเหตุ: feature-level repository/mock switching เป็น pattern เก่าและไม่ใช่ runtime baseline ของโปรเจกต์นี้แล้ว
> ตัวอย่างบางส่วนด้านล่างเก็บไว้เพื่อเทียบ historical flow เท่านั้น

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อให้ทีม implement data flow เหมือนกันทุก module

- page ต้องบางแค่ไหน และห้ามเรียก API ตรงหรือไม่
- hook/service/api/mapper มีขอบเขตงานอะไร
- mapper ต้องถูกเรียกก่อน UI ที่ชั้นไหน
- query key/invalidation ต้องนิยามและใช้แบบเดียวกัน
- error/loading/empty states ควรผูกกับ flow ตรงไหน
- เมื่อ service เรียก API ตรง ต้องวาง transport boundary ที่จุดใด

ไฟล์นี้ไม่แทน infra docs หรือ mock docs แต่เป็นคู่มือ flow ข้อมูลจริงของแอป

### อ่านต่อ

- infrastructure foundation -> `03_frontend_infrastructure.md`
- auth/access model -> `04_frontend_auth-access.md`
- type system -> `05_frontend_type-guidelines.md`
- mapper rules -> `06_frontend_mapper-guidelines.md`
- mock/reference usage -> `08_frontend_mock-usage.md`
- component composition -> `09_frontend_component-guidelines.md`

---

## 2. API Usage Principles

## 2.1 Page ห้ามยิง API ตรง

page มีหน้าที่ compose screen และตัดสินใจว่า render อะไร  
ไม่ควรเป็นคนสร้าง HTTP request เอง

## 2.2 Hook เป็น owner ของ query/mutation state

hook ควรเป็นคนถือ

- loading
- error
- success
- refetch
- mutation submit
- form integration
- state ที่สัมพันธ์กับ data flow ของหน้านั้น

## 2.3 Service เป็น owner ของ use case orchestration

service ควรเป็นคน

- เรียก API ตาม use case
- combine หลาย API call เมื่อจำเป็น
- เรียก mapper
- คืน model ให้ hook/page ใช้

## 2.4 API file เป็น transport layer

api file มีหน้าที่

- เรียก `httpClient`
- ส่ง params/payload
- รับ raw response DTO

api file ไม่ควรเป็นคนทำ business orchestration หรือ UI transformation

## 2.5 Mapper ต้องอยู่ก่อน UI เสมอ

DTO ห้ามหลุดเข้า UI  
service composition ต้องเรียก mapper ก่อนคืนข้อมูล

## 2.6 Access-aware fetching ต้องไม่อยู่แค่ตอน render

query key, params, enable condition และ service orchestration ต้องอิง current access ด้วย  
ห้ามเช็คสิทธิ์เฉพาะตอน render แล้ว query ไปผิด scope ตั้งแต่แรก

---

## 3. Final Data Flow ของระบบ

flow หลักของระบบนี้คือ

```text
Page
-> Hook
-> Service
-> API
-> DTO
-> Mapper
-> Model
-> Hook
-> Page / Component
```

อีกมุมหนึ่งในเชิงไฟล์

```text
src/app/.../page.tsx
-> src/features/<module>/pages/XxxPage.tsx
-> src/features/<module>/hooks/use<Module><PagePurpose>Page.ts
-> src/features/<module>/services/all.service.ts
-> src/features/<module>/services/<domain>.service.ts
-> src/features/<module>/services/<domain>.api.ts (ถ้ามีการแยก transport layer)
-> mapper
-> model
```

---

## 4. Layer Responsibilities

## 4.1 Page Responsibility

page ควรทำ

- อ่าน route params
- อ่าน current access ที่จำเป็น
- เรียก page hook
- render screen/sections
- ส่ง callbacks ให้ components

page ไม่ควรทำ

- เรียก `httpClient`
- map DTO
- ตัดสิน data source
- combine หลาย API เอง
- parse response เอง

## 4.2 Hook Responsibility

hook ควรทำ

- เรียก `useQuery` / `useMutation`
- compose query keys
- manage enabled condition
- expose `data`, `isLoading`, `isError`, `refetch`, `submit`
- จัดการ interaction state ที่สัมพันธ์กับ data flow
- ตั้งชื่อ hook ตาม pattern ที่ชัดเจน
  - query hook: `use<Module><Purpose>Query`
  - mutation hook: `use<Module><Action><Purpose>Mutation`
  - page hook: `use<Module><Purpose>Page`

hook ไม่ควรทำ

- ถือ backend contract ดิบไป render
- ยัด business mapping logic ยาว ๆ
- ยิง HTTP ตรง

## 4.3 Service Responsibility

service ควรทำ

- orchestrate use case
- combine หลาย API calls
- เรียก mapper
- คืน final model ให้ hook ใช้
- ตัดสิน flow บางอย่างของ use case เช่น detail page ต้องดึงข้อมูลอะไรเพิ่มบ้าง

service ไม่ควรทำ

- ถือ React state
- use React hooks
- แตะ UI
- แตะ browser storage โดยตรงถ้าไม่ใช่ use case เฉพาะที่ชัดมาก

## 4.4 API File Responsibility

api file ควรทำ

- เรียก `httpClient`
- ส่ง params/payload
- คืน DTO/raw response

api file ไม่ควรทำ

- access guard logic
- UI model mapping
- use case orchestration

---

## 5. Recommended Service Structure

ตัวอย่างโครงใน module

```text
src/features/<module>/services/
├── all.service.ts
├── user-assignment.service.ts
├── user.service.ts
├── role.service.ts
├── permission.service.ts
├── company.service.ts
├── <domain>.api.ts
└── index.ts
```

### `all.service.ts`

public surface ของ module สำหรับให้ page/hook import จากที่เดียว

### `<domain>.service.ts`

service ตามโดเมนหรือ tab เฉพาะทาง เช่น assignment, user, role, permission, company

### `<domain>.api.ts`

transport calls ตรง ๆ ถ้าต้องการแยก HTTP layer ออกจาก orchestration เพิ่มเติม

---

## 6. Query Flow Example

ตัวอย่าง end-to-end ของ list page

## 6.1 DTO / Model

```ts
// src/features/warehouse/types/warehouse.dto.ts
export type WarehouseStockItemDto = {
  item_id: string;
  item_name: string | null;
  qty_on_hand: number | null;
  updated_at: string | null;
};

// src/features/warehouse/types/warehouse.model.ts
export type WarehouseStockItemModel = {
  itemId: string;
  itemName: string;
  quantityOnHand: number;
  updatedAtLabel: string;
};
```

## 6.2 Mapper

```ts
// src/features/warehouse/utils/warehouse.mapper.ts
import { WarehouseStockItemDto } from '../types/warehouse.dto';
import { WarehouseStockItemModel } from '../types/warehouse.model';

export function mapWarehouseStockItemDtoToModel(
  dto: WarehouseStockItemDto,
): WarehouseStockItemModel {
  return {
    itemId: dto.item_id,
    itemName: dto.item_name ?? '-',
    quantityOnHand: dto.qty_on_hand ?? 0,
    updatedAtLabel: dto.updated_at ?? '-',
  };
}
```

## 6.3 API file

```ts
// src/features/warehouse/services/warehouse.api.ts
import { httpClient } from '@/lib/http/httpClient';
import { WarehouseStockItemDto } from '../types/warehouse.dto';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export async function getWarehouseStockListApi(
  params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemDto[]> {
  const response = await httpClient.get<WarehouseStockItemDto[]>(
    '/warehouse/stock',
    {
      params,
    },
  );

  return response.data;
}
```

## 6.4 Mock file

```ts
// src/features/warehouse/services/warehouse.mock.ts
import { WarehouseStockItemDto } from '../types/warehouse.dto';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export async function getWarehouseStockListMock(
  _params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemDto[]> {
  return [
    {
      item_id: 'ITEM-001',
      item_name: 'ข้าวโพด',
      qty_on_hand: 1200,
      updated_at: '2026-03-16T08:00:00Z',
    },
  ];
}
```

## 6.5 Repository

```ts
// src/features/warehouse/services/warehouse.repository.ts
import { getAppConfig } from '@/lib/config/getAppConfig';
import { getWarehouseStockListApi } from './warehouse.api';
import { getWarehouseStockListMock } from './warehouse.mock';
import { WarehouseStockItemDto } from '../types/warehouse.dto';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export async function getWarehouseStockListRepository(
  params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemDto[]> {
  const config = getAppConfig();

  if (config.dataSource === 'mock') {
    return getWarehouseStockListMock(params);
  }

  return getWarehouseStockListApi(params);
}
```

## 6.6 Service

```ts
// src/features/warehouse/services/warehouse.service.ts
import { getWarehouseStockListRepository } from './warehouse.repository';
import { mapWarehouseStockItemDtoToModel } from '../utils/warehouse.mapper';
import { WarehouseStockItemModel } from '../types/warehouse.model';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export async function getWarehouseStockListService(
  params: WarehouseStockListQueryParams,
): Promise<WarehouseStockItemModel[]> {
  const dtos = await getWarehouseStockListRepository(params);
  return dtos.map(mapWarehouseStockItemDtoToModel);
}
```

## 6.7 Hook

```ts
// src/features/warehouse/hooks/useWarehouseStockListQuery.ts
import { useQuery } from '@tanstack/react-query';
import { getWarehouseStockListService } from '../services/warehouse.service';
import { warehouseQueryKeys } from '../utils/warehouse.query-keys';
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export function useWarehouseStockListQuery(
  params: WarehouseStockListQueryParams,
) {
  return useQuery({
    queryKey: warehouseQueryKeys.stockList(params),
    queryFn: () => getWarehouseStockListService(params),
  });
}
```

## 6.8 Page

```tsx
// src/features/warehouse/pages/WarehouseStockPage.tsx
export function WarehouseStockPage() {
  const params = {
    page: 1,
    pageSize: 25,
    keyword: '',
  };

  const { data, isLoading, isError } = useWarehouseStockListQuery(params);

  if (isLoading) return <LoadingState title="กำลังโหลดข้อมูลคลัง..." />;
  if (isError) return <ErrorState title="โหลดข้อมูลไม่สำเร็จ" />;

  return <WarehouseStockTable rows={data ?? []} />;
}
```

---

## 7. Mutation Flow Example

ตัวอย่าง create flow

## 7.1 FormModel -> DTO

```ts
// src/features/purchase/utils/purchase.mapper.ts
import { PurchaseRequestFormModel } from '../types/purchase.form';

export type CreatePurchaseRequestDto = {
  request_date: string;
  vendor_id: string;
  reason: string | null;
};

export function mapPurchaseRequestFormModelToCreateDto(
  form: PurchaseRequestFormModel,
): CreatePurchaseRequestDto {
  return {
    request_date: form.requestDate,
    vendor_id: form.vendorId,
    reason: form.reason.trim() || null,
  };
}
```

## 7.2 API / Repository / Service

```ts
// purchase.api.ts
export async function createPurchaseRequestApi(
  payload: CreatePurchaseRequestDto,
) {
  const response = await httpClient.post('/purchase/requests', payload);
  return response.data;
}
```

```ts
// purchase.repository.ts
export async function createPurchaseRequestRepository(
  payload: CreatePurchaseRequestDto,
) {
  const config = getAppConfig();

  if (config.dataSource === 'mock') {
    return createPurchaseRequestMock(payload);
  }

  return createPurchaseRequestApi(payload);
}
```

```ts
// purchase.service.ts
import { mapPurchaseRequestFormModelToCreateDto } from '../utils/purchase.mapper';

export async function createPurchaseRequestService(
  form: PurchaseRequestFormModel,
) {
  const payload = mapPurchaseRequestFormModelToCreateDto(form);
  return createPurchaseRequestRepository(payload);
}
```

## 7.3 Hook with Mutation

```ts
// src/features/purchase/hooks/usePurchaseCreateRequestMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchaseRequestService } from '../services/purchase.service';
import { purchaseQueryKeys } from '../utils/purchase.query-keys';

export function usePurchaseCreateRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseRequestService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: purchaseQueryKeys.all,
      });
    },
  });
}
```

## 7.4 Page submit

```tsx
const createMutation = usePurchaseCreateRequestMutation();

const onSubmit = (form: PurchaseRequestFormModel) => {
  createMutation.mutate(form);
};
```

---

## 8. Query Key Strategy

query keys ต้องมีระบบ ไม่ใช่ตั้ง ad hoc ทุกหน้า

## 8.1 Recommended Pattern

ให้แต่ละ module มี query key helper ของตัวเอง

```ts
// src/features/warehouse/utils/warehouse.query-keys.ts
import { WarehouseStockListQueryParams } from '../types/warehouse.query';

export const warehouseQueryKeys = {
  all: ['warehouse'] as const,
  stock: ['warehouse', 'stock'] as const,
  stockList: (params: WarehouseStockListQueryParams) =>
    ['warehouse', 'stock', 'list', params] as const,
  stockDetail: (itemId: string) =>
    ['warehouse', 'stock', 'detail', itemId] as const,
};
```

## 8.2 Rules

- key ต้องสื่อ domain ชัด
- key ต้องมี namespace กลางของ module
- params ต้องอยู่ใน key เมื่อ data ขึ้นกับ params จริง
- current access sensitive queries ต้องสะท้อน current access ใน key หรือถูก invalidate เมื่อ access เปลี่ยน

---

## 9. Invalidation Strategy

mutation สำเร็จแล้วต้องรู้ว่าจะ invalidate อะไร

## 9.1 Baseline Rules

- create/update/delete ต้อง invalidate list/detail ที่เกี่ยวข้อง
- ถ้า mutation เปลี่ยน summary/dashboard widget ที่ผูกกัน ควร invalidate ด้วย
- ถ้า current access เปลี่ยน ให้ clear หรือ invalidate access-sensitive queries
- อย่า invalidate ทุกอย่างแบบไม่มีเหตุผลในทุก mutation

## 9.2 Example

```ts
onSuccess: (_result, variables) => {
  queryClient.invalidateQueries({
    queryKey: purchaseQueryKeys.all,
  });

  if (variables.vendorId) {
    queryClient.invalidateQueries({
      queryKey: vendorQueryKeys.detail(variables.vendorId),
    });
  }
};
```

---

## 10. Access-Aware Fetching

ระบบนี้ต้อง access-aware ตั้งแต่ชั้น hook/service/query ไม่ใช่เฉพาะตอน render

## 10.1 สิ่งที่ต้องอิง current access

- query params
- enabled conditions
- query keys เมื่อมี scope sensitivity
- service orchestration บางส่วน
- page guards
- data guards

## 10.2 Example

```ts
import { useAccess } from '@/contexts/AccessContext';
import { warehousePermissions } from '../utils/warehouse.permissions';

export function useWarehouseStockListAccessQuery() {
  const { effectiveAccess } = useAccess();

  const scopeId = effectiveAccess?.scopeId ?? null;
  const canView =
    !!effectiveAccess &&
    effectiveAccess.permissions.includes(warehousePermissions.viewStock);

  return useQuery({
    queryKey: ['warehouse', 'stock', 'list', scopeId],
    queryFn: () =>
      getWarehouseStockListService({
        scopeId,
        page: 1,
        pageSize: 25,
      }),
    enabled: canView,
  });
}
```

## 10.3 Rule สำคัญ

- data guard ต้องไม่เกิดเฉพาะใน component render
- ถ้าไม่ควร query ก็ต้องไม่ query ตั้งแต่แรก

---

## 11. Params / Filter / Sort / Pagination Flow

ในระบบ ERP หน้าจำนวนมากเป็น list-heavy  
ดังนั้น flow ของ params ต้องชัด

```text
Page filter state
-> Hook receives params
-> Hook uses query key + queryFn
-> Service forwards params
-> Repository forwards params
-> API file sends params
```

## 11.1 Example Types

```ts
export type WarehouseStockListQueryParams = {
  scopeId: string | null;
  page: number;
  pageSize: number;
  keyword?: string;
  includeBlocked?: boolean;
};
```

## 11.2 Rule

- UI filter state ไม่จำเป็นต้องเท่ากับ backend params 100%
- service/repository มีสิทธิ์ normalize params ก่อนยิง API
- page size defaults ของระบบควรสอดคล้องกับ UI standards

---

## 12. Multi-Source Composition Flow

บางหน้าต้องใช้หลาย API เพื่อสร้าง object เดียวสำหรับ UI

## 12.1 Rule

- orchestration อยู่ที่ service
- repository เรียก source ทีละชุด
- mapper compose final model
- page ไม่ควรรวมหลาย result เองถ้าเป็น business object เดียวกัน

## 12.2 Example

```ts
// approval.service.ts
export async function getApprovalDetailService(approvalId: string) {
  const [documentDto, historyDtos, commentDtos, integrationDto] =
    await Promise.all([
      getApprovalDocumentRepository(approvalId),
      getApprovalHistoryRepository(approvalId),
      getApprovalCommentsRepository(approvalId),
      getApprovalIntegrationStatusRepository(approvalId),
    ]);

  return mapApprovalSourcesToDetailModel({
    document: documentDto,
    history: historyDtos,
    comments: commentDtos,
    integration: integrationDto,
  });
}
```

---

## 13. Error Handling Strategy

## 13.1 Transport Error vs Business Error

ระบบต้องแยกอย่างน้อย 2 ชั้น

- transport error เช่น network, timeout, 500
- business/validation error เช่น rule violation, invalid state, denied action

## 13.2 Responsibility

- `httpClient` / transport layer ช่วย normalize transport shape
- service/hook/page ตัดสินใจว่าจะสื่อ error ยังไง
- UI ใช้มาตรฐานของระบบ เช่น dialog, toast, inline alert, error state

## 13.3 Example

```ts
try {
  await createPurchaseRequestService(form);
} catch (error) {
  // hook/page decides whether to toast, show inline error, or map field errors
}
```

### Rule

- อย่าให้ api file แสดง toast เอง
- อย่าให้ mapper ตัดสินใจเรื่อง UI error state

---

## 14. Loading State Strategy

ระบบนี้มี loading อย่างน้อย 3 ชั้น

1. route/loading level
2. page/query loading
3. section-specific loading

## 14.1 Hook ควร expose loading state ชัด

เช่น

- `isLoading`
- `isFetching`
- `isPending`
- `isSubmitting`

## 14.2 Page ควรเลือก render state ให้เหมาะ

เช่น

- โหลดทั้งหน้า
- โหลดเฉพาะ section
- refetch แบบไม่ block page

---

## 15. Service Should Return Models, Not DTOs

baseline สำคัญของระบบนี้คือ

> **service ควรคืน model ให้ hook/page ใช้**  
> ไม่ควรคืน DTO ให้ UI ไป map ต่อเอง

### Allowed exception

ในบาง use case infrastructure-heavy มาก ๆ อาจมี intermediate DTO usage ใน service ได้  
แต่ output ที่ออกจาก service ไปสู่ hook/page ควรเป็น model หรือ use-case-friendly result

---

## 16. Repository Should Return DTOs, Not Models

baseline ของ repository คือ

> **repository ควรคืน DTO/raw transport data**  
> ไม่ควรแอบ map เป็น UI model เอง

เพราะ repository เป็น owner ของ source selection และ transport boundary  
ไม่ใช่ owner ของ UI representation

### หมายเหตุ

มีบางทีมที่ map ใน repository ได้ แต่ docs ชุดนี้ไม่แนะนำ เพราะจะทำให้ repository แบกหลาย concern เกินไป

---

## 17. Mock กับ API ต้องวิ่งผ่าน Flow เดียวกัน

เพราะระบบนี้รองรับทั้ง API และ Mock  
ต้องทำให้ทั้งสอง path จบที่ same DTO shape

```text
Service
-> Repository
-> API path OR Mock path
-> DTO
-> Mapper
-> Model
```

### Rule

- อย่าให้ mock คืน model ตรงในขณะที่ api คืน DTO
- อย่าให้ page/hook รู้ว่าตอนนี้ใช้ source ไหน
- source selection เป็น responsibility ของ repository

---

## 18. Data Source Selection Baseline

แม้ docs เชิงลึกจะไปอยู่ไฟล์ 08 แต่ไฟล์นี้ต้องยืนยัน baseline ไว้ชัดว่า

- มี global default source เช่น `NEXT_PUBLIC_DATA_SOURCE`
- รองรับ per-module override
- repository เป็น owner ของ source selection

### Example

```ts
const globalSource = getAppConfig().dataSource;
// 'api' | 'mock'
```

และถ้ามี module override:

```ts
const source = resolveModuleDataSource('warehouse');
```

รายละเอียดเต็มดูต่อใน `08_frontend_mock-usage.md`

---

## 19. Real Code Example: Access-Aware Detail Page

ตัวอย่าง detail page ที่ต้องทั้ง page guard และ data guard

```tsx
// src/features/finance/pages/FinanceClosingDetailPage.tsx
import { useAccess } from '@/contexts/AccessContext';
import { useFinanceClosingDetailQuery } from '../hooks/useFinanceClosingDetailQuery';

export function FinanceClosingDetailPage({ closingId }: { closingId: string }) {
  const { effectiveAccess, isAccessReady } = useAccess();

  const canView =
    !!effectiveAccess &&
    effectiveAccess.permissions.includes('finance.closing.view');

  const detailQuery = useFinanceClosingDetailQuery({
    closingId,
    enabled: canView,
  });

  if (!isAccessReady) {
    return <LoadingState title="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!canView) {
    return (
      <AccessDeniedState
        title="คุณไม่มีสิทธิ์เข้าถึงหน้าปิดงวด"
        description="บริบทการทำงานปัจจุบันไม่อนุญาตให้ดูข้อมูลส่วนนี้"
      />
    );
  }

  if (detailQuery.isLoading) {
    return <LoadingState title="กำลังโหลดรายละเอียดการปิดงวด..." />;
  }

  if (detailQuery.isError) {
    return <ErrorState title="โหลดรายละเอียดไม่สำเร็จ" />;
  }

  return <FinanceClosingDetailScreen detail={detailQuery.data} />;
}
```

```ts
// hook
export function useFinanceClosingDetailQuery(args: {
  closingId: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['finance', 'closing', 'detail', args.closingId],
    queryFn: () => getFinanceClosingDetailService(args.closingId),
    enabled: args.enabled,
  });
}
```

---

## 20. Real Code Example: Submit + Toast + Invalidate

```tsx
const createMutation = usePurchaseCreateRequestMutation();
const { enqueueSnackbar } = useSnackbar();

const onSubmit = (form: PurchaseRequestFormModel) => {
  createMutation.mutate(form, {
    onSuccess: () => {
      enqueueSnackbar('บันทึกใบขอซื้อสำเร็จ', { variant: 'success' });
      router.push('/purchase');
    },
    onError: () => {
      enqueueSnackbar('บันทึกใบขอซื้อไม่สำเร็จ', { variant: 'error' });
    },
  });
};
```

### Rule

- toast มาจาก notistack
- trigger อยู่ใน hook/page/use-case integration layer ได้
- api file/repository/mapper ไม่ควร trigger toast

---

## 21. Offline / Queue-Aware Mutation Direction

แม้เฟสแรกอาจยังไม่ใช้ทุกจุด  
แต่ API usage ต้องคิดเผื่อ use case นี้

## 21.1 online-only mutation

- เรียก service -> repository -> api
- success/error ตามปกติ

## 21.2 offline-capable mutation

- form submit
- ถ้า offline -> persist queue item
- UI แสดง `pending sync`
- เมื่อ online -> sync process ส่งต่อไป backend

### Rule

การตัดสินว่า action ไหน queue ได้หรือไม่ได้ เป็น use case/business requirement  
แต่ flow infrastructure ต้องรองรับ

---

## 22. API Usage Anti-Patterns

- page ยิง `httpClient` ตรง
- component ยิง API ตรง
- hook map DTO กระจัดกระจายแทน service/mapper
- repository trigger toast
- api file เลือก mock/api source เองจากหลายที่
- mock path คืน model แต่ api path คืน DTO
- page combine หลาย API เองเพื่อสร้าง object เดียว
- UI render DTO ตรง
- query keys ตั้งแบบ ad hoc ไม่มี namespace
- mutation success แล้วไม่ invalidate อะไรเลยทั้งที่ data เปลี่ยน

---

## 23. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **กติกาการไหลของข้อมูลจริง**

### `03_frontend_infrastructure.md`

ดูต่อเรื่อง httpClient, queryClient, config และ persistence foundations

### `05_frontend_type-guidelines.md`

ดูต่อเรื่อง DTO / Model / FormModel

### `06_frontend_mapper-guidelines.md`

ดูต่อเรื่อง mapping rules

### `08_frontend_mock-usage.md`

ดูต่อเรื่อง source switching, mock strategy และ storybook fixtures

### `09_frontend_component-guidelines.md`

ดูต่อเรื่อง page ownership และ section composition

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

สรุปสาระสำคัญที่สุดของ `07_frontend_api-usage.md` คือ

- page ไม่ควรยิง API ตรง
- hook เป็น owner ของ query/mutation state
- service เป็น owner ของ use case orchestration
- repository เป็น owner ของ source selection
- api file เป็น transport layer
- mapper ต้องถูกเรียกก่อนข้อมูลไปถึง UI
- service ควรคืน model ไม่ใช่ DTO
- repository ควรคืน DTO ไม่ใช่ model
- query keys ต้องมี namespace และมีระบบ
- invalidation ต้องสัมพันธ์กับ mutation จริง
- access-aware fetching ต้องเกิดตั้งแต่ query level ไม่ใช่เฉพาะ render level
- multi-source composition ต้องเกิดใน service + mapper ไม่ใช่ page
- mock กับ api ต้องวิ่งผ่าน flow เดียวกัน
- toast/error/loading ต้องถูกจัดการในชั้นที่เหมาะ ไม่กระจายมั่ว
- data flow ของระบบต้องคงที่ทั้งแอป เพื่อให้ maintainable และ refactor-safe
