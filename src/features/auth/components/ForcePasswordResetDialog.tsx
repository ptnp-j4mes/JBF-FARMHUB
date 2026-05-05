import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material';
import { VpnKey, LockReset } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { authService } from '@/features/auth/services/auth.service';

export default function ForcePasswordResetDialog() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    if (user?.requirePasswordReset) {
      setOpen(true);
    }
  }, []);

  const isValidPassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
        return;
    }

    if (!isValidPassword(newPassword)) {
      void Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านไม่ปลอดภัย',
        text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร รวมถึงมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อย 1 ตัว'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      void Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ตรงกัน',
        text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'
      });
      return;
    }

    setSubmitting(true);
    try {
      // In a real scenario, an authService.changePassword function would be called here.
      // E.g.: await authService.changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword });
      
      const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword: confirmPassword })
      });

      if (!response.ok) {
          const res = await response.json();
          throw new Error(res.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }

      // Update local storage
      const user = authService.getUser();
      if (user) {
          user.requirePasswordReset = false;
          localStorage.setItem('user_info', JSON.stringify(user));
      }

      setOpen(false);
      void Swal.fire({
        icon: 'success',
        title: 'เปลี่ยนรหัสผ่านสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error: any) {
      void Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ โปรดตรวจสอบรหัสผ่านปัจจุบันอีกครั้ง'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          borderTop: `4px solid ${theme.palette.primary.main}`,
        }
      }}
    >
      <DialogTitle component="div" sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box sx={{ 
            display: 'inline-flex', 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mb: 2
        }}>
            <LockReset fontSize="large" />
        </Box>
        <Typography variant="h6" fontWeight="bold">
          กำหนดรหัสผ่านใหม่
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          เพื่อความปลอดภัย กรุณากำหนดรหัสผ่านใหม่ก่อนเข้าใช้งานระบบครั้งแรก หรือ แอดมินได้ระงับรหัสผ่านเดิมของคุณ
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 4, pb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                    label="รหัสผ่านปัจจุบัน"
                    type="password"
                    fullWidth
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <VpnKey color="action" fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    label="รหัสผ่านใหม่"
                    type="password"
                    fullWidth
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={Boolean(newPassword && !isValidPassword(newPassword))}
                    helperText={newPassword && !isValidPassword(newPassword) ? 'ขั้นต่ำ 8 หลัก, มีอักษรภาษาอังกฤษ 1 ตัว และตัวเลข 1 ตัว' : ''}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <VpnKey color="primary" fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    label="ยืนยันรหัสผ่านใหม่"
                    type="password"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={Boolean(confirmPassword && confirmPassword !== newPassword)}
                    helperText={confirmPassword && confirmPassword !== newPassword ? 'รหัสผ่านไม่ตรงกัน' : ''}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <VpnKey color="primary" fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{ mt: 4, borderRadius: 1.5, py: 1.5, fontSize: '15px' }}
            >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกและเข้าสู่ระบบ'}
            </Button>
        </DialogContent>
      </form>
    </Dialog>
  );
}
