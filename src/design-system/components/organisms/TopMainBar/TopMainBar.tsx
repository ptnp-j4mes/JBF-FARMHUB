'use client';

import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  AccountCircle,
  Palette,
  ChevronRight,
  ArrowBack,
  Check,
  Close,
  Search,
  HelpOutline,
} from '@mui/icons-material';
import packageJson from '../../../../../package.json';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { authService, User } from '@/features/auth/services/auth.service';
import { useI18n } from '@/core/i18n';
import { formatUserDisplayName, getUserDisplayInitial } from '@/lib/user-display';
import {
  ensureCurrentFacilityForUser,
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityId,
  getUserFarmScopeNodes,
} from '@/lib/facility-context';
import { beginNavigationLoading } from '@/lib/global-loading';
import { MENU_GROUPS, resolveMenuLabel, type MenuGroupConfig } from '@/core/config/menu.config';
import { getMenuGroupsCached } from '@/core/config/menu-tree-cache';
import { notificationService } from '@/features/reports/notifications/services/notification.service';
import type { NotificationResponse as AppNotificationResponse } from '@/features/reports/notifications/types';
import { NotificationBell, useColorMode } from '@/design-system';

const APP_BAR_HEIGHT = 80;
const APP_VERSION = packageJson.version;
const TOPBAR_ROLE_LABEL_KEYS: Record<string, string> = {
  admin: 'layout.topbar.roleLabels.admin',
  executive: 'layout.topbar.roleLabels.executive',
  farmmanager: 'layout.topbar.roleLabels.farmManager',
  supervisor: 'layout.topbar.roleLabels.supervisor',
  staff: 'layout.topbar.roleLabels.staff',
  viewer: 'layout.topbar.roleLabels.viewer',
};

interface TopMainBarProps {
  onSidebarOpen: () => void;
}

function toReadableLabel(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNotificationDateTime(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale || 'th-TH', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

export default function TopMainBar({ onSidebarOpen }: TopMainBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, setMode } = useColorMode();
  const { t, locale } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'theme'>('main');
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
  const [menuGroups, setMenuGroups] = useState<MenuGroupConfig[]>(MENU_GROUPS);
  const [notifications, setNotifications] = useState<AppNotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const currentUser = authService.getUser();
    setUser(currentUser);
    const facilityId = ensureCurrentFacilityForUser(currentUser);
    setSelectedFacilityId(facilityId ?? '');
  }, []);

  useEffect(() => {
    const onFacilityChanged = () => {
      const facilityId = getCurrentFacilityId();
      setSelectedFacilityId(facilityId ?? '');
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

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

  const loadNotifications = useCallback(async () => {
    if (!authService.hasPermission('reports.notifications.view')) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [unreadCountResult, unreadNotifications] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getUnread(),
      ]);

      setUnreadCount(unreadCountResult);
      setNotifications(unreadNotifications);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load notifications', error);
      }
      setUnreadCount(0);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (!active) return;
      await loadNotifications();
    };

    void refresh();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }, 60000);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadNotifications]);

  const handleMarkNotificationAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await notificationService.markAsRead(notificationId);
        await loadNotifications();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to mark notification as read', error);
        }
      }
    },
    [loadNotifications],
  );

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to mark all notifications as read', error);
      }
    }
  }, [loadNotifications]);

  const mappedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: formatNotificationDateTime(notification.createdDate, locale),
      })),
    [notifications, locale],
  );

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuView('main');
  };

  const handleLogout = () => {
    handleClose();
    Swal.fire({
      title: t('layout.topbar.logoutTitle'),
      text: t('layout.topbar.logoutDescription'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('layout.topbar.logoutConfirm'),
      cancelButtonText: t('layout.topbar.logoutCancel'),
      confirmButtonColor: theme.palette.error.main,
      cancelButtonColor: theme.palette.text.secondary,
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      scrollbarPadding: false,
      heightAuto: false,
      target: 'body',
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = '9999';
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        authService.logout();
        beginNavigationLoading();
        router.push('/auth/login');
      }
    });
  };

  const getAvatarLetter = () => getUserDisplayInitial(user);
  const getRoleLabel = () => {
    const rawRole = user?.roles?.[0];
    if (!rawRole) return t('layout.topbar.roleLabels.user');

    const normalizedRole = rawRole.toLowerCase().replace(/\s+/g, '');
    const labelKey = TOPBAR_ROLE_LABEL_KEYS[normalizedRole];
    return labelKey ? t(labelKey) : rawRole;
  };

  const farmScopeNodes = getUserFarmScopeNodes(user);
  const selectedFarm = farmScopeNodes.find((farm) => farm.facilityNodeId === selectedFacilityId);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const defaultTitle = 'JBFarmHUB';
    const currentTitle =
      document.title && document.title.trim().length > 0 ? document.title : defaultTitle;
    const baseTitle = currentTitle.replace(/^\[[^\]]+\]\s*/, '');

    if (!selectedFarm?.facilityCode) {
      document.title = baseTitle;
      return;
    }

    document.title = `[${selectedFarm.facilityCode}] ${baseTitle}`;
  }, [selectedFarm?.facilityCode]);

  const pageTitle = useMemo(() => {
    const menuEntries = menuGroups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupTitleKey: group.titleKey,
      })),
    );

    const activeMenuItem = [...menuEntries]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

    if (activeMenuItem) {
      return resolveMenuLabel(activeMenuItem.labelKey, t);
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return t('layout.menu.items.operationsDashboard');
    }

    const matchedGroup = menuGroups.find((group) => group.id === segments[0]);
    if (matchedGroup) {
      return resolveMenuLabel(matchedGroup.titleKey, t);
    }

    return toReadableLabel(segments[segments.length - 1]);
  }, [menuGroups, pathname, t, locale]);

  const topIconButtonSx = {
    color: 'text.secondary',
    width: { xs: 30, sm: 32 },
    height: { xs: 30, sm: 32 },
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: 'rgba(180, 35, 24, 0.08)',
      color: 'primary.main',
    },
  } as const;

  const helpItems = [
    {
      title: t('layout.topbar.helpDialog.gettingStarted.title'),
      description: t('layout.topbar.helpDialog.gettingStarted.description'),
    },
    {
      title: t('layout.topbar.helpDialog.dailyRecording.title'),
      description: t('layout.topbar.helpDialog.dailyRecording.description'),
    },
    {
      title: t('layout.topbar.helpDialog.reports.title'),
      description: t('layout.topbar.helpDialog.reports.description'),
    },
    {
      title: t('layout.topbar.helpDialog.stock.title'),
      description: t('layout.topbar.helpDialog.stock.description'),
    },
    {
      title: t('layout.topbar.helpDialog.support.title'),
      description: t('layout.topbar.helpDialog.support.description'),
    },
  ];

  const isDark = theme.palette.mode === 'dark';

  if (!mounted) return null;

  return (
    <Box
      component="header"
      sx={{
        height: APP_BAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.1, sm: 1.5, md: 2.5 },
        mb: 2,
        flexShrink: 0,
        backgroundColor: isDark ? 'rgba(26, 26, 27, 0.84)' : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(229, 229, 229, 0.9)'}`,
        borderRadius: '10px',
        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.32)' : '0 8px 30px rgba(20,20,20,0.04)',
        color: 'text.primary',
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <IconButton
          color="inherit"
          aria-label="toggle navigation"
          onClick={onSidebarOpen}
          sx={{
            width: { xs: 34, sm: 36 },
            height: { xs: 34, sm: 36 },
            borderRadius: '10px',
            ml: { xs: 0.2, sm: 0 },
            bgcolor: 'rgba(255,255,255,0.4)',
            color: 'text.secondary',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            '&:hover': {
              bgcolor: 'rgba(254, 243, 242, 0.96)',
              color: 'primary.main',
            },
          }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.03em',
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: { xs: 180, sm: 260, md: 340 },
            }}
          >
            {pageTitle}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.74),
              lineHeight: 1,
              letterSpacing: '0.04em',
              display: { xs: 'none', md: 'block' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selectedFarm?.facilityCode
              ? `${selectedFarm.facilityCode} • ${formatUserDisplayName(
                  user,
                  t('layout.topbar.loadingUser'),
                )}`
              : formatUserDisplayName(user, t('layout.topbar.loadingUser'))}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }} />

      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
        }}
      >
        <Search
          sx={{
            color: 'text.secondary',
            fontSize: 18,
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        />
        <InputBase
          placeholder={t('layout.topbar.searchPlaceholder')}
          sx={{
            pl: 5,
            pr: 2,
            py: 1,
            bgcolor: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            width: 250,
            transition: 'all 0.3s',
            '& .MuiInputBase-input': {
              py: 0.95,
            },
            '&.Mui-focused': {
              bgcolor: 'rgba(255,255,255,0.7)',
              boxShadow: '0 0 0 2px rgba(52,211,153,0.5)',
            },
          }}
        />
      </Box>

      <Stack
        direction="row"
        spacing={{ xs: 0.2, sm: 0.4 }}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        <NotificationBell
          notifications={mappedNotifications}
          unreadCount={unreadCount}
          onMarkAsRead={(id) => {
            void handleMarkNotificationAsRead(id);
          }}
          onMarkAllAsRead={() => {
            void handleMarkAllNotificationsAsRead();
          }}
          onViewAll={() => {
            beginNavigationLoading();
            router.push('/reports/notifications');
          }}
          tooltipTitle={t('layout.topbar.notifications')}
          iconButtonSx={{
            ...topIconButtonSx,
            bgcolor: 'rgba(255,255,255,0.28)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.6)',
              color: 'primary.main',
              transform: 'scale(1.05)',
            },
          }}
        />

        <Tooltip title={t('layout.topbar.accountSettings')}>
          <Box
            onClick={handleMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              cursor: 'pointer',
              py: 0.35,
              pl: 0.55,
              pr: 0.8,
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              bgcolor: 'rgba(255,255,255,0.18)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.48)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: '2px solid',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.36)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.24)}`,
              }}
            >
              {getAvatarLetter()}
            </Avatar>
            <ChevronRight
              sx={{
                fontSize: 18,
                color: 'text.secondary',
                transform: 'rotate(90deg)',
                flexShrink: 0,
              }}
            />
          </Box>
        </Tooltip>
      </Stack>

      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableScrollLock
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            mt: 1.5,
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(17, 26, 21, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(220, 232, 223, 0.9)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(18, 54, 37, 0.10)',
            borderRadius: '10px',
            width: 304,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(17, 26, 21, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(220, 232, 223, 0.9)',
            },
          },
        }}
      >
        {menuView === 'main' && (
          <Box>
            <Box px={2.5} py={2}>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color="text.primary"
                sx={{ lineHeight: 1.2 }}
              >
                {formatUserDisplayName(user, 'Guest User')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.username || 'guest@example.com'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                handleClose();
                beginNavigationLoading();
                router.push('/profile');
              }}
              sx={{ py: 1.5, mt: 0.5 }}
            >
              <ListItemIcon>
                <AccountCircle fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={t('layout.topbar.profile')}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </MenuItem>

            <MenuItem onClick={() => setMenuView('theme')} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <Palette fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={t('layout.topbar.theme')}
                secondary={t(`common.theme.${mode}`)}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <ChevronRight sx={{ color: 'text.secondary', ml: 1 }} />
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleClose();
                setIsHelpDialogOpen(true);
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <HelpOutline fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={t('layout.topbar.help')}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </MenuItem>

            <Divider sx={{ my: 1 }} />

            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', py: 1.5, mb: 0.5 }}>
              <ListItemIcon>
                <Logout fontSize="medium" color="error" />
              </ListItemIcon>
              <ListItemText
                primary={t('layout.topbar.logout')}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </MenuItem>
          </Box>
        )}

        {menuView === 'theme' && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 1,
              }}
            >
              <IconButton size="small" onClick={() => setMenuView('main')}>
                <ArrowBack fontSize="small" />
              </IconButton>
              <Typography variant="body1" fontWeight="600" ml={1}>
                {t('layout.topbar.theme')}
              </Typography>
            </Box>
            <Divider />
            <Box px={2.5} py={2}>
              <Typography variant="caption" color="text.secondary">
                {t('layout.topbar.browserOnlyTheme')}
              </Typography>
            </Box>
            <MenuItem onClick={() => setMode('auto')} sx={{ py: 1.5 }} selected={mode === 'auto'}>
              <ListItemIcon>{mode === 'auto' && <Check color="primary" />}</ListItemIcon>
              <ListItemText primary={t('common.theme.auto')} />
            </MenuItem>
            <MenuItem onClick={() => setMode('dark')} sx={{ py: 1.5 }} selected={mode === 'dark'}>
              <ListItemIcon>{mode === 'dark' && <Check color="primary" />}</ListItemIcon>
              <ListItemText primary={t('common.theme.dark')} />
            </MenuItem>
            <MenuItem onClick={() => setMode('light')} sx={{ py: 1.5 }} selected={mode === 'light'}>
              <ListItemIcon>{mode === 'light' && <Check color="primary" />}</ListItemIcon>
              <ListItemText primary={t('common.theme.light')} />
            </MenuItem>
          </Box>
        )}
      </Menu>

      <Dialog
        open={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '10px',
            maxWidth: 540,
            mx: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutline sx={{ color: 'text.primary', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.4rem' }}>
                {t('layout.topbar.helpDialog.title')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsHelpDialogOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Stack spacing={1.5}>
            {helpItems.map((item) => (
              <Box
                key={item.title}
                sx={{
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.common.black, 0.03),
                  px: 2,
                  py: 1.6,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="text.primary"
                  sx={{ fontSize: '1rem', lineHeight: 1.25 }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.35, lineHeight: 1.45 }}
                >
                  {item.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
