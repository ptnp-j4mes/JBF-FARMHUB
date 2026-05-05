/**
 * Global Document Status Standards
 * Used across all modules (Purchase, Stock Replenish, etc.)
 */
export enum DocumentStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  PartiallyReceived = 'PartiallyReceived',
  Completed = 'Completed',
  Returned = 'Returned',
}
