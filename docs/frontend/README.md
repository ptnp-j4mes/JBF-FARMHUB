# Frontend Docs Index

เอกสารชุดนี้เป็นแนวทางสถาปัตยกรรมและมาตรฐานฝั่ง frontend ที่ต้องยึดทิศทางเดิม แต่ทำ rollout ตามข้อจำกัดของโปรเจกต์จริง

## เริ่มจากไฟล์นี้ก่อน

1. `00_frontend_project-alignment.md` (map เอกสารเดิมให้เข้ากับโครงสร้างจริงของ repo)

## เอกสารหลัก (แนะนำลำดับอ่าน)

1. `01_frontend_overview.md`
2. `02_frontend_architecture.md`
3. `03_frontend_infrastructure.md`
4. `04_frontend_auth-access.md`
5. `05_frontend_type-guidelines.md`
6. `06_frontend_mapper-guidelines.md`
7. `07_frontend_api-usage.md`
8. `12_frontend_ui-design-standards.md`
9. `13_frontend_requirements.md`
10. `14_frontend_requirements-questions.md`
11. `15_frontend_menu-taxonomy-th.md`
12. `18_frontend_prompt-green-dashboard-table.md`

## หลักการนำไปใช้

- ใช้เอกสารเป็น **target architecture**
- ใช้โค้ดปัจจุบันเป็น **delivery baseline**
- ถ้าเจอ gap ให้แตกเป็น phase migration ไม่ทำ big-bang refactor

## เอกสาร Requirement ภายนอก (Business Inputs)

หากต้องอ้าง requirement จากเอกสารภายนอก ให้ไปที่ `../requirements/README.md`  
และใช้ร่วมกับเอกสารชุด frontend แบบ overlay ไม่ merge รวมเป็นไฟล์เดียว
