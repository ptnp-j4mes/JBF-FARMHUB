'use client';

import { Add, DeleteOutline, EditOutlined, FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentCard, SearchField } from '@/components/common';
import DataTable, { type Column } from '@/components/common/DataTable';
import {
  MASTER_SECTION_TABS,
  MasterRecordDialog,
  MasterSectionLayout,
  type MasterRecordDialogDraft,
} from '@/features/admin/master/components';

interface MasterSectionPlaceholderPageProps {
  title: string;
  subtitle: string;
  showManagementColumn?: boolean;
}

interface MasterFilterDefinition {
  key: 'filter1' | 'filter2' | 'filter3';
  label: string;
  options: string[];
}

interface MasterPlaceholderRow {
  id: number;
  code: string;
  name: string;
  updatedAt: string;
  status: 'ใช้งาน' | 'ไม่ใช้งาน';
  filter1: string;
  filter2: string;
  filter3: string;
}

const MASTER_TAB_FILTER_DEFINITIONS: Partial<
  Record<(typeof MASTER_SECTION_TABS)[number]['key'], MasterFilterDefinition[]>
> = {
  'farm-type': [
    { key: 'filter1', label: 'ระบบการเลี้ยง', options: ['ปิด', 'เปิด', 'กึ่งเปิด'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  breed: [
    { key: 'filter1', label: 'ชนิดสัตว์', options: ['สุกร', 'สุกรพ่อแม่พันธุ์', 'สุกรขุน'] },
    { key: 'filter2', label: 'แหล่งที่มา', options: ['ภายใน', 'ภายนอก'] },
    { key: 'filter3', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  'disease-group': [
    { key: 'filter1', label: 'กลุ่มโรค', options: ['ระบบทางเดินหายใจ', 'ระบบทางเดินอาหาร', 'ทั่วไป'] },
    { key: 'filter2', label: 'ระดับความรุนแรง', options: ['สูง', 'กลาง', 'ต่ำ'] },
  ],
  'treatment-type': [
    { key: 'filter1', label: 'วิธีการรักษา', options: ['ยา', 'วัคซีน', 'กักแยก'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  'loss-type': [
    { key: 'filter1', label: 'ประเภทการสูญเสีย', options: ['เสียชีวิต', 'คัดทิ้ง', 'สูญหาย'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  'death-cause': [
    { key: 'filter1', label: 'สาเหตุหลัก', options: ['โรค', 'อุบัติเหตุ', 'สภาพแวดล้อม'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  products: [
    { key: 'filter1', label: 'หมวดสินค้า', options: ['ยา', 'วัคซีน', 'อาหาร'] },
    { key: 'filter2', label: 'หน่วยนับ', options: ['ขวด', 'กิโลกรัม', 'โดส'] },
    { key: 'filter3', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  categories: [
    { key: 'filter1', label: 'กลุ่มหมวด', options: ['ยาและเวชภัณฑ์', 'อาหารสัตว์', 'อุปกรณ์'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  units: [
    { key: 'filter1', label: 'ประเภทหน่วย', options: ['ปริมาณ', 'น้ำหนัก', 'จำนวน'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  conversions: [
    { key: 'filter1', label: 'ประเภทการแปลง', options: ['จำนวนเป็นน้ำหนัก', 'หน่วยย่อย', 'หน่วยใหญ่'] },
    { key: 'filter2', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  'lot-policies': [
    { key: 'filter1', label: 'นโยบายล็อต', options: ['FIFO', 'FEFO', 'LIFO'] },
    { key: 'filter2', label: 'บังคับวันหมดอายุ', options: ['บังคับ', 'ไม่บังคับ'] },
    { key: 'filter3', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  partners: [
    { key: 'filter1', label: 'ประเภทคู่ค้า', options: ['ผู้ขาย', 'ลูกค้า', 'ผู้ให้บริการ'] },
    { key: 'filter2', label: 'กลุ่มคู่ค้า', options: ['A', 'B', 'C'] },
    { key: 'filter3', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
  'alert-rules': [
    { key: 'filter1', label: 'ประเภทแจ้งเตือน', options: ['สต๊อกต่ำ', 'ใกล้หมดอายุ', 'สุขภาพ'] },
    { key: 'filter2', label: 'ระดับความเร่งด่วน', options: ['สูง', 'กลาง', 'ต่ำ'] },
    { key: 'filter3', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
  ],
};

export function MasterSectionPlaceholderPage({
  title,
  showManagementColumn = true,
}: MasterSectionPlaceholderPageProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    filter1: 'all',
    filter2: 'all',
    filter3: 'all',
  });
  const [draftFilterValues, setDraftFilterValues] = useState<Record<string, string>>({
    filter1: 'all',
    filter2: 'all',
    filter3: 'all',
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MasterPlaceholderRow | null>(null);

  const colors = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? {
            cardBg: '#0f172a',
            line: alpha('#94a3b8', 0.24),
            title: '#e2e8f0',
            subtitle: '#94a3b8',
          }
        : {
            cardBg: '#ffffff',
            line: '#e2e8f0',
            title: '#1e293b',
            subtitle: '#64748b',
          },
    [theme.palette.mode],
  );
  const primary = theme.palette.primary.main;
  const primaryHover = theme.palette.primary.dark;

  const activeTab = useMemo(() => {
    if (pathname === '/admin/master-data') {
      return MASTER_SECTION_TABS[0];
    }

    return MASTER_SECTION_TABS.find(
      (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
    );
  }, [pathname]);

  const activeTabKey = activeTab?.key;
  const contentTitle = activeTab?.label ?? title;

  const activeFilterDefinitions = useMemo<MasterFilterDefinition[]>(
    () => {
      if (!activeTabKey) {
        return [
          { key: 'filter1', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
          { key: 'filter2', label: 'กลุ่ม', options: ['ทั่วไป', 'เฉพาะทาง'] },
        ];
      }

      return MASTER_TAB_FILTER_DEFINITIONS[activeTabKey] ?? [
        { key: 'filter1', label: 'สถานะ', options: ['ใช้งาน', 'ไม่ใช้งาน'] },
        { key: 'filter2', label: 'กลุ่ม', options: ['ทั่วไป', 'เฉพาะทาง'] },
      ];
    },
    [activeTabKey],
  );

  const createInitialFilterValues = (definitions: MasterFilterDefinition[]) => {
    return definitions.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.key] = 'all';
      return acc;
    }, {});
  };

  useEffect(() => {
    const initialValues = createInitialFilterValues(activeFilterDefinitions);
    setFilterValues(initialValues);
    setDraftFilterValues(initialValues);
    setSearchQuery('');
    setPage(0);
    setIsFilterExpanded(false);
  }, [activeFilterDefinitions]);

  const allRows = useMemo<MasterPlaceholderRow[]>(
    () =>
      Array.from({ length: 137 }, (_, index) => {
        const id = index + 1;
        const filter1 = activeFilterDefinitions[0]?.options[index % activeFilterDefinitions[0].options.length] ?? '-';
        const filter2 = activeFilterDefinitions[1]?.options[index % activeFilterDefinitions[1].options.length] ?? '-';
        const filter3 = activeFilterDefinitions[2]?.options[index % activeFilterDefinitions[2].options.length] ?? '-';

        return {
          id,
          code: `${String(contentTitle).slice(0, 2).toUpperCase()}-${String(id).padStart(4, '0')}`,
          name: `${contentTitle} รายการ ${id}`,
          updatedAt: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
          status: id % 4 === 0 ? 'ไม่ใช้งาน' : 'ใช้งาน',
          filter1,
          filter2,
          filter3,
        };
      }),
    [activeFilterDefinitions, contentTitle],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [row.code, row.name, row.status, row.updatedAt]
              .join(' ')
              .toLowerCase()
              .includes(normalizedSearch);

      if (!matchesSearch) return false;

      return activeFilterDefinitions.every((filter) => {
        const selectedValue = filterValues[filter.key] ?? 'all';
        if (selectedValue === 'all') return true;
        return row[filter.key] === selectedValue;
      });
    });
  }, [activeFilterDefinitions, allRows, filterValues, searchQuery]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredRows.length, page, rowsPerPage]);

  const activeFilterCount = useMemo(
    () => activeFilterDefinitions.filter((filter) => (filterValues[filter.key] ?? 'all') !== 'all').length,
    [activeFilterDefinitions, filterValues],
  );
  const primaryFilterDefinitions = useMemo(
    () => activeFilterDefinitions.slice(0, 2),
    [activeFilterDefinitions],
  );
  const secondaryFilterDefinitions = useMemo(
    () => activeFilterDefinitions.slice(2),
    [activeFilterDefinitions],
  );

  const handleToggleFilterPanel = () => {
    setIsFilterExpanded((previous) => {
      const next = !previous;
      if (next) {
        setDraftFilterValues(filterValues);
      }
      return next;
    });
  };

  const handleDraftFilterChange = (key: MasterFilterDefinition['key'], value: string) => {
    setDraftFilterValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleClearDraftFilters = () => {
    setDraftFilterValues(createInitialFilterValues(activeFilterDefinitions));
  };

  const handleApplyFilters = () => {
    setFilterValues(draftFilterValues);
    setPage(0);
    setIsFilterExpanded(false);
  };

  const handleOpenCreateDialog = useCallback(() => {
    setEditingRow(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((row: MasterPlaceholderRow) => {
    setEditingRow(row);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingRow(null);
  }, []);

  const dialogInitialDraft = useMemo<MasterRecordDialogDraft | null>(() => {
    if (!editingRow) {
      return null;
    }

    return {
      id: editingRow.id,
      code: editingRow.code,
      name: editingRow.name,
      status: editingRow.status,
      description: `${editingRow.name} (ข้อมูลตัวอย่าง)`,
      note: '',
      isPinned: false,
      filters: {
        filter1: editingRow.filter1,
        filter2: editingRow.filter2,
        filter3: editingRow.filter3,
      },
    };
  }, [editingRow]);

  const handleSaveDialog = useCallback(
    (draft: MasterRecordDialogDraft) => {
      if (typeof window !== 'undefined') {
        window.alert(`โหมดจำลอง: บันทึก ${draft.name || contentTitle} สำเร็จ (ยังไม่บันทึกข้อมูลจริง)`);
      }
      handleCloseDialog();
    },
    [contentTitle, handleCloseDialog],
  );

  const columns = useMemo<Column<MasterPlaceholderRow>[]>(() => {
    const baseColumns: Column<MasterPlaceholderRow>[] = [
      { id: 'id', label: 'ID', align: 'center', minWidth: 64, sortable: false },
      { id: 'code', label: 'รหัส', sortable: false },
      { id: 'name', label: 'ชื่อรายการ', sortable: false },
      { id: 'status', label: 'สถานะ', align: 'center', minWidth: 100, sortable: false },
      { id: 'updatedAt', label: 'อัปเดตล่าสุด', align: 'center', minWidth: 118, sortable: false },
    ];

    if (showManagementColumn) {
      baseColumns.push({
        id: 'manage',
        label: 'จัดการ',
        align: 'center',
        minWidth: 92,
        sortable: false,
        format: (_value, row) => (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="แก้ไขรายการ">
              <IconButton
                size="small"
                aria-label="edit-row"
                sx={{ color: primary }}
                onClick={() => handleOpenEditDialog(row)}
              >
                <EditOutlined fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="ลบรายการ">
              <IconButton size="small" aria-label="delete-row" sx={{ color: '#ef4444' }}>
                <DeleteOutline fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [handleOpenEditDialog, primary, showManagementColumn]);

  return (
    <Box sx={{ height: 'calc(100dvh - 52px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: { xs: 2, md: 3 } }}>
      <MasterSectionLayout sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ContentCard
          borderColor={colors.line}
          backgroundColor={colors.cardBg}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: isFilterExpanded ? 1 : 1.25,
              }}
            >
              <SearchField
                placeholder={`ค้นหา${contentTitle}`}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 260 },
                  maxWidth: { md: 360 },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha(colors.cardBg, 0.7),
                  },
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterList fontSize="small" />}
                onClick={handleToggleFilterPanel}
                sx={{
                  minHeight: 40,
                  textTransform: 'none',
                  borderColor: activeFilterCount > 0 || isFilterExpanded ? alpha('#1d4ed8', 0.65) : colors.line,
                  color: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : colors.subtitle,
                  bgcolor: alpha(colors.cardBg, 0.6),
                  '&:hover': {
                    borderColor: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : colors.title,
                    bgcolor: alpha(colors.cardBg, 0.76),
                  },
                }}
              >
                ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>

              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                onClick={handleOpenCreateDialog}
                sx={{
                  minWidth: 132,
                  minHeight: 40,
                  ml: { md: 'auto' },
                  bgcolor: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: '#1e40af',
                  },
                }}
              >
                เพิ่ม{contentTitle}
              </Button>
            </Box>

            <Collapse in={isFilterExpanded} timeout="auto">
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: colors.line,
                  bgcolor: alpha(colors.cardBg, theme.palette.mode === 'dark' ? 0.84 : 0.96),
                  p: { xs: 1.25, md: 1.5 },
                  mb: 1.25,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.title,
                      lineHeight: '16px',
                      mb: 0.75,
                    }}
                  >
                    ข้อมูลรายการ
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                      },
                      gap: 1,
                      '& .filter-panel-field': {
                        width: '100%',
                        maxWidth: { xs: '100%', md: 280 },
                        justifySelf: 'start',
                        '& .MuiOutlinedInput-root': {
                          minHeight: 36,
                        },
                      },
                    }}
                  >
                    {primaryFilterDefinitions.map((filter) => (
                      <FormControl key={filter.key} size="small" className="filter-panel-field">
                        <InputLabel>{filter.label}</InputLabel>
                        <Select
                          value={draftFilterValues[filter.key] ?? 'all'}
                          label={filter.label}
                          onChange={(event) => handleDraftFilterChange(filter.key, event.target.value as string)}
                          sx={{
                            bgcolor: alpha(colors.cardBg, 0.7),
                          }}
                        >
                          <MenuItem value="all">ทั้งหมด</MenuItem>
                          {filter.options.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ))}
                  </Box>
                </Box>

                {secondaryFilterDefinitions.length > 0 ? (
                  <>
                    <Divider sx={{ borderColor: colors.line, my: 1 }} />
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.title,
                          lineHeight: '16px',
                          mb: 0.75,
                        }}
                      >
                        เงื่อนไขเพิ่มเติม
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, minmax(0, 1fr))',
                            lg: 'repeat(3, minmax(0, 1fr))',
                          },
                          gap: 1,
                          '& .filter-panel-field': {
                            width: '100%',
                            maxWidth: { xs: '100%', md: 280 },
                            justifySelf: 'start',
                            '& .MuiOutlinedInput-root': {
                              minHeight: 36,
                            },
                          },
                        }}
                      >
                        {secondaryFilterDefinitions.map((filter) => (
                          <FormControl key={filter.key} size="small" className="filter-panel-field">
                            <InputLabel>{filter.label}</InputLabel>
                            <Select
                              value={draftFilterValues[filter.key] ?? 'all'}
                              label={filter.label}
                              onChange={(event) => handleDraftFilterChange(filter.key, event.target.value as string)}
                              sx={{
                                bgcolor: alpha(colors.cardBg, 0.7),
                              }}
                            >
                              <MenuItem value="all">ทั้งหมด</MenuItem>
                              {filter.options.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ))}
                      </Box>
                    </Box>
                  </>
                ) : null}

                <Divider sx={{ borderColor: colors.line, my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="text"
                    onClick={handleClearDraftFilters}
                    sx={{ textTransform: 'none', color: colors.subtitle }}
                  >
                    ล้างค่า
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    sx={{
                      textTransform: 'none',
                      boxShadow: 'none',
                      bgcolor: primary,
                      '&:hover': {
                        bgcolor: primaryHover,
                        boxShadow: 'none',
                      },
                    }}
                  >
                    นำไปใช้
                  </Button>
                </Box>
              </Paper>
            </Collapse>

            <DataTable<MasterPlaceholderRow>
              columns={columns}
              data={pagedRows}
              totalCount={filteredRows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
              footerSummaryText={`ทั้งหมด ${filteredRows.length} รายการ`}
              stickyHeader
              sortable={false}
              emptyMessage="ไม่พบข้อมูล"
              paperSx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 1.25,
                borderColor: colors.line,
                bgcolor: colors.cardBg,
                display: 'flex',
                flexDirection: 'column',
              }}
              tableContainerSx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(colors.subtitle, 0.6)} ${alpha(colors.line, 0.08)}`,
                '&::-webkit-scrollbar': {
                  width: 8,
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(colors.line, 0.08),
                  borderLeft: `1px solid ${alpha(colors.line, 0.45)}`,
                  borderRadius: 999,
                  marginBlock: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(colors.subtitle, 0.58),
                  borderRadius: 999,
                  border: `1px solid ${alpha(colors.cardBg, 0.65)}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: alpha(colors.subtitle, 0.75),
                },
              }}
              tableSx={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& .MuiTableCell-root': {
                  px: 1.25,
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.title,
                  fontSize: '13px',
                },
                '& .MuiTableBody-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.subtitle,
                  fontSize: '12px',
                },
                '& .MuiTableHead-root .MuiTableCell-root:not(:last-of-type), & .MuiTableBody-root .MuiTableCell-root:not(:last-of-type)':
                  {
                    borderRight: `1px solid ${colors.line}`,
                  },
              }}
            />
          </Box>
        </ContentCard>

        <MasterRecordDialog
          open={dialogOpen}
          contentTitle={contentTitle}
          filterDefinitions={activeFilterDefinitions}
          initialDraft={dialogInitialDraft}
          onClose={handleCloseDialog}
          onSave={handleSaveDialog}
        />
      </MasterSectionLayout>
    </Box>
  );
}
