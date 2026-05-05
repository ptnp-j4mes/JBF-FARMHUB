'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Image from 'next/image';
import { authService } from '@/features/auth/services/auth.service';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { formatUserDisplayName } from '@/lib/user-display';
import type { UserInfoResponse } from '@/features/auth/types';
import {
  isAccessContextApplicable,
  readCurrentAccessContext,
  setCurrentAccessContext,
  type AccessAssignmentContext,
} from '@/lib/access-context';
import { setCurrentFacilityContext } from '@/lib/facility-context';
import {
  ACCESS_SCOPE_TYPE_LABEL,
  loadAccessAssignmentsForUser,
} from '@/features/auth/services/access-context.service';
import logoJbfRed from '@/assets/svg/logo_jbf_red.svg';

export default function AccessSelectionPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isSwitchMode, setIsSwitchMode] = useState(false);
  const [assignments, setAssignments] = useState<AccessAssignmentContext[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const resolvePostAccessPath = (): string => {
    const nextPath = searchParams.get('next');
    if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      return nextPath;
    }
    return '/operations/dashboard';
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }

    let active = true;
    const switchMode =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('switch') === '1';
    setIsSwitchMode(switchMode);

    const hydrateUser = async () => {
      const nextUser = await authService.hydrateUser();
      if (!active) return;
      setUser(nextUser);
      setInitializing(false);
    };

    void hydrateUser();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (initializing || !user) {
      if (!initializing && !user) {
        setAssignments([]);
        setLoadingAssignments(false);
      }
      return;
    }

    let active = true;
    setLoadingAssignments(true);

    const hydrateAssignments = async () => {
      const nextAssignments = await loadAccessAssignmentsForUser(user);

      if (!active) return;
      setAssignments(nextAssignments);

      const storedContext = readCurrentAccessContext();
      const isStoredContextApplicable = isAccessContextApplicable(
        storedContext,
        user,
      );
      if (!isStoredContextApplicable) {
        setCurrentAccessContext(null);
      }

      if (!isSwitchMode) {
        if (storedContext && isStoredContextApplicable) {
          const refreshedContext =
            nextAssignments.find(
              (item) => item.assignmentId === storedContext.assignmentId,
            ) ?? storedContext;
          setCurrentAccessContext(refreshedContext);
          setCurrentFacilityContext(
            refreshedContext.scopeNodeId,
            refreshedContext.scopeCode ?? null,
          );
          router.replace(resolvePostAccessPath());
          return;
        }

        if (nextAssignments.length === 1) {
          const [singleAssignment] = nextAssignments;
          setCurrentAccessContext(singleAssignment);
          setCurrentFacilityContext(
            singleAssignment.scopeNodeId,
            singleAssignment.scopeCode ?? null,
          );
          router.replace(resolvePostAccessPath());
          return;
        }
      }

      setLoadingAssignments(false);
    };

    void hydrateAssignments();

    return () => {
      active = false;
    };
  }, [initializing, isSwitchMode, router, searchParams, user]);

  const handleSelectContext = (assignment: AccessAssignmentContext) => {
    setCurrentAccessContext(assignment);
    setCurrentFacilityContext(
      assignment.scopeNodeId,
      assignment.scopeCode ?? null,
    );
    router.push(resolvePostAccessPath());
  };

  const handleAssignmentKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    assignment: AccessAssignmentContext,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleSelectContext(assignment);
  };

  const handleBackToLogin = () => {
    authService.logout();
    router.replace('/auth/login');
  };

  const displayName = useMemo(() => {
    return formatUserDisplayName(user);
  }, [user]);

  const accentGradient =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #6f9562 0%, #88ab72 100%)'
      : 'linear-gradient(135deg, #5f8f5b 0%, #83a86a 100%)';
  const accentGradientHover =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #628556 0%, #789763 100%)'
      : 'linear-gradient(135deg, #537e4f 0%, #73955d 100%)';
  const accentColor = theme.palette.mode === 'dark' ? '#88ab72' : '#5f8f5b';
  const accentBorderColor =
    theme.palette.mode === 'dark'
      ? 'rgba(136, 171, 114, 0.35)'
      : 'rgba(95, 143, 91, 0.24)';
  const bgGradient =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #18211a 0%, #223127 50%, #1b261f 100%)'
      : 'linear-gradient(135deg, #edf4ee 0%, #dfeadf 50%, #f2f7f1 100%)';

  if (initializing || loadingAssignments) {
    return <LoadingOverlay open message="กำลังโหลดข้อมูล..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(132, 170, 112, 0.18) 0%, transparent 48%), radial-gradient(circle at 80% 80%, rgba(95, 143, 91, 0.16) 0%, transparent 50%)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(111, 149, 98, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(132, 170, 112, 0.24) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(95, 143, 91, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(111, 149, 98, 0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            borderRadius: 5,
            overflow: 'hidden',
            maxWidth: 980,
            mx: 'auto',
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(15, 20, 35, 0.7)'
                : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                : '0 10px 34px 0 rgba(95, 143, 91, 0.2)',
          }}
        >
          <Box
            sx={{
              width: '45%',
              position: 'relative',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(111, 149, 98, 0.08) 0%, rgba(136, 171, 114, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(95, 143, 91, 0.09) 0%, rgba(131, 168, 106, 0.1) 100%)',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              borderRight: 1,
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2.5,
              }}
            >
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  borderRadius: 4,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                      : '0 8px 28px 0 rgba(95, 143, 91, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border:
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <Image
                  src={logoJbfRed}
                  alt="Logo"
                  width={160}
                  height={160}
                  style={{
                    filter:
                      theme.palette.mode === 'dark'
                        ? 'drop-shadow(0 0 20px rgba(111, 149, 98, 0.3))'
                        : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color:
                      theme.palette.mode === 'dark' ? '#ffffff' : accentColor,
                    fontWeight: 800,
                    mb: 1.5,
                  }}
                >
                  เลือกบริบทการทำงาน
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    maxWidth: 300,
                  }}
                >
                  เลือกบทบาทและขอบเขตการใช้งานก่อนเข้าสู่หน้าหลักของระบบ
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', md: '55%' },
              p: { xs: 4, sm: 5 },
              backgroundColor: 'background.paper',
              position: 'relative',
            }}
          >
            <Stack spacing={2.5}>
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    background: accentGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.75,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    lineHeight: 1.05,
                  }}
                >
                  เลือกบริบท
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  เลือกฟาร์มที่ต้องการใช้งาน
                </Typography>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  p: 2.2,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.78)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${accentBorderColor}`,
                  boxShadow: `0 8px 24px 0 ${alpha(accentColor, 0.12)}`,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ผู้ใช้งาน
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: 'text.primary', mt: 0.4 }}
                >
                  {displayName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mt: 0.4 }}
                >
                  บริษัท: {user?.companyName ?? '-'}
                </Typography>
              </Box>

              {assignments.length === 0 ? (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleBackToLogin}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      ออกจากระบบ
                    </Button>
                  }
                  sx={{ borderRadius: 3 }}
                >
                  ไม่พบบริบทการใช้งานที่ใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ
                </Alert>
              ) : (
                <Box
                  sx={{
                    maxHeight: { xs: 'none', md: 'clamp(280px, 38vh, 400px)' },
                    overflowY: 'auto',
                    pr: 0.75,
                    mr: -0.75,
                  }}
                >
                  <Stack spacing={1.4}>
                    {assignments.map((assignment) => (
                      <Card
                        key={assignment.assignmentId}
                        elevation={0}
                        role="button"
                        tabIndex={0}
                        aria-label={`เลือกบริบท ${assignment.scopeLabel}`}
                        onClick={() => handleSelectContext(assignment)}
                        onKeyDown={(event) =>
                          handleAssignmentKeyDown(event, assignment)
                        }
                        sx={{
                          borderRadius: 3,
                          border: `1px solid ${accentBorderColor}`,
                          background:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.03)'
                              : 'rgba(255, 255, 255, 0.84)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: `0 8px 20px 0 ${alpha(accentColor, 0.08)}`,
                          transition:
                            'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 26px 0 ${alpha(
                              accentColor,
                              0.12,
                            )}`,
                          },
                          '&:focus-visible': {
                            outline: `2px solid ${alpha(accentColor, 0.38)}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1.2 }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 800, color: 'text.primary' }}
                            >
                              {assignment.roleName}
                            </Typography>
                            <Chip
                              label={
                                ACCESS_SCOPE_TYPE_LABEL[assignment.scopeType]
                              }
                              size="small"
                              sx={{
                                height: 28,
                                borderRadius: 99,
                                fontWeight: 700,
                                color: accentColor,
                                bgcolor: alpha(accentColor, 0.1),
                                border: `1px solid ${alpha(
                                  accentColor,
                                  0.18,
                                )}`,
                              }}
                            />
                          </Stack>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            ขอบเขต: {assignment.scopeLabel}
                            {assignment.scopeCode
                              ? ` (${assignment.scopeCode})`
                              : ''}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.6, display: 'block' }}
                          >
                            จำนวนสิทธิ์: {assignment.permissionCount} รายการ
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectContext(assignment);
                            }}
                            sx={{
                              borderRadius: 3,
                              px: 2.2,
                              py: 1,
                              textTransform: 'none',
                              fontWeight: 700,
                              background: accentGradient,
                              boxShadow: `0 8px 20px 0 ${alpha(
                                accentColor,
                                0.24,
                              )}`,
                              '&:hover': {
                                background: accentGradientHover,
                                boxShadow: `0 10px 24px 0 ${alpha(
                                  accentColor,
                                  0.3,
                                )}`,
                              },
                            }}
                          >
                            เลือกบริบทนี้
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              <Button
                variant="outlined"
                onClick={handleBackToLogin}
                startIcon={<ChevronLeftIcon />}
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  px: 1.8,
                  py: 0.85,
                  textTransform: 'none',
                  color: accentColor,
                  fontWeight: 700,
                  borderColor: accentBorderColor,
                  backgroundColor: alpha(accentColor, 0.04),
                  '&:hover': {
                    borderColor: accentColor,
                    backgroundColor: alpha(accentColor, 0.08),
                  },
                }}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
