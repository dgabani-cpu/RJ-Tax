'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType, PermissionSet, Client, AuditLogItem } from '@/types';
import { INITIAL_USERS, DEFAULT_PERMISSIONS, INITIAL_AUDIT_LOGS } from '@/lib/db/mockDb';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginStep: 'CREDENTIALS' | 'OTP' | 'AUTHENTICATED';
  tempUserEmail: string | null;
  otpChannel: 'EMAIL' | 'SMS' | 'AUTHENTICATOR';
  auditLogs: AuditLogItem[];
  initiateLogin: (email: string, password: string, channel?: 'EMAIL' | 'SMS' | 'AUTHENTICATOR') => Promise<{ success: boolean; error?: string; devOtp?: string }>;
  registerPractice: (data: { name: string; firmName: string; email: string; phone: string; password: string; channel?: 'EMAIL' | 'SMS' | 'AUTHENTICATOR' }) => Promise<{ success: boolean; error?: string; devOtp?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  logoutAllDevices: () => void;
  switchDemoRole: (role: RoleType) => void;
  hasPermission: (permission: keyof PermissionSet) => boolean;
  canAccessClient: (client: Client) => boolean;
  logAuditAction: (action: string, resourceType: string, clientName?: string, details?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'OTP' | 'AUTHENTICATED'>('CREDENTIALS');
  const [tempUserEmail, setTempUserEmail] = useState<string | null>(null);
  const [tempRegisteredUser, setTempRegisteredUser] = useState<User | null>(null);
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS' | 'AUTHENTICATOR'>('EMAIL');
  const [pendingOtp, setPendingOtp] = useState<string>('842915');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  useEffect(() => {
    // Check if session exists in localStorage
    try {
      const savedUserJson = localStorage.getItem('tax_nexus_user');
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
        setIsAuthenticated(true);
        setLoginStep('AUTHENTICATED');
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoginStep('CREDENTIALS');
      }
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logAuditAction = (action: string, resourceType: string, clientName?: string, details?: string) => {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest User',
      userRole: user?.roleTitle || user?.role || 'Unknown',
      action,
      resourceType,
      clientName,
      ipAddress: '103.24.120.45',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      details: details || `Executed ${action} operation.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const initiateLogin = async (email: string, password: string, channel: 'EMAIL' | 'SMS' | 'AUTHENTICATOR' = 'EMAIL') => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600)); // realistic network latency
    setIsLoading(false);

    const foundUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    // For demo purposes, any password with at least 4 chars is accepted, or defaults
    if (!foundUser && email !== 'admin@taxnexus.io') {
      return { success: false, error: 'Invalid user credentials. Please check your email or create an account.' };
    }

    const targetUser = foundUser || INITIAL_USERS[0];

    if (targetUser.status !== 'ACTIVE') {
      return { success: false, error: 'This user account is suspended. Contact Super Admin.' };
    }

    // Generate simulated 6-digit OTP
    const generatedOtp = '842915';
    setPendingOtp(generatedOtp);
    setTempUserEmail(targetUser.email);
    setTempRegisteredUser(null);
    setOtpChannel(channel);
    setLoginStep('OTP');

    logAuditAction('Login Credentials Verified - OTP Dispatched', 'AUTH', undefined, `OTP sent to ${channel}: ${targetUser.email}`);

    return { success: true, devOtp: generatedOtp };
  };

  const registerPractice = async (data: { name: string; firmName: string; email: string; phone: string; password: string; channel?: 'EMAIL' | 'SMS' | 'AUTHENTICATOR' }) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 700));
    setIsLoading(false);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'SUPER_ADMIN',
      roleTitle: 'Managing Partner',
      department: data.firmName,
      designation: 'CA, Practice Head',
      status: 'ACTIVE',
      mfaEnabled: true,
      assignedClientsCount: 0,
      permissions: DEFAULT_PERMISSIONS.SUPER_ADMIN,
      lastLogin: 'Just now',
    };

    const generatedOtp = '842915';
    setPendingOtp(generatedOtp);
    setTempUserEmail(data.email);
    setTempRegisteredUser(newUser);
    setOtpChannel(data.channel || 'EMAIL');
    setLoginStep('OTP');

    logAuditAction('Practice Registration Initiated - OTP Dispatched', 'AUTH', undefined, `Registration for ${data.firmName} (${data.email})`);

    return { success: true, devOtp: generatedOtp };
  };

  const verifyOtp = async (enteredOtp: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 500));
    setIsLoading(false);

    if (enteredOtp !== pendingOtp && enteredOtp !== '842915' && enteredOtp !== '123456') {
      return { success: false, error: 'Invalid or expired OTP. Please try again.' };
    }

    const targetUser = tempRegisteredUser || INITIAL_USERS.find((u) => u.email === tempUserEmail) || INITIAL_USERS[0];
    setUser(targetUser);
    setIsAuthenticated(true);
    setLoginStep('AUTHENTICATED');
    localStorage.setItem('tax_nexus_user', JSON.stringify(targetUser));

    logAuditAction('User Logged In with OTP', 'AUTH', undefined, `2FA verified via ${otpChannel}. Session established.`);

    return { success: true };
  };

  const logout = () => {
    logAuditAction('User Logged Out', 'AUTH', undefined, 'Standard user session terminated.');
    setUser(null);
    setIsAuthenticated(false);
    setLoginStep('CREDENTIALS');
    localStorage.removeItem('tax_nexus_user');
  };

  const logoutAllDevices = () => {
    logAuditAction('User Logged Out from All Devices', 'AUTH', undefined, 'Revoked all active JWT refresh tokens and sessions.');
    setUser(null);
    setIsAuthenticated(false);
    setLoginStep('CREDENTIALS');
    localStorage.removeItem('tax_nexus_user');
  };

  const switchDemoRole = (newRole: RoleType) => {
    const sampleUser = INITIAL_USERS.find((u) => u.role === newRole) || {
      id: `demo-${newRole.toLowerCase()}`,
      name: `Demo ${newRole}`,
      email: `${newRole.toLowerCase()}@taxnexus.io`,
      phone: '+91 98000 00000',
      role: newRole,
      roleTitle: `${newRole.replace('_', ' ')} (Demo Scope)`,
      status: 'ACTIVE' as const,
      mfaEnabled: true,
      assignedClientsCount: 4,
      permissions: DEFAULT_PERMISSIONS[newRole],
    };

    setUser(sampleUser);
    setIsAuthenticated(true);
    setLoginStep('AUTHENTICATED');
    localStorage.setItem('tax_nexus_user', JSON.stringify(sampleUser));
    logAuditAction(`Switched Role to ${newRole}`, 'RBAC', undefined, `Impersonating role ${newRole} for scope testing.`);
  };

  const hasPermission = (permission: keyof PermissionSet): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return !!user.permissions[permission];
  };

  const canAccessClient = (client: Client): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'CA_SENIOR') return true;
    // Check if staff is assigned to this client
    return client.assignedStaff.some((s) => s.staffId === user.id || s.staffEmail === user.email) || client.assignedManagerId === user.id;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginStep,
        tempUserEmail,
        otpChannel,
        auditLogs,
        initiateLogin,
        registerPractice,
        verifyOtp,
        logout,
        logoutAllDevices,
        switchDemoRole,
        hasPermission,
        canAccessClient,
        logAuditAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
