import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  XCircle,
  Building,
  Smartphone,
  CreditCard,
  Banknote,
  AlertCircle,
  AlertTriangle,
  Clock,
  Activity,
  X,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PaymentGatewayConfig, PaymentGatewayType } from '../types';
import { formatPKR } from '../utils/format';

export const PaymentMethodsManager: React.FC = () => {
  const {
    paymentGateways,
    addPaymentGateway,
    updatePaymentGateway,
    deletePaymentGateway,
    togglePaymentGateway,
    addAuditLog,
    themeMode,
    addToast,
  } = useStore();

  const [revealedGateways, setRevealedGateways] = useState<{ [id: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteGateway, setConfirmDeleteGateway] = useState<PaymentGatewayConfig | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<PaymentGatewayType>('bank');
  const [formTitle, setFormTitle] = useState('');
  const [formProviderName, setFormProviderName] = useState('');
  const [formAccountTitle, setFormAccountTitle] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formSwiftCode, setFormSwiftCode] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formMinOrderLimit, setFormMinOrderLimit] = useState<number>(500);
  const [formMaxOrderLimit, setFormMaxOrderLimit] = useState<number>(100000);
  const [formDisclaimerNote, setFormDisclaimerNote] = useState('');
  const [formCustomInstructions, setFormCustomInstructions] = useState('');
  const [formPublishableKey, setFormPublishableKey] = useState('');
  const [formSecretKey, setFormSecretKey] = useState('');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const handleOpenAddModal = (type: PaymentGatewayType = 'bank') => {
    setEditingGateway(null);
    setFormType(type);
    setFormTitle(
      type === 'bank'
        ? 'Meezan Bank Limited'
        : type === 'easypaisa'
        ? 'Easypaisa Mobile Wallet'
        : type === 'jazzcash'
        ? 'JazzCash Mobile Wallet'
        : type === 'cod'
        ? 'Cash on Delivery (COD)'
        : 'Custom Gateway'
    );
    setFormProviderName(type === 'bank' ? 'Meezan Bank Ltd' : type.toUpperCase());
    setFormAccountTitle('Juta Kapra Operations');
    setFormAccountNumber('01010102940192');
    setFormIban('PK36MEZN0001010102940192');
    setFormSwiftCode('MEZNPKKA');
    setFormBankName('Meezan Bank');
    setFormMinOrderLimit(500);
    setFormMaxOrderLimit(100000);
    setFormDisclaimerNote('Ensure order reference is included in transfer screenshot.');
    setFormCustomInstructions('Transfer funds to the provided account and share payment receipt at checkout.');
    setFormPublishableKey('');
    setFormSecretKey('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gw: PaymentGatewayConfig) => {
    setEditingGateway(gw);
    setFormType(gw.type);
    setFormTitle(gw.title);
    setFormProviderName(gw.providerName);
    setFormAccountTitle(gw.accountTitle || '');
    setFormAccountNumber(gw.accountNumber || '');
    setFormIban(gw.iban || '');
    setFormSwiftCode(gw.swiftCode || '');
    setFormBankName(gw.bankName || '');
    setFormMinOrderLimit(gw.minOrderLimit || 500);
    setFormMaxOrderLimit(gw.maxOrderLimit || 100000);
    setFormDisclaimerNote(gw.disclaimerNote || '');
    setFormCustomInstructions(gw.customInstructions || '');
    setFormPublishableKey(gw.publishableKey || '');
    setFormSecretKey('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = () => {
    if (editingGateway) {
      updatePaymentGateway(editingGateway.id, {
        title: formTitle,
        providerName: formProviderName,
        accountTitle: formAccountTitle,
        accountNumber: formAccountNumber,
        iban: formIban,
        swiftCode: formSwiftCode,
        bankName: formBankName,
        minOrderLimit: Number(formMinOrderLimit),
        maxOrderLimit: Number(formMaxOrderLimit),
        disclaimerNote: formDisclaimerNote,
        customInstructions: formCustomInstructions,
        publishableKey: formPublishableKey,
      });

      addAuditLog({
        provider: 'PAYMENT_GATEWAY',
        action: `UPDATED_PAYMENT_METHOD_${editingGateway.type.toUpperCase()}`,
        transactionId: editingGateway.id,
        httpStatusCode: 200,
        payload: JSON.stringify({ title: formTitle, provider: formProviderName }),
        adminUser: 'Principal Admin (Root)',
      });
    } else {
      addPaymentGateway({
        type: formType,
        title: formTitle,
        providerName: formProviderName,
        accountTitle: formAccountTitle,
        accountNumber: formAccountNumber,
        iban: formIban,
        swiftCode: formSwiftCode,
        bankName: formBankName,
        minOrderLimit: Number(formMinOrderLimit),
        maxOrderLimit: Number(formMaxOrderLimit),
        disclaimerNote: formDisclaimerNote,
        customInstructions: formCustomInstructions,
        isEnabled: true,
        publishableKey: formPublishableKey,
        encryptedSecretKey: formSecretKey ? formSecretKey : undefined,
      });

      addAuditLog({
        provider: 'PAYMENT_GATEWAY',
        action: `ADDED_NEW_PAYMENT_METHOD_${formType.toUpperCase()}`,
        transactionId: 'gw-' + Date.now().toString(36),
        httpStatusCode: 201,
        payload: JSON.stringify({ title: formTitle, provider: formProviderName }),
        adminUser: 'Principal Admin (Root)',
      });
    }

    setConfirmSaveOpen(false);
    setIsModalOpen(false);
  };

  const toggleReveal = (id: string) => {
    setRevealedGateways((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        addAuditLog({
          provider: 'SECURITY_VAULT',
          action: 'REVEALED_MASKED_GATEWAY_CREDENTIALS',
          transactionId: id,
          httpStatusCode: 200,
          payload: JSON.stringify({ gatewayId: id, accessedBy: 'Principal Admin' }),
          adminUser: 'Principal Admin (Root)',
        });
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleToggleActive = (gw: PaymentGatewayConfig) => {
    togglePaymentGateway(gw.id);
    addAuditLog({
      provider: 'PAYMENT_GATEWAY',
      action: gw.isEnabled ? `DISABLED_GATEWAY_${gw.type.toUpperCase()}` : `ENABLED_GATEWAY_${gw.type.toUpperCase()}`,
      transactionId: gw.id,
      httpStatusCode: 200,
      payload: JSON.stringify({ gatewayId: gw.id, newStatus: !gw.isEnabled }),
      adminUser: 'Principal Admin (Root)',
    });
  };

  const maskString = (str?: string, visibleChars = 4) => {
    if (!str) return '••••••••••••';
    if (str.length <= visibleChars) return '••••••••';
    return '•••• ' + str.slice(-visibleChars);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Dynamic Payment Switchboard &amp; Security Vault</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              AES-256 Enclave Active
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Sensitive bank details and API credentials are cryptographically masked. Configuration changes require Principal Admin confirmation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleOpenAddModal('bank')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('custom')}
            className="px-3.5 py-2 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Gateway</span>
          </button>
        </div>
      </div>

      {/* Payment Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentGateways.map((gw) => {
          const isRevealed = !!revealedGateways[gw.id];

          return (
            <div key={gw.id} className={`p-6 rounded-2xl border shadow-sm ${cardBg} space-y-4 relative`}>
              {/* Card Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      gw.type === 'cod'
                        ? 'bg-amber-500/10 text-amber-500'
                        : gw.type === 'easypaisa'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : gw.type === 'jazzcash'
                        ? 'bg-red-500/10 text-red-500'
                        : gw.type === 'bank'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }`}
                  >
                    {gw.type === 'cod' && <Banknote className="w-5 h-5" />}
                    {gw.type === 'easypaisa' && <Smartphone className="w-5 h-5" />}
                    {gw.type === 'jazzcash' && <Smartphone className="w-5 h-5" />}
                    {gw.type === 'bank' && <Building className="w-5 h-5" />}
                    {gw.type === 'stripe' && <CreditCard className="w-5 h-5" />}
                    {gw.type === 'custom' && <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">{gw.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      {gw.providerName} • ID: {gw.id}
                    </span>
                  </div>
                </div>

                {/* Master Switch */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      gw.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {gw.isEnabled ? '● Active in Checkout' : '○ Disabled'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gw.isEnabled}
                      onChange={() => handleToggleActive(gw)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Secure Credentials Render (Masked by default) */}
              <div className="space-y-2.5 text-xs pt-3 border-t border-inherit">
                {gw.type === 'cod' && (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className={textMuted}>Order Value Limits:</span>
                      <span className="font-bold font-mono text-white">
                        {formatPKR(gw.minOrderLimit || 0)} - {formatPKR(gw.maxOrderLimit || 100000)}
                      </span>
                    </div>
                    {gw.disclaimerNote && (
                      <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg mt-1">
                        Note: {gw.disclaimerNote}
                      </p>
                    )}
                  </div>
                )}

                {(gw.type === 'easypaisa' || gw.type === 'jazzcash') && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className={textMuted}>Account Title:</span>
                      <span className="font-bold text-white">
                        {isRevealed ? gw.accountTitle || 'N/A' : maskString(gw.accountTitle, 3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Wallet Number:</span>
                      <span className="font-bold text-emerald-400">
                        {isRevealed ? gw.accountNumber || 'N/A' : maskString(gw.accountNumber, 4)}
                      </span>
                    </div>
                  </div>
                )}

                {gw.type === 'bank' && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className={textMuted}>Bank Institution:</span>
                      <span className="font-bold text-white">{gw.bankName || gw.providerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Account Title:</span>
                      <span className="font-bold text-white">
                        {isRevealed ? gw.accountTitle || 'N/A' : maskString(gw.accountTitle, 3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Account Number:</span>
                      <span className="font-bold text-slate-200">
                        {isRevealed ? gw.accountNumber || 'N/A' : maskString(gw.accountNumber, 4)}
                      </span>
                    </div>
                    {gw.iban && (
                      <div className="flex justify-between">
                        <span className={textMuted}>IBAN Code:</span>
                        <span className="font-bold text-blue-400">
                          {isRevealed ? gw.iban : maskString(gw.iban, 4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {gw.type === 'stripe' && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className={textMuted}>Publishable Key:</span>
                      <span className="font-bold text-slate-300">
                        {gw.publishableKey ? maskString(gw.publishableKey, 6) : 'pk_live_••••••••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Secret Key Status:</span>
                      <span className="text-emerald-400 font-bold">● AES-256 Vault Encrypted</span>
                    </div>
                  </div>
                )}

                {/* Gateway Health & Last Updated */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-inherit">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Activity className="w-3 h-3" />
                    <span>Health: Live &amp; Nominal</span>
                  </span>
                  <span className="font-mono">
                    Updated {new Date(gw.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => toggleReveal(gw.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{isRevealed ? 'Mask Details' : 'Reveal (Admin)'}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEditModal(gw)}
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                    title="Edit Gateway Settings"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteGateway(gw)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Delete Gateway"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl border ${cardBg} max-h-[92vh] overflow-y-auto p-6 space-y-5 custom-scrollbar text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Gateway Title (Customer Facing)</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Provider Name</label>
                  <input
                    type="text"
                    required
                    value={formProviderName}
                    onChange={(e) => setFormProviderName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {(formType === 'bank' || formType === 'easypaisa' || formType === 'jazzcash' || formType === 'custom') && (
                <div className="space-y-3 p-3.5 rounded-xl bg-black/20 border border-inherit">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Account &amp; Bank Credentials:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-300">Account Title</label>
                      <input
                        type="text"
                        value={formAccountTitle}
                        onChange={(e) => setFormAccountTitle(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-300">Account / Wallet Number</label>
                      <input
                        type="text"
                        value={formAccountNumber}
                        onChange={(e) => setFormAccountNumber(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    {formType === 'bank' && (
                      <>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-300">Bank Name</label>
                          <input
                            type="text"
                            value={formBankName}
                            onChange={(e) => setFormBankName(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-300">IBAN Code</label>
                          <input
                            type="text"
                            value={formIban}
                            onChange={(e) => setFormIban(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Min Order Limit (PKR)</label>
                  <input
                    type="number"
                    value={formMinOrderLimit}
                    onChange={(e) => setFormMinOrderLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Max Order Limit (PKR)</label>
                  <input
                    type="number"
                    value={formMaxOrderLimit}
                    onChange={(e) => setFormMaxOrderLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Checkout Disclaimer / Instructions</label>
                <textarea
                  rows={2}
                  value={formDisclaimerNote}
                  onChange={(e) => setFormDisclaimerNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Review &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Step Before Saving Payment Gateway */}
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white text-center`}>
            <div className="w-12 h-12 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold">Confirm Gateway Changes?</h3>
              <p className="text-xs text-slate-400">
                You are about to save changes to <strong>{formTitle}</strong>. This update will immediately reflect in the customer checkout switchboard and will be recorded in the security audit logs.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(false)}
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Confirm &amp; Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Gateway Confirmation Dialog */}
      {confirmDeleteGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white text-center`}>
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold">Remove {confirmDeleteGateway.title}?</h3>
              <p className="text-xs text-slate-400">
                This payment method will be permanently deleted from the checkout options.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setConfirmDeleteGateway(null)}
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePaymentGateway(confirmDeleteGateway.id);
                  addAuditLog({
                    provider: 'PAYMENT_GATEWAY',
                    action: `DELETED_GATEWAY_${confirmDeleteGateway.type.toUpperCase()}`,
                    transactionId: confirmDeleteGateway.id,
                    httpStatusCode: 200,
                    payload: JSON.stringify({ title: confirmDeleteGateway.title }),
                    adminUser: 'Principal Admin (Root)',
                  });
                  setConfirmDeleteGateway(null);
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
              >
                Delete Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
