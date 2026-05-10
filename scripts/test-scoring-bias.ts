/**
 * Bias & Explainability Test Suite for HireWire Scoring Engine
 *
 * Runs a variety of user profiles through the scoring engine for multiple roles.
 * Checks for disparate impact, missing explanations, and dead-ends.
 * Fails the build if critical issues are found.
 */

import { getWeightsForRole, ROLE_WEIGHT_PROFILES } from '../lib/scoring-weights'
import { calculateExplainableFit } from '../lib/canonical-evidence'
import { detectGaps } from '../lib/gap-detection'
import fs from 'fs'

// --- Test Profiles ---
const TEST_PROFILES = [
  {
    name: 'Traditional SWE',
    profile: {
      skills: ['JavaScript', 'React', 'Node.js'],
      education: [{ degree: 'BS', field: 'Computer Science' }],
      experience: [
        { title: 'Software Engineer', company: 'TechCorp', bullets: ['Built React apps', 'Led Node.js migration'], start_date: '2020-01', end_date: '2023-01' }
      ]
    },
    evidence: [
      { text: 'Built scalable React applications', confidence: 'high', approved_for_resume: true, source: 'resume', evidence_type: 'work_experience', tools_used: ['React'], outcomes: ['Increased performance by 30%'] }
    ]
  },
  {
    name: 'Career Switcher',
    profile: {
      skills: ['Python', 'Data Analysis'],
      education: [{ degree: 'BA', field: 'History' }],
      experience: [
        { title: 'Teacher', company: 'School', bullets: ['Taught history'], start_date: '2015-01', end_date: '2022-01' }
      ]
    },
    evidence: [
      { text: 'Completed data analysis bootcamp', confidence: 'medium', approved_for_resume: true, source: 'LinkedIn', evidence_type: 'education', tools_used: ['Python'], outcomes: ['Analyzed datasets'] }
    ]
  },
  {
    name: 'Non-degree Holder',
    profile: {
      skills: ['AWS', 'DevOps'],
      education: [],
      experience: [
        { title: 'DevOps Engineer', company: 'InfraCo', bullets: ['Managed AWS infra'], start_date: '2018-01', end_date: '2023-01' }
      ]
    },
    evidence: [
      { text: 'Managed AWS infrastructure', confidence: 'high', approved_for_resume: true, source: 'resume', evidence_type: 'work_experience', tools_used: ['AWS'], outcomes: ['Reduced downtime by 50%'] }
    ]
  },
  {
    name: 'Entry Level',
    profile: {
      skills: ['Excel', 'Communication'],
      education: [{ degree: 'HS', field: 'General' }],
      experience: []
    },
    evidence: [
      { text: 'Excel coursework', confidence: 'medium', approved_for_resume: true, source: 'LinkedIn', evidence_type: 'education', tools_used: ['Excel'], outcomes: [] }
    ]
  }
]

// --- Test Roles ---
const TEST_ROLES = [
  'Software Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Account Executive',
  'Entry-Level',
  'Other'
]

// --- Test Requirements ---
const TEST_REQUIREMENTS = {
  'Software Engineer': ['Experience with React', '3+ years software development', 'BS in Computer Science'],
  'Data Scientist': ['Python', 'Statistical modeling', 'Machine Learning'],
  'DevOps Engineer': ['AWS', 'CI/CD pipelines', 'Infrastructure as Code'],
  'Account Executive': ['Sales experience', 'Quota attainment', 'CRM tools'],
  'Entry-Level': ['Excel', 'Communication skills', 'High school diploma'],
  'Other': ['General skills', 'Teamwork']
}

// --- Results ---
const results: any[] = []
let criticalFailures = 0

for (const profile of TEST_PROFILES) {
  for (const role of TEST_ROLES) {
    const weights = getWeightsForRole(role)
    const requirements = TEST_REQUIREMENTS[role]
    const dimensionScores = {
      experience: 70,
      evidence: 70,
      skills: 70,
      seniority: 70,
      ats: 70
    }
    // Run explainable fit
    const fit = calculateExplainableFit(profile.evidence, requirements, [], dimensionScores)
    // Run gap detection
    const gapResult = detectGaps(
      { qualifications_required: requirements },
      profile.evidence,
      profile.profile
    )
    // Check for missing explanations or dead-ends
    let fail = false
    let failReasons: string[] = []
    if (!fit.score_explanation || fit.score_explanation.length < 10) {
      fail = true
      failReasons.push('Missing or weak score explanation')
    }
    if (gapResult.gaps.some(g => !g.suggested_action && !g.suggestion)) {
      fail = true
      failReasons.push('Gap with no suggestion or action')
    }
    if (fit.score < 0 || fit.score > 100) {
      fail = true
      failReasons.push('Score out of bounds')
    }
    // Bias check: non-degree holder should not always score low if skills/evidence are present
    if (role !== 'Entry-Level' && profile.name === 'Non-degree Holder' && fit.score < 50) {
      fail = true
      failReasons.push('Non-degree holder unfairly penalized')
    }
    results.push({ profile: profile.name, role, fitScore: fit.score, band: fit.band, explanation: fit.score_explanation, gaps: gapResult.gaps.length, fail, failReasons })
    if (fail) criticalFailures++
  }
}

// --- Output ---
const output = results.map(r =>
  `${r.profile} | ${r.role} | Score: ${r.fitScore} | Band: ${r.band} | Gaps: ${r.gaps} | ${r.fail ? 'FAIL: ' + r.failReasons.join('; ') : 'PASS'}`
).join('\n')

console.log('--- HireWire Scoring Bias/Explainability Test Results ---')
console.log(output)
fs.writeFileSync('scoring-bias-test-results.txt', output)

if (criticalFailures > 0) {
  console.error(`\n${criticalFailures} critical failures detected. See scoring-bias-test-results.txt for details.`)
  process.exit(1)
} else {
  console.log('\nAll tests passed.')
  process.exit(0)
}
