# Requirements External Package

โฟลเดอร์นี้ใช้เก็บ requirement จากเอกสารธุรกิจภายนอกโปรเจกต์ เพื่อให้ทีมและ AI อ้างอิงเพิ่มได้โดยไม่ทำให้ baseline ฝั่ง frontend ปนกัน

## ทำไมแยกจาก `frontend/13_frontend_requirements.md`

- `frontend/13_frontend_requirements.md` = baseline ฝั่ง frontend ที่ผูกกับโครงสร้างโค้ดปัจจุบัน
- `requirements/*` = requirement จากเอกสาร business, proposal, meeting notes และ approval matrix
- การแยกแบบนี้ช่วยลด requirement drift และลดความเสี่ยงแก้ requirement ฝั่ง implementation บ่อยเกินจำเป็น

สรุป: **ไม่ควรรวมทุกอย่างลงไฟล์ requirement เดียวของ frontend**  
ควรแยกเป็นแพ็กนี้ แล้วเชื่อมด้วย reference

## โครงสร้าง

```text
requirements/
├── sources/     # ไฟล์ต้นฉบับที่รับมาจากภายนอก
├── extracted/   # text extract สำหรับ AI parser
├── 01_external-requirements-summary.md
├── 02_business-workflows-and-rules.md
├── 03_permission-menu-approval-design.md
├── 04_sap-sync-offline-and-integration.md
└── 05_alignment_with_current_project.md
```

## ลำดับการใช้งานสำหรับ AI/ทีม

1. เริ่มที่ `01_external-requirements-summary.md`
2. อ่าน `02_*` และ `04_*` ถ้ากระทบ workflow/integration
3. อ่าน `03_*` ถ้ากระทบ access/permission/menu/approval
4. ปิดท้าย `05_alignment_with_current_project.md` ก่อนสรุปงาน implementation

## Priority ของข้อมูล (เมื่อขัดกัน)

1. โค้ดจริง + API contract ปัจจุบัน (ของ repo นี้)
2. ข้อกำหนดธุรกิจที่ยืนยันจากเอกสาร requirement/meeting notes
3. เอกสาร proposal/ROI/vision (ใช้เป็น strategic direction)

## ข้อควรระวังข้อมูลอ่อนไหว

- ไฟล์สายอนุมัติมีข้อมูลส่วนบุคคล (ชื่อ, โทรศัพท์, อีเมล)
- ในไฟล์สรุปให้ใช้นโยบายเชิงโครงสร้าง (role/สายอนุมัติ/ฟาร์ม) มากกว่าคัดลอก PII ตรง ๆ
- หากต้องใช้รายชื่อจริง ให้ดึงจาก `sources/` ตามสิทธิ์การเข้าถึงข้อมูลเท่านั้น

