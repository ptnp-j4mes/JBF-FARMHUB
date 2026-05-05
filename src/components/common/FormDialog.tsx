/**
 * FormDialog Component
 * 
 * Reusable dialog for forms
 */

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DialogTitleWithClose from './DialogTitleWithClose';

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

export default function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'บันทึก',
  maxWidth = 'sm',
  fullWidth = true,
  loading = false,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitleWithClose onClose={onClose}>{title}</DialogTitleWithClose>

      <DialogContent dividers>{children}</DialogContent>

      <DialogActions>
        {onSubmit && (
          <Button onClick={onSubmit} variant="contained" disabled={loading}>
            {submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
