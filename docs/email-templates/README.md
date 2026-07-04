# HireWire — Auth email templates

Branded transactional email templates for Supabase Auth, matching the **RedLantern
Studios standard-doc design** (cream paper, red left accent bar, left-aligned HireWire
logo + "A REDLANTERN STUDIOS COMPANY", red small-caps kicker, bold title, red CTA,
black footer bar) and the **HireWire Notification Standard v1.0** approved copy.

| Template | File | Subject | Standard ref |
|---|---|---|---|
| Confirm signup / welcome | `confirmation.html` | Welcome to HireWire | `account.welcome` |
| Magic link | `magic-link.html` | Your sign in link | `auth.magic_link` |
| Reset password | `reset-password.html` | Reset your password | (recovery) |

Copy follows the standard's writing rules — title ≤6 words carrying the outcome, body
one sentence / one action, honesty (never imply a capability the person hasn't backed up).

## Status: LIVE
These are already applied to the Supabase project's auth config (SMTP + templates +
subjects) via the Management API, and delivery is verified through **Resend SMTP**
(sender `no-reply@rorysemeah.com`). The logo is hosted at Supabase Storage
(`brand/hirewire-logo-email.png`). Each template uses the standard `{{ .ConfirmationURL }}`
variable — no code changes required.

## To re-apply / edit
Edit a template, then either paste it into Supabase Dashboard → Authentication → Email
Templates, or PATCH `POST /v1/projects/{ref}/config/auth` with the
`mailer_templates_*_content` / `mailer_subjects_*` fields.

## Notes
- **Shared project:** these emails currently serve every product on the `endovlj`
  project (Deixis/Amina included). True per-product branding needs HireWire on its own
  Supabase project.
- **Sender domain:** verify `hirewire.app` in Resend to send from a HireWire address
  instead of `rorysemeah.com`.
- To swap the image logo, replace the hosted URL in each `<img>`.
