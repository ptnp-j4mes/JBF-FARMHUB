import type { StockTransactionRow } from '../types';

export type ReceiveRoundMeta = {
  roundNumber: number;
  roundLabel: string;
  isCompletionRound: boolean;
  isReturned: boolean;
};

export function splitReceiptRemarks(remarks: string) {
  return remarks
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getReceiptReceiverLabel(row: StockTransactionRow): string {
  const receiverLine = splitReceiptRemarks(row.remarks).find((line) => line.startsWith('ผู้รับสินค้า:'));
  if (!receiverLine) {
    return row.createdByUsername || '-';
  }

  return receiverLine.replace('ผู้รับสินค้า:', '').trim() || row.createdByUsername || '-';
}

export function getReceiptPlainRemarks(row: StockTransactionRow): string {
  const lines = splitReceiptRemarks(row.remarks).filter((line) => !line.startsWith('ผู้รับสินค้า:'));
  return lines.join(' • ');
}

export function buildReceiveRoundMetaMap(rows: StockTransactionRow[]) {
  const byTransactionId = new Map<number, ReceiveRoundMeta>();
  const bySourceDocument = new Map<number, StockTransactionRow[]>();

  for (const row of rows) {
    if (!row.sourceDocumentId) {
      byTransactionId.set(row.id, {
        roundNumber: 1,
        roundLabel: 'รับของครั้งที่ 1',
        isCompletionRound: false,
        isReturned: splitReceiptRemarks(row.remarks).some((line) => line.includes('ตีกลับ')),
      });
      continue;
    }

    const bucket = bySourceDocument.get(row.sourceDocumentId) ?? [];
    bucket.push(row);
    bySourceDocument.set(row.sourceDocumentId, bucket);
  }

  for (const group of bySourceDocument.values()) {
    const ordered = [...group].sort((a, b) => {
      const timeDiff =
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      return timeDiff !== 0 ? timeDiff : a.id - b.id;
    });

    const latest = ordered[ordered.length - 1];

    ordered.forEach((row, index) => {
      const isReturned = splitReceiptRemarks(row.remarks).some((line) => line.includes('ตีกลับ')) ||
        row.sourceDocumentStatus === 'Returned';
      const isCompletionRound =
        latest.id === row.id && row.sourceDocumentStatus === 'Completed' && !isReturned;

      byTransactionId.set(row.id, {
        roundNumber: index + 1,
        roundLabel: `รับของครั้งที่ ${index + 1}`,
        isCompletionRound,
        isReturned,
      });
    });
  }

  return byTransactionId;
}
