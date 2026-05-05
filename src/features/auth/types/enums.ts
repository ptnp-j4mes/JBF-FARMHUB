/**
 * Auth Module - Enums
 * 
 * Enumerations and constants for Auth module
 */

/**
 * User Status
 */
export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Pending = 'Pending',
}

/**
 * Authentication Provider
 */
export enum AuthProvider {
  Local = 'Local',
  Google = 'Google',
  Microsoft = 'Microsoft',
  Facebook = 'Facebook',
}

/**
 * Permission Actions
 */
export enum PermissionAction {
  View = 'view',
  Add = 'add',
  Edit = 'edit',
  Submit = 'submit',
  SoftDelete = 'soft_delete',
  HardDelete = 'hard_delete',
  Approve = 'approve',
  Reject = 'reject',
  Export = 'export',
  Manage = 'manage',
  Upload = 'upload',
}

/**
 * Permission Resources
 */
export enum PermissionResource {
  User = 'User',
  Role = 'Role',
  PurchaseRequest = 'PurchaseRequest',
  StockTransaction = 'StockTransaction',
  Facility = 'Facility',
  MasterData = 'MasterData',
  Report = 'Report',
  Settings = 'Settings',
}
