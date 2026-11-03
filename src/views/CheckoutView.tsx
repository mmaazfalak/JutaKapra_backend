import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  ShoppingBag,
  Zap,
  MapPin,
  Clock,
  Building,
  Smartphone,
  Banknote,
  AlertTriangle,
  User,
  LogOut,
  Mail,
  Phone,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, CustomerAddress } from '../types';
import { formatPKR } from '../utils/format';
import { CheckoutGateModal } from '../components/CheckoutGateModal';
import { AddressManager } from '../components/AddressManager';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    freeShippingThreshold,
    createOrder,
    navigateTo,
    paymentGateways,
    currentCustomer,
    profile,
    isAuthLoading,
    updateProfile,
    setIsCheckoutGateOpen,
    openAuthModal,
    logoutCustomer,
  } = useStore();

  const activeGateways = paymentGateways.filter((g) => g.isEnabled);

  // Delivery Address & Form Data State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: 'Islamabad',
    state: 'ICT',
    postalCode: '44000',
    country: 'Pakistan',
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'pickup'>('standard');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(() => {
    return activeGateways.length > 0 ? activeGateways[0].id : 'cod';
  });

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize form inputs with rehydrated profile & currentCustomer
  useEffect(() => {
    if (profile || currentCustomer) {
      const activeUser = currentCustomer;
      const defaultAddr = activeUser?.addresses?.find((a) => a.isDefault) || activeUser?.addresses?.[0];
      const savedAddress = profile?.address || profile?.default_shipping_address || defaultAddr?.address || '';
      const savedCity = profile?.city || defaultAddr?.city || 'Islamabad';
      const savedState = profile?.state || defaultAddr?.state || 'ICT';
      const savedPostal = profile?.postal_code || defaultAddr?.postalCode || '44000';
      const savedCountry = profile?.country || defaultAddr?.country || 'Pakistan';
      const savedPhone = profile?.phone || defaultAddr?.phone || activeUser?.phone || '';
      const savedName = profile?.full_name || defaultAddr?.recipientName || activeUser?.fullName || '';
      const savedEmail = profile?.email || activeUser?.email || '';

      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
      }

      setFormData((prev) => ({
        fullName: savedName || prev.fullName,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone,
        address: savedAddress || prev.address,
        apartment: defaultAddr?.apartment || prev.apartment,
        city: savedCity || prev.city,
        state: savedState || prev.state,
        postalCode: savedPostal || prev.postalCode,
        country: savedCountry || prev.country,
      }));
    }
  }, [profile, currentCustomer]);

  // Helper to persist address directly to Supabase public.profiles
  const persistAddressToSupabase = async (
    formAddress: string,
    formCity: string,
    formState: string,
    formPostalCode: string,
    formCountry: string,
    formPhone: string,
    formFullName: string
  ) => {
    if (!formAddress.trim()) return;
    await updateProfile({
      address: formAddress,
      default_shipping_address: formAddress,
      city: formCity,
      state: formState,
      postal_code: formPostalCode,
      country: formCountry,
      phone: formPhone,
      full_name: formFullName,
    });
  };

  const handleSelectAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    const updated = {
      fullName: addr.recipientName || currentCustomer?.fullName || '',
      email: currentCustomer?.email || '',
      phone: addr.phone || currentCustomer?.phone || '',
      address: addr.address || '',
      apartment: addr.apartment || '',
      city: addr.city || 'Islamabad',
      state: addr.state || 'ICT',
      postalCode: addr.postalCode || '44000',
      country: addr.country || 'Pakistan',
    };
    setFormData(updated);
    setValidationError(null);

    // Persist to Supabase public.profiles
    persistAddressToSupabase(
      updated.address,
      updated.city,
      updated.state,
      updated.postalCode,
      updated.country,
      updated.phone,
      updated.fullName
    );
  };

  // Calculations
  const shippingFee =
    shippingMethod === 'pickup'
      ? 0
      : shippingMethod === 'express'
      ? 500
      : cartSubtotal >= freeShippingThreshold
      ? 0
      : 250;

  const estimatedTax = Math.round(cartSubtotal * 0.05);
  const orderTotal = cartSubtotal + shippingFee + estimatedTax;

  const selectedGateway = activeGateways.find((g) => g.id === selectedGatewayId) || activeGateways[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCustomer && !profile) {
      setIsCheckoutGateOpen(true);
      return;
    }

    if (!formData.phone.trim()) {
      setValidationError('Please provide a mandatory phone number for SMS/WhatsApp delivery updates.');
      return;
    }

    if (!formData.address.trim() || !formData.city.trim()) {
      setValidationError('Please select or add a complete delivery shipping address.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    // Persist address to Supabase on order submission
    persistAddressToSupabase(
      formData.address,
      formData.city,
      formData.state,
      formData.postalCode,
      formData.country,
      formData.phone,
      formData.fullName
    );

    setTimeout(() => {
      const newOrder = createOrder({
        customer: { ...formData },
        items: [...cart],
        subtotal: cartSubtotal,
        shipping: shippingFee,
        discount: 0,
        total: orderTotal,
        paymentMethod: selectedGateway.type || selectedGateway.id,
        status: 'Processing',
      });
      setCompletedOrder(newOrder);
      setIsSubmitting(false);
    }, 800);
  };

  // Receipt view upon completion
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 font-sans">
        <div className="bg-white border border-[#0a0a0a]/15 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="bg-[#0a0a0a] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
              ORDER CONFIRMED • {completedOrder.orderNumber}
            </span>
            <h1 className="text-3xl font-black text-[#0a0a0a] tracking-tight">
              Grail Acquired. Thank You!
            </h1>
            <p className="text-xs sm:text-sm text-[#0a0a0a]/70 max-w-md mx-auto">
              Your 1-of-1 archival order has been reserved. You can view your live courier dispatch tracking anytime under your account orders.
            </p>
          </div>

          <div className="bg-[#fafafa] border border-[#0a0a0a]/10 rounded-xl p-6 divide-y divide-[#0a0a0a]/10 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4">
              <div>
                <span className="text-[#0a0a0a]/50 block">Order Number</span>
                <strong className="font-bold text-[#0a0a0a] font-mono text-sm">{completedOrder.orderNumber}</strong>
              </div>
              <div>
                <span className="text-[#0a0a0a]/50 block">Payment Method</span>
                <strong className="font-bold text-[#0a0a0a] uppercase">{completedOrder.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-[#0a0a0a]/50 block">Destination</span>
                <strong className="font-bold text-[#0a0a0a]">{completedOrder.customer.city}, {completedOrder.customer.state}</strong>
              </div>
              <div>
                <span className="text-[#0a0a0a]/50 block">Total Charged</span>
                <strong className="font-black text-[#0a0a0a] text-sm">{formatPKR(completedOrder.total)}</strong>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <span className="font-black uppercase tracking-wider text-[#0a0a0a]/60 block text-[11px]">
                Items Reserved ({completedOrder.items.length})
              </span>
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-10 h-12 object-cover rounded border border-[#0a0a0a]/10"
                    />
                    <div>
                      <h4 className="font-bold text-[#0a0a0a] line-clamp-1">{item.product.title}</h4>
                      <p className="text-[11px] text-[#0a0a0a]/60">Size: {item.selectedSize} • Grade: {item.product.conditionGrade}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#0a0a0a]">{formatPKR(item.product.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => navigateTo('account-orders')}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
            >
              <span>View Live Courier Tracking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('shop')}
              className="h-12 px-6 border border-[#0a0a0a]/15 hover:border-[#0a0a0a] rounded-xl text-xs font-bold text-[#0a0a0a] transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-2xl font-black text-[#0a0a0a]">No items in shopping bag</h2>
        <p className="text-xs text-[#0a0a0a]/60 mt-1">Please add a vintage item before proceeding to checkout.</p>
        <button
          onClick={() => navigateTo('shop')}
          className="mt-5 bg-[#0a0a0a] text-white px-5 py-2.5 rounded-lg text-xs font-bold"
        >
          Browse Vintage Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans">
      {/* Checkout Interception Auth Gate Modal Component */}
      <CheckoutGateModal />

      {/* Breadcrumb */}
      <div className="border-b border-[#0a0a0a]/10 pb-4 mb-8 flex items-center justify-between">
        <button
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0a0a0a]/70 hover:text-[#0a0a0a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shopping Bag</span>
        </button>
        <div className="flex items-center space-x-2 text-xs text-[#0a0a0a]/60">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Checkout Protocol</span>
        </div>
      </div>

      {/* Unauthenticated Checkout Gate Banner Intercept */}
      {!currentCustomer && (
        <div className="mb-8 p-6 bg-[#0a0a0a] text-white rounded-2xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-[#e5341f] flex items-center justify-center font-bold shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Authentication Required for Checkout</h3>
              <p className="text-xs text-white/70">
                Sign in with Google OAuth 2.0 or Email to auto-fill delivery addresses &amp; place your order.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('google')}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white text-xs font-bold transition-all cursor-pointer shadow-md whitespace-nowrap flex items-center justify-center space-x-2"
          >
            <span>Sign In / Continue with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Authenticated Account Session Badge */}
      {currentCustomer && (
        <div className="mb-8 p-4 bg-[#fafafa] border border-[#0a0a0a]/15 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentCustomer.avatarUrl ? (
              <img
                src={currentCustomer.avatarUrl}
                alt={currentCustomer.fullName}
                className="w-10 h-10 rounded-full border border-[#0a0a0a]/20 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#0a0a0a]">{currentCustomer.fullName}</span>
                {currentCustomer.authProvider === 'google' && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center space-x-1">
                    <span>Google OAuth</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#0a0a0a]/60 block">{currentCustomer.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutCustomer}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Account</span>
          </button>
        </div>
      )}

      {/* Validation Alert */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Forms) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#0a0a0a] text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-black tracking-tight text-[#0a0a0a]">
                Customer Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0a0a0a] mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0a0a0a] mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0a0a0a] mb-1">
                  Phone / Mobile Number (Mandatory for SMS/WhatsApp) <span className="text-[#e5341f]">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0300 5550192"
                  className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a]"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Saved Shipping Addresses Manager */}
          <div className="space-y-4 pt-4 border-t border-[#0a0a0a]/10">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#0a0a0a] text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-black tracking-tight text-[#0a0a0a]">
                Delivery Address &amp; Multiple Saved Addresses
              </h2>
            </div>

            <AddressManager
              selectedAddressId={selectedAddressId}
              onSelectAddress={handleSelectAddress}
            />
          </div>

          {/* Step 3: Dynamic Payment Methods Selection */}
          <div className="space-y-4 pt-4 border-t border-[#0a0a0a]/10">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#0a0a0a] text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-black tracking-tight text-[#0a0a0a]">
                Payment Option
              </h2>
            </div>

            {activeGateways.length === 0 ? (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center space-x-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>All payment methods are currently disabled by store management.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGateways.map((gw) => {
                  const isSelected = selectedGatewayId === gw.id;
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setSelectedGatewayId(gw.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-[#0a0a0a] bg-white ring-2 ring-[#0a0a0a]'
                          : 'border-[#0a0a0a]/15 bg-[#fafafa] hover:bg-white'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#0a0a0a]/5 text-[#0a0a0a] shrink-0 mt-0.5">
                        {gw.type === 'cod' && <Banknote className="w-4 h-4" />}
                        {gw.type === 'easypaisa' && <Smartphone className="w-4 h-4 text-emerald-600" />}
                        {gw.type === 'jazzcash' && <Smartphone className="w-4 h-4 text-red-600" />}
                        {gw.type === 'bank' && <Building className="w-4 h-4 text-blue-600" />}
                        {gw.type === 'stripe' && <CreditCard className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#0a0a0a] block truncate">{gw.title}</span>
                        <span className="text-[10px] text-[#0a0a0a]/60 uppercase font-mono block">
                          {gw.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dynamic Instructions & Account Details Render */}
            {selectedGateway && (
              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#0a0a0a]/15 text-xs space-y-2">
                <div className="font-bold text-[#0a0a0a]">{selectedGateway.title} Payment Info</div>

                {selectedGateway.type === 'cod' && (
                  <div className="space-y-1 text-[#0a0a0a]/80">
                    <p>Order Total: <strong>{formatPKR(orderTotal)}</strong></p>
                    {selectedGateway.disclaimerNote && (
                      <p className="text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-[11px]">
                        {selectedGateway.disclaimerNote}
                      </p>
                    )}
                  </div>
                )}

                {(selectedGateway.type === 'easypaisa' || selectedGateway.type === 'jazzcash') && (
                  <div className="space-y-1 font-mono text-[11px] bg-white p-3 rounded-lg border border-[#0a0a0a]/10">
                    <div>Account Title: <strong>{selectedGateway.accountTitle || 'Forge Supply Operations'}</strong></div>
                    <div>Mobile Wallet Number: <strong className="text-emerald-700">{selectedGateway.accountNumber || '0300 5550192'}</strong></div>
                    {selectedGateway.customInstructions && (
                      <p className="text-[10px] text-[#0a0a0a]/60 pt-1 border-t mt-1 font-sans">{selectedGateway.customInstructions}</p>
                    )}
                  </div>
                )}

                {selectedGateway.type === 'bank' && (
                  <div className="space-y-1 font-mono text-[11px] bg-white p-3 rounded-lg border border-[#0a0a0a]/10">
                    <div>Bank Name: <strong>{selectedGateway.bankName || 'Meezan Bank Ltd'}</strong></div>
                    <div>Account Title: <strong>{selectedGateway.accountTitle || 'Forge Supply Pvt Ltd'}</strong></div>
                    <div>Account Number: <strong>{selectedGateway.accountNumber || '01010102940192'}</strong></div>
                    {selectedGateway.iban && <div>IBAN: <strong className="text-blue-700">{selectedGateway.iban}</strong></div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Order Summary) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#fafafa] border border-[#0a0a0a]/15 rounded-2xl p-6 space-y-6 sticky top-28">
            <h3 className="font-black text-sm uppercase tracking-wider text-[#0a0a0a] border-b border-[#0a0a0a]/10 pb-3">
              Order Summary ({cart.length} Thrift Item{cart.length > 1 ? 's' : ''})
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-10 h-12 object-cover rounded border border-[#0a0a0a]/10"
                    />
                    <div>
                      <h4 className="font-bold text-[#0a0a0a] truncate max-w-[180px]">{item.product.title}</h4>
                      <p className="text-[11px] text-[#0a0a0a]/60">Size: {item.selectedSize} • 1-of-1</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#0a0a0a]">{formatPKR(item.product.price)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#0a0a0a]/10 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#0a0a0a]/70">
                <span>Subtotal</span>
                <span className="font-bold text-[#0a0a0a]">{formatPKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#0a0a0a]/70">
                <span>Estimated Shipping</span>
                <span className="font-bold text-[#0a0a0a]">
                  {shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-[#0a0a0a]/70">
                <span>Estimated Tax (5%)</span>
                <span className="font-bold text-[#0a0a0a]">{formatPKR(estimatedTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#0a0a0a] pt-2 border-t border-[#0a0a0a]/10">
                <span>Total Amount</span>
                <span className="text-base text-[#e5341f]">{formatPKR(orderTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || activeGateways.length === 0}
              className={`w-full py-4 rounded-xl bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                isSubmitting || activeGateways.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Order...' : 'Confirm Order & Reserve Grail'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
