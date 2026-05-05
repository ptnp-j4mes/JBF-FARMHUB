# 01 External Requirements Summary

อัปเดตล่าสุด: 2026-03-19

ไฟล์นี้สรุป requirement จากเอกสารภายนอก 4 ชุด เพื่อใช้เป็นบริบทร่วมก่อนลงมือแก้โค้ด

## เอกสารต้นทาง

- `sources/FarmHUB_Requirement.docx.pdf`
- `sources/update-ประเด็นพูดคุย-JBFarmHUB.pdf`
- `sources/สายอนุมัติ HR แยกตามความรับผิดชอบรายฟาร์ม_upd.pdf`
- `sources/FarmHUB_Proposal.pdf`

## สรุปทีละเอกสาร

## 1) FarmHUB Requirement (functional core)

สิ่งที่ชัดเจนจากเอกสารนี้

- ระบบต้องเป็น single platform สำหรับงานฟาร์มหลัก
- มีกระบวนการมาตรฐานและตรวจสอบย้อนหลังได้ (traceability + audit)
- access model = role + permission + scope ตามฟาร์ม/โรงเรือน/คลัง
- มี approval flow ตามประเภทเอกสารและวงเงิน
- warehouse/production/vaccine/sales/maintenance/finance เชื่อมกันเป็น event chain เดียว
- มีแนวคิด database entity ครอบคลุมหลายโมดูล

จุดที่ควรถือเป็น baseline สูง

- Event Pipeline: `Create -> Validate -> Apply Impact -> Notify -> Audit`
- stock ไม่เพิ่มจาก PR โดยตรง แต่เพิ่มเมื่อรับจริง และลดเมื่อเบิก/โอน/ใช้จริง
- lot/expiry policy (FEFO/FIFO/manual) ต้องมี

## 2) Update ประเด็นพูดคุย (operational constraints)

สิ่งที่ชัดเจนจากเอกสารนี้

- SAP เป็น master system
- FarmHUB เป็น daily real-time record ฝั่งหน้างาน
- ต้องรองรับ offline/no wifi และต้องมีเวลา (timestamp) ทุก transaction
- ต้องมี module หลังบ้าน collect/convert/sync เข้ากับ SAP
- ไม่ควรแก้/ลบธุรกรรมที่บันทึกแล้วแบบตรง ๆ ให้ใช้วิธี reversal (`+เข้า` / `-ออก`)
- ต้องมีโมดูลติดตามสถานะการส่งเอกสารเข้า SAP

## 3) สายอนุมัติ HR แยกตามฟาร์ม (approval matrix)

สิ่งที่ชัดเจนจากเอกสารนี้

- สายอนุมัติผูกกับ “ความรับผิดชอบรายฟาร์ม” ไม่ใช่ role กลางอย่างเดียว
- มีหลายระดับผู้อนุมัติ (1-3 ชั้น)
- มีการเปลี่ยนตาม farm/phase/หน้าที่

ข้อสรุปสำคัญ

- approval config ต้องเป็นข้อมูลตั้งค่า (data-driven) แยกจากโค้ด
- โมเดลสิทธิ์ควรรองรับ `farm-aware approval chain`

## 4) FarmHUB Proposal (strategy + NFR direction)

สิ่งที่ใช้ได้ดี

- วิสัยทัศน์, เป้าหมายเชิงธุรกิจ, KPI/ROI, phase rollout
- non-functional direction (availability, security, observability, scalability)
- แนวทาง change management และ adoption

สิ่งที่ต้องใช้ด้วยความระวัง

- proposal มีรายละเอียด stack บางส่วนที่ไม่ตรงกับโค้ดจริงปัจจุบัน
- ให้ใช้เป็น strategic direction ไม่ใช่ implementation truth

## ภาพรวมที่เอกสารทั้ง 4 เห็นตรงกัน

- ต้องมี access control ตาม role + scope
- ต้องมี approval workflow แบบ configurable
- ต้องมี audit + traceability
- ต้องรองรับ SAP integration
- ต้องยกระดับข้อมูลให้ใช้ตัดสินใจได้จริง

## จุดที่ขัดกันหรือมีความเสี่ยง

- รายละเอียด technology stack ไม่ตรงกันทุกเอกสาร
- proposal เน้น vision/NFR มากกว่าข้อจำกัด implementation ปัจจุบัน
- approval matrix เป็นข้อมูลองค์กรจริงและเปลี่ยนได้ ต้องออกแบบให้ maintainable

## ข้อแนะนำการใช้งานเอกสารนี้กับ frontend

- ใช้ `frontend/13_frontend_requirements.md` เป็น implementation baseline
- ใช้โฟลเดอร์ `requirements/*` เป็น business/context overlay
- ถ้าขัดกัน ให้ยึด API contract + code reality ก่อน แล้วเปิด gap list เป็น phase migration

