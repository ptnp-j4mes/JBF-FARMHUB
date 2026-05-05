# 15_frontend_menu-taxonomy-th.md

# Frontend Menu Taxonomy (TH)

ไฟล์นี้สรุปชื่อเมนูภาษาไทยที่ควรใช้เป็นมาตรฐานเดียวกัน พร้อมผูกกับ route และ module owner

## หลักการตั้งชื่อ

1. ชื่อเมนูใช้ภาษาไทยให้สม่ำเสมอ
2. ชื่อเมนูต้องสื่อ “งาน” ไม่ใช่ชื่อเทคนิค
3. 1 เมนู = 1 intent หลัก (เลี่ยงชื่อซ้ำ)
4. ชื่อเมนู (label) แยกจาก permission code และแยกจาก route

## เมนูมาตรฐาน (ASCII Tree)

```text
FarmHUB
├── การดำเนินงาน
│   ├── แดชบอร์ด                   (/operations/dashboard)
│   ├── บันทึกข้อมูล                (/operations/record)
│   ├── ข้อมูลรายฟาร์ม             (/operations/farm-info)
│   ├── สต็อกสุกร                  (/operations/stock)
│   ├── การให้อาหาร                (/operations/feeding)
│   └── สุขภาพและการรักษา          (/operations/health)
├── การผลิตและคลัง
│   ├── ข้อมูลโรงเรือน             (/production/open-house)
│   ├── บันทึกกิจกรรมประจำวัน      (/production/activity-daily)
│   ├── เปิดโรงเรือน               (/production/building-opening)
│   ├── คลังวัสดุ                  (/warehouse/material-stock)
│   ├── ใบขอซื้อวัสดุ              (/warehouse/purchase-request)
│   └── โครงการก่อสร้าง            (/production/construction)
├── รายงาน
│   ├── ศูนย์รวมรายงาน             (/reports/center)
│   ├── รายงานคลังสินค้า            (/reports/stock)
│   ├── รายงานบันทึกข้อมูลประจำวัน  (/reports/activity-daily)
│   ├── อนุมัติบันทึกข้อมูลประจำวัน (/reports/activity-daily-approvals)
│   ├── อนุมัติปิดรุ่นการเลี้ยง     (/reports/batch-closing-approvals)
│   ├── วิเคราะห์ข้อมูล             (/reports/analytics)
│   └── การแจ้งเตือน               (/reports/notifications)
└── ผู้ดูแลระบบ
    ├── จัดการผู้ใช้งาน            (/admin/user-assignment)
    ├── ข้อมูลหลัก                 (/admin/master-data)
    ├── ระบบเอกสาร                 (/admin/documents)
    ├── ตั้งค่าระบบ                (/admin/settings)
    └── จัดการเมนู                 (/admin/menu-management)
```

## จุดที่ควรแก้จากสถานะโค้ดปัจจุบัน

1. แก้ label อังกฤษ `Menu Management` เป็น `จัดการเมนู`
2. แก้ชื่อเมนู `productionOpenHouse` จาก “เปิดโรงเรือน” เป็น “ข้อมูลโรงเรือน” เพื่อลดชนกับ `building-opening`
3. ใช้คำ “และ” แทน “&” ใน label ไทยเพื่อคงสไตล์เดียวกัน

## Route Group vs Module Owner (ปัจจุบัน)

- Route layer: `src/app/(main)/(operations|production|reports|admin)/**/page.tsx`
- Module owner: `src/features/<module>/**`
- Guard/menu/filter layer: `src/components/layout/*` + `src/components/guards/*`
- Auth/access layer: `src/features/auth/*` + `src/contexts/*` + `src/middleware.ts`

## สถานะความชัดเจนของการแยกหน้าที่

โดยรวม: **ชัดระดับใช้งานจริง แต่ยังไม่สุด**

จุดที่ชัดแล้ว

- route ส่วนมากเป็น wrapper แล้วส่งต่อให้ feature page
- มีการแยก auth/access/menu/guard คนละชั้น
- มี route group แบ่งโดเมนหลักชัดเจน

จุดที่ยังควรปรับ

- บางหน้าใน `app/` ยังเป็น placeholder โดยตรง (ยังไม่เป็น feature owner เต็ม)
- มี cross-module coupling บางจุด เช่น reports ไปใช้ component จาก production
- naming บางส่วนยังไม่ตรง intent ธุรกิจ 100%
