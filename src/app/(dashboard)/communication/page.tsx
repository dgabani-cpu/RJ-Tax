'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  MessageSquareShare,
  Mail,
  Smartphone,
  Calendar,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  RotateCw,
  FileText,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import {
  INITIAL_COMMUNICATION_TEMPLATES,
  INITIAL_SCHEDULED_MESSAGES,
} from '@/lib/db/mockDb';
import { CommunicationTemplate, ScheduledMessage, Client } from '@/types';
import { clientService } from '@/services/clientService';

function CommunicationContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const { user, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());
  const [activeChannel, setActiveChannel] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(INITIAL_COMMUNICATION_TEMPLATES);
  const [scheduledList, setScheduledList] = useState<ScheduledMessage[]>(INITIAL_SCHEDULED_MESSAGES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0].id);
  const [selectedClients, setSelectedClients] = useState<string[]>(() => clientService.getClients().map((c) => c.id));
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessAlert, setSendSuccessAlert] = useState<string | null>(null);

  React.useEffect(() => {
    const allClients = clientService.getClients();
    setClients(allClients);
    const handleUpdate = () => {
      const updated = clientService.getClients();
      setClients(updated);
    };
    window.addEventListener('taxnexus:clients-updated' as any, handleUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleUpdate);
  }, []);

  // Scheduling state
  const [scheduleTime, setScheduleTime] = useState('2026-08-10 10:00 AM');
  const [recurrence, setRecurrence] = useState<'ONE_TIME' | 'MONTHLY_5TH' | 'MONTHLY_10TH' | 'MONTHLY_15TH' | 'MONTHLY_18TH'>('MONTHLY_10TH');

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleToggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSelectAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map((c) => c.id));
    }
  };

  const handleSendImmediately = () => {
    if (selectedClients.length === 0) {
      alert('Please select at least one client recipient.');
      return;
    }
    setIsSending(true);
    setSendSuccessAlert(null);

    setTimeout(() => {
      setIsSending(false);
      setSendSuccessAlert(
        `Dispatched ${currentTemplate.channel} messages successfully to ${selectedClients.length} clients.`
      );
      logAuditAction(
        `Bulk ${currentTemplate.channel} Dispatched`,
        'COMMUNICATION',
        `${selectedClients.length} Clients`,
        `Template: ${currentTemplate.name}`
      );
    }, 1000);
  };

  const handleCreateSchedule = () => {
    const newSchedule: ScheduledMessage = {
      id: `sch-${Date.now()}`,
      channel: currentTemplate.channel,
      templateId: currentTemplate.id,
      templateName: currentTemplate.name,
      recipientCount: selectedClients.length,
      scheduledTime: scheduleTime,
      recurrence: recurrence,
      status: 'SCHEDULED',
      targetClients: selectedClients,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setScheduledList([newSchedule, ...scheduledList]);
    setSendSuccessAlert(`Recurring compliance reminder successfully scheduled for ${scheduleTime}.`);
    logAuditAction(
      'Communication Reminder Scheduled',
      'COMMUNICATION',
      `${selectedClients.length} Clients`,
      `Recurrence: ${recurrence}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareShare className="h-6 w-6 text-emerald-600" />
            Bulk WhatsApp & Email Communication Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automate monthly purchase bill collection, GSTR-2B discrepancy intimations, and payment challans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveChannel('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeChannel === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Channels
          </button>
          <button
            onClick={() => setActiveChannel('WHATSAPP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeChannel === 'WHATSAPP'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            WhatsApp
          </button>
          <button
            onClick={() => setActiveChannel('EMAIL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeChannel === 'EMAIL'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
        </div>
      </div>

      {sendSuccessAlert && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{sendSuccessAlert}</span>
          </div>
          <button onClick={() => setSendSuccessAlert(null)} className="text-emerald-600 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Two Column Layout: Template Composer & Client Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Template Selector & Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Message Template & Dynamic Interpolation
              </h3>
              <span className="text-xs text-slate-400 font-mono">Channel: {currentTemplate.channel}</span>
            </div>

            {/* Template Selector Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Choose Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      [{tmpl.channel}] {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Available Merge Variables
                </label>
                <div className="flex flex-wrap gap-1">
                  {currentTemplate.variables.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono text-[10px] border border-brand-200 dark:border-brand-800"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject if Email */}
            {currentTemplate.channel === 'EMAIL' && (
              <div className="text-xs">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Template
                </label>
                <input
                  type="text"
                  value={currentTemplate.subject || ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            )}

            {/* Template Body Preview */}
            <div className="text-xs">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Template Message Content
              </label>
              <textarea
                rows={7}
                value={currentTemplate.body}
                readOnly
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Action Buttons: Immediate Send vs Schedule */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                Selected Recipients: <strong className="text-slate-900 dark:text-white">{selectedClients.length} Practice Clients</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSendImmediately}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSending ? 'Sending Messages...' : 'Send Immediately'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Scheduler Console */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-600" />
              Automated Recurring Compliance Scheduler
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Trigger Cadence
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="MONTHLY_5TH">Every month on 5th (Document Collection)</option>
                  <option value="MONTHLY_10TH">Every month on 10th (Purchase Bills Reminder)</option>
                  <option value="MONTHLY_15TH">Every month on 15th (GSTR-2B Recon Notice)</option>
                  <option value="MONTHLY_18TH">Every month on 18th (GSTR-3B Tax Approval)</option>
                  <option value="ONE_TIME">One-Time Specific Schedule</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Time
                </label>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreateSchedule}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Save Recurring Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Client Segmentation & Scheduled Queue */}
        <div className="space-y-6">
          {/* Client Target Selector */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-600" /> Target Clients ({selectedClients.length})
              </h3>
              <button
                onClick={handleSelectAllClients}
                className="text-[11px] font-bold text-brand-600 hover:underline"
              >
                {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {clients.map((c) => {
                const isSelected = selectedClients.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleClient(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 font-semibold'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{c.legalName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{c.gstin}</span>
                    </div>
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduled Message Queue */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Clock className="h-4 w-4 text-amber-500" /> Scheduled Message Queue
            </h3>

            <div className="space-y-2">
              {scheduledList.map((sch) => (
                <div
                  key={sch.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{sch.templateName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {sch.channel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{sch.scheduledTime}</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {sch.recipientCount} Recipients
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunicationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Communication Hub...</div>}>
      <CommunicationContent />
    </Suspense>
  );
}

