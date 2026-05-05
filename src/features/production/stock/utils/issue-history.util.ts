'use client';

import type { StockTransactionRow } from '../types';

const ISSUE_PREFIXES = {
  issuePurpose: 'วัตถุประสงค์การเบิก:',
  usageTargetType: 'ปลายทางการใช้:',
  usageFacilityName: 'สถานที่ใช้งาน:',
  usageZone: 'โซน:',
  usageHouseName: 'โรงเรือน:',
  requestedByName: 'ผู้ขอ:',
  receivedByName: 'ผู้รับ:',
  referenceDetail: 'รายละเอียดอ้างอิง:',
} as const;

export type IssueTransactionMeta = {
  issuePurpose: string;
  usageTargetType: string;
  usageFacilityName: string;
  usageZone: string;
  usageHouseName: string;
  requestedByName: string;
  receivedByName: string;
  referenceDetail: string;
  referenceNote: string;
  plainRemarks: string;
};

function extractReferenceSegment(referenceDetail: string, prefix: string): string {
  const segments = referenceDetail
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const matched = segments.find((segment) => segment.startsWith(prefix));
  return matched ? matched.slice(prefix.length).trim() : '';
}

function buildReferenceDetailForDisplay(referenceDetail: string): string {
  const detailNote = extractReferenceSegment(referenceDetail, 'รายละเอียดเพิ่มเติม:');
  if (detailNote) {
    return detailNote;
  }

  return referenceDetail
    .split('|')
    .map((segment) => segment.trim())
    .filter(
      (segment) =>
        segment &&
        !segment.startsWith('โซน:') &&
        !segment.startsWith('โรงเรือน:'),
    )
    .join(' | ');
}

function splitIssueRemarks(remarks: string): string[] {
  return remarks
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripKnownIssueMeta(remarks: string): string {
  let cleaned = remarks.trim();
  if (!cleaned) return '';

  const labels = [
    ISSUE_PREFIXES.issuePurpose,
    ISSUE_PREFIXES.usageTargetType,
    ISSUE_PREFIXES.usageFacilityName,
    ISSUE_PREFIXES.usageZone,
    ISSUE_PREFIXES.usageHouseName,
    ISSUE_PREFIXES.requestedByName,
    ISSUE_PREFIXES.receivedByName,
    ISSUE_PREFIXES.referenceDetail,
  ];

  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nextAlternatives = labels
      .filter((otherLabel) => otherLabel !== label)
      .map((otherLabel) => otherLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const pattern = nextAlternatives.length > 0
      ? new RegExp(`${escapedLabel}[\\s\\S]*?(?=${nextAlternatives.join('|')})`, 'g')
      : new RegExp(`${escapedLabel}[\\s\\S]*$`, 'g');

    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function parseIssueTransactionMeta(row: StockTransactionRow): IssueTransactionMeta {
  const lines = splitIssueRemarks(row.remarks);
  const meta: IssueTransactionMeta = {
    issuePurpose: row.issuePurpose?.trim() ?? '',
    usageTargetType: row.usageTargetType?.trim() ?? '',
    usageFacilityName: row.usageFacilityName?.trim() ?? '',
    usageZone: row.usageZone?.trim() ?? '',
    usageHouseName: row.usageHouseName?.trim() ?? '',
    requestedByName: row.requestedByName?.trim() ?? '',
    receivedByName: row.receivedByName?.trim() ?? '',
    referenceDetail: row.referenceDetail?.trim() ?? '',
    referenceNote: '',
    plainRemarks: '',
  };

  const plainLines: string[] = [];

  for (const line of lines) {
    if (!meta.issuePurpose && line.startsWith(ISSUE_PREFIXES.issuePurpose)) {
      meta.issuePurpose = line.slice(ISSUE_PREFIXES.issuePurpose.length).trim();
      continue;
    }
    if (!meta.usageTargetType && line.startsWith(ISSUE_PREFIXES.usageTargetType)) {
      meta.usageTargetType = line.slice(ISSUE_PREFIXES.usageTargetType.length).trim();
      continue;
    }
    if (!meta.usageFacilityName && line.startsWith(ISSUE_PREFIXES.usageFacilityName)) {
      meta.usageFacilityName = line.slice(ISSUE_PREFIXES.usageFacilityName.length).trim();
      continue;
    }
    if (!meta.usageZone && line.startsWith(ISSUE_PREFIXES.usageZone)) {
      meta.usageZone = line.slice(ISSUE_PREFIXES.usageZone.length).trim();
      continue;
    }
    if (!meta.usageHouseName && line.startsWith(ISSUE_PREFIXES.usageHouseName)) {
      meta.usageHouseName = line.slice(ISSUE_PREFIXES.usageHouseName.length).trim();
      continue;
    }
    if (!meta.requestedByName && line.startsWith(ISSUE_PREFIXES.requestedByName)) {
      meta.requestedByName = line.slice(ISSUE_PREFIXES.requestedByName.length).trim();
      continue;
    }
    if (!meta.receivedByName && line.startsWith(ISSUE_PREFIXES.receivedByName)) {
      meta.receivedByName = line.slice(ISSUE_PREFIXES.receivedByName.length).trim();
      continue;
    }
    if (!meta.referenceDetail && line.startsWith(ISSUE_PREFIXES.referenceDetail)) {
      meta.referenceDetail = line.slice(ISSUE_PREFIXES.referenceDetail.length).trim();
      continue;
    }

    plainLines.push(line);
  }

  meta.plainRemarks = plainLines.join('\n').trim();
  if (!meta.usageZone) {
    meta.usageZone = extractReferenceSegment(meta.referenceDetail, 'โซน:');
  }
  if (!meta.usageHouseName) {
    meta.usageHouseName = extractReferenceSegment(meta.referenceDetail, 'โรงเรือน:');
  }
  meta.plainRemarks = stripKnownIssueMeta(meta.plainRemarks);
  meta.referenceNote = buildReferenceDetailForDisplay(meta.referenceDetail);
  return meta;
}
