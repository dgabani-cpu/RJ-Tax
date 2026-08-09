'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Clock,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building,
  MoreVertical,
  Kanban,
  List,
} from 'lucide-react';
import { INITIAL_TASKS, INITIAL_CLIENTS, INITIAL_USERS } from '@/lib/db/mockDb';
import { Task } from '@/types';

function TasksContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const { user, logAuditAction } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(initialAction === 'new');

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClientId, setNewTaskClientId] = useState(INITIAL_CLIENTS[0]?.id || '');
  const [newTaskStaffId, setNewTaskStaffId] = useState(INITIAL_USERS[0]?.id || 'usr-1');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-08-15');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns: { status: Task['status']; title: string; color: string }[] = [
    { status: 'PENDING', title: 'Pending', color: 'border-slate-300 dark:border-slate-700' },
    { status: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-400' },
    { status: 'WAITING_FOR_CLIENT', title: 'Waiting for Client', color: 'border-amber-400' },
    { status: 'COMPLETED', title: 'Completed', color: 'border-emerald-400' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = INITIAL_CLIENTS.find((c) => c.id === newTaskClientId) || INITIAL_CLIENTS[0] || {
      id: 'client-1',
      legalName: 'Practice Client',
    };
    const targetStaff = INITIAL_USERS.find((u) => u.id === newTaskStaffId) || INITIAL_USERS[0];

    const created: Task = {
      id: `task-${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.legalName,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedStaffId: targetStaff.id,
      assignedStaffName: targetStaff.name,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      status: 'PENDING',
      category: 'GST_FILING',
      createdAt: new Date().toISOString().split('T')[0],
      commentsCount: 0,
    };

    setTasks([created, ...tasks]);
    setIsNewTaskModalOpen(false);
    logAuditAction('New Compliance Task Created', 'TASK', targetClient.legalName, `Task: ${newTaskTitle}`);
  };

  const handleUpdateStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-amber-500" />
            Practice Task Management & Workflow SLAs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track return filings, purchase invoice collection, GSTR-2B reconciliations, and notice replies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-subtle">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'KANBAN'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'LIST'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, client, or staff assignee..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'KANBAN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {columnTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-subtle space-y-2 text-xs hover:border-brand-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded ${
                            t.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {t.priority}
                        </span>

                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-700 rounded px-1 py-0.5 border-0 focus:outline-none cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_FOR_CLIENT">Wait Client</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white leading-snug">{t.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.description}</p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10.5px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t.clientName}</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {t.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Task Name & Scope</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.title}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{t.clientName}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.assignedStaffName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.priority === 'HIGH' || t.priority === 'URGENT'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium">{t.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Compliance Task</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. GSTR-3B July 2026 Return Preparation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Client</label>
                  <select
                    value={newTaskClientId}
                    onChange={(e) => setNewTaskClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {INITIAL_CLIENTS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legalName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Staff</label>
                  <select
                    value={newTaskStaffId}
                    onChange={(e) => setNewTaskStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {INITIAL_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="URGENT">Urgent (24h SLA)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Instructions</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Important instructions for the staff executive..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Practice Tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}

