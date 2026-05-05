'use client';

import { useMemo, useState } from 'react';
import { DataTable, SearchField, type Column } from '@/components/common';
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Add,
  CheckCircleOutlineOutlined,
  GroupsOutlined,
  Refresh,
  Security,
  VpnKeyOutlined,
  WarehouseOutlined,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { deleteUserAssignment } from '../services/user-assignment.api';
import { useUserAssignmentTabs, useUserAssignmentWorkspace } from '../hooks';
import UserAssignmentEditorDialog from '../components/UserAssignmentEditorDialog';
import UserPermissionEditorDialog from '../components/UserPermissionEditorDialog';
import OrganizationPage from './OrganizationPage';
import RolePage from './RolePage';
import PermissionPage from './PermissionPage';
import type { UserAssignmentUserSummary } from '../types';

/* ── UI tokens (match warehouse/material-stock) ────────────────────── */
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
  shadow:
    '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft:
    '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

const SECTION_TABS = [
  { key: 'assignment', label: 'กำหนดสิทธิ' },
  { key: 'organization', label: 'องค์กร' },
  { key: 'role', label: 'บทบาท' },
  { key: 'permission-pool', label: 'คลังสิทธิ' },
] as const;

const menuButtonSx = {
  minHeight: 40,
  px: 2.2,
  py: 0.82,
  borderRadius: 4,
  border: '1px solid',
  borderColor: '#c8d0cb',
  bgcolor: UI.panelSoft,
  color: '#8b9390',
  textTransform: 'none' as const,
  fontWeight: 800,
  fontSize: '0.96rem',
  lineHeight: 1.2,
  '&:hover': {
    bgcolor: UI.accentSurface,
    borderColor: alpha(UI.accent, 0.22),
  },
  '&.Mui-selected': {
    bgcolor: UI.accentSurface,
    color: UI.accent,
    borderColor: alpha(UI.accent, 0.22),
  },
};

/* ── helpers ───────────────────────────────────────────────────────── */
function matchesSearch(user: UserAssignmentUserSummary, query: string): boolean {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return [
    user.username,
    user.displayName,
    user.email,
    user.companyName,
    ...user.roleNames,
  ].some((v) => v.toLowerCase().includes(normalized));
}

/* ── Component ─────────────────────────────────────────────────────── */
export function UserAssignmentPage() {
  const { workspace, loading, error, reload } = useUserAssignmentWorkspace(true);
  const { activeTabKey, setActiveTabKey } = useUserAssignmentTabs();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permDialogUserId, setPermDialogUserId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ---- derived data ---- */
  const rows = useMemo(() => {
    if (!workspace) return [];
    return workspace.users
      .filter((u) => matchesSearch(u, search))
      .sort((a, b) => a.id - b.id);
  }, [workspace, search]);

  const roleChipSx = useMemo(
    () => ({
      height: 28,
      borderRadius: '999px' as const,
      fontWeight: 700,
      bgcolor: `${UI.panelSoft} !important`,
      color: UI.text,
      border: `1px solid ${UI.border}`,
      '& .MuiChip-label': { px: 1.25 },
    }),
    [],
  );

  const statusChipSx = (active: boolean) => ({
    height: 28,
    borderRadius: '999px' as const,
    fontWeight: 700,
    bgcolor: active ? '#d1fae5 !important' : '#f3f4f6 !important',
    color: active ? '#047857' : '#6b7280',
    border: active ? 'none' : `1px solid #d1d5db`,
    '& .MuiChip-label': { px: 1.25 },
  });

  const columns: Column<UserAssignmentUserSummary>[] = useMemo(
    () => [
      {
        id: 'id',
        label: 'No.',
        align: 'center' as const,
        sortable: false,
        format: (_v, _r, meta) =>
          meta ? meta.page * meta.rowsPerPage + meta.rowIndex + 1 : '',
      },
      {
        id: 'username',
        label: '\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19',
        sortable: true,
        sortAccessor: (r) => r.username,
      },
      {
        id: 'displayName',
        label: 'Name',
        sortable: true,
        sortAccessor: (r) => r.displayName,
      },
      {
        id: 'companyName',
        label: '\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17',
        sortable: true,
        sortAccessor: (r) => r.companyName,
      },
      {
        id: 'roleNames',
        label: 'Roles',
        sortable: false,
        format: (_v, row) => (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {row.roleNames.length ? (
              row.roleNames.map((role) => (
                <Chip key={role} size="small" label={role} sx={roleChipSx} />
              ))
            ) : (
              <Chip size="small" label="No roles" sx={roleChipSx} />
            )}
          </Stack>
        ),
      },
      {
        id: 'isActive',
        label: '\u0E2A\u0E16\u0E32\u0E19\u0E30',
        sortable: true,
        sortAccessor: (r) => Number(r.isActive),
        format: (_v, row) => (
          <Chip
            size="small"
            label={row.isActive ? 'Active' : 'Inactive'}
            sx={statusChipSx(row.isActive)}
          />
        ),
      },
    ],
    [roleChipSx],
  );

  const paginatedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );

  /* ---- stat cards ---- */
  const statCards = useMemo(() => {
    const totalUsers = workspace?.users.length ?? 0;
    const activeUsers = workspace?.users.filter((u) => u.isActive).length ?? 0;
    const activeRoles = workspace?.roles.filter((r) => r.isActive).length ?? 0;
    const facilities = workspace?.facilities.length ?? 0;

    return [
      {
        key: 'users',
        title: 'ผู้ใช้ทั้งหมด',
        value: totalUsers,
        subtitle: `${activeUsers} ใช้งานอยู่`,
        icon: <GroupsOutlined sx={{ color: UI.accent, fontSize: 22 }} />,
        iconBg: UI.accentSurface,
        bar: UI.accent,
      },
      {
        key: 'roles',
        title: 'บทบาทที่ใช้งาน',
        value: activeRoles,
        subtitle: `จาก ${workspace?.roles.length ?? 0} บทบาท`,
        icon: <VpnKeyOutlined sx={{ color: '#2563eb', fontSize: 22 }} />,
        iconBg: '#eff3ff',
        bar: '#2563eb',
      },
      {
        key: 'facilities',
        title: 'ฟาร์ม / สถานที่',
        value: facilities,
        subtitle: 'ขอบเขตการมอบหมาย',
        icon: <WarehouseOutlined sx={{ color: '#b45309', fontSize: 22 }} />,
        iconBg: '#fef6e9',
        bar: '#b45309',
      },
      {
        key: 'permissions',
        title: 'สิทธิ์พร้อมใช้',
        value: '--',
        subtitle: 'โหลดตาม demand',
        icon: (
          <CheckCircleOutlineOutlined
            sx={{ color: '#16a34a', fontSize: 22 }}
          />
        ),
        iconBg: '#edfce9',
        bar: '#16a34a',
      },
    ];
  }, [workspace]);

  /* ---- handlers ---- */
  const openCreate = () => {
    setSelectedUserId(null);
    setEditorOpen(true);
  };

  const openEdit = (row: UserAssignmentUserSummary) => {
    setEditorMode('edit');
    setSelectedUserId(row.id);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedUserId(null);
  };

  const openPermDialog = (row: UserAssignmentUserSummary) => {
    setPermDialogUserId(row.id);
    setPermDialogOpen(true);
  };

  const closePermDialog = () => {
    setPermDialogOpen(false);
    setPermDialogUserId(null);
  };

  const handleSaved = async () => {
    try {
      await reload();
    } catch {
      /* keep stale data */
    }
  };

  const handleDelete = async (row: UserAssignmentUserSummary) => {
    const confirm = await Swal.fire({
      title: `Delete ${row.username}?`,
      text: 'This will deactivate the user from the assignment list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteUserAssignment(row.id);
      await reload();
      await Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: `${row.username} has been deactivated.`,
      });
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete user assignment.';
      await Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
    }
  };

  /* ── loading skeleton ── */
  if (loading && !workspace) {
    return (
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          p: { xs: 1.5, md: 2 },
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /* ── render ── */
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1.5, md: 2 } }}>
      {/* ── Hero panel ── */}
      <Box
        sx={{
          ...panelSx,
          background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label="Admin / User Assignment"
            sx={{
              bgcolor: '#fff',
              color: UI.accent,
              fontWeight: 800,
              border: `1px solid ${UI.borderStrong}`,
              height: 28,
              borderRadius: '999px',
              '& .MuiChip-label': { px: 1.25 },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '1.9rem', md: '2.35rem' },
                fontWeight: 900,
                lineHeight: 1.02,
                color: UI.text,
                letterSpacing: '-0.03em',
              }}
            >
              จัดการผู้ใช้งาน
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Admin / กำหนดสิทธิ
          </Typography>
        </Box>
      </Box>

      {/* ── Stat cards ── */}
      <Box
        mb={2}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.2,
        }}
      >
        {statCards.map((item) => (
          <Paper
            key={item.key}
            variant="outlined"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: 1.5,
              borderColor: UI.border,
              bgcolor: UI.panel,
              boxShadow: UI.shadow,
              borderRadius: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${alpha(item.iconBg, 0.8)} 0%, rgba(255,255,255,0) 55%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.1, color: '#172422' }}
                >
                  {item.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: UI.text, mt: 0.45, fontWeight: 800 }}
                >
                  {item.title}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 1.75,
                  bgcolor: '#fff',
                  border: `1px solid ${alpha(item.bar, 0.15)}`,
                  boxShadow: UI.shadowSoft,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
            </Box>
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                width: 96,
                height: 6,
                borderRadius: 999,
                bgcolor: alpha(item.bar, 0.2),
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: '100%',
                  borderRadius: 999,
                  bgcolor: item.bar,
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'block',
                color: UI.muted,
                mt: 0.8,
              }}
            >
              {item.subtitle}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Tab bar (StockPage style) ── */}
      <Box sx={{ ...panelSx, px: 1, py: 1, mb: 2 }}>
        <Tabs
          value={activeTabKey}
          onChange={(_, value) => setActiveTabKey(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 0,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': {
              gap: 0.8,
              flexWrap: { xs: 'nowrap', md: 'wrap' },
            },
          }}
        >
          {SECTION_TABS.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={tab.label}
              sx={menuButtonSx}
            />
          ))}
        </Tabs>
      </Box>

      {/* ── Tab content ── */}
      {activeTabKey === 'organization' && <OrganizationPage />}
      {activeTabKey === 'role' && <RolePage />}
      {activeTabKey === 'permission-pool' && <PermissionPage />}

      {activeTabKey === 'assignment' && (
        <Stack spacing={2.5}>
          {/* ── Error alert ── */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* ── Table panel ── */}
          <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={2.25}>
              {/* header row */}
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', md: 'center' }}
                sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: UI.border }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
                >
                  <Button
                    startIcon={<Refresh />}
                    variant="outlined"
                    onClick={() => {
                      void reload().catch(() => undefined);
                    }}
                    disabled={loading}
                    sx={{
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderColor: UI.border,
                      bgcolor: UI.panelSoft,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: UI.accentSurface,
                        borderColor: alpha(UI.accent, 0.22),
                      },
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    startIcon={<Security />}
                    variant="outlined"
                    onClick={() => {
                      if (rows.length === 1) openPermDialog(rows[0]);
                    }}
                    disabled={!workspace || rows.length !== 1}
                    title={
                      rows.length !== 1
                        ? '\u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E1E\u0E35\u0E22\u0E07 1 \u0E04\u0E19'
                        : `\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C ${rows[0]?.username}`
                    }
                    sx={{
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderColor: UI.border,
                      bgcolor: UI.panelSoft,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: UI.accentSurface,
                        borderColor: alpha(UI.accent, 0.22),
                      },
                    }}
                  >
                    จัดการสิทธิ์
                  </Button>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={openCreate}
                    disabled={!workspace}
                    sx={{
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      boxShadow: 'none',
                      bgcolor: '#1d4ed8',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#1e40af',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add User
                  </Button>
                </Stack>
              </Stack>

              {/* search row */}
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', lg: 'center' }}
                justifyContent="space-between"
                sx={{ pb: 0.5 }}
              >
                <SearchField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username, name, email, company, or role"
                  fullWidth
                  sx={{
                    maxWidth: { xs: '100%', lg: 560 },
                    '& .MuiOutlinedInput-root': { bgcolor: UI.field },
                  }}
                />
              </Stack>

              {/* data table */}
              <DataTable<UserAssignmentUserSummary>
                columns={columns}
                data={paginatedRows}
                loading={loading}
                emptyMessage={
                  search ? 'No users match your search.' : 'No users available.'
                }
                onEditRow={openEdit}
                onDeleteRow={handleDelete}
                includeCodeColumn={false}
                includeStatusColumn={false}
                includeManagementColumn
                rowHeight={68}
                idColumnWidth={64}
                statusColumnWidth={100}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={rows.length}
                onPageChange={setPage}
                onRowsPerPageChange={(n) => {
                  setRowsPerPage(n);
                  setPage(0);
                }}
                paperSx={{
                  borderRadius: 2.5,
                  borderColor: UI.border,
                  bgcolor: UI.panel,
                  boxShadow: 'none',
                }}
                tableContainerSx={{ overflowX: 'auto' }}
                tableSx={{
                  '& .MuiTableCell-root': { py: 1.25 },
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
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* ── Dialogs (always rendered) ── */}
      <UserAssignmentEditorDialog
        open={editorOpen}
        mode={editorMode}
        userId={selectedUserId}
        workspace={workspace}
        onClose={closeEditor}
        onSaved={handleSaved}
      />

      <UserPermissionEditorDialog
        open={permDialogOpen}
        userId={permDialogUserId}
        workspace={workspace}
        onClose={closePermDialog}
        onSaved={handleSaved}
      />
    </Box>
  );
}

export default UserAssignmentPage;
