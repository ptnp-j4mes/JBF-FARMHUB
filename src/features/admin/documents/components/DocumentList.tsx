/**
 * DocumentList Component
 * 
 * Table displaying list of documents
 */

'use client';

import { DataTable, Column, ActionMenu, ActionMenuItem } from '@/components/common';
import { DocumentResponse } from '../types';
import { formatDateShort } from '@/lib/utils/date.util';
import { Chip, Typography } from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface DocumentListProps {
  documents: DocumentResponse[];
  loading?: boolean;
  onView: (document: DocumentResponse) => void;
  onEdit: (document: DocumentResponse) => void;
  onDelete: (id: number) => void;
  onDownload: (document: DocumentResponse) => void;
}

export function DocumentList({
  documents,
  loading,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: DocumentListProps) {
  const columns: Column<DocumentResponse>[] = [
    {
      id: 'documentNumber',
      label: 'เลขที่เอกสาร',
      format: (value) => (
        <Typography variant="body2" fontWeight="medium">
          {value as React.ReactNode}
        </Typography>
      ),
    },
    {
      id: 'title',
      label: 'ชื่อเอกสาร',
    },
    {
      id: 'documentType',
      label: 'ประเภท',
      format: (value) => <Chip label={value as React.ReactNode} size="small" />,
    },
    {
      id: 'category',
      label: 'หมวดหมู่',
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      format: (value) => {
        const colorMap: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
          Active: 'success',
          Draft: 'warning',
          Archived: 'default',
          Obsolete: 'error',
        };
        return <Chip label={value as React.ReactNode} color={colorMap[value as string] || 'default'} size="small" />;
      },
    },
    {
      id: 'uploadedDate',
      label: 'วันที่อัพโหลด',
      format: (value) => formatDateShort(value as string),
    },
    {
      id: 'uploadedBy',
      label: 'ผู้อัพโหลด',
    },
    {
      id: 'id',
      label: 'จัดการ',
      align: 'center',
      format: (_, row) => {
        const actions: ActionMenuItem[] = [
          {
            label: 'ดูรายละเอียด',
            icon: <ViewIcon fontSize="small" />,
            onClick: () => onView(row),
          },
          {
            label: 'ดาวน์โหลด',
            icon: <DownloadIcon fontSize="small" />,
            onClick: () => onDownload(row),
          },
          {
            label: 'แก้ไข',
            icon: <EditIcon fontSize="small" />,
            onClick: () => onEdit(row),
          },
          {
            label: 'ลบ',
            icon: <DeleteIcon fontSize="small" />,
            onClick: () => onDelete(row.id),
            color: 'error',
          },
        ];
        return <ActionMenu actions={actions} />;
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={documents}
      loading={loading}
      emptyMessage="ไม่มีเอกสาร"
    />
  );
}
