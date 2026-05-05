export const PR_MAIN_TABLE_HEIGHT = 500;
export const PR_MAIN_TABLE_BOTTOM_PADDING = 20;
export const PR_DIALOG_TABLE_HEIGHT = 300;

export const MASTER_DIALOG_TITLE_SX = {
  textAlign: 'center',
  bgcolor: '#2166D1',
  color: '#fff',
  borderBottom: '1px solid rgba(255,255,255,0.25)',
  '& .MuiIconButton-root': {
    color: '#fff',
  },
} as const;

export const MASTER_DIALOG_FORM_SX = {
  '& .MuiTextField-root .MuiOutlinedInput-root': {
    minHeight: 36,
  },
  '& .MuiTextField-root .MuiOutlinedInput-input': {
    py: '8px',
  },
  '& .MuiTextField-root .MuiOutlinedInput-root.MuiInputBase-multiline': {
    minHeight: 74,
  },
} as const;

export const MASTER_FIELDSET_SX = {
  bgcolor: '#fff',
} as const;
