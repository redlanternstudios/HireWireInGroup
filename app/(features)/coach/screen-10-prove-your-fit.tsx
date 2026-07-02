'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function Screen10ProveYourFit() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-[Canela] text-5xl text-[#2C2926] mb-4">
            Prove Your Fit
          </h1>
          <p className="text-lg text-[#8E9878]">
            Tell us about the job you&apos;re targeting. We&apos;ll show you exactly how your verified evidence maps to what they&apos;re asking for.
          </p>
        </div>

        {/* Job URL Input Card */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <form onSubmit={handleSubmitJob}>
            <label className="block text-sm font-semibold text-[#2C2926] mb-3">
              Job Posting URL
            </label>
            <div className="flex gap-4 mb-4">
              <Input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://linkedin.com/jobs/..."
                className="flex-1 border-[#D6AAA3]"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                disabled={loading || !jobUrl}
                className="bg-[#8E9878] hover:bg-[#6B7A5E] text-white px-8"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            
            {error && (
              <div className="bg-[#EF4444] bg-opacity-10 border border-[#EF4444] rounded p-4 text-[#EF4444] mb-4">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </form>
        </Card>

        {/* Evidence Readiness Checklist */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-6">
            Your Evidence Readiness
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#8E9878]">{evidenceCount}</p>
              <p className="text-sm text-[#2C2926] mt-2">Evidence Items</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#22C55E]">—</p>
              <p className="text-sm text-[#2C2926] mt-2">Locked Items</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#D7BA82]">{analysis?.readinessScore || 0}%</p>
              <p className="text-sm text-[#2C2926] mt-2">Job Fit Score</p>
            </div>
          </div>

          <p className="text-sm text-[#8E9878] mb-4">
            Before we start the interview, make sure you have uploaded evidence for key skills. You can add more anytime.
          </p>
        </Card>

        {/* Gap Analysis (if job analyzed) */}
        {analysis && (
          <Card className="bg-white border border-[#D6AAA3] p-8">
            <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-6">
              Skill Gap Analysis
            </h2>
            
            <div className="space-y-6">
              {analysis.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 p-6 rounded bg-opacity-5 ${
                    gap.status === 'verified'
                      ? 'border-l-[#22C55E] bg-[#22C55E]'
                      : gap.status === 'partial'
                      ? 'border-l-[#EAB308] bg-[#EAB308]'
                      : 'border-l-[#EF4444] bg-[#EF4444]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#2C2926]">{gap.skill}</h3>
                      <p className="text-sm text-[#8E9878] mt-1">
                        They&apos;re looking for: {gap.jobRequired}
                      </p>
                    </div>
                    <Badge
                      className={
                        gap.status === 'verified'
                          ? 'bg-[#22C55E] text-white'
                          : gap.status === 'partial'
                          ? 'bg-[#EAB308] text-[#2C2926]'
                          : 'bg-[#EF4444] text-white'
                      }
                    >
                      {gap.status === 'verified'
                        ? '✓ Verified'
                        : gap.status === 'partial'
                        ? '◐ Partial'
                        : '✗ Missing'}
                    </Badge>
                  </div>

                  {gap.evidenceItemId && (
                    <p className="text-sm text-[#2C2926] p-3 bg-white rounded border border-[#D6AAA3]">
                      <strong>Your evidence:</strong> {gap.userProof}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {analysis.gaps.length > 0 && (
              <div className="mt-8 pt-8 border-t border-[#D6AAA3]">
                <Button className="w-full bg-[#8E9878] hover:bg-[#6B7A5E] text-white py-6 text-lg">
                  Start Interview → Prove Your Fit
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
    <Card className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prove Your Fit</h1>
      <p className="text-gray-600">This feature is currently being integrated. Please check back soon.</p>
    </Card>
  );
}
