'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Add,
  FilterList,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DataTable,
  DialogTitleWithClose,
  SearchField,
  type Column,
} from '@/components/common';
import { userService } from '@/features/admin/user-assignment/services';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { extractApiErrorMessage } from '@/lib/api-error';
import type { PermissionResponse } from '@/features/admin/user-assignment/types';
import {
  canAddUserAssignment,
  canEditUserAssignment,
  canSoftDeleteUserAssignment,
} from '@/lib/access/modules/user-assignment.guard';
import {
  collectPermissionActions,
  isPermissionActionCode,
} from '../utils/permission-actions';

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  field: '#fbfcfb',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

let permissionListCache: PermissionResponse[] | null = null;
let permissionListRequest: Promise<PermissionResponse[]> | null = null;

function cachePermissions(rows: PermissionResponse[]): PermissionResponse[] {
  permissionListCache = rows;
  return rows;
}

function normalizePermissionPart(value: string | null | undefined): string {
  return (value ?? '').trim();
}

// `module.resource` with snake_case segments. Resource can include dot-separated sub-resources.
const MODULE_RESOURCE_PATTERN =
  /^[a-z0-9]+(?:_[a-z0-9]+)*(?:\.[a-z0-9]+(?:_[a-z0-9]+)*)*$/;

function isValidModuleResource(value: string): boolean {
  return MODULE_RESOURCE_PATTERN.test(value);
}

function isValidPermissionAction(value: string): boolean {
  return isPermissionActionCode(value);
}

async function getPermissionsWithCache(force = false): Promise<PermissionResponse[]> {
  if (!force && permissionListCache) {
    return permissionListCache;
  }

  if (!force && permissionListRequest) {
    return permissionListRequest;
  }

  permissionListRequest = userService.permissions
    .getAll({ includeInactive: true })
    .then((permissionRows) => cachePermissions(permissionRows))
    .finally(() => {
      permissionListRequest = null;
    });

  return permissionListRequest;
}

interface PermissionFormState {
  resource: string;
  action: string;
  description: string;
}

interface PermissionTableRow {
  id: number;
  _dbId: number;
  module: string;
  resource: string;
  moduleResource: string;
  code: string;
  action: string;
  description: string;
  roleCount: number;
  isActive: boolean;
}

const EMPTY_FORM: PermissionFormState = {
  resource: '',
  action: '',
  description: '',
};

function normalizeResource(value: string): string {
  return value.trim();
}

export default function PermissionPage() {
  const primary = '#1d4ed8';
  const primaryHover = '#1e40af';
  const showAlert = useCallback((options: SweetAlertOptions) => {
    const originalDidOpen = options.didOpen;

    return Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      target: 'body',
      ...options,
      didOpen: (popup) => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = '9999';
        }
        originalDidOpen?.(popup);
      },
    });
  }, []);

  const canCreatePermission = canAddUserAssignment();
  const canUpdatePermission = canEditUserAssignment();
  const canDeletePermission = canSoftDeleteUserAssignment();

  const [loading, setLoading] = useState(permissionListCache === null);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<PermissionResponse[]>(
    permissionListCache ?? [],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionResponse | null>(null);
  const [form, setForm] = useState<PermissionFormState>(EMPTY_FORM);

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && permissionListCache) {
      setPermissions(permissionListCache);
      setLoading(false);
      return permissionListCache;
    }

    setLoading(true);
    try {
      const rows = await getPermissionsWithCache(Boolean(options?.force));
      cachePermissions(rows);
      setPermissions(rows);
      return rows;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPermissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return permissions.filter((permission) => {
      const matchesSearch =
        !query ||
        (permission.code ?? '').toLowerCase().includes(query) ||
        (permission.resourcePath ?? '').toLowerCase().includes(query) ||
        (permission.module ?? '').toLowerCase().includes(query) ||
        (permission.resource ?? '').toLowerCase().includes(query) ||
        (permission.action ?? '').toLowerCase().includes(query) ||
        (permission.description ?? '').toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? permission.isActive : !permission.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [permissions, searchQuery, statusFilter]);

  const availableActionOptions = useMemo(
    () => collectPermissionActions(permissions.map((permission) => permission.action)),
    [permissions],
  );

  const tableRows = useMemo<PermissionTableRow[]>(() => {
    return filteredPermissions.map((permission, index) => ({
      id: index + 1,
      _dbId: permission.id,
      module: normalizePermissionPart(permission.module) || '-',
      resource: normalizePermissionPart(permission.resource) || '-',
      moduleResource: normalizePermissionPart(permission.resourcePath),
      code: normalizePermissionPart(permission.code),
      action: normalizePermissionPart(permission.action),
      description: permission.description ?? '',
      roleCount: permission.roleCount,
      isActive: permission.isActive,
    }));
  }, [filteredPermissions]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return tableRows.slice(start, end);
  }, [page, rowsPerPage, tableRows]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(tableRows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, rowsPerPage, tableRows.length]);

  const columns = useMemo<Column<PermissionTableRow>[]>(
    () => [
      { id: 'id', label: 'ID', minWidth: 52, align: 'center' },
      { id: 'module', label: 'Module', minWidth: 120 },
      { id: 'resource', label: 'Resource', minWidth: 140 },
      { id: 'action', label: 'Action', minWidth: 120 },
      { id: 'code', label: 'Code (Unique Index)', minWidth: 210 },
      { id: 'description', label: 'คำอธิบาย', minWidth: 220 },
      {
        id: 'roleCount',
        label: 'จำนวนบทบาท',
        minWidth: 110,
        align: 'center',
      },
      {
        id: 'isActive',
        label: 'พร้อมใช้งาน',
        minWidth: 84,
        format: (value) => (value ? 'ใช้ได้' : 'ยังไม่พร้อมใช้'),
      },
    ],
    [],
  );

  const openCreateDialog = () => {
    setEditingPermission(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (row: PermissionTableRow) => {
    if (row._dbId <= 0) {
      return;
    }

    const permission = permissions.find((item) => item.id === row._dbId);
    if (!permission) {
      return;
    }

    setEditingPermission(permission);
    setForm({
      resource: permission.resourcePath,
      action: permission.action,
      description: permission.description,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (row: PermissionTableRow) => {
    if (row._dbId <= 0) {
      return;
    }

    if (!canDeletePermission || saving) {
      return;
    }

    setSaving(true);
    try {
      const confirmation = await showAlert({
        icon: 'warning',
        title: 'ยืนยันลบสิทธิ?',
        text: `คุณต้องการลบสิทธิ ${row.code} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await userService.permissions.deactivate(row._dbId);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        text: 'ระบบได้ลบข้อมูลเรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'ไม่สามารถลบข้อมูลได้',
        text: extractApiErrorMessage(
          error,
          'ไม่สามารถลบข้อมูลได้ เนื่องจากมีการอ้างอิงหรือถูกใช้งานอยู่ในระบบ',
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row: PermissionTableRow) => {
    if (row._dbId <= 0) {
      return;
    }

    if (!canUpdatePermission || saving) {
      return;
    }

    const permission = permissions.find((item) => item.id === row._dbId);
    if (!permission) {
      return;
    }

    setSaving(true);
    try {
      const confirmation = await showAlert({
        icon: 'warning',
        title: 'ยืนยันเปลี่ยนสถานะสิทธิ?',
        text: `คุณต้องการ${permission.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}สิทธิ ${permission.code} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: permission.isActive ? '#f59e0b' : '#0ea5e9',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await userService.permissions.setStatus(permission.id, !permission.isActive);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'เปลี่ยนสถานะสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'เปลี่ยนสถานะไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถเปลี่ยนสถานะได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((!editingPermission && !canCreatePermission) || (editingPermission && !canUpdatePermission)) {
      return;
    }

    const resource = normalizeResource(form.resource);
    const action = form.action.trim();
    if (!resource || !action) {
      return;
    }
    if (!isValidPermissionAction(action)) {
      void showAlert({
        icon: 'warning',
        title: 'Action ไม่ถูกต้อง',
        text: `action ต้องเป็น snake_case ที่ไม่ว่าง (ตอนนี้คือ "${action}")`,
      });
      return;
    }
    if (!isValidModuleResource(resource)) {
      void showAlert({
        icon: 'warning',
        title: 'Module/Resource ไม่ถูกต้อง',
        text: `รูปแบบที่รองรับ: module.resource (snake_case) เช่น "admin.user_assignment" หรือ "warehouse.material_stock" (ตอนนี้คือ "${resource}")`,
      });
      return;
    }

    const confirmation = await showAlert({
      icon: 'question',
      title: editingPermission ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มสิทธิ?',
      text: editingPermission
        ? `คุณต้องการบันทึกการแก้ไขสิทธิ ${editingPermission.code} หรือไม่`
        : `คุณต้องการเพิ่มสิทธิ ${resource}.${action} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#1d4ed8',
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      if (editingPermission) {
        await userService.permissions.update(editingPermission.id, {
          resource,
          action,
          description: form.description.trim(),
        });
      } else {
        await userService.permissions.create({
          resource,
          action,
          description: form.description.trim(),
        });
      }

      setDialogOpen(false);
      setEditingPermission(null);
      setForm(EMPTY_FORM);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  };

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;

  return (
    <>
      <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: isFilterExpanded ? 1 : 1.25,
              }}
            >
              <SearchField
                placeholder="ค้นหา permission"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                disabled={saving}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 260 },
                  maxWidth: { md: 360 },
                  '& .MuiOutlinedInput-root': { bgcolor: UI.field },
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterList fontSize="small" />}
                onClick={() => setIsFilterExpanded((prev) => !prev)}
                sx={{
                  minHeight: 40,
                  textTransform: 'none',
                  borderColor:
                    activeFilterCount > 0 || isFilterExpanded
                      ? alpha(UI.accent, 0.65)
                      : UI.border,
                  color:
                    activeFilterCount > 0 || isFilterExpanded
                      ? UI.accent
                      : UI.muted,
                  bgcolor: UI.panelSoft,
                  '&:hover': {
                    borderColor:
                      activeFilterCount > 0 || isFilterExpanded ? UI.accent : UI.text,
                    bgcolor: UI.panelMuted,
                  },
                }}
              >
                ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>

              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                disabled={!canCreatePermission || saving}
                onClick={openCreateDialog}
                sx={{
                  minWidth: 132,
                  minHeight: 40,
                  ml: { md: 'auto' },
                  bgcolor: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#1e40af' },
                }}
              >
                เพิ่มสิทธิ์
              </Button>
            </Box>

            <Collapse in={isFilterExpanded} timeout="auto">
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: UI.border,
                  bgcolor: UI.panelSoft,
                  p: { xs: 1.25, md: 1.5 },
                  mb: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: UI.text,
                    lineHeight: '16px',
                    mb: 0.75,
                  }}
                >
                  เงื่อนไขการค้นหา
                </Typography>

                <FormControl
                  size="small"
                  sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', md: 280 },
                    '& .MuiOutlinedInput-root': { minHeight: 36 },
                  }}
                >
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    value={statusFilter}
                    label="สถานะ"
                    onChange={(event) =>
                      setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
                    }
                    sx={{ bgcolor: UI.field }}
                  >
                    <MenuItem value="all">ทั้งหมด</MenuItem>
                    <MenuItem value="active">ใช้ได้</MenuItem>
                    <MenuItem value="inactive">ยังไม่พร้อมใช้</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ borderColor: UI.border, my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setStatusFilter('all');
                      setPage(0);
                    }}
                    sx={{ textTransform: 'none', color: UI.muted }}
                  >
                    ล้างค่า
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setPage(0);
                    }}
                    sx={{
                      textTransform: 'none',
                      boxShadow: 'none',
                      bgcolor: primary,
                      '&:hover': { bgcolor: primaryHover, boxShadow: 'none' },
                    }}
                  >
                    นำไปใช้
                  </Button>
                </Box>
              </Paper>
            </Collapse>

            <DataTable<PermissionTableRow>
              columns={columns}
              data={pagedRows}
              totalCount={tableRows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              loading={loading}
              rowsPerPageOptions={[25, 50, 100]}
              footerSummaryText={`ทั้งหมด ${tableRows.length} รายการ`}
              stickyHeader
              sortable={false}
              emptyMessage="ไม่พบ permission"
              lockEntityColumns
              includeCodeColumn
              includeStatusColumn
              onEditRow={canUpdatePermission ? openEditDialog : undefined}
              onDeleteRow={canDeletePermission ? handleDelete : undefined}
              onToggleRowStatus={canUpdatePermission ? handleToggleStatus : undefined}
              isRowActive={(row) => row.isActive}
              paperSx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 2.5,
                borderColor: UI.border,
                bgcolor: UI.panel,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
              }}
              tableContainerSx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(UI.muted, 0.6)} ${alpha(UI.border, 0.08)}`,
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(UI.border, 0.08),
                  borderLeft: `1px solid ${alpha(UI.border, 0.45)}`,
                  borderRadius: 999,
                  marginBlock: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(UI.muted, 0.58),
                  borderRadius: 999,
                  border: `1px solid ${alpha(UI.panel, 0.65)}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: alpha(UI.muted, 0.75),
                },
              }}
              tableSx={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& .MuiTableCell-root': { px: 1.25 },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  color: UI.text,
                },
                '& .MuiTableBody-root .MuiTableRow-root': {
                  '&:hover': {
                    backgroundColor: alpha(UI.accent, 0.04),
                  },
                },
              }}
            />
          </Box>
        </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setEditingPermission(null);
          setForm(EMPTY_FORM);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitleWithClose
          onClose={() => {
            if (saving) return;
            setDialogOpen(false);
            setEditingPermission(null);
            setForm(EMPTY_FORM);
          }}
        >
          {editingPermission ? 'แก้ไขสิทธิ์' : 'เพิ่มสิทธิ์'}
        </DialogTitleWithClose>

        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 2 }}>
            <TextField
              label="Module / Resource"
              value={form.resource}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  resource: event.target.value,
                }))
              }
              helperText="ใช้รูปแบบ module.resource หรือ module เช่น master.item หรือ warehouse"
              required
            />

            <Autocomplete
              freeSolo
              options={availableActionOptions}
              value={form.action}
              inputValue={form.action}
              onInputChange={(_event, value) =>
                setForm((prev) => ({
                  ...prev,
                  action: value,
                }))
              }
              onChange={(_event, value) =>
                setForm((prev) => ({
                  ...prev,
                  action: typeof value === 'string' ? value : value ?? '',
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Action"
                  helperText="พิมพ์ค่าเองได้แบบ snake_case หรือเลือกจาก action ที่มีอยู่ใน DB"
                  required
                />
              )}
            />

            <TextField
              label="คำอธิบาย"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                if (saving) return;
                setDialogOpen(false);
                setEditingPermission(null);
                setForm(EMPTY_FORM);
              }}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editingPermission ? 'บันทึก' : 'เพิ่มสิทธิ์'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
