import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TestCentralPRDemo, { PRLine } from './TestCentralPRDemo';

const meta: Meta<typeof TestCentralPRDemo> = {
  title: 'Test/Central PR Flow Demo',
  component: TestCentralPRDemo,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TestCentralPRDemo>;

const initialStandardLines: PRLine[] = [
  { id: '1', itemCode: 'FG-0003-113GL', itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.', quantity: 100, unit: 'กระสอบ', estimatedPrice: 450, note: '', source: 'ซื้อภายนอก' },
];

const mockConsolidatedLines: PRLine[] = [
  { id: '1', itemCode: 'CAF-001', itemName: 'กาแฟคั่วบด', quantity: 105, requestedQuantity: 105, unit: 'กก.', estimatedPrice: 120, note: '', source: 'ซื้อภายนอก', references: ['SRN-0001', 'SRN-0003'] },
  { id: '2', itemCode: 'VAC-CSF-001', name: 'วัคซีนอหิวาต์สุกร (CSF)', quantity: 140, requestedQuantity: 140, unit: 'โดส', estimatedPrice: 85, note: 'ใช้ด่วน', source: 'ซื้อภายนอก', references: ['SRN-0001'] },
  { id: '3', itemCode: 'FG-0003-113GL', itemName: 'อาหารสำหรับสุกร', quantity: 68, requestedQuantity: 68, unit: 'กระสอบ', estimatedPrice: 450, note: '', source: 'ซื้อภายนอก', references: ['SRN-0002', 'SRN-0003'] },
];

const centralItems = [
  { id: 'item-1', code: 'CAF-001', name: 'กาแฟคั่วบด', unit: 'กก.', price: 120 },
  { id: 'item-2', code: 'VAC-CSF-001', name: 'วัคซีนอหิวาต์สุกร (CSF)', unit: 'โดส', price: 85 },
  { id: 'item-3', code: 'FG-0003-113GL', name: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.', unit: 'กระสอบ', price: 450 },
  { id: 'item-4', code: 'TOOL-001', name: 'อุปกรณ์ทำความสะอาดพื้น', unit: 'ชิ้น', price: 320 },
];

const mockPRData = [
  { id: 'PR-2604-0001', date: '26/04/2026', requester: 'นาย สมชาย', items: 2, urgency: 'normal', status: 'Pending' },
  { id: 'PR-2604-0002', date: '24/04/2026', requester: 'นาย สมศักดิ์', items: 1, urgency: 'important', status: 'Approved' },
  { id: 'PR-2604-0003', date: '22/04/2026', requester: 'นาย สมหมาย', items: 3, urgency: 'critical', status: 'Approved' },
  { id: 'PR-2604-0004', date: '21/04/2026', requester: 'นาย วิชัย', items: 5, urgency: 'normal', status: 'Approved' },
  { id: 'PR-2604-0005', date: '20/04/2026', requester: 'นาง มาลี', items: 1, urgency: 'important', status: 'Pending' },
  { id: 'PR-2604-0006', date: '19/04/2026', requester: 'นาย ประหยัด', items: 4, urgency: 'normal', status: 'Draft' },
  { id: 'PR-2604-0007', date: '18/04/2026', requester: 'นาย บุญมา', items: 2, urgency: 'critical', status: 'Approved' },
  { id: 'PR-2604-0008', date: '17/04/2026', requester: 'นาย สายชล', items: 3, urgency: 'normal', status: 'Pending' },
  { id: 'PR-2604-0009', date: '16/04/2026', requester: 'นาง จิตรา', items: 1, urgency: 'important', status: 'Approved' },
  { id: 'PR-2604-0010', date: '15/04/2026', requester: 'นาย อานนท์', items: 6, urgency: 'normal', status: 'Draft' },
  { id: 'PR-2604-0011', date: '14/04/2026', requester: 'นาย ธนา', items: 2, urgency: 'critical', status: 'Pending' },
  { id: 'PR-2604-0012', date: '13/04/2026', requester: 'นาย สุรชัย', items: 3, urgency: 'normal', status: 'Draft' },
  { id: 'PR-2604-0013', date: '12/04/2026', requester: 'นาย สิทธิโชค', items: 1, urgency: 'important', status: 'Returned' },
  { id: 'PR-2604-0014', date: '11/04/2026', requester: 'นาง กรองกาญจน์', items: 2, urgency: 'normal', status: 'Rejected' },
  { id: 'PR-2604-0015', date: '10/04/2026', requester: 'นาย อติรุจ', items: 3, urgency: 'normal', status: 'PartiallyReceived' },
  { id: 'PR-2604-0016', date: '09/04/2026', requester: 'นาย ปริญญา', items: 1, urgency: 'important', status: 'Completed' },
  { id: 'PR-2604-0017', date: '08/04/2026', requester: 'นาง วิลาสินี', items: 4, urgency: 'critical', status: 'Cancelled' },
];

export const FarmScope: Story = {
  args: {
    scope: 'farm',
    initialStandardLines,
    mockConsolidatedLines,
    centralItems,
    mockPRData,
  },
  parameters: {
    docs: {
      description: {
        story: 'หน้าจอ PR ของฝั่งฟาร์ม (UI เดิม) - ใช้สร้างคำขอซื้อแบบ Manual ปกติ',
      },
    },
  },
};

export const CentralScope: Story = {
  args: {
    scope: 'central',
    initialStandardLines,
    mockConsolidatedLines,
    centralItems,
    mockPRData,
  },
  parameters: {
    docs: {
      description: {
        story: 'หน้าจอ PR ของคลังกลาง - มีปุ่ม "สร้าง PR รวมยอดจากคำขอฟาร์ม" เพิ่มเข้ามาเพื่อดึงข้อมูลใบแจ้งเตือนที่อนุมัติแล้วมามัดรวมกัน',
      },
    },
  },
};
