'use client';

import CardSummary, { type CardSummaryItem } from '@/components/common/CardSummary';
import {
  CancelOutlined as CancelOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  DraftsOutlined,
  LocalShippingOutlined as LocalShippingIcon,
  PendingActionsOutlined,
  ReceiptLongOutlined,
  Refresh as RefreshIcon,
  TaskAltOutlined,
} from '@mui/icons-material';
import { DocumentStatus } from '@/types/status.types';
import { PurchaseRequestResponse } from '../types';
import { DOCUMENT_STATUS_THAI } from '@/lib/constants/status-labels';

interface PRStatsProps {
  data: PurchaseRequestResponse[];
}

const countStatus = (data: PurchaseRequestResponse[], status: string) =>
  data.filter((request) => String(request.status).toLowerCase() === status.toLowerCase()).length;

export function PRStats({ data }: PRStatsProps) {
  const stats = {
    total: data.length,
    approved: countStatus(data, DocumentStatus.Approved),
    rejected: countStatus(data, DocumentStatus.Rejected),
    pending: countStatus(data, DocumentStatus.Pending),
    returned: countStatus(data, DocumentStatus.Returned),
    draft: countStatus(data, DocumentStatus.Draft),
    partiallyReceived: countStatus(data, DocumentStatus.PartiallyReceived),
    completed: countStatus(data, DocumentStatus.Completed),
    cancelled: countStatus(data, DocumentStatus.Cancelled),
  };

  const cards: CardSummaryItem[] = [
    {
      title: 'ใบขอซื้อทั้งหมด',
      value: stats.total,
      subtitle: 'เอกสารทั้งหมด',
      color: '#4a6982',
      iconBg: '#e9f0f6',
      icon: <ReceiptLongOutlined sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Approved],
      value: stats.approved,
      subtitle: 'สถานะ Approved',
      color: '#2e7d32',
      iconBg: '#ecf7ee',
      icon: <TaskAltOutlined sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Rejected],
      value: stats.rejected,
      subtitle: 'สถานะ Rejected',
      color: '#d32f2f',
      iconBg: '#ffebee',
      icon: <CancelOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Pending],
      value: stats.pending,
      subtitle: 'สถานะ Pending',
      color: '#d68b00',
      iconBg: '#fff3df',
      icon: <PendingActionsOutlined sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Returned],
      value: stats.returned,
      subtitle: 'สถานะ Returned',
      color: '#7c3aed',
      iconBg: '#f5f3ff',
      icon: <RefreshIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Draft],
      value: stats.draft,
      subtitle: 'สถานะ Draft',
      color: '#7c5ce5',
      iconBg: '#e4ddf4',
      icon: <DraftsOutlined sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.PartiallyReceived],
      value: stats.partiallyReceived,
      subtitle: 'สถานะ Partial',
      color: '#2563eb',
      iconBg: '#eff6ff',
      icon: <LocalShippingIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Completed],
      value: stats.completed,
      subtitle: 'สถานะ Completed',
      color: '#16a34a',
      iconBg: '#f0fdf4',
      icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: DOCUMENT_STATUS_THAI[DocumentStatus.Cancelled],
      value: stats.cancelled,
      subtitle: 'สถานะ Cancelled',
      color: '#dc2626',
      iconBg: '#fef2f2',
      icon: <CancelOutlinedIcon sx={{ fontSize: 20 }} />,
    },
  ];

  return <CardSummary cards={cards} />;
}
