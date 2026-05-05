# 09_frontend_component-guidelines.md

# Frontend Component Guidelines

ไฟล์นี้กำหนดกติกาการประกอบ component ของ Frontend เพื่อให้หน้าอ่านง่าย แก้ได้ และไม่ปน ownership

ไฟล์นี้ครอบคลุม

- page composition flow
- shared component vs module component
- section/table/form/dialog/drawer/chart ownership
- shell-level component boundaries
- export surface ของ module components
- anti-pattern ที่ทำให้ page โตเกินควบคุม

> Project alignment: ตัวอย่างชื่อ module ในไฟล์นี้เป็น pattern กลาง ให้ map กับ feature จริงใน repo (`admin/*`, `operations/*`, `production/*`, `reports/*`) โดยไม่ต้องรื้อโครงทั้งหมด

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อให้ทีมตอบเหมือนกันว่า component ไหนควรอยู่ชั้นไหน

- page ต้องทำงานระดับ orchestration เท่านั้นหรือไม่
- section คือขอบเขตหลักของหน้าอย่างไร
- shared กับ module components แยกจากกันด้วยเกณฑ์ใด
- dialog/drawer/toast/notification ใช้ต่างบริบทกันอย่างไร
- components ของ module ต้องตั้งชื่อและวางไฟล์แบบไหน
- จุดไหนเป็น anti-pattern ที่ห้ามปล่อยเข้าระบบ

ไฟล์นี้ไม่แทน architecture หรือ visual style docs แต่เป็นกติกา ownership ของ component tree ทั้งระบบ

### อ่านต่อ

- ภาพรวมทั้งระบบ -> `01_frontend_overview.md`
- project structure และ shell structure -> `02_frontend_architecture.md`
- auth/access guards -> `04_frontend_auth-access.md`
- API/data flow -> `07_frontend_api-usage.md`
- UI/UX standards -> `12_frontend_ui-design-standards.md`

---

## 2. Component Principles

## 2.1 Page ต้องเป็น Composer ไม่ใช่ God Component

page component ควรทำหน้าที่

- อ่าน route params
- เรียก page hooks
- ตัดสิน render state ระดับหน้า
- ประกอบ sections
- ผูก actions หลักของหน้า

page ไม่ควรเป็น giant file ที่มีทั้ง

- data fetching
- mapping
- form logic ทั้งหมด
- table column logic ทั้งหมด
- modal logic ทุกจุด
- business rendering ทุก section รวมอยู่ที่เดียว

## 2.2 Shared Component ต้อง Shared จริง

สิ่งที่อยู่ใน `src/components/` ต้องใช้ข้ามหลาย module ได้จริง  
ถ้ามีศัพท์ของ domain ชัดเจน เช่น purchase, warehouse, finance, farm, approval มันควรอยู่ module layer

## 2.3 Module Component คือเจ้าของ Business Vocabulary

component ที่รู้ศัพท์และ use case ของ domain เช่น

- `PurchaseRequestForm`
- `WarehouseStockTable`
- `FinanceClosingSummarySection`
- `ApprovalDecisionPanel`

ควรอยู่ใน module ของตัวเอง

## 2.4 Section Component คือขอบเขตที่ดีของหน้า

section component เป็นหน่วยกลางที่ช่วยให้หน้าไม่ยาวเกินไป และช่วยทำ ownership ให้ชัด เช่น

- summary section
- filter section
- result table section
- approval history section
- integration status section

## 2.5 Dialog / Drawer / Toast / Notification Center ต้องแยก concern กัน

ระบบนี้ใช้ pattern ชัดเจน

- **Dialog** = confirm / destructive / unsaved changes / quick modal
- **Drawer** = side detail / filter / supporting panel / notification panel
- **Toast** = feedback ชั่วคราวใน main content
- **Notification center** = shell-level entry ผ่าน bell icon ใน sidebar

ดังนั้น component ownership ต้องไม่ปนกัน

## 2.6 Component ต้องสอดคล้องกับ Viewport-First Layout

เพราะระบบนี้เป็น ERP ที่ใช้ desktop/tablet เป็นหลัก  
component structure ต้องช่วยให้

- page toolbar บาง
- sections ชัด
- table อยู่ใน content area ที่คุมได้
- action bar ไม่หลุดสายตา
- browser scroll ไม่ยาวโดยไม่จำเป็น

---

## 3. Component Layers ของระบบนี้

UI ของระบบนี้ให้คิดเป็น 5 ชั้นหลัก

```text
Route Entry
-> Page
-> Section
-> Business Component
-> Shared Primitive / Shared Shell Component
```

อีกมุมหนึ่งในเชิงโฟลเดอร์

```text
src/app/.../page.tsx
-> src/features/<module>/pages/XxxPage.tsx
-> src/features/<module>/components/XxxSection.tsx
-> src/features/<module>/components/XxxTable.tsx / XxxForm.tsx / XxxCard.tsx
-> src/components/... shared components
```

---

## 4. Shared Components vs Module Components

## 4.1 Shared Components (`src/components/`)

เหมาะกับสิ่งที่ใช้ได้ข้ามหลาย module เช่น

- `PageContainer`
- `PageToolbar`
- `PageTitle`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `AccessDeniedState`
- `ConfirmDialog`
- `DataTableShell`
- `FilterBar`
- `SectionCard`
- `ChartShell`
- `InlineStatusAlert`
- `FormActionBar`
- `DrawerLayout`

### shared component ไม่ควรมี

- purchase-specific labels
- finance-specific statuses
- warehouse-specific columns
- domain-specific permission logic

## 4.2 Module Components (`src/features/<module>/components/`)

เหมาะกับสิ่งที่รู้ศัพท์ของ domain ชัด เช่น

- `PurchaseRequestHeaderSection`
- `PurchaseRequestItemsTable`
- `WarehouseStockTable`
- `WarehouseAdjustDialog`
- `FinanceClosingSummaryCard`
- `ApprovalHistorySection`
- `NotificationListPanel` ถ้าเป็น feature-owned detail

---

## 5. Page Composition Flow

flow ที่แนะนำของหน้า business page คือ

```text
Route page
-> Module page
-> Page hook(s)
-> Render page states
-> Compose sections
-> Sections render business components
-> Business components use shared primitives when needed
```

### ตัวอย่างเชิงโครง

```tsx
// src/app/(main)/purchase/create/page.tsx
import { PurchaseCreatePage } from '@/features/purchase/pages/PurchaseCreatePage';

export default function Page() {
  return <PurchaseCreatePage />;
}
```

```tsx
// src/features/purchase/pages/PurchaseCreatePage.tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { PageToolbar } from '@/components/layout/PageToolbar';
import { PurchaseRequestFormSection } from '../components/PurchaseRequestFormSection';
import { usePurchaseCreatePage } from '../hooks/usePurchaseCreatePage';

export function PurchaseCreatePage() {
  const page = usePurchaseCreatePage();

  return (
    <PageContainer>
      <PageToolbar title="สร้างใบขอซื้อ" actions={page.toolbarActions} />
      <PurchaseRequestFormSection
        form={page.form}
        onSubmit={page.onSubmit}
        isSubmitting={page.createMutation.isPending}
      />
    </PageContainer>
  );
}
```

---

## 6. Recommended Module Component Anatomy

ภายใน module หนึ่ง แนะนำให้มี structure แบบนี้

```text
src/features/<module>/
├── pages/
├── components/
├── hooks/
├── services/
├── mocks/
├── types/
├── utils/
└── index.ts
```

### หมายเหตุ

baseline นี้ให้ **เก็บ component files แบบ flat ใน `components/`**  
และใช้ชื่อไฟล์แบบ `ModuleName + Purpose + Suffix` เพื่อสื่อ ownership แทนการแตกโฟลเดอร์ย่อย

ตัวอย่าง

- `WarehouseStockFilterSection.tsx`
- `WarehouseStockTable.tsx`
- `WarehouseStockAdjustDialog.tsx`
- `WarehouseStockEmptyState.tsx`

ถ้า module ใหญ่มากจนเริ่มหายาก ให้ทบทวนการแยก feature/module ก่อน  
ไม่เริ่มจากการซ้อน `components/<sub-module>/...`

---

## 7. Page Components

page component ของ module ควรอยู่ใน

```text
src/features/<module>/pages/
```

### page component ควรทำ

- เรียก page hook
- เชื่อมกับ route params/search params
- จัดการ page-level states เช่น
  - loading
  - error
  - access denied
  - no data
- compose sections
- ผูก page-level dialog/drawer state เมื่อจำเป็น

### page component ไม่ควรทำ

- เขียน table columns ยาวมากทั้งหมดในไฟล์เดียว
- เขียน form fields ทั้งหมดรวมในหน้า
- map DTO
- call repository/api ตรง
- ใส่ utility helpers กระจัดกระจาย

---

## 8. Section Components

section คือหน่วยกลางที่สำคัญมากของระบบนี้  
โดยเฉพาะกับ work pages แบบ viewport-first

### section เหมาะกับอะไร

- summary area
- filter area
- search + actions area
- main list/table area
- detail area
- approval history area
- integration status area
- chart area
- attachment area

### ตัวอย่างชื่อที่ดี

- `WarehouseStockFilterSection`
- `WarehouseStockTableSection`
- `PurchaseRequestSummarySection`
- `FinanceClosingStatusSection`
- `ApprovalHistorySection`

### section ควรทำ

- รวม business components ที่สัมพันธ์กัน
- รับ props ระดับ use case ที่ชัด
- ซ่อน layout complexity ของ area นั้น
- จัดพื้นที่ของ section ให้สอดคล้องกับ viewport-first behavior

---

## 9. Table Components

ระบบนี้เป็น ERP ที่ list-heavy  
ดังนั้น table ต้องเป็น concept สำคัญใน component guidelines

## 9.1 Table Ownership

- generic shell ของ table อยู่ใน shared layer ได้
- business table อยู่ใน module layer

### shared layer examples

- `DataTableShell`
- `TableToolbar`
- `TablePaginationBar`
- `EmptyTableState`

### module layer examples

- `WarehouseStockTable`
- `PurchaseRequestTable`
- `ApprovalInboxTable`
- `FinanceClosingTable`

## 9.2 Table Section Ownership

table จริงควรถูกครอบโดย section เช่น

- `WarehouseStockTableSection`
- `ApprovalInboxTableSection`

เพื่อให้ section เป็น owner ของ

- filter bar
- summary strip
- table container
- pagination placement
- viewport height behavior

## 9.3 Table Column Logic ควรอยู่ไหน

table columns ที่เป็น business-specific ควรอยู่ใกล้ table component หรือไฟล์ columns แยกใน module เช่น

```text
src/features/warehouse/components/
├── WarehouseStockTable.tsx
└── warehouse-stock.columns.tsx
```

### rule

อย่าให้ page file ถือ table column definitions ยาวหลายร้อยบรรทัด

---

## 10. Form Components

ฟอร์มเป็นอีก concern หลักของระบบนี้

## 10.1 Form Ownership

- generic input primitives อยู่ shared layer
- business forms อยู่ module layer
- form section อยู่ module layer
- page เป็นคน compose form sections

## 10.2 Form Components ที่เหมาะกับ shared layer

- `TextFieldControl`
- `SelectControl`
- `DatePickerControl`
- `SwitchControl`
- `TextareaControl`
- `FormSectionCard`
- `FormActionBar`

## 10.3 Business Forms ที่อยู่ module layer

- `PurchaseRequestForm`
- `WarehouseAdjustForm`
- `FinanceClosingForm`
- `FarmEntryForm`

## 10.4 ฟอร์มใหญ่ควรแตก section

ตัวอย่าง

```text
PurchaseRequestFormSection
├── PurchaseRequestHeaderFields
├── PurchaseRequestItemsFieldArray
└── PurchaseRequestNotesSection
```

### rule

อย่าทำฟอร์มธุรกรรมใหญ่เป็น component ไฟล์เดียวถ้ายาวเกินไป

---

## 11. Dialog Components

ระบบนี้ใช้ **MUI Dialog** เป็นมาตรฐานของ modal/confirmation

## 11.1 Shared Dialog Components

อยู่ shared layer ได้ เช่น

- `ConfirmDialog`
- `DeleteConfirmDialog`
- `UnsavedChangesDialog`

### เงื่อนไข

ต้อง generic จริง และไม่ผูกกับศัพท์ของ domain ใด

## 11.2 Module Dialog Components

อยู่ module layer เมื่อ dialog นั้นรู้ domain เช่น

- `WarehouseAdjustConfirmDialog`
- `PurchaseRequestCancelDialog`
- `FinanceClosingRunDialog`

## 11.3 Dialog Owner

โดยทั่วไป owner ของ dialog คือ

- page
- section
- business component ระดับใกล้กับ action นั้น

### rule

dialog state ไม่ควรถูกยกขึ้น global โดยไม่มีเหตุผล  
ยกเว้นเป็น shell-level utility dialog จริง ๆ

---

## 12. Drawer Components

ระบบนี้ใช้ **MUI Drawer** เป็นมาตรฐานของ

- side detail
- filter panel
- utility side panel
- notification panel
- supporting workflows

## 12.1 Shared Drawer Components

ใช้ได้กับโครงทั่วไป เช่น

- `DrawerLayout`
- `FilterDrawer`
- `DetailDrawerShell`

## 12.2 Module Drawer Components

เมื่อรู้ศัพท์ของ domain เช่น

- `WarehouseStockDetailDrawer`
- `PurchaseRequestFilterDrawer`
- `ApprovalCommentDrawer`

## 12.3 Shell-Level Drawer

บาง drawer เป็นของ shell เช่น

- notification panel
- shell utility panels

สิ่งเหล่านี้ควรถูกควบคุมผ่าน `ShellContext`

---

## 13. Notification Center Components

ระบบนี้กำหนดแล้วว่า notification center หลักอยู่ใน sidebar ผ่าน bell icon  
ดังนั้น component ownership ต้องแยกดังนี้

## 13.1 Shell-Owned Components

- `NotificationBell`
- `NotificationBadge`
- `NotificationPanelHost`

สิ่งเหล่านี้เป็นส่วนหนึ่งของ app shell

## 13.2 Notification Panel Content

อาจแยกเป็น component ของ feature/shell ได้ เช่น

- `NotificationListPanel`
- `NotificationList`
- `NotificationListItem`

### rule

entry อยู่ใน shell เสมอ  
แต่รายละเอียดภายใน panel อาจพัฒนาเป็น module/feature ย่อยได้เมื่อระบบโตขึ้น

## 13.3 Toast ไม่ใช่ Notification Center Component

toast เป็น runtime feedback  
ไม่ควรทำ component tree แบบเดียวกับ notification center

---

## 14. Chart Components

ระบบนี้ใช้ **Apache ECharts** เป็นมาตรฐานของ chart

## 14.1 Shared Chart Layer

ควรมี shell/wrapper ทั่วไป เช่น

- `ChartShell`
- `ChartCard`
- `ChartEmptyState`
- `ChartLoadingState`

และอาจมี generic wrappers เช่น

- `EChartContainer`
- `BaseChart`

## 14.2 Module Chart Components

chart ที่รู้ business vocabulary อยู่ module layer เช่น

- `FinanceProfitLossChart`
- `WarehouseStockTrendChart`
- `DashboardTaskTrendChart`
- `FarmPopulationTrendChart`

## 14.3 Chart Owner

owner ของ chart data คือ page hook/service  
owner ของ chart rendering คือ module chart component  
owner ของ generic chart frame คือ shared layer

### rule

อย่ากระจาย ECharts option ดิบไปทุก page  
ให้มี wrapper/pattern กลางก่อน

---

## 15. State Components

ระบบนี้ควรมี state components ที่เป็น shared layer ให้พร้อม เช่น

- `LoadingState`
- `ErrorState`
- `EmptyState`
- `AccessDeniedState`
- `OfflineStateBanner`
- `SyncPendingBanner`
- `IntegrationWarningBanner`

### rule

- generic states อยู่ shared layer
- ถ้ามี wording หรือ visuals เฉพาะ domain มาก ให้มี domain wrapper ใน module ได้

---

## 16. Shell Components

shell ของระบบนี้เป็นของ shared layer

ตัวอย่างโครง

```text
src/components/layout/
├── AppShell.tsx
├── Sidebar.tsx
├── SidebarNavigation.tsx
├── NotificationBell.tsx
├── UserPanel.tsx
├── MainContent.tsx
├── PageContainer.tsx
├── PageToolbar.tsx
└── index.ts
```

### Shell component responsibilities

#### `AppShell`

โครงรวมของ main app

#### `Sidebar`

วาง navigation, bell icon, user panel

#### `NotificationBell`

entry ของ notification center

#### `UserPanel`

current user/current access summary/change context/logout/theme entry

#### `MainContent`

พื้นที่ render page จริง

#### `PageContainer`

container ของแต่ละหน้า

#### `PageToolbar`

title, breadcrumb, actions, filter summary ของหน้า

---

## 17. Viewport-First Page Composition

เพราะระบบนี้ยึดหลัก viewport-first  
page/component composition ควรออกแบบแบบนี้

```text
PageContainer
├── PageToolbar
└── PageBody
    ├── SummarySection (optional)
    ├── FilterSection (optional)
    └── MainWorkSection
        └── Table / Form / Detail / Chart work area
```

### rule

- อย่าให้ทุก section ยาวต่อกันจน browser scroll อย่างเดียว
- main work section ควรเป็น owner ของ internal scroll เมื่อเหมาะสม
- table section ควรคุมพื้นที่ table container
- form section ควรช่วยให้ action bar หาเจอง่าย

---

## 18. Component Export Guidelines

module หนึ่ง module ควรมี `index.ts` เป็น public surface  
แต่ไม่ควร export ทุกไฟล์ย่อยแบบไร้ขอบเขต

### baseline

- export pages ที่ route ใช้
- export hooks ที่ module อื่นจำเป็นต้องใช้จริง
- export components เฉพาะที่ intended ให้ reused ข้าม boundary
- อย่าเปิด internal sections/columns/helpers ออกมาหมด

### why

- ลด coupling
- ป้องกัน module อื่น import internal implementation มากเกินไป
- refactor ได้ง่ายกว่า

---

## 19. Example: Good Page Composition

```tsx
// src/features/warehouse/pages/WarehouseStockPage.tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { PageToolbar } from '@/components/layout/PageToolbar';
import { WarehouseStockFilterSection } from '../components/WarehouseStockFilterSection';
import { WarehouseStockTableSection } from '../components/WarehouseStockTableSection';
import { useWarehouseStockPage } from '../hooks/useWarehouseStockPage';

export function WarehouseStockPage() {
  const page = useWarehouseStockPage();

  if (page.isAccessLoading) {
    return <LoadingState title="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!page.canView) {
    return (
      <AccessDeniedState
        title="คุณไม่มีสิทธิ์เข้าถึงหน้าคลัง"
        description="บริบทการทำงานปัจจุบันไม่อนุญาตให้ดูข้อมูลส่วนนี้"
      />
    );
  }

  return (
    <PageContainer>
      <PageToolbar title="คลัง" actions={page.toolbarActions} />
      <WarehouseStockFilterSection
        filter={page.filter}
        onFilterChange={page.setFilter}
      />
      <WarehouseStockTableSection
        rows={page.rows}
        pagination={page.pagination}
        onPaginationChange={page.onPaginationChange}
        isLoading={page.isLoading}
      />
    </PageContainer>
  );
}
```

### จุดที่ดี

- page บาง
- state ระดับหน้าอยู่ใน page hook
- sections แยกชัด
- table section เป็น owner ของ table area

---

## 20. Example: Good Form Composition

```tsx
// src/features/purchase/components/PurchaseRequestFormSection.tsx
import { PurchaseRequestForm } from '../PurchaseRequestForm';
import { FormActionBar } from '@/components/common/FormActionBar';

type Props = {
  form: PurchaseRequestFormApi;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function PurchaseRequestFormSection({
  form,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <>
      <PurchaseRequestForm form={form} />
      <FormActionBar
        primaryLabel="บันทึกใบขอซื้อ"
        onPrimaryClick={onSubmit}
        isPrimaryLoading={isSubmitting}
      />
    </>
  );
}
```

### จุดที่ดี

- section ทำหน้าที่รวม form + action bar
- shared `FormActionBar` ถูก reuse
- business form อยู่ใน module

---

## 21. Example: Good Dialog Ownership

```tsx
// inside PurchaseRequestDetailSection
const [isDeleteOpen, setDeleteOpen] = useState(false);

return (
  <>
    <Button color="error" onClick={() => setDeleteOpen(true)}>
      ลบรายการ
    </Button>

    <DeleteConfirmDialog
      open={isDeleteOpen}
      title="ยืนยันการลบใบขอซื้อ"
      description="เมื่อลบแล้วจะไม่สามารถกู้คืนได้"
      onCancel={() => setDeleteOpen(false)}
      onConfirm={handleDelete}
      isConfirmLoading={deleteMutation.isPending}
    />
  </>
);
```

### จุดที่ดี

- dialog state อยู่ใกล้ action owner
- ใช้ shared generic dialog
- mutation ยังอยู่ใน hook/page layer ไม่ไหลเข้า dialog component

---

## 22. Example: Notification Shell Composition

```tsx
// src/components/layout/Sidebar.tsx
export function Sidebar() {
  return (
    <aside>
      <SidebarNavigation />
      <NotificationBell />
      <UserPanel />
    </aside>
  );
}
```

```tsx
// src/components/layout/NotificationBell.tsx
export function NotificationBell() {
  const { isNotificationPanelOpen, openNotificationPanel } = useShell();

  return (
    <IconButton onClick={openNotificationPanel}>
      <Badge badgeContent={3}>
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
}
```

```tsx
// src/components/layout/AppShell.tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <NotificationPanelHost />
    </>
  );
}
```

### จุดที่ดี

- entry อยู่ใน shell
- panel host อยู่ใน shell
- notification center เป็น shell concern ชัดเจน

---

## 23. Component Anti-Patterns

สิ่งที่ไม่ควรทำ

- page file ยาวหลายร้อยบรรทัดเพราะรวมทุกอย่างไว้ที่เดียว
- shared components รู้ศัพท์ business domain
- module components import repository/api ตรง
- dialog state ถูกยก global ทั้งที่ใช้แค่หน้าเดียว
- table columns, form fields, dialogs, helper functions ยัดอยู่ใน page เดียวหมด
- chart options ดิบกระจัดกระจายทุกหน้า
- toast logic ปนกับ notification center logic
- ใช้ component เดียวครอบทั้ง list/detail/form/summary จนอ่านไม่ออก
- export internal module components ออกมาหมดโดยไม่จำเป็น
- ใช้ shell components เป็นที่ใส่ business logic ของ module

---

## 24. Recommended Naming for Components

ตัวอย่าง naming ที่ควรใช้

### Pages

- `WarehouseStockPage`
- `PurchaseCreatePage`
- `FinanceClosingPage`

### Sections

- `WarehouseStockFilterSection`
- `WarehouseStockTableSection`
- `PurchaseRequestSummarySection`

### Tables

- `WarehouseStockTable`
- `ApprovalInboxTable`

### Forms

- `PurchaseRequestForm`
- `FinanceClosingForm`

### Dialogs

- `DeleteConfirmDialog`
- `UnsavedChangesDialog`
- `WarehouseAdjustDialog`

### Drawers

- `FilterDrawer`
- `NotificationPanel`
- `WarehouseStockDetailDrawer`

### Charts

- `FinanceProfitLossChart`
- `DashboardTrendChart`

---

## 25. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **กติกาของ component structure และ ownership**

### `02_frontend_architecture.md`

วางโครงของ app, shell, modules และ shared layers

### `04_frontend_auth-access.md`

กำหนด guard flow ที่ page/section/action components ต้องเคารพ

### `07_frontend_api-usage.md`

กำหนด page/hook/service/repository flow

### `12_frontend_ui-design-standards.md`

กำหนด visual pattern, table/dialog/drawer/chart rules และ viewport-first UX

### `10_frontend_naming-conventions.md`

กำหนด naming conventions ของไฟล์และ component names

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

สรุปสาระสำคัญที่สุดของ `09_frontend_component-guidelines.md` คือ

- page ต้องเป็น composer ไม่ใช่ god component
- shared components ต้อง shared จริง
- module components คือเจ้าของ business vocabulary
- section เป็นหน่วยกลางที่ดีของ page composition
- generic table/form/chart/dialog primitives อยู่ shared layer ได้
- business tables/forms/charts/dialogs อยู่ module layer
- notification center เป็น shell-owned concern
- toast feedback ไม่ใช่ notification center
- dialog, drawer, toast และ inline alerts ต้องแยก ownership กันชัด
- component structure ต้องสนับสนุน viewport-first work pages
- page ควรบาง, sections ควรชัด, internal ownership ต้องอ่านแล้วเข้าใจ
- อย่า export internal module pieces ออกมาหมดโดยไม่จำเป็น
- component guidelines ที่ดีช่วยให้ทั้ง architecture, UX และ maintenance สอดคล้องกันทั้งระบบ
