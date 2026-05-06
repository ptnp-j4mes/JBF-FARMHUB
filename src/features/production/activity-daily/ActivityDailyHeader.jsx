import { Stack, Typography } from '@mui/material';
import { UI } from './constants';
import { WorkspaceHeader } from '@/design-system';

export default function ActivityDailyHeader({
  entryStatus,
  hydrating,
}) {
  return (
    <WorkspaceHeader
      chipLabel="Daily Activity"
      title="บันทึกข้อมูลประจำวัน"
      subtitle=""
      rightContent={
        <Stack spacing={0.25} sx={{ alignItems: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            สถานะเอกสาร: {entryStatus}
          </Typography>
          {hydrating ? (
            <Typography variant="caption" color="text.secondary">
              กำลังโหลดข้อมูลเดิม...
            </Typography>
          ) : null}
        </Stack>
      }
      sx={{
        borderColor: UI.border,
        bgcolor: UI.panel,
        boxShadow: UI.shadowSoft,
        gap: 1.1,
      }}
    />
  );
}
