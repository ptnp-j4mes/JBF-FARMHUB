'use client';

import { Box, alpha, type SxProps, type Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';
import { BreadcrumbTrail, SectionTabsCard } from '@/components/common';

export const USER_ASSIGNMENT_SECTION_TABS = [
  {
    key: 'assignment',
    label: 'กำหนดสิทธิ',
  },
  {
    key: 'user',
    label: 'ผู้ใช้',
  },
  {
    key: 'organization',
    label: 'องค์กร',
  },
  {
    key: 'role',
    label: 'บทบาท',
  },
  {
    key: 'permission-pool',
    label: 'คลังสิทธิ',
  },
] as const;

interface UserAssignmentSectionLayoutProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  activeKey?: string;
  onTabChange?: (key: string) => void;
}

export default function UserAssignmentSectionLayout({
  children,
  sx,
  activeKey: controlledActiveKey,
  onTabChange: controlledOnTabChange,
}: UserAssignmentSectionLayoutProps) {
  const theme = useTheme();

  const activeTab = useMemo(() => {
    if (controlledActiveKey) {
      return USER_ASSIGNMENT_SECTION_TABS.find(t => t.key === controlledActiveKey) ?? USER_ASSIGNMENT_SECTION_TABS[0];
    }
    return USER_ASSIGNMENT_SECTION_TABS[0];
  }, [controlledActiveKey]);

  const colors = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? {
            cardBg: '#0b1838',
            mutedText: '#94a3b8',
            line: alpha('#94a3b8', 0.24),
            tabIdle: '#94a3b8',
          }
        : {
            cardBg: '#ffffff',
            mutedText: '#9ca3af',
            line: '#e2e8f0',
            tabIdle: '#9ca3af',
          },
    [theme.palette.mode],
  );

  const breadcrumbs = useMemo(
    () => ['ดูแลระบบ', 'จัดการผู้ใช้', activeTab.label],
    [activeTab.label],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, md: 2.5 },
        flex: 1,
        minHeight: 0,
        maxWidth: 1280,
        width: '100%',
        mx: 'auto',
        ...sx,
      }}
    >
      <Box>
        <BreadcrumbTrail items={breadcrumbs} mutedTextColor={colors.mutedText} />
        <SectionTabsCard
          tabs={USER_ASSIGNMENT_SECTION_TABS.map((tab) => ({
            key: tab.key,
            label: tab.label,
          }))}
          activeKey={activeTab.key}
          onTabChange={(key) => {
            if (controlledOnTabChange) {
              controlledOnTabChange(key);
              return;
            }
          }}
          mutedTextColor={colors.mutedText}
          lineColor={colors.line}
          tabIdleColor={colors.tabIdle}
          cardBackground={colors.cardBg}
          tabsGap={{ xs: 1.25, md: 3 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
