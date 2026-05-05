# Workflow Docs Index

เอกสารชุดนี้อธิบาย flow ธุรกิจของระบบแบบรายโมดูล โดยยึดแนวคิดเดิมของ FarmHUB และปรับให้ใช้กับโปรเจกต์ปัจจุบันแบบ incremental

## วิธีอ่าน

1. เริ่มที่ `01_workflow_overview.md`
2. อ่าน flow รายโมดูลตามลำดับธุรกิจ (auth/access -> master -> transaction -> approval -> report)
3. ปิดท้ายด้วย cross-module (`17_workflow_cross-module.md`) และ notification (`18_workflow_notification.md`)
4. ถ้าต้องการแนวทาง notification ที่เป็น routing กลาง ดู `20_workflow_notification-routing.md`

## หมายเหตุการใช้งานกับโค้ดจริง

- เอกสารนี้คือ target direction
- ตอน implement ให้ยึดโค้ดปัจจุบันเป็น baseline แล้ว migrate ทีละจุด
- หลีกเลี่ยงการ rewrite ทั้งระบบในครั้งเดียว
- รายละเอียด routing ของ Purchase ระหว่าง `ExternalPurchase` และ `CentralBooking` ดู `19_workflow_purchase-central-routing.md`
- แนวทาง notification แบบ routing กลาง ดู `20_workflow_notification-routing.md`
