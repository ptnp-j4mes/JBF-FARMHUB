/**
 * PageTabs Component — Figma Level-3 Tab Bar pattern
 *
 * Renders a horizontal tab strip that sits between the Header Card and Content Card.
 * Active tab is styled with a blue bottom border underline (per Figma L3 spec).
 *
 * Usage:
 *   <PageTabs
 *     tabs={[
 *       { key: 'open', label: 'เปิดรอบ' },
 *       { key: 'house', label: 'เปิดโรงเรือน' },
 *     ]}
 *     activeKey="open"
 *     onChange={(key) => setActiveTab(key)}
 *   />
 */

'use client';

import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useEffect, useRef, type WheelEvent } from 'react';

export interface PageTab {
  key: string;
  label: string;
  disabled?: boolean;
}

interface PageTabsProps {
  tabs: PageTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function PageTabs({ tabs, activeKey, onChange }: PageTabsProps) {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const isDark = theme.palette.mode === 'dark';
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = tabsContainerRef.current;
    const activeNode = activeTabRef.current;
    if (!container || !activeNode) {
      return;
    }

    const hasHorizontalOverflow = container.scrollWidth > container.clientWidth + 1;
    if (!hasHorizontalOverflow) {
      return;
    }

    activeNode.scrollIntoView({
      behavior: 'auto',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeKey]);

  const handleHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const hasHorizontalOverflow = container.scrollWidth > container.clientWidth + 1;
    if (!hasHorizontalOverflow) {
      return;
    }
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    container.scrollLeft += event.deltaY;
  };

  return (
    <Box
      ref={tabsContainerRef}
      onWheel={handleHorizontalWheel}
      role="tablist"
      aria-label="page tabs"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        px: { xs: 1.5, md: 2 },
        pt: 0,
        pb: 0,
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        overflowX: 'scroll',
        overflowY: 'hidden',
        scrollbarGutter: 'stable both-edges',
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(isDark ? '#9ca3af' : '#64748b', 0.72)} ${alpha(theme.palette.divider, 0.24)}`,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-track': {
          backgroundColor: alpha(theme.palette.divider, 0.24),
          borderRadius: 999,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(isDark ? '#9ca3af' : '#64748b', 0.72),
          borderRadius: 999,
        },
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Box
            key={tab.key}
            ref={(node: HTMLDivElement | null) => {
              if (isActive) {
                activeTabRef.current = node;
              }
            }}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            tabIndex={tab.disabled ? -1 : 0}
            id={`tab-${tab.key}`}
            onClick={() => {
              if (!tab.disabled) onChange(tab.key);
            }}
            onKeyDown={(e) => {
              if (!tab.disabled && (e.key === 'Enter' || e.key === ' ')) {
                onChange(tab.key);
              }
            }}
            sx={{
              position: 'relative',
              px: 2,
              py: 1.25,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              flexShrink: 0,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2.5px',
                borderRadius: '2px 2px 0 0',
                bgcolor: isActive ? PRIMARY : 'transparent',
                transition: 'background-color 180ms ease',
              },
              '&:hover': tab.disabled
                ? {}
                : {
                    bgcolor: alpha(PRIMARY, isDark ? 0.08 : 0.05),
                  },
              transition: 'background-color 150ms ease',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                color: isActive
                  ? PRIMARY
                  : tab.disabled
                    ? 'text.disabled'
                    : (isDark ? 'rgba(255,255,255,0.55)' : 'text.secondary'),
                whiteSpace: 'nowrap',
                transition: 'color 180ms ease',
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
