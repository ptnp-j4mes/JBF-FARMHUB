import type { TranslationTree } from '@/lib/text/types';

export const commonTh: TranslationTree = {
  actions: {
    search: 'ค้นหา',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    create: 'สร้าง',
    edit: 'แก้ไข',
    delete: 'ลบ',
    add: 'เพิ่ม',
    close: 'ปิด',
    confirm: 'ยืนยัน',
  },
  status: {
    active: 'ใช้งาน',
    inactive: 'ไม่ใช้งาน',
  },
  labels: {
    rowsPerPage: 'แถวต่อหน้า',
    loading: 'กำลังโหลดข้อมูล...',
    noData: 'ไม่พบข้อมูล',
    displayedRows: '{from}-{to} จาก {count}',
  },
  language: {
    thai: 'ไทย',
    english: 'อังกฤษ',
  },
  theme: {
    auto: 'อุปกรณ์',
    light: 'สว่าง',
    dark: 'มืด',
  },
};
