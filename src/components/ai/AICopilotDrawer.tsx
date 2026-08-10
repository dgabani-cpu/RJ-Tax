'use client';

import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { INITIAL_RECON_DATA, INITIAL_TASKS } from '@/lib/db/mockDb';
import { clientService } from '@/services/clientService';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  codeSnippet?: string;
}

export function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Namaste CA Sir! I am **TaxNexus Copilot**, your AI tax practice intelligence assistant. I can analyze GSTR-2B discrepancies, find missing invoices, draft WhatsApp notices, or summarize compliance deadlines for your clients.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Show clients with pending GSTR-2B reconciliation',
    'Which invoices are missing for Apex Infra?',
    'Draft WhatsApp reminder for July 2026 purchase bills',
    'Explain ITC eligibility under Section 16(2)(aa)',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // AI Logic Engine
    setTimeout(() => {
      let aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      const q = textToSend.toLowerCase();

      if (q.includes('pending') || q.includes('reconciliation')) {
        aiResponse.text =
          '**GSTR-2B Reconciliation Status Analysis (July 2026):**\n\n' +
          '1. **Apex Infra Projects Pvt Ltd**: 13 discrepancies identified (1 missing in 2B, 1 missing in books, 1 value mismatch, 1 POS head mismatch, 1 duplicate).\n' +
          '2. **Krishna Fashion & Garments**: GST session 2FA expired. Pending portal OTP re-authentication.\n' +
          '3. **Om Agro Foods**: QRMP quarterly reconciliation due on 15th August.';
        aiResponse.actionUrl = '/reconciliation?clientId=client-1';
        aiResponse.actionLabel = 'Open Apex Infra Reconciliation Hub';
      } else if (q.includes('missing') || q.includes('apex')) {
        aiResponse.text =
          '**Missing Invoices for Apex Infra Projects (July 2026):**\n\n' +
          '• **Invoice SBE/26/104** from *Shree Balaji Electricals* (GSTIN: `24BBZPS4412R1Z8`)\n' +
          '  - **Taxable Value**: ₹1,25,000 | **GST**: ₹22,500 (CGST+SGST)\n' +
          '  - **Issue**: Recorded in client purchase register, but supplier has not filed GSTR-1.\n\n' +
          '• **Invoice LT/RENT/992** from *Larsen & Toubro*\n' +
          '  - **Taxable Value**: ₹1,80,000 | **IGST**: ₹32,400\n' +
          '  - **Issue**: Present in GSTR-2B, but missing in client purchase register.';
        aiResponse.actionUrl = '/reconciliation?clientId=client-1&category=MISSING_IN_GSTR2B';
        aiResponse.actionLabel = 'View Missing Invoices Filter';
      } else if (q.includes('whatsapp') || q.includes('draft') || q.includes('reminder')) {
        aiResponse.text =
          'Here is the drafted WhatsApp compliance message for your clients:';
        aiResponse.codeSnippet =
          'Dear {{authorized_name}},\n\n' +
          'Greetings from TaxNexus.\n\n' +
          'This is a reminder to share all Purchase Invoices and Bank Statements for *{{business_name}}* for the tax period *July 2026* before *10th August 2026*.\n\n' +
          'Timely submission ensures your GSTR-2B ITC is reconciled and unfiled supplier invoices are flagged for follow-up.\n\n' +
          'TaxNexus Practice Management Team';
        aiResponse.actionUrl = '/communication';
        aiResponse.actionLabel = 'Open WhatsApp Bulk Sender';
      } else if (q.includes('16(2)(aa)') || q.includes('itc') || q.includes('rule')) {
        aiResponse.text =
          '**Key Provisions of Section 16(2)(aa) of the CGST Act:**\n\n' +
          '1. **Mandatory 2B Reflection**: Input Tax Credit (ITC) can only be claimed if the invoice details have been furnished by the supplier in GSTR-1 / IFF and reflected in GSTR-2B of the recipient.\n' +
          '2. **No 5% Provisional ITC**: The earlier 5% provisional credit window under Rule 36(4) has been omitted. 100% strict 2B matching applies.\n' +
          '3. **180-Day Rule (Second Proviso to Sec 16(2))**: The recipient must pay the supplier the value of supply + tax within 180 days from invoice date, otherwise ITC must be reversed with interest.';
      } else {
        const clientCount = clientService.getClients().length;
        aiResponse.text =
          `I have processed your query: "${textToSend}". In your practice today:\n` +
          `• **${clientCount} Total Clients** under active management\n` +
          `• **${INITIAL_TASKS.filter((t) => t.status !== 'COMPLETED').length} Active Practice Tasks** pending completion\n` +
          `• **July 2026 GSTR-2B Sync** is 80% completed across regular tax filers.`;
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 700);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                TaxNexus Copilot
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  AI Practice AI
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Contextual CA & GST Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {msg.codeSnippet && (
                  <div className="mt-2.5 rounded-lg bg-slate-900 p-2.5 text-[11px] font-mono text-slate-100 relative group">
                    <button
                      onClick={() => copyToClipboard(msg.codeSnippet!, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Copy template text"
                    >
                      {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <pre className="whitespace-pre-wrap">{msg.codeSnippet}</pre>
                  </div>
                )}

                {msg.actionUrl && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(msg.actionUrl!);
                    }}
                    className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-700 px-3 py-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300 shadow-xs hover:bg-brand-50"
                  >
                    <span>{msg.actionLabel || 'Navigate'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}

                <span
                  className={`block text-[9px] mt-1 ${
                    msg.sender === 'user' ? 'text-brand-100 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400 italic">
              <Bot className="h-4 w-4 animate-bounce text-brand-600" />
              <span>TaxNexus Copilot is analyzing practice data...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Suggested Queries</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="text-[10.5px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about clients, GST, reconciliations..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Never alters books without CA approval
            </span>
            <span>TaxNexus Engine v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
