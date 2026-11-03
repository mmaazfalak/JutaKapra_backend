import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building,
  Sparkles,
} from 'lucide-react';
import { STORE_LOCATIONS } from '../data/mockData';
import { useStore } from '../context/StoreContext';

export const ContactView: React.FC = () => {
  const { addToast, themeMode } = useStore();
  const isDark = themeMode === 'dark';

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'Consign / Sell Vintage Pieces to Juta Kapra',
    message: '',
  });

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is your return policy on 1-of-1 vintage pieces?',
      a: 'Because all garments in the Juta Kapra vault are unique, one-of-a-kind physical artifacts, all sales are final once delivered. However, if a piece has a factual measurement discrepancy greater than 1 inch from our listing, or if there is an unlisted defect, we offer an immediate full refund and prepaid return label.',
    },
    {
      q: 'How do you authenticate vintage t-shirts and band tour merchandise?',
      a: 'We physically inspect every garment in our Lower East Side studio. Authentication criteria include single-stitch hem construction (pre-1995), collar tag composition (paper vs woven), copyright imprint typography, dry-rot tensile tests, and ultraviolet illumination inspection.',
    },
    {
      q: 'Can I sell or consign my vintage collection to Juta Kapra?',
      a: 'Yes. We purchase outright and consign single grails and entire estates. We look for 1980s–1990s band tour shirts, Made in USA Carhartt Detroit and active jackets, vintage 501 redline denim, and pre-2005 streetwear. Submit photos using the contact form on this page.',
    },
    {
      q: 'How fast do orders ship?',
      a: 'All items are held in stock in New York and ship within 24 to 48 business hours. US orders over $75 receive Free Insured Signature-Tracked Shipping. International orders are handled via express courier with prepaid customs clearing.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    addToast({
      type: 'success',
      title: 'Message Dispatched',
      message: `Thank you ${formState.name}. A curator will respond within 24 hours.`,
    });
    setFormState({
      name: '',
      email: '',
      subject: 'Consign / Sell Vintage Pieces to Juta Kapra',
      message: '',
    });
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 font-sans space-y-12 sm:space-y-16 ${
      isDark ? 'text-neutral-100' : 'text-[#0a0a0a]'
    }`}>
      {/* Header */}
      <div className="max-w-3xl space-y-3 sm:space-y-4">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${
          isDark
            ? 'bg-neutral-900 border border-neutral-800 text-neutral-200'
            : 'bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a]'
        }`}>
          <MapPin className="w-4 h-4 text-[#e5341f]" />
          <span>Global Archival Spaces</span>
        </div>
        <h1 className={`text-2xl sm:text-5xl font-black tracking-[-0.04em] ${
          isDark ? 'text-white' : 'text-[#0a0a0a]'
        }`}>
          Store Locations &amp; Vintage Inquiries
        </h1>
        <p className={`text-xs sm:text-base leading-relaxed ${
          isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/75'
        }`}>
          Visit our permanent flagship in Manhattan, browse our pop-up vaults in Tokyo and London, or submit vintage items for cash appraisal and consignment.
        </p>
      </div>

      {/* Store Locator Cards Grid */}
      <section className="space-y-6">
        <div className={`border-b pb-3 ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#0a0a0a]'
          }`}>
            Physical Storefronts &amp; Pop-Up Archives
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORE_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              className={`rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col justify-between border ${
                isDark
                  ? 'bg-[#111317] border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-[#0a0a0a]/15 hover:border-[#0a0a0a]/40'
              }`}
            >
              <div className="relative h-48 bg-[#f4f4f4] overflow-hidden">
                <img
                  src={loc.image}
                  alt={loc.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-wider ${
                      loc.isPopUp
                        ? 'bg-[#e5341f] text-white'
                        : isDark ? 'bg-neutral-900 border border-neutral-700 text-white' : 'bg-[#0a0a0a] text-white'
                    }`}
                  >
                    {loc.type}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>{loc.name}</h3>
                  <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'}`}>
                    {loc.neighborhood}
                  </p>

                  <div className={`mt-3 space-y-2 text-xs ${isDark ? 'text-neutral-300' : 'text-[#0a0a0a]/80'}`}>
                    <div className="flex items-start space-x-2">
                      <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/50'}`} />
                      <span>{loc.address}, {loc.city}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/50'}`} />
                      <span>{loc.hours}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Phone className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/50'}`} />
                      <span>{loc.phone}</span>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark
                    ? 'border-neutral-800 text-neutral-400'
                    : 'border-[#0a0a0a]/10 text-[#0a0a0a]/50'
                }`}>
                  <span>GPS: {loc.coordinates}</span>
                  <span className={`font-bold ${isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'}`}>Walk-Ins Welcome</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2-Column: Contact/Consignment Form + FAQ Accordion */}
      <section className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-6 border-t ${
        isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'
      }`}>
        {/* Left Column: Form */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#0a0a0a]'
            }`}>
              Consign with Us / General Inquiries
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'
            }`}>
              Have vintage Grails to sell? Send details or ask about orders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1 ${
                isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'
              }`}>Your Name *</label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Julian Thorne"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                    : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${
                isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'
              }`}>Email Address *</label>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                placeholder="julian@example.com"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                    : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${
                isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'
              }`}>Topic / Inquiry Type</label>
              <select
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                    : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                }`}
              >
                <option value="Consign / Sell Vintage Pieces to Juta Kapra">Sell / Consign Vintage Pieces to Juta Kapra</option>
                <option value="Order & Shipment Tracking">Order &amp; Shipment Tracking</option>
                <option value="Authenticity Verification Inquiry">Authenticity Verification Inquiry</option>
                <option value="Press & Pop-Up Hosting">Press &amp; Pop-Up Hosting</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${
                isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'
              }`}>Message / Item Details *</label>
              <textarea
                rows={4}
                required
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                placeholder="Provide garment tags, era, condition, and estimated asking price..."
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                    : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                }`}
              />
            </div>

            <button
              type="submit"
              className="h-11 sm:h-12 px-6 bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Submit Inquiry to Curators</span>
            </button>
          </form>
        </div>

        {/* Right Column: FAQ Accordion */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#0a0a0a]'
            }`}>
              Vintage FAQ &amp; Collector Policies
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'
            }`}>
              Important information regarding 1-of-1 items, delivery, and authenticity guarantees.
            </p>
          </div>

          <div className={`divide-y rounded-2xl overflow-hidden shadow-sm border ${
            isDark
              ? 'bg-[#111317] border-neutral-800 divide-neutral-800'
              : 'bg-white border-[#0a0a0a]/15 divide-[#0a0a0a]/10'
          }`}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="p-4 sm:p-5">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className={`w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                      isDark
                        ? 'text-white hover:text-[#e5341f]'
                        : 'text-[#0a0a0a] hover:text-[#e5341f]'
                    }`}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className={`w-4 h-4 shrink-0 ml-2 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 shrink-0 ml-2 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'}`} />
                    )}
                  </button>
                  {isOpen && (
                    <p className={`mt-3 text-xs leading-relaxed pt-2 border-t ${
                      isDark
                        ? 'text-neutral-300 border-neutral-800'
                        : 'text-[#0a0a0a]/70 border-[#0a0a0a]/5'
                    }`}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
