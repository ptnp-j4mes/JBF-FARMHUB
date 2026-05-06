import React from 'react';
import {
  MonitorHeart as HealthIcon,
  WarningAmber as AlertTriangle,
  LocalCafe as FeedIcon,
  Home as HomeIcon,
  Medication as MedIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';

export const TABS = [
  { id: 'overview', label: 'ภาพรวม & แวดล้อม', icon: <HomeIcon /> },
  { id: 'health', label: 'สุขภาพสุกร', icon: <HealthIcon /> },
  { id: 'mortality', label: 'ตาย/คัดทิ้ง', icon: <AlertTriangle /> },
  { id: 'feed', label: 'อาหาร', icon: <FeedIcon /> },
  { id: 'meds', label: 'ยา/วัคซีน', icon: <MedIcon /> },
  { id: 'media', label: 'แนบไฟล์', icon: <AttachFileIcon /> },
];

export const TAB_IDS = new Set(TABS.map((tab) => tab.id));

export const INITIAL_FEED_FORM = {
  feedNo: '',
  feedItemId: '',
  feedItemName: '',
  amount: '',
  note: '',
  feedingPlanLineId: '',
  warehouseId: '',
  warehouseName: '',
  stockLotId: '',
  lotNumber: '',
};

export const INITIAL_MED_FORM = {
  medName: '',
  vaccineItemId: '',
  method: '',
  amount: '',
  dose: '',
  warehouseId: '',
  stockLotId: '',
  batchAllocations: [],
  note: '',
};

export const INITIAL_MORTALITY_FORM = {
  type: 'ตาย',
  reason: '',
  deathDay: '',
  stall: '',
  amount: 1,
  weight: '',
  hasImage: false,
  imageName: '',
  imageUrl: '',
  imageStorageUrl: '',
  imageFileKey: '',
};

export const STATIC_MED_OPTIONS = [
  { id: '', name: 'Amoxicillin' },
  { id: '', name: 'วัคซีนอหิวาต์' },
];

export const UI = {
  bg: '#f5f7f6',
  panel: '#ffffff',
  panelSoft: '#f7f9f8',
  panelMuted: '#eef3ef',
  border: 'rgba(148, 163, 184, 0.34)',
  borderStrong: 'rgba(100, 116, 139, 0.42)',
  text: '#1f2937',
  muted: '#6b7280',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow:
    '0 18px 40px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05)',
  shadowSoft:
    '0 10px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
};

export const FORM_INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.25,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: UI.border,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: UI.borderStrong,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: UI.accent,
    },
  },
};

export const FORM_CARD_SX = {
  borderRadius: 3,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
};

export const SECTION_CARD_SX = {
  borderRadius: 3,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
  p: { xs: 1.5, md: 2 },
};

export const PRIMARY_ACTION_SX = {
  minHeight: 40,
  borderRadius: 2.25,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': { bgcolor: '#10473f' },
};

export const SECONDARY_ACTION_SX = {
  minHeight: 40,
  borderRadius: 2.25,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.panel,
};
