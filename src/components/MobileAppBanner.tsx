import React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Video,
  Activity,
  MessageSquare,
  CheckCircle2,
  Apple,
  Play,
  ShieldCheck,
} from 'lucide-react';

export const MobileAppBanner: React.FC = () => {
  const features = [
    {
      id: 'sessions',
      icon: Video,
      title: 'Live & recorded sessions',
      description: 'Stream 1-on-1 calls, interactive workshops, and HD form check archives anywhere.',
      color: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'dashboard',
      icon: Activity,
      title: 'Progress dashboard',
      description: 'Log workouts, track daily macro adherence, and review visual transformation photos.',
      color: 'bg-sky-500/20 text-sky-400',
    },
    {
      id: 'chat',
      icon: MessageSquare,
      title: 'Direct coach chat',
      description: 'Send quick video form checks, exchange voice notes, and receive personalized adjustments.',
      color: 'bg-amber-500/20 text-amber-400',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-[#0d0d0e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Box */}
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#18181c] via-[#141416] to-[#101012] border border-white/[0.12] p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
          
          {/* Ambient Lighting Background Halos */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-neutral-700/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
            
            {/* Left Column: Headline, Bullet List, App Store Badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs font-bold text-white shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-white" />
                <span>iOS & Android App</span>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400 font-bold">Version 2.4 Live</span>
              </div>

              {/* Title & Subtext */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  Join on the go
                </h2>
                <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-xl">
                  Take your vetted coach with you to the gym, kitchen, and travels. Real-time feedback in your pocket.
                </p>
              </div>

              {/* Bullet List */}
              <div className="space-y-5">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-colors"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl ${feature.color} flex items-center justify-center shrink-0 shadow-inner`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-white">
                          {feature.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* App Store & Play Store Badges */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Apple App Store Badge */}
                <a
                  href="#app-store"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Apple className="w-7 h-7 fill-current shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 leading-none">
                      Download on the
                    </p>
                    <p className="text-base font-black text-black leading-tight">
                      App Store
                    </p>
                  </div>
                </a>

                {/* Google Play Store Badge */}
                <a
                  href="#play-store"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#1c1c20] hover:bg-[#25252b] border border-white/[0.15] text-white transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-6 h-6 fill-white text-white shrink-0 ml-0.5" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 leading-none">
                      Get it on
                    </p>
                    <p className="text-base font-black text-white leading-tight">
                      Google Play
                    </p>
                  </div>
                </a>
              </div>

              {/* Rating Proof */}
              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span className="text-white ml-1 font-extrabold">4.9 / 5.0</span>
                </div>
                <span>•</span>
                <span>Over 24,000+ app store reviews</span>
              </div>
            </motion.div>

            {/* Right Column: Phone Mockup with UI Preview & Live Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              {/* Outer Phone Mockup Frame */}
              <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-[#000000] rounded-[48px] p-3 border-4 border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10 overflow-hidden">
                
                {/* Dynamic Island / Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 mr-2" />
                  <div className="w-2 h-2 rounded-full bg-blue-900/60" />
                </div>

                
                {/* Inner Screen Content */}
                <div className="bg-[#121214] rounded-[40px] p-4 pt-10 text-white space-y-4 overflow-hidden border border-white/[0.04]">
                  
                  {/* Status Bar inside Mockup */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 px-2 pt-1">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-2 border border-neutral-400 rounded-sm inline-block" />
                    </div>
                  </div>

                  {/* Active Coach Call Pill on Phone */}
                  <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-white/[0.08] shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&auto=format&fit=crop&q=80"
                        alt="Verified Universifit Coach on live consultation call"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-extrabold text-white">Verified Coach</p>
                          <ShieldCheck className="w-3 h-3 text-sky-400" />
                        </div>
                        <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live 1-on-1 Video Call
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white/[0.08] px-2 py-1 rounded-full text-white/80">
                      18:42
                    </span>
                  </div>

                  {/* Today's Protocol Card */}
                  <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900 p-4 rounded-2xl border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        Today's Protocol
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        Legs & Posterior Chain
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Barbell Back Squat</span>
                        <span className="text-neutral-400">4 sets × 6 reps</span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full w-3/4" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Romanian Deadlift</span>
                        <span className="text-neutral-400">3 sets × 8 reps</span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full w-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Coach Voice Memo Waveform */}
                  <div className="p-3 bg-[#18181c] rounded-2xl border border-white/[0.06] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-bold text-white leading-none">
                        Coach feedback on RDL video
                      </p>
                      <div className="flex items-center gap-1 h-3">
                        {[40, 80, 50, 90, 70, 30, 85, 60, 95, 40, 75, 50].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-1 bg-neutral-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">0:45</span>
                  </div>

                </div>
              </div>

              {/* Floating App Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute -bottom-4 -left-4 sm:-left-8 bg-[#1e1e22]/95 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3 text-left max-w-[210px]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Instant Sync
                  </p>
                  <p className="text-xs font-bold text-white leading-tight">
                    Apple Health & Garmin
                  </p>
                </div>
              </motion.div>

            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
};
