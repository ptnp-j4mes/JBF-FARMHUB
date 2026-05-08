import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  UI,
  SECTION_CARD_SX,
  FORM_INPUT_SX,
  PRIMARY_ACTION_SX,
  INITIAL_MED_FORM,
} from '../constants';
import {
  mergeBatchAllocations,
  sumAllocatedHeadcount,
  getPositiveNumber,
  buildBatchAllocationKey,
  resolveWarehouseSummaryMeta,
} from '../utils';
import LocationChip from '../components/LocationChip';
import PlanSuggestionPanel from '../components/PlanSuggestionPanel';
import MedRecordTable from '../components/MedRecordTable';

export default function MedsTab({
  medForm,
  setMedForm,
  medRecords,
  setMedRecords,
  medItemOptions,
  planSuggestions,
  otherHousePlanSuggestions,
  planLoading,
  medExecutionContext,
  medExecutionLoading,
  selectedHouse,
  selectedFarm,
  selectedGroup,
  medAllocatedHeadcount,
  medBatchAllocations,
  medWarehouseOptions,
  medSelectedWarehouseLots,
  fetchMedicationExecutionContext,
  nextRowId,
  onAppendPlanToMedRecords,
  onSwitchHouse,
}) {
  const handleAddRecord = () => {
    if (!medForm.medName) return;

    const vaccineItemId = Number(medForm.vaccineItemId || 0);
    const nextBatchAllocations = medBatchAllocations
      .filter(
        (allocation) =>
          getPositiveNumber(allocation?.allocatedHeadcount) > 0,
      )
      .map((allocation) => ({
        ...allocation,
        allocatedHeadcount: getPositiveNumber(allocation.allocatedHeadcount),
      }));

    if (
      vaccineItemId > 0 &&
      medExecutionContext?.batchOptions?.length > 0 &&
      nextBatchAllocations.length === 0
    ) {
      return;
    }

    const selectedWarehouse = medWarehouseOptions.find(
      (warehouse) =>
        Number(warehouse.warehouseId || 0) ===
        Number(medForm.warehouseId || 0),
    );
    const selectedLot = medSelectedWarehouseLots.find(
      (lot) =>
        Number(lot?.stockLotId || 0) ===
        Number(medForm.stockLotId || 0),
    );

    setMedRecords((prev) => [
      ...prev,
      {
        ...medForm,
        house: selectedHouse,
        id: nextRowId(),
        vaccinationPlanItemId: null,
        vaccineItemId: vaccineItemId > 0 ? vaccineItemId : '',
        amount:
          medAllocatedHeadcount > 0
            ? String(medAllocatedHeadcount)
            : medForm.amount,
        warehouseId:
          Number(medForm.warehouseId || 0) > 0
            ? Number(medForm.warehouseId)
            : '',
        warehouseName: selectedWarehouse?.warehouseName || '',
        stockLotId:
          Number(medForm.stockLotId || 0) > 0
            ? Number(medForm.stockLotId)
            : '',
        lotNumber: selectedLot?.lotNumber || '',
        batchAllocations: nextBatchAllocations,
        warehouseIssueStatus:
          Number(medForm.warehouseId || 0) > 0 ? 'READY' : 'NOT_SELECTED',
        warehouseIssueMessage:
          Number(medForm.warehouseId || 0) > 0
            ? ''
            : 'ยังไม่ได้เลือก warehouse สำหรับตัด stock',
      },
    ]);
    setMedForm(INITIAL_MED_FORM);
  };

  const handleDelete = (id) => {
    setMedRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBatchAllocationChange = (allocationKey, value) => {
    setMedForm((prev) => {
      const nextAllocations = medBatchAllocations.map((allocation) => {
        if (buildBatchAllocationKey(allocation) !== allocationKey) {
          return allocation;
        }
        const nextValue = value.trim() === '' ? 0 : Number(value);
        return {
          ...allocation,
          allocatedHeadcount:
            Number.isFinite(nextValue) && nextValue >= 0
              ? Math.min(
                  nextValue,
                  getPositiveNumber(allocation.availableQuantity) ||
                    nextValue,
                )
              : 0,
        };
      });
      const totalHeadcount = sumAllocatedHeadcount(nextAllocations);
      return {
        ...prev,
        batchAllocations: nextAllocations,
        amount: totalHeadcount > 0 ? String(totalHeadcount) : '',
      };
    });
  };

  const warehouseSummaryMeta = resolveWarehouseSummaryMeta(
    medExecutionContext?.warehouseSummary,
  );

  return (
    <Card sx={SECTION_CARD_SX}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
          บันทึกการให้ยา/วัคซีน
        </Typography>
        <LocationChip houseCode={selectedHouse} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Plan Suggestions */}
        <PlanSuggestionPanel
          planSuggestions={planSuggestions}
          otherHousePlanSuggestions={otherHousePlanSuggestions}
          planLoading={planLoading}
          onAppendPlan={onAppendPlanToMedRecords}
          onSwitchHouse={onSwitchHouse}
        />

        {/* Form */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 1.25,
          }}
        >
          <TextField
            size="small"
            label="โรงเรือน"
            value={selectedHouse || ''}
            InputProps={{ readOnly: true }}
            sx={FORM_INPUT_SX}
          />

          <FormControl size="small">
            <InputLabel>ยา/วัคซีน</InputLabel>
            <Select
              value={medForm.medName}
              label="ยา/วัคซีน"
              sx={FORM_INPUT_SX}
              onChange={(e) => {
                const selectedName = String(e.target.value);
                const matched = medItemOptions.find(
                  (option) => option.name === selectedName,
                );
                setMedForm((prev) => ({
                  ...prev,
                  medName: selectedName,
                  vaccineItemId:
                    matched &&
                    Number.isFinite(Number(matched.id)) &&
                    Number(matched.id) > 0
                      ? Number(matched.id)
                      : '',
                  warehouseId: '',
                  stockLotId: '',
                  batchAllocations: [],
                }));
              }}
            >
              <MenuItem value="">เลือก</MenuItem>
              {medItemOptions.map((item, idx) => (
                <MenuItem
                  key={`med-opt-${idx}-${item.id ?? ''}-${item.name}`}
                  value={item.name}
                >
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>วิธีให้</InputLabel>
            <Select
              value={medForm.method}
              label="วิธีให้"
              sx={FORM_INPUT_SX}
              onChange={(e) =>
                setMedForm((prev) => ({ ...prev, method: e.target.value }))
              }
            >
              <MenuItem value="">เลือก</MenuItem>
              <MenuItem value="ฉีดเข้ากล้ามเนื้อ">
                ฉีดเข้ากล้ามเนื้อ
              </MenuItem>
              <MenuItem value="ผสมอาหาร">ผสมอาหาร</MenuItem>
              <MenuItem value="ละลายน้ำ">ละลายน้ำ</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 1.25,
          }}
        >
          <TextField
            size="small"
            label="จำนวนสุกรที่ฉีดจริง (ตัว)"
            value={medForm.amount}
            onChange={(e) =>
              setMedForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            InputProps={{ readOnly: medBatchAllocations.length > 0 }}
            inputProps={{ inputMode: 'numeric' }}
            sx={FORM_INPUT_SX}
          />
          <TextField
            size="small"
            label="จำนวนวัคซีนที่ใช้จริง (โดส)"
            value={medForm.dose}
            onChange={(e) =>
              setMedForm((prev) => ({ ...prev, dose: e.target.value }))
            }
            sx={FORM_INPUT_SX}
          />
          <FormControl
            size="small"
            disabled={medWarehouseOptions.length === 0}
          >
            <InputLabel>คลังวัคซีน</InputLabel>
            <Select
              value={medForm.warehouseId}
              label="คลังวัคซีน"
              sx={FORM_INPUT_SX}
              onChange={(e) =>
                setMedForm((prev) => ({
                  ...prev,
                  warehouseId: e.target.value,
                  stockLotId: '',
                }))
              }
            >
              <MenuItem value="">
                <em>เลือกคลัง</em>
              </MenuItem>
              {medWarehouseOptions.map((warehouse) => (
                <MenuItem
                  key={`warehouse-${warehouse.warehouseId}`}
                  value={warehouse.warehouseId}
                >
                  {warehouse.warehouseName} ({warehouse.totalAvailableQuantity}{' '}
                  {warehouse.uomName || 'โดส'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            disabled={
              !medForm.warehouseId || medSelectedWarehouseLots.length === 0
            }
          >
            <InputLabel>Lot (ไม่บังคับ)</InputLabel>
            <Select
              value={medForm.stockLotId}
              label="Lot (ไม่บังคับ)"
              sx={FORM_INPUT_SX}
              onChange={(e) =>
                setMedForm((prev) => ({
                  ...prev,
                  stockLotId: e.target.value,
                }))
              }
            >
              <MenuItem value="">
                <em>ให้ระบบเลือกตามลำดับ lot</em>
              </MenuItem>
              {medSelectedWarehouseLots.map((lot) => (
                <MenuItem key={`lot-${lot.stockLotId}`} value={lot.stockLotId}>
                  {lot.lotNumber || `Lot ${lot.stockLotId}`} (
                  {lot.availableQuantity} {lot.uomName || 'โดส'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField
          size="small"
          label="หมายเหตุ"
          value={medForm.note}
          onChange={(e) =>
            setMedForm((prev) => ({ ...prev, note: e.target.value }))
          }
          sx={FORM_INPUT_SX}
        />

        {/* Batch allocations */}
        {medExecutionLoading && (
          <Typography variant="body2" color="text.secondary">
            กำลังโหลดข้อมูล batch สุกรและ warehouse...
          </Typography>
        )}

        {Number(medForm.vaccineItemId || 0) > 0 && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 10,
              borderColor: UI.border,
              bgcolor: UI.panelSoft,
              boxShadow: UI.shadowSoft,
              p: 1.25,
            }}
          >
            <Stack spacing={1}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Typography sx={{ fontWeight: 700, color: UI.text }}>
                  Batch สุกรและสถานะคลังของรายการนี้
                </Typography>
                <Chip
                  size="small"
                  label={warehouseSummaryMeta.label}
                  sx={{
                    bgcolor: warehouseSummaryMeta.bg,
                    color: warehouseSummaryMeta.color,
                    fontWeight: 700,
                  }}
                />
              </Stack>

              {medExecutionContext && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {medExecutionContext.currentQuantity > 0 && (
                    <Chip
                      size="small"
                      label={`หมูคงเหลือรวม ${medExecutionContext.currentQuantity} ตัว`}
                      sx={{
                        bgcolor: UI.accentSurface,
                        color: UI.accent,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  {medAllocatedHeadcount > 0 && (
                    <Chip
                      size="small"
                      label={`กำลังบันทึก ${medAllocatedHeadcount} ตัว`}
                      sx={{
                        bgcolor: '#fef3f2',
                        color: '#991b1b',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              )}

              {medBatchAllocations.length > 0 ? (
                <Stack spacing={1}>
                  {medBatchAllocations.map((allocation) => (
                    <Paper
                      key={`med-batch-${allocation.pigBatchId}-${allocation.buildingOpeningRequestId}`}
                      variant="outlined"
                      sx={{
                        borderRadius: 10,
                        borderColor: UI.border,
                        p: 1.25,
                        bgcolor: UI.panel,
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1.25}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', md: 'center' }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{ fontWeight: 700, color: UI.text }}
                          >
                            {allocation.batchNo}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {allocation.pigItemName || 'ไม่ระบุรุ่นสุกร'}
                            {allocation.ageDays !== null &&
                            allocation.ageDays !== undefined
                              ? ` · อายุ ${allocation.ageDays} วัน`
                              : ''}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            flexWrap="wrap"
                            sx={{ mt: 0.5 }}
                          >
                            <Chip
                              size="small"
                              label={`คงเหลือ ${allocation.availableQuantity} ตัว`}
                              sx={{
                                bgcolor: UI.panelMuted,
                                color: UI.text,
                                fontWeight: 700,
                              }}
                            />
                          </Stack>
                        </Box>
                        <TextField
                          size="small"
                          type="number"
                          label="ฉีดจริง (ตัว)"
                          value={allocation.allocatedHeadcount}
                          onChange={(e) =>
                            handleBatchAllocationChange(
                              buildBatchAllocationKey(allocation),
                              e.target.value,
                            )
                          }
                          inputProps={{
                            min: 0,
                            max: allocation.availableQuantity,
                            step: 1,
                          }}
                          sx={{ ...FORM_INPUT_SX, width: { xs: '100%', md: 180 } }}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : !medExecutionLoading ? (
                <Alert severity="warning" sx={{ borderRadius: 10, border: `1px solid ${UI.border}` }}>
                  ยังไม่พบข้อมูล batch สุกรของโรงเรือนนี้สำหรับวัคซีนรายการนี้
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        )}

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!medForm.medName}
            onClick={handleAddRecord}
            sx={PRIMARY_ACTION_SX}
          >
            เพิ่มเข้าตาราง
          </Button>
        </Stack>

        {/* Records */}
        <MedRecordTable records={medRecords} onDelete={handleDelete} />
      </Stack>
    </Card>
  );
}
