'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import {
  MENU_GROUPS,
  resolveMenuLabel,
  type MenuGroupConfig,
} from '@/core/config/menu.config';
import { getMenuGroupsCached } from '@/core/config/menu-tree-cache';
import { useI18n } from '@/core/i18n';
import {
  beginNavigationLoading,
  endNavigationLoading,
  shouldSuppressGlobalLoadingForPath,
} from '@/lib/global-loading';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const USERS_NESTED_SEGMENT_LABELS: Record<string, { th: string; en: string }> = {
  role: { th: 'จัดการบทบาท', en: 'Role Management' },
  permission: { th: 'จัดการสิทธิ', en: 'Permission Management' },
  scope: { th: 'จัดการขอบเขต', en: 'Scope Management' },
  roles: { th: 'บทบาท', en: 'Roles' },
  permissions: { th: 'สิทธิ์', en: 'Permissions' },
  'role-based-permissions': {
    th: 'สิทธิ์ตามบทบาท',
    en: 'Role-based Permissions',
  },
  'field-level-control': {
    th: 'สิทธิ์ระดับฟิลด์',
    en: 'Field-level Control',
  },
  'user-permissions': {
    th: 'สิทธิ์รายผู้ใช้',
    en: 'User Permissions',
  },
};

export default function MainBreadcrumb() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [menuGroups, setMenuGroups] = useState<MenuGroupConfig[]>(MENU_GROUPS);

  useEffect(() => {
    let active = true;

    const loadMenuTree = async () => {
      try {
        const groups = await getMenuGroupsCached();
        if (!active) return;
        setMenuGroups(groups);
      } catch {
        if (!active) return;
        setMenuGroups(MENU_GROUPS);
      }
    };

    void loadMenuTree();
    return () => {
      active = false;
    };
  }, []);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const toReadableLabel = (segment: string) =>
      decodeURIComponent(segment)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const getNestedSegmentLabel = (segment: string) => {
      const matched = USERS_NESTED_SEGMENT_LABELS[segment];
      if (!matched) return toReadableLabel(segment);
      return locale === 'th' ? matched.th : matched.en;
    };

    const menuEntries = menuGroups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupId: group.id,
        groupTitleKey: group.titleKey,
      })),
    );

    const activeMenuItem = [...menuEntries]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

    if (activeMenuItem) {
      const nestedSegments = pathname
        .slice(activeMenuItem.path.length)
        .split('/')
        .filter(Boolean);

      return [
        { label: resolveMenuLabel(activeMenuItem.groupTitleKey, t) },
        {
          label: resolveMenuLabel(activeMenuItem.labelKey, t),
          path: activeMenuItem.path,
        },
        ...nestedSegments.map((segment, index) => ({
          label: getNestedSegmentLabel(segment),
          path: `${activeMenuItem.path}/${nestedSegments.slice(0, index + 1).join('/')}`,
        })),
      ];
    }

    const fallbackSegments = pathname.split('/').filter(Boolean);

    if (fallbackSegments.length === 0) {
      return [
        { label: t('layout.menu.groups.operations') },
        { label: t('layout.menu.items.operationsDashboard') },
      ];
    }

    const [firstSegment, ...restSegments] = fallbackSegments;
    const matchedGroup = menuGroups.find((group) => group.id === firstSegment);

    return [
      {
        label: matchedGroup
          ? resolveMenuLabel(matchedGroup.titleKey, t)
          : toReadableLabel(firstSegment),
      },
      ...restSegments.map((segment) => ({
        label: getNestedSegmentLabel(segment),
      })),
    ];
  }, [locale, menuGroups, pathname, t]);

  return (
    <Box
      sx={{
        display: 'block',
        mb: { xs: 1, sm: 1.5, md: 2 },
      }}
    >
      <Breadcrumbs
        separator={<NavigateNext sx={{ fontSize: 14, color: 'text.disabled' }} />}
        aria-label="page navigator"
        sx={{
          minWidth: 0,
          '& .MuiBreadcrumbs-ol': {
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            alignItems: 'center',
            rowGap: 0.4,
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          if (!isLast && item.path) {
            return (
              <Link
                key={`${item.label}-${index}`}
                component="button"
                type="button"
                underline="hover"
                color="text.secondary"
                onClick={() => {
                  if (pathname === item.path) return;
                  if (!shouldSuppressGlobalLoadingForPath(item.path)) {
                    beginNavigationLoading();
                    window.setTimeout(() => endNavigationLoading(), 15000);
                  }
                  router.push(item.path!);
                }}
                sx={{
                  fontSize: { xs: '0.76rem', sm: '0.82rem' },
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <Typography
              key={`${item.label}-${index}`}
              color={isLast ? 'text.primary' : 'text.secondary'}
              sx={{
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                fontWeight: isLast ? 700 : 500,
                maxWidth: { xs: 180, sm: 220, md: 300 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
