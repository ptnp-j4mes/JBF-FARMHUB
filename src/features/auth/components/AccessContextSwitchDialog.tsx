'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useTheme, alpha } from '@mui/material/styles';
import { authService } from '@/features/auth/services/auth.service';
import {
  type AccessAssignmentContext,
  isAccessContextApplicable,
  readCurrentAccessContext,
  setCurrentAccessContext,
} from '@/lib/access-context';
import { setCurrentFacilityContext } from '@/lib/facility-context';
import {
  ACCESS_SCOPE_TYPE_LABEL,
  loadAccessAssignmentsForUser,
} from '@/features/auth/services/access-context.service';

interface AccessContextSwitchDialogProps {
  open: boolean;
  onClose: () => void;
  onContextApplied?: (context: AccessAssignmentContext) => void;
}

export default function AccessContextSwitchDialog({
  open,
  onClose,
  onContextApplied,
}: AccessContextSwitchDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [assignments, setAssignments] = useState<AccessAssignmentContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);
  const [switchingAssignmentId, setSwitchingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setErrorMessage('');
    setSwitchingAssignmentId(null);

    const hydrateAssignments = async () => {
      const user = await authService.hydrateUser();
      if (!user) {
        if (!active) return;
        setAssignments([]);
        setCurrentAssignmentId(null);
        setErrorMessage('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
        setLoading(false);
        return;
      }

      try {
        const nextAssignments = await loadAccessAssignmentsForUser(user);
        if (!active) return;

        setAssignments(nextAssignments);

        const storedContext = readCurrentAccessContext();
        const isStoredContextApplicable = isAccessContextApplicable(storedContext, user);
        if (!isStoredContextApplicable) {
          setCurrentAccessContext(null);
          setCurrentAssignmentId(null);
        } else {
          const refreshedCurrentContext =
            storedContext
              ? nextAssignments.find((item) => item.assignmentId === storedContext.assignmentId) ??
                storedContext
              : null;

          if (refreshedCurrentContext) {
            setCurrentAccessContext(refreshedCurrentContext);
            setCurrentFacilityContext(
              refreshedCurrentContext.scopeNodeId,
              refreshedCurrentContext.scopeCode ?? null,
            );
            setCurrentAssignmentId(refreshedCurrentContext.assignmentId);
          } else {
            setCurrentAssignmentId(null);
          }
        }
      } catch {
        if (!active) return;
        setErrorMessage('โหลดรายการบริบทไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void hydrateAssignments();

    return () => {
      active = false;
    };
  }, [open]);

  const handleSelectContext = (assignment: AccessAssignmentContext) => {
    setSwitchingAssignmentId(assignment.assignmentId);
    setCurrentAccessContext(assignment);
    setCurrentFacilityContext(assignment.scopeNodeId, assignment.scopeCode ?? null);
    setCurrentAssignmentId(assignment.assignmentId);
    onContextApplied?.(assignment);
    setSwitchingAssignmentId(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="access-context-switch-dialog-title"
      PaperProps={{
        sx: {
          backgroundColor: isDark
            ? 'rgba(17, 26, 21, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(220, 232, 223, 0.9)',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(18, 54, 37, 0.10)',
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        id="access-context-switch-dialog-title"
        sx={{ pb: 1, fontWeight: 700, color: 'text.primary' }}
      >
        เปลี่ยนบริบทการใช้งาน
      </DialogTitle>
      <DialogContent
        sx={{
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(220, 232, 223, 0.5)',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          เลือก Role + Scope ใหม่ได้ทันที โดยไม่ต้องกลับไปหน้า access
        </Typography>

        {loading ? (
          <Box
            sx={{
              py: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : errorMessage ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : assignments.length === 0 ? (
          <Alert severity="warning">
            ไม่พบบริบทที่ใช้งานได้สำหรับผู้ใช้นี้
          </Alert>
        ) : (
          <Stack spacing={1.25}>
            {assignments.map((assignment) => {
              const isCurrent =
                currentAssignmentId === assignment.assignmentId;
              const isSwitching =
                switchingAssignmentId === assignment.assignmentId;

              return (
                <Card
                  key={assignment.assignmentId}
                  variant="outlined"
                  sx={{
                    borderColor: isCurrent
                      ? alpha(theme.palette.primary.main, 0.5)
                      : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(220, 232, 223, 0.5)',
                    bgcolor: isCurrent
                      ? alpha(theme.palette.primary.main, 0.06)
                      : isDark
                        ? 'rgba(17, 26, 21, 0.6)'
                        : 'rgba(255, 255, 255, 0.5)',
                    borderRadius: 2,
                    transition: 'all 200ms ease',
                    '&:hover': {
                      borderColor: isCurrent
                        ? alpha(theme.palette.primary.main, 0.5)
                        : alpha(theme.palette.primary.main, 0.3),
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.2)'
                        : '0 4px 12px rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="text.primary"
                      >
                        {assignment.roleName}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        disableRipple
                        sx={{
                          pointerEvents: 'none',
                          minWidth: 'auto',
                          height: 26,
                          px: 1,
                          borderRadius: 99,
                          textTransform: 'none',
                          fontSize: '0.72rem',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(180, 35, 24, 0.2)',
                          color: isDark
                            ? theme.palette.primary.light
                            : theme.palette.primary.main,
                          bgcolor: isDark
                            ? 'rgba(240, 68, 56, 0.08)'
                            : 'rgba(180, 35, 24, 0.06)',
                        }}
                      >
                        {ACCESS_SCOPE_TYPE_LABEL[assignment.scopeType]}
                      </Button>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.8 }}
                    >
                      ขอบเขต: {assignment.scopeLabel}
                      {assignment.scopeCode
                        ? ` (${assignment.scopeCode})`
                        : ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      จำนวนสิทธิ์: {assignment.permissionCount} รายการ
                    </Typography>

                    <Box sx={{ mt: 1.5 }}>
                      {isCurrent ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={
                            <CheckCircleOutlineRoundedIcon />
                          }
                          disabled
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          บริบทปัจจุบัน
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            handleSelectContext(assignment)
                          }
                          disabled={Boolean(switchingAssignmentId)}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {isSwitching
                            ? 'กำลังสลับ...'
                            : 'เลือกบริบทนี้'}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
