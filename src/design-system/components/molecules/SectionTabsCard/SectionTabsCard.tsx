'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type WheelEvent,
} from 'react';
import {
  Box,
  Paper,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ResponsiveStyleValue } from '@mui/system';

export interface SectionTabsCardTab {
  key: string;
  label: string;
  disabled?: boolean;
}

interface SectionTabsCardProps {
  tabs: SectionTabsCardTab[];
  activeKey: string;
  onTabChange: (key: string) => void;
  mutedTextColor: string;
  lineColor: string;
  tabIdleColor: string;
  cardBackground: string;
  activeColor?: string;
  tabsGap?: ResponsiveStyleValue<number | string>;
  wrapperSx?: SxProps<Theme>;
  tabBarSx?: SxProps<Theme>;
  contentBelowTabs?: ReactNode;
  variant?: 'full-width' | 'minimalist';
  leftContent?: ReactNode;
}

type TabViewportMetrics = {
  viewportWidth: number;
  contentWidth: number;
};

const TAB_ROW_HEIGHT_XS = 36;
const TAB_ROW_HEIGHT_MD = 38;
const HORIZONTAL_OVERFLOW_EPSILON = 1;
const TAB_SCROLLBAR_TRACK_HEIGHT = 6;
const TAB_SCROLLBAR_THUMB_WIDTH_RATIO = 0.82;
const TAB_SCROLLBAR_THUMB_MIN_PERCENT = 9;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

export default function SectionTabsCard({
  tabs,
  activeKey,
  onTabChange,
  mutedTextColor,
  lineColor,
  tabIdleColor,
  cardBackground,
  activeColor = '#2563eb',
  tabsGap = { xs: 1.25, md: 3 },
  wrapperSx,
  tabBarSx,
  contentBelowTabs,
  variant = 'full-width',
  leftContent,
}: SectionTabsCardProps) {
  const tabsViewportRef = useRef<HTMLDivElement | null>(null);
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);
  const wheelRafRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const [metrics, setMetrics] = useState<TabViewportMetrics>({
    viewportWidth: 0,
    contentWidth: 0,
  });
  const [scrollOffset, setScrollOffset] = useState(0);
  const tabBarExtraSx = Array.isArray(tabBarSx) ? tabBarSx : tabBarSx ? [tabBarSx] : [];
  const hasTabs = tabs.length > 0;

  const maxScrollOffset = useMemo(
    () => Math.max(0, metrics.contentWidth - metrics.viewportWidth),
    [metrics.contentWidth, metrics.viewportWidth],
  );
  const hasHorizontalOverflow = maxScrollOffset > HORIZONTAL_OVERFLOW_EPSILON;
  const effectiveMaxScrollOffset = hasHorizontalOverflow ? maxScrollOffset : 0;
  const effectiveTabIdleColor = tabIdleColor || mutedTextColor;
  const activeTabIndex = useMemo(() => {
    const exactIndex = tabs.findIndex((tab) => tab.key === activeKey);
    if (exactIndex >= 0) {
      return exactIndex;
    }

    return tabs.findIndex((tab) => !tab.disabled);
  }, [activeKey, tabs]);

  const updateMetrics = useCallback(() => {
    const viewport = tabsViewportRef.current;
    const track = tabsTrackRef.current;
    if (!viewport || !track) {
      setMetrics({ viewportWidth: 0, contentWidth: 0 });
      setScrollOffset(0);
      return;
    }

    const viewportWidth = viewport.clientWidth;
    const contentWidth = track.scrollWidth;
    const nextMax = Math.max(0, contentWidth - viewportWidth);

    setMetrics((prev) => {
      if (
        prev.viewportWidth === viewportWidth &&
        prev.contentWidth === contentWidth
      ) {
        return prev;
      }
      return { viewportWidth, contentWidth };
    });

    setScrollOffset((prev) => clamp(prev, 0, nextMax));
  }, []);

  useEffect(() => {
    updateMetrics();

    const viewport = tabsViewportRef.current;
    const track = tabsTrackRef.current;
    if (!viewport || !track) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    window.addEventListener('resize', updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [tabs.length, updateMetrics]);

  useEffect(() => {
    const activeNode = activeTabRef.current;
    if (!activeNode || !hasHorizontalOverflow || effectiveMaxScrollOffset <= 0) {
      return;
    }

    const viewportWidth = tabsViewportRef.current?.clientWidth ?? 0;
    if (viewportWidth <= 0) {
      return;
    }

    const activeLeft = activeNode.offsetLeft;
    const activeRight = activeLeft + activeNode.offsetWidth;
    const horizontalPadding = 12;

    setScrollOffset((prev) => {
      let next = prev;

      if (activeLeft < prev + horizontalPadding) {
        next = activeLeft - horizontalPadding;
      } else if (activeRight > prev + viewportWidth - horizontalPadding) {
        next = activeRight - viewportWidth + horizontalPadding;
      }

      return clamp(next, 0, effectiveMaxScrollOffset);
    });
  }, [activeKey, effectiveMaxScrollOffset, hasHorizontalOverflow]);

  const scrollByDelta = useCallback(
    (delta: number) => {
      if (effectiveMaxScrollOffset <= 0 || delta === 0) {
        return;
      }
      setScrollOffset((prev) => clamp(prev + delta, 0, effectiveMaxScrollOffset));
    },
    [effectiveMaxScrollOffset],
  );

  const flushWheelDelta = useCallback(() => {
    const delta = wheelDeltaRef.current;
    wheelDeltaRef.current = 0;
    wheelRafRef.current = null;

    if (delta === 0) {
      return;
    }

    scrollByDelta(delta);
  }, [scrollByDelta]);

  useEffect(() => {
    return () => {
      if (wheelRafRef.current !== null) {
        window.cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
    };
  }, []);

  const findAdjacentEnabledIndex = useCallback(
    (startIndex: number, direction: -1 | 1) => {
      let index = startIndex + direction;
      while (index >= 0 && index < tabs.length) {
        if (!tabs[index]?.disabled) {
          return index;
        }
        index += direction;
      }
      return -1;
    },
    [tabs],
  );

  const prevTabIndex = useMemo(() => {
    if (activeTabIndex < 0) return -1;
    return findAdjacentEnabledIndex(activeTabIndex, -1);
  }, [activeTabIndex, findAdjacentEnabledIndex]);

  const nextTabIndex = useMemo(() => {
    if (activeTabIndex < 0) return -1;
    return findAdjacentEnabledIndex(activeTabIndex, 1);
  }, [activeTabIndex, findAdjacentEnabledIndex]);

  const navigateToDirection = useCallback(
    (direction: -1 | 1): boolean => {
      const targetIndex = direction === -1 ? prevTabIndex : nextTabIndex;
      if (targetIndex < 0) {
        return false;
      }

      const targetTab = tabs[targetIndex];
      if (!targetTab || targetTab.disabled) {
        return false;
      }

      onTabChange(targetTab.key);
      return true;
    },
    [nextTabIndex, onTabChange, prevTabIndex, tabs],
  );

  const handleArrowShortcut = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowLeft') {
        const navigated = navigateToDirection(-1);
        if (navigated) {
          event.preventDefault();
          return true;
        }
        return false;
      }

      if (event.key === 'ArrowRight') {
        const navigated = navigateToDirection(1);
        if (navigated) {
          event.preventDefault();
          return true;
        }
        return false;
      }

      return false;
    },
    [navigateToDirection],
  );

  useEffect(() => {
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === 'ArrowLeft') {
        if (navigateToDirection(-1)) {
          event.preventDefault();
        }
      } else if (event.key === 'ArrowRight') {
        if (navigateToDirection(1)) {
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown);
    };
  }, [navigateToDirection]);

  const handleHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!hasHorizontalOverflow) {
      return;
    }

    const horizontalDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (horizontalDelta === 0) {
      return;
    }

    event.preventDefault();
    wheelDeltaRef.current += horizontalDelta;
    if (wheelRafRef.current === null) {
      wheelRafRef.current = window.requestAnimationFrame(flushWheelDelta);
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    key: string,
    disabled?: boolean,
  ) => {
    if (handleArrowShortcut(event)) return;
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTabChange(key);
    }
  };

  const thumbWidthPercent = useMemo(() => {
    if (!hasHorizontalOverflow || metrics.contentWidth <= 0) {
      return 100;
    }

    const widthPercent =
      (metrics.viewportWidth / metrics.contentWidth) * 100 * TAB_SCROLLBAR_THUMB_WIDTH_RATIO;
    return clamp(widthPercent, TAB_SCROLLBAR_THUMB_MIN_PERCENT, 100);
  }, [hasHorizontalOverflow, metrics.contentWidth, metrics.viewportWidth]);

  const thumbLeftPercent = useMemo(() => {
    if (!hasHorizontalOverflow || effectiveMaxScrollOffset <= 0) {
      return 0;
    }

    const normalized = scrollOffset / effectiveMaxScrollOffset;
    return normalized * (100 - thumbWidthPercent);
  }, [effectiveMaxScrollOffset, hasHorizontalOverflow, scrollOffset, thumbWidthPercent]);

  const handleScrollbarTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasHorizontalOverflow) {
      return;
    }

    const trackRect = event.currentTarget.getBoundingClientRect();
    if (trackRect.width <= 0) {
      return;
    }

    const relativeClickX = clamp(event.clientX - trackRect.left, 0, trackRect.width);
    const clickRatio = relativeClickX / trackRect.width;
    setScrollOffset(clamp(clickRatio * effectiveMaxScrollOffset, 0, effectiveMaxScrollOffset));
  };

  const renderTabsList = () => (
    <Box
      ref={tabsViewportRef}
      onWheel={handleHorizontalWheel}
      tabIndex={0}
      onKeyDown={(event) => {
        void handleArrowShortcut(event);
      }}
      aria-label="แถบแท็บ"
      sx={{
        width: '100%',
        overflow: 'hidden',
        touchAction: 'pan-y',
        outline: 'none',
      }}
    >
      <Box
        ref={tabsTrackRef}
        sx={{
          display: 'inline-flex',
          gap: tabsGap,
          alignItems: 'center',
          transform: `translate3d(-${scrollOffset}px, 0, 0)`,
          willChange: hasHorizontalOverflow ? 'transform' : 'auto',
          minWidth: 'max-content',
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
              role="button"
              tabIndex={tab.disabled ? -1 : 0}
              onClick={() => {
                if (!tab.disabled) {
                  onTabChange(tab.key);
                }
              }}
              onKeyDown={(event) => handleTabKeyDown(event, tab.key, tab.disabled)}
              sx={{
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.45 : 1,
                position: 'relative',
                px: 0.5,
                pt: 1,
                pb: variant === 'minimalist' ? 1.25 : 0.25,
                whiteSpace: 'nowrap',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom:  variant === 'minimalist' ? 0 : 0,
                  height: isActive ? (variant === 'minimalist' ? 2 : 2.5) : 0,
                  bgcolor: isActive ? activeColor : 'transparent',
                  borderRadius: 10,
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '11px', md: '12.5px' },
                  fontWeight: 700,
                  lineHeight: '14px',
                  letterSpacing: '0.35px',
                  textTransform: 'none',
                  color: isActive ? activeColor : effectiveTabIdleColor,
                  transition: 'color 0.2s ease-in-out',
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const renderLeftOnly = () => (
    <Box
      sx={[
        {
          minHeight: { xs: TAB_ROW_HEIGHT_XS, md: TAB_ROW_HEIGHT_MD },
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        },
        ...tabBarExtraSx,
      ]}
    >
      {leftContent && (
        <Box sx={{ pr: 2, mr: 1, my: 0.5, borderRight: `1px solid ${lineColor}`, display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
          {leftContent}
        </Box>
      )}
    </Box>
  );

  if (variant === 'minimalist') {
    if (!hasTabs) {
      return (
        <Box sx={wrapperSx}>
          {renderLeftOnly()}
        </Box>
      );
    }

    return (
      <Box sx={wrapperSx}>
        <Box
          sx={[
            {
              minHeight: { xs: TAB_ROW_HEIGHT_XS, md: TAB_ROW_HEIGHT_MD },
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${alpha(lineColor, 0.5)}`,
              mb: 0,
            },
            ...tabBarExtraSx,
          ]}
        >
          {leftContent && (
            <Box sx={{ pr: 2, mr: 2, display: 'flex', alignItems: 'center' }}>
              {leftContent}
            </Box>
          )}
          {renderTabsList()}
        </Box>
      </Box>
    );
  }

  if (!hasTabs) {
    return (
      <Box sx={wrapperSx}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 10,
            border: `1px solid ${lineColor}`,
            borderBottom: `1px solid ${lineColor}`,
            bgcolor: cardBackground,
            overflow: 'hidden',
          }}
        >
          {renderLeftOnly()}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={wrapperSx}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 10,
          border: `1px solid ${lineColor}`,
          borderBottom: `1px solid ${lineColor}`,
          bgcolor: cardBackground,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={[
            {
              px: { xs: 1, md: 3.25 },
              minHeight: { xs: TAB_ROW_HEIGHT_XS, md: TAB_ROW_HEIGHT_MD },
              height: { xs: TAB_ROW_HEIGHT_XS, md: TAB_ROW_HEIGHT_MD },
              maxHeight: { xs: TAB_ROW_HEIGHT_XS, md: TAB_ROW_HEIGHT_MD },
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            },
            ...tabBarExtraSx,
          ]}
        >
          {leftContent && (
            <Box sx={{ pr: 2, mr: 1, my: 0.5, borderRight: `1px solid ${lineColor}`, display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
              {leftContent}
            </Box>
          )}
          {renderTabsList()}
        </Box>

        <Box
          sx={{
            px: { xs: 1, md: 3.25 },
            pt: 0.08,
            pb: 0.2,
          }}
        >
          <Box
            role={hasHorizontalOverflow ? 'scrollbar' : 'presentation'}
            aria-label={hasHorizontalOverflow ? 'tab scrollbar' : undefined}
            aria-orientation={hasHorizontalOverflow ? 'horizontal' : undefined}
            onClick={hasHorizontalOverflow ? handleScrollbarTrackClick : undefined}
            sx={{
              position: 'relative',
              width: { xs: '94%', md: '90%' },
              mx: 'auto',
              height: TAB_SCROLLBAR_TRACK_HEIGHT,
              borderRadius: 10,
              bgcolor: alpha(lineColor, 0.28),
              cursor: hasHorizontalOverflow ? 'pointer' : 'default',
            }}
          >
            {hasHorizontalOverflow ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${thumbLeftPercent}%`,
                  width: `${thumbWidthPercent}%`,
                  borderRadius: 10,
                  bgcolor: alpha(tabIdleColor, 0.78),
                }}
              />
            ) : null}
          </Box>
        </Box>

        {contentBelowTabs}
      </Paper>
    </Box>
  );
}
