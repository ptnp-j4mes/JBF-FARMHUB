# 02 Business Workflows And Rules

ไฟล์นี้แตก workflow และกติกาธุรกิจที่ควรถือเป็นแกนร่วมของระบบ จากเอกสาร requirement + meeting updates

## Workflow หลักแบบย่อ

```text
Login
-> Resolve Role/Permission/Scope
-> Select Working Context (Farm/Phase/House/Warehouse)
-> Execute Module Workflow
-> Approval (if required)
-> Apply Business Impact
-> Notify
-> Audit
-> Sync (where required)
```

## Event Pipeline กลาง (ต้องใช้ร่วมกันทุกโมดูล)

```text
Create
-> Validate (permission + scope + business rule)
-> Apply Impact (stock/batch/status/cost)
-> Notify (alert/task)
-> Audit (immutable history)
```

## กฎธุรกรรมสำคัญ

1. PR ไม่เพิ่ม stock โดยตรง
2. stock เพิ่มเมื่อ receive จริง
3. stock ลดเมื่อ issue/transfer/use จริง
4. lot/expiry policy ต้อง enforce ตอน transaction
5. ธุรกรรมสำคัญต้องมี audit trail
6. รายการที่โพสต์แล้วไม่ควรถูกลบหรือแก้ทับ ให้ใช้ reversal แทน

## Workflow รายโมดูล (canonical)

## Purchase

```text
Draft PR
-> Submit
-> Approval (approve/return/reject)
-> Approved PR ready for receiving
```

## Warehouse

```text
Receive
-> Transfer
-> Issue
-> Adjust (optional approval)
-> Monitor (balance + movement + expiry risk)
```

## Production

```text
Open Batch
-> Move Batch
-> Consume via Issue
-> Record Mortality/Weight
-> Close Batch (after sale)
```

## Vaccine

```text
Plan
-> Generate Task
-> Vaccination Event
-> Deduct Stock (lot-aware)
```

## Sales

```text
Sales Order
-> Delivery
-> Weighing
-> Invoice
-> Batch Closing Trigger
```

## Maintenance/Project

```text
Work Request
-> Approval
-> Work Order
-> Sparepart Issue
-> Work Close
```

## Finance (Farm Ops Costing)

```text
Collect Cost Entries
-> Batch Cost Summary
-> Batch Closing
-> Profit/Loss Snapshot
```

หมายเหตุ: scope การเงินในเอกสาร requirement คือเชิงบริหารฟาร์ม ไม่ใช่บัญชีเต็มรูปแบบแทน SAP

## Integration Rule

- SAP เป็น master
- FarmHUB เป็น operational record
- ต้องมี sync status tracking สำหรับเอกสารที่ส่ง SAP

## Frontend Implications (ไม่ต้องรื้อทั้งระบบ)

- page/form ทุกจุดต้องแสดง transaction state ชัด
- action button ต้องผูก permission + scope + document status
- ต้องมี UX สำหรับ reversal มากกว่า delete/edit ทับรายการ
- list/report ควรเห็น trace chain ของเอกสารที่เชื่อมกัน

