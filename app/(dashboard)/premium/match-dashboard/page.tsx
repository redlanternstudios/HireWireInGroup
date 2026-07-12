'use client';

import { TrendingUp, TrendingDown, Zap, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const matchData = [
  {
    id: 1,
    company: 'Axiom Capital',
    role: 'Senior Strategy Director',
    match: 92,
    trend: 'up',
    signals: ['Experience alignment', 'Skill fit', 'Compensation match'],
    gaps: ['Industry experience (1 gap)'],
    recentUpdate: '2 hours ago',
    priority: 'high',
  },
  {
    id: 2,
    company: 'Constellation Partners',
    role: 'VP Strategic Operations',
    match: 87,
    trend: 'up',
    signals: ['Leadership experience', 'Technical depth', 'Network value'],
    gaps: ['Specific vertical (2 gaps)'],
    recentUpdate: '5 hours ago',
    priority: 'high',
  },
  {
    id: 3,
    company: 'Meridian Ventures',
    role: 'Director of Growth',
    match: 78,
    trend: 'stable',
    signals: ['Growth background', 'Cross-functional skills'],
    gaps: ['Venture experience (3 gaps)', 'Analytics depth'],
    recentUpdate: '1 day ago',
    priority: 'medium',
  },
  {
    id: 4,
    company: 'Vertex Analytics',
    role: 'Head of Strategy',
    match: 71,
    trend: 'down',
    signals: ['Strategic planning'],
    gaps: ['Data science (4 gaps)', 'Product background', 'Startup exposure'],
    recentUpdate: '3 days ago',
    priority: 'low',
  },
];

const summaryStats = [
  { label: 'Exceptional Matches', value: 2, subtext: '90%+ confidence' },
  { label: 'Strong Candidates', value: 5, subtext: '75%+ confidence' },
  { label: 'Under Review', value: 3, subtext: 'Needs attention' },
];

export default function MatchDashboard() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              CAREER INTELLIGENCE
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">Match Dashboard</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Real-time opportunity intelligence across your active pipeline. Each match represents a calculated fit score based on your unique profile and market signals.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm">
              Filters
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/50 p-4 bg-card/50 backdrop-blur-sm"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Match Cards Grid */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          ACTIVE OPPORTUNITIES
        </p>
        {matchData.map((match) => (
          <Link key={match.id} href={`/premium/job-ranking?id=${match.id}`}>
            <div className="group rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer p-5">
              {/* Top row: Company, score, trend */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {match.company}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {match.role}
                  </h3>
                </div>

                {/* Match Score */}
                <div className="text-right shrink-0">
                  <div
                    className={cn(
                      'rounded-lg border border-border/50 px-3 py-2 backdrop-blur-sm',
                      match.match >= 85 && 'bg-emerald-50/50 border-emerald-200/50',
                      match.match >= 75 && match.match < 85 && 'bg-amber-50/50 border-amber-200/50',
                      match.match < 75 && 'bg-rose-50/50 border-rose-200/50',
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-bold',
                        match.match >= 85 && 'text-emerald-700',
                        match.match >= 75 && match.match < 85 && 'text-amber-700',
                        match.match < 75 && 'text-rose-700',
                      )}
                    >
                      {match.match}%
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </div>

              {/* Match signals */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border/30">
                <div>
                  <p className="text-xs font-mono text-emerald-700 uppercase tracking-wide mb-1.5">
                    ✓ Aligned
                  </p>
                  <div className="space-y-1">
                    {match.signals.map((signal, i) => (
                      <p key={i} className="text-sm text-foreground">
                        {signal}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-rose-700 uppercase tracking-wide mb-1.5">
                    ✗ Gaps
                  </p>
                  <div className="space-y-1">
                    {match.gaps.map((gap, i) => (
                      <p key={i} className="text-sm text-foreground">
                        {gap}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer: timestamp */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Updated {match.recentUpdate}</p>
                <div className="flex items-center gap-1">
                  {match.trend === 'up' && (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                  {match.trend === 'down' && (
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                  )}
                  {match.trend === 'stable' && (
                    <div className="h-0.5 w-4 bg-amber-600" />
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
