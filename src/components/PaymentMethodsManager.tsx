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
  Zap,
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

      addToast({
        type: 'success',
        title: 'Payment Gateway Updated',
        message: `${formTitle} settings successfully updated.`,
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

      addToast({
        type: 'success',
        title: 'Payment Gateway Added',
        message: `${formTitle} configured and active for checkout.`,
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'info',
      title: `${label} Copied`,
      message: `${text} copied to clipboard.`,
    });
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
            Configure bank accounts, mobile wallets (JazzCash/Easypaisa), and Cash on Delivery with individual transaction limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('bank')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('easypaisa')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Wallet</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('custom')}
            className="px-3.5 py-2 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Configured Gateways</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{paymentGateways.length}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Supported checkout channels</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Active in Checkout</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {paymentGateways.filter((g) => g.isEnabled).length}
          </span>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Visible to buyers</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Encrypted Accounts</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
            {paymentGateways.filter((g) => g.accountNumber || g.iban).length}
          </span>
          <span className="text-[10px] text-blue-400/80 mt-1 block">Bank &amp; mobile numbers</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Security Enclave</span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-2 block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 100% Protected
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Audit trail recorded</span>
        </div>
      </div>

      {/* PAYMENT GATEWAYS IN ROWS (Enterprise Table Row Layout) */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-xl`}>
        {/* Table Header Row (Desktop) */}
        <div className="hidden xl:grid grid-cols-12 gap-3 px-5 py-3.5 bg-black/35 border-b border-inherit text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-3">Method &amp; Provider</div>
          <div className="col-span-3">Account Title &amp; Details</div>
          <div className="col-span-3">Order Limits &amp; Notes</div>
          <div className="col-span-2">Checkout Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows List */}
        <div className="divide-y divide-slate-800/80">
          {paymentGateways.map((gw) => {
            const isRevealed = !!revealedGateways[gw.id];

            return (
              <div
                key={gw.id}
                className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col xl:grid xl:grid-cols-12 gap-4 items-start xl:items-center"
              >
                {/* 1. Method & Provider (Cols 1-3) */}
                <div className="xl:col-span-3 flex items-start space-x-3 w-full">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-md ${
                      gw.type === 'cod'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : gw.type === 'easypaisa'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : gw.type === 'jazzcash'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : gw.type === 'bank'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {gw.type === 'cod' && <Banknote className="w-5 h-5" />}
                    {gw.type === 'easypaisa' && <Smartphone className="w-5 h-5" />}
                    {gw.type === 'jazzcash' && <Smartphone className="w-5 h-5" />}
                    {gw.type === 'bank' && <Building className="w-5 h-5" />}
                    {gw.type === 'stripe' && <CreditCard className="w-5 h-5" />}
                    {gw.type === 'custom' && <CreditCard className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-white tracking-tight truncate">{gw.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                      {gw.providerName} • <span className="text-slate-500">{gw.id}</span>
                    </span>
                    <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-black/30 border border-slate-700 text-slate-300">
                      {gw.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 2. Account Credentials & Details (Cols 4-6) */}
                <div className="xl:col-span-3 text-xs space-y-1.5 w-full bg-black/20 xl:bg-transparent p-3 xl:p-0 rounded-xl font-mono">
                  {gw.type === 'cod' ? (
                    <div className="font-sans text-xs text-slate-300">
                      <span className="font-semibold block text-amber-400">Cash on Delivery</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Rider collects payment at customer doorstep.
                      </span>
                    </div>
                  ) : (
                    <>
                      {gw.accountTitle && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-sans">Title:</span>
                          <span className="font-bold text-white truncate max-w-[180px]">
                            {isRevealed ? gw.accountTitle : maskString(gw.accountTitle, 3)}
                          </span>
                        </div>
                      )}

                      {gw.accountNumber && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-sans">
                            {gw.type === 'bank' ? 'Account #:' : 'Wallet #:'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-emerald-400">
                              {isRevealed ? gw.accountNumber : maskString(gw.accountNumber, 4)}
                            </span>
                            {isRevealed && (
                              <button
                                onClick={() => handleCopyText(gw.accountNumber || '', 'Account Number')}
                                className="text-slate-400 hover:text-white cursor-pointer"
                                title="Copy account number"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {gw.iban && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-sans">IBAN:</span>
                          <span className="font-bold text-blue-400 text-[11px] truncate max-w-[170px]">
                            {isRevealed ? gw.iban : maskString(gw.iban, 4)}
                          </span>
                        </div>
                      )}

                      {gw.bankName && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-sans">Bank:</span>
                          <span className="text-slate-300 font-semibold">{gw.bankName}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 3. Order Limits & Instructions (Cols 7-9) */}
                <div className="xl:col-span-3 text-xs w-full space-y-1">
                  <div className="flex items-center justify-between xl:justify-start gap-2">
                    <span className="text-[11px] text-slate-400">Limits:</span>
                    <span className="font-mono font-bold text-xs text-white">
                      {formatPKR(gw.minOrderLimit || 0)} - {formatPKR(gw.maxOrderLimit || 100000)}
                    </span>
                  </div>

                  {gw.disclaimerNote ? (
                    <p className="text-[11px] text-slate-300 line-clamp-2 bg-black/20 p-2 rounded-lg">
                      {gw.disclaimerNote}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No checkout disclaimer note set</p>
                  )}
                </div>

                {/* 4. Checkout Status Toggle (Cols 10-11) */}
                <div className="xl:col-span-2 flex items-center justify-between xl:justify-start gap-3 w-full">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      gw.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {gw.isEnabled ? '● Active' : '○ Disabled'}
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

                {/* 5. Row Actions (Col 12) */}
                <div className="xl:col-span-1 flex items-center justify-start xl:justify-end space-x-1.5 w-full">
                  {gw.type !== 'cod' && (
                    <button
                      onClick={() => toggleReveal(gw.id)}
                      title={isRevealed ? 'Mask Credentials' : 'Reveal Masked Credentials'}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(gw)}
                    title="Edit Gateway Settings"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteGateway(gw)}
                    title="Delete Gateway"
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {paymentGateways.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <CreditCard className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="font-bold text-sm text-white">No Payment Gateways Configured</h4>
              <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                Add at least one payment method (Bank Account, EasyPaisa, JazzCash, or COD) to enable customer checkout.
              </p>
              <button
                onClick={() => handleOpenAddModal('bank')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Add First Payment Gateway
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE OR EDIT PAYMENT GATEWAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white max-h-[92vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3 font-sans">
              <div>
                <h3 className="font-bold text-base">
                  {editingGateway ? `Edit Gateway: ${editingGateway.title}` : `Configure New ${formType.toUpperCase()} Gateway`}
                </h3>
                <span className="text-[11px] text-slate-400">Settings will apply dynamically to the live checkout switchboard</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
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
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md shadow-blue-600/30 active:scale-95"
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
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer active:scale-95"
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
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs cursor-pointer"
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
                  addToast({
                    type: 'info',
                    title: 'Gateway Removed',
                    message: `${confirmDeleteGateway.title} deleted from checkout options.`,
                  });
                  setConfirmDeleteGateway(null);
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
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
