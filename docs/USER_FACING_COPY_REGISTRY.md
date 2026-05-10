<<<<<<< HEAD
# HireWire — User Facing Copy Registry

This document defines approved user-facing messages for each communication reason. Use these in components and comms registry where practical.
=======
# HireWire User-Facing Copy Registry

Approved message copy for each communication reason.
Source of truth for all UI strings, toasts, banners, modals, and emails.
Do not scatter random copy in components — register it here first.

All entries are also registered in `lib/comms/registry.ts` as typed `CommsMessage` objects.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

---

## ACCOUNT_ACCESS
<<<<<<< HEAD
- **Session expired**
  - Your session expired. Sign in again to continue securely.
  - Action: Sign in

## ONBOARDING_GUIDANCE
- **Career Context empty**
  - HireWire needs real career evidence to generate truthful materials.
  - Action: Add Career Context

## JOB_PIPELINE_STATUS
- **Job analyzed**
  - Your job analysis is ready.
  - Action: View match
- **Job blocked by scrape**
  - This job board blocked automated reading. Paste the job description manually to continue.
  - Action: Paste description

## APPLICATION_PACKAGE_STATUS
- **Package draft ready**
  - Your application package draft is ready for a quick confidence check.
  - Action: Review package
- **Quick questions needed**
  - Two quick answers could improve this package before you submit.
  - Action: Answer questions

## READINESS_AND_BLOCKERS
- **Quality review required**
  - This package needs Red Team review before it can move to Ready to Apply.
  - Action: Run review
- **Unsupported claims found**
  - Some claims need stronger evidence before this package can be approved.
  - Action: Review claims

## APPLICATION_ACTIONS
- **Ready to apply**
  - This application package passed quality review and is ready for your final approval.
  - Action: Apply

## DOCUMENT_AND_EXPORT
- **Export ready**
  - Your resume export is ready.
  - Action: Download

## ERROR_AND_RECOVERY
- **Unknown error**
  - Something unexpected happened. Try again or contact support with this error ID.
  - Action: Try again

## SUPPORT_AND_FEEDBACK
- **Feedback submitted**
  - Thanks. Your feedback was received.
  - Action: Close

## BILLING_AND_PLAN
- **Generation limit reached**
  - You reached your current plan’s generation limit.
  - Action: View plans

## REMINDERS_AND_DIGESTS
- **Follow up due**
  - This application may be ready for a follow up.
  - Action: Draft follow up

## EXTERNAL_DRAFTS_FOR_USER_APPROVAL
- **Recruiter follow up ready**
  - A follow up draft is ready for your review.
  - Action: Review draft
=======

| Event | Title | Body | Action |
|---|---|---|---|
| Session expired | Session expired | Your session expired. Sign in again to continue securely. | Sign in |
| Magic link sent | Check your email | Sign-in link sent to your email. It expires in 1 hour. | — |
| Signup confirmation | Check your email | Click the link we sent to verify your account and get started. | — |
| Password reset sent | Check your email | If that email exists in HireWire, a reset link is on its way. | — |
| Account secured | Account updated | Your account has been updated securely. | — |

---

## ONBOARDING_GUIDANCE

| Event | Title | Body | Action |
|---|---|---|---|
| Career Context empty | Career Context is empty | HireWire needs real career evidence to generate truthful materials. Add your experience to get started. | Add Career Context |
| Profile incomplete | Complete your profile | A complete profile improves the accuracy of every analysis and document HireWire generates. | Update profile |
| First job added | Job added | Your first job is in the pipeline. HireWire will analyze it shortly. | — |
| Resume upload needed | Upload your resume | Import your existing resume to seed your Career Context faster. | Upload resume |

---

## JOB_PIPELINE_STATUS

| Event | Title | Body | Action |
|---|---|---|---|
| Job analyzed | Analysis ready | Your job analysis is ready. | View match |
| Job scrape blocked | Job board blocked | This job board blocked automated reading. Paste the job description manually to continue. | Paste description |
| Duplicate job found | Duplicate job found | This looks like a job you already added. Do you want to continue anyway? | Add anyway |
| Fit score ready | Fit score ready | Your fit score for this role is ready. | View score |
| Evidence mapping needed | Evidence needed | HireWire needs stronger evidence to support this application. | Add evidence |
| Job archived | Job archived | This job has been archived. You can restore it at any time. | Undo |

---

## APPLICATION_PACKAGE_STATUS

| Event | Title | Body | Action |
|---|---|---|---|
| Package draft ready | Package draft ready | Your application package draft is ready for a quick confidence check. | Review package |
| Resume generated | Resume generated | Your resume has been generated from your Career Context. | View resume |
| Cover letter generated | Cover letter generated | Your cover letter is ready. | View cover letter |
| Quick questions needed | Two quick answers needed | Two quick answers could strengthen this package before you submit. | Answer questions |
| Red Team passed | Quality check passed | This package passed quality review. | — |
| Red Team failed | Quality check failed | This package did not pass quality review. Review the flagged sections before continuing. | Review issues |
| Package blocked | Package blocked | This package cannot proceed until required items are resolved. | See blockers |
| User approval required | Your approval required | This application package is ready for your final review before it moves to Ready to Apply. | Review and approve |
| Ready to Apply | Ready to Apply | This application package passed quality review and is ready for your final approval. | Apply |

---

## READINESS_AND_BLOCKERS

| Event | Title | Body | Action |
|---|---|---|---|
| Quality review required | Quality review required | This package needs Red Team review before it can move to Ready to Apply. | Run review |
| Unsupported claims | Unsupported claims found | Some claims need stronger evidence before this package can be approved. | Review claims |
| Missing evidence | Missing evidence | HireWire couldn't find enough evidence to support this application. Add more Career Context. | Add evidence |
| Missing profile data | Profile incomplete | Some required profile fields are missing. | Complete profile |
| Already applied | Already applied | You marked this application as submitted. | View application |

---

## COACH_GUIDANCE

Coach generates its own contextual copy. The following are registered prompts and welcome messages only.

| Context | Copy |
|---|---|
| Welcome message | Hey. I'm your HireWire Coach. I can help you with job search strategy, interview prep, building your Career Context, and improving your application materials. What would you like to work on? |
| Quick prompt: pipeline | Review my pipeline |
| Quick prompt: interview | Interview prep tips |
| Quick prompt: resume | Improve my resume |
| Quick prompt: evidence | Build my evidence |

---

## APPLICATION_ACTIONS

| Event | Title | Body | Action |
|---|---|---|---|
| Apply now available | Ready to apply | This application package is approved and ready to submit. | Apply now |
| Application submitted | Application logged | Your application has been marked as submitted. | — |
| Application already submitted | Already submitted | You already marked this application as submitted. | View |
| Follow up due | Follow up due | This application may be ready for a follow up. | Draft follow up |
| Status update requested | Update your status | How did this application go? Log the outcome to keep your pipeline accurate. | Update status |

---

## DOCUMENT_AND_EXPORT

| Event | Title | Body | Action |
|---|---|---|---|
| Export ready | Export ready | Your resume export is ready. | Download |
| Cover letter export ready | Export ready | Your cover letter export is ready. | Download |
| Export failed | Export failed | Your export did not complete. Try again or contact support. | Retry |
| Document version updated | Document updated | A newer version of this document is available. | View latest |

---

## BILLING_AND_PLAN

| Event | Title | Body | Action |
|---|---|---|---|
| Generation limit reached | Generation limit reached | You reached your current plan's generation limit. | View plans |
| Upgrade required | Upgrade required | This feature requires a HireWire Pro plan. | Upgrade |
| Payment failed | Payment failed | Your last payment did not go through. Update your payment method to keep your plan active. | Update payment |
| Subscription updated | Plan updated | Your subscription has been updated. | — |
| Plan changed | Plan changed | Your HireWire plan has been changed. | View billing |
| Checkout started | — | (redirect to Stripe — no in-app message) | — |
| Receipt available | Receipt available | Your receipt is available in your billing history. | View receipt |

---

## ERROR_AND_RECOVERY

| Event | Title | Body | Action |
|---|---|---|---|
| Unknown error | Something went wrong | Something unexpected happened. Try again or contact support if this continues. | Try again |
| AI generation failed | Generation failed | The AI generation did not complete. Try again — your data is saved. | Retry |
| Job board blocked | Job board blocked | This job board blocked automated reading. Paste the job description manually to continue. | Paste description |
| Database save failed | Save failed | HireWire couldn't save your changes. Try again. | Retry |
| Auth expired | Session expired | Your session expired. Sign in again to continue securely. | Sign in |
| Export failed | Export failed | Your export did not complete. Try again or contact support. | Retry |

Error messages with a digest/reference ID should append:
`If this keeps happening, contact support and include this reference: {digest}`

---

## SUPPORT_AND_FEEDBACK

| Event | Title | Body | Action |
|---|---|---|---|
| Feedback submitted | Feedback received | Thanks. Your feedback was received. | Close |
| Bug report received | Report received | We got it. Our team will look into this. | Close |
| Support request created | Support request created | Your request has been submitted. We'll follow up by email. | — |

---

## EXTERNAL_DRAFTS_FOR_USER_APPROVAL

All external drafts must include this disclaimer before the copy:
> "This draft is for your review. Edit it before sending. HireWire does not send this on your behalf."

| Draft type | Title | Body | Action |
|---|---|---|---|
| Recruiter follow up | Follow-up draft ready | A follow-up draft is ready for your review. Edit it before sending. | Review draft |
| Thank you note | Thank you note ready | A post-interview thank you note is ready for your review. | Review draft |
| Salary negotiation | Negotiation draft ready | A salary negotiation opening is ready for your review. | Review draft |
| Withdrawal | Withdrawal draft ready | A withdrawal message is ready for your review. | Review draft |

---

## COPY RULES

1. Never expose internal table names, column names, or system IDs in user-facing copy.
2. Never say "Evidence Library" — use "Career Context."
3. Never say "generated_documents" — use "resume," "cover letter," or "application package."
4. Never say "AI Assistant" — use "Coach" or "HireWire Coach."
5. Never use raw error messages — use registered copy with optional digest reference.
6. Do not use exclamation marks in error or blocker copy.
7. Be direct. HireWire tone is confident and functional, not cheerful or startup-cheesy.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
