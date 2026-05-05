# 04 SAP Sync Offline And Integration

ไฟล์นี้สรุปข้อจำกัดเชิง integration ที่มาจาก meeting notes และ requirement โดยตรง

## Integration Principles

1. SAP เป็น master ของข้อมูลองค์กร
2. FarmHUB เป็นระบบบันทึกงานหน้างานรายวันแบบ real-time
3. การเชื่อมต่อ SAP ต้องผ่านชั้น collect/convert/sync
4. ต้องมีสถานะติดตามการส่งข้อมูลเข้า SAP

## Integration Flow ที่ควรเป็น

```text
Farm Transaction (FarmHUB)
-> Validate + Audit
-> Queue for Sync
-> Collect/Convert (SAP format)
-> Send to SAP
-> Receive Result
-> Update Sync Status
-> Retry/Alert if failed
```

## Offline Requirement

- ต้องบันทึกได้แม้ไม่มี wifi
- ทุก transaction ต้องมี timestamp ชัดเจน
- เมื่อออนไลน์กลับมา ต้อง sync ตามลำดับและไม่ทำข้อมูลซ้ำ

## Data Integrity Rule

- ไม่อนุญาตลบ/แก้ทับ transaction ที่โพสต์แล้ว
- ถ้าต้องแก้ ใช้ reversal (`+เข้า` / `-ออก`) พร้อมเหตุผล
- audit trail ต้องอ่านย้อนกลับได้ว่าใครแก้อะไร เมื่อไร

## Frontend Implications

- มีสถานะ sync ใน UI เช่น `Pending`, `Synced`, `Failed`, `Retrying`
- เอกสารที่ยังไม่ sync สำเร็จต้องเห็นชัดใน dashboard/queue page
- กรณีแก้ไขหลังโพสต์ ให้ UX นำทางไป reversal flow แทน delete/edit ปกติ

## Suggested Minimum Technical Contract

1. ทุก event มี `eventId` ที่ไม่ซ้ำ
2. มี `sourceSystem`, `createdAt`, `createdBy`, `facilityContext`
3. มี `syncStatus` + `syncAttemptCount` + `lastSyncError`
4. มี endpoint/query สำหรับดูเอกสารค้างส่ง SAP

