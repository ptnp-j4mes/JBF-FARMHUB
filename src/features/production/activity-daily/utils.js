export const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

export const normalizeAgeDays = (value) => {
  const ageDays = Number(value);
  if (!Number.isFinite(ageDays) || ageDays < 0) return '';
  return String(Math.floor(ageDays) + 1);
};

export const calculateAgeDaysFromReceivedDate = (value) => {
  const text = String(value || '').trim();
  if (!text) return null;

  const datePart = text.slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return 0;

  return Math.floor(diffMs / 86400000) + 1;
};

export const formatDdmmyyFromIso = (isoDate) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) {
    return '000000';
  }
  const [year, month, day] = String(isoDate).split('-');
  return `${day}${month}${year.slice(-2)}`;
};

export const extractRun4FromMortalityDocNo = (mortalityDocNo) => {
  const text = String(mortalityDocNo || '').trim();
  const match = text.match(/-(\d{4})$/);
  return match ? match[1] : '';
};

export const extractRun4FromMortalityRowId = (rowId) => {
  const text = String(rowId || '').trim();
  const match = text.match(/^\d{6}-(\d{4})-\d{2}$/);
  return match ? match[1] : '';
};

export const getMortalityImageSrc = (row) =>
  row?.imageStorageUrl || row?.imageUrl || '';

export const normalizePotentialBuddhistIsoDate = (value) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return text;
  }

  let year = Number(match[1]);
  let guard = 0;
  while (year >= 2400 && guard < 8) {
    year -= 543;
    guard += 1;
  }

  return `${String(year).padStart(4, '0')}-${match[2]}-${match[3]}`;
};

export const normalizeHouseCode = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && typeof value.code === 'string') {
    return value.code;
  }
  return '';
};

export const getPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const sumAllocatedHeadcount = (allocations) =>
  (Array.isArray(allocations) ? allocations : []).reduce((sum, allocation) => {
    const headcount = getPositiveNumber(
      allocation?.allocatedHeadcount ?? allocation?.vaccinatedHeadcount,
    );
    return headcount > 0 ? sum + headcount : sum;
  }, 0);

export const buildBatchAllocationKey = (allocation) =>
  `${Number(allocation?.pigBatchId || 0)}:${Number(allocation?.buildingOpeningRequestId || 0)}`;

export const resolveFarmCodeFromContext = (facilities, rawCode) => {
  const normalizedCode = String(rawCode || '').trim();
  if (!normalizedCode) {
    return '';
  }

  const directMatch = facilities.find(
    (facility) => facility.code === normalizedCode,
  );
  if (directMatch) {
    return directMatch.code;
  }

  const parentMatch = facilities.find((facility) =>
    normalizedCode.startsWith(`${facility.code}-`),
  );
  return parentMatch?.code || '';
};

export const mergeBatchAllocations = (
  batchOptions,
  existingAllocations = [],
) => {
  const existingMap = new Map(
    (Array.isArray(existingAllocations) ? existingAllocations : []).map(
      (allocation) => [buildBatchAllocationKey(allocation), allocation],
    ),
  );

  return (Array.isArray(batchOptions) ? batchOptions : []).map((option) => {
    const existing = existingMap.get(buildBatchAllocationKey(option));
    const allocatedHeadcount = existing
      ? getPositiveNumber(existing.allocatedHeadcount ?? existing.vaccinatedHeadcount)
      : getPositiveNumber(option.allocatedHeadcount || option.availableQuantity);

    return {
      ...option,
      allocatedHeadcount,
      note: existing?.note ?? option?.note ?? '',
    };
  });
};

export const summarizeWarehouseBalances = (warehouseBalances) => {
  const warehouseMap = new Map();
  (Array.isArray(warehouseBalances) ? warehouseBalances : []).forEach(
    (balance) => {
      const warehouseId = Number(balance?.warehouseId || 0);
      if (warehouseId <= 0) return;
      const current = warehouseMap.get(warehouseId) ?? {
        warehouseId,
        warehouseName:
          balance?.warehouseName || `Warehouse ${warehouseId}`,
        totalAvailableQuantity: 0,
        uomName: balance?.uomName || '',
      };
      current.totalAvailableQuantity += getPositiveNumber(
        balance?.availableQuantity,
      );
      if (!current.uomName && balance?.uomName) {
        current.uomName = balance.uomName;
      }
      warehouseMap.set(warehouseId, current);
    },
  );
  return Array.from(warehouseMap.values());
};

export const sortHouseGroups = (groups) =>
  (Array.isArray(groups) ? groups : [])
    .map((group) => ({
      ...group,
      houses: [
        ...(Array.isArray(group?.houses) ? group.houses : []),
      ].sort((left, right) => {
        const leftHasLiveData =
          getPositiveNumber(left?.currentQuantity) > 0 ||
          getPositiveNumber(left?.ageDays) > 0;
        const rightHasLiveData =
          getPositiveNumber(right?.currentQuantity) > 0 ||
          getPositiveNumber(right?.ageDays) > 0;
        if (leftHasLiveData !== rightHasLiveData) {
          return rightHasLiveData ? 1 : -1;
        }

        return String(left?.code || '').localeCompare(
          String(right?.code || ''),
        );
      }),
    }))
    .sort((left, right) => {
      const leftHasLiveData = (left.houses || []).some(
        (house) =>
          getPositiveNumber(house?.currentQuantity) > 0 ||
          getPositiveNumber(house?.ageDays) > 0,
      );
      const rightHasLiveData = (right.houses || []).some(
        (house) =>
          getPositiveNumber(house?.currentQuantity) > 0 ||
          getPositiveNumber(house?.ageDays) > 0,
      );
      if (leftHasLiveData !== rightHasLiveData) {
        return rightHasLiveData ? 1 : -1;
      }

      return String(left?.id || '').localeCompare(String(right?.id || ''));
    });

export const resolvePlanStatusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'completed') return 'บันทึกผลจริงแล้ว';
  if (normalized === 'in-progress') return 'เชื่อม Daily แล้ว';
  if (normalized === 'pending') return 'รอยืนยันหน้างาน';
  return 'รอบันทึกผลจริง';
};

export const resolveMedRecordSource = (row) => {
  if (Number(row?.vaccinationPlanItemId) > 0) {
    return {
      label: 'ดึงจากแผนวัคซีน',
      helper: 'save/submit จะอัปเดตสถานะแผนวัคซีนรายการนี้',
      color: '#1d4ed8',
      bg: '#dbeafe',
    };
  }

  return {
    label: 'กรอกเอง',
    helper: 'รายการนี้ยังไม่ผูกกับแผนวัคซีน',
    color: '#475569',
    bg: '#e2e8f0',
  };
};

export const resolveWarehouseSummaryMeta = (summary) => {
  const status = String(summary?.status || 'empty').toLowerCase();
  if (status === 'enough') {
    return {
      label: `คลังพอ (${summary?.totalAvailableQuantity ?? 0} โดส)`,
      color: '#912018',
      bg: '#FEF3F2',
    };
  }
  if (status === 'available') {
    return {
      label: `มีในคลัง (${summary?.totalAvailableQuantity ?? 0} โดส)`,
      color: '#1d4ed8',
      bg: '#dbeafe',
    };
  }
  if (status === 'insufficient') {
    return {
      label: `คลังไม่พอ (ขาด ${summary?.shortageQuantity ?? 0} โดส)`,
      color: '#92400e',
      bg: '#fef3c7',
    };
  }
  return {
    label: 'ไม่พบ stock วัคซีนในคลัง',
    color: '#991b1b',
    bg: '#fee2e2',
  };
};

export const resolveWarehouseIssueMeta = (row) => {
  const status = String(row?.warehouseIssueStatus || '')
    .trim()
    .toUpperCase();
  if (status === 'ISSUED') {
    return {
      label: row?.stockTransactionDocumentNo
        ? `ตัด stock แล้ว (${row.stockTransactionDocumentNo})`
        : 'ตัด stock แล้ว',
      helper: 'submit สำเร็จและมีการสร้าง stock transaction แล้ว',
      color: '#912018',
      bg: '#FEF3F2',
    };
  }
  if (status === 'FAILED') {
    return {
      label: 'ตัด stock ไม่สำเร็จ',
      helper:
        row?.warehouseIssueMessage ||
        'กรุณาตรวจสอบ warehouse และ lot อีกครั้ง',
      color: '#991b1b',
      bg: '#fee2e2',
    };
  }
  if (Number(row?.warehouseId) > 0) {
    return {
      label: 'พร้อมตัด stock ตอน submit',
      helper: row?.lotNumber
        ? `คลัง ${row.warehouseName || row.warehouseId} / Lot ${row.lotNumber}`
        : row?.warehouseName
          ? `คลัง ${row.warehouseName}`
          : `คลัง ${row.warehouseId}`,
      color: '#1d4ed8',
      bg: '#dbeafe',
    };
  }
  return {
    label: 'ยังไม่ได้เลือกคลัง',
    helper: 'save ได้ แต่ submit จะไม่ผ่านจนกว่าจะระบุ warehouse',
    color: '#92400e',
    bg: '#fef3c7',
  };
};

export const formatPendingPlanChipLabel = (plan) => {
  const feedCode = String(plan?.feedItemCode || '-');
  const scheduledTime = String(plan?.scheduledTime || '').trim();
  const plannedKg = Number(plan?.plannedQtyKg ?? 0);
  const cartCount = Number(plan?.cartCount ?? 0);
  const isBagDisplay =
    Boolean(plan?.isBagDisplay) &&
    Number(plan?.kgPerDisplayUnit ?? 0) > 0;

  const appendCartCount = (label) =>
    cartCount > 0 ? `${label} • ${cartCount} คัน` : label;

  if (!isBagDisplay) {
    return appendCartCount(
      `${feedCode} (${plannedKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.)${scheduledTime ? ` ${scheduledTime}` : ''}`,
    );
  }

  const displayQtyRaw = Number(plan?.plannedDisplayQty ?? 0);
  const displayQty =
    displayQtyRaw > 0
      ? displayQtyRaw
      : plannedKg / Number(plan?.kgPerDisplayUnit ?? 1);
  const displayUomName = String(plan?.displayUomName || 'กระสอบ');

  return appendCartCount(
    `${feedCode} (${displayQty.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${displayUomName} (${plannedKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.))${scheduledTime ? ` ${scheduledTime}` : ''}`,
  );
};

export const buildPlanSwitchKey = (task) =>
  `${String(task?.groupId || '-')}:${String(task?.houseCode || '-')}`;
