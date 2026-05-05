# 17_backend_db-migration-guide.md

# Backend — DB Migration & Schema Guide

> คุณไม่ต้องเข้าไปแก้ DB ตรงๆ เลย — ทุกอย่างใช้ EF Core Migrations จัดการแทน

---

## 1. หลักการ

EF Core Migration คือระบบ version control ของ database schema  
ทุกครั้งที่ต้องการเปลี่ยน schema หรืออัปเดตข้อมูล ให้ **สร้าง migration file** แล้วให้ EF จัดการกับ DB แทน ไม่ต้องเปิด pgAdmin / DBeaver ไปแก้เอง

```text
แก้ C# Model → สร้าง Migration → Apply → DB อัปเดตเอง
```

---

## 2. Migration รันตอนไหน?

### Auto-migrate (Development เท่านั้น)

ใน `Program.cs` มีการ auto-migrate + seed เมื่อเปิด Backend:

```csharp
var runDbMigrateAndSeed = app.Configuration.GetValue<bool>("Startup:RunDbMigrateAndSeed");
if (runDbMigrateAndSeed && app.Environment.IsDevelopment())
{
    context.Database.Migrate(); // run pending migrations
    await DbInitializer.SeedAsync(context);
}
```

เงื่อนไข:
- `Startup:RunDbMigrateAndSeed = true` ใน `appsettings.Development.json`
- Environment ต้องเป็น `Development`

→ **ถ้าเปิดทั้งสองเงื่อนไข พอรัน backend ครั้งต่อไปก็จะ migrate ให้เอง**

### Manual (Production / ทุก environment)

```bash
cd backend
dotnet ef database update
```

---

## 3. สร้าง Migration ใหม่

```bash
# เพิ่ม migration
dotnet ef migrations add <ชื่อMigration>

# ตัวอย่าง
dotnet ef migrations add AddDescriptionToItems
dotnet ef migrations add RenamePermissionCodesToDomainBased
dotnet ef migrations add AddThemeColorToUser
```

EF จะสร้างไฟล์ใน `backend/Migrations/` ให้อัตโนมัติ

---

## 4. Use Cases หลัก

### 4.1 เพิ่มฟิลด์ใหม่

```csharp
// 1. แก้ Model
public class Item : BaseEntity
{
    // ของเดิม...
    public string? Description { get; set; }  // ← เพิ่ม
}

// 2. (ถ้า map column เอง) แก้ AppDbContext
entity.Property(e => e.Description).HasColumnName("description");
```

```bash
dotnet ef migrations add AddDescriptionToItems
dotnet ef database update
```

EF จะ generate:
```sql
ALTER TABLE "items" ADD COLUMN "description" text NULL;
```

**ข้อมูลเดิมไม่หาย** ✅

---

### 4.2 เปลี่ยนชื่อฟิลด์

```csharp
// แก้ Model
public string ProductName { get; set; }  // previously: Name
```

```bash
dotnet ef migrations add RenameItemNameToProductName
```

> ⚠️ **สำคัญ**: EF อาจสร้าง Drop + Add แทน Rename → ข้อมูลหาย!  
> ต้องเปิดไฟล์ migration ที่ได้มาแล้วแก้มือเป็น `RenameColumn`:

```csharp
// แก้ migration file ที่ EF สร้างให้
migrationBuilder.RenameColumn(
    name: "name",
    table: "items",
    newName: "product_name");
```

**ข้อมูลเดิมไม่หาย** ✅ (ถ้าตรวจสอบและใช้ RenameColumn)

---

### 4.3 อัปเดตข้อมูลในตาราง (Data Migration)

ใช้เมื่อต้องการ UPDATE ค่าในตาราง (เช่น rename permission codes)  
ไม่ต้องเปลี่ยน schema ใดๆ

```bash
dotnet ef migrations add RenamePermissionCodesToDomainBased
```

แล้วแก้ migration file ที่ได้มา:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        -- NOTE: `permission_module`/`permission_code` ถูกยกเลิกแล้ว → ใช้ `module/resource/action/code`

        UPDATE ""permissions""
        SET ""module"" = 'access',
            ""resource"" = NULL
        WHERE ""module"" = 'admin_users';
        
        UPDATE ""permissions""
        SET ""module"" = 'farm'
        WHERE ""module"" IN (
            'operations_record', 
            'operations_stock', 
            'operations_feeding'
        );
        
        UPDATE ""permissions""
        SET ""action"" = 'add'
        WHERE ""action"" = 'create';
    ");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // rollback ถ้าจำเป็น
    migrationBuilder.Sql(@"
        UPDATE ""permissions""
        SET ""module"" = 'admin_users'
        WHERE ""module"" = 'access';
    ");
}
```

**ข้อมูลเดิมไม่หาย** ✅ (FK ชี้ด้วย ID ไม่ใช่ชื่อ)

---

### 4.4 ลบฟิลด์

```csharp
// ลบออกจาก Model และ AppDbContext
```

```bash
dotnet ef migrations add RemoveObsoleteFieldFromItems
```

> ⚠️ **ข้อมูลในคอลัมน์นั้นจะหายถาวร** — ทำก็ต่อเมื่อมั่นใจแล้ว

---

## 5. ตารางสรุป: ต้องทำอะไร / ปลอดภัยไหม

| ต้องการ | สั่ง EF | ข้อมูลหาย? | หมายเหตุ |
|---------|---------|-----------|---------|
| เพิ่มฟิลด์ | `migrations add` | ❌ ไม่ | ปลอดภัยที่สุด |
| เปลี่ยนชื่อฟิลด์ | `migrations add` + แก้ migration | ❌ ไม่ | ต้องเปลี่ยน Drop+Add → `RenameColumn` |
| UPDATE ค่าในตาราง | `migrations add` + เขียน SQL เอง | ❌ ไม่ | ใช้กับ permission rename |
| เปลี่ยน type ฟิลด์ | `migrations add` | ⚠️ บางกรณี | ขึ้นกับ type เดิม/ใหม่ |
| ลบฟิลด์ | `migrations add` | ✅ ข้อมูลหาย | ระวัง |
| Rollback | `database update <migration>` | ⚠️ ขึ้นกับ Down() | ต้องเขียน Down() ให้ครบ |

---

## 6. ขั้นตอน Deploy ที่ปลอดภัย (สรุป)

```text
Development (auto):
  1. ตั้ง Startup:RunDbMigrateAndSeed = true ใน appsettings.Development.json
  2. รัน backend → migrate + seed อัตโนมัติ

Production (manual):
  1. dotnet ef migrations add <ชื่อ>     ← สร้าง migration
  2. git commit migration file           ← commit เข้า repo
  3. deploy backend ใหม่
  4. dotnet ef database update           ← apply ที่ production DB
```

---

## 7. ไฟล์ Migration ที่มีอยู่แล้ว (ณ มีนาคม 2569)

| Migration | สิ่งที่ทำ |
|-----------|---------|
| Phase2_Add_PurchaseRequest_And_ApprovalWorkflow | เพิ่ม Purchase + Approval |
| Phase2_Add_Warehouse_Module | เพิ่ม Warehouse module |
| AddStockBalanceConcurrency | เพิ่ม concurrency control ให้ stock |
| AddAuditLog | legacy audit log table (retired in favor of operation/error logs) |
| AddUserPermissionsOverrides | เพิ่ม user-level permission override (allow/deny) |
| BaselinePermissionsRoleMappingsV1 | seed permissions + role mappings ครั้งแรก |
| AddItemPermissionsForItemsController | เพิ่ม permission สำหรับ items |
| HardenRefreshTokenSessions | เข้มงวด session security |
| AddCompaniesAndUserCompany | เพิ่ม company structure |
| AddWarehouseViewPermissionBaseline | seed warehouse permissions |
| RemoveUserScopeAccessLevelAndEnforceActiveScopeUnique | ปรับ scope model |
| HardenRolesPermissionsCaseInsensitiveUnique | unique index case-insensitive |
| AddBuildingOpeningModule | เพิ่ม building-opening module |
| AddFacilityNodeAddressTable | เพิ่มตาราง address ของ facility |
| AddWarehouseTypeAndCentralWarehouse | เพิ่ม warehouse type |

> Migration ที่จะต้องสร้างเพิ่ม: `RenamePermissionCodesToDomainBased` (ส่วนหนึ่งของ Phase 3 ใน `16_frontend_migration-blueprint.md`)

---

## 8. คำสั่ง EF Core ที่ใช้บ่อย

```bash
# ดู migration ที่ pending (ยังไม่ได้ apply)
dotnet ef migrations list

# apply ทุก pending migration
dotnet ef database update

# rollback ไป migration ก่อนหน้า
dotnet ef database update <ชื่อMigrationที่ต้องการย้อนไป>

# สร้าง migration ใหม่
dotnet ef migrations add <ชื่อ>

# ดู SQL ที่จะ run (ไม่ apply จริง)
dotnet ef migrations script

# ลบ migration ล่าสุด (ก่อน apply)
dotnet ef migrations remove
```
