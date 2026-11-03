import React, { useState } from 'react';
import { MapPin, Plus, Check, Trash2, Edit2, Phone, User, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerAddress } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AddressManagerProps {
  selectedAddressId?: string | null;
  onSelectAddress?: (address: CustomerAddress) => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({
  selectedAddressId = null,
  onSelectAddress = (_addr: CustomerAddress) => {},
}) => {
  const {
    currentCustomer,
    profile,
    updateProfile,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultCustomerAddress,
  } = useStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipientName: profile?.full_name || currentCustomer?.fullName || '',
    phone: profile?.phone || currentCustomer?.phone || '',
    address: '',
    apartment: '',
    city: 'Islamabad',
    state: 'ICT',
    postalCode: '44000',
    country: 'Pakistan',
    isDefault: false,
  });

  const addresses = currentCustomer?.addresses || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return;
    }

    if (editingAddressId) {
      updateCustomerAddress(editingAddressId, { ...formData });
      setEditingAddressId(null);
    } else {
      const created = addCustomerAddress({ ...formData });
      onSelectAddress?.(created);
      setIsAddingNew(false);
    }

    // Direct persistence to Supabase public.profiles table
    if (formData.isDefault || addresses.length === 0) {
      await updateProfile({
        address: formData.address,
        default_shipping_address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
      });
    }

    // Reset form
    setFormData({
      recipientName: profile?.full_name || currentCustomer?.fullName || '',
      phone: profile?.phone || currentCustomer?.phone || '',
      address: '',
      apartment: '',
      city: 'Islamabad',
      state: 'ICT',
      postalCode: '44000',
      country: 'Pakistan',
      isDefault: false,
    });
  };

  const handleStartEdit = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setFormData({
      recipientName: addr.recipientName || currentCustomer?.fullName || '',
      phone: addr.phone || currentCustomer?.phone || '',
      address: addr.address || '',
      apartment: addr.apartment || '',
      city: addr.city || 'Islamabad',
      state: addr.state || 'ICT',
      postalCode: addr.postalCode || '44000',
      country: addr.country || 'Pakistan',
      isDefault: addr.isDefault || false,
    });
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-[#0a0a0a]/10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#e5341f]" />
          <h3 className="font-bold text-sm text-[#0a0a0a]">Shipping Delivery Addresses</h3>
        </div>
        {!isAddingNew && !editingAddressId && (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setEditingAddressId(null);
              setFormData({
                recipientName: profile?.full_name || currentCustomer?.fullName || '',
                phone: profile?.phone || currentCustomer?.phone || '',
                address: '',
                apartment: '',
                city: 'Islamabad',
                state: 'ICT',
                postalCode: '44000',
                country: 'Pakistan',
                isDefault: addresses.length === 0,
              });
            }}
            className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] hover:bg-[#e5341f] text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Address List Radio Selection */}
      {!isAddingNew && !editingAddressId && (
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <p className="text-xs text-[#0a0a0a]/60 italic p-4 bg-[#fafafa] rounded-xl border text-center">
              No saved addresses found. Please add a shipping address below.
            </p>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative flex items-start justify-between ${
                    isSelected
                      ? 'border-[#0a0a0a] bg-white shadow-md ring-1 ring-[#0a0a0a]'
                      : 'border-[#0a0a0a]/15 bg-[#fafafa] hover:border-[#0a0a0a]/40'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="shippingAddressRadio"
                      checked={isSelected}
                      onChange={() => onSelectAddress(addr)}
                      className="mt-1 accent-[#0a0a0a] cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#0a0a0a]">
                          {addr.recipientName || currentCustomer?.fullName}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#0a0a0a]/80 leading-relaxed">
                        {addr.apartment ? `${addr.apartment}, ` : ''}
                        {addr.address}, {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <div className="flex items-center space-x-1 text-[11px] font-medium text-[#0a0a0a]/60 pt-0.5">
                        <Phone className="w-3 h-3 text-[#0a0a0a]/40" />
                        <span>SMS / WhatsApp: {addr.phone || currentCustomer?.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(addr);
                      }}
                      className="p-1.5 rounded-md hover:bg-[#0a0a0a]/5 text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomerAddress(addr.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Inline Add / Edit Address Form */}
      {(isAddingNew || editingAddressId) && (
        <form onSubmit={handleSaveAddress} className="p-5 bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#0a0a0a]/10">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0a0a0a]">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingAddressId(null);
              }}
              className="text-xs text-[#0a0a0a]/60 hover:text-[#0a0a0a] font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">
                Recipient Full Name <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-[#0a0a0a]/40 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="e.g. Zainab Malik"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">
                Phone Number (SMS/WhatsApp updates) <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative flex items-center">
                <Phone className="w-3.5 h-3.5 text-[#0a0a0a]/40 absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0300 5550192"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">
                Street Address / House No. <span className="text-[#e5341f]">*</span>
              </label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="House 42, Street 10, F-7/2"
                className="w-full px-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">
                Apartment / Suite (Optional)
              </label>
              <input
                type="text"
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                placeholder="Apt 4B"
                className="w-full px-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">
                City <span className="text-[#e5341f]">*</span>
              </label>
              <input
                type="text"
                required
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Islamabad"
                className="w-full px-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">State / Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="ICT / Punjab"
                className="w-full px-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0a0a0a] mb-1">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="44000"
                className="w-full px-3 py-2 bg-white border border-[#0a0a0a]/15 rounded-lg text-xs text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="accent-[#0a0a0a] cursor-pointer"
            />
            <label htmlFor="isDefaultCheckbox" className="text-xs text-[#0a0a0a] font-medium cursor-pointer">
              Set as my default shipping address
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingAddressId(null);
              }}
              className="px-3.5 py-2 rounded-lg border border-[#0a0a0a]/15 text-xs font-bold text-[#0a0a0a] hover:bg-[#fafafa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0a0a0a] hover:bg-[#e5341f] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {editingAddressId ? 'Update Address' : 'Save & Select Address'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
