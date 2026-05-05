# 13_frontend_requirements.md

# Frontend Requirements

ไฟล์นี้กำหนด baseline requirements ของ Frontend ว่าระบบต้องรองรับอะไรบ้างในระดับ product behavior

ขอบเขตหลักของไฟล์นี้คือ

- product scope และ active modules
- route/menu intent ระดับ requirement
- requirements ของ auth/access/dashboard/shell
- requirements ของ table/form/chart/notification/dialog/drawer
- online-only vs offline-capable flow classification
- ขอบเขตงานที่เป็น frontend concern และสิ่งที่ไม่ใช่

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อยืนยัน requirement baseline ก่อนแตกงาน implementation

- feature ใดถือว่า must-have ในรอบปัจจุบัน
- พฤติกรรมใดเป็น directional requirement ที่ต้องเผื่อในโครง
- route/menu/dashboard/shell ต้องสะท้อนงานจริงแบบใด
- auth/access และ states ที่ผู้ใช้เห็นต้องมีอะไรบ้าง
- flow ใดจัดเป็น online-only และ flow ใดต้อง offline-aware
- integration/persistence/theme/viewport concerns ต้องถูกนับเป็น requirement หรือไม่

ไฟล์นี้ไม่แทน PRD เต็มหรือ backend spec แต่เป็น baseline requirement ที่ docs ฝั่ง frontend ต้องยึดร่วมกัน

### อ่านต่อ

- ภาพรวม frontend -> `01_frontend_overview.md`
- app architecture -> `02_frontend_architecture.md`
- runtime foundation -> `03_frontend_infrastructure.md`
- auth/access model -> `04_frontend_auth-access.md`
- UI standards -> `12_frontend_ui-design-standards.md`
- Q/A workbook สำหรับอัปเดต requirements -> `14_frontend_requirements-questions.md`

### External Requirement References

เพื่อไม่ให้ requirement ฝั่ง implementation ปนกับเอกสารธุรกิจภายนอก ให้ใช้ชุดเอกสารนี้เป็น overlay

- external package index -> `../requirements/README.md`
- external summary -> `../requirements/01_external-requirements-summary.md`
- workflows/rules -> `../requirements/02_business-workflows-and-rules.md`
- permission/menu/approval design -> `../requirements/03_permission-menu-approval-design.md`
- SAP sync/offline constraints -> `../requirements/04_sap-sync-offline-and-integration.md`
- project alignment map -> `../requirements/05_alignment_with_current_project.md`

---

## 2. Requirement Principles

## 2.1 Frontend Requirement ต้องผูกกับการใช้งานจริง

เอกสารนี้ไม่เขียน requirement เพื่อให้ “ครบทุกคำสวย ๆ”  
แต่เขียนเพื่อให้รองรับงานจริงของผู้ใช้ เช่น

- ดูงานที่ต้องทำ
- บันทึกข้อมูล
- ตรวจสอบข้อมูล
- อนุมัติ
- ดูสถานะ
- ติดตาม exception
- ทำงานต่อเนื่องในสภาพ network ที่ไม่สมบูรณ์
- เข้าใจสถานะ integration/sync
- ใช้งานได้จริงบน desktop/tablet

## 2.2 Frontend Requirement ต้องคงที่พอให้ architecture ยึดได้

บางอย่างเป็น implementation detail  
แต่บางอย่างเป็น requirement ระดับสถาปัตยกรรม เช่น

- sidebar + main content shell
- notification center ใน sidebar
- light/dark theme
- Thai-first UI
- viewport-first work pages
- cache/persistence direction
- offline-capable direction
- SAP/integration-ready UX

สิ่งเหล่านี้ถือเป็น requirement ระดับระบบ ไม่ใช่ optional nice-to-have

## 2.3 Frontend Requirement ต้องแยก “ตอนนี้ต้องมี” กับ “ต้องพร้อมต่อยอด”

ระบบนี้มีทั้ง

- **active requirements** ที่ควรมีใน baseline implementation
- **directional requirements** ที่ต้องเผื่อไว้ใน architecture แม้ยังไม่ลงลึกเต็มรูปแบบในเฟสแรก

## 2.4 Technology Baseline Note (Current)

เพื่อไม่ให้ requirement drift จากระบบที่ใช้งานจริง ให้ยึด baseline นี้

- Frontend stack: Next.js (App Router) + TypeScript + MUI + React Query + RHF + Zod
- Backend integration baseline: current API/BFF contract (ไม่ผูกกับ implementation language)
- Frontend ต้องคุยผ่าน backend/BFF/integration layer ไม่คุยระบบภายนอกตรง

หมายเหตุ

- เอกสาร requirement จากธุรกิจใช้เป็น “แนวทาง” และอาจมีบางรายการไม่อัปเดต
- implementation truth ต้องยึด backend contract และ policy ล่าสุดของระบบจริง

---

## 3. Baseline Product Scope

frontend ของระบบนี้ต้องรองรับ product areas อย่างน้อยดังนี้

- Authentication / Session
- Access / Role / Permission / Scope Selection
- Dashboard / Insight
- Farm Operations
- Health
- Production
- Warehouse
- Purchase
- Project / Maintenance
- Sales
- Finance
- Approvals
- Master Data
- Documents
- Settings / Integration / Audit

---

## 4. Active Module Baseline

baseline module names ของ frontend คือ

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

### requirement rule

module names เหล่านี้ถือเป็น owner หลักของ frontend business logic  
แม้ route หรือ menu label จะเปลี่ยนได้ในอนาคต

---

## 5. Final Route / Menu Intent Baseline

route และ menu intent ปัจจุบันของ frontend ให้ยึดประมาณนี้

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

### requirement rule

- route เป็น navigation intent
- route ไม่ใช่ permission model
- route ไม่ใช่ backend contract
- menu ไม่จำเป็นต้อง expose ทุก route
- sub-navigation หลักอยู่ในหน้า area ไม่ใช่ nested sidebar หลายชั้น

### route intent -> module owner mapping (ที่ต้องยึด)

- `/project/*` -> module `maintenance`
- `/approvals/*` -> module `approval`
- `/admin/user-assignment/*` -> module `user-assignment`
- `/admin/master/*` -> module `master`
- `/admin/docs/*` -> module `document`
- `/admin/settings/*` -> module `setting`

---

## 6. Auth Requirements

frontend ต้องรองรับอย่างน้อย

- login
- logout
- session restore
- session expiry handling
- auth loading state
- login error state
- protected route gating ระดับบน
- current user display

### requirement details

- `/login` เป็น public route
- main app ต้องไม่เปิดให้ใช้งานถ้ายังไม่มี session ที่ถูกต้อง
- frontend ต้องรองรับการกลับเข้าสู่ login flow เมื่อ session หมดอายุ
- frontend ต้องไม่ยึด localStorage เป็น canonical auth truth

---

## 7. Access Requirements

frontend ต้องรองรับอย่างน้อย

- access assignments
- current access
- effective access
- current role / current scope display
- `/access` flow หลัง login
- change context จาก shell
- menu/page/section/action/data guards
- no-access state
- access denied state

### baseline behavior

- ถ้ามีหลาย assignments หลัง login -> เข้า `/access`
- ถ้ามี assignment เดียว -> auto-select ได้
- current access ต้อง resolve ก่อนเข้า main app
- shell ต้องแสดง current access summary
- เมื่อเปลี่ยน current access ต้อง refresh/invalidate access-sensitive state และกลับ `/dashboard`

---

## 8. Dashboard Requirements

dashboard เป็น personalized landing page ของผู้ใช้

### dashboard ต้องรองรับอย่างน้อย

- งานที่ต้องทำตอนนี้
- สิ่งที่ต้องเฝ้าระวัง
- metric summaries ที่สำคัญ
- chart-based summaries ที่จำเป็นจริง
- quick drilldown ไป area ที่เกี่ยวข้อง
- alert / notification cues ที่สัมพันธ์กับ current access
- data freshness หรือ warning ที่สำคัญเมื่อเกี่ยวข้อง

### dashboard ไม่ควรเป็น

- mega-report
- analytics center เต็มรูปแบบ
- route index ของทั้งระบบ
- admin control panel หลัก
- list รายการยาวหลายตารางแบบไม่มี hierarchy

### requirement rule

dashboard ต้อง personalized ตาม effective access และ current context เสมอ

---

## 9. Shell Requirements

frontend ต้องมี app shell แบบ

- sidebar
- main content

### shell ต้องรองรับอย่างน้อย

- area navigation
- bell icon notification entry
- user panel
- current access summary
- change context entry
- theme entry เมื่อเหมาะสม
- page toolbar ภายใน main content
- viewport-first work area

### shell requirements เพิ่มเติม

- ไม่ใช้ global headbar ใหญ่เป็น baseline
- sidebar ต้องรองรับ collapsed / expanded
- shell ต้องไม่กินพื้นที่แนวตั้งเกินจำเป็น
- shell ต้องเป็นที่อยู่ของ notification center entry และ user/access summary

---

## 10. Notification Requirements

ระบบต้องรองรับ notification อย่างน้อย 3 แบบ

1. **Notification Center**
2. **Toast Feedback**
3. **Inline Alerts / Banners**

## 10.1 Notification Center Requirements

- bell icon อยู่ใน sidebar
- มี unread badge
- เข้าถึงได้จากทุกหน้าใน main app
- ใช้สำหรับ actionable notifications เช่น approvals, alerts, failed sync notices, integration warnings

## 10.2 Toast Requirements

- ใช้สำหรับ feedback ชั่วคราวหลัง action
- ไม่ใช้แทน notification center
- ไม่ใช้แทน confirm dialog
- ต้องไม่รกหรือรบกวนการทำงานเกินไป

## 10.3 Inline Alert Requirements

- ใช้กับ offline, stale, pending sync, failed sync, integration warning, access limitation
- อยู่ใน content area
- ต้องบอก user ได้ว่าตอนนี้เกิดอะไรขึ้นและควรทำอะไรต่อเมื่อเหมาะสม

---

## 11. Dialog / Drawer / Panel Requirements

## 11.1 Dialog Requirements

ต้องใช้กับ

- confirmation
- destructive action
- unsaved changes
- quick form เล็ก
- quick review เล็ก

### requirement rule

destructive actions ต้องมี confirmation dialog เป็น baseline

## 11.2 Drawer Requirements

ต้องใช้กับ

- filter panel
- quick detail
- side preview
- notification panel
- supporting side workflows

### requirement rule

drawer ต้องรักษา context ของหน้าหลักไว้ได้

## 11.3 Full Page Requirements

ฟอร์มธุรกรรมหลักหรือ workflow ใหญ่ต้องใช้ full page ใน main content  
ไม่ใช้ dialog เป็น baseline

---

## 12. Table Requirements

เพราะระบบนี้เป็น ERP ที่ list-heavy  
frontend ต้องรองรับตารางที่ใช้งานจริงได้ดี

### table requirements ขั้นต่ำ

- pagination
- page size options
- internal scroll เมื่อเหมาะสม
- sticky header เมื่อ table เป็น work area หลัก
- loading state
- empty state
- no-results state
- error state
- light/dark compatibility
- desktop/tablet readability

### baseline page size options

- 10
- 25
- 50
- 100

### requirement rule

table-heavy pages ต้องสามารถทำงานอยู่ใน viewport หลักได้ ไม่ใช่ยาวทั้ง browser โดยไม่มีหลัก

---

## 13. Form Requirements

frontend ต้องรองรับฟอร์มธุรกรรมและฟอร์มข้อมูลหลักที่ใช้งานจริงได้

### form requirements ขั้นต่ำ

- sectioned layout เมื่อฟอร์มยาว
- field labels ที่ชัด
- helper text / validation text ที่ชัด
- primary / secondary actions ชัดเจน
- date picker มาตรฐาน
- RHF + Zod based validation
- unsaved changes warning เมื่อเหมาะสม
- draft/save/recover direction ในหน้าที่จำเป็น

### requirement rule

ฟอร์มใหญ่ต้องไม่ถูกยัดลง dialog เป็น baseline

---

## 14. Chart Requirements

ระบบนี้ใช้ chart เพื่อช่วยหา insight ไม่ใช่ใส่เพื่อความสวยงาม

### chart requirements ขั้นต่ำ

- ใช้ Apache ECharts
- ผูกกับ theme system
- มี loading / empty / no-data states
- ใช้กับ dashboard/reports/analytics/monitoring
- มี table/detail fallback เมื่อข้อมูลอ่านแบบตารางได้ดีกว่า
- ไม่ทำลาย viewport-first layout

### requirement rule

ถ้าหน้าใช้ chart ต้องยังอ่านและใช้งานได้จริงแม้ข้อมูลมีปริมาณมากหรือไม่มีข้อมูล

---

## 15. Theme Requirements

frontend ต้องรองรับทั้ง

- Light Theme
- Dark Theme

### theme requirements ขั้นต่ำ

- shell, sidebar, cards, tables, forms, dialogs, alerts, charts ต้อง render ได้ดีทั้งสองธีม
- contrast ต้องอ่านได้จริง
- state colors ต้องสื่อความหมายชัด
- theme switching ต้องไม่ทำให้ hierarchy หรือ readability พัง

### requirement rule

light/dark theme เป็น requirement ระดับระบบ ไม่ใช่ของแถมในภายหลัง

---

## 16. Thai-First UI Requirements

frontend ปัจจุบันต้องเป็น Thai-first

### requirement details

- ข้อความหลักใน UI ใช้ภาษาไทย
- menu ใช้ภาษาไทย
- labels / helper texts / alerts / empty states / errors ใช้ภาษาไทย
- route/file/type naming ใช้ภาษาอังกฤษตาม technical conventions
- wording ต้องสั้น ชัด และเหมาะกับผู้ใช้ธุรกิจ

---

## 17. Viewport-First Work Page Requirements

นี่เป็นหนึ่งใน requirements สำคัญที่สุดของระบบ

### work pages ที่เข้าข่ายอย่างน้อย

- dashboard
- warehouse
- purchase
- finance
- approvals
- admin data screens
- review/detail pages
- report/analytics pages ที่มีงานต่อเนื่อง

### requirement details

- shell ต้องกินพื้นที่แนวตั้งให้น้อย
- page toolbar ต้องบาง
- main work section ต้องใช้พื้นที่ที่เหลือให้คุ้ม
- internal scroll ใน content/table area เป็น baseline เมื่อเหมาะสม
- browser scroll ทั้งหน้ายาวมากไม่ใช่ baseline ของ work pages

---

## 18. Online-Only vs Offline-Capable Flow Classification

ระบบนี้ต้องแยก requirement ของ flows ออกเป็น 2 กลุ่มชัดเจน

1. Online-Only
2. Offline-Capable / Offline-Aware

---

## 19. Online-Only Flows (Baseline)

flows ต่อไปนี้อย่างน้อยให้ถือเป็น **online-only baseline** เว้นแต่มี requirement เพิ่มภายหลัง

- login
- access selection ที่ต้องพึ่ง current assignment จาก server
- approval decision ที่ต้องยืนยันผลทันที
- finance closing
- integration settings
- admin user/role/permission management
- data ที่มีผลธุรกรรมสูงและต้องการ server truth ทันที
- actions ที่ต้อง confirm กับ backend แบบทันทีและย้อนกลับยาก

### requirement rule

online-only flow ต้องมี UX ที่บอกชัดเมื่อทำงานไม่ได้เพราะ offline/network issue

---

## 20. Offline-Capable / Offline-Aware Flows (Baseline Direction)

flows ต่อไปนี้เป็น candidate ของ **offline-capable** หรืออย่างน้อย **offline-aware** direction

- data entry หน้างานบางประเภท
- ฟอร์มที่กรอกนานและมีโอกาสหลุดกลางคัน
- local draft ของงานที่ยังไม่ส่ง
- pending queue สำหรับ mutation บางประเภทที่ธุรกิจยอมรับได้
- cached read views บางประเภท
- dashboards/reports บางส่วนที่แสดง stale/cached state ได้

### requirement details

- frontend ต้องสามารถแยก online-only กับ offline-capable flows ได้
- local draft ต้องมี owner ชัด
- pending queue ต้องมี owner ชัด
- UI ต้องบอกได้ว่าอะไรยังไม่ sync, sync แล้ว, failed, retryable หรือ stale

### หมายเหตุ

เอกสารนี้ยังไม่บังคับว่า flow ไหนต้อง offline ได้ 100% ทันที  
แต่กำหนดว่า architecture และ UX ต้องพร้อมรองรับแนวทางนี้

---

## 21. Cache / Persistence Requirements

frontend ต้องมี baseline requirement เรื่อง cache/persistence ดังนี้

### 21.1 Query Cache

- ใช้กับ server data
- ลดเวลา reload
- สนับสนุน list/detail/dashboard responsiveness
- ต้อง clear/invalidate เมื่อ current access เปลี่ยนในกรณีที่ data ขึ้นกับ access

### 21.2 Browser Persistence

- ใช้กับ UI preference เช่น theme mode, sidebar state, table density, selected tabs/filter presets บางอย่าง
- ไม่ใช้เป็น canonical source ของ auth/permission/current access

### 21.3 Local Draft / Queue

- ต้องมี direction สำหรับ form drafts ที่เหมาะสม
- ต้องมี direction สำหรับ pending queue เมื่อธุรกิจต้องการ offline-capable flow

### requirement rule

cache, persistence และ local draft ไม่ใช่เรื่องค่อยคิดทีหลัง แต่เป็น requirement ระดับ product/UX ของระบบนี้

---

## 22. PWA Requirements / Direction

PWA ในระบบนี้ให้ถือเป็น **directional requirement ที่ต้องเผื่อใน architecture**  
ไม่จำเป็นต้องเปิดเต็มรูปแบบทุก capability ตั้งแต่ phase แรก

### baseline requirements

- app ต้องพร้อมสำหรับ web app manifest
- ต้องพร้อมสำหรับ installable shell ในอนาคต
- offline/persistence/sync direction ต้องไม่ขัดกับการต่อยอดเป็น PWA

### phase-first interpretation

- manifest / icons / metadata = ควรพร้อม
- service worker / advanced runtime caching / background sync = ยังไม่จำเป็นต้องครบใน phase แรก ถ้ายังไม่อยู่ใน scope

---

## 23. SAP / Integration Requirements

frontend ต้องรองรับ integration-aware UX และ SAP-ready direction

### baseline requirements

- frontend ต้องไม่คุย SAP ตรง
- frontend ต้องคุยผ่าน backend/BFF/integration layer
- frontend ต้องแสดง integration/sync states ให้ user เข้าใจได้

### states ที่อย่างน้อยควรแสดงได้

- รอส่งข้อมูล
- กำลังส่งข้อมูล
- ส่งสำเร็จ
- ส่งไม่สำเร็จ
- ลองใหม่ได้
- conflict / ต้องตรวจสอบ
- last synced / stale เมื่อเกี่ยวข้อง

### requirement rule

SAP support ในเอกสารชุดนี้หมายถึง **UX readiness และ data/integration boundary readiness**  
ไม่ใช่การเอา SAP schema หรือ SAP SDK เข้ามาอยู่ใน browser โดยตรง

---

## 24. Access / Permission UI Requirements

frontend ต้องรองรับ permission-aware UI อย่างน้อยในระดับ

- menu guard
- page guard
- section guard
- action guard
- data guard

### requirement details

- การซ่อนเมนูอย่างเดียวไม่ถือว่าตรวจสิทธิ์ครบ
- ต้องมี permission mapping 2 ชั้น: backend canonical permissions -> frontend guard/menu projection
- route เข้าได้หรือไม่ได้ต้องแยกจาก menu visibility
- actions ต้องมี guard ของตัวเอง
- data fetching ต้อง access-aware
- shell ต้องแสดง current access/current context ชัด

---

## 25. Notification / Alert / State Requirements

frontend ต้องรองรับ states ต่อไปนี้อย่างน้อย

- loading
- empty
- no results
- error
- access denied
- no access
- auth loading
- session expired
- offline
- pending sync
- syncing
- failed sync
- conflict
- stale data
- integration warning
- integration failed

### requirement rule

states เหล่านี้ต้องไม่เป็น optional visuals ที่มีบางหน้าบางหน้า  
แต่ต้องเป็น pattern ระดับระบบ

---

## 26. Document / File Requirements

frontend ต้องรองรับอย่างน้อย

- document/file references
- attachment listing
- file metadata display
- open/download intent
- preview direction เมื่อเหมาะสม
- file states เช่น unavailable/failed to load

### requirement rule

frontend ต้องมอง file/document เป็น user-facing concept  
ไม่ใช่ raw storage path หรือ backend file internals

---

## 27. Admin / Master Data Requirements

พื้นที่ผู้ดูแลระบบต้องรองรับอย่างน้อย

- users
- roles
- permissions
- scopes
- master data เช่น items, partners, facility, uoms, categories, rules
- docs
- system settings
- integration settings
- audit-related settings/summaries ตาม scope ของ frontend

### requirement rule

admin area ยังต้องใช้หลักเดียวกับทั้งระบบ

- sidebar + main content
- viewport-first
- tables/forms ที่มีมาตรฐาน
- permission-aware UI
- light/dark theme
- notification/alert/dialog patterns เดียวกัน

---

## 28. Requirement Classification: Must-Have Now vs Directional

เพื่อให้ใช้เอกสารนี้ตัดสินใจได้ง่าย ให้แยกประมาณนี้

## 28.1 Must-Have Now

- Next.js App Router + TypeScript
- MUI + RHF + Zod + TanStack Query + Axios
- sidebar + main content shell
- dashboard
- login / access flow
- current access / effective access model
- Thai-first UI
- light/dark theme
- ECharts
- MUI Dialog / MUI Drawer / notistack / MUI Alert
- viewport-first work pages
- query cache strategy
- browser persistence strategy
- notification center ใน sidebar
- table/form standards
- SAP/integration-aware UX baseline
- module-based architecture

## 28.2 Directional / Future-Ready

- deeper offline-capable workflows
- richer local queue + retry orchestration
- broader installable PWA behavior
- advanced service worker strategies
- more sophisticated sync conflict handling
- richer notification history/management surfaces

---

## 29. Frontend Boundary: อะไรเป็นหน้าที่ของ Frontend

frontend มีหน้าที่อย่างน้อย

- แสดงผลข้อมูลในภาษาที่ผู้ใช้เข้าใจ
- บังคับใช้ UI guard ตาม effective access
- จัดการ interaction states
- จัดการ form, list, review, dashboard และ workflows ฝั่งหน้าจอ
- แสดง sync/integration/offline states
- จัดการ local preferences/drafts ตาม requirement
- provide viewport-first work experience
- compose data จาก service/model ที่เหมาะกับ UI

### frontend ไม่ใช่ owner ของ

- canonical auth truth
- canonical permission truth
- SAP raw integration internals
- backend workflow engine
- final business validation truth
- server-side authorization truth

---

## 30. Product Area Requirement Matrix

| Product Area        | Frontend Must Support                                                                |
| ------------------- | ------------------------------------------------------------------------------------ |
| Auth                | login, logout, session restore, session expiry handling                              |
| Access              | `/access`, assignment selection, current access, effective access, change context    |
| Dashboard           | personalized summary, alerts, tasks, key metrics, quick drilldown                    |
| Farm                | operational entry, overview, stock/feed/health-related read/write surfaces ตามสิทธิ์ |
| Production          | opening/production context screens                                                   |
| Warehouse           | receive/transfer/issue/adjust/list/detail flows                                      |
| Purchase            | create/detail/list/approval-aware flows                                              |
| Maintenance/Project | request/orders/detail/review flows                                                   |
| Sales               | orders/deliveries/weighing/invoices                                                  |
| Finance             | costing/closing/profit-loss/review flows                                             |
| Insight             | reports/analytics/alerts/chart-based insight surfaces                                |
| Approval            | inbox/detail/decision flows                                                          |
| Master/Admin        | users/roles/permissions/scopes/master/settings/docs                                  |
| Documents           | attachment/file/document surfaces                                                    |
| Integration         | sync/integration statuses, warnings, retry cues                                      |

---

## 31. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **baseline product requirements ของ frontend**

### `01_frontend_overview.md`

กำหนดภาพรวมและหลักคิดของระบบ

### `02_frontend_architecture.md`

กำหนดโครง app/features/shell (ตาม owner จริงของโปรเจกต์)

### `03_frontend_infrastructure.md`

กำหนด runtime foundations เช่น cache, persistence, offline, PWA, integration direction

### `04_frontend_auth-access.md`

กำหนด auth/access behavior เชิงลึก

### `12_frontend_ui-design-standards.md`

กำหนด visual/interaction standards ที่ทำให้ requirements นี้เกิดขึ้นจริง

### `14_frontend_requirements-questions.md`

ใช้เป็น workbook ให้ผู้ดูแลโปรเจกต์ตอบ requirement decisions เพิ่มเติม แล้วส่งให้ AI ใช้อัปเดต docs ต่อ

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 32. Summary

สรุปสาระสำคัญที่สุดของ `13_frontend_requirements.md` คือ

- frontend ต้องรองรับ product areas หลักของ FarmHUB ครบในระดับ UI/workflow
- route/menu intent ปัจจุบันเป็น baseline ของ navigation ไม่ใช่ business contract
- auth/access/current access/effective access เป็น requirement ระดับระบบ
- dashboard ต้องเป็น personalized landing page
- shell ต้องเป็น `sidebar + main content`
- notification center หลักต้องอยู่ที่ bell icon ใน sidebar
- tables/forms/charts/dialogs/drawers/toasts/alerts ต้องมีมาตรฐานเดียวกันทั้งระบบ
- work pages ต้องยึดหลัก viewport-first
- light/dark theme และ Thai-first UI เป็น requirement ไม่ใช่ optional enhancement
- frontend ต้องรองรับ cache/persistence direction, local draft/queue direction, offline-aware UX และ PWA direction
- frontend ต้องรองรับ SAP/integration-aware UX แต่ไม่คุย SAP ตรง
- requirement บางส่วนต้องมีทันทีใน baseline implementation และบางส่วนเป็น future-ready direction ที่ architecture ต้องเผื่อไว้ตั้งแต่ต้น
