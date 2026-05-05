# 04_frontend_auth-access.md

# Frontend Auth & Access

ไฟล์นี้กำหนด baseline ของ Auth และ Access ฝั่ง Frontend ให้ชัดว่า login แล้วต้องผ่าน flow ใด และสิทธิ์ถูกตรวจที่ชั้นไหน

จุดที่ไฟล์นี้ครอบคลุมคือ

- session/current user/assignment/current access/effective access
- พฤติกรรม `/login` และ `/access`
- guard model (menu/page/section/action/data)
- access switching และ shell access summary
- ขอบเขตการตีความสิทธิ์ของ frontend เทียบกับ backend

> Project alignment: ตัวอย่าง path ในไฟล์นี้ใช้รูปแบบกลาง `src/features/<module>/...` ให้อ้าง owner จริงของโปรเจกต์ปัจจุบัน เช่น `admin/users`, `production/*`, `reports/*`  
> และในโค้ดปัจจุบัน access selection ใช้ผ่าน shell (facility/context switcher) เป็นหลัก แม้แนวคิดใน docs จะยังแนะนำให้มี access entry point ชัดเจนหลัง login

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อปิดข้อถกเถียงเรื่องสิทธิ์และบริบทการใช้งานก่อนลงมือเขียนโค้ด

- auth ต่างจาก access อย่างไร
- หลัง login แล้ว route ตัดสินอย่างไรในแต่ละกรณี assignment
- current/effective access ต้องถูกถือไว้ที่ชั้นใด
- guard แต่ละระดับต้องเช็คจากข้อมูลอะไร
- เมื่อเปลี่ยนบริบทต้อง refresh อะไรและ redirect อย่างไร
- UX สำหรับ access denied/no access/session expiry ต้องคงรูปแบบไหน

ไฟล์นี้ไม่แทน authorization rule ของ backend แต่เป็น baseline ที่ frontend ต้องยึดเพื่อไม่ให้ check สิทธิ์ผิดชั้น

### อ่านต่อ

- ภาพรวมของระบบ -> `01_frontend_overview.md`
- โครงของ app, contexts และ shell -> `02_frontend_architecture.md`
- middleware, session bootstrap และ runtime foundation -> `03_frontend_infrastructure.md`
- naming ของ types/contexts/files -> `10_frontend_naming-conventions.md`
- UI states และ wording ของ access/offline/errors -> `12_frontend_ui-design-standards.md`

---

## 2. Auth กับ Access เป็นคนละเรื่อง

ระบบนี้แยก `auth` ออกจาก `access` อย่างชัดเจน

## 2.1 Auth ตอบคำถามว่า “ใครอยู่ในระบบ”

auth concerns เช่น

- login
- logout
- session restore
- current user
- refresh session
- session expiry
- isAuthenticated

Auth ไม่ควรต้องรู้ลึกถึงทุก permission ของ user เพื่อ render UI ทั้งระบบ

## 2.2 Access ตอบคำถามว่า “เข้าแล้วทำอะไรได้ และทำในบริบทไหน”

access concerns เช่น

- assignments
- current access
- role
- scope
- permissions
- allowed areas
- current working context
- effective access
- switch access

## 2.3 ทำไมต้องแยก

เพราะ user หนึ่งคนอาจ

- login ได้ปกติ
- แต่มีหลาย assignments
- มีหลาย roles
- มีหลาย farms/phases/scopes
- ทำงานได้ไม่เท่ากันในแต่ละบริบท

ดังนั้นการรู้ว่า “ใคร login แล้ว” ยังไม่พอ  
ต้องรู้ต่อด้วยว่า “ตอนนี้เขาเลือกบริบทไหนอยู่”

---

## 3. แนวคิดหลักของระบบ Access

ระบบนี้ใช้แนวคิดหลัก 4 อย่าง

1. **Assignment**  
   หน่วยสิทธิ์ที่เลือกใช้ได้จริงของ user

2. **Current Access**  
   assignment / context ที่ user เลือกใช้อยู่ตอนนี้

3. **Effective Access**  
   สิทธิ์ที่พร้อมใช้งานจริงใน runtime ปัจจุบัน หลัง resolve current access แล้ว

4. **Guarded UI**  
   UI ทุกระดับต้องดู effective access เดียวกัน

---

## 4. Core Concepts

## 4.1 Assignment

assignment คือก้อนข้อมูลที่บอกว่า user สามารถทำงานในบริบทใดได้บ้าง เช่น

- role
- scope type
- scope id
- scope label
- permissions
- allowed areas
- assignment id

Frontend ต้องถือว่า assignment เป็น object ที่ผู้ใช้ “เลือกใช้” ได้

## 4.2 Current Access

current access คือ assignment ปัจจุบันที่ user เลือกใช้อยู่ตอนนี้  
สิ่งนี้สำคัญมาก เพราะมันเป็นตัวกำหนดว่า

- menu ไหนต้องเห็น
- route ไหนเข้าได้
- section ไหนต้องแสดง
- action ไหนต้องกดได้
- data ไหนควรถูก query

## 4.3 Effective Access

effective access คือสิทธิ์ใช้งานจริงใน runtime ปัจจุบัน ซึ่ง derive มาจาก current access  
frontend ต้องใช้ effective access เป็นฐานเดียวในการเช็คสิทธิ์

## 4.4 Scope

scope คือขอบเขตของการทำงาน เช่น

- system
- farm
- phase
- house
- warehouse

scope ของระบบจริงอาจเพิ่ม/ลดได้ในอนาคต  
แต่ frontend ต้อง treat scope เป็น first-class concept ไม่ใช่แค่ label ที่เอาไว้โชว์

## 4.5 Allowed Areas

allowed areas คือรายการ area-level navigation ที่ current access เข้าได้ เช่น

- dashboard
- farm
- warehouse
- purchase
- finance
- admin

สิ่งนี้ใช้กับ shell/menu ได้ดีมาก แต่ **ไม่แทน permission model ทั้งหมด**

## 4.6 Permission Code

permission code คือ canonical string ที่ใช้เช็คความสามารถระดับ action/section/data

> Current project baseline: ใช้รูปแบบ `resource.action` (2 segments) เป็นหลัก  
> เช่น `admin.user_assignment.edit`, `operations_stock.view`

- `operations_dashboard.view`
- `operations_stock.view`
- `warehouse.material_stock.manage`
- `warehouse.purchase_request.create`
- `reports_center.export`
- `admin.user_assignment.edit`

---

## 5. Auth Flow ระดับบน

auth flow ของระบบนี้เป็นประมาณนี้

```text
Unauthenticated User
-> /login
-> submit credentials
-> backend/BFF validates session
-> bootstrap current user
-> resolve assignments
-> continue to access flow
```

## 5.1 `/login`

หน้า `/login` เป็น public route  
มีหน้าที่

- รับ credential
- submit ไป backend/BFF
- handle loading/error
- bootstrap session เมื่อสำเร็จ

## 5.2 สิ่งที่ frontend ไม่ควรทำใน login flow

- ไม่ควรถือ token ดิบไว้แบบเปิดเผย ถ้า architecture ใช้ BFF/cookies
- ไม่ควรเดา permissions เอง
- ไม่ควรพา user เข้า main app ทันทีถ้า current access ยังไม่พร้อม

---

## 6. Access Flow ระดับบน

หลัง login สำเร็จ ระบบต้อง resolve assignments ก่อน

```text
/login
-> session ready
-> fetch current user
-> fetch assignments / access bootstrap
-> if 0 usable assignments -> no-access state
-> if 1 usable assignment -> auto-select
-> if >1 usable assignments -> /access
-> set current access
-> /dashboard
```

## 6.1 ถ้ามี assignment เดียว

ระบบสามารถ auto-select ได้  
แต่ต้องยังถือว่า current access ถูกตั้งค่าอย่างเป็นทางการแล้ว

## 6.2 ถ้ามีหลาย assignments

ต้องเข้า `/access` เพื่อให้ผู้ใช้เลือก

## 6.3 ถ้าไม่มี usable assignments

ต้องพาไปยัง state ที่ชัด เช่น

- no access
- contact admin
- access unavailable

ไม่ควรพาเข้า dashboard เปล่า ๆ แล้วปล่อยให้ทุกอย่าง access denied ทั้งระบบ

---

## 7. Access Selector ต้องทำอะไร (`/access` page หรือ selector ใน shell)

Access selector เป็น post-login access selection entry  
ไม่ใช่หน้า admin

## 7.1 Access selector ต้องสามารถ

- แสดงชื่อ-นามสกุลของ user
- แสดงบริษัท
- แสดง assignments ที่เลือกได้
- แสดง role / scope summary
- แสดง allowed areas หรือ permission summary แบบย่อ
- ให้ user เลือกบริบทการทำงาน
- persist current access
- พาไป `/dashboard`

## 7.2 Access selector ไม่ควรเป็น

- giant permission matrix
- admin permission editor
- profile page เต็มรูปแบบ
- modal ชั่วคราวหลัง login

## 7.3 สิ่งที่ frontend ควรโชว์ในการ์ด assignment อย่างน้อย

- role name
- scope label
- scope type
- summary ของ areas ที่เข้าได้
- primary CTA เช่น `เลือกบริบทนี้`

> สำหรับหน้า/ปุ่มที่ผูกกับ module เดียวชัดเจน ให้ใช้ guard เฉพาะ module จาก
> `src/lib/access/modules/*.guard.ts` แทนการเรียก `authService` ตรง ๆ
> เช่น `warehouse.guard.ts`, `production.guard.ts`, และ `user-assignment.guard.ts`

> ถ้าต้องดูว่าแต่ละแท็บใน `user-assignment` ใช้ endpoint อะไรบ้าง ให้เปิด
> `frontend/docs/PERMISSION_SYSTEM.md` ส่วน `7.6 Endpoint matrix per tab`
> โดยแท็บ `กำหนดสิทธิ` จะใช้ `GET/PUT /api/AuthModels/user-permission-overrides/{userAssignmentId}` เป็นหลัก

---

## 8. Shell Access Summary

current access ต้องดูได้จาก shell เสมอ  
ไม่ควรซ่อนอยู่แค่ตอน login หรือ `/access`

## 8.1 สิ่งที่ควรมีใน user panel / access summary

- current role
- current scope label
- current company/farm/phase context
- change context entry
- permission summary entry หรือ access detail entry
- logout

## 8.2 ทำไมต้องมีตรง shell

เพราะ user ต้องย้อนกลับมาดูได้จากทุกหน้า และเข้าใจเสมอว่าตอนนี้ทำงานในบริบทไหน

---

## 9. Access Switching Behavior

นี่คือ behavior baseline ของระบบ

## 9.1 จุดเข้า change context

อยู่ใน shell / user panel  
ไม่ควรซ่อนอยู่เฉพาะหน้า `/access`

## 9.2 เมื่อเปลี่ยน current access แล้ว

ระบบต้อง

1. set current access ใหม่
2. refresh effective access
3. refresh menu visibility
4. clear/invalidate access-sensitive cache
5. พา user กลับ `/dashboard`

### หมายเหตุ

baseline เอกสารชุดนี้ให้ **redirect กลับ `/dashboard` เมื่อเปลี่ยนบริบทการทำงาน**  
เพื่อลดปัญหาว่าหน้าเดิมอาจไม่ถูกต้องหรือไม่อยู่ในสิทธิ์ของบริบทใหม่

## 9.3 ถ้ามี unsaved changes ตอนเปลี่ยนบริบท

ต้องมี confirm dialog ก่อน  
ตามมาตรฐานของระบบคือใช้ **MUI Dialog**

---

## 10. Access States ที่ระบบต้องรู้จัก

Frontend ต้องรู้จัก state อย่างน้อยดังนี้

- `unauthenticated`
- `auth-loading`
- `authenticated-no-access`
- `authenticated-access-selection-required`
- `authenticated-access-ready`
- `access-switching`
- `access-invalid`

state เหล่านี้ไม่จำเป็นต้องเป็น enum เดียวในโค้ดเสมอ  
แต่ระบบต้องสามารถสื่อและ handle ให้ชัด

---

## 11. สิ่งที่ middleware ทำได้ และไม่ควรทำ

## 11.1 middleware ทำได้

- ตรวจว่ามี session hint หรือไม่
- กัน protected route เบื้องต้น
- redirect ไป `/login`
- redirect จาก public route บางกรณี
- ช่วยกัน route ที่ไม่ควรเข้าถ้าไม่มี session

## 11.2 middleware ไม่ควรทำ

- resolve permissions ทั้งหมด
- ตัดสิน section/action/data guard
- fetch business data หนัก
- merge assignments เอง
- เป็น owner ของ effective access logic ทั้งหมด

## 11.3 สรุปบทบาทของ middleware

middleware คือ **request-time route gate เบื้องต้น**  
ไม่ใช่ complete authorization layer ของ frontend

---

## 12. Access Types ที่ Frontend ควรมี

ตัวอย่าง type baseline ฝั่ง frontend

```ts
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

export type ScopeType = 'system' | 'farm' | 'phase' | 'house' | 'warehouse';

export type CurrentUserModel = {
  id: string;
  employeeCode: string | null;
  displayName: string;
  email: string | null;
  companyName: string | null;
};

export type AccessAssignmentModel = {
  assignmentId: string;
  roleCode: string;
  roleName: string;
  scopeType: ScopeType;
  scopeId: string | null;
  scopeLabel: string;
  permissions: string[];
  allowedAreas: AreaCode[];
};

export type EffectiveAccessModel = {
  assignmentId: string;
  roleCode: string;
  roleName: string;
  scopeType: ScopeType;
  scopeId: string | null;
  scopeLabel: string;
  permissions: string[];
  allowedAreas: AreaCode[];
  displayLabel: string;
};
```

รายละเอียดเชิง type placement ให้อ่านต่อใน `05_frontend_type-guidelines.md`

---

## 13. Auth กับ Access ต้องแยกกันยังไง

> หมายเหตุ: implementation ปัจจุบันใน repo นี้ไม่ได้มี standalone auth/access context files แล้ว แต่ยังคงต้องแยก responsibility ของ auth bootstrap, access bootstrap, และ page guard ออกจากกันให้ชัด

## 13.1 Auth runtime / bootstrap

ควรถือข้อมูลอย่างเช่น

- current user
- isAuthenticated
- auth loading
- login/logout actions

## 13.2 Access runtime / effective access

ควรถือข้อมูลอย่างเช่น

- assignments
- current access
- effective access
- current role (จาก current access)
- switchAccess
- access loading / ready state
- helper functions สำหรับ guards

## 13.3 สิ่งที่ไม่ควรทำ

- อย่าเอาทุกอย่างไปรวมใน context เดียว
- อย่าใช้ auth runtime แทน access runtime
- อย่าให้ shell/menu/query แต่ละที่ไป fetch/access data คนละทาง

---

## 14. Guard Model ของระบบ

ระบบนี้ต้องมี guard หลายระดับ

1. menu guard
2. page guard
3. section guard
4. action guard
5. data guard

---

## 15. Menu Guard

menu guard ใช้กับการตัดสินว่า user ควรเห็นเมนูไหนใน sidebar

### rule

- ใช้ `allowedAreas` เป็น baseline ที่ดี
- แต่ถ้า area มีข้อย่อยซับซ้อน อาจต้องใช้ permission เพิ่มร่วมกัน
- menu guard ไม่ใช่สิ่งเดียวที่ใช้แทน page/action checks
- menu guard คือการฉายผลของ permission model ฝั่ง backend ลงมาเป็น sidebar visibility (ไม่ใช่ source of truth ใหม่)

### permission mapping ใน menu (2-step)

1. backend/BFF ส่ง canonical values (`permissions`, `allowedAreas`)  
   frontend รับและเก็บไว้ใน `EffectiveAccessModel`
2. frontend ใช้ `allowedAreas` + `permissions` เพื่อคำนวณว่าเมนูใดควรเห็น/ซ่อนใน sidebar

rule สำคัญ:

- ห้าม generate permission code จาก route เอง
- ห้าม map menu จากชื่อ route อย่างเดียว
- หากเมนูย่อยมีข้อจำกัด action ให้เสริมด้วย `hasPermission(...)`

### ตัวอย่าง helper

```ts
export function canAccessArea(
  access: EffectiveAccessModel | null,
  area: AreaCode,
): boolean {
  return !!access && access.allowedAreas.includes(area);
}
```

### ตัวอย่าง usage

```ts
const canSeeWarehouse = canAccessArea(effectiveAccess, 'warehouse');
```

---

## 16. Page Guard

page guard ใช้กับการตัดสินว่า route นี้เข้าได้หรือไม่

### rule

- page guard ต้องใช้ effective access
- ห้ามอาศัยแค่ “เมนูถูกซ่อนแล้ว”
- ถ้าเข้าไม่ได้ ต้องแสดง access denied state หรือ redirect ตาม rule ของหน้า

### ตัวอย่าง helper

```ts
export function hasPermission(
  access: EffectiveAccessModel | null,
  permission: string,
): boolean {
  return !!access && access.permissions.includes(permission);
}
```

### ตัวอย่าง page guard

```tsx
import { warehousePermissions } from '@/features/warehouse/utils/warehouse.permissions';

export function WarehouseAdjustPage() {
  const { effectiveAccess, isAccessReady } = useAccess();

  if (!isAccessReady) {
    return <LoadingState title="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!hasPermission(effectiveAccess, warehousePermissions.adjustStock)) {
    return (
      <AccessDeniedState
        title="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
        description="บริบทการทำงานปัจจุบันไม่อนุญาตให้ใช้งานส่วนนี้"
      />
    );
  }

  return <WarehouseAdjustScreen />;
}
```

---

## 17. Section Guard

section guard ใช้เมื่อหน้าเข้าได้ แต่บางส่วนของหน้าต้องซ่อนหรือไม่แสดง

### use cases

- หน้ารายละเอียดเอกสารมี section approval history เฉพาะผู้มีสิทธิ์
- dashboard มี widget บางตัวเฉพาะบาง role
- finance page มี panel ปิดงวดเฉพาะผู้อนุมัติ

### ตัวอย่าง

```tsx
import { purchasePermissions } from '@/features/purchase/utils/purchase.permissions';

{
  hasPermission(effectiveAccess, purchasePermissions.viewApprovalHistory) && (
    <ApprovalHistorySection />
  );
}
```

---

## 18. Action Guard

action guard ใช้กับปุ่มและ mutation actions

### use cases

- approve
- reject
- close period
- retry sync
- adjust stock
- delete item

### rule

- action guard อาจใช้ทั้ง permission + capability flags จาก backend ถ้ามี
- ถ้าผู้ใช้ควรรับรู้ว่ามี action นี้อยู่ อาจ disable ได้
- ถ้าไม่ควรรับรู้เลย อาจ hide ได้

### ตัวอย่าง

```tsx
import { financePermissions } from '@/features/finance/utils/finance.permissions';

<Button disabled={!hasPermission(effectiveAccess, financePermissions.runClosing)}>
  ปิดงวด
</Button>
```

หรือ

```tsx
import { purchasePermissions } from '@/features/purchase/utils/purchase.permissions';

{
  hasPermission(effectiveAccess, purchasePermissions.deleteRequest) && (
    <Button color="error">ลบรายการ</Button>
  );
}
```

---

## 19. Data Guard

data guard ใช้กับ query/data fetching

### rule

- หน้าไม่ควรดึงข้อมูลที่ current access ไม่ควรเห็น
- query params หรือ endpoint choice ต้องอิง current access
- การ guard เฉพาะตอน render ไม่พอ ถ้า query ไปผิด scope ตั้งแต่แรก

### ตัวอย่าง

```ts
import { warehousePermissions } from '@/features/warehouse/utils/warehouse.permissions';

export function useWarehouseStockListQuery() {
  const { effectiveAccess } = useAccess();

  return useQuery({
    queryKey: ['warehouse', 'stock', effectiveAccess?.scopeId],
    queryFn: () =>
      warehouseService.getStockList({
        scopeId: effectiveAccess?.scopeId ?? null,
      }),
    enabled:
      !!effectiveAccess &&
      hasPermission(effectiveAccess, warehousePermissions.viewStock),
  });
}
```

---

## 20. Permission Check Flow ในโค้ดจริง

นี่คือ flow เชิงแนวคิดที่ควรเกิดจริงในระบบ

```text
AuthProvider
-> bootstrap current user
-> AccessProvider bootstrap assignments/current access
-> resolve effective access
-> Shell reads allowed areas for menu
-> Page checks page-level permissions
-> Sections check section-level permissions
-> Actions check action-level permissions
-> Queries use current access for data guard
```

อีกแบบหนึ่งในระดับหน้า

```text
Page mount
-> read effectiveAccess from AccessContext
-> if access not ready -> loading
-> if no permission -> access denied
-> else render page
-> section/action/query checks use same effectiveAccess
```

---

## 21. Permission References ควรแยกเป็น constants

อย่ากระจาย string permission ทั่วทั้งระบบ  
ควรมี permission refs ระดับ module

### ตัวอย่าง

```ts
// src/features/production/stock/utils/stock.permissions.ts
export const stockPermissions = {
  viewStock: 'warehouse.material_stock.view',
  manageStock: 'warehouse.material_stock.manage',
  approveStock: 'warehouse.material_stock.approve',
} as const;
```

### usage

```ts
hasPermission(effectiveAccess, stockPermissions.manageStock);
```

ข้อดีคือ

- ลด typo
- refactor ง่าย
- อ่าน code ง่าย
- ตำแหน่ง owner ชัด

---

## 22. Access-Aware Menu Composition

shell ไม่ควร hardcode ว่าทุกคนเห็นเมนูเท่ากัน  
แต่ต้อง compose จาก current access

### ตัวอย่าง

```ts
import { warehousePermissions } from '@/features/warehouse/utils/warehouse.permissions';

const menuItems = [
  {
    key: 'dashboard',
    label: 'แดชบอร์ด',
    visible: canAccessArea(effectiveAccess, 'dashboard'),
  },
  {
    key: 'warehouse',
    label: 'คลัง',
    visible:
      canAccessArea(effectiveAccess, 'warehouse') &&
      hasPermission(effectiveAccess, warehousePermissions.viewStock),
  },
  {
    key: 'finance',
    label: 'การเงิน',
    visible: canAccessArea(effectiveAccess, 'finance'),
  },
];
```

---

## 23. Access Switching และ Cache Clearing

เมื่อ switch access แล้ว ระบบต้องจัดการ cache ให้ถูก

### baseline

- invalidate หรือ clear access-sensitive queries
- menu ต้อง refresh
- page state ที่พึ่ง current access ต้อง reset อย่างเหมาะสม
- redirect ไป `/dashboard`

### ตัวอย่างเชิงแนวคิด

```ts
async function switchAccess(assignmentId: string) {
  await accessService.switchAccess(assignmentId);
  queryClient.clear();
  router.push('/dashboard');
}
```

### หมายเหตุ

รายละเอียดจริงอาจใช้ invalidate แบบละเอียดกว่า `clear()` ได้ในอนาคต  
แต่ baseline คือ **ห้ามปล่อย cache เดิมของบริบทเก่าค้างแบบมั่ว ๆ**

---

## 24. Session Expiry และ Auth Recovery

frontend ต้อง handle อย่างน้อยกรณีต่อไปนี้

- session หมดอายุ
- current access invalid
- assignments เปลี่ยนจากฝั่ง server
- access ถูกถอนระหว่างใช้งาน

### baseline behavior

- ถ้า session หมดอายุ -> กลับ login flow
- ถ้า access invalid -> กลับ `/access` หรือ no-access state ตามกรณี
- ถ้า current access ใช้ไม่ได้แล้ว -> ต้อง re-resolve access

---

## 25. Use Cases สำคัญ

## 25.1 User มี 1 assignment

```text
login
-> session ready
-> 1 assignment
-> auto-select
-> dashboard
```

## 25.2 User มีหลาย assignments

```text
login
-> session ready
-> multiple assignments
-> /access
-> user selects one
-> dashboard
```

## 25.3 User เปลี่ยน current access จาก shell

```text
click change context
-> optional confirmation if unsaved changes
-> select new assignment
-> switch access
-> clear/invalidate access-sensitive cache
-> /dashboard
```

## 25.4 User เข้า page ที่ไม่มีสิทธิ์

```text
route opens
-> page checks effectiveAccess
-> permission missing
-> AccessDeniedState
```

## 25.5 User ไม่มี usable access

```text
login
-> no usable assignments
-> no-access state / contact admin state
```

---

## 26. Recommended Shared Helpers

shared helpers ที่ควรมีอย่างน้อย

```ts
hasPermission(access, permission);
hasAnyPermission(access, permissions);
hasAllPermissions(access, permissions);
canAccessArea(access, area);
hasCurrentAccess(access);
```

### ตัวอย่าง

```ts
export function hasAnyPermission(
  access: EffectiveAccessModel | null,
  permissions: string[],
): boolean {
  if (!access) return false;
  return permissions.some((permission) =>
    access.permissions.includes(permission),
  );
}
```

---

## 27. สิ่งที่ frontend ต้องเชื่อจาก backend

frontend ควรเชื่อสิ่งต่อไปนี้จาก backend/BFF เป็นหลัก

- current user
- assignments
- current access ที่ persist แล้ว
- permission codes
- allowed areas ถ้ามี
- capability flags ถ้ามี
- validation ของ actions จริง

frontend ไม่ควร “เดาแทน” backend เช่น

- merge assignments เองให้กลายเป็น super-user
- invent permissions จาก route
- invent scope จาก label
- treat hidden menu = authorized action

---

## 28. UX States ที่เกี่ยวกับ Auth/Access

ระบบนี้ต้องมี states อย่างน้อยดังนี้

- login loading
- login error
- auth bootstrap loading
- access selection loading
- no current access
- no usable access
- access denied
- access switching
- session expired

รายละเอียด wording/state visuals ให้อ่านต่อใน `12_frontend_ui-design-standards.md`

---

## 29. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **auth/access model และ guard flow**

### `03_frontend_infrastructure.md`

ดูต่อเรื่อง middleware, session bootstrap, query client, persistence และ runtime foundation

### `05_frontend_type-guidelines.md`

ดูต่อเรื่อง placement ของ user/access/assignment types

### `07_frontend_api-usage.md`

ดูต่อเรื่อง access-aware fetching และ service/repository flow

### `09_frontend_component-guidelines.md`

ดูต่อเรื่อง owner ของ page guards, section guards และ action components

### `12_frontend_ui-design-standards.md`

ดูต่อเรื่อง access denied states, no access states, dialogs และ wording

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 30. Summary

สรุปสาระสำคัญที่สุดของ `04_frontend_auth-access.md` คือ

- auth กับ access เป็นคนละเรื่อง
- หลัง login ต้อง resolve assignments ก่อนเข้า app หลัก
- ถ้ามีหลาย assignments ต้องมี access entry point ให้ผู้ใช้เลือกบริบท (เช่น `/access` หรือ shell selector ที่เทียบเท่า)
- current access คือบริบทการทำงานปัจจุบัน
- effective access คือสิทธิ์ใช้งานจริงที่ frontend ใช้เช็คทุกอย่าง
- shell ต้องแสดง current access summary และมี change context entry
- auth bootstrap loading และ access selection/loading ต้องมี owner ชัด ไม่ render ซ้อนกับ page blocking state ของ route เดียวกัน
- เมื่อ switch access ให้กลับ `/dashboard` และ clear/invalidate access-sensitive cache
- middleware เป็นแค่ route gate เบื้องต้น ไม่ใช่ complete permission engine
- frontend ต้องมี guard หลายชั้น: menu, page, section, action, data
- queries ต้อง access-aware ไม่ใช่ guard แค่ตอน render
- permission codes ควรถูกรวมเป็น refs/constants ระดับ module
- frontend ไม่ควรเดา permission หรือ merge assignments เองแบบไร้บริบท
- auth/access states ต้องมี UX ที่ชัดเจนทั้ง loading, no access, access denied และ session expiry
