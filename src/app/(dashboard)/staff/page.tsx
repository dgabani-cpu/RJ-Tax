'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  UserCheck,
  Plus,
  Shield,
  KeyRound,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  Edit,
  X,
  Search,
  Lock,
} from 'lucide-react';
import { INITIAL_USERS, DEFAULT_PERMISSIONS, INITIAL_CLIENTS } from '@/lib/db/mockDb';
import { User, RoleType } from '@/types';

export default function StaffPage() {
  const { user, hasPermission, logAuditAction } = useAuth();
  const [staffList, setStaffList] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);

  // New Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<RoleType>('STAFF');
  const [newStaffDepartment, setNewStaffDepartment] = useState('GST Compliance');
  const [newStaffDesignation, setNewStaffDesignation] = useState('Tax Associate');

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.roleTitle.toLowerCase().includes(q);
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const created: User = {
      id: `usr-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      role: newStaffRole,
      roleTitle: `${newStaffDesignation} (${newStaffDepartment})`,
      department: newStaffDepartment,
      designation: newStaffDesignation,
      status: 'ACTIVE',
      mfaEnabled: true,
      assignedClientsCount: 0,
      permissions: DEFAULT_PERMISSIONS[newStaffRole],
    };

    setStaffList([...staffList, created]);
    setIsNewStaffModalOpen(false);
    logAuditAction('New Staff Member Added', 'STAFF_MGMT', undefined, `Name: ${created.name}, Role: ${created.role}`);
  };

  const handleToggleStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-brand-600" />
            Staff Management & Client Scoping Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage practice users, assign granular RBAC roles, and scope client access permissions.
          </p>
        </div>

        {hasPermission('manageStaff') && (
          <button
            onClick={() => setIsNewStaffModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-sm">
                    {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">{s.roleTitle}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {s.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{s.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>Assigned Clients: <strong className="text-slate-900 dark:text-white">{s.assignedClientsCount} Clients</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>MFA: {s.mfaEnabled ? '2FA Enabled' : 'Standard'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => handleToggleStatus(s.id)}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => alert(`Reset OTP and password sent to ${s.email}`)}
                className="text-brand-600 hover:underline font-bold"
              >
                Reset Password / OTP
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isNewStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Practice Staff Member</h3>
              <button onClick={() => setIsNewStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Staff Email *</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="ramesh@rjtax.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+91 98250 XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Role Type</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as RoleType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CA_SENIOR">CA / Senior Professional</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Senior Staff</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="DATA_ENTRY">Data Entry Operator</option>
                    <option value="VIEWER">Viewer / Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newStaffDepartment}
                    onChange={(e) => setNewStaffDepartment(e.target.value)}
                    placeholder="GST Audit & Returns"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
