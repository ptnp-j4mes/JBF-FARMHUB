export function parseStockNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value == null) return null;

  const normalized = String(value).trim().replace(/,/g, '');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isPositiveStockNumber(value: string | number | null | undefined): boolean {
  const parsed = parseStockNumber(value);
  return parsed != null && parsed > 0;
}

export function isNonNegativeStockNumber(value: string | number | null | undefined): boolean {
  const parsed = parseStockNumber(value);
  return parsed != null && parsed >= 0;
}

export function validatePositiveStockNumber(
  value: string | number | null | undefined,
  fieldLabel: string,
): string | null {
  const parsed = parseStockNumber(value);
  if (parsed == null || parsed <= 0) {
    return `${fieldLabel} ต้องมากกว่า 0`;
  }

  return null;
}

export function validateNonNegativeStockNumber(
  value: string | number | null | undefined,
  fieldLabel: string,
): string | null {
  const parsed = parseStockNumber(value);
  if (parsed == null) return null;
  if (parsed < 0) {
    return `${fieldLabel} ต้องไม่ติดลบ`;
  }

  return null;
}

export type StockValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  missingFields: string[];
  firstError: string | null;
};

type ValidationIssue = {
  field: string;
  message: string;
  missingField?: boolean;
};

function createValidationResult(issues: ValidationIssue[] = []): StockValidationResult {
  const errors: Record<string, string> = {};
  const missingFields: string[] = [];

  issues.forEach((issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
    if (issue.missingField) {
      missingFields.push(issue.field);
    }
  });

  return {
    isValid: issues.length === 0,
    errors,
    missingFields,
    firstError: issues[0]?.message ?? null,
  };
}

function addIssue(
  issues: ValidationIssue[],
  field: string,
  message: string,
  missingField = false,
): void {
  issues.push({ field, message, missingField });
}

export type ReceiveDraftValidationLine = {
  itemName: string;
  toWarehouseId: number | '';
  receiveQuantity: string | number | null | undefined;
  remainingQuantity: number | string | null | undefined;
  lotNumber?: string | null;
  lineRequiresLot: boolean;
  lineRequiresExpiry: boolean;
  expiryAllocations?: Array<{
    expiryDate?: string | null;
    quantity: string | number | null | undefined;
  }>;
  requiresFeedSiloManagement: boolean;
  allocations?: Array<{
    targetHouseId: number | '';
    feedSiloId: number | '';
    quantity: string | number | null | undefined;
  }>;
  unitCost: string | number | null | undefined;
  isPigRequest: boolean;
};

export function validateReceiveDraft(input: {
  purchaseRequestExists: boolean;
  activeLineCount: number;
  freightCost: string | number | null | undefined;
  lines: ReceiveDraftValidationLine[];
}): StockValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.purchaseRequestExists) {
    addIssue(issues, 'purchaseRequest', 'ไม่พบใบ PR ที่ต้องการรับสินค้า', true);
  }
  if (input.activeLineCount <= 0) {
    addIssue(issues, 'activeLines', 'กรุณาระบุจำนวนรับอย่างน้อย 1 รายการ', true);
  }

  const freightError = validateNonNegativeStockNumber(input.freightCost, 'ค่าขนส่ง');
  if (freightError) {
    addIssue(issues, 'freightCost', freightError);
  }

  input.lines.forEach((line, index) => {
    const prefix = `lines[${index}]`;

    if (!line.toWarehouseId) {
      addIssue(issues, `${prefix}.toWarehouseId`, `กรุณาเลือกคลังปลายทางของ ${line.itemName}`, true);
    }

    const receiveQuantityError = validatePositiveStockNumber(line.receiveQuantity, `จำนวนรับของ ${line.itemName}`);
    if (receiveQuantityError) {
      addIssue(issues, `${prefix}.receiveQuantity`, receiveQuantityError);
    }

    const receiveQuantity = parseStockNumber(line.receiveQuantity);
    const remainingQuantity = parseStockNumber(line.remainingQuantity);
    if (receiveQuantity != null && remainingQuantity != null && receiveQuantity > remainingQuantity) {
      addIssue(issues, `${prefix}.receiveQuantity`, `จำนวนรับของ ${line.itemName} เกินยอดคงค้าง`);
    }

    if (line.lineRequiresLot && !String(line.lotNumber ?? '').trim()) {
      addIssue(issues, `${prefix}.lotNumber`, `กรุณากรอก lot ของ ${line.itemName}`, true);
    }

    if (line.lineRequiresExpiry) {
      const expiryAllocations = line.expiryAllocations ?? [];
      if (expiryAllocations.length === 0) {
        addIssue(issues, `${prefix}.expiryAllocations`, `กรุณากรอกวันหมดอายุของ ${line.itemName}`, true);
      } else {
        let expirySum = 0;
        expiryAllocations.forEach((allocation, allocationIndex) => {
          const allocationPrefix = `${prefix}.expiryAllocations[${allocationIndex}]`;
          if (!String(allocation.expiryDate ?? '').trim()) {
            addIssue(issues, `${allocationPrefix}.expiryDate`, `กรุณากรอกวันหมดอายุของ ${line.itemName}`, true);
          }

          const expiryQtyError = validatePositiveStockNumber(
            allocation.quantity,
            `จำนวนวันหมดอายุของ ${line.itemName}`,
          );
          if (expiryQtyError) {
            addIssue(issues, `${allocationPrefix}.quantity`, expiryQtyError);
            return;
          }

          const expiryQty = parseStockNumber(allocation.quantity);
          if (expiryQty == null) {
            addIssue(issues, `${allocationPrefix}.quantity`, `กรุณาระบุจำนวนวันหมดอายุของ ${line.itemName}`, true);
            return;
          }

          expirySum += expiryQty;
        });

        if (receiveQuantity != null && expirySum !== receiveQuantity) {
          addIssue(issues, `${prefix}.expiryAllocations`, `จำนวนวันหมดอายุของ ${line.itemName} ต้องเท่ากับจำนวนรับ`);
        }
      }
    }

    if (line.requiresFeedSiloManagement) {
      const allocations = line.allocations ?? [];
      if (allocations.length === 0) {
        addIssue(issues, `${prefix}.allocations`, `กรุณาเพิ่มไซโลของ ${line.itemName}`, true);
      } else {
        let allocationSum = 0;
        const seenSiloIds = new Set<number>();

        allocations.forEach((allocation, allocationIndex) => {
          const allocationPrefix = `${prefix}.allocations[${allocationIndex}]`;
          if (!allocation.targetHouseId) {
            addIssue(issues, `${allocationPrefix}.targetHouseId`, `กรุณาเลือกโรงเรือนของ ${line.itemName}`, true);
          }
          if (!allocation.feedSiloId) {
            addIssue(issues, `${allocationPrefix}.feedSiloId`, `กรุณาเลือกไซโลของ ${line.itemName}`, true);
          } else if (seenSiloIds.has(Number(allocation.feedSiloId))) {
            addIssue(issues, `${allocationPrefix}.feedSiloId`, `ห้ามเลือกไซโลซ้ำใน ${line.itemName}`);
          } else {
            seenSiloIds.add(Number(allocation.feedSiloId));
          }

          const allocationQtyError = validatePositiveStockNumber(
            allocation.quantity,
            `จำนวนของไซโลของ ${line.itemName}`,
          );
          if (allocationQtyError) {
            addIssue(issues, `${allocationPrefix}.quantity`, allocationQtyError);
            return;
          }

          const allocationQty = parseStockNumber(allocation.quantity);
          if (allocationQty == null) {
            addIssue(issues, `${allocationPrefix}.quantity`, `กรุณาระบุจำนวนของไซโลให้ครบใน ${line.itemName}`, true);
            return;
          }

          allocationSum += allocationQty;
        });

        if (receiveQuantity != null && allocationSum !== receiveQuantity) {
          addIssue(issues, `${prefix}.allocations`, `จำนวนรวมที่จัดสรรไซโลของ ${line.itemName} ต้องเท่ากับจำนวนรับ`);
        }
      }
    }

    const unitCostError = validateNonNegativeStockNumber(line.unitCost, `ต้นทุนต่อหน่วยของ ${line.itemName}`);
    if (unitCostError) {
      addIssue(issues, `${prefix}.unitCost`, unitCostError);
    }

    if (line.isPigRequest) {
      const unitCost = parseStockNumber(line.unitCost);
      if (unitCost != null && unitCost < 0) {
        addIssue(issues, `${prefix}.unitCost`, `ต้นทุนต่อหน่วยของ ${line.itemName} ต้องไม่ติดลบ`);
      }
    }
  });

  return createValidationResult(issues);
}

export type IssueDraftValidationLine = {
  itemName: string;
  itemId: number | '';
  warehouseId: number | '';
  feedSiloId: number | '';
  stockLotId: number | '' | null | undefined;
  quantity: string | number | null | undefined;
  requiresFeedSilo?: boolean;
};

export function validateIssueDraft(input: {
  facilityId: number | '';
  lines: IssueDraftValidationLine[];
  issuePurpose?: string | null;
  usageTargetType?: string | null;
  usageZone?: string | null;
  usageHouseId?: number | null | '';
  submittedLineValidationError?: string | null;
}): StockValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.facilityId) {
    addIssue(issues, 'facilityId', 'กรุณาเลือกฟาร์มที่ใช้งาน', true);
  }
  if (!String(input.issuePurpose ?? '').trim()) {
    addIssue(issues, 'issuePurpose', 'กรุณาระบุวัตถุประสงค์การใช้', true);
  }
  if (!String(input.usageTargetType ?? '').trim()) {
    addIssue(issues, 'usageTargetType', 'กรุณาเลือกปลายทางการใช้', true);
  }

  input.lines.forEach((line, index) => {
    const prefix = `lines[${index}]`;
    if (!line.itemId) {
      addIssue(issues, `${prefix}.itemId`, `กรุณาเลือกสินค้าในรายการที่ ${index + 1}`, true);
    }
    if (!line.warehouseId) {
      addIssue(issues, `${prefix}.warehouseId`, `กรุณาเลือกคลังต้นทางของรายการที่ ${index + 1}`, true);
    }
    if (!line.stockLotId) {
      addIssue(issues, `${prefix}.stockLotId`, `กรุณาเลือก lot ของรายการที่ ${index + 1}`, true);
    }

    const quantityError = validatePositiveStockNumber(line.quantity, `จำนวนของรายการที่ ${index + 1}`);
    if (quantityError) {
      addIssue(issues, `${prefix}.quantity`, quantityError);
    }

    if (line.requiresFeedSilo && String(line.feedSiloId ?? '') === '') {
      addIssue(issues, `${prefix}.feedSiloId`, `กรุณาเลือกไซโลของรายการที่ ${index + 1}`, true);
    }
  });

  if (input.submittedLineValidationError?.trim()) {
    addIssue(issues, 'submittedLineValidationError', input.submittedLineValidationError.trim());
  }

  return createValidationResult(issues);
}

export type TransferDraftValidationLine = {
  itemId: number | '';
  uomId: number | '';
  fromWarehouseId: number | '';
  toWarehouseId: number | '';
  quantity: string | number | null | undefined;
  stockLotId: number | '' | null | undefined;
};

export function validateTransferDraft(input: {
  mode: 'transfer';
  lines: TransferDraftValidationLine[];
}): StockValidationResult {
  const issues: ValidationIssue[] = [];

  if (input.lines.length === 0) {
    addIssue(issues, 'lines', 'กรุณาเพิ่มรายการโอนอย่างน้อย 1 รายการ', true);
  }

  input.lines.forEach((line, index) => {
    const prefix = `lines[${index}]`;
    if (!line.itemId) {
      addIssue(issues, `${prefix}.itemId`, `กรุณาเลือกสินค้าในรายการที่ ${index + 1}`, true);
    }
    if (!line.uomId) {
      addIssue(issues, `${prefix}.uomId`, `กรุณาเลือกหน่วยนับของรายการที่ ${index + 1}`, true);
    }
    if (!line.fromWarehouseId) {
      addIssue(issues, `${prefix}.fromWarehouseId`, `กรุณาเลือกคลังต้นทางของรายการที่ ${index + 1}`, true);
    }
    if (!line.toWarehouseId) {
      addIssue(issues, `${prefix}.toWarehouseId`, `กรุณาเลือกคลังปลายทางของรายการที่ ${index + 1}`, true);
    }
    const quantityError = validatePositiveStockNumber(line.quantity, `จำนวนของรายการที่ ${index + 1}`);
    if (quantityError) {
      addIssue(issues, `${prefix}.quantity`, quantityError);
    }
    if (!line.stockLotId) {
      addIssue(issues, `${prefix}.stockLotId`, `กรุณาเลือก lot ของรายการที่ ${index + 1}`, true);
    }
  });

  return createValidationResult(issues);
}

export type AdjustDraftValidationInput = {
  warehouseId: number | '';
  itemId: number | '';
  uomId: number | '';
  stockLotId: number | '' | null | undefined;
  newQuantity: string | number | null | undefined;
  reason: string | null | undefined;
};

export function validateAdjustDraft(input: AdjustDraftValidationInput): StockValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.warehouseId) {
    addIssue(issues, 'warehouseId', 'กรุณาเลือกคลัง', true);
  }
  if (!input.itemId) {
    addIssue(issues, 'itemId', 'กรุณาเลือกสินค้า', true);
  }
  if (!input.uomId) {
    addIssue(issues, 'uomId', 'กรุณาเลือกหน่วยนับ', true);
  }

  const newQuantityError = validateNonNegativeStockNumber(input.newQuantity, 'จำนวนใหม่');
  if (newQuantityError) {
    addIssue(issues, 'newQuantity', newQuantityError);
  }

  if (!String(input.reason ?? '').trim()) {
    addIssue(issues, 'reason', 'กรุณาระบุเหตุผลในการขอปรับยอด', true);
  }

  const stockLotId = parseStockNumber(input.stockLotId);
  if (input.stockLotId != null && String(input.stockLotId).trim() !== '' && (stockLotId == null || stockLotId <= 0)) {
    addIssue(issues, 'stockLotId', 'Stock Lot Id ต้องมากกว่า 0');
  }

  return createValidationResult(issues);
}
