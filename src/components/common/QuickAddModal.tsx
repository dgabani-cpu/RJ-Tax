'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, UploadCloud, CheckSquare, MessageSquare, KeyRound, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'Register New Client Profile',
      description: 'Add legal entity, GSTIN, PAN, filing frequency, and assign staff members.',
      icon: UserPlus,
      color: 'bg-blue-600',
      action: () => {
        onClose();
        router.push('/clients?action=new');
      },
    },
    {
      title: 'Upload Purchase Bills / Excel for AI OCR',
      description: 'Upload inward bills (PDF, Images, Excel) for automated extraction and 2B reconciliation.',
      icon: UploadCloud,
      color: 'bg-emerald-600',
      action: () => {
        onClose();
        router.push('/reconciliation?upload=true');
      },
    },
    {
      title: 'Create Compliance / Audit Task',
      description: 'Assign GST filing, notice reply, or reconciliation task to senior/junior staff.',
      icon: CheckSquare,
      color: 'bg-purple-600',
      action: () => {
        onClose();
        router.push('/tasks?action=new');
      },
    },
    {
      title: 'Schedule Bulk WhatsApp / Email Reminder',
      description: 'Send due date reminders, missing invoice requests, or payment challans.',
      icon: MessageSquare,
      color: 'bg-amber-600',
      action: () => {
        onClose();
        router.push('/communication?action=compose');
      },
    },
    {
      title: 'Add Client GST Portal Credential',
      description: 'Safely encrypt GST username & API access keys in the practice vault.',
      icon: KeyRound,
      color: 'bg-indigo-600',
      action: () => {
        onClose();
        router.push('/gst-automation?action=connect');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-modal animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Practice Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select an action to launch workflow</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={qa.action}
              className="flex w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-left hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/30 dark:hover:bg-brand-950/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${qa.color} text-white shadow-xs`}>
                  <qa.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {qa.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{qa.description}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
