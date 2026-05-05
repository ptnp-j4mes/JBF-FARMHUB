# 18_frontend_prompt-green-dashboard-table.md

# FarmHUB UX/UI Master Prompt (Green Dashboard + Table)

เอกสารนี้เป็น prompt กลางสำหรับใช้กับ Claude/ChatGPT เพื่อให้ generate หน้า `Dashboard + Table` ในโครงการ FarmHUB โดยเน้น UX และโทนสีเขียวตามข้อกำหนดเดียวกันทุกครั้ง

---

## 1) Master Prompt (พร้อมใช้งานทันที)

คัดลอกข้อความด้านล่างไปใช้ได้ทันที:

```text
คุณคือ Senior Product Designer + Senior Frontend UI Architect (Next.js + MUI) ที่เชี่ยวชาญงาน ERP dashboard/table

โปรดออกแบบ UX/UI สำหรับหน้า "Dashboard + Employee Table" ของระบบ FarmHUB โดยยึดข้อกำหนดต่อไปนี้อย่างเคร่งครัด

[Project Context]
- ระบบเป็นเว็บแอปธุรกิจ ใช้งานต่อเนื่องบน desktop/tablet เป็นหลัก แต่ต้อง responsive บน mobile
- ภาษา UI เป็นภาษาไทย (technical terms อังกฤษได้)
- ดีไซน์ต้องอ่านง่าย ใช้งานนานๆ ไม่ล้า และรองรับข้อมูลจำนวนมาก
- โครงหน้าต้องใช้ fieldset + legend เพื่อแยก section ให้ชัดเจน

[Fixed Color Scheme - ห้ามหลุดจากนี้โดยไม่จำเป็น]
- Background หลัก: ขาว (#FFFFFF)
- Green Primary: #4CAF50
- Green Deep: #2E7D32
- Green Soft: #81C784
- อนุญาต neutral เทาอ่อนเพื่อเส้นแบ่ง/พื้นรองเล็กน้อย แต่ห้ามกลบโทนเขียว

[Key UX Principles - บังคับใช้ครบ 4 ข้อ]
1) Clean & Minimalist
- ลดสิ่งรบกวนสายตา, ใช้ whitespace อย่างมีระบบ
- หลีกเลี่ยง decoration ที่ไม่ช่วยงาน

2) High Readability
- Typography ชัด, ขนาดตัวอักษรและ line-height อ่านต่อเนื่องได้
- contrast ต้องเพียงพอสำหรับการใช้งานทั้งวัน

3) Clear Hierarchy
- ผู้ใช้ต้องเห็นลำดับความสำคัญภายในไม่กี่วินาที
- จัดระดับ visual hierarchy ชัด: page title > section legend > table header > row content > secondary metadata

4) Efficient Display
- แสดงข้อมูลได้มากโดยไม่รก
- spacing และ density ต้องสมดุลระหว่างความแน่นข้อมูลและความสบายตา

[Required Page Structure]
1. Summary Section (fieldset + legend)
- แสดง KPI cards เช่น พนักงานทั้งหมด / Active / On Leave / Pending
- ใช้โทนเขียวเป็นตัวเน้นค่าและสถานะสำคัญ

2. Filter & Actions Section (fieldset + legend)
- มีช่องค้นหา, ตัวกรองแผนก, ตัวกรองสถานะ, วันที่ (ถ้าจำเป็น)
- ปุ่มหลัก (เช่น ค้นหา/เพิ่มพนักงาน/Export) ใช้เขียวเด่น
- ปุ่มรองใช้สไตล์ที่ยังคงคุมโทนเขียว

3. Employee Table Section (fieldset + legend)
- ตารางต้องสะอาดตา, spacing เหมาะสม, header ชัด
- รองรับ sticky header
- มี row hover state ที่ subtle
- มีคอลัมน์ action ปุ่มเขียวที่มองเห็นง่ายแต่ไม่แย่งความสนใจจากข้อมูล
- มี status badge สีแยกชัดตามสถานะ:
  - Active
  - Inactive
  - On Leave
  - Pending

[Table UX Requirements]
- ออกแบบเพื่อการใช้งานนานๆ ลดอาการล้าตา
- Column alignment อ่านง่าย (text-left, number-right ตามบริบท)
- รองรับข้อมูลยาวด้วย truncation + tooltip หรือ wrap ที่ควบคุมได้
- ระยะห่างแถว/คอลัมน์ต้องพอให้ scan ได้เร็ว

[Output Contract - ต้องตอบให้ครบหัวข้อต่อไปนี้]
1) Layout Rationale
- อธิบายเหตุผลการจัดวางหน้าและลำดับสายตาผู้ใช้

2) Component Spec
- ระบุรายการ component หลักของแต่ละ section
- ระบุ state สำคัญ: loading / empty / error / success

3) Design Tokens
- ระบุ color tokens, spacing scale, typography scale, radius, border style
- ต้องสะท้อน green system ที่กำหนด

4) Accessibility Checklist
- contrast, keyboard navigation, focus visibility, click target size, badge readability

5) Responsive Behavior
- อธิบายการจัด layout สำหรับ desktop และ mobile
- ระบุว่า fieldset/legend และ table ยังชัดเจนบนจอเล็ก

[Acceptance Criteria - งานต้องผ่านทั้งหมด]
- อ่านตารางต่อเนื่องได้นานโดยไม่ล้า
- ข้อมูลเยอะยัง scan ง่าย
- ผู้ใช้เข้าใจ hierarchy ได้ภายในไม่กี่วินาที
- ปุ่ม action เด่นพอดี ไม่รบกวนการอ่านข้อมูล
- ภาพรวมยังคง clean, minimalist และคุมโทนเขียว

[Important Constraints]
- ห้ามใช้สีหลักที่ชนกับระบบสีเขียวโดยไม่จำเป็น
- ห้ามออกแบบให้แน่นเกินไป (ต้องระบุ spacing/density ชัด)
- ห้ามข้าม fieldset + legend ใน section หลัก

โปรดส่งคำตอบแบบโครงสร้างชัดเจน โดยเรียงลำดับ:
1) Layout Rationale
2) Component Spec
3) Design Tokens
4) Accessibility Checklist
5) Responsive Rules
6) Final UX Self-Review เทียบกับ Acceptance Criteria
```

---

## 2) วิธีทดสอบ Prompt (A/B)

### รอบ A
- ใช้ prompt ข้างต้นตรงๆ แบบไม่เติมข้อมูลเพิ่ม

### รอบ B
- ใช้ prompt เดิม แต่เพิ่มข้อมูลตัวอย่างพนักงาน 10-20 แถว (หลายสถานะ/หลายแผนก)

### สิ่งที่ต้องคงเดิมทั้ง 2 รอบ
- มี fieldset + legend ครบทุก section หลัก
- โทนสีหลักเป็นขาว + เขียว 3 เฉดที่กำหนด
- ตารางยังคงอ่านง่ายและ scan ได้เร็ว
- status badges แยกสถานะด้วยสีที่สื่อความหมายชัด
- mobile ยังไม่แน่น และ action ไม่ชนกัน

---

## 3) QA Checklist (สั้นและใช้ตรวจงานเร็ว)

- ใช้สี #4CAF50, #2E7D32, #81C784 และพื้นขาวเป็นแกนหลัก
- รักษา 4 UX principles ครบ (Clean, Readability, Hierarchy, Efficient Display)
- มี Summary, Filter/Actions, Employee Table แยกด้วย fieldset + legend
- มี sticky header และ row hover แบบ subtle
- มี status badges สำหรับ Active/Inactive/On Leave/Pending
- ระบุ accessibility checklist ครบ
- ระบุ responsive behavior สำหรับ desktop/mobile ชัดเจน
