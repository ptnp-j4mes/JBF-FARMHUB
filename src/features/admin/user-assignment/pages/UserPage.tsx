'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Add,
  EditOutlined,
  LockResetOutlined,
  VpnKey,
  VisibilityOffOutlined,
  VisibilityOutlined,
  DeleteOutline,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ContentCard,
  DataTable,
  DialogTitleWithClose,
  SearchField,
  type Column,
} from '@/components/common';
import { formatUserDisplayName } from '@/lib/user-display';
import { extractApiErrorMessage } from '@/lib/api-error';
import {
  userService,
} from '@/features/admin/user-assignment/services';
import type {
  CompanyResponse,
  UserResponse,
} from '@/features/admin/user-assignment/types';
import {
  canAddUserAssignment,
  canManageUserAssignment,
  canSoftDeleteUserAssignment,
  canEditUserAssignment,
} from '@/lib/access/modules/user-assignment.guard';
import { invalidateUserAssignmentWorkspaceCache } from '../components';

let userListCache: UserResponse[] | null = null;
let userListRequest: Promise<UserResponse[]> | null = null;
let companyListCache: CompanyResponse[] | null = null;
let companyListRequest: Promise<CompanyResponse[]> | null = null;

function cacheUsers(rows: UserResponse[]): UserResponse[] {
  userListCache = rows;
  return rows;
}

async function getUsersWithCache(force = false): Promise<UserResponse[]> {
  if (!force && userListCache) {
    return userListCache;
  }

  if (!force && userListRequest) {
    return userListRequest;
  }

  userListRequest = userService.users
    .getAll()
    .then((rows) => cacheUsers(rows))
    .finally(() => {
      userListRequest = null;
    });

  return userListRequest;
}

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

interface UserFormState {
  username: string;
  password: string;
  companyId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserTableRow {
  id: number;
  _dbId: number;
  code: string;
  fullName: string;
  organization: string;
  email: string;
  createdDate: string;
  isActive: boolean;
}

const EMPTY_FORM: UserFormState = {
  username: '',
  password: '',
  companyId: '',
  prefix: '',
  firstName: '',
  lastName: '',
  email: '',
};

const PREFIX_OPTIONS = ['นาย', 'นาง', 'นางสาว'] as const;

export default function UserPage() {
  const theme = useTheme();
  const colors = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? {
            cardBg: '#0f172a',
            line: alpha('#94a3b8', 0.24),
            title: '#e2e8f0',
            subtitle: '#94a3b8',
          }
        : {
            cardBg: '#ffffff',
            line: '#e2e8f0',
            title: '#1e293b',
            subtitle: '#64748b',
          },
    [theme.palette.mode],
  );
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

  const canCreateUser = canAddUserAssignment();
  const canUpdateUser = canEditUserAssignment();
  const canDeleteUser = canSoftDeleteUserAssignment();
  const canResetPassword = canManageUserAssignment();

  const [loading, setLoading] = useState(userListCache === null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>(userListCache ?? []);
  const [companies, setCompanies] = useState<CompanyResponse[]>(companyListCache ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<UserResponse | null>(null);
  const [resetPasswordDraft, setResetPasswordDraft] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Generate 8 character OWASP compliant password
  const generateOWASPPassword = useCallback(() => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const num = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|';

    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      num[Math.floor(Math.random() * num.length)],
      special[Math.floor(Math.random() * special.length)]
    ];

    const all = upper + lower + num + special;
    for (let i = chars.length; i < 8; i++) {
        chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }, []);

  const isValidPassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
  };

  const syncUsers = useCallback((rows: UserResponse[]) => {
    cacheUsers(rows);
    setUsers(rows);
  }, []);

  const updateCachedUsers = useCallback((updater: (rows: UserResponse[]) => UserResponse[]) => {
    const nextRows = updater(userListCache ?? []);
    cacheUsers(nextRows);
    setUsers(nextRows);
    return nextRows;
  }, []);

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && userListCache) {
      setUsers(userListCache);
      setLoading(false);
      return userListCache;
    }

    setLoading(true);
    try {
      const userRows = await getUsersWithCache(Boolean(options?.force));
      syncUsers(userRows);
      return userRows;
    } finally {
      setLoading(false);
    }
  }, [syncUsers]);

  const loadCompanies = useCallback(async (options?: { force?: boolean }) => {
    const rows = await getCompaniesWithCache(Boolean(options?.force));
    setCompanies(rows);
    return rows;
  }, []);

  useEffect(() => {
    if (userListCache) {
      setUsers(userListCache);
      setLoading(false);
      return;
    }

    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (companyListCache) {
      setCompanies(companyListCache);
      return;
    }

    void loadCompanies();
  }, [loadCompanies]);

  const activeCompanyOptions = useMemo(
    () => companies.filter((company) => company.isActive),
    [companies],
  );

  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === form.companyId) ?? null,
    [companies, form.companyId],
  );

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = formatUserDisplayName(user, user.username).toLowerCase();
      return (
        !query ||
        user.username.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        user.companyName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, users]);

  const tableRows = useMemo<UserTableRow[]>(() => {
    return filteredUsers.map((user, index) => ({
      id: index + 1,
      _dbId: user.id,
      code: user.username,
      fullName: formatUserDisplayName(user, user.username),
      organization: user.companyName,
      email: user.email,
      createdDate: user.createdDate,
      isActive: user.isActive,
    }));
  }, [filteredUsers]);

  const columns = useMemo<Column<UserTableRow>[]>(
    () => [
      { id: 'id', label: 'ID', minWidth: 52, align: 'center' },
      { id: 'code', label: 'รหัสผู้ใช้', minWidth: 130 },
      { id: 'fullName', label: 'ชื่อ-นามสกุล', minWidth: 190 },
      { id: 'organization', label: 'องค์กร', minWidth: 180 },
      { id: 'email', label: 'อีเมล', minWidth: 220 },
      {
        id: 'isActive',
        label: 'สถานะ',
        minWidth: 84,
        format: (value) => (value ? 'ใช้งาน' : 'ระงับ'),
      },
    ],
    [],
  );

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

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
  }, []);

  const closeResetPasswordDialog = useCallback(() => {
    if (resettingPassword) {
      return;
    }

    setResetPasswordDialogOpen(false);
    setResetPasswordTarget(null);
    setResetPasswordDraft('');
    setResetPasswordResult('');
    setShowResetPassword(false);
  }, [resettingPassword]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setShowPassword(false);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (row: UserTableRow) => {
    const user = users.find((item) => item.id === row._dbId);
    if (!user) {
      return;
    }

    setEditingUser(user);
    setShowPassword(false);
    setForm({
      username: user.username,
      password: '',
      companyId: String(user.companyId),
      prefix: PREFIX_OPTIONS.includes((user.prefix ?? '').trim() as (typeof PREFIX_OPTIONS)[number])
        ? (user.prefix ?? '').trim()
        : '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    setDialogOpen(true);
  };

  const openResetPasswordDialog = (row: UserTableRow) => {
    const user = users.find((item) => item.id === row._dbId);
    if (!user) {
      return;
    }

    setResetPasswordTarget(user);
    setResetPasswordDraft(generateOWASPPassword());
    setResetPasswordResult('');
    setShowResetPassword(true);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget || !canResetPassword) return;

    const nextPassword = resetPasswordDraft.trim();
    if (!isValidPassword(nextPassword)) {
      void showAlert({
        icon: 'warning',
        title: 'รหัสผ่านไม่ปลอดภัย',
        text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร รวมถึงมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อย 1 ตัว',
      });
      return;
    }

    const confirmation = await showAlert({
      icon: 'warning',
      title: 'ยืนยันรีเซ็ตรหัสผ่าน?',
      text: `รหัสผ่านเดิมของ ${resetPasswordTarget.username} จะใช้ไม่ได้ทันที`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setResettingPassword(true);
    setResetPasswordResult('');
    try {
      await userService.users.resetPassword(resetPasswordTarget.id, {
        newPassword: nextPassword,
        confirmNewPassword: nextPassword,
      });
      setResetPasswordResult(nextPassword);
      void showAlert({
        icon: 'success',
        title: 'รีเซ็ตรหัสผ่านสำเร็จ',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error(error);
      void showAlert({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง'
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleStatus = useCallback(async (row: UserTableRow) => {
    if (!canUpdateUser || saving) {
      return;
    }

    const user = users.find((item) => item.id === row._dbId);
    if (!user) {
      return;
    }

    const result = await showAlert({
      icon: 'warning',
      title: 'ยืนยันเปลี่ยนสถานะผู้ใช้?',
      text: `คุณต้องการ${user.isActive ? 'ระงับ' : 'เปิดใช้งาน'}ผู้ใช้ ${user.username} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: user.isActive ? '#f59e0b' : '#B42318',
    });

    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);
    const previousUsers = userListCache ?? users;
    updateCachedUsers((rows) =>
      rows.map((item) =>
        item.id === row._dbId
          ? {
              ...item,
              isActive: !user.isActive,
            }
          : item,
      ),
    );
    try {
      await userService.users.update(row._dbId, {
        isActive: !user.isActive,
      });
      invalidateUserAssignmentWorkspaceCache();
      userListRequest = null;
      void showAlert({
        icon: 'success',
        title: 'เปลี่ยนสถานะสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      syncUsers(previousUsers);
      void showAlert({
        icon: 'error',
        title: 'เปลี่ยนสถานะไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถเปลี่ยนสถานะได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  }, [canUpdateUser, saving, showAlert, syncUsers, updateCachedUsers, users]);

  const handleHardDelete = useCallback(async (row: UserTableRow) => {
    if (!canDeleteUser || saving) {
      return;
    }

    const user = users.find((item) => item.id === row._dbId);
    if (!user) {
      return;
    }

    const result = await showAlert({
      icon: 'warning',
      title: 'ยืนยันลบผู้ใช้',
      text: `คุณต้องการลบผู้ใช้ ${user.username} อย่างถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);
    const previousUsers = userListCache ?? users;
    updateCachedUsers((rows) => rows.filter((item) => item.id !== row._dbId));

    try {
      await userService.users.deactivate(row._dbId);
      invalidateUserAssignmentWorkspaceCache();
      userListRequest = null;

      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        text: 'ระบบได้ลบข้อมูลเรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      syncUsers(previousUsers);
      void showAlert({
        icon: 'error',
        title: 'ไม่สามารถลบข้อมูลได้',
        text: extractApiErrorMessage(
          error,
          'ไม่สามารถลบข้อมูลได้ เนื่องจากมีการอ้างอิงหรือใช้งานอยู่ในระบบ',
        ),
      });
    } finally {
      setSaving(false);
    }
  }, [canDeleteUser, saving, syncUsers, updateCachedUsers, users, showAlert]);

  const handleSave = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((!editingUser && !canCreateUser) || (editingUser && !canUpdateUser)) {
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.companyId) {
      return;
    }

    if (!editingUser) {
      if (!form.username.trim() || !form.password.trim()) {
        return;
      }
      if (!isValidPassword(form.password)) {
        void showAlert({
          icon: 'warning',
          title: 'รหัสผ่านไม่ปลอดภัย',
          text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร รวมถึงมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อย 1 ตัว'
        });
        return;
      }
    }

    const companyId = Number(form.companyId);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return;
    }
    const companyName =
      companies.find((item) => item.id === companyId)?.name ??
      selectedCompany?.name ??
      editingUser?.companyName ??
      '';

    const confirmation = await showAlert({
      icon: 'question',
      title: editingUser ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มผู้ใช้?',
      text: editingUser
        ? `คุณต้องการบันทึกการแก้ไขผู้ใช้ ${editingUser.username} หรือไม่`
        : `คุณต้องการเพิ่มผู้ใช้ ${form.username.trim()} หรือไม่`,
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
      if (editingUser) {
        await userService.users.update(editingUser.id, {
          companyId,
          prefix: form.prefix.trim() || null,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        });
        updateCachedUsers((rows) =>
          rows.map((item) =>
            item.id === editingUser.id
              ? {
                  ...item,
                  companyId,
                  companyName,
                  prefix: form.prefix.trim() || null,
                  firstName: form.firstName.trim(),
                  lastName: form.lastName.trim(),
                  email: form.email.trim(),
                }
              : item,
          ),
        );
      } else {
        const createdUser = await userService.users.create({
          username: form.username.trim(),
          password: form.password,
          companyId,
          prefix: form.prefix.trim() || null,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        });
        updateCachedUsers((rows) => [...rows, createdUser]);
      }

      invalidateUserAssignmentWorkspaceCache();
      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      userListRequest = null;

      void showAlert({
        icon: 'success',
        title: editingUser ? 'บันทึกสำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error(error);
      void showAlert({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: extractApiErrorMessage(
          error,
          editingUser
            ? 'ไม่สามารถบันทึกการแก้ไขได้ โปรดลองอีกครั้ง'
            : 'ไม่สามารถเพิ่มผู้ใช้ได้ โปรดลองอีกครั้ง',
        ),
      });
    } finally {
      setSaving(false);
    }
  }, [canCreateUser, canUpdateUser, companies, editingUser, form.companyId, form.email, form.firstName, form.lastName, form.password, form.prefix, form.username, resetForm, selectedCompany?.name, showAlert, updateCachedUsers]);

  return (
    <>
      <ContentCard borderColor={colors.line} backgroundColor={colors.cardBg} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                placeholder="ค้นหาผู้ใช้"
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
                  '& .MuiOutlinedInput-root': { bgcolor: alpha(colors.cardBg, 0.7) },
                }}
              />

              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                disabled={!canCreateUser || saving}
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
                เพิ่มผู้ใช้
              </Button>
            </Box>

            <DataTable<UserTableRow>
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
              emptyMessage="ไม่พบข้อมูลผู้ใช้"
              lockEntityColumns
              includeCodeColumn
              includeStatusColumn
              manageColumnWidth={132}
              onEditRow={canUpdateUser ? openEditDialog : undefined}
              onToggleRowStatus={canUpdateUser ? handleToggleStatus : undefined}
              renderManageActions={(row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                  {canUpdateUser ? (
                    <Tooltip title={row.isActive ? 'ระงับ' : 'ใช้งาน'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleToggleStatus(row)}
                          disabled={saving || resettingPassword}
                          sx={{ color: row.isActive ? '#64748b' : '#B42318', p: 0.5 }}
                        >
                          {row.isActive ? (
                            <VisibilityOutlined fontSize="inherit" />
                          ) : (
                            <VisibilityOffOutlined fontSize="inherit" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                  {canUpdateUser ? (
                    <Tooltip title="แก้ไข">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(row)}
                          disabled={saving || resettingPassword}
                          sx={{ color: '#B42318', p: 0.5 }}
                        >
                          <EditOutlined fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                  {canResetPassword ? (
                    <Tooltip title="รีเซ็ตรหัสผ่าน">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => openResetPasswordDialog(row)}
                          disabled={saving || resettingPassword}
                          sx={{ color: '#7c3aed', p: 0.5 }}
                        >
                          <LockResetOutlined fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                  {canDeleteUser ? (
                    <Tooltip title="ลบถาวร">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleHardDelete(row)}
                          disabled={saving || resettingPassword}
                          sx={{ color: '#ef4444', p: 0.5 }}
                        >
                          <DeleteOutline fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                </Box>
              )}
              isRowActive={(row) => row.isActive}
              paperSx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 1.25,
                borderColor: colors.line,
                bgcolor: colors.cardBg,
                display: 'flex',
                flexDirection: 'column',
              }}
              tableContainerSx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(colors.subtitle, 0.6)} ${alpha(colors.line, 0.08)}`,
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(colors.line, 0.08),
                  borderLeft: `1px solid ${alpha(colors.line, 0.45)}`,
                  borderRadius: 999,
                  marginBlock: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(colors.subtitle, 0.58),
                  borderRadius: 999,
                  border: `1px solid ${alpha(colors.cardBg, 0.65)}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: alpha(colors.subtitle, 0.75),
                },
              }}
              tableSx={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& .MuiTableCell-root': { px: 1.25 },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.title,
                  fontSize: '13px',
                },
                '& .MuiTableBody-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.subtitle,
                  fontSize: '12px',
                },
                '& .MuiTableHead-root .MuiTableCell-root:not(:last-of-type), & .MuiTableBody-root .MuiTableCell-root:not(:last-of-type)': {
                  borderRight: `1px solid ${colors.line}`,
                },
              }}
            />
          </Box>
        </ContentCard>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setEditingUser(null);
          resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitleWithClose
          onClose={() => {
            if (saving) return;
            setDialogOpen(false);
            setEditingUser(null);
            resetForm();
          }}
        >
          {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
        </DialogTitleWithClose>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 2 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  username: event.target.value,
                }))
              }
              disabled={Boolean(editingUser)}
              required={!editingUser}
            />
            <FormControl fullWidth required>
              <InputLabel id="user-company-label">บริษัท</InputLabel>
              <Select
                labelId="user-company-label"
                label="บริษัท"
                value={form.companyId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    companyId: String(event.target.value),
                  }))
                }
              >
                {activeCompanyOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    ไม่มีข้อมูลองค์กร
                  </MenuItem>
                ) : null}
                {activeCompanyOptions.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
                {selectedCompany && !selectedCompany.isActive ? (
                  <MenuItem value={String(selectedCompany.id)}>
                    {selectedCompany.name} (ระงับ)
                  </MenuItem>
                ) : null}
              </Select>
            </FormControl>
            {!editingUser ? (
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                  error={Boolean(form.password && !isValidPassword(form.password))}
                  helperText={
                    form.password && !isValidPassword(form.password) 
                      ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร, ภาษาอังกฤษ 1 ตัว, และตัวเลข 1 ตัว'
                      : ' '
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button 
                          onClick={() => {
                            const gen = generateOWASPPassword();
                            setForm((prev) => ({ ...prev, password: gen }));
                            setShowPassword(true);
                          }}
                          size="small" 
                          startIcon={<VpnKey />}
                          sx={{ textTransform: 'none', height: 32 }}
                        >
                          สุ่มรหัสผ่าน
                        </Button>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            ) : null}
            <FormControl fullWidth>
              <InputLabel id="user-prefix-label">คำนำหน้า</InputLabel>
              <Select
                labelId="user-prefix-label"
                label="คำนำหน้า"
                value={form.prefix}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    prefix: event.target.value,
                  }))
                }
              >
                <MenuItem value="">
                  <em>ไม่ระบุ</em>
                </MenuItem>
                {PREFIX_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="ชื่อ"
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="นามสกุล"
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="อีเมล"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                if (saving) return;
                setDialogOpen(false);
                setEditingUser(null);
                resetForm();
              }}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editingUser ? 'บันทึก' : 'เพิ่มผู้ใช้'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={resetPasswordDialogOpen}
        onClose={closeResetPasswordDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitleWithClose onClose={closeResetPasswordDialog}>
          รีเซ็ตรหัสผ่านผู้ใช้
        </DialogTitleWithClose>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 2 }}>
          <Alert severity="warning">
            การรีเซ็ตรหัสผ่านจะทำให้รหัสผ่านเดิมของผู้ใช้งานใช้ไม่ได้ทันที
          </Alert>

          <TextField
            label="Username"
            value={resetPasswordTarget?.username ?? ''}
            fullWidth
            disabled
          />

          <TextField
            label="รหัสผ่านใหม่"
            type={showResetPassword ? 'text' : 'password'}
            value={resetPasswordDraft}
            onChange={(event) => {
              setResetPasswordDraft(event.target.value);
              setResetPasswordResult('');
            }}
            fullWidth
            error={Boolean(resetPasswordDraft && !isValidPassword(resetPasswordDraft))}
            helperText={
              resetPasswordDraft && !isValidPassword(resetPasswordDraft)
                ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร, ภาษาอังกฤษ 1 ตัว, และตัวเลข 1 ตัว'
                : 'กำหนดเองได้ หรือกดปุ่มสุ่มรหัสผ่าน'
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={() => {
                      setResetPasswordDraft(generateOWASPPassword());
                      setResetPasswordResult('');
                      setShowResetPassword(true);
                    }}
                    size="small"
                    startIcon={<VpnKey />}
                    sx={{ textTransform: 'none', height: 32 }}
                  >
                    สุ่มรหัสผ่าน
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          {resetPasswordResult ? (
            <Alert severity="success">
              รหัสผ่านใหม่คือ: <strong>{resetPasswordResult}</strong>
              <br />
              โปรดคัดลอกรหัสผ่านนี้เพื่อส่งให้ผู้ใช้งาน
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeResetPasswordDialog} disabled={resettingPassword}>
            ปิด
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleResetPassword()}
            disabled={resettingPassword || !resetPasswordTarget}
            startIcon={<LockResetOutlined />}
          >
            {resettingPassword ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Typography
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          กำลังโหลดข้อมูลผู้ใช้
        </Typography>
      )}
    </>
  );
}
