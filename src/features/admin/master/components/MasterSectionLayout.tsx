'use client';

import {
  Box,
  MenuItem,
  Select,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, type ReactNode } from 'react';
import { BreadcrumbTrail, SectionTabsCard } from '@/components/common';

export const MASTER_SECTION_CATEGORIES = [
  { key: 'area', label: 'พื้นที่' },
  { key: 'livestock', label: 'ปศุสัตว์' },
  { key: 'feeding', label: 'การให้อาหาร' },
  { key: 'warehouse', label: 'คลังสินค้า' },
  { key: 'trade', label: 'การค้า' },
  { key: 'system', label: 'ข้อมูลระบบ' },
] as const;

export const MASTER_SECTION_TABS = [
  {
    key: 'area-farms',
    label: 'ฟาร์ม',
    path: '/admin/master-data/area/farms',
    category: 'area',
  },
  {
    key: 'area-zones',
    label: 'โซน',
    path: '/admin/master-data/area/zones',
    category: 'area',
  },
  {
    key: 'area-houses',
    label: 'โรงเรือน',
    path: '/admin/master-data/area/houses',
    category: 'area',
  },
  {
    key: 'area-silos',
    label: 'ไซโล',
    path: '/admin/master-data/area/silos',
    category: 'area',
  },
  {
    key: 'farm-type',
    label: 'ประเภทการเลี้ยง',
    path: '/admin/master-data/livestock/pig-types',
    category: 'livestock',
  },
  {
    key: 'breed',
    label: 'สายพันธุ์',
    path: '/admin/master-data/livestock/breeds',
    category: 'livestock',
  },
  {
    key: 'disease-group',
    label: 'กลุ่มโรค',
    path: '/admin/master-data/livestock/diseases',
    category: 'livestock',
  },
  {
    key: 'treatment-type',
    label: 'ประเภทการรักษา',
    path: '/admin/master-data/livestock/treatments',
    category: 'livestock',
  },
  {
    key: 'loss-type',
    label: 'ประเภทการสูญเสีย',
    path: '/admin/master-data/livestock/mortality-types',
    category: 'livestock',
  },
  {
    key: 'death-cause',
    label: 'สาเหตุการตาย',
    path: '/admin/master-data/livestock/mortality-causes',
    category: 'livestock',
  },
  {
    key: 'feed-programs',
    label: 'โปรแกรมอาหาร',
    path: '/admin/master-data/feeding/feed-programs',
    category: 'feeding',
  },
  {
    key: 'products',
    label: 'รายการสินค้า',
    path: '/admin/master-data/warehouse/items',
    category: 'warehouse',
  },
  {
    key: 'categories',
    label: 'หมวดสินค้า',
    path: '/admin/master-data/warehouse/categories',
    category: 'warehouse',
  },
  {
    key: 'units',
    label: 'หน่วยนับ',
    path: '/admin/master-data/warehouse/units',
    category: 'warehouse',
  },
  {
    key: 'conversions',
    label: 'การแปลงหน่วย',
    path: '/admin/master-data/warehouse/conversions',
    category: 'warehouse',
  },
  {
    key: 'lot-policies',
    label: 'นโยบายล็อตและวันหมดอายุ',
    path: '/admin/master-data/warehouse/lot-policies',
    category: 'warehouse',
  },
  {
    key: 'partners',
    label: 'คู่ค้า',
    path: '/admin/master-data/trade/partners',
    category: 'trade',
  },
  {
    key: 'system-prefixes',
    label: 'คำนำหน้า',
    path: '/admin/master-data/system/prefixes',
    category: 'system',
  },
  {
    key: 'system-prefix-categories',
    label: 'หมวดหมู่คำนำหน้า',
    path: '/admin/master-data/system/prefix-categories',
    category: 'system',
  },
] as const;

export const DEFAULT_MASTER_SECTION_TAB_KEY: (typeof MASTER_SECTION_TABS)[number]['key'] =
  'area-farms';

interface MasterSectionLayoutProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  activeCategoryKey?: string;
  onCategoryChange?: (key: string) => void;
  hideTabsForCategoryKeys?: string[];
}

export function MasterSectionLayout({
  children,
  sx,
  activeTabKey: controlledActiveTabKey,
  onTabChange: controlledOnTabChange,
  activeCategoryKey: controlledActiveCategoryKey,
  onCategoryChange: controlledOnCategoryChange,
  hideTabsForCategoryKeys = [],
}: MasterSectionLayoutProps) {
  const theme = useTheme();
  // const router = useRouter();
  const pathname = usePathname();

  const defaultTab = useMemo(
    () =>
      MASTER_SECTION_TABS.find((tab) => tab.key === DEFAULT_MASTER_SECTION_TAB_KEY) ??
      MASTER_SECTION_TABS[0],
    [],
  );

  const activeTab = useMemo(() => {
    if (controlledActiveTabKey) {
      return MASTER_SECTION_TABS.find(t => t.key === controlledActiveTabKey) ?? defaultTab;
    }
    if (pathname === '/admin/master-data') return defaultTab;
    const matchedTab = MASTER_SECTION_TABS.filter(
      (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
    ).sort((left, right) => right.path.length - left.path.length)[0];
    return matchedTab ?? defaultTab;
  }, [defaultTab, pathname, controlledActiveTabKey]);

  const activeTabKey = activeTab.key;
  const activeCategory = controlledActiveCategoryKey ?? activeTab.category;

  const categoryTabs = useMemo(
    () =>
      hideTabsForCategoryKeys.includes(activeCategory)
        ? []
        : MASTER_SECTION_TABS.filter((tab) => tab.category === activeCategory),
    [activeCategory, hideTabsForCategoryKeys],
  );

  const activeCategoryLabel = useMemo(() => {
    const matchedCategory = MASTER_SECTION_CATEGORIES.find((category) => category.key === activeCategory);
    return matchedCategory?.label ?? MASTER_SECTION_CATEGORIES[0].label;
  }, [activeCategory]);

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

  const handleTabNavigate = (key: string) => {
    if (controlledOnTabChange) {
      controlledOnTabChange(key);
      return;
    }
    // const matchedTab = MASTER_SECTION_TABS.find(t => t.key === key);
    // if (matchedTab && pathname !== matchedTab.path) {
    //   router.push(matchedTab.path);
    // }
  };

  const handleCategoryNavigate = (categoryKey: (typeof MASTER_SECTION_CATEGORIES)[number]['key']) => {
    if (controlledOnCategoryChange) {
      controlledOnCategoryChange(categoryKey);
      return;
    }
    // const firstTabInCategory = MASTER_SECTION_TABS.find((tab) => tab.category === categoryKey);
    // if (!firstTabInCategory) return;
    // handleTabNavigate(firstTabInCategory.key);
  };

  const breadcrumbs = useMemo(
    () => ['ดูแลระบบ', 'ข้อมูลหลัก', activeCategoryLabel, activeTab.label],
    [activeCategoryLabel, activeTab.label],
  );

  // useEffect(() => {
  //   MASTER_SECTION_TABS.forEach((tab) => {
  //     router.prefetch(tab.path);
  //   });
  // }, [router]);

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
        <BreadcrumbTrail
          items={breadcrumbs}
          mutedTextColor={colors.mutedText}
        />
        <SectionTabsCard
          leftContent={
            <Select
              value={activeCategory}
              onChange={(event) =>
                handleCategoryNavigate(
                  event.target.value as (typeof MASTER_SECTION_CATEGORIES)[number]['key'],
                )
              }
              variant="standard"
              disableUnderline
              sx={{
                fontWeight: 700,
                fontSize: { xs: '12px', md: '13.5px' },
                color: theme.palette.text.primary,
                width: { xs: 90, md: 115 },
                '& .MuiSelect-select': {
                  py: 0.5,
                  pl: 3,
                  pr: 3,
                  textAlign: 'center',
                },
              }}
            >
              {MASTER_SECTION_CATEGORIES.map((category) => (
                <MenuItem
                  key={category.key}
                  value={category.key}
                  sx={{ fontWeight: 600, fontSize: '13px' }}
                >
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          }
          tabs={categoryTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          activeKey={activeTabKey}
          onTabChange={(key) => {
            handleTabNavigate(key);
          }}
          mutedTextColor={colors.mutedText}
          lineColor={colors.line}
          tabIdleColor={colors.tabIdle}
          cardBackground={colors.cardBg}
          tabsGap={{ xs: 1.25, md: 3 }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
