# Level-Based Approval Workflow — Implementation Plan

> **สถานะ:** Draft — ยังไม่ต้องดำเนินการ  
> **วันที่ร่าง:** 28 เมษายน 2026  
> **ผู้ร่าง:** AI Assistant (ร่วมวิเคราะห์กับ User)

---

## 1. วัตถุประสงค์ (Why?)

### ปัญหาของระบบเดิม

ระบบสิทธิปัจจุบันใช้รูปแบบ **RBAC + Scope + User Permission Override** โดยมี Permission Code ในรูปแบบ `module.resource.action` (เช่น `purchase.pr.approve`)

**ปัญหาที่พบ:** เมื่อต้องการให้ระบบรองรับ "หลายระดับการอนุมัติ" (Multi-level Approval) ระบบเดิมมีข้อจำกัดดังนี้:

1. **ไม่มี Level ในการมอบสิทธิ** — ตาราง `RolePermission` และ `UserPermissionOverride` เก็บแค่ "มีสิทธิ" หรือ "ไม่มีสิทธิ" ไม่ได้บอกว่ามีสิทธิ "ระดับไหน"
2. **Workflow Step ผูกกับ Role ตรงๆ** — ตาราง `ApprovalWorkflowStep` มีฟิลด์ `RoleId` (required) ทำให้ถ้า User ไม่ได้อยู่ใน Role นั้น จะกดอนุมัติไม่ได้ ถึงแม้จะได้รับสิทธิพิเศษ (Override)
3. **ถ้าจะแก้แบบเดิม ต้องสร้าง Permission ใหม่** — ต้องเพิ่ม Action เป็น `approve_l1`, `approve_l2`, `approve_l3` ซึ่งทำให้ตาราง Permission สกปรก ไม่ยืดหยุ่น และต้องแก้ Code ทุกครั้งที่เพิ่มระดับ

### ตัวอย่างเคสที่ระบบเดิมรองรับไม่ได้

**เคส:** นาย ก. เป็น "สัตวบาล" (Staff) ได้รับมอบหมายให้อนุมัติ PR แทนผู้จัดการฟาร์ม (Step 1) ชั่วคราว

- **ระบบเดิม:** ❌ ทำไม่ได้ เพราะ Step 1 กำหนดว่าต้องเป็น Role "ผู้จัดการฟาร์ม" เท่านั้น
- **ทางแก้แบบเดิม:** ต้องสร้าง Permission `purchase.pr.approve_l1` ใหม่ และให้สิทธินี้กับนาย ก. → ไม่ยืดหยุ่น
- **ระบบใหม่:** ✅ แค่ให้สิทธิ `purchase.pr.approve` กับ Level = 1 แก่นาย ก. ผ่าน User Override

---

## 2. เปรียบเทียบระบบเดิม vs ระบบใหม่

### ระบบเดิม (As-Is)

```
┌─────────────────────────────────────────────────────────┐
│  Permission Table                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ purchase.pr.create     ← สร้าง PR               │    │
│  │ purchase.pr.approve    ← อนุมัติ (ไม่มี Level)    │    │
│  │ purchase.pr.approve_l1 ← ต้องสร้างเพิ่ม ❌       │    │
│  │ purchase.pr.approve_l2 ← ต้องสร้างเพิ่ม ❌       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ApprovalWorkflowStep                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 1: RoleId = 5 (ผู้จัดการฟาร์ม) ← Fix Role  │    │
│  │ Step 2: RoleId = 8 (แผนกจัดซื้อ)    ← Fix Role  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  RolePermission                                         │
│  ┌──────────────────────────────────────────┐           │
│  │ RoleId | PermissionId (ไม่มี Level)      │           │
│  │   5    │   approve_l1                    │           │
│  │   8    │   approve_l2                    │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  ❌ สัตวบาลได้รับ Override → กดอนุมัติไม่ได้            │
│     เพราะ RoleId ไม่ตรง                                 │
└─────────────────────────────────────────────────────────┘
```

### ระบบใหม่ (To-Be)

```
┌─────────────────────────────────────────────────────────┐
│  Permission Table (ไม่ต้องเปลี่ยน!)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ purchase.pr.create    ← สร้าง PR                │    │
│  │ purchase.pr.approve   ← อนุมัติ (ตัวเดียวจบ!) ✅ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ApprovalWorkflowStep                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 1: RequiredLevel = 1 ← เช็ค Level แทน ✅   │    │
│  │ Step 2: RequiredLevel = 2 ← เช็ค Level แทน ✅   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  RolePermission (เพิ่ม Level)                           │
│  ┌──────────────────────────────────────────┐           │
│  │ RoleId | PermissionId | Level ← NEW!    │           │
│  │   5    │   approve    │   1             │           │
│  │   8    │   approve    │   2             │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  UserPermissionOverride (เพิ่ม Level)                   │
│  ┌───────────────────────────────────────────────┐      │
│  │ UserId   | PermissionId | IsAllowed | Level   │      │
│  │ สัตวบาล  │   approve    │   true    │   1     │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
│  ✅ สัตวบาลได้รับ Override Level=1                       │
│     → อนุมัติ Step 1 ได้! (Level 1 >= RequiredLevel 1)  │
│     → อนุมัติ Step 2 ไม่ได้ (Level 1 < RequiredLevel 2) │
└─────────────────────────────────────────────────────────┘
```

### เปรียบเทียบแบบย่อ

| หัวข้อ | ระบบเดิม | ระบบใหม่ |
|--------|----------|----------|
| **Permission Code** | ต้องสร้าง `approve_l1`, `approve_l2` ให้รก | ใช้ `approve` ตัวเดียว |
| **Workflow Step** | Fix RoleId ตรงๆ | เช็ค RequiredLevel |
| **สิทธิพิเศษ (Override)** | ให้ได้แต่กดไม่ได้ (Role ไม่ตรง) | ให้ Level ที่ต้องการ → กดได้ทันที |
| **Super Admin** | Bypass ผ่าน IsSuperAdmin | เหมือนเดิม + บันทึก Audit Trail |
| **เพิ่มระดับอนุมัติใหม่** | ต้องสร้าง Permission + แก้ Code | แค่เพิ่ม Step + RequiredLevel ใน DB |
| **Backward Compatible** | - | ✅ ข้อมูลเดิมทำงานได้ปกติ (Level=0) |

---

## 3. สิ่งที่ต้องแก้ไข (What?)

### Phase 1: Database Schema (EF Core Migration)

| # | ไฟล์ | สิ่งที่ต้องทำ |
|---|------|-------------|
| 1 | `backend/Models/Auth/RolePermission.cs` | เพิ่ม `int Level { get; set; } = 0` |
| 2 | `backend/Models/Auth/UserPermissionOverride.cs` | เพิ่ม `int Level { get; set; } = 0` |
| 3 | `backend/Models/Workflow/ApprovalWorkflowStep.cs` | เพิ่ม `int RequiredLevel = 0`, ทำ `RoleId` เป็น `int?` |
| 4 | `backend/Models/Workflow/ApprovalAction.cs` | เพิ่ม `string AuthorizationType`, `int? EffectiveLevel` |
| 5 | `backend/Database/AppDbContext.cs` | เพิ่ม column mapping |

**คำสั่ง Migration:**
```bash
cd backend
dotnet ef migrations add AddApprovalLevelSupport
dotnet ef database update
```

---

### Phase 2: Backend Service Logic

| # | ไฟล์ | สิ่งที่ต้องทำ |
|---|------|-------------|
| 6 | `backend/Services/Auth/AccessControlService.cs` | Cache `Level` ใน `UserAccessSnapshot`, คำนวณ `EffectiveLevel` |
| 7 | `backend/Services/Workflow/ApprovalService.cs` | ปรับ `EvaluateStepAccessAsync()` ให้เช็ค Level |

**Logic การคำนวณ Effective Level:**
```
Effective Level = MAX(
  Role Permission Level สำหรับ Permission นี้,
  User Override Level สำหรับ Permission นี้
)
```

**Logic การเช็คสิทธิ (ใหม่):**
```
ถ้า (SuperAdmin) → ผ่านทุก Step
ถ้า (User มีสิทธิ "approve") AND (EffectiveLevel >= Step.RequiredLevel) → ผ่าน!
ถ้า (RequiredLevel = 0 และมี RoleId) → Fallback ไปเช็ค RoleId เดิม (backward compat)
```

---

### Phase 3: API Layer (Optional)

| # | ไฟล์ | สิ่งที่ต้องทำ |
|---|------|-------------|
| 8 | `backend/Controllers/Workflow/ApprovalsController.cs` | (Optional) เพิ่ม GET history endpoint |

---

### Phase 4: Frontend UI — ✅ ดำเนินการแล้ว

| # | ไฟล์ | สิ่งที่ต้องทำ | สถานะ |
|---|------|-------------|-------|
| 9 | `frontend/.../CentralPRDemo.tsx` | ปรับ Stepper → Level-based | ✅ เสร็จ |
| 10 | `frontend/.../CentralStockAlertHub.tsx` | ปรับ Stepper → Level-based | ✅ เสร็จ |

**UI แสดงผลใหม่:**
- **Lv.1, Lv.2** — Badge สีฟ้าข้างชื่อ Step แสดง RequiredLevel
- **ตามตำแหน่ง** — Badge สีเขียวเมื่ออนุมัติตามสิทธิ Role ปกติ
- **สิทธิพิเศษ** — Badge สีเหลืองเมื่อใช้ User Override + แสดง Level ที่ใช้
- **Super Admin** — Badge สีแดงเมื่อใช้สิทธิ Super Admin bypass

---

## 4. Model Changes (Diff)

### 4.1 RolePermission.cs

```diff
 public class RolePermission
 {
     public int RoleId { get; set; }
     public Role Role { get; set; } = null!;
     public int PermissionId { get; set; }
     public Permission Permission { get; set; } = null!;
+    // Approval authority level: 0 = no approval, 1+ = approval step level.
+    public int Level { get; set; } = 0;
 }
```

### 4.2 UserPermissionOverride.cs

```diff
 public class UserPermissionOverride : BaseEntity
 {
     public int AssignmentId { get; set; }
     public UserAssignment Assignment { get; set; } = null!;
     public int PermissionId { get; set; }
     public Permission Permission { get; set; } = null!;
     public bool IsAllowed { get; set; }
     public string? Remark { get; set; }
+    // Approval authority level override.
+    public int Level { get; set; } = 0;
 }
```

### 4.3 ApprovalWorkflowStep.cs

```diff
 public class ApprovalWorkflowStep : BaseEntity
 {
     public int ApprovalWorkflowId { get; set; }
     public ApprovalWorkflow ApprovalWorkflow { get; set; } = null!;
     public int StepOrder { get; set; }
     public string Name { get; set; } = string.Empty;
-    public int RoleId { get; set; }
-    public Role Role { get; set; } = null!;
+    public int? RoleId { get; set; }     // Optional, backward compat
+    public Role? Role { get; set; }
     public int? PermissionId { get; set; }
     public Permission? Permission { get; set; }
+    // Minimum level required to approve this step.
+    public int RequiredLevel { get; set; } = 0;
     public bool IsFinalStep { get; set; }
 }
```

### 4.4 ApprovalAction.cs (Audit Trail)

```diff
 public class ApprovalAction : BaseEntity
 {
     ...existing fields...
+    // "RolePermission" | "UserOverride" | "SuperAdmin" | "LegacyRole"
+    public string AuthorizationType { get; set; } = "RolePermission";
+    public int? EffectiveLevel { get; set; }
 }
```

---

## 5. Data Migration (SQL ตัวอย่าง)

เนื่องจากค่าเริ่มต้น `Level = 0` ข้อมูลเดิมจะไม่กระทบ ระบบจะ fallback ไปเช็ค RoleId ตามปกติ

```sql
-- 1. กำหนด Level ให้ Role
UPDATE role_permissions
SET level = 1
WHERE role_id = (SELECT id FROM roles WHERE code = 'FARM_MGR')
  AND permission_id = (SELECT id FROM permissions WHERE code = 'purchase.pr.approve');

UPDATE role_permissions
SET level = 2
WHERE role_id = (SELECT id FROM roles WHERE code = 'PROCUREMENT')
  AND permission_id = (SELECT id FROM permissions WHERE code = 'purchase.pr.approve');

-- 2. กำหนด RequiredLevel ให้ Workflow Step
UPDATE approval_workflow_steps
SET required_level = 1
WHERE step_order = 1;

UPDATE approval_workflow_steps
SET required_level = 2
WHERE step_order = 2;

-- 3. ให้สิทธิพิเศษ Level 1 แก่สัตวบาล (ตัวอย่าง)
UPDATE user_permission_overrides
SET level = 1
WHERE assignment_id = <target_assignment_id>
  AND permission_id = (SELECT id FROM permissions WHERE code = 'purchase.pr.approve');
```

---

## 6. Use Cases

| # | เคส | ผู้ใช้ | สิทธิ | Step | ผลลัพธ์ |
|---|------|-------|------|------|---------|
| 1 | ปกติ | ผู้จัดการฟาร์ม | Role Level=1 | Step 1 (Req=1) | ✅ ผ่าน |
| 2 | สิทธิพิเศษ | สัตวบาล | Override Level=1 | Step 1 (Req=1) | ✅ ผ่าน |
| 3 | Level ไม่พอ | สัตวบาล | Override Level=1 | Step 2 (Req=2) | ❌ ไม่ผ่าน |
| 4 | Super Admin | Super Admin | IsSuperAdmin=true | ทุก Step | ✅ Bypass ทั้งหมด |
| 5 | Backward compat | ผู้จัดการ (เดิม) | RoleId ตรง, Level=0 | Step (Req=0) | ✅ Fallback RoleId |

---

## 7. ข้อควรระวัง

> [!WARNING]
> **Breaking Change:** `ApprovalWorkflowStep.RoleId` เปลี่ยนจาก `int` → `int?` ต้อง review ทุกจุดที่อ้างอิง `currentStep.RoleId` โดยตรง

> [!IMPORTANT]
> **Cache TTL:** `AccessControlService` cache 5 นาที เมื่อเปลี่ยน Level จะต้องรอ cache หมดอายุ พิจารณาเพิ่ม cache bust

> [!NOTE]
> **Backward Compatible:** ข้อมูลเดิม (Level=0, RequiredLevel=0) จะยังทำงานปกติ ระบบ fallback ไปเช็ค RoleId

---

## 8. ลำดับการทำงาน

1. **Phase 1:** แก้ Model + สร้าง Migration + Apply
2. **Phase 2:** แก้ Service Layer (AccessControlService → ApprovalService)
3. **Phase 3:** แก้ AppDbContext config
4. **Phase 4:** ~~แก้ Frontend UI~~ ✅ เสร็จแล้ว
5. **Phase 5:** ทดสอบ + Data Migration (SQL)
6. **Phase 6:** (Optional) เพิ่ม API endpoint สำหรับ workflow history

---

*เอกสารนี้เป็นร่างแผนงาน สามารถปรับเปลี่ยนได้ตามความเหมาะสม*
