/**
 * lib/linkedin/cleanProfileText.ts
 *
 * Cleans raw text copied from a LinkedIn profile page.
 * Strips UI artifacts, feed chrome, and engagement noise before
 * sending to AI extraction. Never modifies content sections
 * (About, Experience, Education, Certifications, Skills, Activity, Analytics).
 */

export interface CleanedProfileText {
  cleanedText: string
  removedNoise: string[]
}

/**
 * Each rule describes a pattern to strip and a label for the noise_removed list.
 * Order matters: broader patterns run before specific ones.
 */
const NOISE_RULES: Array<{ label: string; pattern: RegExp }> = [
  // Engagement action buttons that appear as standalone lines
  {
    label: "engagement_buttons",
    pattern: /^[ \t]*(Like|Comment|Repost|Send|React|Share)[ \t]*$/gm,
  },
  // Reaction / engagement counts
  {
    label: "reaction_counts",
    pattern: /\b\d[\d,]*\s+(?:reactions?|comments?|reposts?|shares?)\b/gi,
  },
  // "View [Name]'s profile" link text (common copy artifact)
  {
    label: "view_profile_links",
    pattern: /View\s+.{1,60}?'?s?\s+(?:full\s+)?profile/gi,
  },
  // LinkedIn Premium upsell blocks
  {
    label: "premium_upsell",
    pattern:
      /(?:Try Premium|LinkedIn Premium|Get unlimited|Unlock with Premium|See who.{0,10}viewed|AI-powered (?:advice|insights)).{0,300}/gi,
  },
  // "Suggested for you" algorithm blocks
  {
    label: "suggested_for_you",
    pattern: /Suggested for you[\s\S]{0,500}?(?=\n{2,}|\nAbout|\nExperience|\nEducation|$)/gi,
  },
  // Navigation chrome — pure nav labels on their own line
  {
    label: "nav_chrome",
    pattern:
      /^[ \t]*(?:Home|My Network|Jobs|Messaging|Notifications|Work|Gaming|Learning|Search)[ \t]*$/gm,
  },
  // Profile action buttons
  {
    label: "profile_actions",
    pattern:
      /^[ \t]*(?:Connect|Follow|Message|More\.{0,3}|Open to work|Hiring|Open to)[ \t]*$/gm,
  },
  // Reaction emoji-only rows (👍❤️😂😮🙌👏 etc.)
  {
    label: "reaction_emojis",
    pattern: /^[\u{1F44D}\u{2764}\u{1F602}\u{1F62E}\u{1F64C}\u{1F44F}\s]{1,30}$/gmu,
  },
  // "X mutual connections" social noise
  {
    label: "mutual_connections_noise",
    pattern: /\b\d+\s+mutual\s+connections?\b/gi,
  },
  // Standalone hashtag-only lines (e.g. #OpenToWork)
  {
    label: "hashtag_lines",
    pattern: /^[ \t]*#\w+(?:\s+#\w+)*[ \t]*$/gm,
  },
  // "Report / Block / Remove" footer links
  {
    label: "report_links",
    pattern: /^[ \t]*(?:Report|Block|Remove connection|Unfollow).{0,60}$/gm,
  },
]

export function cleanProfileText(rawText: string): CleanedProfileText {
  const removedNoise: string[] = []
  let cleaned = rawText

  for (const { label, pattern } of NOISE_RULES) {
    // Re-create regex each iteration so lastIndex resets
    const re = new RegExp(pattern.source, pattern.flags)
    if (re.test(cleaned)) {
      removedNoise.push(label)
    }
    cleaned = cleaned.replace(new RegExp(pattern.source, pattern.flags), "")
  }

  // Collapse 3+ consecutive blank lines → 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  cleaned = cleaned.trim()

  return { cleanedText: cleaned, removedNoise }
}
