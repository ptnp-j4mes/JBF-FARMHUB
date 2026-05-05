'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  type DragOverEvent,
  type DragCancelEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { menuManagementService } from '../services';
import type { MenuListResponse } from '../types';
import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import {
  MenuManagementDialog,
  MenuManagementFolderAccordion,
  MenuManagementTableSection,
} from '@/features/admin/user-assignment/components';
import type {
  MenuManagementDialogMode,
  MenuManagementIndex,
  MenuManagementFormState,
} from '@/features/admin/user-assignment/components/menu-management.types';
import { normalizeSlug, sortMenuRows } from '@/features/admin/user-assignment/components/menu-management.utils';

function createMenuFormState(overrides: Partial<MenuManagementFormState> = {}): MenuManagementFormState {
  return {
    labelTh: '',
    code: '',
    nodeType: 'Link',
    parentId: null,
    sortOrder: 0,
    iconKey: '',
    path: '',
    activePathPrefix: '',
    ...overrides,
  };
}

const EMPTY_FORM = createMenuFormState();

function createFormFromItem(item: MenuListResponse): MenuManagementFormState {
  return createMenuFormState({
    labelTh: item.labelTh,
    code: item.code,
    nodeType: item.nodeType,
    parentId: item.parentId,
    sortOrder: item.sortOrder,
    iconKey: item.iconKey || '',
    path: item.path || '',
    activePathPrefix: item.activePathPrefix || '',
  });
}

function buildMenuIndex(rows: MenuListResponse[]): MenuManagementIndex {
  const rowsById = new Map<number, MenuListResponse>();
  const childBuckets = new Map<number, MenuListResponse[]>();
  const folderIds = new Set<number>();

  rows.forEach((row) => {
    rowsById.set(row.id, row);
    if (row.nodeType === 'Folder') {
      folderIds.add(row.id);
    }
  });

  rows.forEach((row) => {
    if (row.parentId == null) {
      return;
    }

    if (!rowsById.has(row.parentId) || row.nodeType === 'Folder') {
      return;
    }

    const bucket = childBuckets.get(row.parentId);
    if (bucket) {
      bucket.push(row);
      return;
    }

    childBuckets.set(row.parentId, [row]);
  });

  childBuckets.forEach((items) => {
    items.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
  });

  const folders = sortMenuRows(rows.filter((node) => node.nodeType === 'Folder'));
  const rootItems = sortMenuRows(rows.filter((node) => node.parentId == null && node.nodeType !== 'Folder'));
  const orphanItems = sortMenuRows(
    rows.filter((node) => node.parentId != null && !rowsById.has(node.parentId)),
  );

  return {
    rows,
    rowsById,
    folders,
    folderIds,
    rootItems,
    orphanItems,
    childrenByParentId: childBuckets,
  };
}

function getChildrenForParent(index: MenuManagementIndex, parentId: number): MenuListResponse[] {
  return index.childrenByParentId.get(parentId) ?? [];
}

export default function MenuManagementPage() {
  const [nodes, setNodes] = useState<MenuListResponse[]>([]);
  const [displayNodes, setDisplayNodes] = useState<MenuListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuListResponse | null>(null);
  const [dialogInitialForm, setDialogInitialForm] = useState<MenuManagementFormState>(EMPTY_FORM);
  const [dialogMode, setDialogMode] = useState<MenuManagementDialogMode>('create');
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayIndex = useMemo(() => buildMenuIndex(displayNodes), [displayNodes]);
  const baselineIndex = useMemo(() => buildMenuIndex(nodes), [nodes]);

  const parentOptions = displayIndex.folders;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextItems = await menuManagementService.getLists({ includeInactive: true });
      setNodes(nextItems);
      setDisplayNodes(nextItems);
    } catch {
      setError('โหลดข้อมูลเมนูไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const showAlert = useCallback((options: SweetAlertOptions) => {
    return Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      target: 'body',
      ...options,
    });
  }, []);

  const resolveMenuGroupName = useCallback(
    (parentId: number | null) => {
      if (parentId == null) {
        return 'เมนูหลัก';
      }

      return displayIndex.rowsById.get(parentId)?.labelTh || 'เมนูหลัก';
    },
    [displayIndex.rowsById],
  );

  const syncNodeIntoState = useCallback((nextNode: MenuListResponse) => {
    const apply = (rows: MenuListResponse[]) => {
      const exists = rows.some((row) => row.id === nextNode.id);
      if (exists) {
        return rows.map((row) => (row.id === nextNode.id ? nextNode : row));
      }

      return [...rows, nextNode];
    };

    setNodes((current) => apply(current));
    setDisplayNodes((current) => apply(current));
  }, []);

  const markNodeInactive = useCallback((nodeId: number) => {
    const apply = (rows: MenuListResponse[]) =>
      rows.map((row) => (row.id === nodeId ? { ...row, isActive: false } : row));

    setNodes((current) => apply(current));
    setDisplayNodes((current) => apply(current));
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
    setDialogMode('create');
    setDialogInitialForm(EMPTY_FORM);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogInitialForm(EMPTY_FORM);
    setDialogMode('create');
    setDialogOpen(true);
  }, []);

  const openCreateChild = useCallback((parent: MenuListResponse) => {
    setEditing(null);
    setDialogInitialForm(
      createMenuFormState({
        nodeType: 'Link',
        parentId: parent.id,
      }),
    );
    setDialogMode('create');
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: MenuListResponse) => {
    setEditing(item);
    setDialogInitialForm(createFormFromItem(item));
    setDialogMode('view');
    setDialogOpen(true);
  }, []);

  const startEditing = useCallback(() => {
    if (!editing) {
      return;
    }

    setDialogMode('edit');
  }, [editing]);

  const saveItem = async (form: MenuManagementFormState) => {
    if (!form.labelTh.trim()) {
      setError('กรุณากรอกชื่อเมนู');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload: any = {
        labelTh: form.labelTh.trim(),
        code: form.code.trim() ? normalizeSlug(form.code) : normalizeSlug(form.labelTh),
        nodeType: form.nodeType,
        parentId: form.parentId,
        sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
        iconKey: form.iconKey.trim() || null,
        path: form.path.trim() || null,
        activePathPrefix: form.activePathPrefix.trim() || null,
      };
      const nextMenuGroupName = resolveMenuGroupName(form.parentId);

      if (!editing || dialogMode === 'create') {
        const createdNode = await menuManagementService.createList(payload);
        syncNodeIntoState({
          ...createdNode,
          menuGroupName: nextMenuGroupName,
        });
        void showAlert({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          text: 'ระบบได้เพิ่มเมนูเรียบร้อยแล้ว',
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        const confirmation = await showAlert({
          icon: 'warning',
          title: 'ยืนยันบันทึกการแก้ไข?',
          text: `คุณต้องการบันทึกการแก้ไขเมนู ${editing.labelTh} หรือไม่`,
          showCancelButton: true,
          confirmButtonText: 'บันทึก',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#B42318',
        });

        if (!confirmation.isConfirmed) {
          setIsSaving(false);
          return;
        }

        await menuManagementService.updateList(editing.id, payload);
        syncNodeIntoState({
          ...editing,
          ...payload,
          parentId: payload.parentId ?? null,
          menuGroupName: nextMenuGroupName,
          path: payload.path,
          iconKey: payload.iconKey,
          activePathPrefix: payload.activePathPrefix,
          sortOrder: payload.sortOrder ?? editing.sortOrder,
          nodeType: payload.nodeType ?? editing.nodeType,
          code: payload.code,
          labelTh: payload.labelTh,
        });
        void showAlert({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          text: 'ระบบได้บันทึกการแก้ไขเรียบร้อยแล้ว',
          timer: 1200,
          showConfirmButton: false,
        });
      }

      closeDialog();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'บันทึกเมนูไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = useCallback(async (item: MenuListResponse) => {
    setIsSaving(true);
    setError(null);
    try {
      const nextIsActive = !item.isActive;
      await menuManagementService.updateList(item.id, {
        code: item.code,
        labelTh: item.labelTh,
        nodeType: item.nodeType,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        path: item.path,
        iconKey: item.iconKey,
        activePathPrefix: item.activePathPrefix,
        isActive: nextIsActive,
      });

      syncNodeIntoState({
        ...item,
        isActive: nextIsActive,
      });

      void showAlert({
        icon: 'success',
        title: nextIsActive ? 'เปิดใช้งานสำเร็จ' : 'ปิดใช้งานสำเร็จ',
        text: nextIsActive ? 'ระบบได้เปิดใช้งานเมนูเรียบร้อยแล้ว' : 'ระบบได้ปิดใช้งานเมนูเรียบร้อยแล้ว',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      setError(item.isActive ? 'ปิดใช้งานเมนูไม่สำเร็จ' : 'เปิดใช้งานเมนูไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  }, [showAlert, syncNodeIntoState]);

  const deactivateItem = useCallback(async (item: MenuListResponse) => {
    setIsSaving(true);
    setError(null);
    try {
      await menuManagementService.deactivateList(item.id);
      markNodeInactive(item.id);
    } catch {
      setError('ลบเมนูไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  }, [markNodeInactive]);

  const saveFolderOrder = useCallback(
    async (parentId: number) => {
      const currentChildren = getChildrenForParent(displayIndex, parentId);
      const baselineChildren = getChildrenForParent(baselineIndex, parentId);
      const baselineById = new Map(baselineChildren.map((item) => [item.id, item] as const));

      const updates = currentChildren
        .map((item, index) => ({
          item,
          nextSortOrder: index + 1,
        }))
        .filter(({ item, nextSortOrder }) => {
          const baselineItem = baselineById.get(item.id);
          return !baselineItem || baselineItem.sortOrder !== nextSortOrder;
        });

      if (updates.length === 0) {
        return;
      }

      setIsSaving(true);
      setError(null);
      try {
        await Promise.all(
          updates.map(({ item, nextSortOrder }) =>
            menuManagementService.updateList(item.id, {
              code: item.code,
              labelTh: item.labelTh,
              nodeType: item.nodeType,
              parentId,
              sortOrder: nextSortOrder,
              path: item.path,
              iconKey: item.iconKey,
              activePathPrefix: item.activePathPrefix,
            }),
          ),
        );

        const updatedMap = new Map(
          currentChildren.map((item, index) => [
            item.id,
            {
              ...item,
              sortOrder: index + 1,
              parentId,
            },
          ] as const),
        );

        setNodes((current) => current.map((row) => updatedMap.get(row.id) ?? row));
        setDisplayNodes((current) => current.map((row) => updatedMap.get(row.id) ?? row));

        void showAlert({
          icon: 'success',
          title: 'บันทึกลำดับสำเร็จ',
          text: 'ระบบได้บันทึกการจัดเรียงเมนูเรียบร้อยแล้ว',
          timer: 1200,
          showConfirmButton: false,
        });
      } catch {
        setError('บันทึกลำดับเมนูไม่สำเร็จ');
      } finally {
        setIsSaving(false);
      }
    },
    [baselineIndex, displayIndex, showAlert],
  );

  const reorderChildren = useCallback(
    (parentId: number, activeId: number, overId: number) => {
      setDisplayNodes((current) => {
        const siblings = sortMenuRows(
          current.filter((node) => node.parentId === parentId && node.nodeType !== 'Folder'),
        );
        const oldIndex = siblings.findIndex((node) => node.id === activeId);
        const newIndex = siblings.findIndex((node) => node.id === overId);

        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return current;
        }

        const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex).map((node, index) => ({
          ...node,
          sortOrder: index + 1,
        }));
        const reorderedMap = new Map(reorderedSiblings.map((node) => [node.id, node] as const));

        return current.map((node) => reorderedMap.get(node.id) ?? node);
      });
    },
    [],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeItem = displayIndex.rowsById.get(activeId);
    const overItem = displayIndex.rowsById.get(overId);

    if (!activeItem || !overItem) {
      return;
    }

    if (activeItem.nodeType === 'Folder' || overItem.nodeType === 'Folder') {
      return;
    }

    if (activeItem.parentId == null || activeItem.parentId !== overItem.parentId) {
      return;
    }

    reorderChildren(activeItem.parentId, activeId, overId);
  }, [displayIndex.rowsById, reorderChildren]);

  const dirtyFolderIds = useMemo(() => {
    const dirty = new Set<number>();

    displayIndex.folders.forEach((folder) => {
      const currentChildren = getChildrenForParent(displayIndex, folder.id);
      const baselineChildren = getChildrenForParent(baselineIndex, folder.id);

      if (
        currentChildren.length !== baselineChildren.length ||
        currentChildren.some((item, index) => baselineChildren[index]?.id !== item.id)
      ) {
        dirty.add(folder.id);
      }
    });

    return dirty;
  }, [baselineIndex, displayIndex]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box
        sx={{
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          boxShadow: '0 18px 40px rgba(22,35,31,0.08), 0 3px 10px rgba(22,35,31,0.05)',
          background: 'linear-gradient(135deg, #edf5f1 0%, #ffffff 58%)',
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label="Menu Management"
            sx={{
              bgcolor: '#fff',
              color: 'rgb(22, 90, 80)',
              fontWeight: 800,
              border: '1px solid #cad4cf',
              height: 28,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: '#2f3a37', letterSpacing: '-0.03em' }}>
              จัดการโครงสร้างเมนู
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: '#7d8783', fontWeight: 700 }}>
            Dashboard / จัดการเมนู
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          boxShadow: '0 10px 24px rgba(22,35,31,0.06), 0 2px 6px rgba(22,35,31,0.04)',
          mb: 2,
          p: { xs: 1.25, md: 1.5 },
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <StockActionButton tone="success" startIcon={<AddIcon />} onClick={openCreate} disabled={isLoading || isSaving}>
          เพิ่มเมนู/โฟลเดอร์
        </StockActionButton>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={(event) => {
          void handleDragOver(event);
        }}
        onDragCancel={(_event: DragCancelEvent) => {
          setDisplayNodes(nodes);
        }}
        onDragEnd={() => undefined}
      >
        <Stack spacing={2}>
          {displayIndex.rootItems.length > 0 ? (
            <MenuManagementTableSection
              title="เมนูระดับบนสุด"
              borderColor="divider"
              headerBackground="action.hover"
              items={displayIndex.rootItems}
              isSaving={isSaving}
              emptyMessage="ยังไม่มีเมนูระดับบนสุด"
              onEdit={openEdit}
              onToggle={toggleItem}
              onDelete={deactivateItem}
            />
          ) : null}

          {displayIndex.orphanItems.length > 0 ? (
            <MenuManagementTableSection
              title="เมนูที่ยังไม่อยู่ใต้หมวดหลัก"
              borderColor="warning.main"
              headerBackground="warning.light"
              items={displayIndex.orphanItems}
              isSaving={isSaving}
              emptyMessage="ยังไม่มีเมนูที่ยังไม่อยู่ใต้หมวดหลัก"
              onEdit={openEdit}
              onToggle={toggleItem}
              onDelete={deactivateItem}
            />
          ) : null}

          {displayIndex.folders.map((folder) => {
            const children = displayIndex.childrenByParentId.get(folder.id) ?? [];

            return (
              <MenuManagementFolderAccordion
                key={folder.id}
                folder={folder}
                children={children}
                isSaving={isSaving}
                isDirty={dirtyFolderIds.has(folder.id)}
                onToggle={toggleItem}
                onEdit={openEdit}
                onDelete={deactivateItem}
                onCreateChild={openCreateChild}
                onSaveOrder={saveFolderOrder}
              />
            );
          })}
        </Stack>
      </DndContext>

      <MenuManagementDialog
        open={dialogOpen}
        isSaving={isSaving}
        mode={dialogMode}
        editing={editing}
        initialForm={dialogInitialForm}
        parentOptions={parentOptions}
        onClose={closeDialog}
        onStartEditing={startEditing}
        onSave={saveItem}
      />
    </Box>
  );
}
