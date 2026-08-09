'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Briefcase,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building,
  GitCompare,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { INITIAL_TASKS, INITIAL_CLIENTS, INITIAL_RECON_DATA } from '@/lib/db/mockDb';
import { INITIAL_DOCUMENT_REQUESTS } from '@/services/documentService';

function MyWorkContent() {
  const { user, canAccessClient } = useAuth();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'OVERDUE' | 'UPCOMING' | 'WAITING' | 'COMPLETED'>('TODAY');

  // Filter clients assigned to this staff member
  const accessibleClients = INITIAL_CLIENTS.filter((c) => canAccessClient(c));
  const accessibleClientIds = accessibleClients.map((c) => c.id);

  // Filter tasks assigned to staff or accessible clients
  const userTasks = INITIAL_TASKS.filter(
    (t) => accessibleClientIds.includes(t.clientId) || t.assignedStaffId === user?.id
  );

  // Filter reconciliations for accessible clients
  const userRecons = INITIAL_RECON_DATA.filter(
    (r) => accessibleClientIds.includes(r.clientId) && r.resolutionStatus === 'PENDING'
  );

  // Filter document requests for accessible clients
  const userDocRequests = INITIAL_DOCUMENT_REQUESTS.filter(
    (dr) => accessibleClientIds.includes(dr.clientId) && dr.status !== 'Verified'
  );

  // Status breakdown
  const todayTasks = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING');
  const overdueTasks = userTasks.filter((t) => t.status === 'OVERDUE');
  const completedTasks = userTasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-brand-600" />
            My Work & Daily Action Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalized workbench for <strong className="text-slate-800 dark:text-slate-200">{user?.name}</strong> ({user?.roleTitle}). Showing authorized client assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            {accessibleClients.length} Assigned Clients
          </span>
        </div>
      </div>

      {/* Action Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Today</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{todayTasks.length}</div>
            <span className="text-[10.5px] text-slate-500">Tasks in workspace</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Overdue SLA</span>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{overdueTasks.length}</div>
            <span className="text-[10.5px] text-slate-500">Requires immediate CA action</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">2B Reconciliations</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{userRecons.length}</div>
            <span className="text-[10.5px] text-slate-500">Pending review</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
            <GitCompare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Client Follow-ups</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{userDocRequests.length}</div>
            <span className="text-[10.5px] text-slate-500">Document requests</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('TODAY')}
          className={`pb-3 transition-all ${
            activeTab === 'TODAY'
              ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Today's Action Items ({todayTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('OVERDUE')}
          className={`pb-3 transition-all ${
            activeTab === 'OVERDUE'
              ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Overdue & Critical SLA ({overdueTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('WAITING')}
          className={`pb-3 transition-all ${
            activeTab === 'WAITING'
              ? 'border-b-2 border-amber-600 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Waiting for Client ({userDocRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`pb-3 transition-all ${
            activeTab === 'COMPLETED'
              ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Completed Work ({completedTasks.length})
        </button>
      </div>

      {/* Content List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-4">
        {activeTab === 'TODAY' && (
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending tasks for today!</p>
            ) : (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-slate-500">{t.description}</p>
                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400">
                      <span>Client: <strong className="text-slate-700 dark:text-slate-300">{t.clientName}</strong></span>
                      <span>Due: {t.dueDate}</span>
                    </div>
                  </div>

                  <Link
                    href={`/clients/${t.clientId}?tab=tasks`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold text-xs hover:bg-brand-700"
                  >
                    <span>Execute</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'OVERDUE' && (
          <div className="space-y-3">
            {overdueTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-200">{t.title}</h4>
                  <p className="text-slate-500 mt-0.5">{t.description}</p>
                  <span className="text-[10.5px] text-red-600 font-bold mt-1 block">Due Date Passed: {t.dueDate}</span>
                </div>
                <Link
                  href={`/clients/${t.clientId}`}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                >
                  Resolve SLA
                </Link>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'WAITING' && (
          <div className="space-y-3">
            {userDocRequests.map((dr) => (
              <div
                key={dr.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{dr.documentType} Request</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {dr.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">{dr.notes}</p>
                  <span className="text-[10px] text-slate-400">Client: {dr.clientName} • Due: {dr.dueDate}</span>
                </div>
                <Link
                  href="/communication"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  Send Reminder
                </Link>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'COMPLETED' && (
          <div className="space-y-2 text-xs text-slate-500">
            {completedTasks.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="line-through">{t.title}</span>
                <span className="text-emerald-600 font-bold">✓ Completed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading My Work Workbench...</div>}>
      <MyWorkContent />
    </Suspense>
  );
}
