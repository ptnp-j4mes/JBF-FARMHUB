'use client';

import {
  Avatar,
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AppsOutlined,
  PrecisionManufacturingOutlined,
  BarChartOutlined,
  AdminPanelSettingsOutlined,
  CategoryOutlined,
  DashboardOutlined,
  FolderOutlined,
} from '@mui/icons-material';
import { resolveMenuIcon } from '@/lib/utils/menu-icons';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTheme } from '@mui/material/styles';
import { authService, User } from '@/features/auth/services/auth.service';
import {
  beginNavigationLoading,
  endNavigationLoading,
} from '@/lib/global-loading';
import AccessContextSwitchDialog from '@/features/auth/components/AccessContextSwitchDialog';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
  getUserFarmScopeNodes,
} from '@/lib/facility-context';
import {
  ACCESS_CONTEXT_CHANGED_EVENT,
  isAccessContextApplicable,
  readCurrentAccessContext,
} from '@/lib/access-context';
import { canAccessMenu } from '@/lib/access/guard/menu.guard';
import {
  isMenuItemActivePath,
  MENU_GROUPS,
  resolveMenuLabel,
  type MenuGroupConfig,
} from '@/core/config/menu.config';
import { getMenuGroupsCached } from '@/core/config/menu-tree-cache';
import { useI18n } from '@/core/i18n';
import {
  createSidemenuMasterTheme,
  SIDEMENU_LAYOUT_CONSTANTS,
  SIDEMENU_SPACING_CONSTANTS,
  SIDEMENU_TRANSITION_CONSTANTS,
} from '@/core/theme/sidemenu-master-theme';

const APP_BAR_HEIGHT = SIDEMENU_LAYOUT_CONSTANTS.headerHeight;

function getCompactFarmDisplayName(
  farmName: string | null,
  farmCode: string | null,
): string {
  const source = (farmName ?? farmCode ?? '-').trim();
  if (!source || source === '-') return '-';

  const branchIndex = source.indexOf('สาขา');
  let compact = source;
  if (branchIndex >= 0) {
    const afterBranch = source
      .slice(branchIndex + 'สาขา'.length)
      .replace(/^[\s:：\-–—]+/, '')
      .trim();
    if (afterBranch) compact = afterBranch;
  }

  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact;
}

function getUserInitial(user: User | null): string {
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const source = fullName || user?.username?.trim() || 'U';
  return source.charAt(0).toUpperCase();
}

// (resolveMenuIcon is now imported from @/lib/utils/menu-icons)

function resolveGroupIcon(groupId: string, label: string): ReactNode {
  const normalizedId = groupId.toLowerCase();
  const normalizedLabel = label.toLowerCase();

  if (
    normalizedId.includes('operation') ||
    normalizedLabel.includes('dashboard') ||
    normalizedLabel.includes('แดชบอร์ด')
  ) {
    return <DashboardOutlined sx={{ fontSize: 18 }} />;
  }
  if (
    normalizedId.includes('production') ||
    normalizedLabel.includes('การผลิต') ||
    normalizedLabel.includes('คลัง')
  ) {
    return <PrecisionManufacturingOutlined sx={{ fontSize: 18 }} />;
  }
  if (normalizedId.includes('report') || normalizedLabel.includes('รายงาน')) {
    return <BarChartOutlined sx={{ fontSize: 18 }} />;
  }
  if (normalizedId.includes('admin') || normalizedLabel.includes('ผู้ดูแล')) {
    return <AdminPanelSettingsOutlined sx={{ fontSize: 18 }} />;
  }
  if (normalizedId.includes('app') || normalizedLabel.includes('แอป')) {
    return <AppsOutlined sx={{ fontSize: 18 }} />;
  }
  if (
    normalizedId.includes('master') ||
    normalizedLabel.includes('ข้อมูลหลัก')
  ) {
    return <CategoryOutlined sx={{ fontSize: 18 }} />;
  }
  return <FolderOutlined sx={{ fontSize: 18 }} />;
}

interface SideMenuProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}

export default function SideMenu({
  onClose,
  collapsed = false,
  onToggleCollapse: _onToggleCollapse,
  mobile = false,
}: SideMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();
  const sidemenuTokens = useMemo(
    () => createSidemenuMasterTheme(theme.palette.mode),
    [theme.palette.mode],
  );
  const UI = useMemo(
    () => ({
      panel: sidemenuTokens.colors.background.surface,
      panelSoft: sidemenuTokens.colors.background.surfaceMuted,
      panelGlass: sidemenuTokens.glass.raw.backgroundColor,
      border: sidemenuTokens.colors.border,
      borderSoft: sidemenuTokens.colors.primary.soft,
      borderMuted: sidemenuTokens.colors.border,
      text: sidemenuTokens.colors.text.primary,
      muted: sidemenuTokens.colors.text.secondary,
      accent: sidemenuTokens.colors.primary.main,
      accentSoft: sidemenuTokens.colors.primary.soft,
      accentRing: sidemenuTokens.colors.accentRing,
      shadow: sidemenuTokens.shadow.card,
      shadowSoft: sidemenuTokens.shadow.soft,
      shadowTiny: sidemenuTokens.shadow.tiny,
    }),
    [sidemenuTokens],
  );
  const sidebarHeaderPaddingX = mobile
    ? SIDEMENU_SPACING_CONSTANTS.headerPaddingX.mobile
    : SIDEMENU_SPACING_CONSTANTS.headerPaddingX.desktop;
  const sidebarContentMarginTop = collapsed
    ? SIDEMENU_SPACING_CONSTANTS.contentTopMargin.collapsed
    : SIDEMENU_SPACING_CONSTANTS.contentTopMargin.expanded;
  const sidebarContentPaddingX = collapsed
    ? SIDEMENU_SPACING_CONSTANTS.contentHorizontalPadding.collapsed
    : SIDEMENU_SPACING_CONSTANTS.contentHorizontalPadding.expanded;
  const sidebarFooterPaddingX = collapsed
    ? SIDEMENU_SPACING_CONSTANTS.footerPaddingX.collapsed
    : mobile
      ? SIDEMENU_SPACING_CONSTANTS.footerPaddingX.mobile
      : SIDEMENU_SPACING_CONSTANTS.footerPaddingX.expanded;
  const sectionMenuButtonBaseSx = {
    ...sidemenuTokens.menu.group.default,
    justifyContent: collapsed ? 'center' : 'flex-start',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      ...sidemenuTokens.menu.group.hover,
    },
  } as const;

  const sectionMenuButtonActiveSx = {
    ...sidemenuTokens.menu.group.active,
    '&:hover': {
      ...sidemenuTokens.menu.group.active,
    },
  } as const;

  const sectionMenuButtonAccentBarSx = {
    ...sidemenuTokens.menu.group.accentBar,
  } as const;

  const sectionMenuButtonChevronSx = {
    fontSize: 16,
    transition: SIDEMENU_TRANSITION_CONSTANTS.chevron,
  } as const;

  const [user, setUser] = useState<User | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroupConfig[]>(MENU_GROUPS);
  const [mounted, setMounted] = useState(false);
  const [activeFarmCode, setActiveFarmCode] = useState<string | null>(null);
  const [activeFarmName, setActiveFarmName] = useState<string | null>(null);
  const [activeContextRole, setActiveContextRole] = useState<string | null>(
    null,
  );
  const [activeContextScope, setActiveContextScope] = useState<string | null>(
    null,
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [accessContextRevision, setAccessContextRevision] = useState(0);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);

  const resolveActiveFarmCode = (currentUser: User | null): void => {
    const currentFacilityId = getCurrentFacilityId();
    if (!currentFacilityId) {
      setActiveFarmCode(null);
      setActiveFarmName(null);
      return;
    }

    const scopedFarm = getUserFarmScopeNodes(currentUser).find(
      (farm) => farm.facilityNodeId === currentFacilityId,
    );

    const storedCode = getCurrentFacilityCode();
    if (storedCode) {
      setActiveFarmCode(storedCode);
      setActiveFarmName(scopedFarm?.facilityName ?? null);
      return;
    }

    setActiveFarmCode(scopedFarm?.facilityCode ?? null);
    setActiveFarmName(scopedFarm?.facilityName ?? null);
  };

  const resolveActiveContextDisplay = (currentUser: User | null): void => {
    const selectedAccess = readCurrentAccessContext();
    if (
      selectedAccess &&
      isAccessContextApplicable(selectedAccess, currentUser)
    ) {
      setActiveContextRole(selectedAccess.roleName);
      const scopeText =
        selectedAccess.scopeCode?.trim() ||
        selectedAccess.scopeLabel?.trim() ||
        '-';
      setActiveContextScope(scopeText);
      return;
    }

    setActiveContextRole(null);
    setActiveContextScope(null);
  };

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
      } finally {
        if (!active) return;
        setMounted(true);
        const currentUser = authService.getUser();
        setUser(currentUser);
        resolveActiveFarmCode(currentUser);
        resolveActiveContextDisplay(currentUser);
      }
    };

    void loadMenuTree();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const reloadContextHeader = () => {
      const currentUser = authService.getUser();
      resolveActiveFarmCode(currentUser);
      resolveActiveContextDisplay(currentUser);
      setAccessContextRevision((previous) => previous + 1);
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, reloadContextHeader);
    window.addEventListener(ACCESS_CONTEXT_CHANGED_EVENT, reloadContextHeader);
    return () => {
      window.removeEventListener(FACILITY_CHANGED_EVENT, reloadContextHeader);
      window.removeEventListener(
        ACCESS_CONTEXT_CHANGED_EVENT,
        reloadContextHeader,
      );
    };
  }, []);

  const normalizedUserRoleCodes = useMemo(
    () => new Set((user?.roleCodes ?? []).map((code) => code.toLowerCase())),
    [user?.roleCodes],
  );
  const normalizedUserRoles = useMemo(
    () => new Set((user?.roles ?? []).map((role) => role.toLowerCase())),
    [user?.roles],
  );
  const isAdminRole = useMemo(() => {
    return normalizedUserRoleCodes.has('super_admin') ||
           normalizedUserRoleCodes.has('adm') ||
           normalizedUserRoleCodes.has('admin') ||
           normalizedUserRoles.has('admin') ||
           normalizedUserRoles.has('ผู้ดูแลระบบ');
  }, [normalizedUserRoleCodes, normalizedUserRoles]);
  const activeFarmDisplayName = useMemo(
    () => getCompactFarmDisplayName(activeFarmName, activeFarmCode),
    [activeFarmCode, activeFarmName],
  );

  const filteredGroups = useMemo(() => {
    void accessContextRevision;

    return menuGroups
      .filter((group) => {
        if (isAdminRole) return true;
        if (!group.roles || group.roles.length === 0) return true;
        if (!user || !user.roles) return false;
        return group.roles.some((role) =>
          normalizedUserRoleCodes.has(role.toLowerCase()) ||
          new Set((user?.roles ?? []).map(r => r.toLowerCase())).has(role.toLowerCase())
        );
      })
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Hide redundant Stock Booking menu after merging into PR
          if (item.permissionModule === 'warehouse.stock_booking' ||
              item.path?.includes('warehouse/stock-booking')) {
            return false;
          }

          if (isAdminRole) return true;
          return canAccessMenu(item.path, {
            requiredPermissionCodes: item.requiredPermissionCodes,
          });
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [
    menuGroups,
    user,
    normalizedUserRoleCodes,
    normalizedUserRoles,
    isAdminRole,
    accessContextRevision,
  ]);

  useEffect(() => {
    if (filteredGroups.length === 0) {
      setExpandedGroups((previous) =>
        Object.keys(previous).length === 0 ? previous : {},
      );
      return;
    }

    setExpandedGroups((previous) => {
      const next: Record<string, boolean> = {};
      const activeGroupId =
        filteredGroups.find((group) =>
          group.items.some((item) => isMenuItemActivePath(pathname, item.path, item.activePathPrefix)),
        )?.id ?? null;

      filteredGroups.forEach((group) => {
        next[group.id] = activeGroupId === group.id;
      });

      const prevKeys = Object.keys(previous);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => previous[key] === next[key])
      ) {
        return previous;
      }

      return next;
    });
  }, [filteredGroups, pathname]);

  if (!mounted) return null;

  const handleSwitchContext = () => {
    setIsContextDialogOpen(true);
  };

  const handleContextApplied = () => {
    router.refresh();
    if (mobile && onClose) {
      onClose();
    }
  };

  const renderSectionButton = (params: {
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
    chevronDirection: 'up' | 'down';
    ariaExpanded?: boolean;
    ariaControls?: string;
    showChevron?: boolean;
  }): ReactElement => {
    const {
      label,
      icon,
      isActive,
      onClick,
      chevronDirection,
      ariaExpanded,
      ariaControls,
      showChevron = true,
    } = params;

    return (
      <ListItemButton
        component="button"
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        sx={{
          ...sectionMenuButtonBaseSx,
          ...(isActive ? sectionMenuButtonActiveSx : {}),
          '&:hover': {
            ...(isActive
              ? sectionMenuButtonActiveSx['&:hover']
              : sectionMenuButtonBaseSx['&:hover']),
          },
        }}
      >
        {isActive ? (
          <Box sx={sectionMenuButtonAccentBarSx} />
        ) : null}

        <ListItemIcon
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            mr: collapsed ? 0 : 1.5,
            color: 'inherit',
            transition: SIDEMENU_TRANSITION_CONSTANTS.menu,
          }}
        >
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
            }}
            sx={{
              m: 0,
            }}
          />
        )}

        {!collapsed && showChevron ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              ml: 'auto',
            }}
          >
            <KeyboardArrowDown
              sx={{
                ...sectionMenuButtonChevronSx,
                transform:
                  chevronDirection === 'up'
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                color:
                  isActive || chevronDirection === 'up'
                    ? '#059669'
                    : '#94a3b8',
              }}
            />
          </Box>
        ) : null}
      </ListItemButton>
    );
  };


  const userInitial = getUserInitial(user);
  const displayName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
    user?.username?.trim() ||
    'John Smith';

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: UI.text,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          height: `calc(${APP_BAR_HEIGHT}px + 1px)`,
          minHeight: `calc(${APP_BAR_HEIGHT}px + 1px)`,
          borderBottom: `1px solid ${UI.border}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : sidebarHeaderPaddingX,
            height: `${APP_BAR_HEIGHT}px`,
            minHeight: `${APP_BAR_HEIGHT}px !important`,
            maxHeight: `${APP_BAR_HEIGHT}px`,
            gap: collapsed ? 0 : SIDEMENU_SPACING_CONSTANTS.headerContentGap.regular,
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src="/branding/FH-LOGO-NEW.png"
            alt="FarmHUB"
            sx={{
              height: collapsed ? 34 : 40,
              width: 'auto',
              maxWidth: collapsed ? 52 : 'none',
              objectFit: 'contain',
              flexShrink: 0,
              display: 'block',
            }}
          />
          {!collapsed ? (
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: sidemenuTokens.typography.appName.fontWeight,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: sidemenuTokens.typography.appName.fontSize,
                  color: sidemenuTokens.typography.appName.color,
                }}
              >
                FarmHUB
              </Typography>
              {activeFarmDisplayName && activeFarmDisplayName !== '-' ? (
                <Typography
                  variant="caption"
                  sx={{
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: sidemenuTokens.typography.caption.color,
                    fontSize: sidemenuTokens.typography.caption.fontSize,
                  }}
                >
                  {activeFarmDisplayName}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Toolbar>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: SIDEMENU_SPACING_CONSTANTS.menuGap,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
          mt: sidebarContentMarginTop,
          px: sidebarContentPaddingX,
          pb: SIDEMENU_SPACING_CONSTANTS.contentBottomPadding,
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: UI.borderSoft,
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: UI.accentSoft,
          },
        }}
      >
        {filteredGroups.map((group) => {
          const isGroupActive = group.items.some((item) =>
            isMenuItemActivePath(pathname, item.path, item.activePathPrefix),
          );
          const groupLabel = resolveMenuLabel(group.titleKey, t);
          const isGroupExpanded = Boolean(expandedGroups[group.id]);

          // Single-item root link (e.g. Dashboard) → render as standalone button
          if (group.items.length === 1 && group.items[0].path !== '#') {
            const singleItem = group.items[0];
            const isActive = isMenuItemActivePath(pathname, singleItem.path, singleItem.activePathPrefix);
            const label = resolveMenuLabel(singleItem.labelKey, t);
            const btn = renderSectionButton({
              label,
              icon: resolveMenuIcon(singleItem.icon),
              isActive,
              onClick: () => {
                if (pathname === singleItem.path) {
                  if (onClose) onClose();
                  return;
                }
                beginNavigationLoading();
                window.setTimeout(() => endNavigationLoading(), 15000);
                router.push(singleItem.path);
                if (onClose) onClose();
              },
              chevronDirection: isActive ? 'up' : 'down',
              showChevron: false,
            });

            return (
              <Box
                key={group.id}
                sx={{
                  mb: collapsed
                    ? SIDEMENU_SPACING_CONSTANTS.singleItemSpacing.collapsed
                    : SIDEMENU_SPACING_CONSTANTS.singleItemSpacing.expanded,
                  px: collapsed
                    ? SIDEMENU_SPACING_CONSTANTS.groupPaddingX.collapsed
                    : SIDEMENU_SPACING_CONSTANTS.groupPaddingX.expanded,
                }}
              >
                {collapsed ? (
                  <Tooltip title={label} placement="right" arrow>{btn}</Tooltip>
                ) : btn}
              </Box>
            );
          }

          return (
            <Box
              key={group.id}
              sx={{
                position: 'relative',
                mb: collapsed
                  ? SIDEMENU_SPACING_CONSTANTS.groupSpacing.collapsed
                  : SIDEMENU_SPACING_CONSTANTS.groupSpacing.expanded,
                px: collapsed
                  ? SIDEMENU_SPACING_CONSTANTS.groupPaddingX.collapsed
                  : SIDEMENU_SPACING_CONSTANTS.groupPaddingX.expanded,
              }}
            >
              {collapsed ? (
                <Tooltip title={groupLabel} placement="right" arrow>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      minHeight: 64,
                      borderRadius: 2,
                      background: isGroupActive
                        ? 'linear-gradient(to right, rgba(236, 253, 245, 1), rgba(255,255,255,0.9))'
                        : UI.panelSoft,
                      color: isGroupActive
                        ? theme.palette.primary.dark
                        : 'text.secondary',
                      border: '1px solid',
                      borderColor: isGroupActive
                        ? 'rgba(167, 243, 208, 0.6)'
                        : UI.border,
                      boxShadow: isGroupActive ? UI.shadowSoft : 'none',
                      transition: SIDEMENU_TRANSITION_CONSTANTS.menu,
                      cursor: 'default',
                      overflow: 'hidden',
                    }}
                  >
                    {isGroupActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 6,
                          height: 24,
                          bgcolor: 'primary.main',
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                      }}
                    >
                      {resolveGroupIcon(group.id, groupLabel)}
                    </Box>
                  </Box>
                </Tooltip>
              ) : (
                renderSectionButton({
                  label: groupLabel,
                  icon: resolveGroupIcon(group.id, groupLabel),
                  isActive: isGroupActive,
                  onClick: () => {
                    setExpandedGroups((previous) => {
                      const next: Record<string, boolean> = {};
                      const shouldExpandCurrent = !previous[group.id];
                      filteredGroups.forEach((item) => {
                        next[item.id] =
                          item.id === group.id ? shouldExpandCurrent : false;
                      });
                      return next;
                    });
                  },
                  chevronDirection: isGroupExpanded ? 'up' : 'down',
                  ariaExpanded: isGroupExpanded,
                  ariaControls: `group-items-${group.id}`,
                  showChevron: true,
                })
              )}

              <Collapse
                in={collapsed ? false : isGroupExpanded}
                timeout={180}
                unmountOnExit
              >
                <List
                  disablePadding
                  id={`group-items-${group.id}`}
                  sx={{
                    mt: SIDEMENU_SPACING_CONSTANTS.menuGap,
                    ml: 2.35,
                    pl: 1.75,
                    borderLeft: `2px solid rgba(167, 243, 208, 0.5)`,
                  }}
                >
                  {group.items.map((item) => {
                    const isActive = isMenuItemActivePath(pathname, item.path, item.activePathPrefix);
                    const itemLabel = resolveMenuLabel(item.labelKey, t);

                    const menuButton = (
                      <ListItemButton
                        onClick={() => {
                          if (pathname === item.path) {
                            if (onClose) onClose();
                            return;
                          }
                          beginNavigationLoading();
                          window.setTimeout(
                            () => endNavigationLoading(),
                            15000,
                          );
                          router.push(item.path);
                          if (onClose) onClose();
                        }}
                        sx={{
                          borderRadius: 1.5,
                          py: 1,
                          px: 2,
                          mb: 0.5,
                          gap: '3px',
                          width: '100%',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          transition: SIDEMENU_TRANSITION_CONSTANTS.menu,
                          ml: collapsed ? 0 : 0,
                          mr: collapsed ? 0 : 0,
                          background: isActive
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'transparent',
                          color: isActive
                            ? theme.palette.primary.dark
                            : UI.text,
                          border: `1px solid ${isActive ? 'rgba(167, 243, 208, 0.5)' : 'transparent'}`,
                          '&:hover': {
                            background: isActive
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(255,255,255,0.4)',
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0 }}>{resolveMenuIcon(item.icon)}</ListItemIcon>
                        <ListItemText
                          primary={itemLabel}
                          sx={{
                            m: 0,
                            flex: collapsed ? '0 0 0' : '1 1 auto',
                            maxWidth: collapsed ? 0 : 220,
                            width: collapsed ? 0 : 'auto',
                            opacity: collapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            transition: SIDEMENU_TRANSITION_CONSTANTS.textFade,
                          }}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 700 : 500,
                            noWrap: true,
                          }}
                        />
                      </ListItemButton>
                    );

                    return (
                      <ListItem
                        key={item.path}
                        disablePadding
                        sx={{ mb: collapsed ? 0.18 : 0.08 }}
                      >
                        {collapsed ? (
                          <Tooltip title={itemLabel} placement="right">
                            {menuButton}
                          </Tooltip>
                        ) : (
                          menuButton
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

        <Box
          sx={{
            flexShrink: 0,
            borderTop: `1px solid ${UI.border}`,
            mt: SIDEMENU_SPACING_CONSTANTS.menuGap,
            px: sidebarHeaderPaddingX,
            pb: SIDEMENU_SPACING_CONSTANTS.footerPaddingBottom,
            pt: SIDEMENU_SPACING_CONSTANTS.footerPaddingBottom,
          }}
        >
          {!collapsed ? (
            <Box
              onClick={handleSwitchContext}
              role="button"
              aria-label="เปลี่ยนบริบทการใช้งาน"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                borderRadius: 2,
                px: 1.25,
                py: 1.15,
                bgcolor: 'rgba(236, 253, 245, 0.95)',
                border: `1px solid ${UI.borderSoft}`,
                boxShadow: UI.shadow,
                cursor: 'pointer',
                transition: SIDEMENU_TRANSITION_CONSTANTS.glassHover,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: UI.shadowTiny,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'rgba(16, 185, 129, 0.16)',
                  color: UI.accent,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                {userInitial}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    color: UI.text,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </Typography>
                <Typography
                  sx={{
                    color: UI.muted,
                    fontSize: '0.72rem',
                    mt: 0.35,
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeContextRole ?? 'ผู้ดูแลระบบ'}
                </Typography>
                <Typography
                  sx={{
                    color: UI.muted,
                    fontSize: '0.72rem',
                    mt: 0.1,
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeContextScope ?? activeFarmCode ?? '-'}
                </Typography>
              </Box>
              <KeyboardArrowUp sx={{ fontSize: 18, color: UI.muted }} />
            </Box>
          ) : (
            <Tooltip title="เปลี่ยนบริบทการใช้งาน" placement="right" arrow>
              <Avatar
                role="button"
                tabIndex={0}
                aria-label="เปลี่ยนบริบทการใช้งาน"
                onClick={handleSwitchContext}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  handleSwitchContext();
                }}
                sx={{
                  width: 32,
                  height: 32,
                  mx: 'auto',
                  bgcolor: 'rgba(16, 185, 129, 0.16)',
                  color: UI.accent,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1.5px solid',
                  borderColor: 'background.paper',
                  cursor: 'pointer',
                  boxShadow: UI.shadowTiny,
                  transition: SIDEMENU_TRANSITION_CONSTANTS.glassHover,
                }}
              >
                {userInitial}
              </Avatar>
            </Tooltip>
          )}
        </Box>

      <AccessContextSwitchDialog
        open={isContextDialogOpen}
        onClose={() => setIsContextDialogOpen(false)}
        onContextApplied={handleContextApplied}
      />
    </Box>
  );
}
