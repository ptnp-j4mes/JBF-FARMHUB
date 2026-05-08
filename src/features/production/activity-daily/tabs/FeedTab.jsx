import React from 'react';
import {
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
  SECONDARY_ACTION_SX,
  INITIAL_FEED_FORM,
} from '../constants';
import { formatPendingPlanChipLabel } from '../utils';
import LocationChip from '../components/LocationChip';
import FeedRecordTable from '../components/FeedRecordTable';

export default function FeedTab({
  feedForm,
  setFeedForm,
  feedRecords,
  setFeedRecords,
  feedPlanSuggestions,
  feedPlanLoading,
  feedItemOptions,
  farmWarehouseOptions,
  selectedHouse,
  selectedFacility,
  fetchPendingFeedingPlans,
  entryDate,
  nextRowId,
}) {
  const canAdd = feedForm.feedItemId && feedForm.warehouseId;

  const handleAdd = () => {
    if (!canAdd) return;
    setFeedRecords((prev) => [
      ...prev,
      {
        ...feedForm,
        house: selectedHouse,
        id: nextRowId(),
        warehouseIssueStatus: 'READY',
        warehouseIssueMessage: null,
      },
    ]);
    setFeedForm(INITIAL_FEED_FORM);
  };

  const handleDelete = (id) => {
    setFeedRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFetchPlans = () => {
    const facilityId = selectedFacility?.id;
    if (!facilityId) return;
    fetchPendingFeedingPlans({
      date: entryDate,
      facilityId,
      houseCode: selectedHouse,
    });
  };

  const handleAppendPlan = (plan) => {
    const planLineId = Number(plan?.planLineId || 0);
    if (
      planLineId > 0 &&
      feedRecords.some(
        (record) => Number(record.feedingPlanLineId) === planLineId,
      )
    ) {
      return;
    }
    setFeedRecords((prev) => [
      ...prev,
      {
        id: nextRowId(),
        house: selectedHouse,
        feedNo: plan.feedItemCode || '',
        feedItemId: plan.feedItemId > 0 ? plan.feedItemId : '',
        feedItemName: plan.feedItemName || '',
        amount: Number.isFinite(Number(plan.plannedQtyKg))
          ? String(plan.plannedQtyKg)
          : '',
        feedingPlanLineId: planLineId > 0 ? planLineId : null,
        warehouseId: '',
        warehouseName: '',
        stockLotId: '',
        lotNumber: '',
        warehouseIssueStatus: 'NOT_SELECTED',
        warehouseIssueMessage: 'กรุณาเลือกคลังสำหรับตัด stock',
        note: plan.note || '',
      },
    ]);
  };

  return (
    <Card sx={SECTION_CARD_SX}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
          บันทึกการใช้อาหาร
        </Typography>
        <LocationChip houseCode={selectedHouse} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Plan Suggestions */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            disabled={feedPlanLoading}
            onClick={handleFetchPlans}
            startIcon={
              feedPlanLoading ? <CircularProgress size={16} /> : <AddIcon />
            }
            sx={SECONDARY_ACTION_SX}
          >
            ดึงจากแผน
          </Button>
          <Typography variant="caption" color="text.secondary">
            ดึงรายการรอให้อาหารจาก Feeding Plan
          </Typography>
        </Stack>

        {feedPlanSuggestions.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              bgcolor: UI.panel,
              borderColor: UI.border,
              borderRadius: 10,
              boxShadow: UI.shadowSoft,
            }}
          >
            <Typography
              variant="caption"
              sx={{ mb: 0.5, display: 'block' }}
            >
              แผนรอดำเนินการ ({feedPlanSuggestions.length} รายการ):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {feedPlanSuggestions.map((plan) => (
                <Chip
                  key={plan.planLineId}
                  size="small"
                  label={formatPendingPlanChipLabel(plan)}
                  onClick={() => handleAppendPlan(plan)}
                  color="primary"
                  variant="outlined"
                  sx={{ cursor: 'pointer', m: 0.25 }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Form */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
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
            <InputLabel>เบอร์อาหาร</InputLabel>
            <Select
              value={feedForm.feedItemId}
              label="เบอร์อาหาร"
              sx={FORM_INPUT_SX}
              onChange={(e) => {
                const feedItemId = e.target.value;
                const selectedItem = feedItemOptions.find(
                  (item) => item.id === feedItemId,
                );
                setFeedForm((prev) => ({
                  ...prev,
                  feedItemId: feedItemId || '',
                  feedNo: selectedItem?.code || '',
                  feedItemName: selectedItem?.name || '',
                }));
              }}
            >
              <MenuItem value="">เลือก</MenuItem>
              {feedItemOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="ปริมาณ (กก.)"
            value={feedForm.amount}
            onChange={(e) =>
              setFeedForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            inputProps={{ inputMode: 'decimal' }}
            sx={FORM_INPUT_SX}
          />

          <FormControl size="small">
            <InputLabel>คลัง</InputLabel>
            <Select
              value={feedForm.warehouseId}
              label="คลัง"
              sx={FORM_INPUT_SX}
              onChange={(e) => {
                const warehouseId = Number(e.target.value) || '';
                setFeedForm((prev) => ({
                  ...prev,
                  warehouseId,
                  stockLotId: '',
                  lotNumber: '',
                }));
              }}
            >
              <MenuItem value="">เลือกคลัง</MenuItem>
              {farmWarehouseOptions.map((wh) => (
                <MenuItem key={wh.warehouseId} value={wh.warehouseId}>
                  {wh.warehouseName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="หมายเหตุ"
            value={feedForm.note}
            onChange={(e) =>
              setFeedForm((prev) => ({ ...prev, note: e.target.value }))
            }
            sx={{ ...FORM_INPUT_SX, gridColumn: { md: '1 / span 2' } }}
          />
        </Box>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!canAdd}
            onClick={handleAdd}
            sx={PRIMARY_ACTION_SX}
          >
            เพิ่มเข้าตาราง
          </Button>
        </Stack>

        {/* Records */}
        <FeedRecordTable records={feedRecords} onDelete={handleDelete} />
      </Stack>
    </Card>
  );
}
