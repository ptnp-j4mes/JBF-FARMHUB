# 12_workflow_finance.md

## วัตถุประสงค์
กำหนดการไหลงานการเงินตั้งแต่รวมต้นทุน ปิดงวด และรายงานกำไรขาดทุน

## ขอบเขตโมดูล
- ต้นทุน
- ปิดงวด
- กำไรขาดทุน

## Mermaid Flow
```mermaid
flowchart LR
  A["Collect transactions"] --> B["Cost allocation"]
  B --> C["Reconcile and validate"]
  C --> D["Close accounting period"]
  D --> E["Generate P&L"]
  E --> F["Management review"]
```

## ขั้นตอนการทำงานหลัก
1. รับธุรกรรมต้นทางจาก purchase/warehouse/production/sales
2. คำนวณและจัดสรรต้นทุนตามกติกา
3. ตรวจสอบความครบถ้วนและความสัมพันธ์บัญชี
4. ปิดงวดและล็อกข้อมูล
5. สร้างรายงานกำไรขาดทุนและส่งผู้บริหาร

## ทางเลือกและข้อยกเว้น
- พบข้อมูลไม่ครบก่อนปิดงวด: บล็อกการ close
- ต้อง reopen งวด: ทำได้เฉพาะสิทธิ์ระดับสูง

## Business Rules
- งวดที่ปิดแล้วห้ามแก้รายการโดยตรง
- ทุก adjustment ต้องมีเหตุผลและ audit

## จุดเชื่อมต่อ
- Sales revenue
- Inventory valuation
- Production operational cost

## KPI
- close period duration
- reconciliation error count
- gross margin accuracy
