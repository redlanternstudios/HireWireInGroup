'use client';

import { BarChart3, FileText, Zap, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const screens = [
  {
    title: 'Match Dashboard',
    description: 'Real-time opportunity intelligence with fit scores across your active pipeline.',
    icon: BarChart3,
    href: '/premium/match-dashboard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/50 border-blue-200/50',
  },
  {
    title: 'Resume View',
    description: 'Tailored, AI-optimized resume with ATS compliance and evidence backing.',
    icon: FileText,
    href: '/premium/resume-view',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50/50 border-emerald-200/50',
  },
  {
    title: 'Job Ranking',
    description: 'Multi-dimensional opportunity ranking with detailed fit analysis and next steps.',
    icon: Target,
    href: '/premium/job-ranking',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50/50 border-amber-200/50',
  },
  {
    title: 'Confidence Scoring',
    description: 'Interview readiness assessment with integrity verification and risk mitigation.',
    icon: Zap,
    href: '/premium/confidence-scoring',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50/50 border-rose-200/50',
  },
];

export default function PremiumHub() {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-8">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            PREMIUM CAREER INTELLIGENCE
          </p>
          <h1 className="text-4xl font-bold text-foreground mb-3">Career Command Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Executive-grade career intelligence platform. Multi-dimensional analysis, evidence-backed claims, and data-driven decision making for your next career move.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 pt-4">
          {[
            { label: 'Active Opportunities', value: '12' },
            { label: 'Average Match Score', value: '84%' },
            { label: 'Applications Ready', value: '4' },
            { label: 'Interview Passes', value: '2' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-card/50 border border-border/50 p-3 backdrop-blur-sm"
            >
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {screens.map((screen) => {
          const Icon = screen.icon;
          return (
            <Link key={screen.href} href={screen.href}>
              <div
                className={`group rounded-lg border border-border/50 ${screen.bgColor} backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer p-6 h-full flex flex-col`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-white/50 border border-border/30 ${screen.color}`}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 mb-4">
                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {screen.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {screen.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Feature Grid */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-4">
          CORE FEATURES
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              title: 'AI-Powered Analysis',
              description: 'Machine learning models evaluate fit across 50+ career dimensions',
            },
            {
              title: 'Evidence Verification',
              description: 'All claims backed by documented proof points and artifacts',
            },
            {
              title: 'Real-Time Scoring',
              description: 'Dynamic scoring updates as you add evidence and experience',
            },
            {
              title: 'Risk Assessment',
              description: 'Identify and mitigate potential challenges before they arise',
            },
            {
              title: 'Interview Readiness',
              description: 'Comprehensive preparation checklists and confidence metrics',
            },
            {
              title: 'Opportunity Ranking',
              description: 'Scientifically ranked opportunities aligned with your goals',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4"
            >
              <p className="font-semibold text-foreground text-sm mb-1">{feature.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary font-semibold mb-2">
            EXECUTIVE INTELLIGENCE
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready for Your Next Move?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start with Match Dashboard to see your full opportunity landscape. Then dive deep into individual roles to prepare comprehensively for each interview.
          </p>
        </div>
        <Link href="/premium/match-dashboard">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            Launch Match Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
