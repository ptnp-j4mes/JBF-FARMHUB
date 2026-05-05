/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog
 */

import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from '@mui/material';
import DialogTitleWithClose from '@/design-system/components/atoms/DialogTitleWithClose/DialogTitleWithClose';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  confirmColor = 'primary',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitleWithClose onClose={onClose}>{title}</DialogTitleWithClose>
      <DialogContent sx={{ pt: 2.25 }}>
        <DialogContentText sx={{ color: 'text.secondary' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm} variant="contained" color={confirmColor} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
