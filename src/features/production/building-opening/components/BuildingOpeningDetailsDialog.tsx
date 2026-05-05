'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddCircleOutline,
  DeleteOutline,
  EditOutlined,
  SaveOutlined,
  SendOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { DialogTitleWithClose } from '@/components/common';
import { formatDateTime } from '@/lib/utils/date.util';
import {
  canEditBuildingOpeningChecklist,
  getWorkflowStatusChipSx,
  isWorkflowStatus,
  toThaiWorkflowStatus,
} from '@/lib/utils/status.util';
import { MASTER_DIALOG_FORM_SX } from '@/core/ui-patterns/pr-ui.constants';
import { buildingOpeningService } from '../services/building-opening.service';
import type {
  BuildingOpeningChecklistResponse,
  BuildingOpeningPigBatchOptionResponse,
  BuildingOpeningResponse,
  CompleteBuildingOpeningRequest,
  UpdateBuildingOpeningChecklistsRequest,
} from '../types';

const UI = {
  accent: 'rgb(22, 90, 80)',
  accentDark: '#10473f',
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#eef4ef',
  border: '#d8dfda',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const DIALOG_PAPER_SX = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadow,
  overflow: 'hidden',
  bgcolor: UI.panel,
};

const DIALOG_TITLE_SX = {
  bgcolor: UI.accent,
  color: '#fff',
  borderBottom: `1px solid ${alpha(UI.accent, 0.24)}`,
  fontWeight: 800,
  '& .MuiIconButton-root': {
    color: '#fff',
  },
};

const DIALOG_CONTENT_SX = {
  ...MASTER_DIALOG_FORM_SX,
  bgcolor: '#fcfdfc',
  px: { xs: 1.5, md: 2 },
  py: { xs: 1.5, md: 2 },
};

const SECTION_FIELDSET_SX = {
  border: `1px solid ${UI.border}`,
  borderRadius: 3,
  p: { xs: 1.25, md: 1.5 },
  minWidth: 0,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
};

const SECTION_LEGEND_SX = {
  px: 1.1,
  fontSize: '0.95rem',
  fontWeight: 800,
  color: UI.text,
  letterSpacing: '-0.01em',
};

const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.2,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
    '& fieldset': {
      borderColor: UI.border,
    },
    '&:hover fieldset': {
      borderColor: UI.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: UI.accent,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: UI.accent,
  },
};

const INFO_ALERT_SX = {
  border: `1px solid ${alpha(UI.accent, 0.14)}`,
  bgcolor: '#f2f7f4',
  color: UI.text,
  boxShadow: UI.shadowSoft,
};

const ERROR_ALERT_SX = {
  border: '1px solid #f3c2c2',
  bgcolor: '#fff4f4',
  color: '#8c2f2f',
  boxShadow: UI.shadowSoft,
};

const SECTION_BOX_SX = {
  p: 1.25,
  border: `1px solid ${UI.border}`,
  borderRadius: 2.4,
  bgcolor: '#fbfcfb',
};

const ACTIONS_SX = {
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  borderTop: `1px solid ${UI.border}`,
  bgcolor: '#fbfcfb',
  gap: 1,
};

const PRIMARY_BUTTON_SX = {
  borderRadius: 2.2,
  px: 2.2,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': {
    bgcolor: UI.accentDark,
  },
};

const OUTLINED_BUTTON_SX = {
  borderRadius: 2.2,
  px: 2,
  boxShadow: UI.shadowSoft,
  bgcolor: '#fff',
  borderColor: UI.borderStrong,
  color: UI.text,
  '&:hover': {
    borderColor: UI.accent,
    bgcolor: '#f7faf7',
  },
};

type ReceiveDraftLine = {
  uid: string;
  sourceLineId?: number;
  isExisting?: boolean;
  pigBatchNo?: string;
  pigBatchId: string;
  actualReceivedQuantity: string;
  receivedDate: string;
  remarks: string;
};

type BuildingOpeningDetailsDialogProps = {
  open: boolean;
  request: BuildingOpeningResponse | null;
  onClose: () => void;
  onRefresh: (id: number) => Promise<void>;
  onSubmit?: (id: number) => Promise<void>;
  onEdit?: (request: BuildingOpeningResponse) => void;
  onUpdateChecklists?: (id: number, payload: UpdateBuildingOpeningChecklistsRequest) => Promise<void>;
  onComplete?: (id: number, payload: CompleteBuildingOpeningRequest) => Promise<void>;
};

function statusLabel(status: string): string {
  return toThaiWorkflowStatus(status);
}

function makeDraftLine(overrides?: Partial<ReceiveDraftLine>): ReceiveDraftLine {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceLineId: undefined,
    isExisting: false,
    pigBatchNo: '',
    pigBatchId: '',
    actualReceivedQuantity: '',
    receivedDate: dayjs().format('YYYY-MM-DD'),
    remarks: '',
    ...overrides,
  };
}

export function BuildingOpeningDetailsDialog({
  open,
  request,
  onClose,
  onRefresh,
  onSubmit,
  onEdit,
  onUpdateChecklists,
  onComplete,
}: BuildingOpeningDetailsDialogProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checklistDraft, setChecklistDraft] = useState<BuildingOpeningChecklistResponse[]>([]);
  const [receiveDraftLines, setReceiveDraftLines] = useState<ReceiveDraftLine[]>([]);
  const [receiveOptions, setReceiveOptions] = useState<BuildingOpeningPigBatchOptionResponse[]>([]);
  const [loadingReceiveOptions, setLoadingReceiveOptions] = useState(false);

  useEffect(() => {
    setChecklistDraft(request?.checklists ?? []);
  }, [request?.id, request?.checklists]);

  const requestId = request?.id ?? null;
  const checklistTotal = request?.checklistTotal ?? checklistDraft.length;
  const checklistCompleted = request?.checklistCompleted
    ?? checklistDraft.filter((item) => Boolean(item.isChecked)).length;
  const checklistDone = checklistTotal > 0 && checklistCompleted >= checklistTotal;

  const checklistGroups = useMemo(() => {
    const groups = new Map<string, BuildingOpeningChecklistResponse[]>();
    checklistDraft.forEach((item) => {
      if (!groups.has(item.category)) {
        groups.set(item.category, []);
      }
      groups.get(item.category)?.push(item);
    });
    return Array.from(groups.entries());
  }, [checklistDraft]);

  const changedChecklists = useMemo(() => {
    const source = request?.checklists ?? [];
    const original = new Map(source.map((item) => [item.id, Boolean(item.isChecked)]));
    return checklistDraft
      .filter((item) => original.get(item.id) !== Boolean(item.isChecked))
      .map((item) => ({
        id: item.id,
        isChecked: Boolean(item.isChecked),
      }));
  }, [checklistDraft, request?.checklists]);
  const changedChecklistIdSet = useMemo(
    () => new Set(changedChecklists.map((item) => item.id)),
    [changedChecklists],
  );

  const existingReceiveLines = request?.receiveLines;
  const receiveLinesKey = useMemo(
    () => (request?.receiveLines ?? [])
      .map((line) => `${line.id}:${line.pigBatchId}:${line.actualReceivedQuantity}:${line.receivedDate ?? ''}`)
      .join('|'),
    [request?.receiveLines],
  );

  useEffect(() => {
    if (!open || !requestId || !checklistDone) {
      setReceiveOptions([]);
      return;
    }
    setLoadingReceiveOptions(true);
    buildingOpeningService
      .getReceiveOptions(requestId)
      .then((rows) => setReceiveOptions(rows))
      .catch(() => setReceiveOptions([]))
      .finally(() => setLoadingReceiveOptions(false));
  }, [checklistDone, open, requestId]);

  useEffect(() => {
    if (!request) {
      setReceiveDraftLines([]);
      return;
    }

    if ((existingReceiveLines?.length ?? 0) > 0) {
      const existingRows = (existingReceiveLines ?? []).map((line) => makeDraftLine({
        sourceLineId: line.id,
        isExisting: true,
        pigBatchNo: line.pigBatchNo,
        pigBatchId: String(line.pigBatchId),
        actualReceivedQuantity: String(line.actualReceivedQuantity),
        receivedDate: line.receivedDate?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD'),
        remarks: line.remarks ?? '',
      }));
      if (request.status === 'Completed') {
        setReceiveDraftLines(existingRows);
        return;
      }
      setReceiveDraftLines([...existingRows, makeDraftLine()]);
      return;
    }

    // For non-completed requests, start with a fresh incoming line to avoid
    // accidentally resubmitting previously received cumulative quantity.
    setReceiveDraftLines([makeDraftLine()]);
  }, [
    receiveLinesKey,
    request?.id,
    request?.status,
  ]);

  if (!request) return null;

  const canEdit = isWorkflowStatus(request.status, 'Draft', 'InProgress');
  const canSubmit = isWorkflowStatus(request.status, 'Draft') && Boolean(onSubmit);
  const canToggle = canEditBuildingOpeningChecklist(request.status) && Boolean(onUpdateChecklists);
  const canComplete = isWorkflowStatus(request.status, 'AwaitingReceive') && checklistDone && Boolean(onComplete);
  const showCompleteButton = checklistDone && Boolean(onComplete);
  const canSaveChecklist = canToggle && changedChecklists.length > 0 && Boolean(onUpdateChecklists);
  const editableReceiveLines = request.status !== 'Completed';
  const completeDisabledReason = !checklistDone
    ? 'ต้องทำ Checklist ให้ครบก่อน'
    : (!isWorkflowStatus(request.status, 'AwaitingReceive')
      ? 'ต้องผ่านอนุมัติและสถานะรอรับเข้า ก่อนบันทึกรับเข้า'
      : '');

  const optionsByBatchId = new Map(receiveOptions.map((item) => [item.pigBatchId, item]));
  const totalDraftQty = receiveDraftLines
    .filter((line) => !line.isExisting)
    .reduce((sum, line) => {
    const qty = Number(line.actualReceivedQuantity);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);
  const existingTotalQty = receiveDraftLines
    .filter((line) => Boolean(line.isExisting))
    .reduce((sum, line) => {
      const qty = Number(line.actualReceivedQuantity);
      return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0);
  const remainingReceivableQty = Math.max(0, Number(request.quantity || 0) - existingTotalQty);

  const executeAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      setProcessing(true);
      await fn();
      await onRefresh(request.id);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setActionError(axiosError.response?.data?.message || 'ไม่สามารถดำเนินการได้');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการส่งอนุมัติ',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันส่ง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    await executeAction(async () => {
      await onSubmit(request.id);
      await Swal.fire({ icon: 'success', title: 'ส่งอนุมัติแล้ว', timer: 1200, showConfirmButton: false });
    });
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    const incomingLines = receiveDraftLines.filter((line) => !line.isExisting);
    if (incomingLines.length === 0) {
      setActionError('กรุณาเพิ่มรายการรับเข้าอย่างน้อย 1 รายการ');
      return;
    }

    const payloadLines: CompleteBuildingOpeningRequest['receiveLines'] = [];
    for (let index = 0; index < incomingLines.length; index += 1) {
      const line = incomingLines[index];
      const lineNo = index + 1;
      const pigBatchId = Number(line.pigBatchId);
      const qty = Number(line.actualReceivedQuantity);

      if (!Number.isFinite(pigBatchId) || pigBatchId <= 0) {
        setActionError(`รายการที่ ${lineNo}: กรุณาเลือกรุ่นหมู`);
        return;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        setActionError(`รายการที่ ${lineNo}: กรุณากรอกจำนวนรับเข้าให้ถูกต้อง`);
        return;
      }
      if (!line.receivedDate) {
        setActionError(`รายการที่ ${lineNo}: กรุณาเลือกวันที่รับเข้า`);
        return;
      }

      const option = optionsByBatchId.get(pigBatchId);
      if (option && qty > Number(option.availableQuantity || 0)) {
        setActionError(`รายการที่ ${lineNo}: จำนวนรับเข้าเกินสต๊อกคงเหลือของรุ่นหมู`);
        return;
      }

      payloadLines.push({
        pigBatchId,
        actualReceivedQuantity: qty,
        receivedDate: line.receivedDate || undefined,
        remarks: line.remarks.trim() || undefined,
      });
    }

    if (totalDraftQty > remainingReceivableQty) {
      setActionError(`จำนวนรับเข้ารอบนี้ต้องไม่เกินจำนวนที่รับได้คงเหลือ (${Number(remainingReceivableQty || 0).toLocaleString()})`);
      return;
    }
    if ((existingTotalQty + totalDraftQty) > Number(request.quantity || 0)) {
      setActionError(`จำนวนรับเข้ารวมต้องไม่เกินจำนวนที่ขอ (${Number(request.quantity || 0).toLocaleString()})`);
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันปิดงานเปิดโรงเรือน',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    await executeAction(async () => {
      await onComplete(request.id, {
        receiveLines: payloadLines,
      });
      await Swal.fire({ icon: 'success', title: 'ปิดงานสำเร็จ', timer: 1200, showConfirmButton: false });
    });
  };

  const handleSaveChecklist = async () => {
    if (!onUpdateChecklists || changedChecklists.length === 0) return;

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันบันทึก Checklist',
      text: `มีรายการเปลี่ยนแปลง ${changedChecklists.length} รายการ`,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    await executeAction(async () => {
      await onUpdateChecklists(request.id, { checklists: changedChecklists });
      await Swal.fire({ icon: 'success', title: 'บันทึก Checklist สำเร็จ', timer: 1200, showConfirmButton: false });
    });
  };

  const addReceiveLine = () => {
    setReceiveDraftLines((prev) => [...prev, makeDraftLine()]);
  };

  const removeReceiveLine = (uid: string) => {
    setReceiveDraftLines((prev) => prev.filter((line) => line.uid !== uid));
  };

  const updateReceiveLine = (uid: string, patch: Partial<ReceiveDraftLine>) => {
    setReceiveDraftLines((prev) => prev.map((line) => (
      line.uid === uid ? { ...line, ...patch } : line
    )));
  };

  const getMaxAllowedForLine = (targetUid: string): number => {
    const otherIncomingSum = receiveDraftLines
      .filter((line) => !line.isExisting && line.uid !== targetUid)
      .reduce((sum, line) => {
        const qty = Number(line.actualReceivedQuantity);
        return sum + (Number.isFinite(qty) ? qty : 0);
      }, 0);
    return Math.max(0, remainingReceivableQty - otherIncomingSum);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
      <DialogTitleWithClose onClose={onClose} disabled={processing} sx={DIALOG_TITLE_SX}>รายละเอียดเปิดโรงเรือน</DialogTitleWithClose>
      <DialogContent dividers sx={DIALOG_CONTENT_SX}>
        <Stack spacing={2}>
          {actionError ? <Alert severity="error" sx={ERROR_ALERT_SX}>{actionError}</Alert> : null}

          <Stack direction="row" spacing={1}>
            <Chip label={statusLabel(request.status)} size="small" sx={getWorkflowStatusChipSx(request.status)} />
            <Chip
              label={`Checklist ${request.checklistCompleted}/${request.checklistTotal}`}
              size="small"
              variant="outlined"
              sx={{ borderColor: UI.borderStrong, color: UI.text, bgcolor: '#fff' }}
            />
          </Stack>

          <Box component="fieldset" sx={SECTION_FIELDSET_SX}>
            <Typography component="legend" sx={SECTION_LEGEND_SX}>
              ข้อมูลเอกสาร
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.1,
              }}
            >
              {[
                ['เลขที่เอกสาร', request.documentNumber],
                ['วันที่เปิด', formatDateTime(request.requestDate)],
                ['ผู้บันทึก', request.requestorName || '-'],
                ['ฟาร์ม', request.facilityName || '-'],
                ['โรงเรือน', `${request.houseCode} - ${request.houseName}`],
                ['โซน/รุ่น', `${request.zone || '-'} / ${request.generation || '-'}`],
                ['แหล่งสุกร', request.pigSource],
                ['จำนวน', Number(request.quantity).toLocaleString()],
                ['ราคาต่อหัว', Number(request.pricePerHead || 0).toLocaleString()],
                ['มูลค่ารวม', Number(request.totalAmount || 0).toLocaleString()],
                ['หมายเหตุ', request.remarks || '-'],
              ].map(([label, value]) => (
                <Box key={label} sx={SECTION_BOX_SX}>
                  <Typography sx={{ fontSize: '0.78rem', color: UI.muted, fontWeight: 700, mb: 0.35 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: UI.text, fontWeight: 600 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {checklistDone ? (
            <Box component="fieldset" sx={SECTION_FIELDSET_SX}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography component="div" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  ปิดงานรับเข้าสุกรจริง (หลายล็อต)
                </Typography>
                {editableReceiveLines ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddCircleOutline />}
                    onClick={addReceiveLine}
                    disabled={loadingReceiveOptions || processing || !canComplete}
                    sx={OUTLINED_BUTTON_SX}
                  >
                    เพิ่มล็อต
                  </Button>
                ) : (
                  <Chip size="small" color="success" label="รับเข้าแล้ว" />
                )}
              </Stack>

              <Stack spacing={1}>
                {receiveDraftLines.map((line, index) => {
                  const isLineEditable = editableReceiveLines && !line.isExisting;
                  const selectedOption = optionsByBatchId.get(Number(line.pigBatchId));
                  const hasCurrentBatchInOptions = receiveOptions.some((item) => String(item.pigBatchId) === line.pigBatchId);
                  return (
                    <Stack key={line.uid} spacing={1}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          size="small"
                          select
                          label={`ล็อตที่ ${index + 1}`}
                          value={line.pigBatchId}
                          onChange={(event) => updateReceiveLine(line.uid, { pigBatchId: event.target.value })}
                          disabled={loadingReceiveOptions || processing || !isLineEditable}
                          fullWidth
                          sx={INPUT_SX}
                        >
                          <MenuItem value="">เลือกรุ่นหมู</MenuItem>
                          {!hasCurrentBatchInOptions && line.pigBatchId ? (
                            <MenuItem value={line.pigBatchId}>
                              {line.pigBatchNo || `Batch ${line.pigBatchId}`} | รับเข้าแล้ว
                            </MenuItem>
                          ) : null}
                          {receiveOptions.map((item) => (
                            <MenuItem key={item.pigBatchId} value={item.pigBatchId}>
                              {item.pigBatchNo} | {item.itemCode} {item.itemName} | ฟาร์ม {item.facilityName} | คลัง {item.warehouseName} | คงเหลือ {Number(item.availableQuantity).toLocaleString()}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          label="จำนวนรับเข้า"
                          value={line.actualReceivedQuantity}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/,/g, '');
                            if (/^\d*(\.\d{0,4})?$/.test(nextValue)) {
                              const numericValue = Number(nextValue || 0);
                              const maxForLine = getMaxAllowedForLine(line.uid);
                              if (Number.isFinite(numericValue) && numericValue <= maxForLine) {
                                setActionError(null);
                                updateReceiveLine(line.uid, { actualReceivedQuantity: nextValue });
                              } else {
                                setActionError(`รายการที่ ${index + 1}: จำนวนรับเข้าต้องไม่เกิน ${Number(maxForLine).toLocaleString()}`);
                              }
                            }
                          }}
                          inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                          fullWidth
                          disabled={processing || !isLineEditable}
                          sx={INPUT_SX}
                        />
                        <TextField
                          size="small"
                          label="วันที่รับเข้า"
                          type="date"
                          value={line.receivedDate}
                          onChange={(event) => updateReceiveLine(line.uid, { receivedDate: event.target.value })}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          disabled={processing || !isLineEditable}
                          sx={INPUT_SX}
                        />
                        {isLineEditable ? (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeReceiveLine(line.uid)}
                            disabled={processing || receiveDraftLines.length <= 1}
                          >
                            <DeleteOutline />
                          </IconButton>
                        ) : null}
                      </Stack>

                      {selectedOption ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                        สต๊อกคงเหลือ: {Number(selectedOption.availableQuantity || 0).toLocaleString()} | คลัง: {selectedOption.warehouseName}
                      </Typography>
                    ) : null}
                  </Stack>
                );
              })}
              </Stack>

              <Alert severity="info" icon={false} sx={{ ...INFO_ALERT_SX, mt: 1.2 }}>
                จำนวนที่ขอ: {Number(request.quantity || 0).toLocaleString()} | รับเข้าแล้ว: {Number(existingTotalQty || 0).toLocaleString()} | รับได้คงเหลือ: {Number(remainingReceivableQty || 0).toLocaleString()} | รอบนี้: {Number(totalDraftQty || 0).toLocaleString()}
              </Alert>
            </Box>
          ) : null}

          <Divider sx={{ borderColor: UI.border }} />
          <Box component="fieldset" sx={SECTION_FIELDSET_SX}>
            <Typography component="legend" sx={SECTION_LEGEND_SX}>
              Checklist ก่อนเปิดโรงเรือน
            </Typography>
            <Stack spacing={1}>
              {checklistGroups.map(([category, rows]) => (
                <Box key={category} sx={{ ...SECTION_BOX_SX, p: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.75, color: UI.text, fontWeight: 800 }}>{category}</Typography>
                  <Stack>
                    {rows
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
                      .map((item) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ py: 0.25 }}
                        >
                          <Checkbox
                            checked={Boolean(item.isChecked)}
                            disabled={!canToggle || processing}
                            onChange={() => {
                              setChecklistDraft((prev) => prev.map((row) => (
                                row.id === item.id ? { ...row, isChecked: !row.isChecked } : row
                              )));
                            }}
                            sx={{
                              color: UI.borderStrong,
                              '&.Mui-checked': { color: UI.accent },
                            }}
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>{item.checklistLabel}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.isChecked
                              ? (changedChecklistIdSet.has(item.id)
                                ? 'รอบันทึก'
                                : `${item.checkedByName || 'User'} • ${item.checkedDate ? formatDateTime(item.checkedDate) : ''}`)
                              : '-'}
                          </Typography>
                        </Stack>
                      ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={ACTIONS_SX}>
        {canToggle ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<SaveOutlined />}
            onClick={handleSaveChecklist}
            disabled={!canSaveChecklist || processing}
            sx={OUTLINED_BUTTON_SX}
          >
            บันทึก Checklist
          </Button>
        ) : null}
        {canEdit && onEdit ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlined />}
            onClick={() => onEdit(request)}
            disabled={processing}
            sx={OUTLINED_BUTTON_SX}
          >
            แก้ไข
          </Button>
        ) : null}
        {canSubmit ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<SendOutlined />}
            onClick={handleSubmit}
            disabled={processing}
            sx={PRIMARY_BUTTON_SX}
          >
            ส่งอนุมัติ
          </Button>
        ) : null}
        {showCompleteButton ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<TaskAltOutlined />}
            onClick={handleComplete}
            disabled={processing || !canComplete}
            title={(!canComplete && completeDisabledReason) ? completeDisabledReason : undefined}
            sx={PRIMARY_BUTTON_SX}
          >
            บันทึกรับเข้าจริง
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
