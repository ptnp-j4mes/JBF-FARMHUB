'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  BadgeOutlined,
  EditOutlined,
  ManageAccountsOutlined,
  ExpandMore,
  ForkRightOutlined,
  HomeWorkOutlined,
  AgricultureOutlined,
  RoomPreferencesOutlined,
  WarehouseOutlined,
  SecurityOutlined,
  VpnKeyOutlined,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api/client';
import { extractApiErrorMessage } from '@/lib/api-error';
import { authService } from '@/features/auth/services/auth.service';
import { formatUserDisplayName, getUserDisplayInitial } from '@/lib/user-display';
import type { UserInfoResponse } from '@/features/auth/types';

type SessionRow = {
  id: number;
  createdDate: string;
  updatedDate?: string | null;
  expiresAt: string;
  createdIP?: string | null;
  isActive: boolean;
  isRevoked: boolean;
};

type ProfileFormState = {
  prefix: string;
  firstName: string;
  lastName: string;
};

type FeedbackState = {
  severity: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

type ScopeNode = NonNullable<UserInfoResponse['scopeNodes']>[number];

type ScopeTreeNode = ScopeNode & {
  children: ScopeTreeNode[];
};

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
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

const SCOPE_TYPE_ORDER: Record<string, number> = {
  farm: 0,
  zone: 1,
  house: 2,
  pen: 3,
  silo: 4,
};

const SCOPE_TYPE_META: Record<
  string,
  {
    label: string;
    icon: typeof AgricultureOutlined;
  }
> = {
  farm: { label: 'ฟาร์ม', icon: AgricultureOutlined },
  zone: { label: 'โซน', icon: ForkRightOutlined },
  house: { label: 'โรงเรือน', icon: WarehouseOutlined },
  pen: { label: 'คอก', icon: HomeWorkOutlined },
  silo: { label: 'ไซโล', icon: RoomPreferencesOutlined },
};

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function buildProfileForm(user: UserInfoResponse | null): ProfileFormState {
  return {
    prefix: user?.prefix ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  };
}

function normalizeScopeType(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function getScopeTypeMeta(type: string) {
  return SCOPE_TYPE_META[type] ?? {
    label: type || 'Scope',
    icon: ForkRightOutlined,
  };
}

function buildScopeTree(nodes: ScopeNode[]): ScopeTreeNode[] {
  const byId = new Map<number, ScopeTreeNode>();
  const roots: ScopeTreeNode[] = [];

  nodes.forEach((node) => {
    byId.set(node.facilityNodeId, { ...node, children: [] });
  });

  byId.forEach((node) => {
    const parentId = node.parentId ?? null;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) {
      parent.children.push(node);
      return;
    }
    roots.push(node);
  });

  const sortNodes = (items: ScopeTreeNode[]) => {
    items.sort((left, right) => {
      const leftDepth = typeof left.depth === 'number' ? left.depth : 0;
      const rightDepth = typeof right.depth === 'number' ? right.depth : 0;
      if (leftDepth !== rightDepth) return leftDepth - rightDepth;

      const leftType = normalizeScopeType(left.facilityType);
      const rightType = normalizeScopeType(right.facilityType);
      const typeDiff =
        (SCOPE_TYPE_ORDER[leftType] ?? 99) - (SCOPE_TYPE_ORDER[rightType] ?? 99);
      if (typeDiff !== 0) return typeDiff;

      const leftPath = left.path || '';
      const rightPath = right.path || '';
      if (leftPath !== rightPath) return leftPath.localeCompare(rightPath);

      return `${left.facilityCode} ${left.facilityName}`.localeCompare(
        `${right.facilityCode} ${right.facilityName}`,
      );
    });

    items.forEach((item) => {
      if (item.children.length > 0) {
        sortNodes(item.children);
      }
    });
  };

  sortNodes(roots);

  return roots;
}

export function ProfileDetailPage() {
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null);
  const [expandedScopeNodeIds, setExpandedScopeNodeIds] = useState<number[]>([]);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(buildProfileForm(null));
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    let active = true;

    const hydrateProfile = async () => {
      try {
        setLoadingProfile(true);
        const nextUser = await authService.hydrateUser();
        if (!active) return;
        setUser(nextUser);
        setProfileForm(buildProfileForm(nextUser));
        setProfileFeedback(null);
      } catch {
        if (!active) return;
        const fallbackUser = authService.getUser();
        setUser(fallbackUser);
        setProfileForm(buildProfileForm(fallbackUser));
        setProfileFeedback({
          severity: 'warning',
          message: 'ไม่สามารถดึงข้อมูลโปรไฟล์ล่าสุดได้ กำลังแสดงข้อมูลที่มีอยู่ในเครื่อง',
        });
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    void hydrateProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        setLoadingSessions(true);
        setSessionsError(null);
        const response = await apiClient.get<SessionRow[]>('/api/Auth/sessions');
        if (!active) return;
        setSessions(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        if (!active) return;
        setSessions([]);
        setSessionsError(extractApiErrorMessage(error, 'ไม่สามารถโหลดข้อมูล session ได้'));
      } finally {
        if (active) {
          setLoadingSessions(false);
        }
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  const fullName = useMemo(() => formatUserDisplayName(user), [user]);
  const initials = useMemo(() => getUserDisplayInitial(user), [user]);
  const scopeTree = useMemo(
    () => buildScopeTree((user?.scopeNodes ?? []) as ScopeNode[]),
    [user],
  );
  const activeSessionCount = useMemo(
    () => sessions.filter((session) => session.isActive && !session.isRevoked).length,
    [sessions],
  );
  const hasScopeTree = scopeTree.length > 0;

  useEffect(() => {
    setExpandedScopeNodeIds([]);
  }, [user?.id]);

  const toggleScopeNode = (nodeId: number) => {
    setExpandedScopeNodeIds((current) =>
      current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId],
    );
  };

  const renderScopeNode = (node: ScopeTreeNode, level = 0): ReactElement => {
    const typeKey = normalizeScopeType(node.facilityType);
    const typeMeta = getScopeTypeMeta(typeKey);
    const expanded = expandedScopeNodeIds.includes(node.facilityNodeId);
    const hasChildren = node.children.length > 0;
    const indent = level * 18;
    const isFarmRoot = level === 0;
    const nodeLabel = `${node.facilityCode} - ${node.facilityName}`;

    return (
      <Box
        key={node.facilityNodeId}
        sx={{
          position: 'relative',
          pl: `${indent}px`,
          ...(level > 0 && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: `${Math.max(indent - 12, 8)}px`,
              top: 0,
              bottom: 0,
              width: 1,
              bgcolor: alpha(UI.accent, 0.12),
            },
          }),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            py: 1,
            px: 1.2,
            borderRadius: 2.5,
            border: `1px solid ${alpha(UI.accent, isFarmRoot ? 0.18 : 0.12)}`,
            bgcolor: isFarmRoot ? '#fff' : UI.panelSoft,
            boxShadow: isFarmRoot ? UI.shadowSoft : 'none',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(UI.accent, isFarmRoot ? 0.16 : 0.12),
              color: UI.accent,
              flexShrink: 0,
            }}
          >
            <typeMeta.icon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                label={typeMeta.label}
                sx={{
                  bgcolor: alpha(UI.accent, 0.08),
                  color: UI.accent,
                  fontWeight: 800,
                  height: 24,
                }}
              />
              {hasChildren ? (
                <Chip
                  size="small"
                  label={`${node.children.length} รายการย่อย`}
                  sx={{
                    bgcolor: '#fff',
                    border: `1px solid ${UI.border}`,
                    color: UI.muted,
                    fontWeight: 700,
                    height: 24,
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  label="ปลายทาง"
                  sx={{
                    bgcolor: '#fff',
                    border: `1px solid ${UI.border}`,
                    color: UI.muted,
                    fontWeight: 700,
                    height: 24,
                  }}
                />
              )}
            </Stack>
            <Typography sx={{ mt: 0.65, fontWeight: 900, color: UI.text, wordBreak: 'break-word' }}>
              {nodeLabel}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: '0.86rem', color: UI.muted }}>
              {node.path || '-'}
            </Typography>
          </Box>
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => toggleScopeNode(node.facilityNodeId)}
              aria-label={expanded ? 'ยุบรายการ' : 'ขยายรายการ'}
              sx={{
                mt: -0.2,
                color: UI.accent,
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 180ms ease',
              }}
            >
              <ExpandMore />
            </IconButton>
          ) : null}
        </Box>

        {hasChildren ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 1.2, pt: 1 }}>
              <Stack spacing={1}>
                {node.children.map((child) => renderScopeNode(child, level + 1))}
              </Stack>
            </Box>
          </Collapse>
        ) : null}
      </Box>
    );
  };

  const openEditDialog = () => {
    setProfileForm(buildProfileForm(user));
    setProfileFormError(null);
    setProfileFeedback(null);
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const prefix = profileForm.prefix.trim();

    if (!firstName || !lastName) {
      setProfileFormError('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileFormError(null);
      setProfileFeedback(null);

      const response = await apiClient.put<UserInfoResponse>('/api/auth/profile', {
        prefix: prefix || null,
        firstName,
        lastName,
      });

      authService.setUser(response);
      setUser(response);
      setProfileForm(buildProfileForm(response));
      setEditOpen(false);
      setProfileFeedback({
        severity: 'success',
        message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว',
      });
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้');
      setProfileFormError(message);
      setProfileFeedback({ severity: 'error', message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordFeedback(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordFeedback({
        severity: 'warning',
        message: 'กรุณากรอกรหัสผ่านเดิม รหัสผ่านใหม่ และยืนยันรหัสผ่านใหม่ให้ครบ',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        severity: 'warning',
        message: 'ยืนยันรหัสผ่านใหม่ไม่ตรงกัน',
      });
      return;
    }

    try {
      setSavingPassword(true);
      await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({
        severity: 'success',
        message: 'เปลี่ยนรหัสผ่านสำเร็จ ระบบจะใช้ session ใหม่เมื่อมีการเข้าสู่ระบบครั้งถัดไป',
      });
    } catch (error: unknown) {
      setPasswordFeedback({
        severity: 'error',
        message: extractApiErrorMessage(error, 'ไม่สามารถเปลี่ยนรหัสผ่านได้'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.panelSoft }}>
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
            label="Profile Center"
            sx={{
              bgcolor: '#fff',
              color: UI.accent,
              fontWeight: 800,
              border: `1px solid ${UI.borderStrong}`,
              height: 28,
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
            ตรวจสอบข้อมูลบัญชี ความปลอดภัย และ session การใช้งานจากหน้าจอเดียว
          </Typography>
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
              โปรไฟล์ผู้ใช้งาน
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              ปรับข้อมูลโปรไฟล์ขั้นพื้นฐาน เปลี่ยนรหัสผ่าน และดูสถานะ session ที่กำลังใช้งานได้สะดวกขึ้น
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / โปรไฟล์
          </Typography>
        </Box>
      </Box>

      <Stack spacing={2.2}>
        {profileFeedback ? <Alert severity={profileFeedback.severity}>{profileFeedback.message}</Alert> : null}

        <Box
          sx={{
            ...panelSx,
            p: { xs: 1.5, md: 1.8 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)' },
            gap: 1.6,
          }}
        >
          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(UI.accent, 0.16)}`,
              bgcolor: '#fff',
              p: { xs: 1.5, md: 1.8 },
              boxShadow: UI.shadowSoft,
            }}
          >
            <Stack spacing={1.4}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: UI.accent,
                      color: '#fff',
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      boxShadow: UI.shadowSoft,
                    }}
                  >
                    {initials}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: UI.text }}>
                      {loadingProfile ? 'กำลังโหลดข้อมูลโปรไฟล์...' : fullName}
                    </Typography>
                    <Typography sx={{ color: UI.muted }}>
                      ชื่อผู้ใช้งาน {user?.username || '-'}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  startIcon={<EditOutlined />}
                  onClick={openEditDialog}
                  disabled={loadingProfile || !user}
                  sx={{
                    minWidth: 146,
                    borderRadius: 4,
                    boxShadow: UI.shadowSoft,
                    bgcolor: UI.accent,
                    '&:hover': { bgcolor: '#10473f' },
                  }}
                >
                  แก้ไขโปรไฟล์
                </Button>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.1,
                }}
              >
                {[
                  { label: 'คำนำหน้า', value: user?.prefix || 'ยังไม่ได้กำหนด' },
                  { label: 'บริษัท', value: user?.companyName || '-' },
                  { label: 'รหัสบริษัท', value: user?.companyId ?? '-' },
                  { label: 'สถานะข้อมูล', value: loadingProfile ? 'กำลังดึงข้อมูลล่าสุด' : 'พร้อมใช้งาน' },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      borderRadius: 2.6,
                      border: `1px solid ${UI.border}`,
                      bgcolor: UI.panelSoft,
                      p: 1.25,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: UI.muted }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ mt: 0.45, fontWeight: 800, color: UI.text }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${UI.border}`,
              bgcolor: UI.panelSoft,
              p: { xs: 1.5, md: 1.7 },
              boxShadow: UI.shadowSoft,
            }}
          >
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeOutlined sx={{ color: UI.accent }} />
                <Typography sx={{ fontWeight: 900, color: UI.text }}>
                  สรุปสถานะบัญชี
                </Typography>
              </Stack>
              <Typography sx={{ color: UI.muted, fontSize: '0.92rem' }}>
                บัญชีนี้มีบทบาท {user?.roles?.length ?? 0} รายการ และ session ที่ยัง active {activeSessionCount} รายการ
              </Typography>
              <Divider />
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {(user?.roles ?? []).length > 0 ? (
                  user?.roles.map((role) => (
                    <Chip
                      key={role}
                      size="small"
                      label={role}
                      sx={{
                        bgcolor: '#fff',
                        border: `1px solid ${alpha(UI.accent, 0.2)}`,
                        color: UI.accent,
                        fontWeight: 700,
                      }}
                    />
                  ))
                ) : (
                  <Alert severity="info" sx={{ width: '100%' }}>
                    ยังไม่มี role ที่กำหนดในข้อมูลโปรไฟล์นี้
                  </Alert>
                )}
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            ...panelSx,
            p: { xs: 1.5, md: 1.8 },
          }}
        >
          <Stack spacing={1.4}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={1}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <ManageAccountsOutlined sx={{ color: UI.accent }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, color: UI.text }}>
                    บทบาทและขอบเขตการเข้าถึง
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
                    สรุปสิทธิ์ระดับ role และ farm scope ที่ผูกอยู่กับบัญชีนี้
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.4,
              }}
            >
              <Box
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.panelSoft,
                  p: 1.4,
                }}
              >
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: UI.text, mb: 1 }}>
                  Roles
                </Typography>
                <Stack direction="row" gap={0.8} flexWrap="wrap">
                  {(user?.roles ?? []).length > 0 ? (
                    user?.roles.map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        size="small"
                        sx={{
                          bgcolor: '#fff',
                          border: `1px solid ${UI.borderStrong}`,
                          fontWeight: 700,
                        }}
                      />
                    ))
                  ) : (
                    <Alert severity="info" sx={{ width: '100%' }}>
                      ยังไม่มีบทบาทที่กำหนดไว้สำหรับผู้ใช้นี้
                    </Alert>
                  )}
                </Stack>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.panelSoft,
                  p: 1.4,
                }}
              >
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: UI.text, mb: 1 }}>
                  Farm Scope
                </Typography>
                {hasScopeTree ? (
                  <Stack spacing={1}>
                    <Typography sx={{ fontSize: '0.88rem', color: UI.muted }}>
                      แตะที่แถวระดับฟาร์มเพื่อขยายดูโซน โรงเรือน คอก และไซโลที่อยู่ภายใต้สิทธิ์ของบัญชีนี้
                    </Typography>
                    <Stack spacing={1}>
                      {scopeTree.map((node) => renderScopeNode(node))}
                    </Stack>
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ width: '100%' }}>
                    ยังไม่มีขอบเขตฟาร์มที่ผูกกับผู้ใช้รายนี้
                  </Alert>
                )}
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            ...panelSx,
            p: { xs: 1.5, md: 1.8 },
          }}
        >
          <Stack spacing={1.4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <VpnKeyOutlined sx={{ color: UI.accent }} />
              <Box>
                <Typography sx={{ fontWeight: 900, color: UI.text }}>
                  ความปลอดภัยบัญชี
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
                  เปลี่ยนรหัสผ่านเมื่อจำเป็น และตรวจสอบสถานะการบันทึกได้จากหน้านี้ทันที
                </Typography>
              </Box>
            </Stack>

            {passwordFeedback ? <Alert severity={passwordFeedback.severity}>{passwordFeedback.message}</Alert> : null}

            <Box
              sx={{
                display: 'grid',
                gap: 1.2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr)) auto' },
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                type="password"
                label="รหัสผ่านเดิม"
                value={currentPassword}
                disabled={savingPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: UI.panelSoft } }}
              />
              <TextField
                size="small"
                type="password"
                label="รหัสผ่านใหม่"
                value={newPassword}
                disabled={savingPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: UI.panelSoft } }}
              />
              <TextField
                size="small"
                type="password"
                label="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                disabled={savingPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: UI.panelSoft } }}
              />
              <Button
                variant="contained"
                onClick={() => void handleChangePassword()}
                disabled={savingPassword}
                sx={{
                  height: 40,
                  minWidth: 160,
                  borderRadius: 4,
                  boxShadow: UI.shadowSoft,
                  bgcolor: UI.accent,
                  '&:hover': { bgcolor: '#10473f' },
                }}
              >
                {savingPassword ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            ...panelSx,
            p: { xs: 1.5, md: 1.8 },
          }}
        >
          <Stack spacing={1.4}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={1}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <SecurityOutlined sx={{ color: UI.accent }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, color: UI.text }}>
                    Session การใช้งาน
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
                    ตรวจสอบ session ล่าสุดและดูว่า session ไหนยัง active หรือถูก revoke แล้ว
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={`Active ${activeSessionCount}`}
                sx={{
                  bgcolor: UI.accentSurface,
                  color: UI.accent,
                  fontWeight: 800,
                  border: `1px solid ${alpha(UI.accent, 0.18)}`,
                }}
              />
            </Stack>

            {loadingSessions ? (
              <Box
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.panelSoft,
                  minHeight: 160,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <CircularProgress size={28} sx={{ color: UI.accent }} />
                  <Typography sx={{ color: UI.muted }}>กำลังโหลดข้อมูล session...</Typography>
                </Stack>
              </Box>
            ) : sessionsError ? (
              <Alert severity="error">{sessionsError}</Alert>
            ) : sessions.length === 0 ? (
              <Alert severity="info">ไม่พบข้อมูล session</Alert>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.2,
                }}
              >
                {sessions.map((session) => {
                  const isActive = session.isActive && !session.isRevoked;
                  return (
                    <Box
                      key={session.id}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${isActive ? alpha(UI.accent, 0.24) : UI.border}`,
                        bgcolor: isActive ? '#f7fcfa' : '#fff',
                        p: 1.35,
                        boxShadow: UI.shadowSoft,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography sx={{ fontWeight: 900, color: UI.text }}>
                            Session #{session.id}
                          </Typography>
                          <Chip
                            size="small"
                            label={isActive ? 'Active' : 'Revoked'}
                            sx={{
                              bgcolor: isActive ? UI.accentSurface : '#f5f5f5',
                              color: isActive ? UI.accent : UI.muted,
                              fontWeight: 800,
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: UI.text }}>
                          IP: {session.createdIP || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: UI.text }}>
                          เริ่มต้น: {formatDateTime(session.createdDate)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: UI.text }}>
                          หมดอายุ: {formatDateTime(session.expiresAt)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: UI.muted }}>
                          อัปเดตล่าสุด: {formatDateTime(session.updatedDate)}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>

      <Dialog open={editOpen} onClose={savingProfile ? undefined : () => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>แก้ไขโปรไฟล์</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.4} sx={{ pt: 0.5 }}>
            <Typography sx={{ color: UI.muted, fontSize: '0.92rem' }}>
              ปรับคำนำหน้า ชื่อ และนามสกุล แล้วบันทึกเพื่ออัปเดตข้อมูลโปรไฟล์ของคุณทันที
            </Typography>
            {profileFormError ? <Alert severity="error">{profileFormError}</Alert> : null}
            <TextField
              size="small"
              label="คำนำหน้า"
              value={profileForm.prefix}
              disabled={savingProfile}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, prefix: event.target.value }))}
            />
            <TextField
              size="small"
              label="ชื่อ"
              value={profileForm.firstName}
              disabled={savingProfile}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
            <TextField
              size="small"
              label="นามสกุล"
              value={profileForm.lastName}
              disabled={savingProfile}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={savingProfile}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveProfile()}
            disabled={savingProfile}
            sx={{ minWidth: 120, bgcolor: UI.accent, '&:hover': { bgcolor: '#10473f' } }}
          >
            {savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
