'use client';

import { useMemo, useState } from 'react';
import { DataTable, SearchField, type Column } from '@/components/common';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
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
import { WorkspaceHeader, StatsCard, PageTabs } from '@/design-system';
import Swal from 'sweetalert2';
import { deleteUserAssignment } from '../services/user-assignment.api';
import { useUserAssignmentTabs, useUserAssignmentWorkspace } from '../hooks';
import UserAssignmentEditorDialog from '../components/UserAssignmentEditorDialog';
import UserPermissionEditorDialog from '../components/UserPermissionEditorDialog';
import OrganizationPage from './OrganizationPage';
import RolePage from './RolePage';
import PermissionPage from './PermissionPage';
import type { UserAssignmentUserSummary } from '../types';

const panelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

const SECTION_TABS = [
  { key: 'assignment', label: 'กำหนดสิทธิ' },
  { key: 'organization', label: 'องค์กร' },
  { key: 'role', label: 'บทบาท' },
  { key: 'permission-pool', label: 'คลังสิทธิ' },
] as const;

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
  const theme = useTheme();
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

  const totalUsers = workspace?.users.length ?? 0;
  const activeUsers = workspace?.users.filter((u) => u.isActive).length ?? 0;
  const activeRoles = workspace?.roles.filter((r) => r.isActive).length ?? 0;
  const facilities = workspace?.facilities.length ?? 0;

  const roleChipSx = useMemo(
    () => ({
      height: 28,
      borderRadius: '999px' as const,
      fontWeight: 700,
      bgcolor: 'action.hover',
      color: 'text.primary',
      border: '1px solid',
      borderColor: 'divider',
      '& .MuiChip-label': { px: 1.25 },
    }),
    [],
  );

  const statusChipSx = (active: boolean) => ({
    height: 28,
    borderRadius: '999px' as const,
    fontWeight: 700,
    bgcolor: active
      ? alpha(theme.palette.error.main, 0.08)
      : alpha(theme.palette.text.disabled, 0.08),
    color: active ? theme.palette.error.main : theme.palette.text.disabled,
    border: active ? 'none' : '1px solid',
    borderColor: active ? undefined : 'divider',
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
        label: 'ผู้ใช้งาน',
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
        label: 'บริษัท',
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
        label: 'สถานะ',
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
    [roleChipSx, theme.palette.error.main, theme.palette.text.disabled],
  );

  const paginatedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );

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
          p: { xs: 1, md: 2 },
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
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
      <WorkspaceHeader
        chipLabel="Admin / User Assignment"
        title="จัดการผู้ใช้งาน"
        meta="Admin / กำหนดสิทธิ"
      />

      <Stack spacing={2.5}>
        {/* ── Stat cards ── */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="ผู้ใช้ทั้งหมด"
              value={totalUsers}
              subtitle={`${activeUsers} ใช้งานอยู่`}
              icon={<GroupsOutlined />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="บทบาทที่ใช้งาน"
              value={activeRoles}
              subtitle={`จาก ${workspace?.roles.length ?? 0} บทบาท`}
              icon={<VpnKeyOutlined />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="ฟาร์ม / สถานที่"
              value={facilities}
              subtitle="ขอบเขตการมอบหมาย"
              icon={<WarehouseOutlined />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="สิทธิ์พร้อมใช้"
              value="--"
              subtitle="โหลดตาม demand"
              icon={<CheckCircleOutlineOutlined />}
              color="error"
            />
          </Grid>
        </Grid>

        {/* ── Tab bar ── */}
        <PageTabs
          tabs={SECTION_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
          activeKey={activeTabKey}
          onChange={(key) => setActiveTabKey(key as typeof activeTabKey)}
        />

        {/* ── Tab content ── */}
        {activeTabKey === 'organization' && <OrganizationPage />}
        {activeTabKey === 'role' && <RolePage />}
        {activeTabKey === 'permission-pool' && <PermissionPage />}

        {activeTabKey === 'assignment' && (
          <Stack spacing={2.5}>
            {/* ── Error alert ── */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* ── Table panel ── */}
            <Box sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}>
              <Stack spacing={2.25}>
                {/* header row */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
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
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
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
                          ? 'กรุณาค้นหาให้เหลือผู้ใช้เพียง 1 คน'
                          : `จัดการสิทธิ์ ${rows[0]?.username}`
                      }
                      sx={{
                        minHeight: 36,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
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
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'primary.dark',
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
                      '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' },
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
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: 'none',
                  }}
                  tableContainerSx={{ overflowX: 'auto' }}
                  tableSx={{
                    '& .MuiTableCell-root': { py: 1.25 },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontWeight: 800,
                      letterSpacing: 0.2,
                      color: 'text.primary',
                    },
                    '& .MuiTableBody-root .MuiTableRow-root': {
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    },
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>

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
