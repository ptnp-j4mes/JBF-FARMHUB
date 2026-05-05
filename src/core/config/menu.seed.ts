import { type MenuGroupConfig } from './menu.config';
import { type MenuIconKey } from '@/lib/utils/menu-icons';

/**
 * Legacy hard-coded menu groups for development/testing or reference.
 * These are NOT used in production anymore as the menu is database-driven.
 */
export const LEGACY_SEED_MENU_GROUPS: MenuGroupConfig[] = [
  {
    id: 'operations',
    titleKey: 'หมวดปฏิบัติการ',
    roles: [],
    items: [
      { path: '/operations/dashboard', labelKey: 'แดชบอร์ด', icon: 'dashboard' as MenuIconKey },
      { path: '/operations/record', labelKey: 'บันทึกข้อมูล', icon: 'record' as MenuIconKey },
      { path: '/operations/stock', labelKey: 'สต็อกสุกร', icon: 'pigStock' as MenuIconKey },
    ],
  },
  {
    id: 'warehouse',
    titleKey: 'คลังสินค้า',
    roles: [],
    items: [
      { path: '/warehouse/material-stock', labelKey: 'คลังสินค้าและสต็อก', icon: 'warehouse' as MenuIconKey },
      { path: '/warehouse/purchase-request', labelKey: 'ใบขอซื้อวัสดุ', icon: 'purchase' as MenuIconKey },
      { path: '/warehouse/stock-replenishment', labelKey: 'ใบแจ้งเติมสต็อกคลังกลาง', icon: 'shoppingBag' as MenuIconKey },
      { path: '/warehouse/stock-booking', labelKey: 'จองสินค้าคลังกลาง', icon: 'shoppingBag' as MenuIconKey },
      { path: '/warehouse/stock-issue-request', labelKey: 'ใบขอเบิกวัสดุ', icon: 'assignment' as MenuIconKey },
      { path: '/warehouse/stock-adjustment-request', labelKey: 'ใบขอปรับยอด', icon: 'edit' as MenuIconKey },
    ],
  },
  {
    id: 'reports',
    titleKey: 'รายงาน',
    roles: [],
    items: [
      { path: '/reports/approvals', labelKey: 'รายการรออนุมัติ', icon: 'checkCircle' as MenuIconKey },
      { path: '/reports/stock-issue-approvals', labelKey: 'อนุมัติขอตัดสต๊อก', icon: 'approval' as MenuIconKey },
      { path: '/reports/stock-adjustment-approvals', labelKey: 'อนุมัติใบขอปรับสต๊อก', icon: 'edit' as MenuIconKey },
    ],
  },
  {
    id: 'admin',
    titleKey: 'ผู้ดูแลระบบ',
    roles: [],
    items: [
      { path: '/admin/user-assignment', labelKey: 'จัดการผู้ใช้งาน', icon: 'users' as MenuIconKey },
      { path: '/admin/menu-management', labelKey: 'จัดการเมนู', icon: 'list' as MenuIconKey },
    ],
  },
];
