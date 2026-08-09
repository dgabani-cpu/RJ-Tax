'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Building,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { INITIAL_TASKS, INITIAL_SCHEDULED_MESSAGES } from '@/lib/db/mockDb';

export default function CalendarPage() {
  const { user, logAuditAction } = useAuth();
  const [currentMonth, setCurrentMonth] = useState('August 2026');

  const complianceEvents = [
    {
      date: '10 Aug 2026',
      title: 'WhatsApp Purchase Invoices Reminder',
      category: 'COMMUNICATION',
      client: 'All Category A & B Clients',
      time: '10:00 AM',
      color: 'bg-emerald-500',
    },
    {
      date: '11 Aug 2026',
      title: 'Statutory Due Date: GSTR-1 (Monthly Filers)',
      category: 'COMPLIANCE',
      client: '4 Clients',
      time: 'Midnight',
      color: 'bg-red-500',
    },
    {
      date: '13 Aug 2026',
      title: 'Statutory Due Date: IFF (Invoice Furnishing QRMP)',
      category: 'COMPLIANCE',
      client: 'Om Agro Foods',
      time: 'Midnight',
      color: 'bg-amber-500',
    },
    {
      date: '14 Aug 2026',
      title: 'GSTR-2B July 2026 ITC Reconciliation SLA',
      category: 'TASK',
      client: 'Apex Infra Projects Pvt Ltd',
      time: '05:00 PM',
      color: 'bg-purple-500',
    },
    {
      date: '18 Aug 2026',
      title: 'WhatsApp GSTR-3B Tax Challan Notification',
      category: 'COMMUNICATION',
      client: '4 Clients',
      time: '11:30 AM',
      color: 'bg-emerald-500',
    },
    {
      date: '20 Aug 2026',
      title: 'Statutory Due Date: GSTR-3B Return Filing',
      category: 'COMPLIANCE',
      client: 'All Regular Filers',
      time: 'Midnight',
      color: 'bg-red-500',
    },
    {
      date: '25 Aug 2026',
      title: 'Statutory Due Date: PMT-06 Challan (QRMP M1)',
      category: 'COMPLIANCE',
      client: 'Om Agro Foods',
      time: 'Midnight',
      color: 'bg-blue-500',
    },
  ];

  const handleExportICS = () => {
    logAuditAction('Exported Compliance Calendar to ICS/iCal', 'CALENDAR', undefined, 'August 2026 sync file');
    alert('Compliance Calendar exported in .ICS format for Google Calendar & Microsoft Outlook!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-brand-600" />
            Compliance & Practice Deadlines Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated view of GST filing cutoffs, client task SLAs, scheduled WhatsApp notices, and staff milestones.
          </p>
        </div>

        <button
          onClick={handleExportICS}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Sync to Google / Outlook</span>
        </button>
      </div>

      {/* Calendar Header Month Controller */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">{currentMonth}</h2>
          <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> GST Due Date
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Task SLA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Scheduled Message
          </span>
        </div>
      </div>

      {/* Events Agenda Feed */}
      <div className="space-y-3">
        {complianceEvents.map((evt, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className={`h-3 w-3 rounded-full ${evt.color} shrink-0 mt-1`} />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{evt.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Client: <strong className="text-slate-700 dark:text-slate-300">{evt.client}</strong> • Category: {evt.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{evt.date}</span>
                <span className="text-[10px] text-slate-400 block">{evt.time}</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10.5px]">
                {evt.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
