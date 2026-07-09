# HireWire Job Post Resume Receipt 20260708

## Objective

Run a real HireWire account through a job post to resume generation flow and keep the receipts.

## Prompt Contract

GOAL: prove the live job post URL can be analyzed into a persisted job and generated resume.

CONSTRAINTS: use the existing test account, keep the job post URL explicit, do not invent evidence, keep quality truthfully labeled.

FORMAT: job post URL, local job page, generated resume path, truth labels, and quality findings.

FAILURE: if the job URL, generated resume, or persisted job row cannot be tied together, the receipt is incomplete.

## Reality Check

VERIFIED: the harness reused the existing test account `hirewire.cdx.20260707183739@yopmail.com`.

VERIFIED: the live job post URL was fetched from the local fixture server.

VERIFIED: the job was analyzed and generated documents were persisted.

VERIFIED: the generated resume exists as a text receipt.

PARTIAL: the quality gate still returns `needs_review`, so this is not a clean ship receipt.

## Receipts

Job post URL:
`http://127.0.0.1:4321/hirewire-e2e-job-post-20260707183739.html`

Local job page:
`http://localhost:3000/jobs/aa2c6a5d-4a4a-4955-a852-cb4af85ad78f`

Generated resume:
`/private/tmp/hirewire-e2e-generated-resume-20260707183739.txt`

Full JSON receipt:
`/private/tmp/hirewire-e2e-receipt-20260707183739.json`

Harness:
`tests/hirewire-e2e-resume-receipt.ts`

## Result

VERIFIED: account reused
VERIFIED: job post loaded
VERIFIED: job analyzed
VERIFIED: resume generated
VERIFIED: resume persisted

Job title: Senior Product Manager, AI Platform

Company: Northstar Systems

Generation status: needs_review

Quality passed: false

Generated resume chars: 2265

Generated cover letter chars: 1789

## Quality Notes

The generated materials are real and persisted, but the quality checker still flags generic language and a few weak bullets. That means the e2e proof is good, but the product still needs another pass before this is application ready.
