'use client';

import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const rankingData = [
  {
    rank: 1,
    title: 'Senior Strategy Director',
    company: 'Axiom Capital',
    overallScore: 92,
    dimensions: {
      'Experience Fit': 96,
      'Skills Alignment': 94,
      'Compensation': 88,
      'Growth Potential': 90,
      'Team Culture': 89,
    },
    keyInsights: [
      'Your background maps directly to 23/25 core requirements',
      'Only 2 minor skill gaps identified (easily addressable)',
      'Compensation aligns with market expectations',
    ],
    nextSteps: [
      'Complete proof of fit documentation',
      'Generate customized cover letter',
      'Schedule follow-up coaching session',
    ],
  },
  {
    rank: 2,
    title: 'VP Strategic Operations',
    company: 'Constellation Partners',
    overallScore: 87,
    dimensions: {
      'Experience Fit': 89,
      'Skills Alignment': 87,
      'Compensation': 84,
      'Growth Potential': 88,
      'Team Culture': 85,
    },
    keyInsights: [
      'Strong leadership background matches role requirements',
      '3 moderate skill gaps in venture-specific metrics',
      'Team culture alignment slightly below benchmark',
    ],
    nextSteps: [
      'Address venture background gap with coach',
      'Develop venture experience narrative',
      'Prepare for technical interview rounds',
    ],
  },
  {
    rank: 3,
    title: 'Director of Growth',
    company: 'Meridian Ventures',
    overallScore: 78,
    dimensions: {
      'Experience Fit': 82,
      'Skills Alignment': 76,
      'Compensation': 75,
      'Growth Potential': 81,
      'Team Culture': 77,
    },
    keyInsights: [
      'Growth background is strong match',
      '4 notable gaps in specific domain expertise',
      'Compensation range slightly above current level',
    ],
    nextSteps: [
      'Enhance analytics and data skills narrative',
      'Prepare growth metrics and case studies',
      'Schedule mock interview with coach',
    ],
  },
];

export default function JobRanking() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            OPPORTUNITY RANKING
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Detail & Ranking</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Multi-dimensional fit analysis across 5 key career criteria. Scored against your unique profile, market position, and career trajectory.
          </p>
        </div>
      </div>

      {/* Ranking List */}
      <div className="space-y-4">
        {rankingData.map((job) => (
          <Link key={job.rank} href={`/premium/confidence-scoring?job=${job.rank}`}>
            <div className="group rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer overflow-hidden">
              {/* Header */}
              <div className="p-5 pb-4 border-b border-border/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                      <p className="text-xl font-bold text-primary">#{job.rank}</p>
                    </div>
                    {/* Title & Company */}
                    <div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {job.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  {/* Overall Score */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">
                      Overall Match
                    </p>
                    <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center border border-emerald-200/50">
                      <p className="text-3xl font-bold text-emerald-700">{job.overallScore}</p>
                      <span className="absolute bottom-1 right-2 text-xs text-emerald-600">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimension Scores */}
              <div className="px-5 py-4 border-b border-border/30">
                <div className="space-y-2">
                  {Object.entries(job.dimensions).map(([dimension, score]) => (
                    <div key={dimension} className="flex items-center gap-3">
                      <div className="w-32">
                        <p className="text-xs font-medium text-foreground">{dimension}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              score >= 90 && 'bg-emerald-500',
                              score >= 80 && score < 90 && 'bg-amber-500',
                              score < 80 && 'bg-rose-500',
                            )}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground w-8 text-right">{score}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights & Actions */}
              <div className="px-5 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Key Insights */}
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2.5 font-semibold">
                      Key Insights
                    </p>
                    <ul className="space-y-1.5">
                      {job.keyInsights.map((insight, i) => (
                        <li key={i} className="text-sm text-foreground flex gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2.5 font-semibold">
                      Recommended Next Steps
                    </p>
                    <ul className="space-y-1.5">
                      {job.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-foreground flex gap-2">
                          <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Comparison CTA */}
      <div className="mt-8 p-5 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground mb-1">Compare all opportunities side-by-side</p>
            <p className="text-sm text-muted-foreground mb-3">
              Get a detailed breakdown of how each role aligns with your career goals and profile.
            </p>
            <Button size="sm" className="bg-primary text-primary-foreground">
              View Comparison Matrix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
