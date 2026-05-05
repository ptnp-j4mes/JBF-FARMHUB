# 14_frontend_requirements-questions.md

# Frontend Requirements Questions

ไฟล์นี้เป็น Q/A workbook สำหรับรีวิว requirement ของ frontend เป็นรอบ ๆ และใช้บันทึกผลกระทบต่อเอกสารไฟล์อื่น

บทบาทของไฟล์นี้คือ

- เช็กว่า requirement เดิมยังใช้ได้จริงหรือไม่
- เก็บ requirement ใหม่ที่ต้องเพิ่ม
- ระบุ requirement ที่ควรถอดหรือเลิกใช้
- ผูกคำตอบแต่ละข้อเข้ากับไฟล์ docs ที่ต้องอัปเดตต่อ

---

## 1. วิธีใช้ไฟล์นี้

ใช้ไฟล์นี้เป็น checklist ก่อนตัดสินใจเปลี่ยน requirement หรือก่อนเริ่มงานใหญ่ เช่น

- ก่อนเริ่ม restructure frontend รอบใหญ่
- ก่อน kickoff sprint ที่มี impact ข้ามหลาย module
- หลังมีการประชุมเปลี่ยน process หน้างาน/สายอนุมัติ
- หลังเปลี่ยนข้อกำหนด integration กับ backend

วิธีบันทึกคำตอบที่แนะนำ

- ตอบสั้น ชัด มี decision ชัดเจน
- ถ้า “ยังไม่ชัด” ให้ระบุ owner + due date ที่จะสรุป
- ถ้าคำตอบกระทบ behavior ของระบบ ให้เพิ่ม action item ว่าต้องแก้ไฟล์ใดบ้าง

---

## 2. System Scope Questions

1. product areas ปัจจุบันที่ frontend ต้องรองรับมีอะไรบ้าง (ต้องการเพิ่ม/ตัด module ใด)
2. route/menu intent ของแต่ละ area ยังตรงกับ workflow จริงหรือไม่
3. มี process ไหนที่เคยอยู่ในระบบแต่เลิกใช้แล้วและควรถอด requirement ออก
4. มี process ใหม่ที่เริ่มใช้จริงแล้วแต่ยังไม่มี requirement ใน docs หรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `13_frontend_requirements.md`
- `02_frontend_architecture.md`
- `10_frontend_naming-conventions.md`

---

## 3. Auth & Access Questions

1. post-login flow ปัจจุบันยังต้องเข้า `/access` ในกรณี multiple assignments เหมือนเดิมหรือไม่
2. current access summary ที่ shell ต้องแสดงมี field เพิ่ม/ลดอะไรบ้าง
3. permission model เปลี่ยน naming หรือ granularity หรือไม่
4. permission mapping 2 ชั้นยังถูกต้องไหม (backend canonical permissions -> frontend menu/page/section/action/data guards)
5. มี area ใหม่ที่ต้อง enforce page/section/action/data guard เพิ่มไหม
6. มี policy ใหม่สำหรับ no-access/access-denied/session-expiry หรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `04_frontend_auth-access.md`
- `05_frontend_type-guidelines.md`
- `11_frontend_backend-frontend-mapping.md`
- `12_frontend_ui-design-standards.md`

---

## 4. Workflow & Module Questions

1. workflow หลักของแต่ละ module ยังเหมือน baseline หรือไม่ (farm, purchase, warehouse, production, health, sales, maintenance, finance)
2. มี module ไหนที่ business owner เปลี่ยน (เช่น route เดิมแต่ owner ใหม่)
3. cross-module flow ใดเพิ่ม/ลด เช่น purchase -> warehouse -> production -> finance
4. มี state ใหม่ที่กระทบหลายโมดูล เช่น pending sync, integration warning, approval escalation

ไฟล์ลงลึกที่เกี่ยวข้อง

- `13_frontend_requirements.md`
- `02_frontend_architecture.md`
- `07_frontend_api-usage.md`
- `11_frontend_backend-frontend-mapping.md`

---

## 5. UI/UX Questions

1. shell pattern ยังยึด `Sidebar + Main Content` หรือมีการเปลี่ยน
2. notification center / toast / inline alert boundary ยังเหมือนเดิมหรือไม่
3. มาตรฐาน table/form/dialog/drawer ต้องปรับจาก feedback หน้างานหรือไม่
4. สถานะสำคัญ (loading/empty/error/access/offline/sync/integration) เพียงพอหรือยัง
5. Thai-first wording มีคำที่ควรเปลี่ยนเพื่อความชัดเจนหรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `12_frontend_ui-design-standards.md`
- `09_frontend_component-guidelines.md`
- `02_frontend_architecture.md`

---

## 6. Data & Integration Questions

1. backend contract ที่ frontend ใช้อยู่มี breaking changes หรือไม่
2. field mapping สำคัญไหนที่ต้องปรับใน DTO -> Model / FormModel -> DTO
3. data source policy (api/mock) ของแต่ละ module ต้องเปลี่ยนหรือไม่
4. cache invalidation rules มีจุดที่ stale บ่อยหรือผิดบริบท access หรือไม่
5. integration กับระบบภายนอกมี status ใหม่ที่ UI ต้องรองรับเพิ่มหรือไม่

หมายเหตุ baseline ปัจจุบัน

- Frontend stack เชื่อมกับ backend ผ่าน current API/BFF contract (ไม่ผูกกับ implementation language)
- เอกสาร requirement จากธุรกิจใช้เป็นแนวทาง แต่ implementation truth ต้องยึด contract ปัจจุบันที่ backend ส่งจริง

ไฟล์ลงลึกที่เกี่ยวข้อง

- `07_frontend_api-usage.md`
- `06_frontend_mapper-guidelines.md`
- `05_frontend_type-guidelines.md`
- `11_frontend_backend-frontend-mapping.md`
- `03_frontend_infrastructure.md`

---

## 7. Approval & Organization Questions

1. สายอนุมัติปัจจุบัน (รวมกรณีแยกรายฟาร์ม) เปลี่ยนจาก baseline เดิมหรือไม่
2. เงื่อนไขอนุมัติแยกตามวงเงิน/บทบาท/พื้นที่เปลี่ยนไหม
3. approval actions ที่ต้องเก็บ audit เพิ่มเติมมีหรือไม่
4. มี SLA ใหม่สำหรับงานค้างอนุมัติหรือ escalation หรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `04_frontend_auth-access.md`
- `13_frontend_requirements.md`
- `11_frontend_backend-frontend-mapping.md`

---

## 8. Tech/Infra Questions

1. package baseline มีการเปลี่ยนที่ต้องอัปเดตเอกสารหรือไม่
2. runtime policy ด้าน timeout/retry/offline/persistence ยังเหมาะกับงานจริงหรือไม่
3. performance bottleneck ที่พบบ่อยอยู่ที่ชั้นใด (shell/page/query/table)
4. มี infra decision ใหม่ที่ต้องบันทึกใน docs หรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `03_frontend_infrastructure.md`
- `02_frontend_architecture.md`
- `07_frontend_api-usage.md`

---

## 9. Naming & Documentation Questions

1. naming ที่ใช้อยู่ใน code ยังตรง naming docs ปัจจุบันหรือไม่
2. route/module/component naming มีจุดกำกวมที่ทำให้ implement ผิดซ้ำหรือไม่
3. docs tree / filename pattern ยังสอดคล้องกันทุกไฟล์หรือไม่
4. มีลิงก์ข้ามไฟล์ที่เสียหรืออ้างไฟล์ผิดชื่อหรือไม่

ไฟล์ลงลึกที่เกี่ยวข้อง

- `10_frontend_naming-conventions.md`
- `01_frontend_overview.md`
- `02_frontend_architecture.md`

---

## เมื่อไรต้องอัปเดตไฟล์นี้

อัปเดตไฟล์นี้เมื่อเกิดอย่างน้อยหนึ่งข้อดังต่อไปนี้

- requirement หรือ policy ของ business เปลี่ยน
- flow งานจริงหน้างานเปลี่ยนและกระทบการใช้งานหน้า
- backend contract/permission/scope เปลี่ยนจน behavior ฝั่ง frontend เปลี่ยน
- มีการปรับโครงสร้าง route/module/folder ที่เกี่ยวข้องกับไฟล์นี้
- พบว่าทีม implement ผิดซ้ำเพราะเอกสารยังกำกวม

---

## 10. สรุปผล Review รอบนี้ (Template)

- วันที่ review:
- ผู้เข้าร่วม:
- ประเด็นที่ยืนยันว่า “ยังเหมือนเดิม”:
- ประเด็นที่ “ต้องเปลี่ยน requirement”:
- ประเด็นที่ “ต้องเปิดคำถามต่อ”:
- รายการไฟล์ที่ต้องอัปเดตทันที:
- รายการไฟล์ที่อัปเดตรอบถัดไป:

---
