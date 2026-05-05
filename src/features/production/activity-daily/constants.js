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
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow:
    '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft:
    '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

export const FORM_INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
  },
};

export const FORM_CARD_SX = {
  borderRadius: 2.6,
  borderColor: UI.border,
  bgcolor: '#fff',
  boxShadow: UI.shadowSoft,
};

export const SECTION_CARD_SX = {
  borderRadius: 2.6,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
  p: { xs: 1.5, md: 2 },
};

export const PRIMARY_ACTION_SX = {
  borderRadius: 2,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': { bgcolor: '#10473f' },
};

export const SECONDARY_ACTION_SX = {
  borderRadius: 2,
  boxShadow: UI.shadowSoft,
  bgcolor: '#fff',
};
