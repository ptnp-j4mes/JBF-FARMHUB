import type { SxProps, Theme } from '@mui/material/styles';

const MASTER_FIELDSET_BORDER_COLOR = '#8a9aac';

export const MASTER_PROGRAM_SHELL_FIELDSET_SX: SxProps<Theme> = {
  m: 0,
  border: '1px solid',
  borderColor: MASTER_FIELDSET_BORDER_COLOR,
  borderRadius: 10,
  p: 0,
  minWidth: 0,
  overflow: 'hidden',
};

export const MASTER_PROGRAM_HEADER_BAR_SX: SxProps<Theme> = {
  height: 56,
  bgcolor: '#2166D1',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: { xs: '1.2rem', md: '1.5rem' },
  fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.25)',
};

export const MASTER_PROGRAM_CONTENT_SX: SxProps<Theme> = {
  px: { xs: 1.25, md: 2 },
  pt: 1.5,
  pb: 1.5,
};

export const BLOCK_LAYOUT_TWO_COLUMN_SX: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 320px' },
  gap: 1.5,
  alignItems: 'stretch',
};

export const BLOCK_FIELDSET_SX: SxProps<Theme> = {
  m: 0,
  borderRadius: 10,
  px: { xs: 1.25, md: 2 },
  pt: 1.5,
  pb: 1.5,
  minWidth: 0,
};

export const BLOCK_FIELDSET_LEGEND_SX: SxProps<Theme> = {
  px: 1,
  fontSize: '1rem',
  fontWeight: 700,
};

export const BLOCK_ACTION_FIELDSET_SX: SxProps<Theme> = {
  ...BLOCK_FIELDSET_SX,
  px: 1.5,
  display: 'flex',
  flexDirection: { xs: 'row', lg: 'column' },
  alignItems: 'stretch',
  gap: 1,
};

export const BLOCK_REFRESH_BUTTON_SX: SxProps<Theme> = {
  borderColor: '#90CAF9',
  bgcolor: '#E3F2FD',
  color: '#0D47A1',
  '&:hover': {
    borderColor: '#64B5F6',
    bgcolor: '#BBDEFB',
  },
};

export const BLOCK_TABLE_FIELDSET_SX: SxProps<Theme> = {
  ...BLOCK_FIELDSET_SX,
  mb: 2,
};

export const BLOCK_TABLE_FIELDSET_ALIGNED_SX: SxProps<Theme> = {
  ...BLOCK_TABLE_FIELDSET_SX,
  // mx: { xs: 1.5, md: 2 },
  px: 1.5,
};

export const BLOCK_TABLE_PAPER_SX: SxProps<Theme> = {
  borderRadius: 10,
  border: '1px solid',
  borderColor: MASTER_FIELDSET_BORDER_COLOR,
  boxShadow: 'none',
};
