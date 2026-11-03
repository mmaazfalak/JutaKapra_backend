import React from 'react';
import {
  ShieldCheck,
  Ruler,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ConditionGuideView: React.FC = () => {
  const { navigateTo, themeMode } = useStore();
  const isDark = themeMode === 'dark';

  const gradingTiers = [
    {
      score: '10 / 10',
      badge: 'MINT / DEADSTOCK',
      color: 'bg-emerald-600 text-white',
      desc: 'Unworn or factory-preserved condition. May feature original packaging, paper tags, or crisp unwashed factory starch. Zero dry rot or fabric degradation.',
      examples: 'Deadstock 1994 Jordans, unopened tour blanks, new-old-stock sunglasses.',
    },
    {
      score: '9.0 – 9.5 / 10',
      badge: 'ARCHIVAL GRADE',
      color: 'bg-[#0a0a0a] dark:bg-neutral-800 text-white',
      desc: 'Exceptional collector state. Gentle wash wear only. Collar ribbing remains tight and elastic. Graphic print is 95%+ intact with crisp contrast.',
      examples: '1993 Nirvana European Tour tee, golden embroidered 90s Arc\'teryx shells.',
    },
    {
      score: '8.0 – 8.5 / 10',
      badge: 'VINTAGE CHARACTER',
      color: 'bg-blue-600 text-white',
      desc: 'Soft, buttery worn-in handfeel. Authentic micro-cracking across vintage plastisol screenprints. Gentle sun-fade or wash patina without tears.',
      examples: '80s Sonic Youth tour shirts, 1995 Stüssy varsity jackets, vintage selvedge denim.',
    },
    {
      score: '7.0 – 7.5 / 10',
      badge: 'DISTRESSED 1-OF-1',
      color: 'bg-[#e5341f] text-white',
      desc: 'Heavy, unmistakable industrial and workwear patina. Authentic paint splatters, honeycombs, worn corduroy collars, or professional darning repairs.',
      examples: '1989 Carhartt Detroit Duck canvas jackets, 70s Levi\'s 501 66 single denim.',
    },
  ];

  const measurementSteps = [
    {
      title: 'Pit to Pit (Chest)',
      instruction: 'We lay the garment face down completely flat with natural tension. The tape is laid directly across from the bottom of one underarm seam to the opposite underarm seam.',
      tip: 'Double this measurement to compare with your body chest size.',
    },
    {
      title: 'Collar to Hem (Length)',
      instruction: 'Measured from the highest point where the collar seam meets the shoulder neckline, straight down to the lowest edge of the bottom waist hem.',
      tip: 'Boxy vintage tees generally feature wider chest with cropped 27-29" lengths.',
    },
    {
      title: 'Shoulder to Shoulder',
      instruction: 'Measured straight across the upper back from the top edge of the left shoulder seam directly across to the right shoulder seam.',
      tip: 'Raglan sleeves and drop-shoulder silhouettes do not have fixed shoulder seams.',
    },
    {
      title: 'Waist & Inseam (Pants & Workwear)',
      instruction: 'Waist is measured flat across the waistband multiplied by 2. Inseam is measured from the inner crotch intersection down to the bottom chain-stitched leg cuff.',
      tip: 'Vintage denim shrinks up to 2 inches; our measurements reflect actual current tape measurements.',
    },
  ];

  const authenticityCheckpoints = [
    {
      title: 'Single-Stitch Hem Verification',
      desc: 'Prior to ~1995, high-speed overlock industrial machines were not universally adopted. Authentic 80s and early-to-mid 90s American t-shirts feature a distinctive single row of thread stitching on the sleeve cuffs and waist hem.',
    },
    {
      title: 'Era-Correct Tag Chronology',
      desc: 'We cross-reference every woven and paper neck tag against our internal database of Giant by Tee Jays, Brockum Worldwide, Screen Stars, Spring Ford, Nutmeg, and Made-in-USA Carhartt craft Union tags.',
    },
    {
      title: 'Hardware & Zipper Metallurgical Check',
      desc: 'Authentic vintage outerwear features period-accurate hardware: Scovill gripper snaps, antique brass Talon zippers, Ideal pulls, and embossed YKK brass teeth.',
    },
    {
      title: 'Dry Rot & Fiber Ultraviolet Inspection',
      desc: 'Certain black 90s reactive dyes can develop "dry rot" sulfur degradation. Every dark tee is gently tension-tested and inspected under UV blacklight to guarantee structural longevity.',
    },
  ];

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
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Curator Standard Operating Procedure</span>
        </div>
        <h1 className={`text-2xl sm:text-5xl font-black tracking-[-0.04em] ${
          isDark ? 'text-white' : 'text-[#0a0a0a]'
        }`}>
          Vintage Grading &amp; Authenticity Protocol
        </h1>
        <p className={`text-xs sm:text-base leading-relaxed ${
          isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/75'
        }`}>
          Because vintage sizing varies drastically across eras and manufacturers, Juta Kapra guarantees exact tape measurements, photographic condition grading, and zero unauthorized reproductions.
        </p>
      </div>

      {/* Section 1: The 4 Condition Tiers */}
      <section className="space-y-6 sm:space-y-8">
        <div className={`border-b pb-4 ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#0a0a0a]'
          }`}>
            1. The 10-Point Condition Spectrum
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${
            isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'
          }`}>
            Every product card displays its condition rating so you know exactly what to expect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {gradingTiers.map((tier) => (
            <div
              key={tier.score}
              className={`rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between border ${
                isDark
                  ? 'bg-[#111317] border-neutral-800'
                  : 'bg-[#fafafa] border-[#0a0a0a]/15'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${tier.color}`}>
                    {tier.badge}
                  </span>
                  <span className={`text-base font-black font-mono ${
                    isDark ? 'text-white' : 'text-[#0a0a0a]'
                  }`}>{tier.score}</span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'text-neutral-300' : 'text-[#0a0a0a]/80'
                }`}>
                  {tier.desc}
                </p>
              </div>

              <div className={`pt-3 border-t text-xs ${
                isDark
                  ? 'border-neutral-800 text-neutral-400'
                  : 'border-[#0a0a0a]/10 text-[#0a0a0a]/60'
              }`}>
                <strong className={isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'}>Archival Examples:</strong> {tier.examples}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Garment Measurement Blueprint */}
      <section className="space-y-6 sm:space-y-8">
        <div className={`border-b pb-4 ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#0a0a0a]'
          }`}>
            2. How We Measure Garments
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${
            isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'
          }`}>
            Never rely on vintage tag size alone. Compare these measurements with your favorite fitting piece.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {measurementSteps.map((step, idx) => (
            <div
              key={step.title}
              className={`rounded-2xl p-5 sm:p-6 space-y-3 border ${
                isDark
                  ? 'bg-[#111317] border-neutral-800'
                  : 'bg-white border-[#0a0a0a]/15'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center ${
                  isDark ? 'bg-neutral-800 text-white' : 'bg-[#0a0a0a] text-white'
                }`}>
                  {idx + 1}
                </div>
                <h3 className={`font-black text-base ${
                  isDark ? 'text-white' : 'text-[#0a0a0a]'
                }`}>{step.title}</h3>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-neutral-300' : 'text-[#0a0a0a]/80'
              }`}>
                {step.instruction}
              </p>
              <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                isDark
                  ? 'bg-black/30 border-neutral-800 text-neutral-300'
                  : 'bg-[#fafafa] border-[#0a0a0a]/10 text-[#0a0a0a]/70'
              }`}>
                <Ruler className="w-4 h-4 text-[#e5341f] shrink-0 mt-0.5" />
                <span>{step.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Authenticity Verification Protocol */}
      <section className="space-y-6 sm:space-y-8">
        <div className={`border-b pb-4 ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#0a0a0a]'
          }`}>
            3. Authenticity &amp; Single-Stitch Verification
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${
            isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'
          }`}>
            Our physical appraisal process filters out bootlegs, modern reprints, and counterfeit labels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {authenticityCheckpoints.map((cp) => (
            <div
              key={cp.title}
              className={`p-5 sm:p-6 border rounded-2xl space-y-2.5 ${
                isDark
                  ? 'bg-[#111317] border-neutral-800'
                  : 'bg-[#fafafa] border-[#0a0a0a]/15'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <h3 className={`font-bold text-sm sm:text-base ${
                  isDark ? 'text-white' : 'text-[#0a0a0a]'
                }`}>{cp.title}</h3>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-neutral-300' : 'text-[#0a0a0a]/70'
              }`}>
                {cp.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <div className="bg-[#0a0a0a] border border-neutral-800 text-white p-6 sm:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">Ready to Find Your 1-of-1 Grail?</h3>
          <p className="text-xs sm:text-sm text-white/70 max-w-lg">
            Every garment listed is available for immediate dispatch with individual measurements and guaranteed authenticity.
          </p>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-md active:scale-95"
        >
          <span>Explore Vintage Vault</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
