'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  RestartAlt,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { DialogTitleWithClose, SearchField } from '@/components/common';
import Swal from 'sweetalert2';
import { extractApiErrorMessage } from '@/lib/api-error';
import { userAssignmentsService } from '../services/user-assignments.service';
import type {
  UserAssignmentPermissionQueryResponse,
  UserAssignmentPermissionQueryRow,
  UserAssignmentWorkspace,
} from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserPermissionEditorDialogProps = {
  open: boolean;
  userId: number | null;
  workspace: UserAssignmentWorkspace | null;
  onClose: () => void;
  onSaved: () => void;
};

interface ToggleState {
  desiredEffective: boolean;
  isChanged: boolean;
  initialEffective: boolean;
  hasUserAllow: boolean;
  hasUserDeny: boolean;
  note: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserPermissionEditorDialog({
  open,
  userId,
  workspace,
  onClose,
  onSaved,
}: UserPermissionEditorDialogProps) {
  const theme = useTheme();

  // ---- State ----
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedFacilityNodeId, setSelectedFacilityNodeId] = useState<number | null>(null);
  const [queryResult, setQueryResult] = useState<UserAssignmentPermissionQueryResponse | null>(null);
  const [toggleStates, setToggleStates] = useState<Record<number, ToggleState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ---- Theme tokens ----
  const borderColor = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.6 : 1);
  const panelBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.94)
    : '#ffffff';
  const mutedBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.7)
    : alpha('#f8faf8', 0.9);

  const sectionPaperSx = {
    borderRadius: 10,
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
    bgcolor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.95)
      : alpha('#ffffff', 0.98),
    p: { xs: 1.75, md: 2.25 },
  };

  const tableHeaderSx = {
    fontWeight: 800,
    letterSpacing: 0.2,
    fontSize: '13px',
    bgcolor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.95)
      : alpha('#f5f8f6', 1),
    borderBottom: `2px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1)}`,
  };

  const chipSx = {
    height: 28,
    borderRadius: 10,
    fontWeight: 700,
    bgcolor: mutedBg,
    border: `1px solid ${borderColor}`,
  };

  const noteFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: mutedBg,
      fontSize: '13px',
    },
    '& .MuiOutlinedInput-input': {
      py: 0.5,
    },
  };

  // ---- Derived data ----
  const user = useMemo(
    () => workspace?.users.find((u) => u.id === userId) ?? null,
    [workspace, userId],
  );

  const activeRoles = useMemo(
    () => (workspace?.roles.filter((r) => r.isActive) ?? []),
    [workspace],
  );

  const activeFacilities = useMemo(
    () => (workspace?.facilities.filter((f) => f.isActive) ?? []),
    [workspace],
  );

  const bothSelected = selectedRoleId !== null && selectedFacilityNodeId !== null;

  // ---- Filtered permissions (flat list) ----
  const filteredPermissions = useMemo(() => {
    if (!queryResult) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return queryResult.permissions;
    return queryResult.permissions.filter(
      (r) =>
        r.action.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.permissionCode.toLowerCase().includes(query) ||
        r.resource.toLowerCase().includes(query),
    );
  }, [queryResult, searchQuery]);

  // ---- Computed stats ----
  const enabledCount = useMemo(
    () =>
      filteredPermissions.filter(
        (r) => toggleStates[r.permissionId]?.desiredEffective ?? r.isEffectiveAllowed,
      ).length,
    [filteredPermissions, toggleStates],
  );
  const changedCount = useMemo(
    () => Object.values(toggleStates).filter((t) => t.isChanged).length,
    [toggleStates],
  );

  const hasChanges = changedCount > 0;
  const canSave = bothSelected && hasChanges && !saving;

  // ---- Reset on open/close ----
  useEffect(() => {
    if (!open) {
      setSelectedRoleId(null);
      setSelectedFacilityNodeId(null);
      setQueryResult(null);
      setToggleStates({});
      setSearchQuery('');
      setError(null);
    }
  }, [open]);

  // ---- Query permissions when both selected ----
  const querySignatureRef = useRef('');
  useEffect(() => {
    if (!open || !userId || !bothSelected || !selectedRoleId || !selectedFacilityNodeId) return;

    const sig = `${selectedRoleId}:${selectedFacilityNodeId}`;
    if (sig === querySignatureRef.current) return;
    querySignatureRef.current = sig;

    let active = true;
    setLoading(true);
    setError(null);

    userAssignmentsService
      .queryPermissions(userId, {
        roleIds: [selectedRoleId],
        facilityNodeId: selectedFacilityNodeId,
        includeUserOverrides: true,
        includeCandidatePermissions: true,
        pageSize: 200,
      })
      .then((result) => {
        if (!active) return;
        setQueryResult(result);
        const initial: Record<number, ToggleState> = {};
        for (const row of result.permissions) {
          initial[row.permissionId] = {
            desiredEffective: row.isEffectiveAllowed,
            isChanged: false,
            initialEffective: row.isEffectiveAllowed,
            hasUserAllow: row.hasUserAllow,
            hasUserDeny: row.hasUserDeny,
            note: '',
          };
        }
        setToggleStates(initial);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId, bothSelected, selectedRoleId, selectedFacilityNodeId]);

  // ---- Handlers ----
  const handleEffectChange = useCallback(
    (row: UserAssignmentPermissionQueryRow, effect: 'allow' | 'deny') => {
      setToggleStates((prev) => {
        const current = prev[row.permissionId];
        if (!current) return prev;
        const newEffective = effect === 'allow';
        return {
          ...prev,
          [row.permissionId]: {
            ...current,
            desiredEffective: newEffective,
            isChanged: newEffective !== current.initialEffective,
          },
        };
      });
    },
    [],
  );

  const handleNoteChange = useCallback((permissionId: number, note: string) => {
    setToggleStates((prev) => {
      const current = prev[permissionId];
      if (!current) return prev;
      return {
        ...prev,
        [permissionId]: { ...current, note },
      };
    });
  }, []);

  const handleReset = useCallback((row: UserAssignmentPermissionQueryRow) => {
    setToggleStates((prev) => {
      const current = prev[row.permissionId];
      if (!current) return prev;
      return {
        ...prev,
        [row.permissionId]: {
          ...current,
          desiredEffective: current.initialEffective,
          isChanged: false,
          note: '',
        },
      };
    });
  }, []);

  // ---- Save ----
  const handleSave = useCallback(async () => {
    if (!userId || !selectedRoleId || !selectedFacilityNodeId || !queryResult) return;

    const confirmation = await Swal.fire({
      title: 'ยืนยันบันทึกการเปลี่ยนแปลงสิทธิ์?',
      html: `<p>จะบันทึกการเปลี่ยนแปลง <strong>${changedCount}</strong> สิทธิ์</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#1d4ed8',
    });
    if (!confirmation.isConfirmed) return;

    setSaving(true);
    try {
      const existing = await userAssignmentsService.getByUserId(userId);

      const newOverrides: Array<{
        roleId: number;
        facilityNodeId: number;
        permissionId: number;
        effect: 'allow' | 'deny';
        remark: string | null;
      }> = [];

      for (const row of queryResult.permissions) {
        const state = toggleStates[row.permissionId];
        if (!state || !state.isChanged) continue;

        newOverrides.push({
          roleId: selectedRoleId,
          facilityNodeId: selectedFacilityNodeId,
          permissionId: row.permissionId,
          effect: state.desiredEffective ? 'allow' : 'deny',
          remark: state.note || null,
        });
      }

      // Keep existing overrides NOT for this (roleId, facilityNodeId) pair
      const existingOverrides = existing.permissionOverrides.filter(
        (o) =>
          !(o.roleId === selectedRoleId && o.facilityNodeId === selectedFacilityNodeId),
      );

      // Keep existing overrides for this pair that were NOT toggled
      const untouchedOverrides = existing.permissionOverrides.filter((o) => {
        if (o.roleId !== selectedRoleId || o.facilityNodeId !== selectedFacilityNodeId) return false;
        const state = toggleStates[o.permissionId];
        return !state || !state.isChanged;
      });

      const finalOverrides = [...existingOverrides, ...untouchedOverrides, ...newOverrides];

      // Ensure roleScopes includes our (role, facility) pair
      const existingScopeKey = `${selectedRoleId}:${selectedFacilityNodeId}`;
      const scopeExists = existing.roleScopes.some(
        (s) => `${s.roleId}:${s.facilityNodeId}` === existingScopeKey,
      );

      const roleScopes = scopeExists
        ? existing.roleScopes
        : [
            ...existing.roleScopes,
            { roleId: selectedRoleId, facilityNodeId: selectedFacilityNodeId, remark: null },
          ];

      await userAssignmentsService.upsertForUser(userId, {
        roleScopes: roleScopes.map((s) => ({
          roleId: s.roleId,
          facilityNodeId: s.facilityNodeId,
          remark: s.remark ?? null,
        })),
        permissionOverrides: finalOverrides.map((o) => ({
          roleId: o.roleId,
          facilityNodeId: o.facilityNodeId,
          permissionId: o.permissionId,
          effect: o.effect,
          remark: o.remark ?? null,
        })),
      });

      void Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: `อัปเดต ${changedCount} สิทธิ์เรียบร้อยแล้ว`,
        showConfirmButton: false,
        timer: 2000,
      });

      onClose();
      onSaved();
    } catch (err: any) {
      void Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(err, 'ไม่สามารถบันทึกข้อมูลได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  }, [userId, selectedRoleId, selectedFacilityNodeId, queryResult, toggleStates, changedCount, onClose, onSaved]);

  // ---- Render ----

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 10,
          maxHeight: '85dvh',
        },
      }}
    >
      <DialogTitleWithClose onClose={onClose}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SecurityIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
          <Typography variant="inherit" sx={{ fontWeight: 800 }}>
            จัดการสิทธิ์
          </Typography>
          {user && (
            <Chip
              size="small"
              label={user.displayName || user.username}
              sx={{
                ml: 0.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
              }}
            />
          )}
        </Stack>
      </DialogTitleWithClose>

      <Divider />

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Stack spacing={2}>
          {/* ---- Permission Overrides frame ---- */}
          <Paper variant="outlined" sx={sectionPaperSx}>
            <Stack spacing={2}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Permission Overrides
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  เลือก Role และ Facility เพื่อดูและแก้ไขสิทธิ์
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedRoleId ?? ''}
                    label="Role"
                    onChange={(e) => {
                      const val = Number(e.target.value) || null;
                      setSelectedRoleId(val);
                      setSelectedFacilityNodeId(null);
                      setQueryResult(null);
                      setToggleStates({});
                    }}
                    sx={{ bgcolor: mutedBg }}
                  >
                    <MenuItem value="">
                      <em>— เลือกบทบาท —</em>
                    </MenuItem>
                    {activeRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                          <Typography sx={{ flex: 1, fontWeight: 600 }}>{role.name}</Typography>
                          <Chip
                            size="small"
                            label={`${role.permissionCount} สิทธิ์`}
                            sx={{ height: 22, fontSize: '11px' }}
                          />
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }} disabled={!selectedRoleId}>
                  <InputLabel>Facility</InputLabel>
                  <Select
                    value={selectedFacilityNodeId ?? ''}
                    label="Facility"
                    onChange={(e) => {
                      const val = Number(e.target.value) || null;
                      setSelectedFacilityNodeId(val);
                      setQueryResult(null);
                      setToggleStates({});
                    }}
                    sx={{ bgcolor: mutedBg }}
                  >
                    <MenuItem value="">
                      <em>— เลือกสถานที่ —</em>
                    </MenuItem>
                    {activeFacilities.map((facility) => (
                      <MenuItem key={facility.id} value={facility.id}>
                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                          {facility.pathLabel || facility.name}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          {/* ---- Selection hint ---- */}
          {!bothSelected && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 10,
                borderColor: alpha(theme.palette.warning.main, 0.4),
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <VpnKeyIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
              <Typography variant="body2" color="text.secondary">
                เลือก Role และ Facility ให้ครบก่อนจึงจะแสดงสิทธิ์
              </Typography>
            </Paper>
          )}

          {/* ---- Error ---- */}
          {error && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 10,
                borderColor: alpha(theme.palette.error.main, 0.4),
                bgcolor: alpha(theme.palette.error.main, 0.04),
                p: 1.5,
              }}
            >
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Paper>
          )}

          {/* ---- Loading ---- */}
          {loading && (
            <Stack spacing={1.5}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 10}} />
              ))}
            </Stack>
          )}

          {/* ---- Permission Table ---- */}
          {queryResult && !loading && (
            <Stack spacing={1.5}>
              {/* Stats bar */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ pb: 1, borderBottom: `1px solid ${borderColor}` }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                  รายการสิทธิ์ทั้งหมด
                </Typography>
                <Stack direction="row" spacing={0.75}>
                  <Chip
                    size="small"
                    label={`${enabledCount} เปิด`}
                    color="success"
                    variant="outlined"
                    sx={{ height: 24, fontSize: '11px' }}
                  />
                  <Chip
                    size="small"
                    label={`${filteredPermissions.length - enabledCount} ปิด`}
                    color="default"
                    variant="outlined"
                    sx={{ height: 24, fontSize: '11px' }}
                  />
                  {hasChanges && (
                    <Chip
                      size="small"
                      label={`${changedCount} เปลี่ยน`}
                      color="warning"
                      variant="filled"
                      sx={{ height: 24, fontSize: '11px', fontWeight: 700 }}
                    />
                  )}
                </Stack>
              </Stack>

              {/* Search */}
              <SearchField
                placeholder="ค้นหา permission (action, description, code)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: mutedBg } }}
              />

              {/* Permission table */}
              {filteredPermissions.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">ไม่พบ permission ที่ตรงกัน</Typography>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    maxHeight: 400,
                    borderRadius: 10,
                    border: `1px solid ${borderColor}`,
                    bgcolor: alpha(panelBg, 0.5),
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...tableHeaderSx, width: 44 }}>#</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 220 }}>Permission Code</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 130 }}>Effect</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 150 }}>Note</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, width: 52 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPermissions.map((row, index) => {
                        const state = toggleStates[row.permissionId];
                        const isAllowed = state?.desiredEffective ?? row.isEffectiveAllowed;
                        const isChanged = state?.isChanged ?? false;
                        const hasExistingOverride = row.hasUserAllow || row.hasUserDeny;

                        return (
                          <TableRow
                            key={row.permissionId}
                            hover
                            sx={{
                              bgcolor: isChanged
                                ? alpha(theme.palette.warning.main, 0.04)
                                : 'transparent',
                            }}
                          >
                            {/* # */}
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>
                              {index + 1}
                            </TableCell>

                            {/* Permission Code */}
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '13px',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {row.permissionCode}
                                  </Typography>
                                  {hasExistingOverride && !isChanged && (
                                    <Chip
                                      size="small"
                                      label={row.hasUserAllow ? 'Allow' : 'Deny'}
                                      color={row.hasUserAllow ? 'success' : 'error'}
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 700 }}
                                    />
                                  )}
                                  {isChanged && (
                                    <Chip
                                      size="small"
                                      label="เปลี่ยน"
                                      color="warning"
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 700 }}
                                    />
                                  )}
                                </Stack>
                                {row.description && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {row.description}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>

                            {/* Effect */}
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <Chip
                                  size="small"
                                  label="Allow"
                                  color={isAllowed ? 'success' : 'default'}
                                  variant={isAllowed ? 'filled' : 'outlined'}
                                  clickable={!saving}
                                  onClick={() => handleEffectChange(row, 'allow')}
                                  sx={{ fontWeight: 700 }}
                                />
                                <Chip
                                  size="small"
                                  label="Deny"
                                  color={!isAllowed ? 'error' : 'default'}
                                  variant={!isAllowed ? 'filled' : 'outlined'}
                                  clickable={!saving}
                                  onClick={() => handleEffectChange(row, 'deny')}
                                  sx={{ fontWeight: 700 }}
                                />
                              </Stack>
                            </TableCell>

                            {/* Note */}
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={state?.note ?? ''}
                                onChange={(e) => handleNoteChange(row.permissionId, e.target.value)}
                                disabled={saving}
                                placeholder="หมายเหตุ"
                                sx={noteFieldSx}
                              />
                            </TableCell>

                            {/* Action */}
                            <TableCell>
                              {isChanged && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleReset(row)}
                                  disabled={saving}
                                  title="รีเซ็ตเป็นค่าเริ่มต้น"
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: theme.palette.warning.main },
                                  }}
                                >
                                  <RestartAlt fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      {/* ---- Footer ---- */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: 'none' }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          startIcon={saving ? undefined : <SecurityIcon fontSize="small" />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
            bgcolor: canSave ? (theme.palette.mode === 'dark' ? theme.palette.primary.dark : '#1d4ed8') : undefined,
            '&:hover': {
              bgcolor: canSave
                ? (theme.palette.mode === 'dark' ? theme.palette.primary.main : '#1e40af')
                : undefined,
            },
          }}
        >
          {saving ? 'กำลังบันทึก...' : `บันทึก (${changedCount} รายการ)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
