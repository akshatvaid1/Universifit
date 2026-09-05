import React, { useState } from 'react';
import { Users, Eye, CheckCircle2, Zap, Trophy, Shield, Activity } from 'lucide-react';
import {
  type EarningsTimelineItem,
  type StudentCountTrendItem,
  type TrafficTimelineItem,
  type CreatorCommunityAnalyticsData,
} from '../services/api';

/**
 * Interactive SVG Line Chart for Earnings Over Time (Gross & Net Revenue)
 */
export const EarningsLineChart: React.FC<{
  data: EarningsTimelineItem[];
}> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-white/50">No earnings telemetry recorded yet.</div>;
  }

  const svgWidth = 650;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const maxGross = Math.max(...data.map((d) => d.grossEarnings), 8000);
  const yTicks = [0, maxGross * 0.33, maxGross * 0.66, maxGross];

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return padTop + chartHeight - (value / maxGross) * chartHeight;
  };

  // Build Gross Polyline & Area Paths
  const grossPoints = data.map((d, i) => `${getX(i)},${getY(d.grossEarnings)}`).join(' ');
  const netPoints = data.map((d, i) => `${getX(i)},${getY(d.netEarnings)}`).join(' ');

  const grossAreaPath = `M ${getX(0)},${padTop + chartHeight} L ${data
    .map((d, i) => `${getX(i)},${getY(d.grossEarnings)}`)
    .join(' L ')} L ${getX(data.length - 1)},${padTop + chartHeight} Z`;

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="space-y-4 font-sans">
      {/* Chart Header & Active Value Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B8703F]" />
            <span className="text-xs font-semibold text-[#F7F4EF]/80">Gross Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6E8B6F]" />
            <span className="text-xs font-semibold text-[#F7F4EF]/80">Net Payout (85%)</span>
          </div>
        </div>

        {activeItem && (
          <div className="text-right flex items-center gap-3">
            <span className="text-xs text-[#F7F4EF]/50 font-mono">{activeItem.period}</span>
            <span className="text-sm font-bold font-display text-[#B8703F]">
              ${activeItem.grossEarnings.toLocaleString()}
            </span>
            <span className="text-xs font-bold font-mono text-[#6E8B6F] bg-[#6E8B6F]/10 px-2 py-0.5 rounded-full">
              Net: ${activeItem.netEarnings.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Copper Gradient for Gross */}
            <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8703F" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B8703F" stopOpacity="0.0" />
            </linearGradient>
            {/* Sage Gradient for Net */}
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E8B6F" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6E8B6F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const yPos = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 4}
                  fill="rgba(247,244,239,0.4)"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  ${Math.round(tick).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Under Gross */}
          <path d={grossAreaPath} fill="url(#grossGradient)" />

          {/* Net Line */}
          <polyline
            points={netPoints}
            fill="none"
            stroke="#6E8B6F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gross Line */}
          <polyline
            points={grossPoints}
            fill="none"
            stroke="#B8703F"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & Hover Targets */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cyGross = getY(d.grossEarnings);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + chartHeight}
                    stroke="rgba(184,112,63,0.5)"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cyGross}
                  r={isHovered ? 6 : 4}
                  fill="#16171A"
                  stroke="#B8703F"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* X-Axis Label */}
                <text
                  x={cx}
                  y={padTop + chartHeight + 18}
                  fill={isHovered ? '#F7F4EF' : 'rgba(247,244,239,0.5)'}
                  fontSize="11"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * Interactive SVG Line/Area Chart for Student Count Trend
 */
export const StudentTrendChart: React.FC<{
  data: StudentCountTrendItem[];
}> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-white/50">No student telemetry recorded yet.</div>;
  }

  const svgWidth = 650;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const maxStudents = Math.max(...data.map((d) => d.totalStudents), 200);
  const yTicks = [0, maxStudents * 0.33, maxStudents * 0.66, maxStudents];

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return padTop + chartHeight - (value / maxStudents) * chartHeight;
  };

  const studentPoints = data.map((d, i) => `${getX(i)},${getY(d.totalStudents)}`).join(' ');
  const studentAreaPath = `M ${getX(0)},${padTop + chartHeight} L ${data
    .map((d, i) => `${getX(i)},${getY(d.totalStudents)}`)
    .join(' L ')} L ${getX(data.length - 1)},${padTop + chartHeight} Z`;

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-400" />
          <span className="text-xs font-semibold text-[#F7F4EF]/80">Cumulative Enrolled Athletes</span>
        </div>

        {activeItem && (
          <div className="text-right flex items-center gap-3">
            <span className="text-xs text-[#F7F4EF]/50 font-mono">{activeItem.period}</span>
            <span className="text-sm font-bold font-display text-sky-400">
              {activeItem.totalStudents} Active Athletes
            </span>
            <span className="text-xs font-bold font-mono text-[#6E8B6F] bg-[#6E8B6F]/10 px-2 py-0.5 rounded-full">
              +{activeItem.newStudents} New Cohort
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => {
            const yPos = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  fill="rgba(247,244,239,0.4)"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          <path d={studentAreaPath} fill="url(#studentGradient)" />

          <polyline
            points={studentPoints}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.totalStudents);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + chartHeight}
                    stroke="rgba(56,189,248,0.5)"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#16171A"
                  stroke="#38BDF8"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                <text
                  x={cx}
                  y={padTop + chartHeight + 18}
                  fill={isHovered ? '#F7F4EF' : 'rgba(247,244,239,0.5)'}
                  fontSize="11"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * Interactive Storefront Traffic & Conversion Histogram
 */
export const StorefrontTrafficChart: React.FC<{
  data: TrafficTimelineItem[];
}> = ({ data }) => {
  const [hoveredItem, setHoveredItem] = useState<TrafficTimelineItem | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-white/50">No storefront traffic telemetry yet.</div>;
  }

  const maxViews = Math.max(...data.map((d) => d.views), 100);

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B8703F]" />
            <span className="text-xs font-semibold text-[#F7F4EF]/80">Daily Storefront Impressions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6E8B6F]" />
            <span className="text-xs font-semibold text-[#F7F4EF]/80">Paid Checkouts</span>
          </div>
        </div>

        {hoveredItem ? (
          <div className="text-xs font-mono text-[#F7F4EF]/80">
            <span className="text-white font-bold">{hoveredItem.label}:</span>{' '}
            <span className="text-[#B8703F]">{hoveredItem.views} views</span> •{' '}
            <span className="text-[#6E8B6F] font-bold">{hoveredItem.conversions} orders</span>
          </div>
        ) : (
          <span className="text-xs text-[#F7F4EF]/40 font-mono">Hover bar for daily telemetry</span>
        )}
      </div>

      {/* Bar Columns Container */}
      <div className="flex items-end justify-between gap-1.5 h-44 pt-4 px-2 bg-black/20 rounded-2xl border border-white/[0.04]">
        {data.map((item, idx) => {
          const heightPercent = Math.max(10, (item.views / maxViews) * 100);
          const isHovered = hoveredItem?.date === item.date;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="absolute -top-10 bg-[#16171A] border border-white/20 px-2 py-1 rounded-md text-[10px] font-mono text-white shadow-xl whitespace-nowrap z-20">
                  {item.views} views • {item.conversions} paid
                </div>
              )}

              {/* Bar Fill */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[20px] rounded-t-lg transition-all duration-200 ${
                  isHovered
                    ? 'bg-[#B8703F] shadow-lg shadow-[#B8703F]/20'
                    : 'bg-[#B8703F]/40 hover:bg-[#B8703F]/70'
                }`}
              />

              {/* Day Label */}
              <span className="text-[10px] text-white/40 font-mono mt-2 truncate max-w-[28px]">
                {item.label.split(' ')[1] || item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 3-Stage Visual Conversion Funnel
 */
export const ConversionFunnelVisualizer: React.FC<{
  profileViews: number;
  totalSales: number;
  conversionRate: number;
}> = ({ profileViews, totalSales, conversionRate }) => {
  const engagedEstimate = Math.round(profileViews * 0.32);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Step 1: Impressions */}
      <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F7F4EF]/70 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-[#B8703F]" />
            <span>1. Storefront Visits</span>
          </div>
          <span className="text-xs font-mono text-white/40">100% Top of Funnel</span>
        </div>
        <div>
          <span className="text-3xl font-display font-bold text-white">
            {profileViews.toLocaleString()}
          </span>
          <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
            Storefront and creator profile impressions
          </p>
        </div>
      </div>

      {/* Step 2: Engaged Trainees */}
      <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F7F4EF]/70 uppercase tracking-wider">
            <Users className="w-4 h-4 text-sky-400" />
            <span>2. Offer Engagements</span>
          </div>
          <span className="text-xs font-mono text-sky-400 font-bold">32.0% Interest</span>
        </div>
        <div>
          <span className="text-3xl font-display font-bold text-white">
            {engagedEstimate.toLocaleString()}
          </span>
          <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
            Curriculum previews & video audits viewed
          </p>
        </div>
      </div>

      {/* Step 3: Paid Conversions */}
      <div className="p-5 rounded-2xl bg-[#16171A] border border-[#6E8B6F]/30 bg-[#6E8B6F]/5 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6E8B6F] uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#6E8B6F]" />
            <span>3. Paid Checkouts</span>
          </div>
          <span className="text-xs font-mono text-[#6E8B6F] font-bold bg-[#6E8B6F]/10 px-2 py-0.5 rounded-full border border-[#6E8B6F]/20">
            {conversionRate}% Conversion
          </span>
        </div>
        <div>
          <span className="text-3xl font-display font-bold text-[#6E8B6F]">
            {totalSales.toLocaleString()}
          </span>
          <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
            Confirmed enrollments & recurring subscriptions
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Community Engagement Rate Gauge & Weekly Trend (Analytics beyond T1)
 */
export const EngagementRateGauge: React.FC<{
  data: CreatorCommunityAnalyticsData['engagement'];
}> = ({ data }) => {
  if (!data) return null;

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (data.engagementRate / 100) * circumference;

  return (
    <div className="p-6 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#B8703F]" />
          <h3 className="text-sm font-bold text-[#F7F4EF] uppercase tracking-wider">
            Active Community Engagement
          </h3>
        </div>
        <span className="text-xs font-mono text-[#6E8B6F] bg-[#6E8B6F]/10 px-2.5 py-1 rounded-full border border-[#6E8B6F]/20">
          Last 30 Days
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
        {/* Radial Progress Gauge */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#B8703F"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold text-white">
              {data.engagementRate}%
            </span>
            <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">
              Active
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.06]">
            <span className="text-white/60">Active 30d Trainees</span>
            <span className="font-bold text-[#B8703F] font-mono text-sm">
              {data.activeMembers30d} athletes
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.06]">
            <span className="text-white/60">Total Community Roster</span>
            <span className="font-bold text-white font-mono text-sm">
              {data.totalMembers} members
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-2">
            <span className="text-white/60">Retention Index</span>
            <span className="font-bold text-[#6E8B6F] font-mono text-sm">
              High (Top 10% on Ascend)
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Trend Bars */}
      {data.weeklyTrend && data.weeklyTrend.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
            4-Week Active Member Trend
          </span>
          <div className="grid grid-cols-4 gap-2">
            {data.weeklyTrend.map((w, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-black/25 border border-white/[0.04] text-center">
                <span className="text-[10px] text-white/40 font-mono block">{w.period}</span>
                <span className="text-xs font-bold text-white font-mono block mt-0.5">{w.rate}%</span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div style={{ width: `${w.rate}%` }} className="bg-[#B8703F] h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Community Point Distribution by Activity Type & Levels (Analytics beyond T1)
 */
export const CommunityPointDistributionChart: React.FC<{
  pointData: CreatorCommunityAnalyticsData['pointDistribution'];
  levelData: CreatorCommunityAnalyticsData['levelDistribution'];
}> = ({ pointData, levelData }) => {
  if (!pointData) return null;

  return (
    <div className="p-6 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#B8703F]" />
          <h3 className="text-sm font-bold text-[#F7F4EF] uppercase tracking-wider">
            Points & Gamification Telemetry
          </h3>
        </div>
        <span className="text-xs font-mono text-white/60">
          Total Points Awarded: <strong className="text-[#B8703F] font-display">{pointData.totalPoints.toLocaleString()}</strong>
        </span>
      </div>

      {/* Multi-segment Stacked Distribution Bar */}
      <div className="space-y-2">
        <div className="w-full h-4 rounded-xl overflow-hidden flex bg-white/5 p-0.5 border border-white/10">
          {pointData.breakdown.map((item, idx) => (
            <div
              key={idx}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${item.points} pts (${item.percentage}%)`}
              className="h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
            />
          ))}
        </div>

        {/* Action Legends */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
          {pointData.breakdown.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-black/20 border border-white/[0.04] space-y-1">
              <div className="flex items-center gap-1.5">
                <span style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                <span className="text-[11px] text-white/70 truncate">{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-bold text-white font-mono">{item.points}</span>
                <span className="text-[10px] text-white/40 font-mono">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* S1 Level Distribution Cards */}
      {levelData && levelData.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
              Member Level Distribution (S1)
            </span>
            <span className="text-xs text-white/50 font-mono">Trainee Progression</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {levelData.map((lvl, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div style={{ backgroundColor: `${lvl.badgeColor}25`, borderColor: lvl.badgeColor }} className="w-8 h-8 rounded-lg border flex items-center justify-center">
                    <Shield style={{ color: lvl.badgeColor }} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{lvl.level}</span>
                    <span className="text-[10px] text-white/40 font-mono">{lvl.count} members</span>
                  </div>
                </div>
                <span style={{ color: lvl.badgeColor }} className="text-xs font-bold font-mono">
                  {lvl.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Top Community Contributors Leaderboard (Analytics beyond T1)
 */
export const TopContributorsLeaderboard: React.FC<{
  contributors: CreatorCommunityAnalyticsData['topContributors'];
}> = ({ contributors }) => {
  if (!contributors || contributors.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#F7F4EF] uppercase tracking-wider">
            Top Community Contributors
          </h3>
        </div>
        <span className="text-xs font-mono text-amber-400/80 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Ranked by Points
        </span>
      </div>

      <div className="space-y-2">
        {contributors.map((member) => (
          <div
            key={member.userId}
            className="p-3.5 rounded-xl bg-black/25 border border-white/[0.04] hover:border-white/10 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {/* Rank Medal */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                  member.rank === 1
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : member.rank === 2
                    ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                    : member.rank === 3
                    ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                    : 'bg-white/5 text-white/50'
                }`}
              >
                {member.rank}
              </div>

              {/* Avatar & Name */}
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {member.name.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{member.name}</span>
                  <span
                    style={{
                      borderColor: member.level.badgeColor,
                      color: member.level.badgeColor,
                    }}
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border bg-black/40"
                  >
                    {member.level.tierName}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 font-mono">
                  {member.tierName} • Joined {new Date(member.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Total Points Badge */}
            <div className="text-right">
              <span className="text-sm font-bold font-display text-[#B8703F]">
                {member.totalPoints.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-2 text-[9px] font-mono text-white/40 justify-end mt-0.5">
                <span>{member.breakdown?.['lesson-complete'] || 0} lessons</span>
                <span>•</span>
                <span>{member.breakdown?.post || 0} posts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
