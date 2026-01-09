export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  module: AuditModule;
  action: AuditActionType;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  severity: AuditSeverity;
  tags?: string[];
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  userName?: string;
  userRole?: string;
  module?: AuditModule;
  action?: AuditActionType;
  entityType?: string;
  entityId?: string;
  severity?: AuditSeverity;
  success?: boolean;
  searchTerm?: string;
  tags?: string[];
  ipAddress?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditSummary {
  totalEntries: number;
  successCount: number;
  failureCount: number;
  criticalCount: number;
  byModule: { [key: string]: number };
  byAction: { [key: string]: number };
  byUser: { [key: string]: number };
  topUsers: Array<{ userName: string; count: number }>;
  recentErrors: AuditTrailEntry[];
  timeline: Array<{ date: Date; count: number }>;
}

export interface ComplianceReport {
  id: string;
  reportType: ComplianceReportType;
  generatedDate: Date;
  generatedBy: string;
  startDate: Date;
  endDate: Date;
  department?: string;
  status: ReportStatus;
  findings: ComplianceFinding[];
  summary: ComplianceSummary;
  recommendations?: string[];
  approvedBy?: string;
  approvedDate?: Date;
  filePath?: string;
}

export interface ComplianceFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  affectedEntities: string[];
  detectedDate: Date;
  status: FindingStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedDate?: Date;
  evidence?: string[];
  riskLevel: RiskLevel;
}

export interface ComplianceSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningsCount: number;
  criticalIssues: number;
  complianceScore: number; // 0-100
  previousScore?: number;
  improvementPercentage?: number;
}

export interface DrugControlCompliance {
  id: string;
  checkDate: Date;
  controlledDrugs: ControlledDrugRecord[];
  totalStockValue: number;
  discrepanciesFound: number;
  ndpsCompliant: boolean;
  registerUpToDate: boolean;
  prescriptionsVerified: number;
  unlicensedDispensing: number;
  storageConditionsMet: boolean;
  securityMeasuresAdequate: boolean;
  staffTrainingCurrent: boolean;
  documentationComplete: boolean;
  issues: ComplianceFinding[];
  nextReviewDate: Date;
}

export interface ControlledDrugRecord {
  medicineId: string;
  medicineName: string;
  category: ControlledDrugCategory;
  licenseNumber?: string;
  currentStock: number;
  recordedStock: number;
  discrepancy: number;
  lastAuditDate: Date;
  prescriptionsIssued: number;
  dispensingRecords: number;
  allRecordsMatch: boolean;
  issues?: string[];
}

export interface TheftAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  detectedDate: Date;
  detectedBy: string; // system or user
  status: AlertStatus;
  medicineId?: string;
  medicineName?: string;
  discrepancyType: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancyQuantity: number;
  estimatedValue: number;
  location?: string;
  department?: string;
  lastAccessedBy?: string;
  lastAccessedDate?: Date;
  suspectedUsers?: string[];
  investigation?: Investigation;
  resolution?: AlertResolution;
  assignedTo?: string;
  assignedDate?: Date;
  notified: string[]; // list of notified persons
  escalated: boolean;
  escalationLevel?: number;
}

export interface Investigation {
  id: string;
  alertId: string;
  startedDate: Date;
  startedBy: string;
  status: InvestigationStatus;
  investigator: string;
  findings: string[];
  interviews: Interview[];
  evidenceCollected: Evidence[];
  conclusion?: string;
  recommendedAction?: string;
  completedDate?: Date;
  reportFilePath?: string;
}

export interface Interview {
  id: string;
  interviewDate: Date;
  interviewee: string;
  interviewer: string;
  summary: string;
  attachments?: string[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  collectedDate: Date;
  collectedBy: string;
  filePath?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date;
}

export interface AlertResolution {
  id: string;
  resolvedDate: Date;
  resolvedBy: string;
  resolutionType: ResolutionType;
  description: string;
  actionTaken: string;
  recoveredAmount?: number;
  disciplinaryAction?: string;
  personsInvolved?: string[];
  preventiveMeasures: string[];
  approvedBy?: string;
  approvedDate?: Date;
}

export interface DiscrepancyReport {
  id: string;
  reportDate: Date;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ADHOC';
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  totalValue: number;
  topDiscrepancies: Array<{
    medicineId: string;
    medicineName: string;
    discrepancy: number;
    value: number;
  }>;
  byDepartment: { [key: string]: number };
  trends: Array<{ date: Date; count: number; value: number }>;
  recommendations: string[];
}

export interface AuditConfiguration {
  autoAuditEnabled: boolean;
  auditFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  alertThresholds: {
    minorDiscrepancy: number; // percentage
    majorDiscrepancy: number; // percentage
    criticalValue: number; // rupees
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    recipients: string[];
  };
  retentionPeriod: number; // days
  complianceCheckSchedule: string; // cron expression
  automaticReportGeneration: boolean;
}

// Enums

export enum AuditModule {
  AUTHENTICATION = 'Authentication',
  INVENTORY = 'Inventory',
  PATIENTS = 'Patients',
  PRESCRIPTIONS = 'Prescriptions',
  PHARMACY = 'Pharmacy',
  AUDIT = 'Audit',
  REPORTS = 'Reports',
  ADMIN = 'Admin',
  SYSTEM = 'System'
}

export enum AuditActionType {
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  VIEW = 'View',
  EXPORT = 'Export',
  PRINT = 'Print',
  APPROVE = 'Approve',
  REJECT = 'Reject',
  DISPENSE = 'Dispense',
  RETURN = 'Return',
  ADJUST = 'Adjust',
  TRANSFER = 'Transfer',
  ACCESS_DENIED = 'Access Denied',
  ERROR = 'Error'
}

export enum AuditSeverity {
  INFO = 'Info',
  WARNING = 'Warning',
  ERROR = 'Error',
  CRITICAL = 'Critical'
}

export enum ComplianceReportType {
  DRUG_CONTROL = 'Drug Control',
  NDPS_COMPLIANCE = 'NDPS Compliance',
  INVENTORY_AUDIT = 'Inventory Audit',
  PRESCRIPTION_AUDIT = 'Prescription Audit',
  DISPENSING_AUDIT = 'Dispensing Audit',
  USER_ACCESS = 'User Access',
  GENERAL = 'General Compliance'
}

export enum ReportStatus {
  DRAFT = 'Draft',
  PENDING_REVIEW = 'Pending Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ARCHIVED = 'Archived'
}

export enum FindingCategory {
  STOCK_DISCREPANCY = 'Stock Discrepancy',
  UNAUTHORIZED_ACCESS = 'Unauthorized Access',
  MISSING_DOCUMENTATION = 'Missing Documentation',
  POLICY_VIOLATION = 'Policy Violation',
  DATA_INTEGRITY = 'Data Integrity',
  SECURITY_BREACH = 'Security Breach',
  EXPIRED_MEDICINES = 'Expired Medicines',
  CONTROLLED_DRUG_VIOLATION = 'Controlled Drug Violation'
}

export enum FindingSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum FindingStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  ESCALATED = 'Escalated'
}

export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  SEVERE = 'Severe'
}

export enum ControlledDrugCategory {
  NARCOTIC = 'Narcotic',
  PSYCHOTROPIC = 'Psychotropic',
  SCHEDULE_H = 'Schedule H',
  SCHEDULE_X = 'Schedule X',
  OTHER_CONTROLLED = 'Other Controlled'
}

export enum AlertType {
  STOCK_DISCREPANCY = 'Stock Discrepancy',
  UNUSUAL_DISPENSING = 'Unusual Dispensing',
  UNAUTHORIZED_ACCESS = 'Unauthorized Access',
  MISSING_STOCK = 'Missing Stock',
  EXPIRED_STOCK = 'Expired Stock',
  CONTROLLED_DRUG_ALERT = 'Controlled Drug Alert',
  SYSTEM_ANOMALY = 'System Anomaly'
}

export enum AlertSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum AlertStatus {
  NEW = 'New',
  ACKNOWLEDGED = 'Acknowledged',
  INVESTIGATING = 'Investigating',
  RESOLVED = 'Resolved',
  FALSE_ALARM = 'False Alarm',
  ESCALATED = 'Escalated'
}

export enum DiscrepancyType {
  SHORTAGE = 'Shortage',
  EXCESS = 'Excess',
  MISSING = 'Missing',
  DAMAGED = 'Damaged',
  EXPIRED = 'Expired',
  UNAUTHORIZED_REMOVAL = 'Unauthorized Removal'
}

export enum InvestigationStatus {
  INITIATED = 'Initiated',
  IN_PROGRESS = 'In Progress',
  PENDING_REVIEW = 'Pending Review',
  COMPLETED = 'Completed',
  CLOSED = 'Closed'
}

export enum EvidenceType {
  DOCUMENT = 'Document',
  PHOTOGRAPH = 'Photograph',
  VIDEO = 'Video',
  AUDIT_LOG = 'Audit Log',
  STATEMENT = 'Statement',
  PHYSICAL = 'Physical',
  DIGITAL = 'Digital'
}

export enum ResolutionType {
  RESOLVED = 'Resolved',
  THEFT_CONFIRMED = 'Theft Confirmed',
  ERROR_CORRECTION = 'Error Correction',
  SYSTEM_ERROR = 'System Error',
  FALSE_ALARM = 'False Alarm',
  PENDING_INVESTIGATION = 'Pending Investigation'
}
