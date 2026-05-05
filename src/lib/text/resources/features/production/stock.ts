import type { TranslationTree } from '@/lib/text/types';

export const productionStockTh: TranslationTree = {
  page: {
    title: 'คลังวัตถุดิบ',
    subtitle: 'ตรวจสอบคงเหลือสินค้าแยกตามคลังและล็อต เพื่อการเบิกใช้งานที่แม่นยำ',
    actions: {
      refresh: 'รีเฟรช',
      export: 'ส่งออก',
    },
    searchPlaceholder: 'ค้นหาด้วยชื่อสินค้า, รหัสสินค้า, ล็อต หรือคลัง...',
    filterButton: 'ฟิลเตอร์',
  },
  filterPanel: {
    warehouse: 'คลังสินค้า',
    allWarehouses: 'ทุกคลัง',
    stockStatus: 'สถานะสต๊อก',
    allStatuses: 'ทุกสถานะ',
    lotStatus: 'สถานะล็อต',
    allLotStatuses: 'ทุกล็อต',
    withLot: 'มีเลขล็อต',
    withoutLot: 'ไม่มีเลขล็อต',
    reset: 'ล้างค่า',
    apply: 'ค้นหา',
  },
  alerts: {
    loadError: 'ไม่สามารถโหลดข้อมูลคลังสินค้าได้',
  },
  cards: {
    totalRecords: 'รายการคงเหลือ',
    uniqueItems: 'จำนวนสินค้า',
    uniqueWarehouses: 'จำนวนคลัง',
    lowStock: 'ใกล้หมด',
    outOfStock: 'หมดสต๊อก',
    totalQuantity: 'ปริมาณรวม',
  },
  table: {
    columns: {
      item: 'สินค้า',
      warehouse: 'คลัง',
      lot: 'ล็อต',
      stockCompact: 'คงเหลือ/สถานะ',
      balance: 'คงเหลือ',
      stockStatus: 'สถานะ',
    },
    stockStatus: {
      normal: 'ปกติ',
      low: 'ใกล้หมด',
      out: 'หมดสต๊อก',
    },
    noData: 'ไม่พบข้อมูลคลังสินค้า',
    totalItems: 'ทั้งหมด {count} รายการ',
  },
  export: {
    filenamePrefix: 'material-stock',
    columns: {
      itemCode: 'รหัสสินค้า',
      itemName: 'ชื่อสินค้า',
      warehouse: 'คลังสินค้า',
      lot: 'ล็อต',
      quantity: 'ปริมาณ',
      uom: 'หน่วย',
      status: 'สถานะ',
    },
  },
};
