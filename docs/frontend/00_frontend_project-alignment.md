# 00_frontend_project-alignment.md

# Frontend Project Alignment (Current vs Target)

ไฟล์นี้มีไว้เพื่อให้เอกสาร architecture เดิม “ใช้กับโปรเจกต์จริงตอนนี้ได้ทันที” โดยไม่บังคับรื้อทั้งระบบ

## เป้าหมาย

1. ยึดแนวคิดเดิมของ docs ชุดนี้ (feature-first, DTO/mapper, access-aware UI, shared patterns)
2. map ให้ตรงกับโครงสร้างจริงใน repo ปัจจุบัน
3. วางแผน migrate แบบ incremental

## ภาพรวมทั้งโปรเจกต์ (Project-wide Context)

```text
JBFarmHUB/
├── backend/   # .NET API + business rules + DB access
└── frontend/  # Next.js UI + BFF routes + feature modules
```

หลักการทำงานร่วมกัน:

- backend เป็นเจ้าของ domain truth และ persistence
- frontend เป็นเจ้าของ UX flow, composition และ view models
- contract ระหว่างสองฝั่งให้คั่นด้วย DTO + mapper (ไม่รั่วเข้า UI ตรง ๆ)

## โครงสร้างจริงในโปรเจกต์ตอนนี้ (As-Is)

```text
src/
├── app/           # route groups + layout + API route handlers
├── features/      # business modules (ของจริงตอนนี้)
├── core/          # shared runtime/core libs (api, theme, config, i18n)
├── contexts/      # app-level providers
├── components/    # shared UI blocks
├── lib/           # helpers/utilities
└── types/         # shared types
```

## Mapping แนวคิดเดิม -> โครงสร้างจริง

- `src/features/*` ใน docs เดิม -> ใช้ `src/features/*` ในโค้ดจริง
- shared platform layer -> กระจายอยู่ใน `src/core`, `src/lib`, `src/contexts`, `src/components`
- route adapter layer -> `src/app/(main)/**/page.tsx` และ `layout.tsx`

## Architecture ที่แนะนำ (ไม่ต้องรื้อทั้งหมด)

```text
Route Adapter (app/*)
-> Feature Page (features/*/pages)
-> Feature Services (features/*/services)
-> DTO Mapper Layer (services + mappers)
-> Shared Core (core/lib/contexts/components)
```

กติกาสำคัญ:

1. UI/page ห้ามใช้ DTO ตรง
2. ให้แปลงผ่าน mapper ก่อนเป็น model เสมอ
3. logic data-fetch และ orchestration อยู่ที่ service layer; current runtime ไม่ใช้ feature-level repository switching
4. ถ้าต้องมี mock/demo ให้แยกออกจาก runtime feature flow และต้องไม่รบกวน path จริง

## Incremental Migration Plan

### Phase 1: Stabilize (ไม่ย้ายโฟลเดอร์ใหญ่)
- คง `src/features` ไว้
- บังคับใช้ DTO -> Mapper -> Model ในโมดูลที่ active
- ลด fallback เงียบ ๆ ที่ทำให้ข้อมูลสับสน

### Phase 2: Align (ทีละโมดูล)
- ทำ naming/convention ให้ตรง docs
- แยก service/mappers ให้ชัดในโมดูลที่ยังปนกัน
- ทำ contract tests ระดับ service/API

### Phase 3: Converge (เลือกเฉพาะจุดคุ้มค่า)
- ค่อยพิจารณา restructure เชิงลึก (ถ้าจำเป็นจริง)
- ย้ายเฉพาะส่วนที่สร้าง cost ซ้ำสูง
- หลีกเลี่ยง big-bang refactor

## สรุป

เอกสารเดิมยังเป็นทิศทางหลักเหมือนเดิม แต่การลงมือกับโปรเจกต์นี้ให้ทำแบบ “ปรับให้เข้าที่ทีละชั้น” ไม่ใช่รื้อใหม่ทั้งหมด
