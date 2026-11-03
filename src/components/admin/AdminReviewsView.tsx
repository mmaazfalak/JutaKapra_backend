import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MessageSquare,
  ShieldCheck,
  User,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Review } from '../../types';

export const AdminReviewsView: React.FC = () => {
  const { reviews, toggleReviewStatus, themeMode } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Pending'>('All');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      r.customerName.toLowerCase().includes(q) ||
      r.productTitle.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const publishedCount = reviews.filter((r) => r.status === 'Published').length;
  const pendingCount = reviews.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span>Customer Reviews &amp; Social Proof Moderation</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {publishedCount} Published
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Review, curate, and moderate buyer feedback for 1-of-1 archival apparel and footwear pieces.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by buyer, piece, keyword..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-inherit bg-transparent text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          {(['All', 'Published', 'Pending'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-black/20 dark:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Archival Piece</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Review Comment</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-sans">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No customer reviews yet</p>
                    <p className="text-xs text-slate-500 mt-1">Verified buyer reviews for vintage pieces will appear here for moderation.</p>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-white">{r.customerName}</td>
                    <td className="p-3.5 text-slate-300 max-w-[200px] truncate">{r.productTitle}</td>
                    <td className="p-3.5">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-[260px] truncate text-xs">{r.comment}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{r.date}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Published'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => toggleReviewStatus(r.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          r.status === 'Published'
                            ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                      >
                        {r.status === 'Published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
