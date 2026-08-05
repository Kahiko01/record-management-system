"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '../types';
import { authApi } from '../lib/api';
import axios from 'axios';

export enum Permission {
  STUDENT_VIEW_CERTIFICATE_STATUS = "student:view_certificate_status",
  STUDENT_VIEW_COLLECTION_STATUS = "student:view_collection_status",
  STUDENT_VIEW_CLEARANCE_PROGRESS = "student:view_clearance_progress",
  STUDENT_UPDATE_CONTACT = "student:update_contact",
  STUDENT_VIEW_APPOINTMENT = "student:view_appointment",
  STUDENT_CANCEL_APPOINTMENT = "student:cancel_appointment",
  STUDENT_RESCHEDULE_APPOINTMENT = "student:reschedule_appointment",
  STUDENT_APPLY_CLEARANCE = "student:apply_clearance",
  STUDENT_VIEW_OWN_NOTIFICATIONS = "student:view_own_notifications",
  FINANCE_VIEW_DASHBOARD = "finance:view_dashboard",
  FINANCE_SEARCH_STUDENTS = "finance:search_students",
  FINANCE_VIEW_PENDING = "finance:view_pending",
  FINANCE_VIEW_HISTORY = "finance:view_history",
  FINANCE_VIEW_REPORTS = "finance:view_reports",
  FINANCE_APPROVE = "finance:approve",
  FINANCE_REJECT = "finance:reject",
  FINANCE_RETURN_FOR_REVIEW = "finance:return_for_review",
  FINANCE_ADD_COMMENTS = "finance:add_comments",
  FINANCE_EXPORT_REPORTS = "finance:export_reports",
  FINANCE_CREATE_NOTIFICATION = "finance:create_notification",
  EXAM_VIEW_DASHBOARD = "exam:view_dashboard",
  EXAM_VIEW_PENDING = "exam:view_pending",
  EXAM_VERIFY_ACADEMIC = "exam:verify_academic",
  EXAM_APPROVE = "exam:approve",
  EXAM_REJECT = "exam:reject",
  EXAM_RETURN_FOR_REVIEW = "exam:return_for_review",
  EXAM_ADD_REMARKS = "exam:add_remarks",
  EXAM_VIEW_REPORTS = "exam:view_reports",
  EXAM_EXPORT_REPORTS = "exam:export_reports",
  EXAM_CREATE_NOTIFICATION = "exam:create_notification",
  DEAN_VIEW_DASHBOARD = "dean:view_dashboard",
  DEAN_VIEW_PENDING = "dean:view_pending",
  DEAN_APPROVE = "dean:approve",
  DEAN_REJECT = "dean:reject",
  DEAN_ADD_REMARKS = "dean:add_remarks",
  DEAN_VIEW_REPORTS = "dean:view_reports",
  REGISTRY_VIEW_DASHBOARD = "registry:view_dashboard",
  REGISTRY_SEARCH_CLEARED = "registry:search_cleared",
  REGISTRY_SEARCH_INVENTORY = "registry:search_inventory",
  REGISTRY_VIEW_INVENTORY = "registry:view_inventory",
  REGISTRY_ADD_INVENTORY = "registry:add_inventory",
  REGISTRY_UPDATE_INVENTORY = "registry:update_inventory",
  REGISTRY_ARCHIVE_INVENTORY = "registry:archive_inventory",
  REGISTRY_REMOVE_INVENTORY = "registry:remove_inventory",
  REGISTRY_ASSIGN_STORAGE = "registry:assign_storage",
  REGISTRY_UPDATE_STORAGE = "registry:update_storage",
  REGISTRY_MARK_AVAILABLE = "registry:mark_available",
  REGISTRY_MARK_ON_HOLD = "registry:mark_on_hold",
  REGISTRY_SCHEDULE_COLLECTION = "registry:schedule_collection",
  REGISTRY_VERIFY_IDENTITY = "registry:verify_identity",
  REGISTRY_VERIFY_COLLECTION = "registry:verify_collection",
  REGISTRY_RECORD_COLLECTION = "registry:record_collection",
  REGISTRY_CANCEL_COLLECTION = "registry:cancel_collection",
  REGISTRY_MANAGE_REPLACEMENT = "registry:manage_replacement",
  REGISTRY_VIEW_REPORTS = "registry:view_reports",
  REGISTRY_EXPORT_REPORTS = "registry:export_reports",
  REGISTRY_CREATE_NOTIFICATION = "registry:create_notification",
  STORAGE_CREATE_LOCATION = "storage:create_location",
  STORAGE_UPDATE_LOCATION = "storage:update_location",
  STORAGE_DELETE_LOCATION = "storage:delete_location",
  STORAGE_VIEW = "storage:view",
  STORAGE_ASSIGN_CERTIFICATE = "storage:assign_certificate",
  STORAGE_TRANSFER_CERTIFICATE = "storage:transfer_certificate",
  STORAGE_AUDIT = "storage:audit",
  AUDITOR_VIEW_LOGS = "auditor:view_logs",
  AUDITOR_VIEW_LOGIN_HISTORY = "auditor:view_login_history",
  AUDITOR_VIEW_ACTIVITY = "auditor:view_activity",
  AUDITOR_VIEW_CLEARANCE_HISTORY = "auditor:view_clearance_history",
  AUDITOR_VIEW_COLLECTION_HISTORY = "auditor:view_collection_history",
  AUDITOR_VIEW_REPORTS = "auditor:view_reports",
  AUDITOR_EXPORT_REPORTS = "auditor:export_reports",
  AUDITOR_SEARCH_LOGS = "auditor:search_logs",
  NOTIFICATION_CREATE = "notification:create",
  NOTIFICATION_UPDATE = "notification:update",
  NOTIFICATION_DELETE = "notification:delete",
  NOTIFICATION_SEND = "notification:send",
  NOTIFICATION_VIEW_ALL = "notification:view_all",
  NOTIFICATION_BROADCAST = "notification:broadcast",
  NOTIFICATION_MANAGE_SETTINGS = "notification:manage_settings",
  SEARCH_STUDENTS = "search:students",
  SEARCH_REGISTRY_INVENTORY = "search:registry_inventory",
  SEARCH_AUDIT_LOGS = "search:audit_logs",
  SEARCH_COLLECTIONS = "search:collections",
  SEARCH_CLEARANCE_REQUESTS = "search:clearance_requests",
  SEARCH_USERS = "search:users",
  USER_CREATE = "user:create",
  USER_VIEW = "user:view",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_ACTIVATE = "user:activate",
  USER_DEACTIVATE = "user:deactivate",
  USER_RESET_PASSWORD = "user:reset_password",
  USER_ASSIGN_ROLE = "user:assign_role",
  USER_REMOVE_ROLE = "user:remove_role",
  USER_LOCK = "user:lock",
  USER_UNLOCK = "user:unlock",
  DASHBOARD_VIEW_STUDENT = "dashboard:view_student",
  DASHBOARD_VIEW_FINANCE = "dashboard:view_finance",
  DASHBOARD_VIEW_EXAMINATION = "dashboard:view_examination",
  DASHBOARD_VIEW_DEAN = "dashboard:view_dean",
  DASHBOARD_VIEW_REGISTRY = "dashboard:view_registry",
  DASHBOARD_VIEW_AUDITOR = "dashboard:view_auditor",
  DASHBOARD_VIEW_ADMIN = "dashboard:view_admin",
  ADMIN_MANAGE_USERS = "admin:manage_users",
  ADMIN_MANAGE_ROLES = "admin:manage_roles",
  ADMIN_MANAGE_DEPARTMENTS = "admin:manage_departments",
  ADMIN_VIEW_ALL_DASHBOARDS = "admin:view_all_dashboards",
  ADMIN_VIEW_ALL_REPORTS = "admin:view_all_reports",
  ADMIN_VIEW_ALL_LOGS = "admin:view_all_logs",
  ADMIN_CONFIGURE_SYSTEM = "admin:configure_system",
  ADMIN_MANAGE_INVENTORY = "admin:manage_inventory",
  ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts",
  ADMIN_RESET_PASSWORDS = "admin:reset_passwords",
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  student: [
    Permission.STUDENT_VIEW_CERTIFICATE_STATUS, Permission.STUDENT_VIEW_COLLECTION_STATUS,
    Permission.STUDENT_VIEW_CLEARANCE_PROGRESS, Permission.STUDENT_UPDATE_CONTACT,
    Permission.STUDENT_VIEW_APPOINTMENT, Permission.STUDENT_CANCEL_APPOINTMENT,
    Permission.STUDENT_RESCHEDULE_APPOINTMENT, Permission.STUDENT_APPLY_CLEARANCE,
    Permission.STUDENT_VIEW_OWN_NOTIFICATIONS, Permission.DASHBOARD_VIEW_STUDENT,
  ],
  finance: [
    Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_SEARCH_STUDENTS,
    Permission.FINANCE_VIEW_PENDING, Permission.FINANCE_VIEW_HISTORY,
    Permission.FINANCE_VIEW_REPORTS, Permission.FINANCE_APPROVE,
    Permission.FINANCE_REJECT, Permission.FINANCE_RETURN_FOR_REVIEW,
    Permission.FINANCE_ADD_COMMENTS, Permission.FINANCE_EXPORT_REPORTS,
    Permission.FINANCE_CREATE_NOTIFICATION, Permission.SEARCH_STUDENTS,
    Permission.DASHBOARD_VIEW_FINANCE,
    Permission.STORAGE_VIEW, Permission.STORAGE_CREATE_LOCATION,
    Permission.STORAGE_UPDATE_LOCATION, Permission.STORAGE_ASSIGN_CERTIFICATE,
  ],
  examination_office: [
    Permission.EXAM_VIEW_DASHBOARD, Permission.EXAM_VIEW_PENDING,
    Permission.EXAM_VERIFY_ACADEMIC, Permission.EXAM_APPROVE,
    Permission.EXAM_REJECT, Permission.EXAM_RETURN_FOR_REVIEW,
    Permission.EXAM_ADD_REMARKS, Permission.EXAM_VIEW_REPORTS,
    Permission.EXAM_EXPORT_REPORTS, Permission.EXAM_CREATE_NOTIFICATION,
    Permission.SEARCH_STUDENTS, Permission.DASHBOARD_VIEW_EXAMINATION,
    Permission.STORAGE_VIEW, Permission.STORAGE_CREATE_LOCATION,
    Permission.STORAGE_UPDATE_LOCATION, Permission.STORAGE_ASSIGN_CERTIFICATE,
  ],
  dean: [
    Permission.DEAN_VIEW_DASHBOARD, Permission.DEAN_VIEW_PENDING,
    Permission.DEAN_APPROVE, Permission.DEAN_REJECT,
    Permission.DEAN_ADD_REMARKS, Permission.DEAN_VIEW_REPORTS,
    Permission.SEARCH_STUDENTS, Permission.DASHBOARD_VIEW_DEAN,
    Permission.STORAGE_VIEW, Permission.STORAGE_CREATE_LOCATION,
    Permission.STORAGE_UPDATE_LOCATION, Permission.STORAGE_ASSIGN_CERTIFICATE,
  ],
  registry_officer: [
    Permission.REGISTRY_VIEW_DASHBOARD, Permission.REGISTRY_SEARCH_CLEARED,    
Permission.REGISTRY_SEARCH_INVENTORY, Permission.REGISTRY_VIEW_INVENTORY,
    Permission.REGISTRY_ADD_INVENTORY, Permission.REGISTRY_UPDATE_INVENTORY,
    Permission.REGISTRY_ARCHIVE_INVENTORY, Permission.REGISTRY_REMOVE_INVENTORY,
    Permission.REGISTRY_ASSIGN_STORAGE, Permission.REGISTRY_UPDATE_STORAGE,
    Permission.REGISTRY_MARK_AVAILABLE, Permission.REGISTRY_MARK_ON_HOLD,
    Permission.REGISTRY_SCHEDULE_COLLECTION, Permission.REGISTRY_VERIFY_IDENTITY,
    Permission.REGISTRY_VERIFY_COLLECTION, Permission.REGISTRY_RECORD_COLLECTION,
    Permission.REGISTRY_CANCEL_COLLECTION, Permission.REGISTRY_MANAGE_REPLACEMENT,
    Permission.REGISTRY_VIEW_REPORTS, Permission.REGISTRY_EXPORT_REPORTS,
    Permission.REGISTRY_CREATE_NOTIFICATION, Permission.STORAGE_CREATE_LOCATION, 
 Permission.STORAGE_UPDATE_LOCATION, Permission.STORAGE_VIEW,
    Permission.STORAGE_ASSIGN_CERTIFICATE, Permission.STORAGE_TRANSFER_CERTIFICATE,
    Permission.SEARCH_STUDENTS, Permission.SEARCH_REGISTRY_INVENTORY,
    Permission.SEARCH_COLLECTIONS, Permission.DASHBOARD_VIEW_REGISTRY,
  ],
  internal_auditor: [
    Permission.AUDITOR_VIEW_LOGS, Permission.AUDITOR_VIEW_LOGIN_HISTORY,
    Permission.AUDITOR_VIEW_ACTIVITY, Permission.AUDITOR_VIEW_CLEARANCE_HISTORY,
    Permission.AUDITOR_VIEW_COLLECTION_HISTORY, Permission.AUDITOR_VIEW_REPORTS,
    Permission.AUDITOR_EXPORT_REPORTS, Permission.AUDITOR_SEARCH_LOGS,
    Permission.SEARCH_AUDIT_LOGS, Permission.SEARCH_COLLECTIONS,
    Permission.SEARCH_CLEARANCE_REQUESTS, Permission.DASHBOARD_VIEW_AUDITOR,
    Permission.STORAGE_VIEW, Permission.STORAGE_AUDIT,
  ],
  super_admin: Object.values(Permission),
};

export interface MenuItem {
  title: string;
  icon: string;
  path: string;
  permissions?: Permission[];
}

export const ROLE_MENUS: Record<string, MenuItem[]> = {
  student: [
    { title: "Student Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_STUDENT] },
    { title: "Clearance Status", icon: "📋", path: "/student", permissions: [Permission.STUDENT_VIEW_CLEARANCE_PROGRESS] },
    { title: "Notifications", icon: "🔔", path: "/notifications", permissions: [Permission.STUDENT_VIEW_OWN_NOTIFICATIONS] },
  ],
  finance: [
    { title: "Finance Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_FINANCE] },
    { title: "Pending Clearances", icon: "⏳", path: "/clearance/finance", permissions: [Permission.FINANCE_VIEW_PENDING] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.FINANCE_VIEW_PENDING] },
    { title: "Payment Upload", icon: "💳", path: "/finance/payments", permissions: [Permission.FINANCE_VIEW_PENDING] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
  examination_office: [
    { title: "Exam Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_EXAMINATION] },
    { title: "Pending Clearances", icon: "⏳", path: "/clearance/examination", permissions: [Permission.EXAM_VIEW_PENDING] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.EXAM_VIEW_PENDING] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
  dean: [
    { title: "Dean Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DEAN_VIEW_DASHBOARD] },
    { title: "Pending Reviews", icon: "📋", path: "/clearance/dean", permissions: [Permission.DEAN_VIEW_PENDING] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.DEAN_VIEW_PENDING] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
  registry_officer: [
    { title: "Registry Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_REGISTRY] },
    { title: "Registry Office", icon: "🏛️", path: "/registry", permissions: [Permission.REGISTRY_VIEW_INVENTORY] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.REGISTRY_VIEW_INVENTORY] },
    { title: "Collections Report", icon: "📑", path: "/registry/collections", permissions: [Permission.REGISTRY_VIEW_REPORTS] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
  internal_auditor: [
    { title: "Auditor Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_AUDITOR] },
    { title: "Audit Logs", icon: "🔍", path: "/audit/logs", permissions: [Permission.AUDITOR_VIEW_LOGS] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.AUDITOR_VIEW_REPORTS] },
    { title: "Student Records", icon: "🎓", path: "/admin/students", permissions: [Permission.AUDITOR_VIEW_REPORTS] },
    { title: "Export Hub", icon: "📥", path: "/audit/reports", permissions: [Permission.AUDITOR_EXPORT_REPORTS] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
  super_admin: [
    { title: "Admin Dashboard", icon: "📊", path: "/dashboard", permissions: [Permission.DASHBOARD_VIEW_ADMIN] },
    { title: "Finance Clearance", icon: "💰", path: "/clearance/finance", permissions: [Permission.FINANCE_VIEW_PENDING] },
    { title: "Exam Clearance", icon: "📝", path: "/clearance/examination", permissions: [Permission.EXAM_VIEW_PENDING] },
    { title: "Dean Reviews", icon: "🎓", path: "/clearance/dean", permissions: [Permission.DEAN_VIEW_PENDING] },
    { title: "Registry Office", icon: "🏛️", path: "/registry", permissions: [Permission.REGISTRY_VIEW_INVENTORY] },
    { title: "Fee Balances", icon: "💰", path: "/finance/balances", permissions: [Permission.ADMIN_VIEW_ALL_REPORTS] },
    { title: "Payment Upload", icon: "💳", path: "/finance/payments", permissions: [Permission.ADMIN_VIEW_ALL_REPORTS] },
    { title: "Student Management", icon: "🎓", path: "/admin/students", permissions: [Permission.USER_CREATE] },
    { title: "Manage Users", icon: "👤", path: "/admin/users", permissions: [Permission.USER_VIEW] },
    { title: "Audit Logs", icon: "🔍", path: "/admin/audit", permissions: [Permission.ADMIN_VIEW_ALL_LOGS] },
    { title: "Export Hub", icon: "📥", path: "/audit/reports", permissions: [Permission.ADMIN_VIEW_ALL_REPORTS] },
    { title: "Inventory Records", icon: "📦", path: "/storage", permissions: [Permission.STORAGE_VIEW] },
  ],
};
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  getUserMenus: () => MenuItem[];
  isAdmin: () => boolean;
  isStudent: () => boolean;
  isFinance: () => boolean;
  isExamination: () => boolean;
  isDean: () => boolean;
  isRegistry: () => boolean;
  isAuditor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      const data = response.data as LoginResponse;
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_role', data.user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  const isAuthenticated = !!token && !!user;

  const getUserPermissions = (): Permission[] => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return getUserPermissions().includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  const getUserMenus = (): MenuItem[] => {
    if (!user) return [];
    const menus = ROLE_MENUS[user.role] || [];
    return menus.filter(menu => {
      if (!menu.permissions) return true;
      return hasAnyPermission(menu.permissions);
    });
  };

  const isAdmin = () => user?.role === 'super_admin';
  const isStudent = () => user?.role === 'student';
  const isFinance = () => user?.role === 'finance';
  const isExamination = () => user?.role === 'examination_office';
  const isDean = () => user?.role === 'dean';
  const isRegistry = () => user?.role === 'registry_officer';
  const isAuditor = () => user?.role === 'internal_auditor';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout, isAuthenticated,
      hasPermission, hasAnyPermission, hasAllPermissions, getUserMenus,
      isAdmin, isStudent, isFinance, isExamination, isDean, isRegistry, isAuditor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
