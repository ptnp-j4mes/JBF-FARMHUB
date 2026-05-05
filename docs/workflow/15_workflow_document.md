# 15_workflow_document.md

## วัตถุประสงค์
จัดการ lifecycle เอกสารประกอบงานให้ค้นหาได้ง่าย มีสิทธิ์ควบคุม และรองรับการตรวจสอบย้อนหลัง

## ขอบเขตโมดูล
- อัปโหลดเอกสาร
- จัดหมวดและ metadata
- เชื่อมเอกสารกับ record ธุรกิจ
- ดาวน์โหลด/เรียกดู

## Mermaid Flow
```mermaid
flowchart LR
  A["Upload file"] --> B["Set metadata"]
  B --> C["Link to business record"]
  C --> D["Apply access control"]
  D --> E["View/Download/Search"]
  E --> F["Audit access history"]
```

## ขั้นตอนการทำงานหลัก
1. ผู้ใช้แนบไฟล์จากธุรกรรมหรือหน้าเอกสารกลาง
2. ระบุหมวดเอกสารและข้อมูลกำกับ
3. ผูกเอกสารกับเอกสารธุรกิจ (เช่น PR, invoice)
4. บังคับใช้สิทธิ์ดู/แก้ไขตาม role/scope
5. รองรับค้นหาและโหลดไฟล์ย้อนหลัง

## Validation
- รองรับชนิดไฟล์และขนาดตามนโยบาย
- ห้ามลบไฟล์ที่ผูกกับเอกสารปิดงวด (ถ้านโยบายกำหนด)

## KPI
- document retrieval time
- upload failure rate
- missing attachment incidents
