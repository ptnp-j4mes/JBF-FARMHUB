/**
 * DocumentUploadDialog Component
 * 
 * Dialog for uploading new documents
 */

'use client';

import { Dialog, DialogContent } from '@mui/material';
import { DialogTitleWithClose } from '@/components/common';
import { DocumentForm } from './DocumentForm';
import { DocumentUploadRequest } from '../types';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentUploadRequest) => Promise<void>;
  loading?: boolean;
}

export function DocumentUploadDialog({
  open,
  onClose,
  onSubmit,
  loading,
}: DocumentUploadDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitleWithClose onClose={onClose}>อัพโหลดเอกสารใหม่</DialogTitleWithClose>
      <DialogContent>
        <DocumentForm onSubmit={onSubmit} onCancel={onClose} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
