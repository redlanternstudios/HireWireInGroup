'use client';

import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Target,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const confidenceMetrics = [
  {
    category: 'Evidence Strength',
    score: 94,
    status: 'excellent',
    description: 'Multiple documented proof points across all core requirements',
    details: [
      '✓ 12 years in direct role responsibilities',
      '✓ 3 companies with relevant scale ($100M+)',
      '✓ 5+ specific skill validations',
      '✓ Quantified business impact ($100M+ value creation)',
    ],
  },
  {
    category: 'Skill Alignment',
    score: 89,
    status: 'strong',
    description: 'Strong match across primary and secondary competencies',
    details: [
      '✓ 8/8 core technical skills',
      '✓ 6/7 leadership competencies',
      '⚠ 1 emerging skill gap (venture-specific)',
      '✓ Transferable expertise from adjacent domains',
    ],
  },
  {
    category: 'Experience Relevance',
    score: 92,
    status: 'excellent',
    description: 'Exceptional match to role requirements and seniority level',
    details: [
      '✓ Equivalent roles at similar-sized organizations',
      '✓ B2B enterprise background',
      '✓ Proven cross-functional leadership',
      '✓ P&L responsibility ($500M+ cumulative)',
    ],
  },
  {
    category: 'Claim Verification',
    score: 87,
    status: 'strong',
    description: 'All claims backed by documented evidence and artifacts',
    details: [
      '✓ Case studies from all 3 companies',
      '✓ Quantified metrics across 15 projects',
      '✓ References from 4 past managers',
      '⚠ 1 claim requires additional documentation',
    ],
  },
];

const riskAssessment = [
  {
    risk: 'Industry Gap',
    level: 'low',
    mitigation:
      'Background spans adjacent sectors; proven ability to ramp new verticals quickly.',
  },
  {
    risk: 'Company Size Jump',
    level: 'medium',
    mitigation:
      'Current role demonstrates scale; mentorship available for startup adjustment.',
  },
  {
    risk: 'Technical Depth',
    level: 'low',
    mitigation: 'Core competencies align; 2-week intensive onboarding recommended.',
  },
];

const preparationChecklist = [
  { item: 'Resume tailored & verified', done: true },
  { item: 'Cover letter customized', done: true },
  { item: 'Case studies prepared', done: true },
  { item: 'References briefed', done: false },
  { item: 'Interview prep complete', done: false },
  { item: 'Compensation research', done: true },
];

export default function ConfidenceScoring() {
  const overallConfidence = Math.round(
    confidenceMetrics.reduce((sum, m) => sum + m.score, 0) / confidenceMetrics.length,
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            INTERVIEW READINESS
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Confidence & Scoring</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Comprehensive integrity verification across evidence, claims, and preparation readiness. Go-to-market confidence assessment.
          </p>
        </div>
      </div>

      {/* Overall Confidence Score */}
      <div className="rounded-lg border border-border/50 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 backdrop-blur-sm p-6 flex items-center gap-6">
        <div className="relative w-32 h-32 rounded-2xl bg-emerald-100/40 border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
          <div className="text-center">
            <p className="text-5xl font-bold text-emerald-700">{overallConfidence}</p>
            <p className="text-xs font-mono uppercase tracking-wide text-emerald-600 mt-1">
              Confidence
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-700 mb-2 font-semibold">
            ✓ Ready to Advance
          </p>
          <h2 className="text-xl font-semibold text-foreground mb-2">Interview-Ready Profile</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Your profile demonstrates exceptional fit across all dimensions. Evidence is well-documented, claims are verifiable, and preparation is comprehensive. Recommend proceeding to next interview stage.
          </p>
          <Link href="/premium/match-dashboard">
            <Button size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800">
              View Full Assessment Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Confidence Metrics */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          SCORING BREAKDOWN
        </p>
        {confidenceMetrics.map((metric) => (
          <div
            key={metric.category}
            className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold text-foreground">{metric.category}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{metric.description}</p>
              </div>
              <div
                className={cn(
                  'text-right rounded-lg px-3 py-2 border shrink-0',
                  metric.status === 'excellent' &&
                    'bg-emerald-50/50 border-emerald-200/50',
                  metric.status === 'strong' &&
                    'bg-blue-50/50 border-blue-200/50',
                )}
              >
                <p
                  className={cn(
                    'text-2xl font-bold',
                    metric.status === 'excellent' && 'text-emerald-700',
                    metric.status === 'strong' && 'text-blue-700',
                  )}
                >
                  {metric.score}
                </p>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                  {metric.status}
                </p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {metric.details.map((detail, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  {detail.startsWith('✓') && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {detail.startsWith('⚠') && (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{detail.replace(/^[✓⚠]\s/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Risk Assessment */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          RISK ASSESSMENT & MITIGATION
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {riskAssessment.map((item) => (
            <div
              key={item.risk}
              className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4"
            >
              <div className="flex items-start gap-2 mb-2">
                {item.level === 'low' && (
                  <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {item.level === 'medium' && (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <p className="font-semibold text-foreground text-sm">{item.risk}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-mono uppercase">{item.level} Risk</span>
              </p>
              <p className="text-sm text-foreground leading-relaxed">{item.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preparation Checklist */}
      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-4">
          PREPARATION CHECKLIST
        </p>
        <div className="space-y-2">
          {preparationChecklist.map((check) => (
            <div
              key={check.item}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  check.done
                    ? 'bg-emerald-100 border-emerald-600'
                    : 'border-border/50 bg-muted/30',
                )}
              >
                {check.done && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
              </div>
              <p
                className={cn(
                  'text-sm font-medium',
                  check.done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {check.item}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-5 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground mb-1">Ready to apply?</p>
            <p className="text-sm text-muted-foreground mb-3">
              Your profile is interview-ready. Complete final checklist items and proceed with application.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground">
                Apply Now
              </Button>
              <Link href="/premium/resume-view">
                <Button size="sm" variant="outline">
                  Review Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
