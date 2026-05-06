/**
 * PRDetailsDialog Component
 *
 * Dialog for viewing purchase request details + approval actions
 */

'use client';

import { useMemo, useState } from 'react';
import {
  TaskAltOutlined,
  PendingOutlined,
  RadioButtonUnchecked,
  Refresh,
  CancelOutlined,
  ReceiptLong,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { StatusBadge, JBFarmTable, JBFarmTableColumn, DialogTitleWithClose } from '@/design-system';
import { PurchaseRequestResponse } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { formatDateTime } from '@/lib/utils/date.util';
import { DOCUMENT_STATUS_THAI } from '@/lib/constants/status-labels';
import { DocumentStatus } from '@/types/status.types';
import { getPurchaseStatusChipSx, toPurchaseStatusLabel } from '../utils/purchase-status.util';
import {
  getPurchaseDialogPaperSx,
  getPurchaseDialogContentSx,
  getPurchaseDialogTableSx,
  getPurchaseDialogActionsSx,
  getPurchaseDialogInfoAlertSx,
} from './purchase-dialog.constants';

interface PRDetailsDialogProps {
  open: boolean;
  request: PurchaseRequestResponse | null;
  onClose: () => void;
  onEdit?: (request: PurchaseRequestResponse) => void;
  onSubmit?: (id: number) => Promise<void> | void;
  canTakeApprovalAction?: boolean;
  actionLoading?: boolean;
  onApprove?: (id: number, comment: string) => Promise<void>;
  onReturn?: (id: number, comment: string) => Promise<void>;
  onReject?: (id: number, comment: string) => Promise<void>;
  onCancelRequest?: (id: number, reason: string) => Promise<void>;
}


const urgencyTypeMap: Record<string, 'default' | 'warning' | 'error'> = {
  Normal: 'default',
  High: 'warning',
  Urgent: 'error',
};

const urgencyLabel: Record<string, string> = {
  Normal: 'ปกติ',
  High: 'ด่วน',
  Urgent: 'เร่งด่วน',
};

const panelSx = { border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 1.75 };

export function PRDetailsDialog({
  open,
  request,
  onClose,
  onEdit,
  onSubmit,
  canTakeApprovalAction = false,
  actionLoading = false,
  onApprove,
  onReturn,
  onReject,
  onCancelRequest,
}: PRDetailsDialogProps) {
  const theme = useTheme();
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const approval = request?.approval;

  const actionHistory = useMemo(
    () => [...(approval?.actions ?? [])].sort((a, b) => a.stepOrder - b.stepOrder),
    [approval?.actions],
  );

  const approvalSteps = useMemo(() => {
    const steps = [...(approval?.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
    if (steps.length > 0) {
      return steps;
    }

    const fallbackSteps = new Map<number, { stepOrder: number; stepName: string; approverRole: string; isFinalStep: boolean }>();
    (approval?.actions ?? []).forEach((action) => {
      if (!fallbackSteps.has(action.stepOrder)) {
        fallbackSteps.set(action.stepOrder, {
          stepOrder: action.stepOrder,
          stepName: `Step ${action.stepOrder}`,
          approverRole: '-',
          isFinalStep: false,
        });
      }
    });
    if (approval?.currentStepOrder && !fallbackSteps.has(approval.currentStepOrder)) {
      fallbackSteps.set(approval.currentStepOrder, {
        stepOrder: approval.currentStepOrder,
        stepName: approval.currentStepName || `Step ${approval.currentStepOrder}`,
        approverRole: approval.currentApproverRole || '-',
        isFinalStep: false,
      });
    }

    return [...fallbackSteps.values()].sort((a, b) => a.stepOrder - b.stepOrder);
  }, [approval]);

  const latestActionByStep = useMemo(() => {
    const map = new Map<number, (typeof actionHistory)[number]>();
    [...actionHistory]
      .sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime())
      .forEach((action) => {
        map.set(action.stepOrder, action);
      });
    return map;
  }, [actionHistory]);

  const detailsTableColumns = useMemo<JBFarmTableColumn<PurchaseRequestResponse['lines'][number]>[]>(() => [
    {
      id: 'no',
      label: '#',
      width: 50,
      render: (_, index) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {index + 1}
        </Typography>
      ),
    },
    {
      id: 'item',
      label: 'สินค้า',
      width: 250,
      render: (line) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {line.itemCode} - {line.itemName}
        </Typography>
      ),
    },
    {
      id: 'quantity',
      label: 'จำนวน',
      width: 120,
      align: 'right',
      render: (line) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatNumber(Number(line.quantity || 0))}
        </Typography>
      ),
    },
    {
      id: 'uom',
      label: 'หน่วย',
      width: 90,
      render: (line) => (
        <Typography variant="body2" color="text.secondary">
          {line.uomName}
        </Typography>
      ),
    },
    {
      id: 'price',
      label: 'ราคาประมาณ',
      width: 130,
      align: 'right',
      render: (line) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {formatNumber(Number(line.estimatedPrice || 0), 2)} ฿
        </Typography>
      ),
    },
    {
      id: 'remarks',
      label: 'หมายเหตุ',
      width: 180,
      render: (line) => (
        <Typography variant="body2" color="text.secondary">
          {line.remarks || '-'}
        </Typography>
      ),
    },
  ], []);

  if (!request) return null;

  const calculateTotal = (payload: PurchaseRequestResponse) => {
    return payload.lines.reduce((sum, line) => sum + (line.estimatedPrice || 0), 0);
  };

  const canApprove = canTakeApprovalAction && request.status === 'Pending' && Boolean(onApprove);
  const canReturn = canTakeApprovalAction && request.status === 'Pending' && Boolean(onReturn);
  const canReject = canTakeApprovalAction && request.status === 'Pending' && Boolean(onReject);
  const hasApproval = Boolean(request.approval);

  const requireCommentFor = (action: 'return' | 'reject' | 'cancel') => {
    if (comment.trim().length < 5) {
      let msg = '';
      if (action === 'return') msg = 'กรุณาใส่เหตุผลการตีกลับอย่างน้อย 5 ตัวอักษร';
      else if (action === 'reject') msg = 'กรุณาใส่เหตุผลการไม่อนุมัติอย่างน้อย 5 ตัวอักษร';
      else msg = 'กรุณาใส่เหตุผลการยกเลิกอย่างน้อย 5 ตัวอักษร';
      
      setActionError(msg);
      return false;
    }

    return true;
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setActionError(null);
    await onApprove(request.id, comment.trim());
    setComment('');
  };

  const handleReturn = async () => {
    if (!onReturn) return;
    if (!requireCommentFor('return')) return;

    setActionError(null);
    await onReturn(request.id, comment.trim());
    setComment('');
  };

  const handleReject = async () => {
    if (!onReject) return;
    if (!requireCommentFor('reject')) return;

    setActionError(null);
    await onReject(request.id, comment.trim());
    setComment('');
  };

  const handleCancel = async () => {
    if (!onCancelRequest) return;
    if (!requireCommentFor('cancel')) return;

    setActionError(null);
    await onCancelRequest(request.id, comment.trim());
    setComment('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: getPurchaseDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose} disabled={actionLoading} variant="master">
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            รายละเอียดใบขอซื้อ
          </Typography>
          <StatusBadge
            label={urgencyLabel[request.urgency] ?? request.urgency}
            type={urgencyTypeMap[request.urgency] ?? 'default'}
            size="small"
          />
        </Stack>
      </DialogTitleWithClose>
      <DialogContent dividers sx={getPurchaseDialogContentSx(theme)}>
        <Stack spacing={2.5}>
          <Stack spacing={2}>
            {/* Header Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
              {/* เลขที่เอกสาร */}
              <Paper elevation={0} sx={panelSx}>
                <Typography variant="caption" color="text.secondary">เลขที่เอกสาร</Typography>
                <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {request.documentNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  วันที่: {formatDateTime(request.requestDate)}
                </Typography>
              </Paper>
              {/* ผู้ขอ */}
              <Paper elevation={0} sx={panelSx}>
                <Typography variant="caption" color="text.secondary">ผู้ขอ</Typography>
                <Typography variant="body1" sx={{ fontWeight: 900 }}>
                  {request.requestorName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  แผนก: {request.department || '-'} · ฟาร์ม: {request.facilityName || '-'}
                </Typography>
              </Paper>
              {/* สถานะ */}
              <Paper elevation={0} sx={panelSx}>
                <Typography variant="caption" color="text.secondary">สถานะเอกสาร</Typography>
                <Box sx={{ mt: 0.75 }}>
                  <Chip
                    label={toPurchaseStatusLabel(request.status)}
                    sx={{ ...getPurchaseStatusChipSx(request.status), fontWeight: 900, fontSize: '0.85rem', height: 28 }}
                  />
                </Box>

              </Paper>
            </Box>

            {/* Items Table */}
            <Box>
              <JBFarmTable
                columns={detailsTableColumns}
                rows={request.lines}
                height={320}
                minWidth={800}
                getRowId={(line) => line.id}
                showPagination={false}
                emptyMessage="ไม่พบรายการสินค้า"
                footer={(
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    px: 3,
                    py: 1.5,
                  }}>
                    <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>
                      รวมทั้งหมด
                    </Typography>
                    <Typography sx={{ fontWeight: 950, color: '#fff', fontSize: '1.1rem' }}>
                      {formatNumber(calculateTotal(request), 2)} ฿
                    </Typography>
                  </Box>
                )}
              />
            </Box>


          </Stack>

          {/* Approval Timeline */}
          {hasApproval && (
            <Box sx={{ width: '100%', pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLong sx={{ fontSize: 18 }} />
                ลำดับการอนุมัติ
              </Typography>
              {approvalSteps.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีประวัติการอนุมัติ
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {approvalSteps.map((step, stepIndex) => {
                    const isLastStep = stepIndex === approvalSteps.length - 1;
                    const latestAction = latestActionByStep.get(step.stepOrder);
                    const latestActionName = String(latestAction?.action || '').toLowerCase();
                    const approvalStatus = String(request.approval?.status || '').toLowerCase();
                    const isCurrentStep = step.stepOrder === (request.approval?.currentStepOrder ?? -1);
                    const isCompleted = latestActionName === 'approve' || (approvalStatus === 'approved' && step.stepOrder <= (request.approval?.currentStepOrder ?? 0));
                    const isReturned = latestActionName === 'return';
                    const isRejected = latestActionName === 'reject';

                    let icon = <RadioButtonUnchecked sx={{ fontSize: 20, color: 'text.disabled' }} />;
                    let stateLabel = 'รอดำเนินการ';
                    let stateType: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
                    let stepStatus: 'default' | 'success' | 'warning' | 'error' = 'default';
                    if (isCompleted) {
                      icon = <TaskAltOutlined sx={{ fontSize: 20, color: 'success.main' }} />;
                      stateLabel = 'อนุมัติแล้ว';
                      stateType = 'success';
                      stepStatus = 'success';
                    } else if (isReturned) {
                      icon = <Refresh sx={{ fontSize: 20, color: 'warning.main' }} />;
                      stateLabel = 'ตีกลับ';
                      stateType = 'warning';
                      stepStatus = 'warning';
                    } else if (isRejected) {
                      icon = <CancelOutlined sx={{ fontSize: 20, color: 'error.main' }} />;
                      stateLabel = 'ไม่อนุมัติ';
                      stateType = 'error';
                      stepStatus = 'error';
                    } else if (isCurrentStep && (approvalStatus === 'pending' || approvalStatus === 'pendingapproval')) {
                      icon = <PendingOutlined sx={{ fontSize: 20, color: 'info.main' }} />;
                      stateLabel = 'กำลังรออนุมัติ';
                      stateType = 'info';
                    }

                    return (
                      <Box key={`step-${step.stepOrder}`} sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', columnGap: 1 }}>
                        <Stack alignItems="center">
                          <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {icon}
                          </Box>
                          {!isLastStep ? (
                            <Box
                              sx={{
                                width: 2,
                                flex: 1,
                                minHeight: 42,
                                bgcolor: 'divider',
                                mt: 0.4,
                                borderRadius: 1,
                              }}
                            />
                          ) : null}
                        </Stack>

                        <Paper variant="outlined" sx={{ p: 1.25, mb: 0.7, border: '1px solid', borderColor: 'divider', borderRadius: 2.4 }}>
                          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                              <Typography variant="body2" fontWeight={700}>
                                Step {step.stepOrder}: {step.stepName}
                              </Typography>
                              <StatusBadge size="small" label={stateLabel} type={stateType} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              Role ที่ต้องอนุมัติ: {step.approverRole || '-'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ผู้อนุมัติ: {latestAction?.approverName || '-'}
                            </Typography>
                            {latestAction && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.7rem', mt: 0.5 }}>
                                {formatDateTime(latestAction.actionDate)}
                              </Typography>
                            )}
                            {stepStatus === 'error' && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'error.dark', mt: 0.5, bgcolor: alpha(theme.palette.error.main, 0.08), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
                                {latestAction?.comment || 'ไม่อนุมัติ'}
                              </Typography>
                            )}
                            {stepStatus === 'warning' && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'warning.dark', mt: 0.5, bgcolor: alpha(theme.palette.warning.main, 0.08), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                                {latestAction?.comment || 'ตีกลับ'}
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}
          {/* Approval Actions */}
          {(canApprove || canReturn || canReject) && (
            <Box sx={{ width: '100%', pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5, color: 'text.secondary' }}>
                ดำเนินการอนุมัติ
              </Typography>
              <Alert severity="info" sx={{ ...getPurchaseDialogInfoAlertSx(theme), mb: 1.5 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant="body2" fontWeight={700}>
                    ขั้นตอนที่ต้องอนุมัติ:
                  </Typography>
                  <Chip size="small" variant="outlined" label={`Step ${request.approval?.currentStepOrder ?? '-'}: ${request.approval?.currentStepName ?? '-'}`} />
                  <Chip size="small" color="warning" variant="outlined" label={`Role: ${request.approval?.currentApproverRole || '-'}`} />
                </Stack>
              </Alert>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Comment (จำเป็นสำหรับ Return/Reject/Cancel)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                sx={{ mb: 1.5 }}
              />
              {actionError ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>{actionError}</Alert>
              ) : null}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={getPurchaseDialogActionsSx(theme)}>
        {/* Approval Flow Buttons */}
        {(canApprove || canReturn || canReject) && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end" sx={{ width: '100%' }}>
            {onCancelRequest ? (
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<CancelOutlined sx={{ fontSize: 18 }} />} 
                onClick={handleCancel} 
                disabled={actionLoading} 
                sx={{ borderRadius: 999, px: 2 }}
              >
                {DOCUMENT_STATUS_THAI[DocumentStatus.Cancelled]}
              </Button>
            ) : null}
            {canApprove ? (
              <Button 
                variant="contained" 
                startIcon={<TaskAltOutlined sx={{ fontSize: 18 }} />} 
                onClick={handleApprove} 
                disabled={actionLoading} 
                sx={{ borderRadius: 999, px: 2, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                {DOCUMENT_STATUS_THAI[DocumentStatus.Approved]}
              </Button>
            ) : null}
            {canReturn ? (
              <Button 
                variant="outlined" 
                color="warning" 
                startIcon={<Refresh sx={{ fontSize: 18 }} />} 
                onClick={handleReturn} 
                disabled={actionLoading} 
                sx={{ borderRadius: 999, px: 2 }}
              >
                {DOCUMENT_STATUS_THAI[DocumentStatus.Returned]}
              </Button>
            ) : null}
            {canReject ? (
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<CancelOutlined sx={{ fontSize: 18 }} />} 
                onClick={handleReject} 
                disabled={actionLoading} 
                sx={{ borderRadius: 999, px: 2 }}
              >
                {DOCUMENT_STATUS_THAI[DocumentStatus.Rejected]}
              </Button>
            ) : null}
          </Stack>
        )}
        {(request.status === 'Draft' || request.status === 'Returned') && onSubmit ? (
          <Button 
            variant="contained" 
            onClick={() => onSubmit(request.id)} 
            sx={{ borderRadius: 999, px: 2.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            ส่งอนุมัติ
          </Button>
        ) : null}
        {(request.status === 'Draft' || request.status === 'Returned') && onEdit ? (
          <Button 
            variant="outlined" 
            onClick={() => onEdit(request)} 
            sx={{ borderRadius: 999, px: 2.5, borderColor: 'primary.main', color: 'primary.main' }}
          >
            แก้ไข
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
