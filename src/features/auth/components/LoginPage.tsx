'use client';

import {
  Box,
  Container,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { authService } from '../services/auth.service';

const REMEMBER_LOGIN_STORAGE_KEY = 'remember_login_credentials';

type RememberedLoginCredentials = {
  username: string;
  password: string;
};

const loginSchema = z.object({
  username: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ใช้งาน'),
  password: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  rememberMe: z.boolean(),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const readRememberedLogin = (): RememberedLoginCredentials | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(REMEMBER_LOGIN_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RememberedLoginCredentials>;
    if (
      typeof parsed.username === 'string' &&
      typeof parsed.password === 'string'
    ) {
      return {
        username: parsed.username,
        password: parsed.password,
      };
    }
  } catch {
    window.localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
  }

  return null;
};

const saveRememberedLogin = (credentials: RememberedLoginCredentials) => {
  window.localStorage.setItem(
    REMEMBER_LOGIN_STORAGE_KEY,
    JSON.stringify(credentials),
  );
};

const clearRememberedLogin = () => {
  window.localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
};

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    const rememberedLogin = readRememberedLogin();
    if (rememberedLogin) {
      reset({
        username: rememberedLogin.username,
        password: rememberedLogin.password,
        rememberMe: true,
      });
    }
  }, [reset]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const normalizedData = {
        username: data.username.trim(),
        password: data.password.trim(),
      };

      const response = await authService.login({
        username: normalizedData.username,
        password: normalizedData.password,
      });

      if (response) {
        if (data.rememberMe) {
          saveRememberedLogin(normalizedData);
        } else {
          clearRememberedLogin();
        }

        const nextPath = searchParams.get('next');
        const normalizedNextPath =
          nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
            ? nextPath
            : null;
        const redirectPath = normalizedNextPath ?? '/access';
        router.replace(redirectPath);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const responseData = error.response?.data;
        const serverMessage =
          typeof responseData === 'string'
            ? responseData
            : typeof responseData === 'object' && responseData !== null
              ? (() => {
                  const message = (responseData as { message?: unknown })
                    .message;
                  return typeof message === 'string' ? message : null;
                })()
              : null;
        Swal.fire({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text:
            serverMessage?.trim() ||
            'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน',
          icon: 'error',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#B42318',
          customClass: {
            popup: 'swal-clean-popup',
            title: 'swal-clean-title',
            htmlContainer: 'swal-clean-text',
            confirmButton: 'swal-clean-button',
          },
          background: theme.palette.mode === 'dark' ? '#1a1d29' : '#ffffff',
          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1d29',
          iconColor: '#B42318',
        });
        return;
      }

      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#B42318',
        customClass: {
          popup: 'swal-clean-popup',
          title: 'swal-clean-title',
          htmlContainer: 'swal-clean-text',
          confirmButton: 'swal-clean-button',
        },
        background: theme.palette.mode === 'dark' ? '#1a1d29' : '#ffffff',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1d29',
        iconColor: '#B42318',
      });
    }
  };

  const accentGradient =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #B42318 0%, #912018 100%)'
      : 'linear-gradient(135deg, #B42318 0%, #912018 100%)';
  const accentColor = '#B42318';
  const accentGradientHover =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #912018 0%, #7A271A 100%)'
      : 'linear-gradient(135deg, #912018 0%, #7A271A 100%)';
  const accentBorderColor =
    theme.palette.mode === 'dark'
      ? 'rgba(180, 35, 24, 0.35)'
      : 'rgba(180, 35, 24, 0.24)';
  const accentShadow =
    theme.palette.mode === 'dark'
      ? 'rgba(180, 35, 24, 0.28)'
      : 'rgba(180, 35, 24, 0.32)';

  const bgGradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, #18211a 0%, #223127 50%, #1b261f 100%)`
      : `linear-gradient(135deg, #fff7f7 0%, #fef3f2 50%, #ffffff 100%)`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(132, 170, 112, 0.18) 0%, transparent 48%), radial-gradient(circle at 80% 80%, rgba(95, 143, 91, 0.16) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
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
              ? 'radial-gradient(circle, rgba(180, 35, 24, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(180, 35, 24, 0.24) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 20s ease-in-out infinite',
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
              ? 'radial-gradient(circle, rgba(180, 35, 24, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(180, 35, 24, 0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }

        .swal-clean-popup {
          border-radius: 12px !important;
          box-shadow: 0 10px 34px 0 rgba(180, 35, 24, 0.22) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
        }

        .swal-clean-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
        }

        .swal-clean-text {
          font-size: 1rem !important;
          line-height: 1.6 !important;
          margin-top: 0.5rem !important;
        }

        .swal-clean-button {
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          text-transform: none !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 15px 0 rgba(180, 35, 24, 0.3) !important;
        }

        .swal-clean-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px 0 rgba(180, 35, 24, 0.4) !important;
        }
      `}</style>

      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            borderRadius: 5,
            overflow: 'hidden',
            maxWidth: 950,
            margin: '0 auto',
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
                : '0 10px 34px 0 rgba(180, 35, 24, 0.2)',
          }}
        >
          <Box
            sx={{
              width: '50%',
              position: 'relative',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(180, 35, 24, 0.08) 0%, rgba(180, 35, 24, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(180, 35, 24, 0.09) 0%, rgba(180, 35, 24, 0.1) 100%)',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
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
                maxWidth: 300,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
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
                      : '0 8px 28px 0 rgba(180, 35, 24, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border:
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(255, 255, 255, 0.5)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #912018 0%, #7A271A 100%)'
                        : 'linear-gradient(135deg, #912018 0%, #7A271A 100%)',
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '0 6px 20px 0 rgba(180, 35, 24, 0.4)'
                        : '0 6px 20px 0 rgba(180, 35, 24, 0.5)',
                  },
                }}
              >
              <Image
                  src="/branding/farmhub-logo.png"
                  alt="FarmHUB"
                  width={160}
                  height={160}
                  style={{
                    filter: 'brightness(0) invert(1) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12))',
                  }}
                />
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: accentColor,
                    fontWeight: 800,
                    mb: 1.5,
                    background:
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #B42318 0%, #912018 100%)'
                        : 'none',
                    WebkitBackgroundClip:
                      theme.palette.mode === 'dark' ? 'text' : 'none',
                    WebkitTextFillColor:
                      theme.palette.mode === 'dark' ? 'transparent' : 'inherit',
                  }}
                >
                  ระบบบริหารจัดการฟาร์มหมู
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    maxWidth: 300,
                    lineHeight: 1.8,
                    fontWeight: 400,
                  }}
                >
                  ระบบบริหารจัดการฟาร์ม เพื่อการจัดการที่มีประสิทธิภาพ
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              padding: { xs: 4, sm: 5, paddingBottom: 6 },
              backgroundColor: 'background.paper',
              position: 'relative',
            }}
          >
            <Box sx={{ mb: 5, mt: 3 }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: accentGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0,
                  pb: 2,
                }}
              >
                JBFarmHub
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400,
                }}
              >
                ยินดีต้อนรับ กรุณาเข้าสู่ระบบเพื่อดำเนินการ
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  ชื่อผู้ใช้งาน
                </Typography>
                <TextField
                  fullWidth
                  type="text"
                  {...register('username')}
                  error={!!errors.username}
                  helperText={errors.username?.message || ' '}
                  disabled={isSubmitting}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  variant="outlined"
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle
                          sx={{
                            color: accentColor,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : accentBorderColor,
                        borderWidth: '1.5px',
                      },
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.9)',
                        '& fieldset': {
                          borderColor: accentColor,
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 1)',
                        '& fieldset': {
                          borderColor: accentColor,
                          borderWidth: '2px',
                        },
                      },
                      '& input': {
                        color: 'text.primary',
                        fontSize: '0.95rem',
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  รหัสผ่าน
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message || ' '}
                  disabled={isSubmitting}
                  placeholder="••••••••••••"
                  variant="outlined"
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color: accentColor,
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                          size="small"
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: accentColor,
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : accentBorderColor,
                        borderWidth: '1.5px',
                      },
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.9)',
                        '& fieldset': {
                          borderColor: accentColor,
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 1)',
                        '& fieldset': {
                          borderColor: accentColor,
                          borderWidth: '2px',
                        },
                      },
                      '& input': {
                        color: 'text.primary',
                        fontSize: '0.95rem',
                      },
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  mb: 3,
                }}
              >
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          onBlur={field.onBlur}
                          inputRef={field.ref}
                          size="small"
                        />
                      }
                      label="จำฉันไว้"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        },
                      }}
                    />
                  )}
                />
                <Link
                  href="#"
                  underline="hover"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  ลืมรหัสผ่าน?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  mb: 3,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  height: 54,
                  background: accentGradient,
                  boxShadow: `0 4px 15px 0 ${accentShadow}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: accentGradientHover,
                    transform: 'translateY(-2px)',
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '0 6px 20px 0 rgba(180, 35, 24, 0.4)'
                        : '0 6px 20px 0 rgba(180, 35, 24, 0.5)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.875rem' }}
                >
                  ต้องการความช่วยเหลือ?{' '}
                  <Link
                    href="#"
                    underline="hover"
                    sx={{
                      color: accentColor,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ติดต่อผู้ดูแลระบบ
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
