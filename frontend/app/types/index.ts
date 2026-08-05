// ============= ENUMS =============
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  REGISTRY_OFFICER = "registry_officer",
  ACADEMIC_OFFICE = "academic_office",
  DEAN = "dean",
  FINANCE = "finance",
  EXAMINATION_OFFICE = "examination_office",
  STUDENT = "student",
  EMPLOYER = "employer",
  INTERNAL_AUDITOR = "internal_auditor"
}

export enum ClearanceStatus {
  PENDING = "pending",
  CLEARED = "cleared",
  NOT_CLEARED = "not_cleared"
}

export enum CertificateStatus {
  AWAITING_CLEARANCE = "awaiting_clearance",
  READY_FOR_COLLECTION = "ready_for_collection",
  ON_HOLD = "on_hold",
  COLLECTED = "collected",
  LOST = "lost",
  DAMAGED = "damaged",
  REPLACED = "replaced"
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  MISSED = "missed"
}

// ============= USER TYPES =============
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// ============= STUDENT TYPES =============
export interface Student {
  id: number;
  student_id: string;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  program: string;
  year_of_study: number;
}

// ============= CLEARANCE TYPES =============
export interface FinanceClearance {
  id: number;
  clearance_request_id: number;
  status: ClearanceStatus;
  remarks?: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  cleared_by?: number;
  cleared_at?: string;
}

export interface ExaminationClearance {
  id: number;
  clearance_request_id: number;
  status: ClearanceStatus;
  remarks?: string;
  results_released: boolean;
  program_completed: boolean;
  graduation_approved: boolean;
  no_missing_grades: boolean;
  credits_completed: boolean;
  cleared_by?: number;
  cleared_at?: string;
}

export interface ClearanceRequest {
  id: number;
  student_id: number;
  student_user_id: number;
  request_date: string;
  overall_status: string;
  collection_eligible: boolean;
  collection_eligible_date?: string;
  student?: Student;
  finance_clearance?: FinanceClearance;
  examination_clearance?: ExaminationClearance;
}

// ============= REGISTRY TYPES =============
export interface RegistryInventory {
  id: number;
  certificate_number: string;
  student_id: number;
  programme: string;
  graduation_year?: string;
  storage_location?: string;
  status: CertificateStatus;
  date_received: string;
  marked_available_by?: number;
  marked_available_at?: string;
  hold_reason?: string;
}

// ============= COLLECTION TYPES =============
export interface CollectionAppointment {
  id: number;
  student_id: number;
  certificate_id: number;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface CertificateCollection {
  id: number;
  certificate_id: number;
  student_id: number;
  collection_date: string;
  collection_method: string;
  identification_document: string;
  recipient_name: string;
  registry_officer_id: number;
}

// ============= DASHBOARD TYPES =============
export interface DashboardStats {
  total_students: number;
  pending_clearance: number;
  in_progress_clearance: number;
  cleared_students: number;
  finance_pending: number;
  finance_cleared: number;
  finance_not_cleared: number;
  examination_pending: number;
  examination_cleared: number;
  examination_not_cleared: number;
  certificates_ready: number;
  certificates_collected: number;
  appointments_scheduled: number;
  finance_queue: number;
  examination_queue: number;
  registry_queue: number;
}

// ============= API RESPONSE TYPES =============
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
}
