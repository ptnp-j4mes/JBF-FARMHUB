'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Add, Business, People } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { extractApiErrorMessage } from '@/lib/api-error';
import {
  DataTable,
  DialogTitleWithClose,
  SearchField,
  type Column,
} from '@/components/common';
import { userService } from '@/features/admin/user-assignment/services';
import type { CompanyResponse, CompanyUpsertRequest } from '@/features/admin/user-assignment/types';
import {
  canAddUserAssignment,
  canEditUserAssignment,
  canSoftDeleteUserAssignment,
} from '@/lib/access/modules/user-assignment.guard';

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

const primary = '#1d4ed8';
const primaryHover = '#1e40af';

let companyListCache: CompanyResponse[] | null = null;
let companyListRequest: Promise<CompanyResponse[]> | null = null;

function cacheCompanies(rows: CompanyResponse[]): CompanyResponse[] {
  companyListCache = rows;
  return rows;
}

async function getCompaniesWithCache(force = false): Promise<CompanyResponse[]> {
  if (!force && companyListCache) {
    return companyListCache;
  }

  if (!force && companyListRequest) {
    return companyListRequest;
  }

  companyListRequest = userService.companies
    .getAll({ includeInactive: true })
    .then((rows) => cacheCompanies(rows))
    .finally(() => {
      companyListRequest = null;
    });

  return companyListRequest;
}

interface CompanyTableRow {
  id: number;
  _dbId: number;
  code: string;
  name: string;
  activeUserCount: number;
  isActive: boolean;
}

interface CompanyFormState {
  code: string;
  name: string;
}

const EMPTY_FORM: CompanyFormState = {
  code: '',
  name: '',
};

export default function OrganizationPage() {
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

  const canCreate = canAddUserAssignment();
  const canUpdate = canEditUserAssignment();
  const canDelete = canSoftDeleteUserAssignment();

  const [loading, setLoading] = useState(companyListCache === null);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyResponse[]>(companyListCache ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyResponse | null>(null);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<Partial<CompanyFormState>>({});

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && companyListCache) {
      setCompanies(companyListCache);
      setLoading(false);
      return companyListCache;
    }

    setLoading(true);
    try {
      const rows = await getCompaniesWithCache(Boolean(options?.force));
      cacheCompanies(rows);
      setCompanies(rows);
      return rows;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query),
    );
  }, [companies, searchQuery]);

  const tableRows = useMemo<CompanyTableRow[]>(
    () =>
      filteredCompanies.map((c, index) => ({
        id: index + 1,
        _dbId: c.id,
        code: c.code,
        name: c.name,
        activeUserCount: c.activeUserCount,
        isActive: c.isActive,
      })),
    [filteredCompanies],
  );

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return tableRows.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, tableRows]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(tableRows.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, rowsPerPage, tableRows.length]);

  const columns = useMemo<Column<CompanyTableRow>[]>(
    () => [
      { id: 'id', label: 'ลำดับ', minWidth: 52, align: 'center' },
      { id: 'code', label: 'รหัส', minWidth: 120 },
      { id: 'name', label: 'ชื่อองค์กร', minWidth: 240 },
      {
        id: 'activeUserCount',
        label: 'ผู้ใช้งาน',
        minWidth: 100,
        align: 'center',
        format: (value) => (
          <Chip
            icon={<People sx={{ fontSize: '13px !important' }} />}
            label={String(value)}
            size="small"
            sx={{
              height: 28,
              borderRadius: '999px',
              fontWeight: 700,
              bgcolor: `${UI.panelSoft} !important`,
              color: UI.text,
              border: `1px solid ${UI.border}`,
              '& .MuiChip-label': { px: 1.25 },
              '& .MuiChip-icon': { color: UI.accent },
            }}
          />
        ),
      },
      {
        id: 'isActive',
        label: 'สถานะ',
        minWidth: 84,
        format: (value) => (value ? 'ใช้งาน' : 'ระงับ'),
      },
    ],
    [],
  );

  const validateForm = (data: CompanyFormState): Partial<CompanyFormState> => {
    const errors: Partial<CompanyFormState> = {};
    if (!data.code.trim()) errors.code = 'กรุณากรอกรหัสองค์กร';
    else if (!/^[A-Z0-9_-]+$/i.test(data.code.trim()))
      errors.code = 'รหัสใช้ได้เฉพาะ A–Z, 0–9, _ และ -';
    if (!data.name.trim()) errors.name = 'กรุณากรอกชื่อองค์กร';
    return errors;
  };

  const openCreateDialog = () => {
    setEditingCompany(null);
    setForm(EMPTY_FORM);
    setFormError({});
    setDialogOpen(true);
  };

  const openEditDialog = (row: CompanyTableRow) => {
    const company = companies.find((c) => c.id === row._dbId);
    if (!company) return;
    setEditingCompany(company);
    setForm({ code: company.code, name: company.name });
    setFormError({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingCompany(null);
    setForm(EMPTY_FORM);
    setFormError({});
  };

  const handleDelete = async (row: CompanyTableRow) => {
    if (!canDelete || saving) return;
    const company = companies.find((c) => c.id === row._dbId);
    if (!company) return;

    const result = await showAlert({
      icon: 'warning',
      title: 'ยืนยันลบองค์กร?',
      text: `คุณต้องการลบองค์กร ${company.name} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      await userService.companies.deactivate(row._dbId);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        text: 'ระบบได้ลบข้อมูลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
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

  const handleToggleStatus = async (row: CompanyTableRow) => {
    if (!canUpdate || saving) return;
    const company = companies.find((c) => c.id === row._dbId);
    if (!company) return;

    const nextIsActive = !company.isActive;
    const result = await showAlert({
      icon: 'warning',
      title: 'ยืนยันเปลี่ยนสถานะองค์กร?',
      text: `คุณต้องการ${company.isActive ? 'ระงับ' : 'เปิดใช้งาน'}องค์กร ${company.name} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: company.isActive ? '#f59e0b' : '#0ea5e9',
    });
    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      await userService.companies.setStatus(row._dbId, nextIsActive);
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
    const trimmed: CompanyFormState = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    };
    const errors = validateForm(trimmed);
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    const payload: CompanyUpsertRequest = { code: trimmed.code, name: trimmed.name };

    const confirm = await showAlert({
      icon: 'question',
      title: editingCompany ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มองค์กร?',
      text: editingCompany
        ? `คุณต้องการบันทึกการแก้ไของค์กร ${editingCompany.name} หรือไม่`
        : `คุณต้องการเพิ่มองค์กร ${payload.name} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: primary,
    });
    if (!confirm.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      if (editingCompany) {
        await userService.companies.update(editingCompany.id, payload);
      } else {
        await userService.companies.create(payload);
      }
      closeDialog();
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

  /* ── styles ────────────────────────────────────────────────── */
  const scrollbarSx = {
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
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: UI.border },
      '&:hover fieldset': { borderColor: alpha(primary, 0.6) },
      '&.Mui-focused fieldset': { borderColor: primary },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
  };

  return (
    <>
      <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* ── toolbar ── */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 1.25,
              }}
            >
              <SearchField
                placeholder="ค้นหาองค์กร"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                disabled={saving}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 260 },
                  maxWidth: { md: 400 },
                  '& .MuiOutlinedInput-root': { bgcolor: UI.field },
                }}
              />

              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                disabled={!canCreate || saving}
                onClick={openCreateDialog}
                sx={{
                  minWidth: 148,
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
                เพิ่มองค์กร
              </Button>
            </Box>

            {/* ── table ── */}
            <DataTable<CompanyTableRow>
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
              footerSummaryText={`ทั้งหมด ${tableRows.length} องค์กร`}
              stickyHeader
              sortable={false}
              emptyMessage="ไม่พบข้อมูลองค์กร"
              lockEntityColumns
              includeCodeColumn
              includeStatusColumn
              onEditRow={canUpdate ? openEditDialog : undefined}
              onDeleteRow={canDelete ? handleDelete : undefined}
              onToggleRowStatus={canUpdate ? handleToggleStatus : undefined}
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
              tableContainerSx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', ...scrollbarSx }}
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

      {/* ── Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `1px solid ${UI.border}`,
          },
        }}
      >
        <DialogTitleWithClose onClose={closeDialog} disabled={saving}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ color: primary, fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: UI.text }}>
              {editingCompany ? 'แก้ไของค์กร' : 'เพิ่มองค์กร'}
            </Typography>
          </Box>
        </DialogTitleWithClose>

        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField
              label="รหัสองค์กร"
              value={form.code}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, code: e.target.value }));
                setFormError((prev) => ({ ...prev, code: undefined }));
              }}
              disabled={Boolean(editingCompany) || saving}
              required
              placeholder="เช่น JBF, PTG"
              helperText={
                formError.code ||
                (editingCompany ? 'ไม่สามารถเปลี่ยนรหัสได้' : 'ใช้ได้เฉพาะ A–Z, 0–9, _ และ - (จะแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ)')
              }
              error={Boolean(formError.code)}
              inputProps={{ style: { textTransform: 'uppercase' } }}
              sx={fieldSx}
            />

            <TextField
              label="ชื่อองค์กร"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setFormError((prev) => ({ ...prev, name: undefined }));
              }}
              disabled={saving}
              required
              placeholder="เช่น JB Farm Co., Ltd."
              helperText={formError.name || ' '}
              error={Boolean(formError.name)}
              sx={fieldSx}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
            <Button
              onClick={closeDialog}
              disabled={saving}
              sx={{ textTransform: 'none', color: UI.muted }}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={saving}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 100,
                bgcolor: primary,
                '&:hover': { bgcolor: primaryHover },
              }}
            >
              {saving ? 'กำลังบันทึก…' : editingCompany ? 'บันทึก' : 'เพิ่มองค์กร'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
