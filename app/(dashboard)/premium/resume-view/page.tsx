'use client';

import { Download, ExternalLink, Zap, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const resumeSections = [
  {
    title: 'PROFESSIONAL SUMMARY',
    content:
      'Strategic Operations Executive with 12+ years driving cross-functional excellence at Fortune 500 and high-growth ventures. Proven expertise in operational scaling, process optimization, and board-level stakeholder management. Specialized in supply chain transformation and financial operations with track record of delivering $50M+ in value creation.',
  },
  {
    title: 'CORE COMPETENCIES',
    items: [
      'Strategic Planning & Execution',
      'P&L Management',
      'Cross-functional Leadership',
      'Supply Chain Optimization',
      'Process Automation & Lean Six Sigma',
      'Financial Forecasting & Analysis',
      'Vendor Management',
      'Stakeholder Communication',
    ],
  },
  {
    title: 'PROFESSIONAL EXPERIENCE',
    entries: [
      {
        role: 'VP, Operations & Strategy',
        company: 'TechVenture Inc.',
        period: '2021 - Present',
        bullets: [
          'Led transformation of 3 operational divisions serving 5,000+ enterprise customers',
          'Implemented AI-driven forecasting system reducing inventory costs by 34% ($12M annual savings)',
          'Managed $85M+ budget; reduced operational spend by 18% through vendor consolidation',
          'Scaled global operations from 2 to 8 offices while maintaining 99.2% service uptime',
        ],
      },
      {
        role: 'Senior Director, Operations',
        company: 'Axiom Capital Partners',
        period: '2017 - 2021',
        bullets: [
          'Oversaw $500M fund operations across 12 portfolio companies',
          'Implemented standardized operational framework reducing fund management costs by 27%',
          'Built and led 18-person operations team; promoted 3 to senior management',
          'Designed and executed successful due diligence process for acquisition targets',
        ],
      },
      {
        role: 'Manager, Business Operations',
        company: 'Global Manufacturing Corp',
        period: '2013 - 2017',
        bullets: [
          'Managed supply chain for 2,000+ SKUs across 15 global locations',
          'Led Lean Six Sigma initiative eliminating $8M in waste annually',
          'Implemented ERP system resulting in 40% faster order fulfillment',
        ],
      },
    ],
  },
  {
    title: 'EDUCATION',
    entries: [
      {
        role: 'MBA, Operations & Finance',
        company: 'Stanford Graduate School of Business',
        period: '2010 - 2012',
      },
      {
        role: 'BS, Industrial Engineering',
        company: 'University of Michigan',
        period: '2006 - 2010',
      },
    ],
  },
];

const bulletPoints = [
  { label: 'ATS-Optimized', value: 'Yes' },
  { label: 'Keyword Density', value: '94%' },
  { label: 'Format Compliance', value: 'Verified' },
  { label: 'Generated', value: '3 hours ago' },
];

export default function ResumeView() {
  return (
    <div className="space-y-8 pb-8">
      {/* Header & Controls */}
      <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            TAILORED RESUME
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Resume View</h1>
          <p className="text-sm text-muted-foreground">
            AI-optimized for specific role match. Evidence-backed, ATS-compliant format.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Preview PDF
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground gap-1.5">
            <Download className="h-4 w-4" />
            Download DOCX
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {bulletPoints.map((point) => (
          <div
            key={point.label}
            className="rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur-sm"
          >
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
              {point.label}
            </p>
            <p className="text-lg font-bold text-foreground">{point.value}</p>
          </div>
        ))}
      </div>

      {/* Resume Content */}
      <div className="space-y-8 max-w-4xl">
        {resumeSections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-3 pb-2 border-b border-border/50">
              {section.title}
            </h2>

            {section.content && (
              <p className="text-sm leading-relaxed text-foreground mb-4">{section.content}</p>
            )}

            {section.items && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {section.items.map((item, i) => (
                  <p key={i} className="text-sm text-foreground">
                    • {item}
                  </p>
                ))}
              </div>
            )}

            {section.entries && (
              <div className="space-y-5">
                {section.entries.map((entry, i) => (
                  <div key={i}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{entry.role}</p>
                        <p className="text-sm text-muted-foreground">{entry.company}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {entry.period}
                      </p>
                    </div>
                    {'bullets' in entry && entry.bullets && (
                      <ul className="space-y-1.5 ml-4 mt-2">
                        {entry.bullets.map((bullet: string, j: number) => (
                          <li
                            key={j}
                            className="text-sm text-foreground leading-relaxed flex gap-2"
                          >
                            <span className="text-primary shrink-0 mt-1.5">▸</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 pt-6 border-t border-border/50">
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-1">Ready to optimize further?</p>
              <p className="text-sm text-muted-foreground">
                Use AI coach to enhance bullets, verify claims, and maximize impact.
              </p>
            </div>
            <Link href="/premium/confidence-scoring">
              <Button size="sm" className="bg-primary text-primary-foreground shrink-0">
                Analyze Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
