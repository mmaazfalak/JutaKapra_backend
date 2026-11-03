import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DropEvent } from '../../types';

export const AdminDropsView: React.FC = () => {
  const { themeMode, navigateTo, addToast } = useStore();

  const [drops, setDrops] = useState<DropEvent[]>([
    {
      id: 'drop-01',
      title: '90s Graphic Tees & Distressed Denim Archive',
      dateStr: 'September 28, 2026 • 8:00 PM PKT',
      targetTimestamp: Date.now() + 5 * 24 * 60 * 60 * 1000,
      badge: 'Archival Vault Drop #09',
      description: 'Hand-sourced vintage tees and rare washed selvedge denim from Japan and UK archives.',
      bannerImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      itemCount: 24,
      category: 'Vintage Tees & Trousers',
      status: 'upcoming',
      previewProductIds: ['prod-001', 'prod-002'],
    },
    {
      id: 'drop-02',
      title: 'Rare 80s Leather & Flight Bomber Jackets',
      dateStr: 'October 12, 2026 • 9:00 PM PKT',
      targetTimestamp: Date.now() + 19 * 24 * 60 * 60 * 1000,
      badge: 'Heritage Outerwear Drop #10',
      description: 'Heavyweight distressed leather bombers and authentic flight aviation parkas.',
      bannerImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80',
      itemCount: 16,
      category: 'Jackets & Coats',
      status: 'upcoming',
      previewProductIds: ['prod-004'],
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formItemCount, setFormItemCount] = useState<number>(20);
  const [formCategory, setFormCategory] = useState('Vintage Tees & Trousers');
  const [formBannerImage, setFormBannerImage] = useState('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const handleSaveDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newDrop: DropEvent = {
      id: 'drop-' + Date.now().toString(36),
      title: formTitle.trim(),
      dateStr: formDate || 'Upcoming This Month',
      targetTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      badge: formBadge || 'Curated Vault Drop',
      description: formDescription,
      bannerImage: formBannerImage,
      itemCount: Number(formItemCount),
      category: formCategory,
      status: 'upcoming',
      previewProductIds: [],
    };

    setDrops([newDrop, ...drops]);
    setIsModalOpen(false);
    addToast({
      type: 'success',
      title: 'Drop Scheduled',
      message: `Drop "${newDrop.title}" added to the public calendar.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>Curated Drop Calendar &amp; Release Pipeline</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              {drops.length} Scheduled Releases
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Schedule curated 1-of-1 archival drops, configure countdown timers, and manage VIP early access drops.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Drop</span>
        </button>
      </div>

      {/* Drops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drops.map((d) => (
          <div key={d.id} className={`rounded-2xl border shadow-sm ${cardBg} overflow-hidden flex flex-col`}>
            <div className="relative h-44 bg-slate-900 overflow-hidden">
              <img src={d.bannerImage} alt={d.title} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12151c] via-transparent to-black/40" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/75 text-amber-400 border border-amber-400/30 backdrop-blur-sm flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{d.badge}</span>
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-blue-400 block font-bold">{d.dateStr}</span>
                <h4 className="text-base font-bold text-white leading-snug">{d.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{d.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-inherit text-xs">
                <span className="text-slate-400 font-medium font-mono">{d.itemCount} Pieces Curated</span>
                <button
                  onClick={() => navigateTo('drops')}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Preview Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Drop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Schedule New Archival Drop</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrop} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Drop Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 90s Graphic Tees Archive"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Release Date &amp; Time String</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. October 15, 2026 • 8:00 PM PKT"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Drop #11 • Limited Batch"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Banner Image URL</label>
                <input
                  type="url"
                  value={formBannerImage}
                  onChange={(e) => setFormBannerImage(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Drop Editorial Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the provenance and theme of this release..."
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
                  Publish to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
