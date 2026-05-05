import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DocumentStatus } from '@/types/status.types';
import TestCentralStockAlertHub, {
  type CentralAlertItem,
  type CentralAlertRequest,
  type CentralAlertRequestStatus,
} from './TestCentralStockAlertHub';

const items: CentralAlertItem[] = [
  {
    id: 'item-1',
    code: 'CAF-001',
    name: 'กาแฟคั่วบด',
    unit: 'กก.',
    stockOnHand: 24,
    reorderPoint: 50,
    targetLevel: 120,
    isCentralItem: true,
    category: 'เครื่องดื่ม',
  },
  {
    id: 'item-2',
    code: 'VAC-CSF-001',
    name: 'วัคซีนอหิวาต์สุกร (CSF)',
    unit: 'โดส',
    stockOnHand: 180,
    reorderPoint: 100,
    targetLevel: 260,
    isCentralItem: true,
    category: 'เวชภัณฑ์',
  },
  {
    id: 'item-3',
    code: 'ITEM-DRUG-01',
    name: 'อหิวาตกโรค',
    unit: 'ขวด',
    stockOnHand: 40,
    reorderPoint: 20,
    targetLevel: 90,
    isCentralItem: false,
    category: 'เวชภัณฑ์',
  },
  {
    id: 'item-4',
    code: 'FG-0003-113GL',
    name: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.',
    unit: 'กระสอบ',
    stockOnHand: 12,
    reorderPoint: 18,
    targetLevel: 80,
    isCentralItem: true,
    category: 'อาหารสัตว์',
  },
];

const initialRequests: CentralAlertRequest[] = [
  {
    id: 'req-draft-1',
    requestNo: 'SRN-2604-0000',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขานนทัพฟาร์ม(NN)',
    sourceFacilityCode: 'F-NN-01',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Draft',
    urgency: 'normal',
    requestedByName: 'นาย คิริกายะ คิริโตะ',
    requestDate: '2026-04-26',
    requiredByDate: '2026-04-28',
    updatedAt: '26/04/2026 10:00',
    lines: [
      {
        id: 'line-draft-1',
        lineNo: 1,
        centralWarehouseItemId: 'item-1',
        itemCode: 'CAF-001',
        itemName: 'กาแฟคั่วบด',
        requestedQuantity: 10,
        unit: 'กก.',
        lineStatus: 'open',
      },
    ],
  },
  {
    id: 'req-1',
    requestNo: 'SRN-2604-0001',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขานนทัพฟาร์ม(NN)',
    sourceFacilityCode: 'F-NN-01',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'important',
    requestedByName: 'นาย คิริกายะ คิริโตะ',
    requestDate: '2026-04-24',
    requiredByDate: '2026-04-26',
    note: 'ขอเติมก่อนเริ่มรอบผลิตหน้า',
    updatedAt: '24/04/2026 09:10',
    lines: [
      {
        id: 'line-1',
        lineNo: 1,
        centralWarehouseItemId: 'item-1',
        itemCode: 'CAF-001',
        itemName: 'กาแฟคั่วบด',
        requestedQuantity: 80,
        unit: 'กก.',
        lineStatus: 'open',
        note: 'ใช้ในรอบผลิตสัปดาห์ถัดไป',
      },
      {
        id: 'line-2',
        lineNo: 2,
        centralWarehouseItemId: 'item-2',
        itemCode: 'VAC-CSF-001',
        itemName: 'วัคซีนอหิวาต์สุกร (CSF)',
        requestedQuantity: 140,
        unit: 'โดส',
        lineStatus: 'open',
      },
    ],
  },
  {
    id: 'req-2',
    requestNo: 'SRN-2604-0002',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาใต้',
    sourceFacilityCode: 'F-SD-02',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'critical',
    requestedByName: 'นาง กัญญา วิภา',
    requestDate: '2026-04-22',
    requiredByDate: '2026-04-24',
    updatedAt: '24/04/2026 10:05',
    lines: [
      {
        id: 'line-3',
        lineNo: 1,
        centralWarehouseItemId: 'item-4',
        itemCode: 'FG-0003-113GL',
        itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.',
        requestedQuantity: 50,
        unit: 'กระสอบ',
        lineStatus: 'open',
      },
    ],
  },
  {
    id: 'req-3',
    requestNo: 'SRN-2604-0003',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขากลาง',
    sourceFacilityCode: 'F-CN-03',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Approved',
    urgency: 'normal',
    requestedByName: 'นาย อาสึนะ สตาร์บัค',
    requestDate: '2026-04-23',
    requiredByDate: '2026-04-25',
    reviewedByName: 'ทีมคลังกลาง',
    reviewedAt: '24/04/2026 11:55',
    note: 'คลังกลางกำลังเตรียมเติม',
    updatedAt: '24/04/2026 11:40',
    lines: [
      {
        id: 'line-4',
        lineNo: 1,
        centralWarehouseItemId: 'item-1',
        itemCode: 'CAF-001',
        itemName: 'กาแฟคั่วบด',
        requestedQuantity: 25,
        approvedQuantity: 25,
        unit: 'กก.',
        lineStatus: 'approved',
      },
      {
        id: 'line-5',
        lineNo: 2,
        centralWarehouseItemId: 'item-4',
        itemCode: 'FG-0003-113GL',
        itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.',
        requestedQuantity: 20,
        approvedQuantity: 18,
        unit: 'กระสอบ',
        lineStatus: 'approved',
      },
    ],
  },
  {
    id: 'req-4',
    requestNo: 'SRN-2604-0004',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขานนทัพฟาร์ม(NN)',
    sourceFacilityCode: 'F-NN-01',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Returned',
    urgency: 'important',
    requestedByName: 'นาย คิริกายะ คิริโตะ',
    requestDate: '2026-04-21',
    requiredByDate: '2026-04-23',
    note: 'ตีกลับเพื่อแก้ไขจำนวน',
    updatedAt: '24/04/2026 09:10',
    lines: [
      {
        id: 'line-6',
        lineNo: 1,
        centralWarehouseItemId: 'item-1',
        itemCode: 'CAF-001',
        itemName: 'กาแฟคั่วบด',
        requestedQuantity: 50,
        unit: 'กก.',
        lineStatus: 'open',
      },
    ],
  },
  {
    id: 'req-5',
    requestNo: 'SRN-2604-0005',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาตะวันออก',
    sourceFacilityCode: 'F-ET-05',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'normal',
    requestedByName: 'นาง สมศรี มีสุข',
    requestDate: '2026-04-20',
    requiredByDate: '2026-04-22',
    updatedAt: '20/04/2026 14:00',
    lines: [{ id: 'line-7', lineNo: 1, centralWarehouseItemId: 'item-2', itemCode: 'VAC-CSF-001', itemName: 'วัคซีนอหิวาต์สุกร (CSF)', requestedQuantity: 200, unit: 'โดส', lineStatus: 'open' }],
  },
  {
    id: 'req-6',
    requestNo: 'SRN-2604-0006',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาเหนือ',
    sourceFacilityCode: 'F-NR-06',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Approved',
    urgency: 'normal',
    requestedByName: 'นาย พงษ์ศักดิ์ รัตน์',
    requestDate: '2026-04-19',
    requiredByDate: '2026-04-21',
    updatedAt: '21/04/2026 10:30',
    lines: [{ id: 'line-8', lineNo: 1, centralWarehouseItemId: 'item-4', itemCode: 'FG-0003-113GL', itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.', requestedQuantity: 100, approvedQuantity: 100, unit: 'กระสอบ', lineStatus: 'fulfilled' }],
  },
  {
    id: 'req-7',
    requestNo: 'SRN-2604-0007',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาตะวันตก',
    sourceFacilityCode: 'F-WT-07',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'important',
    requestedByName: 'นาง วรรณนา ใจดี',
    requestDate: '2026-04-18',
    requiredByDate: '2026-04-20',
    updatedAt: '18/04/2026 16:45',
    lines: [{ id: 'line-9', lineNo: 1, centralWarehouseItemId: 'item-1', itemCode: 'CAF-001', itemName: 'กาแฟคั่วบด', requestedQuantity: 40, unit: 'กก.', lineStatus: 'open' }],
  },
  {
    id: 'req-8',
    requestNo: 'SRN-2604-0008',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขานนทัพฟาร์ม(NN)',
    sourceFacilityCode: 'F-NN-01',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Approved',
    urgency: 'critical',
    requestedByName: 'นาย คิริกายะ คิริโตะ',
    requestDate: '2026-04-17',
    requiredByDate: '2026-04-19',
    updatedAt: '17/04/2026 11:20',
    lines: [{ id: 'line-10', lineNo: 1, centralWarehouseItemId: 'item-2', itemCode: 'VAC-CSF-001', itemName: 'วัคซีนอหิวาต์สุกร (CSF)', requestedQuantity: 300, approvedQuantity: 300, unit: 'โดส', lineStatus: 'approved' }],
  },
  {
    id: 'req-9',
    requestNo: 'SRN-2604-0009',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาใต้',
    sourceFacilityCode: 'F-SD-02',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'normal',
    requestedByName: 'นาง กัญญา วิภา',
    requestDate: '2026-04-16',
    requiredByDate: '2026-04-18',
    updatedAt: '16/04/2026 09:00',
    lines: [{ id: 'line-11', lineNo: 1, centralWarehouseItemId: 'item-4', itemCode: 'FG-0003-113GL', itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.', requestedQuantity: 60, unit: 'กระสอบ', lineStatus: 'open' }],
  },
  {
    id: 'req-10',
    requestNo: 'SRN-2604-0010',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขากลาง',
    sourceFacilityCode: 'F-CN-03',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Approved',
    urgency: 'important',
    requestedByName: 'นาย อาสึนะ สตาร์บัค',
    requestDate: '2026-04-15',
    requiredByDate: '2026-04-17',
    updatedAt: '17/04/2026 15:40',
    lines: [{ id: 'line-12', lineNo: 1, centralWarehouseItemId: 'item-1', itemCode: 'CAF-001', itemName: 'กาแฟคั่วบด', requestedQuantity: 15, approvedQuantity: 15, unit: 'กก.', lineStatus: 'approved' }],
  },
  {
    id: 'req-11',
    requestNo: 'SRN-2604-0011',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาตะวันออก',
    sourceFacilityCode: 'F-ET-05',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Draft',
    urgency: 'normal',
    requestedByName: 'นาง สมศรี มีสุข',
    requestDate: '2026-04-14',
    requiredByDate: '2026-04-16',
    updatedAt: '14/04/2026 11:15',
    lines: [{ id: 'line-13', lineNo: 1, centralWarehouseItemId: 'item-2', itemCode: 'VAC-CSF-001', itemName: 'วัคซีนอหิวาต์สุกร (CSF)', requestedQuantity: 50, unit: 'โดส', lineStatus: 'open' }],
  },
  {
    id: 'req-12',
    requestNo: 'SRN-2604-0012',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาเหนือ',
    sourceFacilityCode: 'F-NR-06',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Returned',
    urgency: 'important',
    requestedByName: 'นาย พงษ์ศักดิ์ รัตน์',
    requestDate: '2026-04-13',
    requiredByDate: '2026-04-15',
    updatedAt: '15/04/2026 09:40',
    lines: [{ id: 'line-14', lineNo: 1, centralWarehouseItemId: 'item-4', itemCode: 'FG-0003-113GL', itemName: 'อาหารสำหรับสุกรน้ำหนัก 15 - 25 กก.', requestedQuantity: 25, unit: 'กระสอบ', lineStatus: 'open' }],
  },
  {
    id: 'req-13',
    requestNo: 'SRN-2604-0013',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาตะวันตก',
    sourceFacilityCode: 'F-WT-07',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: 'Pending',
    urgency: 'normal',
    requestedByName: 'นาง วรรณนา ใจดี',
    requestDate: '2026-04-12',
    requiredByDate: '2026-04-14',
    updatedAt: '12/04/2026 14:20',
    lines: [{ id: 'line-15', lineNo: 1, centralWarehouseItemId: 'item-1', itemCode: 'CAF-001', itemName: 'กาแฟคั่วบด', requestedQuantity: 30, unit: 'กก.', lineStatus: 'open' }],
  },
  {
    id: 'req-14',
    requestNo: 'SRN-2604-0014',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาใต้',
    sourceFacilityCode: 'F-SD-02',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: DocumentStatus.Rejected,
    urgency: 'normal',
    requestedByName: 'นาย ประหยัด รัดเข็มขัด',
    requestDate: '2026-04-10',
    requiredByDate: '2026-04-12',
    updatedAt: '12/04/2026 10:00',
    lines: [{ id: 'line-16', lineNo: 1, centralWarehouseItemId: 'item-2', itemCode: 'VAC-CSF-001', itemName: 'วัคซีนอหิวาต์สุกร (CSF)', requestedQuantity: 50, unit: 'โดส', lineStatus: 'rejected' }],
  },
  {
    id: 'req-15',
    requestNo: 'SRN-2604-0015',
    sourceFacilityName: 'ฟาร์มเจบีเอฟ สาขาตะวันออก',
    sourceFacilityCode: 'F-ET-05',
    targetFacilityName: 'JBF Central',
    targetFacilityCode: 'CEN-001',
    status: DocumentStatus.Cancelled,
    urgency: 'normal',
    requestedByName: 'นาง สมศรี มีสุข',
    requestDate: '2026-04-09',
    requiredByDate: '2026-04-11',
    updatedAt: '09/04/2026 15:30',
    lines: [{ id: 'line-17', lineNo: 1, centralWarehouseItemId: 'item-1', itemCode: 'CAF-001', itemName: 'กาแฟคั่วบด', requestedQuantity: 5, unit: 'กก.', lineStatus: 'open' }],
  },
];

const meta: Meta<typeof TestCentralStockAlertHub> = {
  title: 'Test/Central Stock Replenishment',
  component: TestCentralStockAlertHub,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    currentFacilityName: 'ฟาร์มเจบีเอฟ สาขานนทัพฟาร์ม(NN)',
    currentFacilityCode: 'F-NN-01',
    currentUserName: 'นาย คิริกายะ คิริโตะ',
    centralHubName: 'JBF Central',
    centralHubCode: 'CEN-001',
    items,
    requests: initialRequests,
  },
};

export default meta;

type Story = StoryObj<typeof TestCentralStockAlertHub>;

function buildRequestNo(nextIndex: number) {
  return `SRN-2604-${String(nextIndex).padStart(4, '0')}`;
}

function InteractiveDemo(args: React.ComponentProps<typeof TestCentralStockAlertHub>) {
  const [requests, setRequests] = useState<CentralAlertRequest[]>(args.requests);

  const updateRequestStatus = (
    requestId: string,
    status: CentralAlertRequestStatus,
  ) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
            ...request,
            status,
            reviewedByName: status === DocumentStatus.Approved ? 'ทีมคลังกลาง' : request.reviewedByName,
            reviewedAt: status === DocumentStatus.Approved ? '24/04/2026 14:35' : request.reviewedAt,
            closedAt: status === DocumentStatus.Completed ? '24/04/2026 15:10' : request.closedAt,
            updatedAt: '24/04/2026 14:35',
            lines: request.lines.map((line) => ({
              ...line,
              approvedQuantity: status === DocumentStatus.Approved ? line.requestedQuantity : line.approvedQuantity,
              lineStatus:
                status === DocumentStatus.Approved
                  ? 'approved'
                  : status === DocumentStatus.Completed
                    ? 'fulfilled'
                    : status === DocumentStatus.Rejected
                      ? 'rejected'
                      : line.lineStatus,
            })),
          }
          : request,
      ),
    );
  };

  return (
    <TestCentralStockAlertHub
      {...args}
      requests={requests}
      onCreateRequest={(payload) => {
        setRequests((current) => {
          const nextIndex = current.length + 1;
          const nextRequest: CentralAlertRequest = {
            id: `req-new-${nextIndex}`,
            requestNo: buildRequestNo(nextIndex),
            sourceFacilityName: payload.sourceFacilityName,
            sourceFacilityCode: payload.sourceFacilityCode,
            targetFacilityName: payload.targetFacilityName,
            targetFacilityCode: payload.targetFacilityCode,
            status: 'Pending',
            urgency: payload.urgency,
            requestedByName: args.currentUserName,
            requestDate: '2026-04-24',
            requiredByDate: payload.requiredByDate,
            note: payload.note,
            updatedAt: '24/04/2026 14:30',
            lines: payload.lines.map((line, index) => {
              const item = items.find((candidate) => candidate.id === line.centralWarehouseItemId);

              return {
                id: `line-new-${nextIndex}-${index + 1}`,
                lineNo: index + 1,
                centralWarehouseItemId: line.centralWarehouseItemId,
                itemCode: item?.code ?? '-',
                itemName: item?.name ?? 'ไม่พบ item',
                requestedQuantity: line.requestedQuantity,
                approvedQuantity: undefined,
                unit: item?.unit ?? '-',
                lineStatus: 'open',
                note: line.note,
              };
            }),
          };

          return [nextRequest, ...current];
        });
      }}
      onActionRequest={(requestId, action) => {
        const nextStatusByAction = {
          approve: DocumentStatus.Approved,
          reject: DocumentStatus.Rejected,
        } as const;

        updateRequestStatus(requestId, nextStatusByAction[action]);
      }}
    />
  );
}

export const FarmScope: Story = {
  args: {
    scope: 'farm',
  },
  render: (args) => <InteractiveDemo {...args} />,
};

export const CentralScope: Story = {
  args: {
    scope: 'central',
    currentFacilityName: 'JBF Central',
    currentFacilityCode: 'CEN-001',
  },
  render: (args) => <InteractiveDemo {...args} />,
};

export const EmptyInbox: Story = {
  args: {
    scope: 'central',
    requests: [],
    currentFacilityName: 'JBF Central',
    currentFacilityCode: 'CEN-001',
  },
  render: (args) => <InteractiveDemo {...args} />,
};

export const DenseDashboard: Story = {
  args: {
    scope: 'central',
    currentFacilityName: 'JBF Central',
    currentFacilityCode: 'CEN-001',
  },
  render: (args) => <InteractiveDemo {...args} />,
};
