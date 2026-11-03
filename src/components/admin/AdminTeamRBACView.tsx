import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Plus,
  Search,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StaffMember, StaffRole } from '../../types';

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  'Principal Admin': [
    'Full Root Access',
    'API Secrets & Gateways',
    'Staff Access & RBAC',
    'Audit Log Viewer',
    'Inventory Management',
    'Fulfillment Pipeline',
  ],
  'Inventory Curator': [
    'Product Catalog CRUD',
    'Condition Grading',
    'Drop Calendar Scheduling',
    'High-Res Asset Uploads',
  ],
  'Fulfillment Staff': [
    'Order Fulfillment Pipeline',
    'Courier Tracking Generation',
    'Dispatched Status Updates',
    'Waybill Receipts Printing',
  ],
  'Customer Support': [
    'Support Tickets Management',
    'Customer Profile CRM',
    'Internal Staff Notes',
    'Review Moderation',
  ],
  'Read-only Analyst': [
    'Revenue Analytics Overview',
    'Weekly Velocity Reports',
    'Customer LTV Read-only',
  ],
};

export const AdminTeamRBACView: React.FC = () => {
  const {
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    auditLogs,
    themeMode,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    staff: StaffMember;
    type: 'disable' | 'enable' | 'delete';
  } | null>(null);

  // Invite Form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('Fulfillment Staff');

  // Edit Form state
  const [editRole, setEditRole] = useState<StaffRole>('Fulfillment Staff');
  const [editStatus, setEditStatus] = useState<'Active' | 'Disabled' | 'Invited'>('Active');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesRole = roleFilter === 'All' || staff.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      staff.name.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      staff.role.toLowerCase().includes(q);

    return matchesRole && matchesSearch;
  });

  const rbacLogs = auditLogs
    .filter((log) => log.provider === 'RBAC_SECURITY' || log.action.includes('STAFF') || log.action.includes('ADMIN'))
    .slice(0, 6);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    // Check if email already exists
    if (staffMembers.some((s) => s.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      addToast({
        type: 'error',
        title: 'Staff Already Exists',
        message: 'A team member with this email already has assigned access.',
      });
      return;
    }

    addStaffMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      permissions: ROLE_PERMISSIONS[inviteRole],
      status: 'Active',
      lastActive: new Date().toISOString(),
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Fulfillment Staff');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    updateStaffMember(editingStaff.id, {
      role: editRole,
      permissions: ROLE_PERMISSIONS[editRole],
      status: editStatus,
    });

    setEditingStaff(null);
  };

  const handleExecuteConfirmedAction = () => {
    if (!confirmAction) return;
    const { staff, type } = confirmAction;

    if (type === 'delete') {
      deleteStaffMember(staff.id);
    } else if (type === 'disable') {
      updateStaffMember(staff.id, { status: 'Disabled' });
    } else if (type === 'enable') {
      updateStaffMember(staff.id, { status: 'Active' });
    }

    setConfirmAction(null);
  };

  const getRoleBadgeClass = (role: StaffRole) => {
    switch (role) {
      case 'Principal Admin':
        return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
      case 'Inventory Curator':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'Fulfillment Staff':
        return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      case 'Customer Support':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      case 'Read-only Analyst':
        return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Team Access &amp; RBAC Security</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {staffMembers.length} Staff Accounts
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Granular role-based access control, operator identity credentials, and cryptographic session logs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Role Hierarchy Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(ROLE_PERMISSIONS) as StaffRole[]).map((role) => {
          const count = staffMembers.filter((s) => s.role === role).length;
          return (
            <div key={role} className={`p-3.5 rounded-xl border ${cardBg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
                <span className="text-xs font-bold font-mono text-slate-400">{count} user{count !== 1 ? 's' : ''}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {ROLE_PERMISSIONS[role].slice(0, 2).map((perm, idx) => (
                  <li key={idx} className="flex items-center space-x-1.5 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff name, email, or role..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-inherit bg-transparent text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Principal Admin', 'Inventory Curator', 'Fulfillment Staff', 'Customer Support', 'Read-only Analyst'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-black/20 dark:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Members Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Permissions Summary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-sans">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3.5 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
                      {staff.avatarUrl ? (
                        <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        staff.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">{staff.name}</div>
                      <div className={`text-[11px] ${textMuted}`}>{staff.email}</div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(staff.role)}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-[240px]">
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-black/20 text-slate-300 text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                      {staff.permissions.length > 2 && (
                        <span className="text-[10px] text-slate-500 font-mono">+{staff.permissions.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : staff.status === 'Disabled'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {staff.status === 'Active' ? '● Active' : staff.status === 'Disabled' ? '✕ Disabled' : '○ Invited'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                    {new Date(staff.lastActive).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingStaff(staff);
                        setEditRole(staff.role);
                        setEditStatus(staff.status);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                      title="Edit Staff Role & Permissions"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {staff.status === 'Active' ? (
                      <button
                        onClick={() => setConfirmAction({ staff, type: 'disable' })}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                        title="Disable Staff Access"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmAction({ staff, type: 'enable' })}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                        title="Enable Staff Access"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {staff.role !== 'Principal Admin' && (
                      <button
                        onClick={() => setConfirmAction({ staff, type: 'delete' })}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Revoke & Delete Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent RBAC Security Audit Feed */}
      <div className={`p-5 rounded-xl border shadow-sm ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Recent Staff Access &amp; RBAC Audit Trail</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Real-Time AES-256 Audit Log</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rbacLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-[#181c24] border border-[#232833] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-blue-400">{log.action}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Actor: <strong className="text-white">{log.adminUser}</strong> • Target: {log.transactionId}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Invite Staff Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Invite New Staff Member</span>
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danish Mirza"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Staff Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. danish@forge.supply"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Role &amp; Privilege Level</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                >
                  <option value="Principal Admin">Principal Admin (Root Access)</option>
                  <option value="Inventory Curator">Inventory Curator (Product & Drops)</option>
                  <option value="Fulfillment Staff">Fulfillment Staff (Orders & Dispatch)</option>
                  <option value="Customer Support">Customer Support (Tickets & CRM)</option>
                  <option value="Read-only Analyst">Read-only Analyst (Reporting Only)</option>
                </select>
              </div>

              {/* Permissions Preview Box */}
              <div className="p-3 rounded-xl bg-black/30 border border-inherit space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Privileges:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PERMISSIONS[inviteRole].map((perm, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px] font-mono">
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Staff Role & Status Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div>
                <h3 className="text-base font-bold">Edit Permissions: {editingStaff.name}</h3>
                <p className="text-[11px] text-slate-400">{editingStaff.email}</p>
              </div>
              <button onClick={() => setEditingStaff(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Staff Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                >
                  <option value="Principal Admin">Principal Admin</option>
                  <option value="Inventory Curator">Inventory Curator</option>
                  <option value="Fulfillment Staff">Fulfillment Staff</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Read-only Analyst">Read-only Analyst</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] outline-none text-white focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Invited">Invited</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-black/30 border border-inherit space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Updated Privileges:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PERMISSIONS[editRole].map((perm, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px] font-mono">
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirmation Dialog for Disabling / Revoking Access */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white text-center`}>
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold">
                {confirmAction.type === 'delete'
                  ? `Revoke Access for ${confirmAction.staff.name}?`
                  : confirmAction.type === 'disable'
                  ? `Disable Access for ${confirmAction.staff.name}?`
                  : `Restore Access for ${confirmAction.staff.name}?`}
              </h3>
              <p className="text-xs text-slate-400">
                {confirmAction.type === 'delete'
                  ? 'This action will permanently delete this staff member and revoke all their permissions. This event will be logged in security audit trails.'
                  : confirmAction.type === 'disable'
                  ? 'This staff member will be immediately locked out from the admin panel until reactivated.'
                  : 'This staff member will regain access to their assigned module privileges.'}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-5 py-2 rounded-lg text-white font-bold text-xs cursor-pointer ${
                  confirmAction.type === 'delete' || confirmAction.type === 'disable'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirmAction.type === 'delete' ? 'Revoke Account' : confirmAction.type === 'disable' ? 'Disable Access' : 'Restore Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
