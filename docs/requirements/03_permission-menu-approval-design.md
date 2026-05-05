# 03 Permission Menu Approval Design

ไฟล์นี้สรุปแนวทาง permission/menu/approval ที่ควรใช้กับโปรเจกต์ปัจจุบัน โดยยึดของเดิมที่ดีอยู่แล้วก่อน

## สถานะโค้ดปัจจุบัน (สำคัญ)

- มี `frontend/src/middleware.ts` อยู่แล้ว และทำ route-level authentication gate
- มี `AccessGuard` สำหรับ role/permission check ระดับหน้าและ section
- `RoleContext` เป็น compatibility wrapper ที่ deprecated (`frontend/src/contexts/RoleContext.tsx`)
- side menu filter ตาม role + `requiredPermissionCodes` จาก navigation tree (`frontend/src/components/layout/SideMenu.tsx`)
- `frontend/src/core/config/menu.config.ts` ทำหน้าที่ transform tree จาก DB เป็น menu groups เท่านั้น

## ข้อสรุป

- ระบบ **ไม่ได้ไม่มี middleware** แต่ middleware ปัจจุบันเน้น auth gate (ไม่ใช่ authorization ลึกทั้งหมด)
- แนวทางเดิมเรื่อง access ควรเก็บไว้ แล้วเพิ่ม policy mapping ให้ชัดขึ้น

## Permission Code Design (Current Baseline)

รูปแบบมาตรฐานที่ระบบปัจจุบันใช้จริง

```text
module.resource.action
```

ตัวอย่าง

- `admin.user_assignment.view`
- `admin.user_assignment.edit`
- `operations.stock.view`
- `warehouse.material_stock.manage`
- `reports.center.export`

กติกา

1. lowercase + dot notation เท่านั้น
2. `code` ต้องตรงกับค่าใน DB (`permissions.code`) และเป็น canonical เสมอ
3. `action` ใช้ชุดคำมาตรฐาน: `view|add|edit|submit|soft_delete|hard_delete|approve|reject|export|manage|upload`
   - ไม่มี legacy alias mapping ใน runtime; DB ต้องเก็บค่า canonical ตามชุดนี้เท่านั้น
4. `module`/`resource` เป็น `snake_case` และ `.` ใช้เป็นตัวคั่นระหว่าง `module.resource.action` เท่านั้น (ถ้าชื่อยาวให้ใช้ `_`)
5. check ระดับ action ใช้ permission code ไม่ใช้ route string ตรง ๆ
6. `super_admin` เป็น bypass flag ของผู้ใช้ ไม่ใช่ action หรือ permission code ใน DB

## Menu Thinking Model

เมนูควรคิดเป็น “navigation by business area” ไม่ใช่ “permission table”

```text
App
├── Operations
│   ├── Dashboard
│   ├── Record
│   ├── Farm Info
│   ├── Stock
│   ├── Feeding
│   └── Health
├── Production
│   ├── Open House
│   ├── Activity Daily
│   ├── Building Opening
│   ├── Material Stock
│   ├── Purchase Request
│   └── Construction
├── Reports
│   ├── Center
│   ├── Stock
│   ├── Activity Daily
│   ├── Approvals
│   ├── Analytics
│   └── Notifications
└── Admin
    ├── Users
    ├── Master Data
    ├── Documents
    ├── Settings
    └── Menu Management
```

หมายเหตุ

- menu ใช้เพื่อค้นหา feature
- permission ใช้เพื่ออนุญาต action
- route ไม่ใช่ permission model

## Approval Design (ตามเอกสาร HR และ requirement)

โมเดล approval ควรเป็น data-driven

```text
Document Type + Amount + Farm Context
-> Resolve Approval Workflow Template
-> Resolve Step Chain (1..N)
-> Create Approval Request
-> Approver Action (approve/return/reject)
-> Persist Approval History + Audit
```

สิ่งที่ต้องรองรับ

- chain ต่างกันตาม farm/phase/หน้าที่
- จำนวนชั้นอนุมัติไม่ตายตัว
- เปลี่ยนผู้อนุมัติได้โดยไม่ deploy โค้ด

## Middleware ควรทำอะไร และไม่ควรทำอะไร

สิ่งที่ควรอยู่ใน middleware

- ตรวจ session/auth cookie
- route-level redirect (public/protected)

สิ่งที่ไม่ควรยัดทั้งหมดใน middleware

- rule ลึกระดับ document action
- business authorization ที่ต้องใช้ข้อมูล domain ล่าสุด

authorization ระดับลึกควรอยู่ที่ API/backend และมี frontend guard เป็น UX safety layer

## ข้อแนะนำเชิงปรับปรุงแบบไม่รื้อระบบ

1. คง `middleware.ts` เดิมเป็น auth gate
2. ใช้ `AccessGuard` เป็นมาตรฐานเดียวแทนการกระจายเงื่อนไข ad-hoc
3. ลดการอ้าง `RoleContext` ใหม่ เพราะเป็น wrapper deprecated
4. สร้าง permission catalog กลางจาก backend แล้วให้ guard ฝั่ง UI อ่านจากข้อมูลจริง เช่น
   - `warehouse.guard` โหลด `/api/AuthModels/permissions`, filter `module === 'warehouse'`, แล้ว group ตาม `resource`/`action`
   - `production.guard` โหลด `/api/AuthModels/permissions`, filter `module === 'production'`, แล้ว group ตาม `resource`/`action`
   - route family กับ permission module ไม่จำเป็นต้องตรงกันเสมอไป ถ้าหน้าใดอิง permission canonical ของ warehouse ให้ใช้ `warehouse.guard` ถึงแม้ route จะอยู่ใต้ `/production/*`
   - `user-assignment.guard` ใช้กับ `admin.user_assignment.*` และแท็บกำหนดสิทธิจะอ่าน override จาก `GET /api/AuthModels/user-permission-overrides/{userAssignmentId}`
   - เมนูใช้ `requiredPermissionCodes` จาก tree ตรง ๆ
5. เพิ่ม test scenario สำหรับ role/scope/menu filtering ที่ critical
