import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Send,
  X,
  Tag,
  ShoppingBag,
  ExternalLink,
  Flame,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SupportTicket, TicketPriority, TicketStatus } from '../../types';

export const AdminSupportView: React.FC = () => {
  const {
    supportTickets,
    addSupportTicket,
    updateSupportTicket,
    updateTicketStatus,
    addTicketNote,
    staffMembers,
    themeMode,
    navigateTo,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New Ticket Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newOrderRef, setNewOrderRef] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newAssignedStaff, setNewAssignedStaff] = useState('Sana Tariq');
  const [newInitialNote, setNewInitialNote] = useState('');

  // Drawer / Note input state
  const [noteInput, setNoteInput] = useState('');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';
  const inputBg = themeMode === 'dark' ? 'bg-[#181c24] border-[#232833]' : 'bg-[#f9fafb] border-slate-200';

  // Filter logic
  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      ticket.ticketNumber.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q) ||
      (ticket.customerName && ticket.customerName.toLowerCase().includes(q)) ||
      ticket.customerEmail.toLowerCase().includes(q) ||
      (ticket.orderReference && ticket.orderReference.toLowerCase().includes(q)) ||
      (ticket.assignedStaff && ticket.assignedStaff.toLowerCase().includes(q));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const openCount = supportTickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = supportTickets.filter((t) => t.status === 'In Progress').length;
  const waitingCount = supportTickets.filter((t) => t.status === 'Waiting on Customer').length;
  const urgentCount = supportTickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Closed' && t.status !== 'Resolved').length;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerEmail.trim() || !newSubject.trim()) return;

    const notes = newInitialNote.trim()
      ? [
          {
            id: 'note-' + Date.now().toString(36),
            author: 'Farhan Ali (Admin)',
            text: newInitialNote.trim(),
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

    addSupportTicket({
      customerName: newCustomerName.trim() || 'Valued Collector',
      customerEmail: newCustomerEmail.trim(),
      subject: newSubject.trim(),
      orderReference: newOrderRef.trim() || undefined,
      priority: newPriority,
      status: 'Open',
      assignedStaff: newAssignedStaff,
      notes,
    });

    setIsNewTicketModalOpen(false);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewSubject('');
    setNewOrderRef('');
    setNewPriority('Medium');
    setNewInitialNote('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !noteInput.trim()) return;

    addTicketNote(selectedTicket.id, noteInput.trim(), 'Farhan Ali (Staff)');
    setNoteInput('');
    // Refresh selected ticket in view
    const updated = supportTickets.find((t) => t.id === selectedTicket.id);
    if (updated) {
      setSelectedTicket({
        ...updated,
        notes: [
          ...(updated.notes || []),
          {
            id: 'note-' + Date.now(),
            author: 'Farhan Ali (Staff)',
            text: noteInput.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
  };

  const getPriorityBadgeClass = (priority: TicketPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Low':
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Waiting on Customer':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-500" />
              <span>Customer Support Desk</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {openCount} Open Tickets
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Manage buyer inquiries, courier tracking verifications, and order dispute resolutions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${textMuted}`}>Open Inquiries</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-white font-mono">{openCount}</h4>
            <span className="text-[10px] font-bold text-amber-400">Awaiting Reply</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${textMuted}`}>In Investigation</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-white font-mono">{inProgressCount}</h4>
            <span className="text-[10px] font-bold text-blue-400">Staff Assigned</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${textMuted}`}>Waiting on Buyer</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-white font-mono">{waitingCount}</h4>
            <span className="text-[10px] font-bold text-purple-400">Response Pending</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${textMuted}`}>Urgent Priority</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-red-400 font-mono">{urgentCount}</h4>
            <span className="text-[10px] font-bold text-red-400">Immediate Action</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 ${cardBg}`}>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, buyer, subject, order ref..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-inherit bg-transparent text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-black/20 dark:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">Ticket #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Subject &amp; Order</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5">Last Updated</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-sans">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <LifeBuoy className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="font-bold text-white text-sm">No support tickets found</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery || statusFilter !== 'All'
                          ? 'Try clearing the search query or adjusting your status filters.'
                          : 'All customer tickets have been resolved! Good work.'}
                      </p>
                      {(searchQuery || statusFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setPriorityFilter('All');
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono font-bold text-blue-400">{t.ticketNumber}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{t.customerName || 'Customer'}</div>
                      <div className={`text-[11px] ${textMuted}`}>{t.customerEmail}</div>
                    </td>
                    <td className="p-3.5 max-w-[240px]">
                      <div className="font-medium text-white truncate">{t.subject}</div>
                      {t.orderReference && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>{t.orderReference}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                          {t.assignedStaff ? t.assignedStaff.charAt(0) : '?'}
                        </div>
                        <span>{t.assignedStaff || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Inspection Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} max-h-[92vh] flex flex-col overflow-hidden text-white`}>
            {/* Drawer Header */}
            <div className="p-5 border-b border-inherit flex items-start justify-between bg-black/10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-blue-400">{selectedTicket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>Buyer: <strong className="text-white">{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})</span>
                  {selectedTicket.orderReference && (
                    <span>• Order: <strong className="text-emerald-400 font-mono">{selectedTicket.orderReference}</strong></span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
              {/* Quick Status and Assignment Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/20 border border-inherit">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as TicketStatus;
                      updateTicketStatus(selectedTicket.id, newStatus);
                      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="w-full p-2 rounded-lg bg-[#181c24] border border-[#232833] text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting on Customer">Waiting on Customer</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => {
                      const newPri = e.target.value as TicketPriority;
                      updateSupportTicket(selectedTicket.id, { priority: newPri });
                      setSelectedTicket((prev) => prev ? { ...prev, priority: newPri } : null);
                    }}
                    className="w-full p-2 rounded-lg bg-[#181c24] border border-[#232833] text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Assignee</label>
                  <select
                    value={selectedTicket.assignedStaff || ''}
                    onChange={(e) => {
                      const newStaff = e.target.value;
                      updateSupportTicket(selectedTicket.id, { assignedStaff: newStaff });
                      setSelectedTicket((prev) => prev ? { ...prev, assignedStaff: newStaff } : null);
                    }}
                    className="w-full p-2 rounded-lg bg-[#181c24] border border-[#232833] text-xs text-white outline-none focus:border-blue-500"
                  >
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Internal Staff Notes Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Internal Staff Notes ({selectedTicket.notes?.length || 0})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Confidential to store team</span>
                </div>

                {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedTicket.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-[#181c24] border border-[#232833] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-400">{n.author}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-xs">{n.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl border border-dashed border-[#232833]">
                    No internal staff notes on this ticket yet.
                  </p>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Append internal staff note..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#181c24] border border-[#232833] text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Add Note</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-inherit flex items-center justify-between bg-black/10">
              <span className="text-[11px] text-slate-400 font-mono">
                Created {new Date(selectedTicket.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-500" />
                <span>Create Support Ticket</span>
              </h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zainab Malik"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Customer Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. zainab@example.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Subject / Inquiry Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier delivery address verification"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Order Ref # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. FS-99120"
                    value={newOrderRef}
                    onChange={(e) => setNewOrderRef(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Assigned Staff</label>
                  <select
                    value={newAssignedStaff}
                    onChange={(e) => setNewAssignedStaff(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                  >
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Initial Staff Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add context or notes for the fulfillment team..."
                  value={newInitialNote}
                  onChange={(e) => setNewInitialNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
