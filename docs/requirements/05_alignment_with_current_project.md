# 05 Alignment With Current Project

ไฟล์นี้ map ระหว่าง requirement ภายนอกกับโค้ดจริงของโปรเจกต์ เพื่อวางแผนปรับแบบ incremental

## Current Project Shape (สรุป)

```text
JBFarmHUB/
├── backend/   # .NET API
└── frontend/  # Next.js + TypeScript + MUI
```

## สิ่งที่สอดคล้องแล้ว

- มี auth/session flow และ route middleware
- มี access/role/permission/scope model ฝั่ง frontend
- มี menu filtering ตาม role/permission
- มีแนวคิดแยก data source ของ users module (`api` / `mock`)
- เอกสาร frontend/workflow/database ถูกแยกเป็นชุดชัดเจน

## Gap ที่ยังเห็นจาก requirement ภายนอก

1. approval matrix ตาม farm ยังต้องชัดเรื่อง data model และ maintenance flow
2. sync tracker ที่เจาะ SAP integration status ยังต้องยืนยัน endpoint และ UX หน้าติดตาม
3. offline + reversal behavior ต้องชัดในหลายโมดูล ไม่ใช่เฉพาะบางหน้า
4. trace chain ข้ามโมดูล (PR -> receive -> issue -> cost/sale) ต้องสื่อใน UI มากขึ้น

## แนวทางปรับโดยไม่รื้อทั้งโปรเจกต์

## Phase A: Stabilize Baseline

- ยืนยันทุก env ที่ใช้งานจริงเป็น `api` ใน branch หลักที่ใช้ทดสอบ
- ปิด silent fallback ที่ทำให้ผู้ใช้สับสนว่าใช้ mock หรือ api
- เพิ่มป้ายสถานะ data source ในหน้าที่ critical

## Phase B: Access + Approval Hardening

- ใช้ permission code แบบมาตรฐานเดียว
- map menu slug -> permission module ให้ครบ
- ออกแบบ approval workflow config ที่ผูก farm context ได้

## Phase C: Integration Visibility

- เพิ่ม sync status UI และ queue/retry visibility
- เพิ่ม reporting สำหรับเอกสารค้าง sync และเอกสารล้มเหลว

## กติกาที่ควรยึดเมื่อพัฒนาเพิ่ม

1. ยึดของเดิมที่ดีอยู่แล้วก่อน โดยเฉพาะ access model ปัจจุบัน
2. ถ้า requirement ใหม่ชนกับโค้ดจริง ให้เปิด gap แล้วค่อย migrate เป็นเฟส
3. หลีกเลี่ยง big-bang refactor
4. ให้ backend contract เป็น source of truth สำหรับ behavior runtime

