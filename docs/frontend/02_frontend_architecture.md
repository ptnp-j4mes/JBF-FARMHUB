# 02_frontend_architecture.md

# Frontend Architecture

ไฟล์นี้กำหนดโครงสถาปัตยกรรมของ Frontend ว่าแต่ละ layer ต้องอยู่ตรงไหนและรับผิดชอบอะไรบ้าง เพื่อให้ระบบขยายต่อได้โดยไม่เสีย ownership

จุดที่ไฟล์นี้ตัดสินให้ชัดคือ

- project structure ระดับ `src/`
- route layer vs module layer
- app shell และ provider placement
- dependency direction ระหว่างชั้น
- ขอบเขตของ shared layer vs module layer
- โครงที่ต้องรองรับ viewport-first, notification model และ PWA direction

เหตุผลของการตัดสินโครงเหล่านี้คือเพื่อแก้ pain จาก backend/integration contract ที่เปลี่ยนได้ตลอดเวลา  
เช่น DTO shape เปลี่ยน, scope/permission complexity และ workflow ที่ข้ามหลายโมดูล โดยไม่ให้กระทบ UI เป็นโดมิโน

---

## Project Alignment Note (โครงสร้างจริงใน repo นี้)

เอกสารเดิมใช้คำว่า `src/features/*` เป็น target naming  
แต่โค้ดปัจจุบันของโปรเจกต์นี้ใช้ `src/features/*` และมี `src/core/*` อยู่แล้ว

ให้ตีความดังนี้:

- `modules/*` ใน docs -> `features/*` ในโค้ดจริง
- `shared infra` -> `core/* + lib/* + contexts/* + components/*`
- route adapter -> `app/(main)/**/page.tsx`

ดังนั้นการนำเอกสารนี้ไปใช้ให้เน้น “ปรับทีละชั้น” และไม่ทำ big-bang rewrite

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อปิดคำถามเชิงโครงก่อนเริ่มลงมือเขียน feature

- page จริงอยู่ใน `app/` หรือ `features/`
- shared code อะไรควรอยู่ `components/hooks/lib/types/utils`
- provider/context/theme runtime ต้องประกอบที่จุดใด
- module anatomy มาตรฐานต้องมีโฟลเดอร์อะไร
- route groups และ shell layout ต้องจัดแบบไหน
- middleware ควรทำแค่ระดับไหน
- dependency flow ที่อนุญาตคืออะไร และอะไรห้ามไหลย้อน

ไฟล์นี้ไม่ได้แทน type/mapper/API/UI docs แต่เป็น baseline โครงสร้างที่ทุกไฟล์เชิงลึกต้องยึดร่วมกัน

### อ่านต่อ

- ภาพรวมและ baseline ทั้งระบบ -> `01_frontend_overview.md`
- infrastructure, middleware, runtime, cache, persistence, offline, PWA และ package baseline -> `03_frontend_infrastructure.md`
- auth/access flow และ permission model -> `04_frontend_auth-access.md`
- component composition และ page ownership -> `09_frontend_component-guidelines.md`
- naming conventions -> `10_frontend_naming-conventions.md`
- เมนูภาษาไทยมาตรฐาน + route/module owner map -> `15_frontend_menu-taxonomy-th.md`

---

## 2. Architecture Principles

## 2.1 Route Layer ไม่ใช่ Business Owner

route มีไว้เพื่อเป็น **entry point ของ UI**  
route ไม่ควรกลายเป็นเจ้าของ business logic

นั่นแปลว่า

- `src/app/` มีไว้จัด route, layout, loading, error และ app-level wrappers
- business pages จริงควรอยู่ใน `src/features/<module>/pages/`

## 2.2 Module Layer คือเจ้าของ Business Logic ฝั่ง Frontend

แต่ละ module เป็น owner ของ

- business pages
- business components
- module hooks
- services
- module types
- module utils / permissions / constants / mappers

## 2.3 Shared Layers ต้อง Shared จริง

สิ่งที่อยู่ใน shared layers เช่น `components/`, `hooks/`, `lib/`, `types/`, `utils/` ต้องเป็นของที่ใช้ข้ามหลาย module ได้จริง  
ไม่ควรเอา business-specific code ไปซ่อนใน shared layer

## 2.4 Providers ต้องมีตำแหน่งที่ตายตัว

providers หลักของแอปต้องอยู่ใน `src/contexts/`  
ไม่กระจายไป `theme/`, `components/` หรือ `lib/` แบบไม่มีระบบ

## 2.5 Theme Runtime กับ Theme Assets ต้องแยกกัน

- `ThemeContext.tsx` = runtime state / provider
- `src/core/theme/` = theme builders, tokens, palette, typography, component overrides

## 2.6 Viewport-First ต้องเริ่มตั้งแต่ Shell

ถ้า shell กินพื้นที่แนวตั้งมากเกินไป  
หรือ main content ไม่มี layout strategy ที่ดี  
ต่อให้ table/form component ดีแค่ไหน หน้า work pages ก็ยังใช้งานยาก

## 2.7 Notification Model ต้องถูกสะท้อนใน Architecture

เพราะระบบนี้ตกลงแล้วว่า

- notification center หลักอยู่ที่ **sidebar bell icon**
- toast อยู่ใน **main content**
- inline alerts อยู่ใน **page/section content**

ดังนั้น shell structure, context placement และ shared components ต้องรองรับ pattern นี้ตั้งแต่ต้น

## 2.8 PWA Direction ต้องถูกเผื่อในโครง

แม้ยังไม่ลงลึก service worker ในเฟสแรก  
แต่ app structure ต้องพร้อมสำหรับ

- manifest
- installable shell
- offline-aware UX
- persistence / queue / sync-related logic

---

## 3. Final High-Level Architecture

ภาพรวมของ frontend architecture ให้คิดเป็น 6 ชั้นหลัก

```text
App / Route Layer
-> Shell / Layout Layer
-> Module Page Layer
-> Component / Section Layer
-> Service / API / Mapper Layer
-> DTO / Mapper / Model Layer
```

อีกมุมหนึ่ง ถ้ามองตามตำแหน่งในโค้ด

```text
src/app
-> src/contexts + shell layouts
-> src/features/<module>/pages
-> src/features/<module>/components
-> src/features/<module>/hooks + services
-> src/features/<module>/types + utils
```

และ shared layer ที่คอย support อยู่รอบ ๆ คือ

```text
src/components
src/hooks
src/lib
src/core/theme
src/types
src/utils
```

---

## 4. Project Structure ระดับบน

Baseline ของ source tree ระดับบนให้ยึดประมาณนี้

```text
src/
├── app/
├── assets/
├── components/
├── contexts/
├── core/
├── features/
├── lib/
├── types/
└── (optional shared helpers)
```

โครงจริงของโปรเจกต์นี้มีทั้ง `src/core/` และ `src/assets/`  
โดย `src/core/` เป็นแกน shared runtime ของระบบ และ `src/assets/` ใช้เก็บ assets ที่เจ้าของชัดเจน

ด้านล่างคือความหมายเชิง architecture ของแต่ละโฟลเดอร์

### `app/`

route layer ของ Next.js

ใช้สำหรับ

- route groups
- layout.tsx
- loading.tsx
- error.tsx / global-error.tsx
- manifest.ts
- page.tsx ของแต่ละ route
- route handlers / BFF endpoints ใน `api/`

ไม่ใช้สำหรับ

- business service logic
- DTO mapping
- giant page composition ที่อ่านยาก
- module-specific hooks/services/types

### `components/`

shared UI layer

ใช้สำหรับ

- `src/components/layout/` สำหรับ shell/layout components
- `src/components/common/` สำหรับ shared UI primitives
- shared dialog primitives
- shared table shells
- shared alert / state components
- shared chart wrappers ระดับ generic
- generic form UI primitives

ไม่ใช้สำหรับ

- business page sections ของ module
- business-specific tables/forms/charts
- module permissions
- module service calls

### `contexts/`

shared app-level runtime contexts และ providers

ใช้สำหรับ

- `RoleContext.tsx` (legacy compatibility wrapper)
- `ShellContext.tsx`
- `ThemeContext.tsx`

หมายเหตุ: auth/session bootstrap และ access bootstrap ใน codebase ปัจจุบันไม่ได้วางเป็น standalone auth/access context file แล้ว แต่ถูกดูแลผ่าน guard/runtime ของ auth และ access flow

ไม่ใช้สำหรับ

- theme assets
- module-specific wizard state โดยไม่จำเป็น
- business services

### `hooks/`

shared hooks

ใช้สำหรับ

- reusable hooks ข้ามหลาย module
- browser/runtime hooks
- shell/utility hooks ที่ไม่ผูกกับ module ใด

ไม่ใช้สำหรับ

- hooks ที่เป็นของ module ชัดเจน เช่น purchase/warehouse/finance page hooks

### `lib/`

technical foundation / infrastructure helpers

ใช้สำหรับ

- http client
- config
- access helpers
- auth helpers
- query helpers
- persistence helpers
- offline helpers
- env helpers
- pwa helpers
- integration helpers
- date/format helpers เชิง infrastructure

ไม่ใช้สำหรับ

- business-specific services
- module-specific DTO/model mapping

### `features/`

business modules ทั้งหมดของระบบ  
เป็นแกนหลักของ frontend architecture ฝั่ง business

### `core/theme/`

theme assets / builders

ใช้สำหรับ

- color tokens
- palette definitions
- typography
- spacing / radius / elevation tokens
- MUI theme builders
- component overrides

ไม่ใช้สำหรับ

- providers
- shell state
- business logic

### `types/`

shared technical types

ใช้สำหรับ

- generic shared types
- utility types
- app-wide types ที่ไม่ได้เป็นเจ้าของโดย module ใด module หนึ่ง

ไม่ใช้สำหรับ

- DTO/model/form types ของ module โดยตรง ถ้ามีเจ้าของชัดอยู่แล้ว

### `utils/`

shared pure utilities

ใช้สำหรับ

- pure functions ที่ไม่ผูกกับ business domain
- cross-cutting simple helpers

ไม่ใช้สำหรับ

- business-specific mapping/service logic

---

## 5. App Layer Structure (`src/app/`)

Baseline ของ `src/app/` ให้ยึดประมาณนี้

```text
src/app/
├── api/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (access)/
│   └── access/
│       └── page.tsx
├── (main)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── farm/
│   ├── production/
│   ├── warehouse/
│   ├── purchase/
│   ├── project/
│   ├── sales/
│   ├── finance/
│   ├── insight/
│   ├── approvals/
│   └── admin/
├── global-error.tsx
├── layout.tsx
├── manifest.ts
└── globals.css
```

`/project`, `/approvals`, `/admin` เป็น route surface เพื่อความเข้าใจผู้ใช้  
แต่ owner ของ business logic ต้องยังอยู่ใน module names ตาม baseline:

- `/project/*` -> module `maintenance`
- `/approvals/*` -> module `approval`
- `/admin/user-assignment/*` -> module `user-assignment`
- `/admin/master/*` -> module `master`
- `/admin/docs/*` -> module `document`
- `/admin/settings/*` -> module `setting`

### ความหมายของ route groups

#### `(auth)/`

กลุ่ม route ที่ยังไม่ต้องเข้า app shell หลัก  
เช่นหน้า login

#### `(access)/`

กลุ่ม route หลัง login แล้ว แต่ก่อนเข้า main app  
เช่นหน้า `/access`

#### `(main)/`

กลุ่ม route หลักทั้งหมดที่ต้องมี

- session ที่พร้อม
- current access ที่พร้อม
- app shell ที่พร้อม

### `api/`

ใช้สำหรับ BFF handlers หรือ route handlers ของ Next.js

### `layout.tsx`

root layout ระดับแอป  
มีหน้าที่ห่อ providers ระดับบน และ setup โครงรวมของแอป

### `manifest.ts`

foundation สำหรับ PWA direction

### `global-error.tsx`

global error boundary ของแอป

### `globals.css`

global css ที่จำเป็นจริง ๆ ของทั้งระบบ

---

## 6. Root Layout Architecture

root layout ของระบบนี้ควรทำหน้าที่ประมาณนี้

1. ห่อ providers ระดับบน
2. inject theme runtime
3. setup query client
4. setup notification provider
5. setup global shell-independent wrappers

ตัวอย่างลำดับชั้นเชิงความคิด

```text
RootLayout
-> AuthProvider
-> AccessProvider
-> ShellProvider
-> ThemeProvider
-> QueryClientProvider
-> SnackbarProvider
-> App Children
```

### หมายเหตุสำคัญ

ลำดับจริงอาจปรับได้ตาม implementation  
แต่ architecture intent คือ

- auth ต้องมีพร้อมก่อน access
- shell state ไม่ควรไปปนกับ business logic
- theme runtime ต้องอยู่ใกล้ app root
- toast provider เป็น app-level concern
- notification center ไม่ได้อยู่ใน root layout ตรง ๆ แต่ถูกเปิดผ่าน shell

---

## 7. App Shell Architecture

ระบบนี้ใช้ shell แบบ

```text
Sidebar + Main Content
```

และไม่ใช้ global headbar ใหญ่เป็น baseline

### Shell Components ระดับบนที่ควรมี

```text
AppShell
├── Sidebar
│   ├── SidebarToggle
│   ├── NotificationBell
│   ├── MainNavigation
│   └── UserPanel
└── MainContent
    ├── PageToolbar
    └── PageBody
```

### ความหมายของแต่ละส่วน

#### `Sidebar`

เจ้าของ navigation และ shell utilities

#### `SidebarToggle`

ควบคุม collapsed / expanded state

#### `NotificationBell`

entry หลักของ notification center

#### `MainNavigation`

เมนู area หลักของระบบ

#### `UserPanel`

current user, current access summary, change context, logout, theme entry

#### `MainContent`

พื้นที่ render page content จริง

#### `PageToolbar`

ส่วนหัวของแต่ละ page ไม่ใช่ global topbar

#### `PageBody`

work area จริงของ page นั้น

### หลักสำคัญของ shell นี้

- sidebar ต้องคงอยู่ตลอดใน main app
- notification center ต้องผูกกับ shell
- user/access summary ต้องดูได้จากทุกหน้า
- main content ต้องเหลือพื้นที่มากพอสำหรับ work pages
- shell ต้องสนับสนุน viewport-first interaction

---

## 8. Notification Architecture

เพราะระบบนี้ตกลงว่า notification หลักไม่ได้ใช้ top-right global toast เป็นแกนหลัก  
architecture ต้องสะท้อนสิ่งนี้ให้ชัด

### 8.1 Notification Center

notification center เป็น shell utility  
entry หลักอยู่ที่ **bell icon ใน sidebar**

สิ่งที่ notification center รองรับ เช่น

- unread count
- approvals summary
- alerts
- failed sync notices
- integration warnings
- actionable notifications

### 8.2 Notification Panel

เมื่อกด bell icon อาจเปิดได้เป็น

- drawer
- side panel
- dedicated notification route

แต่ baseline เชิง architecture คือ  
มันเป็น **shell-owned interaction** ไม่ใช่ page-owned interaction

### 8.3 Toast Feedback

toast เป็น app-level feedback แต่แสดงใน **main content area**

ดังนั้น

- provider อยู่ระดับแอป
- trigger ได้จากหลายที่
- แต่ UX ownership เป็น feedback ต่อการกระทำใน content

### 8.4 Inline Alerts

inline alerts เป็น page/section concern  
ไม่ได้เป็นของ shell

---

## 9. Providers และ Contexts Architecture

ระบบนี้กำหนดชัดว่า shared app-level providers อยู่ใน `src/contexts/`

Baseline คือ

```text
src/contexts/
├── RoleContext.tsx
├── ShellContext.tsx
└── ThemeContext.tsx
```

### Auth bootstrap runtime

legacy terminology in older docs; current repo uses guard/runtime flow instead of a standalone auth context file

### Access bootstrap runtime

legacy terminology in older docs; current repo uses guard/runtime flow and access helpers instead of a standalone access context file

### `ShellContext.tsx`

หน้าที่

- sidebar collapsed state
- shell panel open/close state
- notification panel open/close state

### `ThemeContext.tsx`

หน้าที่

- theme mode runtime
- theme switching
- persistence ของ theme preference

### กฎสำคัญ

- provider หลักของแอปต้องไม่อยู่ใน `theme/`
- provider หลักของแอปต้องไม่กระจายไปหลายโฟลเดอร์
- app-level contexts ต้องไม่แบก business service logic

---

## 10. Theme Architecture

Theme แยกเป็น 2 ส่วน

### 10.1 Theme Runtime

อยู่ใน `ThemeContext.tsx`

รับผิดชอบเรื่อง

- current theme mode
- toggle / set theme mode
- persistence ของ preference
- ผูก theme mode กับ MUI ThemeProvider runtime

### 10.2 Theme Assets

อยู่ใน `src/core/theme/`

ตัวอย่างโครง (minimal clean baseline)

```text
src/core/theme/
├── tokens.ts
├── typography.ts
├── components.ts
└── create-app-theme.ts
```

### หลักสำคัญ

- theme assets ต้องไม่ปนกับ runtime provider
- palette/tone tokens, spacing/radius/elevation tokens ให้อยู่ใน `tokens.ts` เพื่อคุมโครงให้ lean
- business components ต้องใช้ theme tokens
- chart styling ต้อง derive จาก theme system นี้

---

## 11. Middleware ในสถาปัตยกรรมนี้

ไฟล์นี้พูดถึง middleware ในระดับ architecture **แบบไม่ลงลึก implementation**  
เพราะรายละเอียดเชิงลึกจะไปอยู่ใน `03_frontend_infrastructure.md`

### Middleware มีบทบาทอะไรในระบบนี้

middleware เป็นชั้นบาง ๆ ที่ช่วยจัดการเรื่องเช่น

- route protection ระดับเบื้องต้น
- auth/session existence checks
- redirect logic ระดับบน
- public vs protected route decision
- pre-shell routing decisions

### Middleware ไม่ควรทำอะไร

- ไม่ควร resolve business permissions ทั้งหมดเอง
- ไม่ควรทำ orchestration ขนาดใหญ่
- ไม่ควร map DTO/model
- ไม่ควรเป็นที่รวม business logic
- ไม่ควรแทน page-level access checks ทั้งหมด

### สรุปบทบาทของ middleware

middleware คือ **request-time route gate เบื้องต้น**  
ไม่ใช่ตัวแทนเต็มของ auth/access logic ทั้งระบบ

### ดูต่อเรื่อง middleware

- implementation direction และข้อจำกัด -> `03_frontend_infrastructure.md`
- auth/access flow จริง -> `04_frontend_auth-access.md`

---

## 12. Module Architecture

แต่ละ module ควรมี anatomy กลางแบบนี้

```text
src/features/<module>/
├── pages/
├── hooks/
├── services/
├── components/
├── types/   # optional
├── utils/   # optional
└── index.ts
```

และถ้าจำเป็นจริงจึงค่อยมี

```text
src/features/<module>/
└── contexts/
```

### Canonical baseline

- ต้องมี: `pages/`, `hooks/`, `services/`, `components/`, `index.ts`
- optional: `types/`, `utils/`, `contexts/`
- `permissions.ts` ไม่ใช่ส่วนหนึ่งของ anatomy มาตรฐาน
- permission truth ควรอยู่ใน guard กลาง เช่น `src/lib/access/modules/*.guard.ts`

### ความหมายของแต่ละส่วน

#### `pages/`

business pages จริงของ module  
ทำหน้าที่ compose page sections และเชื่อมกับ module hooks

#### `components/`

business UI ของ module เช่น

- section components
- business tables
- business forms
- business charts
- module dialogs/drawers

#### `hooks/`

module-level hooks เช่น

- query hooks
- mutation hooks
- page hooks
- form hooks

#### `services/`

จุดรวมของ

- `all.service.ts` สำหรับรวม service ย่อยกลับมาเป็น public surface ของ module
- `<domain>.service.ts` สำหรับแยกตาม tab / aggregate / use case
- `<domain>.api.ts` เฉพาะกรณีที่อยากแยก transport layer ออกจาก orchestration เพิ่มเติม

> ตัวอย่างเช่น module `user-assignment` อาจมี `user-assignment.service.ts`, `user.service.ts`, `role.service.ts`, `permission.service.ts`, `company.service.ts` และ `all.service.ts` เป็นตัวกลาง

> ถ้าต้องการ storybook/demo/test data ให้เก็บไว้ใน storybook/test harness หรือ fixture เฉพาะทาง ไม่ใช่ runtime module anatomy

#### `types/`

type files ของ module นั้นเฉพาะเมื่อจำเป็นจริง เช่น DTO / Model / FormModel / Query / Draft หรือ shape เฉพาะทางอื่น ๆ

#### `utils/` *(optional)*

mapper, constants และ helper functions ของ module

> permission refs ไม่ควรแยกไว้ใน `permissions.ts` ของ module เพราะจะกลายเป็น source of truth ซ้ำซ้อน

#### `index.ts`

public surface ของ module

---

## 13. Route Layer vs Module Layer

### Route Layer (`src/app/`)

รับผิดชอบ

- URL entry
- layout composition ระดับ route
- loading/error boundaries
- auth/access entry decisions ระดับบน

### Feature Layer (`src/features/`)

รับผิดชอบ

- business pages
- business logic ฝั่ง frontend
- component composition
- service orchestration
- module types / hooks / utils

### Rule สำคัญ

route page ใน `src/app/.../page.tsx` ควร “บาง”  
และมักทำหน้าที่เพียง import page จริงจาก module

ตัวอย่างเชิงแนวคิด

```text
src/app/(main)/warehouse/receive/page.tsx
-> render WarehouseReceivePage จาก src/features/warehouse/pages/WarehouseReceivePage.tsx
```

---

## 14. Shared Layer vs Module Layer

### Shared Layer

เหมาะกับของที่ใช้ข้ามหลาย module เช่น

- PageContainer
- PageToolbar
- LoadingState
- ErrorState
- EmptyState
- ConfirmDialog shell
- DataTableShell
- ChartShell
- format/date utilities
- offline helpers
- access helpers

### Module Layer

เหมาะกับของที่รู้ business vocabulary และ use case ชัด เช่น

- WarehouseStockTable
- PurchaseRequestForm
- FinanceClosingSummarySection
- DashboardTaskList
- ApprovalDecisionPanel

### Rule

ถ้าของชิ้นหนึ่งต้องรู้ศัพท์อย่าง warehouse, purchase, finance, farm หรือ approval มาก  
มันไม่ควรอยู่ shared layer

---

## 15. File Responsibilities ระดับบน

ด้านล่างคือกติกาแบบเร็วว่าไฟล์ประเภทไหนควรอยู่ตรงไหน

### ใน `src/app/`

- `page.tsx` = route entry
- `layout.tsx` = layout layer
- `loading.tsx` = route loading
- `error.tsx` / `global-error.tsx` = route/global errors
- `manifest.ts` = PWA manifest definition

### ใน `src/contexts/`

- `XxxContext.tsx` = app-level runtime provider

### ใน `src/core/theme/`

- `tokens.ts`, `typography.ts`, `components.ts`, `create-app-theme.ts` = theme assets/builders

### ใน `src/features/<module>/pages/`

- `XxxPage.tsx` = business page

### ใน `src/features/<module>/components/`

- `XxxTable.tsx`, `XxxForm.tsx`, `XxxSection.tsx`, `XxxDialog.tsx`

### ใน `src/features/<module>/hooks/`

- `use<Module><PagePurpose>Page.ts`
- `use<Module><ResourcePurpose>Query.ts`
- `use<Module><Action><ResourcePurpose>Mutation.ts`

### ใน `src/features/<module>/services/`

- `<module>.api.ts`
- `<module>.service.ts`
- additional service helpers when needed

### ใน `src/features/<module>/types/`

- `<module>.dto.ts` *(optional)*
- `<module>.model.ts` *(optional)*
- `<module>.form.ts` *(optional)*
- `<module>.query.ts` / `<module>.draft.ts` / other shape files *(optional)*

### ใน `src/features/<module>/utils/` *(optional)*

- `<module>.mapper.ts` *(optional)*
- `<module>.constants.ts` *(optional)*
- helper files *(optional)*

> ถ้า permission code ถูกใช้ใน module ให้ดึงจาก guard กลาง ไม่ต้องสร้าง `<module>.permissions.ts` ซ้ำใน feature

---

## 16. Dependency Direction

สถาปัตยกรรมนี้ต้องมี dependency direction ที่ชัด

### Allowed Direction แบบกว้าง

```text
app -> modules -> shared infrastructure/helpers
components(shared) -> shared helpers/types
module pages -> module hooks/components/services/types/utils
module hooks -> module services/types/utils + shared helpers
module services -> api + mappers/types
module utils(mappers/constants/helpers) -> module/shared types/helpers
theme runtime -> theme assets
```

### สิ่งที่ไม่ควรเกิด

- shared component import business service ของ module
- `app/` import DTO mapping logic โดยตรง
- module หนึ่ง import page/component ภายในของอีก module แบบไร้ขอบเขต
- `theme/` import providers
- `contexts/` import business services ของหลาย module แบบมั่ว ๆ
- route page ทำ orchestration เอง
- page component ทำ HTTP calls ตรง
- component render DTO ตรง

---

## 17. Viewport-First Architecture Implications

เพราะระบบนี้ยึดหลัก viewport-first  
shell structure ต้องสนับสนุนสิ่งต่อไปนี้

- sidebar ต้องไม่กินพื้นที่แนวตั้งเกินจำเป็น
- page toolbar ต้องบาง
- main content ต้องคำนวณพื้นที่ทำงานได้
- table/list/review screens ต้องสามารถทำ internal scroll ได้
- page body ต้องเป็น work area จริง
- toast feedback ต้องไม่ทำให้ layout shift
- notification center ต้องไม่แย่งพื้นที่ work area ถ้าไม่จำเป็น

นี่คือเหตุผลว่าทำไม shell structure และ page structure ถึงเป็นประเด็น architecture ไม่ใช่แค่ styling

---

## 18. Dialog / Drawer / Toast / Notification Placement ในเชิง Architecture

เพื่อให้ทุกไฟล์ downstream ใช้มาตรฐานเดียวกัน สถาปัตยกรรมนี้กำหนด placement เชิง architecture ดังนี้

### Dialog

- เป็น modal ระดับ app viewport
- ใช้กับ confirmation / destructive / unsaved changes
- owner อาจอยู่ที่ module page หรือ module component
- primitive/shared layer อยู่ใน `components/`

### Drawer

- เป็น side workflow / side detail / utility panel
- มักสัมพันธ์กับ main content หรือ shell utility
- shell-level drawers ใช้ `ShellContext`
- module-level drawers เป็น responsibility ของ module/page นั้น

### Toast

- provider อยู่ระดับแอป
- feedback แสดงใน main content context
- ไม่ใช่ notification center

### Notification Center

- entry อยู่ใน sidebar bell icon
- panel open/close state อยู่ใน shell layer
- data/contents ของ notifications อาจคุยกับ module/service layer ตามการออกแบบในภายหลัง

---

## 19. PWA Direction ในเชิง Architecture

แม้ระบบยังไม่บังคับ service worker เต็มรูปแบบตอนนี้  
แต่ architecture ต้องพร้อมสำหรับสิ่งเหล่านี้

- `manifest.ts`
- app icons / metadata
- installable shell ในอนาคต
- offline-aware UX
- persistence / queue / retry model
- separation ระหว่าง cached read data กับ pending local actions

สิ่งนี้กระทบโครงอย่างน้อยใน

- `src/app/manifest.ts`
- `lib/` สำหรับ pwa/offline helpers
- persistence strategy ใน `03_frontend_infrastructure.md`
- UI states ใน `12_frontend_ui-design-standards.md`

---

## 20. Architecture Summary Matrix

| Concern                              | Owner Layer                                          |
| ------------------------------------ | ---------------------------------------------------- |
| Route entry                          | `src/app/`                                           |
| Business page                        | `src/features/<module>/pages/`                        |
| Shared shell                         | `src/components/layout/`                             |
| Shared common UI                     | `src/components/common/`                             |
| Shared state providers               | `src/contexts/`                                      |
| Theme runtime                        | `src/contexts/ThemeContext.tsx`                      |
| Theme assets                         | `src/core/theme/`                                         |
| Business components                  | `src/features/<module>/components/`                   |
| Module hooks                         | `src/features/<module>/hooks/`                        |
| API/service                          | `src/features/<module>/services/`                     |
| Module DTO/Model/Form types          | `src/features/<module>/types/`                        |
| Module mappers/constants/helpers     | `src/features/<module>/utils/` *(optional)*          |
| Shared helpers/infrastructure        | `src/lib/`, `src/utils/`, `src/hooks/`, `src/types/` |
| Notification center entry            | Sidebar / shell layer                                |
| Toast provider                       | app root                                             |
| PWA manifest                         | `src/app/manifest.ts`                                |
| Middleware                           | request-time route gate เบื้องต้น                    |

---

## 21. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **โครงของระบบ**  
และไฟล์อื่นจะลงลึกต่อจากโครงนี้

### `01_frontend_overview.md`

ภาพรวม, baseline และเหตุผลระดับระบบ

### `03_frontend_infrastructure.md`

ลงลึกเรื่อง middleware, http, cache, persistence, offline, PWA, packages และ runtime details

### `04_frontend_auth-access.md`

ลงลึกเรื่อง `/access`, assignments, current access และ permission checks

### `09_frontend_component-guidelines.md`

ลงลึกเรื่อง page composition, section ownership, dialog/table/chart ownership

### `10_frontend_naming-conventions.md`

ลงลึกเรื่องชื่อ route, file, context/provider, env และ module names

### `12_frontend_ui-design-standards.md`

ลงลึกเรื่อง shell behavior, notification model, dialog/drawer, table/form/layout patterns และ viewport rules

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 22. Summary

สรุปสาระสำคัญที่สุดของ `02_frontend_architecture.md` คือ

- `src/app/` คือ route layer ไม่ใช่ business owner
- `src/features/` คือ owner หลักของ business frontend logic
- shared layers ต้อง shared จริง
- providers หลักของระบบต้องอยู่ใน `src/contexts/`
- theme runtime กับ theme assets ต้องแยกกัน
- shell ของระบบคือ `sidebar + main content`
- notification center หลักอยู่ที่ bell icon ใน sidebar
- toast feedback เป็น app-level provider แต่แสดงใน main content context
- route page ควรบาง และควรส่งต่อไปยัง module page
- module anatomy ต้องคงที่ทั้งระบบ
- middleware มีบทบาทเป็น request-time route gate เบื้องต้น ไม่ใช่ owner ของ business access logic ทั้งหมด
- architecture ต้องรองรับ viewport-first work pages ตั้งแต่ระดับ shell
- architecture ต้องเผื่อ PWA direction, offline/persistence direction และ SAP-ready UX ตั้งแต่ต้น
- placement ของ dialog/drawer/toast/notification center เป็นเรื่องของ architecture ไม่ใช่แค่ styling
