# 12_frontend_ui-design-standards.md

# Frontend UI Design Standards

ไฟล์นี้กำหนดมาตรฐาน UX/UI ของระบบให้ใช้งานจริงได้ในงาน ERP และคงรูปแบบเดียวกันทุก module

ขอบเขตหลักของไฟล์นี้คือ

- visual direction (modern + enterprise)
- shell/sidebar/main content behavior
- table/form/dialog/drawer/notification/toast/alert standards
- state standards (loading/empty/error/access/offline/sync/integration)
- Thai-first wording, viewport-first และ light/dark theme rules

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อลดความไม่สม่ำเสมอของ UI ข้ามทีมและข้ามโมดูล

- หน้าจอหลักต้องจัด layout อย่างไรให้รองรับ viewport-first
- shell และ notification model ต้องคง boundary แบบไหน
- dialog/drawer/toast/alert ต้องเลือกใช้ตามสถานการณ์อย่างไร
- table/form/chart ต้องมี states และ interaction ขั้นต่ำอะไร
- wording ภาษาไทยและธีมกลางของระบบต้องคุมแบบใด
- action เสี่ยงต้องยืนยันด้วย pattern ไหน

ไฟล์นี้ไม่แทน architecture หรือ component ownership docs แต่เป็นมาตรฐานพฤติกรรมและหน้าตาของ UI ทั้งระบบ

### อ่านต่อ

- baseline ภาพรวมของระบบ -> `01_frontend_overview.md`
- app shell และ layout architecture -> `02_frontend_architecture.md`
- runtime ของ notification/theme/offline -> `03_frontend_infrastructure.md`
- auth/access states -> `04_frontend_auth-access.md`
- component ownership -> `09_frontend_component-guidelines.md`

---

## 2. UI Principles ของระบบนี้

## 2.1 Modern + Enterprise

ระบบนี้ต้องดู **modern** แต่ยังคง **enterprise**

### modern ในระบบนี้หมายถึง

- โปร่ง
- สะอาด
- มี hierarchy ชัด
- spacing เป็นระบบ
- typography อ่านง่าย
- ไม่รกด้วย decoration ที่ไม่จำเป็น
- interaction ดูร่วมสมัย

### enterprise ในระบบนี้หมายถึง

- อ่านข้อมูลเยอะได้ดี
- ใช้งานต่อเนื่องบน desktop/tablet ได้จริง
- มี pattern คงที่
- states ชัด
- เชื่อถือได้
- ไม่หวือหวาจนกลบข้อมูล
- เหมาะกับ list, forms, approvals, summaries, dashboards และ operations

## 2.2 Thai-First

ระบบนี้เป็น **Thai-first business application**

### หลักสำคัญ

- ข้อความหลักใน UI ใช้ภาษาไทย
- route/file/type naming ใช้ภาษาอังกฤษ
- wording ต้องสั้น ตรง และไม่คลุมเครือ
- หลีกเลี่ยงไทยปนอังกฤษโดยไม่จำเป็น
- ถ้ามีคำไทยที่ชัดกว่า ไม่ใช้ทับศัพท์โดยไม่จำเป็น

## 2.3 Viewport-First

ระบบนี้เป็น ERP ที่เน้น desktop/tablet  
ดังนั้น work pages ต้องพยายามให้ผู้ใช้ทำงานได้ใน viewport หลัก โดยไม่ต้อง scroll browser ยาว ๆ เป็น baseline

---

## 3. Design Foundation

## 3.1 UI Foundation

ระบบนี้ใช้ **MUI** เป็น UI foundation หลัก

## 3.2 Date Inputs

ใช้ **MUI X Date Pickers + Day.js**

## 3.3 Charts

ใช้ **Apache ECharts**

## 3.4 Toast Feedback

ใช้ **notistack**

## 3.5 Confirmation / Modal

ใช้ **MUI Dialog**

ไม่ใช้ `sweetalert` / `sweetalert2` เป็น popup มาตรฐานของระบบ

## 3.6 Side Panel

ใช้ **MUI Drawer**

## 3.7 Inline Status / Banner

ใช้ **MUI Alert**

### rule

งานใหม่ทั้งหมดต้องยึดมาตรฐานนี้  
ไม่เพิ่ม UI libraries เพิ่มโดยไม่มีเหตุผลเชิง architecture ชัดเจน

---

## 4. App Shell Standards

ระบบนี้ใช้ shell แบบ

```text
Sidebar + Main Content
```

และ **ไม่ใช้ global headbar ขนาดใหญ่เป็น baseline**

## 4.1 Sidebar มีหน้าที่

- area navigation หลัก
- notification entry ผ่าน bell icon
- user panel
- current access summary
- change context entry
- utility actions ระดับ shell

## 4.2 Main Content มีหน้าที่

- page toolbar
- page body
- page-level alerts
- section layouts
- work area
- toast feedback context

## 4.3 App Shell Goals

- ใช้พื้นที่แนวตั้งให้คุ้ม
- ลด chrome ที่ไม่จำเป็น
- ให้ content area ใหญ่พอสำหรับ table/form/review pages
- ทำให้ user เข้าใจได้เสมอว่าตอนนี้อยู่ area ไหน และบริบทการทำงานคืออะไร

---

## 5. Sidebar Standards

## 5.1 Sidebar ต้องเป็น Area-Level Navigation

sidebar ของระบบนี้ต้องเป็น **area-level navigation**  
ไม่ใช่ tree menu หลายชั้นลึก ๆ

### main navigation baseline

- แดชบอร์ด
- ฟาร์ม
- การผลิต
- คลัง
- จัดซื้อ
- โครงการ
- ขาย
- การเงิน
- วิเคราะห์
- อนุมัติ
- ผู้ดูแลระบบ

## 5.2 Sidebar Zones ที่แนะนำ

### Top Utility Zone

- sidebar toggle
- notification bell

### Main Navigation Zone

- area navigation หลัก

### Bottom User Zone

- user panel
- current access summary
- change context
- logout
- theme entry เมื่อเหมาะสม

## 5.3 Sidebar Behavior

- รองรับ collapsed / expanded
- active area ต้องชัด
- hover/focus states ต้องชัด
- unread badge ต้องเห็นได้ชัดแต่ไม่รบกวน navigation
- ไม่ควรมี nested dropdown ซ้อนกันหลายชั้นเป็น baseline

## 5.4 สิ่งที่ Sidebar ไม่ควรเป็น

- mega tree ของทุก route
- data-heavy panel
- dashboard replacement
- permission matrix view

---

## 6. Page Toolbar Standards

page toolbar เป็นส่วนหัวของแต่ละหน้า  
ไม่ใช่ global topbar

## 6.1 Page Toolbar ควรมี

- page title
- subtitle/description เมื่อจำเป็น
- primary actions
- secondary actions
- breadcrumb เมื่อจำเป็นจริง
- filter summary หรือ quick filter entry ตาม use case

## 6.2 Page Toolbar ต้อง

- บาง
- อ่านง่าย
- ไม่กินพื้นที่แนวตั้งเกินไป
- วาง action สำคัญให้หาเจอง่าย
- อยู่ในแนวทางเดียวกันทั้งระบบ

## 6.3 Page Toolbar ไม่ควร

- บรรจุปุ่มจำนวนมากเกินไป
- ยัด filter form ยาวเต็มแถวโดยไม่จำเป็น
- กลายเป็น full header ขนาดใหญ่แบบ landing page

---

## 7. Notification Standards

ระบบนี้แยก notification ออกเป็น 3 แบบอย่างชัดเจน

1. Notification Center
2. Toast Feedback
3. Inline Alerts / Banners

---

## 8. Notification Center Standards

notification center หลักของระบบอยู่ใน **sidebar** ผ่าน **bell icon**

## 8.1 Notification Center มีไว้สำหรับ

- approvals
- alerts
- failed sync notices
- integration warnings
- actionable notifications
- unread summaries

## 8.2 Notification Center ไม่ใช่

- toast
- inline alert
- giant notification page ที่แทนทุกอย่าง
- activity log เต็มรูปแบบ

## 8.3 UI Requirements

- ต้องมี bell icon
- ต้องมี unread badge
- ต้องเข้าถึงได้จากทุกหน้าใน main app
- เมื่อกดแล้วควรเปิด panel/drawer ที่ไม่ทำลายบริบทของหน้าปัจจุบัน

## 8.4 Notification Panel Behavior

- เปิดเป็น side panel/drawer ได้
- ต้องยังคง sidebar และ main content context ไว้
- ไม่ควรแทนที่ทั้งหน้าโดยไม่มีเหตุผล
- แต่สามารถมี dedicated route ของ notification ได้ในอนาคต ถ้าระบบโตมากขึ้น

---

## 9. Toast Feedback Standards

toast ใช้สำหรับ feedback ชั่วคราวหลัง action  
ใช้ **notistack**

## 9.1 Use Cases

- บันทึกสำเร็จ
- ลบสำเร็จ
- ส่งอนุมัติแล้ว
- ดำเนินการไม่สำเร็จ
- บันทึกแบบร่างแล้ว
- ลองส่งใหม่สำเร็จ

## 9.2 Placement

toast เป็น app-level runtime แต่ในเชิง UX ให้ถือว่าเป็น feedback ใน **main content area**

## 9.3 Rules

- ไม่ใช้ toast เป็น notification center
- ไม่ใช้ toast แทน confirmation dialog
- ไม่ใช้ toast สำหรับข้อมูล critical ที่ต้องอ่านยาว
- ไม่ stack เยอะเกินไปจนรบกวนการทำงาน

## 9.4 Recommended Behavior

- max stack จำกัด
- auto dismiss สำหรับ success/info
- error toast อาจอยู่ได้นานกว่าปกติเล็กน้อย
- wording ต้องสั้น

---

## 10. Inline Alert / Banner Standards

ใช้ **MUI Alert** สำหรับข้อมูลที่ต้องคงอยู่ในบริบทของหน้า/section

## 10.1 Use Cases

- offline warning
- stale data notice
- pending sync
- failed sync
- integration warning
- access limitation
- missing required context
- partial data warning

## 10.2 Placement

- อยู่ภายใน main content
- อาจอยู่ระดับ page หรือระดับ section
- ไม่ใช้แทน toast ถ้าสิ่งนั้นเป็นแค่ผลลัพธ์ชั่วคราวของ action
- ไม่ใช้แทน dialog ถ้าผู้ใช้ต้องตัดสินใจก่อนดำเนินการต่อ

---

## 11. Dialog Standards

ระบบนี้ใช้ **MUI Dialog** เป็นมาตรฐานของ modal/confirmation

## 11.1 Use Cases

- ยืนยันลบข้อมูล
- ยืนยันยกเลิก
- ยืนยันล้างแบบร่าง
- ออกจากหน้าที่มีข้อมูลยังไม่บันทึก
- ปิดงวด
- action ที่ย้อนกลับไม่ได้
- quick form ขนาดเล็ก
- quick review เล็ก

## 11.2 Dialog Placement

Dialog ต้องเป็น modal ที่ **overlay ทั้ง app viewport**  
รวมทั้ง sidebar และ main content

## 11.3 Dialog Rules

- sidebar ต้องไม่ interactive ระหว่าง dialog เปิด
- destructive action ต้องมี confirm dialog เป็น baseline
- title ต้องชัด
- description ต้องสั้น ตรง และบอกผลกระทบ
- primary action ของ destructive dialog ต้องเด่นชัดว่าเป็น action เสี่ยง
- อย่าใช้ dialog กับฟอร์มธุรกรรมใหญ่

## 11.4 Dialog ไม่ควรใช้กับ

- full transaction forms
- long multi-section workflows
- dashboard/report surfaces
- tables/detail pages ขนาดใหญ่

---

## 12. Drawer Standards

ระบบนี้ใช้ **MUI Drawer** เป็นมาตรฐานของ side panel

## 12.1 Use Cases

- filter panel
- quick detail
- side preview
- supporting panel
- notification panel
- side edit ที่ไม่ใช่ธุรกรรมใหญ่

## 12.2 Drawer Placement

drawer ของระบบนี้โดย baseline ให้สัมพันธ์กับ **main content context**  
ไม่ใช่กลืนทั้ง application เป็น modal แบบ dialog

## 12.3 Drawer Rules

- ใช้เมื่อ user ต้องดู context ของหน้าหลักไปพร้อมกัน
- ปิดง่าย
- มี title ชัด
- มีพื้นที่ภายในที่อ่านง่าย
- ถ้า content เยอะมากจนกลายเป็น workflow หลัก ให้เปลี่ยนเป็น full page แทน

---

## 13. Full Page Form Standards

ฟอร์มใหญ่หรือฟอร์มธุรกรรมหลักต้องใช้ **full page ใน main content**  
ไม่ใช้ dialog เป็น baseline

## 13.1 Use Cases

- สร้างใบขอซื้อ
- รับเข้า / โอนย้าย / เบิกใช้
- ปิดงวด
- review/approval ที่ข้อมูลเยอะ
- transactional forms หลาย section

## 13.2 Rules

- ต้องมี page toolbar ชัด
- ควรแบ่ง sections
- ควรมี action bar หาเจอง่าย
- ถ้ายาวมาก อาจมี sticky action bar
- ต้องยังรักษาหลัก viewport-first เท่าที่ทำได้

---

## 14. Card / Section / Panel Standards

ระบบนี้ใช้ card/panel/section เป็นหน่วยหลักของ page composition

## 14.1 Principles

- แต่ละ section ต้องมี purpose ชัด
- spacing ระหว่าง sections ต้องสม่ำเสมอ
- section title/subtitle ต้องชัด
- ห้ามใช้ panel ซ้อน panel ซ้อน panel โดยไม่มีเหตุผล
- ใช้ card เมื่อมันช่วยแบ่งเนื้อหา ไม่ใช่ใส่ทุกอย่างลง card จนรก

## 14.2 Recommended Uses

- dashboard widgets
- summary cards
- filter sections
- metadata sections
- detail sections
- chart containers
- approval history blocks

---

## 15. Table Standards

ตารางเป็นหนึ่งในองค์ประกอบที่สำคัญที่สุดของระบบนี้

## 15.1 Table Goals

- อ่านง่าย
- ใช้งานต่อเนื่องได้บน desktop/tablet
- อยู่ใน viewport หลักได้
- ทำงานร่วมกับ pagination/filter/sort ได้ดี
- แสดงข้อมูลจำนวนมากได้โดยไม่รก

## 15.2 Baseline Rules

- ต้องมี pagination
- ต้องมี page size options
- ต้องรองรับ internal scroll เมื่อเหมาะสม
- sticky header เป็น baseline ที่ควรมีเมื่อ table เป็น work area หลัก
- ต้องมี loading, empty, error states ชัด
- row density ต้องอ่านง่าย
- ต้องรองรับ light/dark theme

## 15.3 Page Size Options

baseline ของระบบคือ

- 10
- 25
- 50
- 100

### recommended defaults

- desktop default = 25
- tablet default = 10 หรือ 25

## 15.4 Scroll Behavior

- list/table หลักควรใช้ internal scroll ภายใน content/table container เมื่อเหมาะสม
- ไม่ควรปล่อยให้ browser scroll ยาวทั้งหน้าเป็น baseline ของ work pages
- sticky header ควรทำงานร่วมกับ internal scroll ได้

## 15.5 Table Toolbar

table sections ควรมีพื้นที่สำหรับ

- search
- filters
- bulk actions เมื่อมี
- export/download เมื่อเหมาะสม
- result summary แบบย่อ

## 15.6 Table Empty State

ต้องบอก user ว่า

- ยังไม่มีข้อมูล
- ไม่มีผลลัพธ์จาก filter
- หรือไม่มีสิทธิ์ดูข้อมูลชุดนี้

โดย wording ต้องแยกกันชัด

---

## 16. Form Standards

ฟอร์มในระบบนี้ต้องออกแบบเพื่อการใช้งานจริง ไม่ใช่แค่ render input ให้ครบ

## 16.1 Form Principles

- labels ชัด
- helper text สั้น
- validation ชัด
- spacing ระหว่าง fields สม่ำเสมอ
- sections ชัด
- primary action หาเจอง่าย
- destructive / reset / cancel actions ต้องแยกจาก primary ชัด

## 16.2 Field Arrangement

- ใช้ grid layout ที่อ่านง่าย
- fields ที่เกี่ยวข้องกันควรอยู่กลุ่มเดียวกัน
- ไม่ยัด fields มากเกินไปในแถวเดียว
- tablet ต้องยังอ่านง่าย

## 16.3 Date Inputs

ใช้ MUI X Date Pickers เป็นมาตรฐาน  
ไม่ใช้ text input ธรรมดาแทน date picker โดยไม่มีเหตุผล

## 16.4 Validation Messaging

- ระบุชัดว่าผิดอะไร
- ข้อความไม่ยาวเกินจำเป็น
- หลีกเลี่ยงภาษาทางเทคนิค
- ถ้ามี field-level error ให้แสดงใกล้ field

## 16.5 Unsaved Changes

หน้าฟอร์มที่มีความเสี่ยงต้องมี unsaved changes warning เมื่อ user จะออกจากหน้า/เปลี่ยน context

---

## 17. Chart Standards

ระบบนี้ใช้ **Apache ECharts** เป็นมาตรฐานของ charts

## 17.1 Chart ใช้เมื่อไร

ใช้เมื่อ chart ช่วยให้ user เห็น insight ได้ดีกว่า table/text เช่น

- trends
- comparisons
- breakdowns
- monitoring
- dashboard summaries
- reports / analytics

## 17.2 Chart ไม่ควรใช้เมื่อไร

- ใส่เพื่อความสวยงามเฉย ๆ
- ข้อมูลมีแค่ 1-2 ค่าและอ่านเป็นตัวเลขตรง ๆ ดีกว่า
- ทำให้หน้ารกหรือกินพื้นที่ viewport เกินจำเป็น
- user ต้องอ่านรายละเอียดระดับ record เป็นหลัก

## 17.3 Chart Requirements

- ต้องมี loading state
- ต้องมี empty / no-data state
- ต้องมี stale/integration context เมื่อเกี่ยวข้อง
- ต้องผูกกับ theme system
- ต้องรองรับ light/dark theme
- ถ้าข้อมูลควรอ่านแบบ table ได้ดีกว่า ต้องมี table/detail fallback

## 17.4 Chart Placement

- อยู่ใน dashboard cards, summary sections หรือ analytics sections ได้
- ต้องมี title/subtitle ที่ชัด
- ถ้า chart ใหญ่ ต้องมีพื้นที่พอและไม่ทำลาย viewport-first flow ของหน้า

---

## 18. Theme Standards

ระบบนี้ต้องรองรับทั้ง **Light Theme** และ **Dark Theme**

## 18.1 Theme Must Cover

- shell
- sidebar
- page toolbar
- cards/panels
- tables
- forms
- dialogs
- drawers
- alerts
- chips/status
- charts

## 18.2 Theme Rules

- ใช้ theme tokens เป็น baseline
- ห้าม hardcode สีใน business components แบบกระจัดกระจาย
- contrast ต้องอ่านได้จริง
- disabled, warning, error, info, success states ต้องชัดทั้งสองธีม
- elevation/border/background ต้องสมดุลและไม่หนักเกินไปใน dark theme

## 18.3 Dark Theme Rules

- ไม่ใช้ดำสนิททุกพื้นผิว
- ต้องคุม contrast ของ text และ data-dense components ให้ดี
- tables/forms ต้องยังอ่านง่าย
- charts ต้องไม่หลุดโทนหรือ contrast แย่

---

## 19. Spacing / Density Standards

## 19.1 Spacing

- spacing ต้องสม่ำเสมอทั้งระบบ
- sections ต้องมีระยะหายใจ
- ไม่ยัด content แน่นเกินไปจนอ่านยาก
- แต่ก็ไม่โล่งจนเสียพื้นที่ใน work pages

## 19.2 Density

ระบบนี้เป็น ERP จึงต้อง balance ระหว่าง

- readability
- information density

### rule

- dashboard และ form ใช้ density ปานกลาง
- tables ใช้ density ที่อ่านเร็วได้ แต่ไม่อึดอัด
- approvals / finance / warehouse pages ต้องเน้นใช้พื้นที่อย่างคุ้มค่า

---

## 20. Typography Standards

## 20.1 Principles

- hierarchy ต้องชัด
- title / section title / body / metadata ต้องแยกกันชัด
- ข้อความไทยต้องอ่านง่าย
- อย่าใช้ขนาดตัวอักษรหลากหลายเกินจำเป็น

## 20.2 Typical Hierarchy

- page title
- section title
- body text
- caption/meta text
- helper/error text

### rule

metadata และ secondary text ต้องไม่เด่นเกิน primary data

---

## 21. Wording Standards

## 21.1 Tone

- สุภาพ
- ตรง
- กระชับ
- ไม่ technical เกินจำเป็น
- ไม่กำกวม

## 21.2 Good Examples

- `บันทึกสำเร็จ`
- `บันทึกไม่สำเร็จ`
- `คุณไม่มีสิทธิ์เข้าถึงส่วนนี้`
- `กรุณาเลือกบริบทการทำงานก่อน`
- `กำลังโหลดข้อมูล...`
- `ไม่พบข้อมูล`
- `ไม่พบผลลัพธ์จากเงื่อนไขที่ค้นหา`

## 21.3 Avoid

- ข้อความยาวเกินไป
- ข้อความกำกวม เช่น `เกิดข้อผิดพลาด`
- ภาษาเชิงเทคนิคเกินไป เช่น stack/internal error terms
- wording ที่ไม่บอก user ว่าควรทำอะไรต่อ

---

## 22. UX States Standards

ระบบนี้ต้องมีมาตรฐานของ states ที่คงที่ทั้งระบบ

## 22.1 Loading

ใช้เมื่อ data/permission/session กำลังถูกตรวจหรือโหลด

### rule

- บอกว่ากำลังโหลดอะไร
- ถ้าเป็น section loading แสดงเฉพาะ section
- ถ้าเป็น page blocking state ใช้ loading state ระดับหน้า

## 22.2 Empty

แยกให้ชัดว่า

- ไม่มีข้อมูลเลย
- ไม่มีผลลัพธ์จาก filter
- ยังไม่มีรายการเพราะ user ยังไม่ได้สร้าง

## 22.3 Error

แยกให้ชัดว่า

- โหลดไม่สำเร็จ
- บันทึกไม่สำเร็จ
- integration failed
- retry ได้หรือไม่ได้

## 22.4 Access Denied

ต้องสื่อว่า

- ผู้ใช้ไม่มีสิทธิ์
- หรือบริบทการทำงานปัจจุบันไม่อนุญาต
- ไม่ใช่แค่ไม่โชว์ component เงียบ ๆ อย่างเดียวทุกกรณี

## 22.5 Offline / Sync / Stale / Integration

ต้องมี patterns ชัดสำหรับ

- offline
- pending sync
- syncing
- failed sync
- conflict
- stale data
- integration warning

### placement

- page/section ใช้ inline alerts/banners
- notification center ใช้สำหรับ actionable notices
- toast ใช้สำหรับ feedback หลัง action

---

## 23. Access-Related UI Standards

## 23.1 Access Summary

user ต้องเห็น current role/current scope/current context ได้จาก shell

## 23.2 Access Denied

ต้องมี dedicated state ที่ชัด ไม่ใช่หน้าว่าง

## 23.3 Missing Context

ถ้าหน้าต้องใช้ current access/current context แต่ยังไม่มี ต้องบอกชัดและพาไป action ที่ถูก เช่น กลับ `/access`

## 23.4 Action Guard UX

- ถ้า action ไม่ควรรับรู้เลย -> ซ่อน
- ถ้า action ควรเห็นแต่ทำไม่ได้ -> disable + optional hint
- ใช้หลักนี้อย่างสม่ำเสมอทั้งระบบ

---

## 24. Destructive Action Standards

action ที่มีผลร้ายหรือย้อนกลับไม่ได้ต้องมี pattern คงที่

## 24.1 Use Cases

- ลบข้อมูล
- ยกเลิกรายการ
- ปิดงวด
- ล้างแบบร่าง
- ออกจากหน้าที่มีข้อมูลยังไม่บันทึก
- retry integration ที่มีผลทางธุรกิจสำคัญ

## 24.2 Rules

- ใช้ MUI Dialog
- ต้องมี title ชัด
- บอกผลกระทบชัด
- ปุ่ม destructive ต้องแยก visual tone จาก cancel
- ห้ามใช้ toast แทน confirm
- ห้ามใช้ inline alert แทน confirm

---

## 25. Viewport-First Work Page Standards

นี่คือหนึ่งในมาตรฐานสำคัญที่สุดของระบบนี้

## 25.1 Work Pages ที่เข้าข่าย

- dashboard
- warehouse
- purchase
- finance
- approval inbox/detail
- admin data pages
- report/review pages
- data-heavy maintenance pages

## 25.2 Baseline Rules

- shell ต้องกินพื้นที่แนวตั้งให้น้อย
- page toolbar ต้องบาง
- summary/filter/actions ต้องไม่ทำให้ main work area หายไปหมด
- table/detail/work section ต้องเป็น owner ของพื้นที่หลัก
- ใช้ internal scroll ภายใน content/table area เมื่อเหมาะสม
- browser scroll ทั้งหน้าที่ยาวมากไม่ใช่ baseline

## 25.3 Why

เพราะ user ต้องทำงานต่อเนื่องกับข้อมูลจำนวนมาก  
ถ้าปล่อยให้ toolbar, filters, actions และ headers หลุดหายตลอด จะเสีย productivity มาก

---

## 26. Dashboard Standards

dashboard เป็น personalized landing page  
ไม่ใช่ mega-report และไม่ใช่ทุกอย่างของทั้งระบบรวมกัน

## 26.1 Dashboard ควรมี

- task summaries
- alerts / attention-required summaries
- important metrics
- chart-based overviews ที่จำเป็นจริง
- quick drilldown paths

## 26.2 Dashboard ไม่ควรมี

- detailed table ใหญ่หลายชุดเต็มหน้า
- analytics เต็มรูปแบบ
- duplicate navigation
- giant card grid ที่ไม่มี hierarchy

## 26.3 Layout

- ใช้ cards/sections ที่ชัด
- เน้น summary มากกว่ารายละเอียดลึก
- ต้องยังคง viewport-first

---

## 27. Forms vs Dialog vs Drawer Decision Rules

เพื่อให้ตัดสินใจคงที่ทั้งระบบ ให้ใช้หลักนี้

## 27.1 ใช้ Dialog เมื่อ

- confirmation
- destructive action
- unsaved changes
- quick form เล็ก
- quick review เล็ก

## 27.2 ใช้ Drawer เมื่อ

- filter panel
- side detail
- quick support flow
- notification panel
- context-preserving side workflow

## 27.3 ใช้ Full Page เมื่อ

- ฟอร์มใหญ่
- ธุรกรรมหลัก
- หลาย sections
- ต้องดูข้อมูลรอบด้านเยอะ
- ต้องทำงานต่อเนื่องจริงจัง

---

## 28. Recommended UI States by Concern

| Concern                           | Recommended Pattern                     |
| --------------------------------- | --------------------------------------- |
| Save success                      | Toast                                   |
| Save failed                       | Toast หรือ inline error ตามระดับผลกระทบ |
| Delete confirmation               | Dialog                                  |
| Unsaved changes                   | Dialog                                  |
| Offline warning                   | Inline Alert                            |
| Pending sync                      | Inline Alert / banner                   |
| Failed sync notice ที่ actionable | Notification Center + inline state      |
| Notification summaries            | Sidebar bell + panel                    |
| Access denied page                | AccessDeniedState                       |
| No data                           | EmptyState                              |
| Table no results                  | Empty table state                       |
| Large filters                     | Drawer หรือ filter section              |
| Quick detail                      | Drawer                                  |
| Transaction form                  | Full page                               |

---

## 29. Anti-Patterns ที่ห้ามทำ

- ใช้ popup library หลายตัวปนกัน
- ใช้ toast แทน notification center
- ใช้ toast แทน confirm dialog
- ใช้ dialog กับฟอร์มธุรกรรมใหญ่
- ปล่อย work pages ให้ browser scroll ยาวทั้งหน้าโดยไม่มีเหตุผล
- table บางหน้ามี pagination บางหน้าไม่มีโดยไม่มีหลัก
- chart ทุกหน้าคนละ style
- dark theme อ่านยากเพราะ hardcode สี
- wording ไทยปนอังกฤษมั่ว ๆ
- shell หนาเกินไปจนกินพื้นที่ทำงาน
- sidebar เป็น tree menu ลึกหลายชั้นจนใช้ยาก
- ไม่มี access/offline/sync/integration states ที่ชัดเจน
- ใช้สไตล์ visual หลากหลายจนแต่ละหน้าเหมือนคนละระบบ

---

## 30. ความสัมพันธ์กับไฟล์อื่นใน Docs ชุดนี้

ไฟล์นี้วาง **มาตรฐาน UX/UI ของทั้งระบบ**

### `02_frontend_architecture.md`

กำหนด shell structure และ layout ownership

### `03_frontend_infrastructure.md`

กำหนด runtime ของ theme, notification, offline และ date foundation

### `04_frontend_auth-access.md`

กำหนด access states และ guard behaviors

### `09_frontend_component-guidelines.md`

กำหนด ownership ของ page/section/dialog/table/chart components

### `13_frontend_requirements.md`

กำหนด requirement ระดับ product ที่ UI ต้องรองรับ

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 31. Summary

สรุปสาระสำคัญที่สุดของ `12_frontend_ui-design-standards.md` คือ

- ระบบนี้ต้องมี visual direction แบบ **modern + enterprise**
- ใช้ **MUI** เป็น UI foundation
- ใช้ **MUI Dialog** สำหรับ confirmations/modals
- ใช้ **MUI Drawer** สำหรับ side panels
- ใช้ **notistack** สำหรับ toast feedback
- ใช้ **MUI Alert** สำหรับ inline alerts/banners
- ใช้ **Apache ECharts** เป็น chart standard
- shell ของระบบคือ **sidebar + main content**
- notification center หลักอยู่ที่ **bell icon ใน sidebar**
- toast เป็น feedback ใน **main content context**
- destructive actions ต้องมี confirmation dialog
- tables ต้องมี pagination, page size options, sticky header และ internal scroll patterns ที่ชัด
- forms ใหญ่ต้องใช้ full page และแบ่ง sections
- work pages ต้องยึดหลัก **viewport-first**
- light/dark theme ต้องครอบคลุมทั้งระบบและอ่านได้ดีจริง
- wording ต้องเป็น **Thai-first**, สั้น, ตรง และสม่ำเสมอ
- loading, empty, error, access, offline, sync และ integration states ต้องมีมาตรฐานที่คงที่ทั้งระบบ
