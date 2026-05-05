# 01_frontend_overview.md

# Frontend Overview

ไฟล์นี้เป็น baseline ภาพรวมของ Frontend สำหรับ **JBF FarmHUB** และใช้เป็นจุดตั้งต้นก่อนอ่านไฟล์เชิงลึกทั้งหมดในชุด `frontend/docs/frontend/`

ขอบเขตของไฟล์นี้คือกำหนดคำตอบระดับระบบให้ชัดเจน เช่น

- ระบบนี้ใช้ stack อะไรและออกแบบโครงแบบไหน
- scope ของ product areas และ module หลักมีอะไร
- route, module, auth/access, shell, data flow, theme, notification และ UX/UI standard ควรไปในทิศทางใด
- เรื่องใดเป็น baseline ที่ทุกทีมต้องยึด และเรื่องใดต้องไปอ่านต่อในไฟล์เชิงลึก

ไฟล์นี้ไม่ลงดีเทล implementation รายจุด แต่ต้องชัดพอให้ทุกคนตีความตรงกันก่อนเริ่มออกแบบหรือเขียนโค้ด

architecture ชุดนี้ถูกออกแบบเพื่อแก้ pain ที่เกิดซ้ำจากระบบ backend/integration โดยตรง

- schema mismatch ระหว่าง API payload กับ UI ที่ต้องใช้จริง
- data fragmentation จากการประกอบหลาย API ในหน้าเดียว
- permission/scope complexity ที่ทำให้ guard ผิดบริบท
- workflow complexity, sync/offline states และ integration-aware UX

รายละเอียดเหตุผลและปัญหาแบบเต็มให้อ่านในหัวข้อ `4. The Why — ทำไมต้องใช้ Architecture นี้`

---

## 1. เอกสารนี้มีไว้เพื่ออะไร

ใช้ไฟล์นี้เพื่อยืนยัน baseline กลางก่อนเริ่มงาน โดยเฉพาะหัวข้อที่ทำให้ทีม implement ผิดซ้ำบ่อย

- business scope ที่ frontend ต้องรองรับ
- ความสัมพันธ์ของ route, module และ ownership
- auth/access baseline หลัง login และตอนเปลี่ยนบริบท
- shell baseline (`sidebar + main content`) และ notification model
- data/runtime baseline (cache, persistence, offline direction, PWA direction, integration readiness)
- design baseline (Thai-first, viewport-first, light/dark theme, dialog/drawer/toast/alert/chart standards)
- docs map ว่าแต่ละเรื่องต้องไปลงลึกที่ไฟล์ใด

สรุปคือไฟล์นี้เป็น entry point ของเอกสาร frontend ทั้งชุด และใช้เป็น baseline ตรวจความสอดคล้องก่อนเริ่มหรือรีวิวงาน

### อ่านต่อ

- route, module, project structure, folder responsibilities และ file responsibilities -> `02_frontend_architecture.md`
- infrastructure, session, middleware, HTTP, cache, persistence, offline, PWA, theme, chart/dialog/notification foundations และ SAP integration direction -> `03_frontend_infrastructure.md`
- auth, access, role, permission, scope, effective access และ permission check flow -> `04_frontend_auth-access.md`
- UX/UI standard, visual language, light/dark theme, popup/dialog/notification standards, viewport-first work pages และภาษาไทยในระบบ -> `12_frontend_ui-design-standards.md`
- product baseline และ requirement ที่เกี่ยวข้อง -> `13_frontend_requirements.md`
- Q/A workbook สำหรับให้ผู้ดูแลโปรเจกต์ตอบแล้วส่งให้ AI แก้ docs -> `14_frontend_requirements-questions.md`

---

## 2. Source of Truth ของ Frontend ชุดนี้

สำหรับ frontend docs ชุดนี้ ให้ยึด baseline ต่อไปนี้เป็น source of truth

- Frontend ใช้ **Next.js (App Router)** + **TypeScript**
- UI library หลักคือ **MUI**
- Date picker standard ใช้ **MUI X Date Pickers + Day.js**
- Chart standard ของระบบคือ **Apache ECharts**
- Modal / confirmation standard ใช้ **MUI Dialog**
- Side panel / filter / quick detail standard ใช้ **MUI Drawer**
- Toast / feedback standard ใช้ **notistack**
- Inline status / alert standard ใช้ **MUI Alert**
- Notification center หลักของระบบอยู่ใน **sidebar** ผ่าน **bell icon**
- Server State ใช้ **TanStack Query**
- Form ใช้ **React Hook Form + Zod**
- HTTP client กลางใช้ **Axios**
- Backend integration baseline ของ Frontend คือ **API/BFF contract ปัจจุบัน** (backend implementation language ไม่ใช่ frontend concern)
- ระบบต้องรองรับ **SAP integration**
- ระบบต้องถูกออกแบบให้รองรับ **offline-capable workflows**
- ระบบต้องมี **cache strategy** และ **browser persistence strategy** ที่ชัดเจน
- Auth flow ของ Frontend ต้องผ่าน **BFF boundary**
- ระบบนี้ใช้ **ภาษาไทยเป็นหลัก** ใน UI ปัจจุบัน
- ระบบต้องรองรับทั้ง **Light Theme** และ **Dark Theme**
- การออกแบบต้องเน้น **modern + enterprise visual direction**
- การออกแบบ route, folder และ module ให้ใช้ **ชื่อสั้น ชัด และสม่ำเสมอ**
- คำที่ยาวเกินจำเป็นให้ย่อเป็นคำกลางของ domain เช่น `master-data` ให้ใช้ `master`
- สิ่งที่ user เห็นในเมนู, route ที่ใช้จริง, และ module owner ของ business logic เป็นคนละชั้นกัน
- Dashboard เป็น **personalized landing page ตาม effective access และ current context**
- ถ้า user มีหลาย access assignments หลัง login ระบบต้องให้เลือก access ก่อนเข้า app หลัก
- การเช็คสิทธิ์ต้องถูกออกแบบเป็นหลายชั้น ไม่ใช่ใช้การซ่อนเมนูอย่างเดียว
- `src/contexts/` ใช้สำหรับ **shared app-level contexts and providers**
- `src/features/<module>/contexts/` เป็น **optional** และใช้เฉพาะเมื่อจำเป็นจริง
- Provider หลักของระบบ เช่น `AuthProvider`, `AccessProvider`, `ShellProvider`, `ThemeProvider` ให้อยู่ใน `src/contexts/`
- ไฟล์ context ต้องใช้รูปแบบ `XxxContext.tsx` และ export เป็น `XxxProvider`
- `src/core/theme/` ใช้เก็บ theme assets, tokens, palette, typography, component overrides และ theme builders ไม่ใช่ที่เก็บ provider
- Route และ menu สามารถเปลี่ยนได้ในอนาคต แต่ module boundary ควรนิ่งกว่า route และ menu
- Offline support, cache strategy, persistence strategy, data source strategy, chart/dialog/notification standards, viewport-first work page standards, PWA direction, theme strategy และ SAP support เป็น **architectural requirements** ไม่ใช่ของแถมหรือค่อยคิดทีหลัง

### ความหมายของ Offline Support ในเอกสารชุดนี้

คำว่า offline ในเอกสารชุดนี้ไม่ได้หมายความว่าทุกหน้าทุกฟีเจอร์ต้องทำงานได้สมบูรณ์โดยไม่ใช้อินเทอร์เน็ต  
แต่หมายความว่า frontend ต้องถูกออกแบบให้รองรับอย่างน้อยเรื่องต่อไปนี้ได้ในระดับ architecture

- มี offline-aware UX
- มีการแยกข้อมูลที่อ่านได้แบบ cache ออกจากข้อมูลที่ต้อง sync
- มีแนวทางสำหรับ local draft, local queue และ sync-back เมื่อกลับมาออนไลน์
- รู้ว่าฟังก์ชันใดเป็น online-only และฟังก์ชันใดควรรองรับการทำงานต่อเนื่องเมื่อสัญญาณไม่เสถียร
- ไม่ออกแบบ flow ที่พังทันทีเมื่อ connection หายชั่วคราว
- มีพื้นที่ใน UI สำหรับแสดงสถานะ online, offline, syncing, failed และ conflict

### ความหมายของ Cache และ Persistence Strategy ในเอกสารชุดนี้

ระบบนี้ต้องแยกประเภทของข้อมูลให้ชัดเจนว่าอะไรควรเก็บไว้ที่ไหน

- **React Query Cache** ใช้กับ server data ที่ต้องการลดเวลา reload และ refetch
- **localStorage** ใช้กับ UI preference ที่ไม่ sensitive เช่น sidebar state, selected tab, table density หรือ filter preset บางอย่าง
- **sessionStorage** ใช้กับ state ชั่วคราวของ browser session นั้น
- **IndexedDB หรือ persistence layer ที่เหมาะสม** ใช้กับ local draft, pending queue และ offline-capable data ที่มีขนาดหรือความซับซ้อนมากกว่า
- **server session / BFF** ใช้กับ canonical state ที่เกี่ยวกับ auth และ current access

ระบบนี้ **ไม่ใช้ localStorage เป็น canonical source of truth** ของ auth, permission หรือ current access

### ความหมายของ Data Source Strategy ในเอกสารชุดนี้

ระบบนี้ใช้ **API เป็น runtime data source หลัก** โดยมี baseline ดังนี้

- service เป็น owner ของ data orchestration และเรียก API ตรง
- hook, page และ component ไม่เลือก source เอง
- ถ้าต้องมี mock/demo ให้ใช้เฉพาะ storybook, test harness หรือ isolated reference data
- runtime feature flow ไม่ใช้ module-level repository switching อีกต่อไป
- docs เกี่ยวกับ repository/mock switching ให้ถือเป็น reference เชิงประวัติศาสตร์

### ความหมายของ Theme Strategy ในเอกสารชุดนี้

ระบบนี้ต้องรองรับ **Light Theme** และ **Dark Theme** ในระดับ design system และ implementation foundation

- shared components ต้อง render ได้ถูกต้องทั้งสองธีม
- shell, sidebar, page toolbar, forms, cards, tables, dialogs และ states ต้องใช้ theme tokens
- ห้าม hardcode สีลงใน business components แบบกระจัดกระจาย
- สี, spacing, elevation, border, contrast และ state colors ต้องถูกกำหนดจาก theme system
- การสลับธีมต้องไม่ทำให้ hierarchy, readability หรือ interaction clarity พัง
- runtime state ของ theme mode ให้อยู่ใน `ThemeContext`
- theme definitions ให้อยู่ใน `src/core/theme/`

### ความหมายของ Chart Standard ในเอกสารชุดนี้

ระบบนี้ใช้ **Apache ECharts** เป็น chart standard หลัก

- ใช้กับ dashboard, reports, analytics, trend, comparison และ monitoring visuals
- ต้องผูกกับ MUI theme และ theme tokens ของระบบ
- ต้องมี loading, empty, no-data และ stale state ที่คงที่
- ต้องไม่ปล่อยให้แต่ละหน้าเขียน chart options กระจัดกระจายจน UX แตก
- ถ้าข้อมูลอ่านเชิงตัวเลขหรือเปรียบเทียบเชิงตารางได้ดีกว่า chart ต้องมี table/detail fallback ที่เหมาะสม
- หน้าที่มี chart ยังต้องคงหลัก **viewport-first** และไม่ทำให้ทั้ง browser page ยาวโดยไม่จำเป็น

### ความหมายของ Dialog / Drawer / Notification Standard ในเอกสารชุดนี้

ระบบนี้ใช้มาตรฐานดังนี้

- **MUI Dialog** สำหรับ confirmation, destructive confirmation, unsaved changes warning และ quick form/detail ขนาดเล็ก
- **MUI Drawer** สำหรับ side detail, filter panels, notification panels และ supporting side workflows
- **notistack** สำหรับ app-level toast feedback ภายในพื้นที่ main content
- **MUI Alert** สำหรับ inline alerts, banners และ status messages ภายในหน้า
- **Notification center หลักของระบบ** อยู่ใน sidebar ผ่าน bell icon และทำหน้าที่เป็น entry หลักของการแจ้งเตือน

กติกาสำคัญคือ

- งานใหม่ต้องใช้มาตรฐานนี้เท่านั้น
- ห้ามเพิ่ม popup library เพิ่มอีกโดยไม่มีเหตุผลเชิง architecture ชัดเจน
- confirmation ของการลบ, ยกเลิก, ล้าง draft, ปิดงวด และ action ที่ย้อนกลับไม่ได้ ต้องมี dialog ยืนยันเป็น baseline
- notification center, toast และ inline alerts เป็นคนละ pattern และห้ามใช้แทนกัน

### ความหมายของ Viewport-First Work Pages ในเอกสารชุดนี้

ระบบนี้เป็น ERP ที่เน้น desktop และ tablet  
ดังนั้นหน้าใช้งานหลักต้องถูกออกแบบแบบ **viewport-first**

- shell ต้องกินพื้นที่แนวตั้งให้น้อยที่สุด
- page toolbar ต้องบาง
- content area ต้องพยายามใช้พื้นที่ที่เหลือให้คุ้ม
- work pages เช่น dashboard, list pages, approval pages, review pages, warehouse, purchase, finance และ admin data screens ควรพยายามให้ผู้ใช้ทำงานได้ภายใน viewport หลัก
- สำหรับ work pages ให้ใช้ **internal scroll ภายใน content area หรือ table area** เป็น baseline มากกว่า browser scroll ทั้งหน้าที่ยาว
- tables ควรรองรับ sticky header, pagination และ page size options ที่ชัด
- form ยาวควรแบ่ง sections และอาจมี sticky action bar เมื่อเหมาะสม

### ความหมายของ PWA Direction ในเอกสารชุดนี้

ระบบนี้ต้องถูกออกแบบให้ **พร้อมต่อยอดไปสู่ PWA** ในอนาคต แม้ยังไม่จำเป็นต้องเปิดใช้ service worker เต็มรูปแบบตั้งแต่วันแรก

- Frontend ควรพร้อมสำหรับ web app manifest
- Frontend ควรพร้อมสำหรับ installable shell ในอนาคต
- Offline direction, local persistence, queue และ sync strategy ต้องคิดเผื่อ PWA capability
- แต่การลงลึกเรื่อง service worker, precache, runtime caching และ background sync สามารถแบ่งเป็น phase ถัดไปได้

### ความหมายของ SAP Integration ในเอกสารชุดนี้

คำว่า SAP support ในเอกสารชุดนี้ไม่ได้หมายความว่า frontend จะคุย SAP ตรงทุกจุด  
แต่หมายความว่า architecture ต้องรองรับอย่างน้อยเรื่องต่อไปนี้ได้

- แยก local business flow ออกจาก integration flow
- มี integration status, sync state และ retry state ที่ UI เข้าใจได้
- มีพื้นที่ในระบบสำหรับแสดงสถานะการส่งข้อมูลไป SAP
- ไม่ทำให้ UI ผูกกับ SAP schema โดยตรง
- พร้อมรองรับ flow ที่ข้อมูลในระบบต้องถูกส่งต่อหรือ reconcile กับ SAP
- มี auditability และ traceability พอสำหรับงานที่เกี่ยวข้องกับการ sync

### ความหมายของ Permission Check Flow ในเอกสารชุดนี้

การตรวจสิทธิ์ใน frontend ต้องถูกมองเป็นหลายชั้น ไม่ใช่มีแค่ “ดูเมนูได้หรือไม่”

- **Menu Guard** = ควรเห็นเมนูหรือไม่
- **Page Guard** = route นี้เข้าได้หรือไม่
- **Section Guard** = block หรือ panel ย่อยบางส่วนควรแสดงหรือไม่
- **Action Guard** = ปุ่ม, form action, mutation action ทำได้หรือไม่
- **Data Guard** = ข้อมูลบางก้อนควรถูกดึงหรือแสดงหรือไม่ตาม current access
- **Access Context** = สิทธิ์ทั้งหมดต้องอ้างอิงจาก current access/current context ไม่ใช่ merge permissions ทุก assignment เข้าด้วยกันแบบไร้บริบท

### ความหมายของ Context / Provider Convention ในเอกสารชุดนี้

ระบบนี้ต้องใช้ naming และ placement ที่คงที่สำหรับ runtime providers

- shared app-level providers ทุกตัวให้อยู่ใน `src/contexts/`
- ไฟล์ context ใช้ชื่อ `XxxContext.tsx`
- ภายในไฟล์ต้องสามารถ export อย่างน้อย
  - `XxxContext`
  - `XxxProvider`
  - `useXxx` หรือ hook ที่เทียบเท่า
- `ThemeProvider` ต้องถูก export จาก `ThemeContext.tsx`
- `src/core/theme/` ไม่ควรมี provider แต่มีหน้าที่เก็บ theme assets และ theme builders
- module-level context สามารถมีได้ แต่เป็น **optional** และส่วนใหญ่ไม่ควรต้องใช้
- ถ้า context ใช้เฉพาะภายใน module เดียวและช่วยลด prop drilling หรือจัด state ของ flow ย่อยจริง ๆ ให้สามารถวางใน `src/features/<module>/contexts/` ได้
- ห้ามเอา `Auth`, `Access`, `Shell`, `Theme` ไปซ้ำใน module contexts

### อ่านต่อ

- project structure, app structure และ technical boundaries -> `02_frontend_architecture.md`
- HTTP, session, middleware, cache, persistence, offline, data source, chart/dialog/notification foundations, theme foundation, sync, PWA และ SAP integration -> `03_frontend_infrastructure.md`
- auth/access, permission model และ permission check flow -> `04_frontend_auth-access.md`
- backend/frontend concept mapping -> `11_frontend_backend-frontend-mapping.md`
- requirement ที่เกี่ยวกับ offline, cache, theme, access, chart/dialog/notification standards, PWA และ SAP -> `13_frontend_requirements.md`

---

## 3. ภาพรวมของระบบที่ Frontend ต้องรองรับ

FarmHUB ไม่ใช่ระบบ CRUD หน้าแยกแบบหลวม ๆ แต่เป็นระบบ ERP ที่มี workflow ข้าม domain จริง และต้องรองรับการทำงานของหลายบทบาทใน platform เดียว

ในมุม business frontend ชุดนี้ต้องรองรับอย่างน้อย

- งานปฏิบัติการฟาร์ม
- งานสุขภาพและวัคซีน
- งานเปิดรอบการผลิต
- งานคลังและ movement ของวัตถุดิบ
- งานขอซื้อ
- งานซ่อม / งานก่อสร้าง / งานโครงการ
- งานขาย
- งานการเงิน
- งานรายงานและการวิเคราะห์
- งานอนุมัติ
- งานจัดการผู้ใช้และสิทธิ์
- งานข้อมูลหลัก
- งานเอกสาร
- งานตั้งค่าระบบ
- งานแสดงสถานะ offline / online / sync state
- งานแสดงสถานะ SAP integration และผลการส่งข้อมูล
- งานแสดง data freshness, cache-aware states และ persistence-aware recovery เมื่อเกี่ยวข้อง
- งานแสดง chart-based insights ที่สัมพันธ์กับ dashboard, reports และ analytics
- งานยืนยันการกระทำสำคัญ เช่น ลบข้อมูล, ยกเลิก, ล้าง draft, ปิดงวด และออกจากหน้าที่มีข้อมูลยังไม่บันทึก
- งานแสดงและติดตามการแจ้งเตือนผ่าน notification center ใน shell

ในมุม foundation ระบบยังมี concern กลางที่ทุกโมดูลต้องอาศัยร่วมกัน

- Authentication / Session
- Access Control
- Role / Permission / Scope
- Facility Structure
- Approval Workflow
- Audit Log
- Notification Center
- Shared Design System
- Shared Layout
- Shared Access Context
- Cache Strategy
- Local Draft / Queue / Persistence Strategy
- Data Source Strategy
- Integration Status / SAP Sync Awareness
- Theme System
- Permission Guard System
- Context / Provider System
- Chart Standard
- Dialog / Drawer / Notification Standard
- Viewport-First Work Page Standard
- PWA Direction

ผลที่ตามมาคือ Frontend จะถูกออกแบบเป็น “หน้าจอ” อย่างเดียวไม่ได้ แต่ต้องถูกออกแบบเป็น **ระบบที่มี responsibility ชัดเจน** เพื่อรองรับทั้ง business complexity และการเติบโตของ codebase

### อ่านต่อ

- product areas และ current baseline -> `13_frontend_requirements.md`
- project structure และ module ownership -> `02_frontend_architecture.md`

---

## 4. The Why — ทำไมต้องใช้ Architecture นี้

ปัญหาคลาสสิกของ Frontend ที่เชื่อมกับระบบธุรกิจขนาดใหญ่เกิดซ้ำเสมอ และเป็นสาเหตุหลักที่ทำให้ codebase เสียรูปเมื่อระบบโตขึ้น

### 4.1 Schema Mismatch

Backend โดยเฉพาะระบบที่เชื่อม legacy data, integration หรือ business APIs มักส่งข้อมูลมาใน shape ที่ไม่เหมาะกับ UI โดยตรง  
ถ้า UI ใช้ response ตรง ๆ component จะเต็มไปด้วยการ rename field, parse ค่า, fallback ค่า และ business interpretation กระจัดกระจาย

### 4.2 Data Fragmentation

หน้าจอจริงมักต้องใช้ข้อมูลจากหลาย API พร้อมกัน  
ถ้า page หรือ component รวมข้อมูลเอง ระบบจะเริ่มผูกกันแบบควบคุมยาก และ UI จะกลายเป็น orchestration layer โดยไม่ตั้งใจ

### 4.3 Fragility

ถ้า component ใช้ DTO หรือ response shape ตรง ๆ เมื่อ Backend เปลี่ยน field, enum, nesting หรือ permission code จะกระทบหลายจุดพร้อมกัน

### 4.4 State Management Chaos

การใช้ `useEffect + useState` เป็น baseline ของ data fetching ในระบบขนาดใหญ่ จะทำให้ loading, cache, retry, refetch, error และ race conditions กระจายทั่วหน้าและควบคุมยาก

### 4.5 Workflow Complexity

FarmHUB มี flow จริงที่ไหลข้ามหลาย domain เช่น

- บันทึกข้อมูลหน้างาน -> สรุปฟาร์ม -> วิเคราะห์
- ขอซื้อ -> อนุมัติ -> รับเข้า -> เบิกใช้
- การรักษา -> วัคซีน -> สรุปสุขภาพ
- งานซ่อม/โครงการ -> อนุมัติ -> ใบสั่งงาน -> ปิดงาน
- ขาย -> ส่งมอบ -> ชั่งน้ำหนัก -> ใบแจ้งหนี้
- ต้นทุน -> ปิดงวด -> กำไรขาดทุน
- บันทึกข้อมูล -> เก็บ local draft -> sync เมื่อกลับมาออนไลน์
- ทำธุรกรรมในระบบ -> ส่งต่อ / sync สถานะไป SAP
- ดู dashboard/report -> อ่าน trend/comparison ผ่าน chart -> drill ลง detail/table เมื่อจำเป็น
- ลบข้อมูล / เปลี่ยนสถานะสำคัญ / ออกจากหน้าฟอร์ม -> ต้องมี confirmation flow ที่คงที่ทั้งระบบ
- รับการแจ้งเตือนจากระบบ -> ดูต่อใน notification center -> เข้าไปทำ action ต่อในหน้าที่เกี่ยวข้อง

ดังนั้นระบบต้องการ architecture ที่รองรับ orchestration ระดับ use case ไม่ใช่เพียง data fetching ที่ “พอใช้ได้”

### 4.6 Security และ Session Complexity

ถ้า browser ถือ token โดยตรง, auth flow ไม่ผ่าน BFF, หรือไม่มี rule ชัดสำหรับ session restore และ current access ระบบจะเปราะทั้งด้าน security และ maintainability

### 4.7 Performance Regressions

ถ้าไม่กำหนดกติกาเรื่อง route boundary, client/server boundary, loading strategy, cache strategy, data source strategy, theme system, chart/dialog standards, viewport-first layout และ state ownership ตั้งแต่ต้น ระบบจะช้าลงเรื่อย ๆ โดยไม่รู้ตัว

### 4.8 Offline, Cache, Persistence, PWA และ Integration Complexity

ถ้าไม่ได้คิดเรื่อง offline, cache, persistence, PWA direction และ SAP integration ตั้งแต่ระดับ architecture ตั้งแต่ต้น ระบบจะเจอปัญหาเช่น

- หน้า UI ไม่รู้ว่าข้อมูลไหนเป็น query cache, local draft หรือ server truth
- ผู้ใช้ไม่รู้ว่าสิ่งที่บันทึกไป sync แล้วหรือยัง
- ระบบไม่มีพื้นที่แสดง sync state, retry state, conflict state
- SAP integration ถูกดึงมาอยู่ใน UI โดยตรงจน coupling สูง
- ใช้ localStorage แบบกระจัดกระจายและไม่รู้ว่าอะไรเป็น canonical state
- เมื่อล่มหรือ offline แล้ว user ไม่รู้ว่าระบบอยู่สถานะใด
- component แต่ละตัวตีความ cache/persistence ของตัวเองจน system behavior ไม่คงที่
- โครงของระบบไม่พร้อมต่อยอดไปสู่ installable/offline-capable app ในอนาคต

### 4.9 Theme และ Visual Consistency Complexity

ถ้าไม่ได้คิดเรื่อง Light/Dark theme, chart style consistency, dialog behavior และ modern/enterprise direction ตั้งแต่ต้น ระบบจะเจอปัญหาเช่น

- สีถูก hardcode กระจัดกระจาย
- business components render ไม่ครบทุกธีม
- contrast และ readability พังในบางหน้า
- shell กับ page content ดูไม่เป็นระบบเดียวกัน
- visual hierarchy ไม่สม่ำเสมอ
- chart แต่ละหน้าใช้คนละ style
- popup แต่ละหน้าใช้คนละ pattern
- destructive action บางจุดมี confirm บางจุดไม่มี

### 4.10 Permission Check Complexity

ถ้าไม่ได้คิดเรื่อง permission check flow ตั้งแต่ต้น ระบบจะเจอปัญหาเช่น

- menu ซ่อนแล้วแต่ route ยังเข้าได้
- page เข้าได้แต่ action ไม่ควรกดได้
- component ย่อยแต่ละตัวเช็คสิทธิ์กันคนละแบบ
- current access เปลี่ยนแล้ว cache/data เดิมยังค้างผิดบริบท
- user มีหลาย assignment แต่ frontend flatten สิทธิ์รวมกันจนแยกไม่ออกว่าทำอะไรได้ในบริบทไหน

### 4.11 Context / Provider Convention Chaos

ถ้าไม่กำหนด convention ว่า provider ทั้งหมดอยู่ตรงไหนและตั้งชื่ออย่างไร ระบบจะเจอปัญหาเช่น

- provider บางตัวอยู่ `contexts/`
- provider บางตัวอยู่ `theme/`
- provider บางตัวอยู่ `components/`
- ทีมเริ่มหาไฟล์ไม่เจอและ naming ไม่คงที่
- runtime state กับ design system assets ปะปนกัน
- module บางตัวสร้าง context โดยไม่จำเป็น ทั้งที่ใช้ local state หรือ hook ก็พอ

### 4.12 Work Page UX Chaos

ถ้าไม่ได้คิดเรื่อง viewport-first layout, table behavior และ dialog/notification standards ตั้งแต่ต้น ระบบจะเจอปัญหาเช่น

- work pages ยาวจนต้อง scroll browser ขึ้นลงตลอด
- toolbar, filters และ actions หลุดจากสายตาระหว่างทำงาน
- tables บางหน้ามี pagination บางหน้าไม่มี
- บางหน้าปล่อยให้ list ยาวทั้งหน้า
- บางหน้ามี internal scroll แต่ header ไม่ sticky
- delete/confirm flows ไม่คงที่
- notification center, toast และ inline alerts ถูกใช้ปนกันจนผู้ใช้จับ pattern ไม่ได้

ดังนั้นเป้าหมายของ architecture นี้ไม่ใช่แค่ “จัดโฟลเดอร์” แต่คือการสร้าง **Anti-Corruption Layer ระหว่าง Backend กับ UI**, สร้าง **rule กลางของระบบ**, และทำให้ระบบพร้อมรองรับ **offline, cache-aware, theme-aware, permission-aware, viewport-aware, PWA-ready และ integration-aware flows** ได้ในระยะยาว

### อ่านต่อ

- infrastructure ของ offline, cache, persistence, data source, integration, session, chart/dialog/notification foundations, PWA และ theme foundation -> `03_frontend_infrastructure.md`
- permission model และ permission check flow -> `04_frontend_auth-access.md`
- mapper และ type separation -> `05_frontend_type-guidelines.md`, `06_frontend_mapper-guidelines.md`
- service flow และ API usage -> `07_frontend_api-usage.md`
- naming convention ของ context/provider -> `10_frontend_naming-conventions.md`
- viewport/table/dialog/chart standards -> `12_frontend_ui-design-standards.md`

---

## 5. Product Baseline และ Module Baseline

รายการเมนูหรือจำนวนหน้าที่เคยระบุไว้ก่อนหน้านี้ให้ถือเป็น **reference scope** ไม่ใช่ final menu count  
การออกแบบจริงของ frontend ชุดนี้จะเริ่มจาก **domain ownership และ workflow** ก่อน แล้วค่อยออกแบบ menu, route และ page composition ให้เหมาะสม

### 5.1 Active Modules

Frontend baseline ปัจจุบันใช้ module หลักดังนี้

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

### 5.2 ความหมายของแต่ละ Module

#### `auth`

ดูแลเรื่องการยืนยันตัวตนและ session lifecycle เช่น login, logout, refresh และ bootstrap current user

#### `access`

ดูแลเรื่อง users, roles, permissions, scopes, access assignments, effective access และ access summary

#### `farm`

ดูแลงานปฏิบัติการหลักของฟาร์ม เช่น บันทึกข้อมูล, ภาพรวมฟาร์ม, สต๊อกหมู, การให้อาหาร

#### `master`

ดูแลข้อมูลหลักของระบบ เช่น items, partners, facility, uoms, categories และ rules

#### `purchase`

ดูแลงานคำขอซื้อและ workflow ของการขอซื้อ

#### `warehouse`

ดูแลงานคลังและ inventory movement เช่น receive, transfer, issue, adjust

#### `production`

ดูแลงานเปิดรอบ, เปิดโรงเรือน และ production context

#### `health`

ดูแลงานสุขภาพ การรักษา และวัคซีน

#### `maintenance`

ดูแลงานแจ้งซ่อม, งานก่อสร้าง, งานโครงการ และ work orders

#### `sales`

ดูแลงานขาย เช่น orders, deliveries, weighing และ invoices

#### `finance`

ดูแลงานต้นทุน, ปิดงวด, กำไรขาดทุน และ financial summary

#### `insight`

ดูแลหน้าที่เป็น cross-domain read surfaces เช่น dashboard, reports, analytics, alerts และ chart-based insights

#### `approval`

ดูแลงานอนุมัติที่ข้ามหลาย module

#### `document`

ดูแลงานเอกสารและ attachment references

#### `setting`

ดูแลงาน system settings, integration settings และ audit-related settings

### อ่านต่อ

- module ownership และ route-to-module mapping -> `02_frontend_architecture.md`
- requirement ของแต่ละ product area -> `13_frontend_requirements.md`

---

## 6. Final Route Baseline

Route ต้องใช้ชื่อสั้น ชัด และสอดคล้องกับชื่อ domain กลางของระบบ  
Route สามารถเปลี่ยนได้ในอนาคต แต่ baseline ปัจจุบันให้ยึดตามนี้ก่อน

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

### หลักที่ต้องจำเกี่ยวกับ Route

- route เป็น navigation layer
- route ไม่ใช่ business contract
- route ไม่ใช่ตัวกำหนด module
- route ต้องสั้น
- route ต้องอ่านแล้วเดา purpose ได้
- route ต้องใช้คำกลางของ domain
- route path ไม่ควรถูกนำไปใช้แทน permission model

### อ่านต่อ

- route structure, route-to-module mapping และ app tree -> `02_frontend_architecture.md`
- naming ของ route -> `10_frontend_naming-conventions.md`
- current route intent และ product baseline -> `13_frontend_requirements.md`

---

## 7. Route กับ Module เป็นคนละเรื่อง

หนึ่งในจุดที่สำคัญที่สุดของ architecture นี้คือ

**Route คือ UI / navigation entry**  
**Module คือ business owner ของ logic**

ตัวอย่างเช่น

- `/admin/user-assignment`
- `/admin/user-assignment?tab=user`
- `/admin/user-assignment?tab=role`
- `/admin/user-assignment?tab=permission-pool`

ทั้งหมดนี้ยังเป็น responsibility ของ module `access`

หรือ

- `/project`
- `/project/request`
- `/project/orders`
- `/project/[id]`

ทั้งหมดนี้เป็น route ของงานที่ module owner จริงคือ `maintenance`

ดังนั้น

- menu เปลี่ยนได้
- route เปลี่ยนได้
- page split เปลี่ยนได้
- module boundary ไม่ควรแกว่งตามสิ่งเหล่านี้บ่อย ๆ

### อ่านต่อ

- route layer และ module layer -> `02_frontend_architecture.md`
- naming rules -> `10_frontend_naming-conventions.md`

---

## 8. Auth และ Access ต้องแยกกันอย่างชัดเจน

ระบบนี้แยก `auth` ออกจาก `access` โดยตั้งใจ

### Auth ตอบคำถามว่า “ใครเข้าระบบ”

เช่น

- login
- logout
- refresh
- current user
- session

### Access ตอบคำถามว่า “เข้าแล้วทำอะไรได้ และทำที่ไหนได้”

เช่น

- role
- permission
- scope
- access assignment
- effective access
- current working context

แนวคิดสำคัญคือ user คนหนึ่งอาจมีได้หลาย access assignments เช่น

- หลาย role
- หลาย farm
- หลาย phase
- หลาย scope
- permission ไม่เหมือนกันในแต่ละบริบท

ดังนั้นระบบต้องมีหน้า **`/access`** หลัง login สำหรับใช้ในการ

- ต้อนรับผู้ใช้
- แสดงชื่อ-นามสกุลและบริษัท
- แสดง access assignments ที่เลือกได้
- ให้ผู้ใช้เลือก role/scope ที่จะใช้ทำงานตอนนี้
- แสดง permission summary แบบสั้น
- ตั้ง current working context
- แล้วค่อยพาเข้า app หลัก

### Rule ของ Access Flow

- ถ้า user มี access assignment เดียวที่ใช้ได้ -> ระบบอาจ auto-select และข้าม `/access`
- ถ้า user มีหลาย assignments -> ต้องเข้า `/access`
- ถ้า context เดิมใช้ไม่ได้แล้ว -> ต้องกลับไป `/access`
- effective access ต้อง resolve ตาม assignment/current context ที่เลือก
- ห้าม flatten permission ทั้งหมดเป็น bag เดียวทั้งระบบแบบไม่สน scope

### อ่านต่อ

- auth flow, access flow, role, permission, scope, assignments และ effective access -> `04_frontend_auth-access.md`
- session, middleware, bootstrap และ access runtime -> `03_frontend_infrastructure.md`

---

## 9. หน้าแรกหลัง Login ต้องเป็นแบบไหน

### Baseline Flow

```text
/login
  -> bootstrap session
  -> resolve access assignments
  -> ถ้ามีหลาย access choices -> /access
  -> ถ้ามี choice เดียว -> auto-select
  -> set current access
  -> /dashboard
```

### หลักของ Dashboard

ทุก user ในระบบสามารถมี `dashboard.view` ได้  
แต่ dashboard ต้องไม่ใช่หน้าที่โชว์ทุกอย่างของทั้งระบบแบบเดียวกันทุกคน

**Dashboard คือ personalized landing page ตาม effective access และ current context**

dashboard ควรแสดงเพียง 3 กลุ่มหลัก

1. งานที่ต้องทำตอนนี้
2. สถานะที่ต้องเฝ้าระวัง
3. สรุปข้อมูลหลักของ area ที่ user เข้าได้

dashboard **ไม่ควร**

- แทน reports
- แทน analytics
- แสดงทุกโมดูลพร้อมกัน
- กลายเป็นหน้ารวมทุกอย่างจนรก
- ซ้ำกับ navigation ใน sidebar

### Dashboard กับ Offline / SAP / Cache / Charts / Notifications

dashboard ไม่ควรพยายามเป็นหน้าควบคุม integration ลึก ๆ แต่ควรมีพื้นที่สำหรับแสดง

- สถานะ sync สำคัญที่ user ต้องรู้
- งานค้างที่ยังไม่ sync
- integration alerts ที่กระทบการทำงาน
- exception ที่ต้องติดตาม
- data freshness หรือ stale state ที่จำเป็นต่อการตัดสินใจ
- chart-based summaries ที่ช่วยให้ user เห็น trend หรือ comparison จริง และไม่ทำให้ dashboard รกเกินไป
- notification cue ที่สัมพันธ์กับ notification center โดยไม่ทำให้ dashboard กลายเป็น notification hub เอง

### อ่านต่อ

- dashboard architecture และ app shell -> `02_frontend_architecture.md`
- dashboard UX/UI standard -> `12_frontend_ui-design-standards.md`
- dashboard requirement baseline -> `13_frontend_requirements.md`

---

## 10. ภาษาในระบบ: Thai-First

Frontend ชุดนี้ต้องถูกออกแบบเป็น **Thai-first application** ในปัจจุบัน  
i18n หรือ language switching เป็นเรื่องของอนาคต ไม่ใช่ baseline ปัจจุบัน

### Baseline Language Rules

- label, menu, button, helper text และ empty state ใช้ภาษาไทยเป็นหลัก
- route และ folder name ใช้ภาษาอังกฤษแบบสั้น
- technical identifiers ใช้ภาษาอังกฤษ
- ชื่อเมนูใน UI ใช้ภาษาไทย
- ไม่ผสมไทย-อังกฤษโดยไม่จำเป็นในข้อความที่ user เห็น
- wording ต้องสั้น ชัด สุภาพ และเข้าใจง่ายสำหรับผู้ใช้ธุรกิจ

### เมนูภาษาไทย Baseline

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

### อ่านต่อ

- naming ของ route/folder/file -> `10_frontend_naming-conventions.md`
- wording, layout และ UX/UI standards ภาษาไทย -> `12_frontend_ui-design-standards.md`

---

## 11. Layout Baseline ของระบบ

ระบบนี้เป็น ERP ที่เน้น **desktop และ tablet** และต้องให้พื้นที่แสดงผลกับ content มากที่สุด  
ดังนั้น baseline layout คือ

- ใช้ **sidebar เป็น app shell หลัก**
- ไม่ใช้ global headbar ขนาดใหญ่แบบกินพื้นที่แนวตั้ง
- แต่ละหน้าอาจมี **page toolbar เฉพาะหน้า** ตามความจำเป็น
- เนื้อหาหลักต้องใช้พื้นที่เต็มหน้าจอให้มากที่สุด
- หน้าประเภท work pages ต้องยึดหลัก **viewport-first**
- การเลื่อนหน้าจอ browser ทั้งหน้าไม่ควรเป็น baseline ปกติของ work pages
- หน้าที่มีตารางหรือพื้นที่ทำงานหลักควรถูกออกแบบให้ผู้ใช้ทำงานใน viewport หลักได้
- tables, review pages, dashboards และ operational screens ควรใช้ internal scroll ภายใน content area หรือ table area เป็นค่าเริ่มต้นเมื่อเหมาะสม

### Layout Zones

1. Sidebar
2. Main content
3. Page toolbar เฉพาะหน้า
4. Page body

### อ่านต่อ

- app shell, sidebar, page toolbar และ layout structure -> `02_frontend_architecture.md`
- visual layout rules, viewport-first patterns และ page standards -> `12_frontend_ui-design-standards.md`

---

## 12. Sidebar Baseline

Sidebar ของระบบนี้ต้องเป็น **area-level navigation** ไม่ใช่ dropdown หลายชั้น

### Sidebar Main Items

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

### สิ่งที่ Sidebar ทำ

- พาผู้ใช้ไปยัง area หลักของระบบ
- แสดงเฉพาะรายการที่ user เข้าได้ตาม effective access
- แสดง active state ของ area ปัจจุบัน
- รองรับโหมดย่อและขยาย
- มี notification entry ผ่าน bell icon
- มี user panel ด้านล่าง

### สิ่งที่ Sidebar ไม่ควรทำ

- ไม่ควรเป็น multi-level dropdown หลายชั้น
- ไม่ควรแบก sub-menu ย่อยทุกอย่าง
- ไม่ควรใช้แทน access summary page
- ไม่ควรแสดง route ทั้งระบบแบบเต็ม tree

### Sub Navigation

เมนูย่อยของแต่ละ area ให้ไปอยู่ใน **tabs หรือ subnav ภายในหน้า area นั้น** เช่น

- ฟาร์ม -> บันทึกข้อมูล / ภาพรวม / สต๊อกหมู / การให้อาหาร / สุขภาพ
- คลัง -> ภาพรวม / รับเข้า / โอนย้าย / เบิกใช้ / ปรับยอด
- ขาย -> คำสั่งขาย / ส่งมอบ / ชั่งน้ำหนัก / ใบแจ้งหนี้
- การเงิน -> ต้นทุน / ปิดงวด / กำไรขาดทุน
- วิเคราะห์ -> รายงาน / วิเคราะห์ข้อมูล / การแจ้งเตือน
- ผู้ดูแลระบบ -> ผู้ใช้ / ข้อมูลหลัก / เอกสาร / ตั้งค่า

### อ่านต่อ

- sidebar architecture, collapsed/expanded behavior และ shell structure -> `02_frontend_architecture.md`
- interaction standard ของ sidebar/subnav -> `12_frontend_ui-design-standards.md`

---

## 13. User Panel, Notification Center และ Access Summary

ข้อมูลผู้ใช้, role ปัจจุบัน, current access และปุ่มเปลี่ยนบริบท **ไม่ควรไปอยู่บน dashboard เป็นหลัก**  
สิ่งเหล่านี้ควรอยู่ใน **app shell** เพื่อให้ user ดูได้จากทุกหน้า

### User Panel ใน Sidebar ควรมี

- ชื่อ-นามสกุล
- บริษัท
- บทบาท/บทบาทที่ใช้งานอยู่
- บริบทปัจจุบัน เช่น ฟาร์ม / เฟส / โรงเรือน
- ปุ่ม “เปลี่ยนบริบทการทำงาน”
- เมนูโปรไฟล์ เช่น โปรไฟล์ / สิทธิ์การใช้งาน / ออกจากระบบ
- จุดเข้าถึง theme switch เมื่อเหมาะสม

### Notification Center ใน Sidebar ควรมี

- bell icon
- unread badge
- entry ไปสู่ notification panel / notification page ตาม pattern ที่ระบบตกลง
- ใช้เป็น entry หลักของ approvals, alerts, failed sync notices, integration warnings และ actionable notifications

### สิ่งที่ user ต้องดูย้อนหลังได้

- current role
- current scope
- current working context
- permission summary
- accessible areas

ดังนั้น popup หลัง login ไม่ใช่วิธีหลัก  
แต่ต้องมีจุดให้ย้อนกลับมาดูได้เสมอผ่าน user panel / profile menu / access summary

### อ่านต่อ

- access context และ current access runtime -> `04_frontend_auth-access.md`
- shell structure และ user panel / notification entry placement -> `02_frontend_architecture.md`
- wording และ profile/access panel patterns -> `12_frontend_ui-design-standards.md`

---

## 14. Theme Direction และ Visual Personality

ระบบนี้ต้องรองรับทั้ง **Light Theme** และ **Dark Theme** โดยใช้ theme system เดียวกัน  
และ visual direction หลักต้องเป็น **modern + enterprise**

### ความหมายของ Modern

- layout โปร่ง อ่านง่าย
- hierarchy ชัด
- spacing เป็นระบบ
- typography ชัดเจน
- card / panel / table / form ดูร่วมสมัย
- interaction states ชัดและไม่รก

### ความหมายของ Enterprise

- เน้นความน่าเชื่อถือมากกว่าความหวือหวา
- อ่านข้อมูลเยอะได้ดี
- จัดลำดับความสำคัญของข้อมูลชัด
- component behavior คงที่
- status, error, warning, disabled, offline, sync และ integration states ต้องสื่อสารชัด
- รองรับงานจริงบน desktop/tablet ได้ดี

### Theme Rules ระดับบน

- ทุกสีต้องมาจาก theme tokens
- ห้าม hardcode สีใน business components แบบไร้ระบบ
- shell, sidebar, tables, forms, dialogs, alerts, chips, charts และ status surfaces ต้อง render ได้ทั้ง light/dark
- theme switching ต้องไม่ทำให้ layout, hierarchy หรือ readability พัง
- component shared layer ต้องเป็น theme-aware
- runtime state ของ theme mode ให้อยู่ใน `ThemeContext`
- theme definitions และ tokens ให้อยู่ใน `src/core/theme/`

### อ่านต่อ

- project structure ของ theme system -> `02_frontend_architecture.md`
- theme, token, color, contrast, spacing, chart/dialog styles และ component styling standards -> `12_frontend_ui-design-standards.md`
- naming convention ของ ThemeContext -> `10_frontend_naming-conventions.md`

---

## 15. โครงสร้างระดับบนของ Source Code

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

### หน้าที่ของแต่ละโฟลเดอร์

#### `app/`

ใช้สำหรับ route layer ของ Next.js เช่น pages, layouts, loading, error boundaries และ route handlers

#### `components/`

ใช้สำหรับ shared UI ที่ใช้ข้ามโมดูล โดย baseline ภายในให้แยกอย่างน้อยเป็น

- `src/components/layout/` สำหรับ shell/layout components
- `src/components/common/` สำหรับ shared UI primitives และ state components

ห้ามวาง business components ของ module ในโฟลเดอร์นี้

#### `contexts/`

ใช้สำหรับ shared app-level contexts และ providers

#### `core/`

ใช้สำหรับ shared runtime/core concerns เช่น api client, config, i18n, theme และ ui patterns

#### `lib/`

ใช้สำหรับ infrastructure และ technical foundation เช่น http client, auth helpers, access helpers, config, cache helpers, persistence helpers, offline helpers, data source helpers, pwa helpers และ integration helpers

#### `features/`

ใช้สำหรับ business features ทั้งหมดของระบบ เป็นแกนหลักของ business logic

#### `types/`

ใช้สำหรับ shared technical types ที่หลายส่วนใช้ร่วมกันจริง

#### `(optional shared helpers)`

ถ้ามี helper ที่ shared จริงให้วางใน shared layer ที่ทีมตกลงร่วมกัน และไม่ซ้อนกับ owner ของ `features/*`

### อ่านต่อ

- project structure, folder responsibilities และ file responsibilities -> `02_frontend_architecture.md`
- shared types rules -> `05_frontend_type-guidelines.md`

---

## 16. โครงสร้าง `src/app/` ระดับบน

Baseline ของ `src/app/` ให้ยึดประมาณนี้

```text
src/app/
├── api/
├── (auth)/
├── (access)/
├── (main)/
├── global-error.tsx
├── layout.tsx
├── manifest.ts
└── globals.css
```

### หน้าที่ของแต่ละส่วน

#### `api/`

BFF endpoints ของ Next.js เช่น auth handlers

#### `(auth)/`

กลุ่มหน้าก่อนเข้าสู่ session เช่น `login`

#### `(access)/`

กลุ่มหน้าหลัง login แต่ก่อนเข้า app หลัก เช่น `access`

#### `(main)/`

กลุ่มหน้าหลักทั้งหมดหลังจาก session และ current access พร้อมแล้ว

#### `layout.tsx`

root layout ของแอป

#### `global-error.tsx`

global error boundary

#### `manifest.ts`

web app manifest foundation สำหรับ PWA direction ของระบบ

#### `globals.css`

global CSS ที่จำเป็นของทั้งระบบ

### อ่านต่อ

- app tree จริง, route grouping, page/layout responsibility และ middleware -> `02_frontend_architecture.md`
- auth/access entry flow -> `04_frontend_auth-access.md`
- PWA direction -> `03_frontend_infrastructure.md`

---

## 17. โครงสร้าง `src/contexts/` และความสัมพันธ์ของ Providers

Baseline ที่แนะนำคือ

```text
src/contexts/
├── RoleContext.tsx
├── ShellContext.tsx
└── ThemeContext.tsx
```

### Naming Rule

- ชื่อไฟล์ runtime wrapper / context-like component ควรสื่อ owner ให้ชัด
- ถ้าเป็น compatibility wrapper ให้ระบุใน doc ว่าเป็น legacy
- export หลักภายในไฟล์ควรเป็นชื่อที่บอกหน้าที่จริง เช่น `useXxx`, `XxxProvider` หรือ component wrapper ที่ชัดเจน

### `RoleContext.tsx`

compatibility wrapper legacy สำหรับ access guard

ไม่ควรใช้เป็น owner หลักของ auth/access bootstrap ใหม่

### Auth / Access runtime

auth bootstrap และ access bootstrap ใน implementation ปัจจุบันควรถูกแยกเป็น runtime concern ของ guard / service / helper ที่เกี่ยวข้อง มากกว่าผูกกับ context file ชื่อเดียว

สิ่งที่ต้องแยกให้ชัดคือ

- auth/session bootstrap
- access selection / current access
- effective permissions / allowed areas
- shell state

### `ShellContext.tsx`

รับผิดชอบเรื่อง shell-level UI state ที่ shared ทั้งแอป เช่น

- sidebar collapsed/expanded
- shell drawers/menus
- notification panel state
- utility panel state

### `ThemeContext.tsx`

รับผิดชอบเรื่อง theme runtime state เช่น

- current theme mode
- setThemeMode
- resolved theme mode
- persistence ของ theme preference
- การห่อ MUI `ThemeProvider` ด้วย theme definitions จาก `src/core/theme/`

### Module-Level Contexts

โดย baseline แล้ว **ส่วนใหญ่ module จะไม่ต้องมี context ของตัวเอง**  
ให้เริ่มจาก

- local component state
- page-level state
- module hooks
- React Hook Form
- TanStack Query

ก่อนเสมอ

ถ้าจำเป็นจริงจึงค่อยมี

```text
src/features/<module>/contexts/
└── XxxContext.tsx
```

### ใช้ module context เมื่อ

- มี state เดียวที่ต้องแชร์ข้ามหลายชั้นใน module เดียว
- prop drilling หนักและทำให้โค้ดอ่านยากจริง
- เป็น multi-step flow / wizard
- เป็น shared runtime state ภายใน module ที่ไม่ควรถูกยกไปเป็น app-level context

### ไม่ควรใช้ module context เมื่อ

- แค่ต้องการส่ง props 1-2 ชั้น
- ใช้ local state หรือ custom hook ก็พอ
- เป็น data ที่ React Query ถืออยู่แล้ว
- เป็น form state ที่ React Hook Form ถือได้อยู่แล้ว

### ความสัมพันธ์

- `AuthProvider` ต้องอยู่ชั้นบนกว่า `AccessProvider`
- `AccessProvider` ใช้ข้อมูลจาก auth/session เพื่อ resolve access runtime
- `ShellProvider` ไม่ควรปนกับ auth/access ถ้าเป็นเพียง UI runtime
- `ThemeProvider` อยู่ใน `contexts` ตาม convention เดียวกับ provider ตัวอื่น
- `src/core/theme/` ไม่ใช่ provider layer
- source of truth จริงของ current access ควรอยู่ที่ session ฝั่ง server/BFF
- context ฝั่ง client มีไว้เพื่อให้ UI ใช้งานและ render ได้สะดวก
- localStorage หรือ sessionStorage อาจใช้ช่วย persistence บางส่วนได้ แต่ไม่ใช่ canonical auth/access source

### อ่านต่อ

- context placement และ responsibilities -> `02_frontend_architecture.md`
- auth/access flow และ access resolution -> `04_frontend_auth-access.md`
- infrastructure/session/bootstrap/cache/persistence -> `03_frontend_infrastructure.md`
- naming rules -> `10_frontend_naming-conventions.md`

---

## 18. โครงสร้าง `src/features/` ระดับบน

Baseline ของโปรเจกต์ปัจจุบันให้ยึดประมาณนี้

```text
src/features/
├── admin/
├── auth/
├── operations/
├── production/
├── profile/
└── reports/
```

แต่ละ module ควรยึด anatomy กลางแบบเดียวกัน

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

> หมายเหตุ: ถ้าต้องมี mock/demo reference ให้แยกออกนอก runtime feature anatomy หลัก ไม่ใช่ส่วนบังคับของทุก module
> `types/` และ `utils/` เป็น optional; ถ้า module ไหนไม่ต้องแยก shape หรือ helper เพิ่มก็ไม่ต้องมี

### หน้าที่ของแต่ละโฟลเดอร์ใน Module

#### `pages/`

business page components ของ module นั้น

#### `components/`

business UI components ของ module นั้น รวมถึง section components, business tables, forms, chart wrappers และ dialog owners ของโมดูลนั้น

#### `hooks/`

module-level hooks เช่น query hooks, mutation hooks, form hooks และ page hooks

#### `services/`

จุดรวมของ api และ service orchestration

ใน module ที่มีหลาย use case หรือหลาย tab ให้แยกเป็น service ย่อยตามโดเมนได้ เช่น `user.service.ts`, `role.service.ts`, `permission.service.ts` แล้วมี `all.service.ts` เป็นตัวกลางรวมกลับมาเป็น public surface เดียวของ module

#### `types/`

type files ของ module นั้นเฉพาะเมื่อจำเป็นจริง เช่น DTO, Model, FormModel, Query, Draft หรือ shape เฉพาะทางอื่น ๆ

#### `utils/` *(optional)*

mapper, constants และ helper ที่ module นั้นต้องใช้จริง

> permission truth ไม่ควรถูกเก็บซ้ำใน `permissions.ts` ของแต่ละ module ให้ยึด guard กลางใน `src/lib/access/modules/*.guard.ts` เป็นหลัก

#### `index.ts`

public export surface ของ module

### อ่านต่อ

- module anatomy, dependency rules และ file responsibilities -> `02_frontend_architecture.md`
- types -> `05_frontend_type-guidelines.md`
- mapper -> `06_frontend_mapper-guidelines.md`
- API/service flow -> `07_frontend_api-usage.md`
- mock/reference และ isolated demo -> `08_frontend_mock-usage.md`
- component composition และ dialog/table/chart ownership -> `09_frontend_component-guidelines.md`

---

## 19. กฎหลักของ Data Flow

Business data ในระบบนี้ต้องไหลผ่าน layer ที่ชัดเจน

`Page -> Hook -> Service -> API -> DTO -> Mapper -> Model -> UI`

ความหมายคือ

- Page มีหน้าที่ compose screen
- Hook มีหน้าที่จัดการ query/mutation/form state
- Service มีหน้าที่ orchestrate และรวมข้อมูล
- Service/API มีหน้าที่คุย data source
- Mapper มีหน้าที่แปลงข้อมูล
- UI มีหน้าที่ render จาก model

### สิ่งที่ห้าม

- UI ห้ามใช้ DTO ตรง
- Component ห้ามยิง API ตรง
- Page ห้ามรวมข้อมูลหลาย API เอง
- Shared component ห้ามแบก business logic ของ module
- Context ห้ามถูกใช้แทน server state
- localStorage/local cache ห้ามถูกใช้แทน canonical business state แบบไร้กติกา
- button/delete/confirm flow ห้ามกระจัดกระจายคนละ pattern
- chart options ห้ามถูกเขียนกระจัดกระจายทุกหน้าโดยไม่มี wrapper/pattern กลาง

### Cache / Persistence Rule เพิ่มเติม

- server-fetched data ควรใช้ query cache เป็น baseline
- UI preference ใช้ localStorage ได้เมื่อเหมาะสม
- offline draft / queue ต้องมี owner ชัด ไม่กระจัดกระจาย
- auth/current access canonical state ต้องไม่พึ่ง localStorage อย่างเดียว
- data freshness และ sync state ต้องถูกสื่อสารให้ user เข้าใจได้

### Offline / Integration Rule เพิ่มเติม

- local draft และ sync state ต้องไม่ถูกปนกับ DTO ดิบแบบมั่ว ๆ
- UI ต้องรู้ว่า data ไหนเป็น synced state, pending sync state, stale state หรือ local-only state
- SAP/integration status ต้องถูก map เป็น model ที่ UI เข้าใจง่าย

### Data Source Rule เพิ่มเติม

- service เป็น owner ของ data-fetch orchestration
- mock path และ api path ถ้ามีใน demo/test ต้องจบที่ DTO shape เดียวกัน
- service/hook/page ไม่ควรรู้ว่าตอนนี้ใช้ source ไหนใน runtime จริง
- env/config สำหรับ demo/test source selection ต้อง centralized แยกจาก runtime

### Permission Check Rule เพิ่มเติม

- menu guard, page guard, section guard และ action guard ต้องใช้ effective access/current context เป็นฐานเดียวกัน
- page/component ห้าม hardcode permission strings กระจัดกระจายโดยไม่มี module permission references
- route visibility ไม่เท่ากับ action availability
- การซ่อน UI อย่างเดียวไม่ถือว่าเช็คสิทธิ์ครบ

### Context / Provider Rule เพิ่มเติม

- shared app-level providers ทุกตัวต้องอยู่ใน `src/contexts/`
- module context เป็น optional และใช้เมื่อจำเป็นจริงเท่านั้น
- `theme/` ไม่ควรรับผิดชอบ provider lifecycle
- naming ต้องคงที่ทั้งระบบเพื่อให้ทีมตามไฟล์ได้ง่าย

### Chart / Dialog / Notification Rule เพิ่มเติม

- charts ของระบบต้องใช้ ECharts เป็น baseline
- confirmation, destructive confirmation และ unsaved changes warning ต้องใช้ MUI Dialog
- side workflows ต้องใช้ MUI Drawer เมื่อเหมาะสม
- toast feedback ใน main content ต้องใช้ notistack
- inline banners/alerts ต้องใช้ MUI Alert
- notification center หลักต้องอยู่ที่ bell icon ใน sidebar
- งานใหม่ต้องยึดมาตรฐานนี้ทั้งหมด

### Viewport Rule เพิ่มเติม

- work pages ต้องพยายามทำให้ผู้ใช้ทำงานภายใน viewport หลัก
- tables ต้องมี pagination และ page size options ที่ชัด
- internal scroll ใน content/table area เป็น baseline ของ operational screens
- browser scroll ทั้งหน้ายาว ๆ ไม่ใช่ค่าเริ่มต้นของ work pages

### PWA Rule เพิ่มเติม

- โครงสร้างของแอปต้องพร้อมต่อยอด web app manifest และ installable shell
- offline/persistence decisions ต้องไม่ขัดกับ PWA direction ในอนาคต
- ยังไม่จำเป็นต้องลงลึก service worker เต็มรูปแบบตั้งแต่วันแรก ถ้ายังไม่อยู่ใน scope

### อ่านต่อ

- architecture layer และ dependency direction -> `02_frontend_architecture.md`
- type rules -> `05_frontend_type-guidelines.md`
- mapper rules -> `06_frontend_mapper-guidelines.md`
- API/service flow -> `07_frontend_api-usage.md`, `08_frontend_mock-usage.md`
- permission check flow -> `04_frontend_auth-access.md`
- dialog/chart/table/viewport standards -> `12_frontend_ui-design-standards.md`

---

## 20. Tech Stack และแนวทางการใช้

Frontend ชุดนี้ใช้ stack หลักดังนี้

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Server State:** TanStack Query
- **Client State:** React Context
- **Form & Validation:** React Hook Form + Zod
- **HTTP Client:** Axios
- **UI Library:** MUI
- **Date Picker:** MUI X Date Pickers + Day.js
- **Charts:** Apache ECharts
- **Toast Feedback:** notistack
- **Backend Integration:** API/BFF contract ปัจจุบัน

### Rules

- React Query ใช้กับ server state
- React Context ใช้กับ shared client state เท่านั้น
- form ต้องมี form model และ validation ที่ชัด
- auth ต้องผ่าน BFF boundary
- token ต้องไม่ถูก expose ให้ browser แบบเปิดเผย
- route-level loading และ data-level loading ต้องแยกกัน
- UI ต้องใช้ model ไม่ใช่ DTO
- dialog/drawer/notification ต้องใช้มาตรฐานกลางของระบบ
- chart ต้องใช้ wrapper/pattern กลางและผูกกับ theme system
- work pages ต้องถูกออกแบบแบบ viewport-first

### Offline / Cache / Integration / Theme / PWA Direction

- ระบบต้องพร้อมต่อยอด PWA/offline capability ในอนาคต
- query cache เป็น baseline สำหรับลดเวลา reload ของ server data
- localStorage ใช้กับ UI preferences และ lightweight persistence เท่านั้นเป็น baseline
- sessionStorage ใช้กับ temporary browser-session state เมื่อเหมาะสม
- local draft / queue ใช้ persistence layer ที่เหมาะสม ไม่ใช่ยัดทุกอย่างใน localStorage
- integration กับ SAP ต้องผ่าน backend/BFF/integration layer ไม่ใช่ให้ UI คุย SAP โดยตรง
- UI ต้องมีจุดแสดง sync status และ integration status ตาม requirement
- theme system ต้องรองรับ light/dark และ shared components ต้องอิง theme tokens
- data fetch orchestration ต้องถูกควบคุมโดย config + service ไม่ใช่ component
- provider lifecycle ของแอปต้องอยู่ใน `contexts`
- web app manifest และ installable shell direction ต้องถูกเผื่อไว้ในโครงของแอป

### อ่านต่อ

- infrastructure, HTTP, session, offline, cache, persistence, sync, SAP, PWA, dialog/notification/chart foundations, theme foundation และ data source config -> `03_frontend_infrastructure.md`
- API flow และ code examples -> `07_frontend_api-usage.md`
- mock/reference flow, env strategy และ storybook fixtures -> `08_frontend_mock-usage.md`
- naming convention ของ context/provider -> `10_frontend_naming-conventions.md`

---

## 21. UX/UI Standard ระดับบน

แม้รายละเอียดเชิง visual จะไปลงลึกใน `12_frontend_ui-design-standards.md` แต่ overview นี้ต้องกำหนด baseline ระดับบนให้ชัด

### 21.1 UX Principles

- ใช้งานเร็ว
- อ่านง่าย
- มี hierarchy ชัด
- ลด cognitive load
- ใช้ pattern ซ้ำให้สม่ำเสมอ
- ให้ข้อมูลเท่าที่จำเป็นในแต่ละจุด
- หน้า area ต้องมี mental model คงที่
- ภาษาไทยต้องอ่านเข้าใจทันทีโดยผู้ใช้ธุรกิจ
- offline, cache freshness, sync และ integration states ต้องสื่อสารให้ user เข้าใจได้ทันทีเมื่อเกี่ยวข้อง
- permission-limited states ต้องชัดว่าดูไม่ได้, ทำไม่ได้ หรือยังไม่ได้เลือกบริบท
- destructive actions ต้องมี confirmation pattern ที่คงที่
- work pages ต้องพยายามใช้งานได้ภายใน viewport หลัก
- charts ต้องใช้เฉพาะเมื่อช่วยให้เห็น insight จริง ไม่ใช่ใส่เพราะอยากให้ดูมี chart
- notification center, toast และ inline alerts ต้องแยกบทบาทกันชัด

### 21.2 UI Principles

- ใช้พื้นที่แนวนอนและแนวตั้งอย่างคุ้มค่า
- desktop/tablet เป็น primary target
- page title, filters และ actions อยู่ใน page toolbar ของหน้านั้น
- sidebar เป็น app shell หลัก
- dashboard ไม่รก
- tables, forms, cards, panels, dialogs และ charts ต้องมีโครงคงที่
- active states ต้องชัด
- empty, loading, error, access, offline, stale, sync และ integration states ต้องมีมาตรฐาน
- Light/Dark theme ต้องมี hierarchy, contrast และ readability ที่ดีเท่ากัน
- visual direction ต้อง modern แต่ยังคงความนิ่งและน่าเชื่อถือแบบ enterprise
- work pages ต้องใช้ viewport-first layout เป็น baseline

### 21.3 Language Principles

- เมนูและข้อความหลักใช้ภาษาไทย
- technical naming ใน code ใช้ภาษาอังกฤษ
- คำที่ user เห็นต้องตรงและไม่กำกวม
- ไม่ใช้ศัพท์อังกฤษทับศัพท์โดยไม่จำเป็น ถ้ามีคำไทยที่ชัดกว่า

### อ่านต่อ

- visual standard, spacing, forms, tables, cards, dialogs, charts, viewport rules, states, theme และ wording -> `12_frontend_ui-design-standards.md`
- component responsibilities และ page composition -> `09_frontend_component-guidelines.md`

---

## 22. เอกสารแต่ละไฟล์ใน `frontend/docs/frontend/` มีหน้าที่อะไร

ส่วนนี้สำคัญมาก เพราะชุด docs นี้ไม่ได้ต้องการแค่ “บอกแนวคิด” แต่ต้องบอกด้วยว่าไฟล์ไหนให้ข้อมูลระดับไหน

### `01_frontend_overview.md`

ภาพรวมของทั้งระบบ, หลักคิดหลัก, module baseline, route baseline, auth/access baseline, layout baseline, language baseline, chart/dialog/notification baseline, viewport-first baseline และโครงรวมของ docs ทั้งชุด

### `02_frontend_architecture.md`

โครงสร้าง route, module, app shell, project structure, folder responsibilities, file responsibilities และ dependency rules  
ลักษณะเนื้อหา: **กฎ + โครงสร้าง + ascii tree + ความสัมพันธ์ของไฟล์**

### `03_frontend_infrastructure.md`

HTTP client, config, session bootstrap, access bootstrap, middleware-related infrastructure, runtime behavior, offline support direction, cache/persistence direction, chart/dialog/notification infrastructure touchpoints, theme foundation, env strategy, PWA direction และ SAP integration touchpoints  
ลักษณะเนื้อหา: **กฎ + flow แบบย่อ + code reference ของ infrastructure foundation**

### `04_frontend_auth-access.md`

auth flow, access flow, roles, permissions, scopes, access assignments, effective access, `/access`, current context, menu/page/action guards และ permission check flow  
ลักษณะเนื้อหา: **กฎ + flow แบบย่อ + use cases + code reference ของ permission checks ที่ควรมี**

### `05_frontend_type-guidelines.md`

DTO, Model, FormModel, shared types, access types, sync/integration types และ type placement  
ลักษณะเนื้อหา: **กฎ + type matrix + use case ตาม lifecycle ของข้อมูล**

### `06_frontend_mapper-guidelines.md`

mapper rules, normalize rules, fallback rules, DTO -> Model, FormModel -> DTO, multi-source composition rules และกรณี API field ไม่ตรง/ไม่ครบ  
ลักษณะเนื้อหา: **กฎ + use case matrix + code reference ของ mapping**

### `07_frontend_api-usage.md`

API usage flow จาก page/hook/service/api/httpClient ไปจนถึง model ที่ UI ใช้ รวมทั้ง query/mutation, invalidation, refetch และ access-aware fetching
ลักษณะเนื้อหา: **flow จริงแบบ end-to-end + code reference จริง + query/mutation examples**

### `08_frontend_mock-usage.md`

mock usage, reference-only source switching notes, storybook/demo fixtures และ isolated demo/test patterns
ลักษณะเนื้อหา: **reference + isolated demo/test guidance**

### `09_frontend_component-guidelines.md`

component responsibilities, shared vs module UI, page composition flow, section composition, internal module exports, page model -> section props, dialog ownership, chart wrapper placement, table/form section ownership และ shell components  
ลักษณะเนื้อหา: **กฎ + composition flow + use cases + code reference ของ page composer/component split**

### `10_frontend_naming-conventions.md`

route names, module names, folder/file names, env names, context/provider names, type file names, mapper/service/hook naming และ technical naming rules  
ลักษณะเนื้อหา: **กฎ + naming matrix + examples**

### `11_frontend_backend-frontend-mapping.md`

mapping กลางระหว่าง backend concepts กับ frontend concepts รวมถึง auth/access, sync, integration, SAP-facing concepts และ UI-facing concepts  
ลักษณะเนื้อหา: **mapping table + แนวคิดการแปลความหมายระหว่างฝั่ง backend กับ frontend**

### `12_frontend_ui-design-standards.md`

UI standards, layout rules, visual patterns, popup/dialog/drawer/notification patterns, chart standards, viewport-first work pages, table/form/card standards, wording standards, light/dark theme standards, permission-related UI states, offline/cache/integration states และ notification center / toast model  
ลักษณะเนื้อหา: **มาตรฐาน UX/UI + state patterns + visual rules + wording rules**

### `13_frontend_requirements.md`

current baseline ของ product areas, final route/menu intent, modules, workflow entrypoints, online-only vs offline-capable flows, PWA direction และ SAP/integration expectations ที่เกี่ยวกับ frontend  
ลักษณะเนื้อหา: **requirements baseline + scope + boundary ของสิ่งที่ frontend ต้องรองรับ**

### `14_frontend_requirements-questions.md`

ไฟล์ถาม-ตอบสำหรับให้ผู้ดูแลโปรเจกต์หรือทีม product/UX/business ตอบ requirement decisions ลงไป แล้วส่งให้ AI ใช้เป็น source เพิ่มเติมในการอัปเดต docs ชุดอื่น  
ลักษณะเนื้อหา: **Q/A workbook + วิธีการใช้ไฟล์ + กฎบังคับสำหรับ AI + คำสั่งสำหรับ AI + คำถามที่ต้องตอบ**

---

## 23. เมื่อไรควรใช้โค้ดจริง และเมื่อไรควรใช้ flow แบบย่อ

เพื่อให้ docs ใช้งานได้จริงและไม่กลายเป็น code dump ทุกไฟล์ ให้ยึดหลักนี้

### ควรมี **โค้ดจริงแบบ reference**

ในไฟล์ที่คนอ่านต้องเห็น “boundary จริงในโค้ด” เช่น

- `03_frontend_infrastructure.md`
- `04_frontend_auth-access.md`
- `06_frontend_mapper-guidelines.md`
- `07_frontend_api-usage.md`
- `08_frontend_mock-usage.md`
- `09_frontend_component-guidelines.md`
- `10_frontend_naming-conventions.md` เฉพาะส่วน naming ที่ต้องยกตัวอย่าง structure จริง

### ควรมี **flow แบบย่อ**

ในไฟล์ที่ต้องการให้เห็นภาพรวมของการไหล เช่น

- `01_frontend_overview.md`
- `02_frontend_architecture.md`
- `03_frontend_infrastructure.md`
- `04_frontend_auth-access.md`
- `07_frontend_api-usage.md`

### ควรมี **use case matrix**

ในไฟล์ที่ต้องอธิบายกรณีแยกย่อยให้ตัดสินใจถูก เช่น

- `04_frontend_auth-access.md`  
  ตัวอย่าง: menu/page/action/data guard, current access change, multiple assignments
- `05_frontend_type-guidelines.md`  
  ตัวอย่าง: DTO vs Model vs FormModel vs PersistenceModel
- `06_frontend_mapper-guidelines.md`  
  ตัวอย่าง: API field ไม่ตรง, field ไม่ครบ, หลาย API ประกอบข้อมูลเดียว
- `08_frontend_mock-usage.md`  
  ตัวอย่าง: reference-only mock strategy, storybook fixtures, demo data
- `10_frontend_naming-conventions.md`  
  ตัวอย่าง: file naming, context/provider naming, env naming

### ควรมี **Q/A workbook**

ในไฟล์ที่ผู้ดูแลโปรเจกต์ต้องตอบแล้วส่งให้ AI อัปเดต docs ต่อ เช่น

- `14_frontend_requirements-questions.md`

---

## 24. Naming Rules ระดับภาพรวม

ระบบนี้ใช้ naming แบบ **สั้น ชัด และคงที่**

### Baseline Names

- `master-data` -> `master`
- `documents` -> `docs`
- `system-settings` -> `settings`
- `user-management` -> `users`
- `purchase-request` -> `purchase`
- `notification-rules` -> `rules` เมื่ออยู่ใต้ `admin/master/` และความหมายยังชัด

### Context / Provider Naming Baseline

- auth/session runtime -> `AuthProvider`
- access runtime -> `AccessProvider`
- shell runtime -> `ShellProvider`
- theme runtime -> `ThemeProvider`

### Module Context Naming Baseline

- ใช้ได้เฉพาะเมื่อจำเป็นจริง
- ตั้งชื่อแบบ `XxxContext.tsx`
- export `XxxProvider`
- ถ้าไม่จำเป็น ห้ามสร้าง context เพียงเพราะเผื่ออนาคต

### Rules

- route ใช้ lowercase
- folder ใช้ lowercase
- คำใน route ใช้คำสั้นที่สื่อ domain
- ห้ามใช้ชื่อยาวเกินจำเป็น
- ชื่อ module ต้องนิ่งกว่า route
- ถ้าคำสั้นทำให้ความหมายเสีย ค่อยใช้ชื่อเต็มกว่าหนึ่งระดับ
- ควรใช้คำเดียวกันซ้ำอย่างคงที่ทั้ง docs, routes และ module names เท่าที่เป็นไปได้
- shared app-level providers ต้องอยู่ใน `src/contexts/`
- `theme/` ใช้สำหรับ theme assets ไม่ใช่ provider placement

### อ่านต่อ

- naming convention เชิงลึก -> `10_frontend_naming-conventions.md`

---

## 25. Documentation Governance

เอกสารชุดนี้เป็นส่วนหนึ่งของ architecture governance ของโปรเจกต์  
หาก implementation เปลี่ยนในสิ่งที่กระทบ architecture, auth/access flow, route baseline, module boundary, layout baseline, naming baseline, context/provider convention, offline behavior, cache strategy, persistence strategy, data source strategy, chart/dialog/notification standards, viewport/table/form behavior, PWA direction, SAP integration behavior, theme behavior, permission model หรือ UX/UI standard ต้องอัปเดต docs ที่เกี่ยวข้องทันที

### ตัวอย่างการอัปเดตเอกสาร

- route หรือ app shell เปลี่ยน -> อัปเดต `02_frontend_architecture.md`
- auth/access flow หรือ permission check flow เปลี่ยน -> อัปเดต `04_frontend_auth-access.md`
- naming rule หรือ context/provider convention เปลี่ยน -> อัปเดต `10_frontend_naming-conventions.md`
- language, theme, chart/dialog/notification standards หรือ UX/UI standard เปลี่ยน -> อัปเดต `12_frontend_ui-design-standards.md`
- product area หรือ menu intent เปลี่ยน -> อัปเดต `13_frontend_requirements.md`
- เรื่อง offline, cache, persistence, sync, data source, PWA หรือ integration เปลี่ยน -> อัปเดต `03_frontend_infrastructure.md`, `07_frontend_api-usage.md`, `08_frontend_mock-usage.md`, `13_frontend_requirements.md`
- mapping rule เปลี่ยน -> อัปเดต `05_frontend_type-guidelines.md` และ `06_frontend_mapper-guidelines.md`
- component composition rule เปลี่ยน -> อัปเดต `09_frontend_component-guidelines.md`
- คำถาม requirement ใหม่ หรือมติใหม่จากผู้ดูแลโปรเจกต์ -> บันทึกหรืออัปเดตที่ `14_frontend_requirements-questions.md`

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

สรุป baseline สำคัญที่สุดของ frontend ชุดนี้คือ

- ระบบนี้เป็น **ERP Frontend ภาษาไทย** สำหรับ desktop/tablet เป็นหลัก
- ใช้ Next.js App Router + TypeScript + React Query + RHF + Zod + Axios + MUI + MUI X Date Pickers + Day.js + ECharts + notistack + backend API/BFF contract ปัจจุบัน
- architecture ต้องเน้น clean, modern, enterprise, maintainable, scalable, reusable และ performance-aware
- ระบบต้องถูกออกแบบให้รองรับ **offline-capable workflows**, **cache/persistence strategy**, **data source strategy**, **Light/Dark theme**, **viewport-first work pages**, **PWA direction** และ **SAP integration**
- module ต้องแบ่งตาม business domain
- route เป็น navigation layer
- module ต้องนิ่งกว่า route
- route และ folder ต้องใช้ชื่อสั้น เช่น `master`, `docs`, `settings`
- auth กับ access ต้องแยก responsibility
- หลัง login ถ้าจำเป็นต้องเลือก role/scope/assignment ให้เข้า `/access`
- current access ต้องถูก resolve ก่อนเข้า app หลัก
- dashboard เป็น personalized landing page ไม่ใช่หน้ารวมทุกอย่าง
- sidebar เป็น app shell หลัก
- ไม่ใช้ global headbar ใหญ่เป็น baseline
- user/access/current context ต้องดูได้จาก shell ไม่ใช่พึ่ง popup
- notification center หลักอยู่ที่ bell icon ใน sidebar
- toast feedback อยู่ใน main content
- sub navigation ของ area ต่าง ๆ ให้อยู่ในหน้า ไม่ใช่ multi-level dropdown sidebar
- chart standard ของระบบคือ **Apache ECharts**
- modal / confirmation standard ของระบบคือ **MUI Dialog**
- side panel standard ของระบบคือ **MUI Drawer**
- feedback toast standard ของระบบคือ **notistack**
- inline alert standard ของระบบคือ **MUI Alert**
- source tree ต้องแยก `app`, `contexts`, `lib`, `modules`, `components`, `theme`, `types`, `utils` อย่างชัดเจน
- `src/contexts/` คือ shared app-level contexts and providers
- `src/features/<module>/contexts/` เป็น optional และส่วนใหญ่ไม่ควรต้องใช้
- provider หลักของระบบต้องอยู่ใน `src/contexts/`
- ไฟล์ context ต้องใช้รูปแบบ `XxxContext.tsx` และ export `XxxProvider`
- `ThemeProvider` ต้องอยู่ใน `ThemeContext.tsx`
- `src/core/theme/` ใช้เก็บ theme assets, tokens และ theme builders
- UI ต้องใช้ Model ไม่ใช้ DTO
- business data ต้องผ่าน Service
- permission checks ต้องเป็นหลายชั้น ไม่ใช่ใช้การซ่อนเมนูอย่างเดียว
- work pages ต้องใช้หลัก **viewport-first** และพยายามให้ผู้ใช้ทำงานใน viewport หลัก
- tables ต้องรองรับ pagination, page size options และ internal scroll patterns ที่ชัด
- docs tree เดิมยังคงเดิม แต่เนื้อหาภายในจะถูกอัปเดตให้ตรงกับ baseline ใหม่นี้ และไฟล์ 14 จะทำหน้าที่เป็น **Q/A workbook สำหรับใช้สั่ง AI แก้ docs ต่อ**
