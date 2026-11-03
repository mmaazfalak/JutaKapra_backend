import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { CategoryType } from '../types';

export const HomeView: React.FC = () => {
  const { products, stores, navigateTo, setSelectedCategory } = useStore();

  // Hidden store filter
  const hiddenStoreIds = new Set(
    stores.filter((s) => s.isHidden || s.status === 'suspended').map((s) => s.id)
  );

  // 4-up trending items: in-stock first, sold out moved to the last
  const trendingProducts = products
    .filter((p) => !p.isHidden && !p.isArchived && (!p.storeId || !hiddenStoreIds.has(p.storeId)))
    .sort((a, b) => {
      const aStock = a.inStock && (a.stockCount === undefined || a.stockCount > 0);
      const bStock = b.inStock && (b.stockCount === undefined || b.stockCount > 0);
      if (aStock && !bStock) return -1;
      if (!aStock && bStock) return 1;
      return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
    })
    .slice(0, 4);

  // Categories for bento grid
  const bentoCategories: {
    title: string;
    category: CategoryType;
    eraText: string;
    image: string;
    itemCount: string;
  }[] = [
    {
      title: 'Workwear & Jeans',
      category: 'Workwear & Jeans',
      eraText: 'Union-Made Detroit Duck, 70s Redline Denim, Carhartt Pants',
      image:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      itemCount: '24 Grails',
    },
    {
      title: 'Vintage Tees & Trousers',
      category: 'Vintage Tees & Trousers',
      eraText: 'Single-Stitch 80s & 90s Tour Merchandise, Archival Trousers',
      image:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      itemCount: '38 Grails',
    },
    {
      title: 'Jackets & Coats',
      category: 'Jackets & Coats',
      eraText: 'Stüssy Varsity, GORE-TEX Shells, Schott Leather Biker Jackets',
      image:
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      itemCount: '18 Grails',
    },
    {
      title: 'Sneakers & Boots',
      category: 'Sneakers & Boots',
      eraText: '1994 Air Jordan 1s, 2002 Nike SB Dunks, Wearable Vintage Footwear',
      image:
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      itemCount: '15 Grails',
    },
  ];

  const handleCategoryClick = (cat: CategoryType) => {
    setSelectedCategory(cat);
    navigateTo('shop');
  };

  return (
    <div className="space-y-10 sm:space-y-16 pb-20 font-sans pt-4 sm:pt-6">
      {/* =========================================================================
          TRENDING 4-UP GRAILS GRID
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* On Phone View: 3 products vertically stacked */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.map((prod, idx) => (
            <div key={prod.id} className={idx === 3 ? 'hidden sm:block' : 'block'}>
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          CATEGORY BENTO TILES
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0a0a0a]">
            Curated Category Archives
          </h2>
          <p className="text-xs sm:text-sm text-[#0a0a0a]/60 mt-1">
            Explore strictly categorized vintage aesthetics with zero fast fashion clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bentoCategories.map((bento, idx) => (
            <div
              key={bento.title}
              onClick={() => handleCategoryClick(bento.category)}
              className="group relative h-80 rounded-2xl overflow-hidden border border-[#0a0a0a]/15 cursor-pointer bg-[#0a0a0a]"
            >
              {/* Image background with dark overlay */}
              <img
                src={bento.image}
                alt={bento.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-all duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

              {/* Content on bottom */}
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {bento.itemCount}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white text-[#0a0a0a] flex items-center justify-center transform group-hover:translate-x-1 group-hover:bg-[#e5341f] group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-[#fafafa]">
                  {bento.title}
                </h3>
                <p className="text-xs text-white/80 mt-1 font-medium line-clamp-1">
                  {bento.eraText}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          TRUST BANNER: CONDITION GRADING SYSTEM PREVIEW
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#fafafa] border border-[#0a0a0a]/15 rounded-2xl p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-white border border-[#0a0a0a]/10 px-3 py-1 rounded-full text-xs font-bold text-[#0a0a0a]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>The Juta Kapra Inspection Standard</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0a0a0a]">
                How We Grade Vintage Condition
              </h3>
              <p className="text-xs sm:text-sm text-[#0a0a0a]/70 leading-relaxed">
                Thrifting online shouldn’t be a guessing game. Every garment undergoes a 12-point authentication protocol inspecting single-stitch hems, paper tags, seam integrity, and natural distress patterns.
              </p>
              <button
                onClick={() => navigateTo('condition-guide')}
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#0a0a0a] hover:text-[#e5341f] border-b-2 border-[#0a0a0a] hover:border-[#e5341f] pb-1 transition-colors"
              >
                <span>Read Full Condition &amp; Authenticity Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#0a0a0a]/10 space-y-2">
                <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Mint 10/10
                </span>
                <h4 className="font-bold text-sm text-[#0a0a0a]">Deadstock / Archive</h4>
                <p className="text-xs text-[#0a0a0a]/60 leading-relaxed">
                  Unworn or factory-stored condition with zero flaws, crisp original collar, and full garment color.
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#0a0a0a]/10 space-y-2">
                <span className="text-xs font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Good 8.5–9/10
                </span>
                <h4 className="font-bold text-sm text-[#0a0a0a]">Curated Vintage</h4>
                <p className="text-xs text-[#0a0a0a]/60 leading-relaxed">
                  Natural gentle wear, soft vintage cotton fade, and authentic graphic cracking with no structural damage.
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#0a0a0a]/10 space-y-2">
                <span className="text-xs font-black uppercase text-[#e5341f] bg-red-50 px-2 py-0.5 rounded">
                  Distressed 7/10
                </span>
                <h4 className="font-bold text-sm text-[#0a0a0a]">Patina 1-of-1</h4>
                <p className="text-xs text-[#0a0a0a]/60 leading-relaxed">
                  Honest workwear battle scars: authentic paint splatters, sun-fades, and frayed hems worn with pride.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
