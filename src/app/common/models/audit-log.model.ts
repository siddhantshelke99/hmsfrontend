export interface AuditLog {
  id?: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: 'ADMIN' | 'DOCTOR' | 'PHARMACY';
  action: AuditAction;
  module: AuditModule;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  details?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  ACCESS = 'ACCESS',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DISPENSE = 'DISPENSE',
  RETURN = 'RETURN',
  ADJUST = 'ADJUST',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ERROR = 'ERROR'
}

export enum AuditModule {
  INVENTORY = 'INVENTORY',
  PRESCRIPTION = 'PRESCRIPTION',
  PATIENT = 'PATIENT',
  PHARMACY = 'PHARMACY',
  AUTHENTICATION = 'AUTHENTICATION',
  REPORTS = 'REPORTS',
  AUDIT = 'AUDIT'
}

export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  module?: AuditModule;
  severity?: string;
}
