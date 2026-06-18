// ── Legal content (Privacy Policy + Terms of Service) ──────────────────────
// Single source for the in-app legal screens. Drafted for the Dubai Schools
// MVP (UAE PDPL — Federal Decree-Law 45/2021 — + App Store UGC requirements).
//
// ⚠️ PLACEHOLDERS to replace before public launch are wrapped in [brackets]:
//   [Operator legal name], [contact email], [governing jurisdiction].
// This is a working draft reviewed by the legal-compliance agents; have a
// UAE-qualified lawyer confirm before relying on it.

export const LEGAL_META = {
  effectiveDate: '2026-06-17',
  appName: 'Dubai Schools',
  operator: '[Operator legal name]',
  operatorAddress: '[Operator registered address, Dubai, UAE]',
  contactEmail: '[support@your-domain.com]',
  jurisdiction: 'the Emirate of Dubai and the applicable federal laws of the United Arab Emirates',
};

export interface LegalSection {
  heading: string;
  body: string[];
}

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: '1. Who we are',
    body: [
      `${LEGAL_META.appName} ("the App", "we", "us") is operated by ${LEGAL_META.operator}. This Privacy Policy explains what personal data we collect, why, and your rights under the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) and other applicable laws.`,
      `Effective date: ${LEGAL_META.effectiveDate}.`,
    ],
  },
  {
    heading: '2. Data we collect',
    body: [
      'Account data you provide at sign-up: first name, last name, gender, phone number, and email address.',
      'Content you create: school reviews, ratings, and saved/bookmarked schools.',
      'Technical data: app/device information and basic usage needed to operate and secure the service.',
      'We do NOT store your password — authentication is handled by our processor (Supabase) and passwords are stored only as a secure cryptographic hash.',
    ],
  },
  {
    heading: '3. How we use your data',
    body: [
      'To create and manage your account and authenticate you.',
      'To publish reviews you submit under your display name (first name + last name).',
      'To operate, secure, and improve the service (including preventing spam and abuse).',
      'To review, moderate, and filter user content — reviews may be checked or filtered before and/or after they appear (pre- and post-moderation) for community safety and legal compliance.',
      'To contact you about your account or important service changes.',
    ],
  },
  {
    heading: '4. Legal basis',
    body: [
      'We process your data based on your consent (given at sign-up), the performance of our service to you, and our legitimate interest in operating a safe community platform. You may withdraw consent by deleting your account.',
    ],
  },
  {
    heading: '5. Sharing and processors',
    body: [
      'We use Supabase as our database, authentication, and hosting processor. Your data is stored on their infrastructure under their security controls.',
      'We do not sell your personal data and we do not use it for third-party advertising.',
      'School facts (names, areas, curriculum, ratings, fees) are sourced from KHDA open data and other public sources and are not personal data about you.',
      'We may disclose data where required by law or by competent UAE authorities.',
    ],
  },
  {
    heading: '6. International transfer',
    body: [
      'Our processor (Supabase) may host data on servers located outside the UAE (see the processor’s current region). Where personal data is transferred abroad, we rely on the safeguards permitted under the UAE Personal Data Protection Law — including a data processing agreement with standard contractual protections — together with your consent given at sign-up.',
      'By creating an account and consenting at sign-up, you agree to this cross-border processing.',
    ],
  },
  {
    heading: '7. Retention',
    body: [
      'We keep your account data (name, gender, phone, email) while your account is active.',
      'When you delete your account, your account record is deleted and your reviews are disassociated from your identity (kept only as anonymous content). Residual copies in encrypted backups are purged on our processor’s rolling backup cycle.',
    ],
  },
  {
    heading: '8. Cookies & local storage',
    body: [
      'On the web app we use browser local storage (not advertising cookies) to keep you signed in and to remember preferences such as language and saved schools. On mobile we use the device’s secure local storage for the same purposes.',
    ],
  },
  {
    heading: '9. Your rights',
    body: [
      'You may access, correct, or delete your personal data. Account deletion is available in the app (Profile → Delete account) and removes your account data.',
      'You may withdraw consent, object to certain processing, restrict processing, or request a copy of your data by contacting us.',
      'You have the right to lodge a complaint with the UAE Data Office if you believe your data has been mishandled.',
      `To exercise any right, contact ${LEGAL_META.contactEmail}.`,
    ],
  },
  {
    heading: '10. Children',
    body: [
      'The App is intended for adults (18+), typically parents and guardians. It is not directed at children, and we do not knowingly collect data from anyone under 18. If you believe a minor has provided data, contact us and we will delete it.',
    ],
  },
  {
    heading: '11. Security',
    body: [
      'We apply administrative and technical safeguards (including database row-level security and encrypted credentials). No system is perfectly secure, but we work to protect your data and will notify affected users and authorities of a qualifying breach as required by law.',
    ],
  },
  {
    heading: '12. Changes & contact',
    body: [
      'We may update this policy; material changes will be notified in-app. For changes that materially affect how we process your personal data, we will seek your renewed consent where required by law.',
      `Controller / contact: ${LEGAL_META.operator}, ${LEGAL_META.operatorAddress}, ${LEGAL_META.contactEmail}.`,
    ],
  },
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: '1. Acceptance',
    body: [
      `By creating an account or using ${LEGAL_META.appName}, you agree to these Terms of Service and the Privacy Policy. If you do not agree, do not use the App.`,
      `Effective date: ${LEGAL_META.effectiveDate}.`,
    ],
  },
  {
    heading: '2. Eligibility',
    body: ['You must be at least 18 years old and able to enter a binding agreement.'],
  },
  {
    heading: '3. The service & data disclaimer',
    body: [
      'The App provides information about schools in Dubai (including data derived from KHDA open data) and a community platform for reviews.',
      'School information — including fees, ratings, vacancy and other details — is provided for general guidance only, may be incomplete or out of date, and is NOT official. Always verify directly with the school before making decisions.',
    ],
  },
  {
    heading: '4. Your account',
    body: [
      'You agree to provide accurate information and keep your login secure. You are responsible for activity under your account.',
    ],
  },
  {
    heading: '5. User content & reviews',
    body: [
      'You are solely responsible for reviews and other content you submit. Content must be your genuine, honest opinion or accurate information.',
      'You must NOT post content that is false, defamatory, abusive, hateful, harassing, obscene, unlawful, or that infringes others’ rights. Under UAE law, online defamation and false information are serious offences.',
      'You grant us a non-exclusive, royalty-free licence to host, display, and distribute your content within and for the operation and promotion of the App. This licence continues for content that remains (in anonymised form) after you delete your account or a review.',
      'Reviews are tied to your account to keep the community accountable, and are published under your display name.',
    ],
  },
  {
    heading: '6. Moderation, reporting & takedown',
    body: [
      'You can report objectionable content in the App. We may remove content and suspend or ban accounts that violate these Terms, at our discretion.',
      `If you believe content infringes your rights or is defamatory, notify us at ${LEGAL_META.contactEmail} with the content location and the basis of your complaint. We will review and may remove it.`,
      'We may, but are not obliged to, monitor or pre-moderate content. Moderation does not guarantee that all objectionable content is removed, and acting on (or declining) a report does not make us liable for user content.',
    ],
  },
  {
    heading: '7. Prohibited conduct',
    body: [
      'No spam, scraping, reverse engineering, attempts to break security, impersonation, or use of the App for unlawful purposes.',
    ],
  },
  {
    heading: '8. Your indemnity',
    body: [
      'You agree to indemnify and hold us harmless from claims, damages, and costs (including reasonable legal fees) arising from content you submit or from your breach of these Terms or of any law — including claims of defamation or infringement relating to your reviews.',
    ],
  },
  {
    heading: '9. Intellectual property',
    body: [
      'The App, its design and software are owned by us or our licensors. Public school data remains attributable to its sources (e.g., KHDA).',
    ],
  },
  {
    heading: '10. Disclaimers & liability',
    body: [
      'The App is provided "as is" and "as available" without warranties of any kind. We do not warrant the accuracy, completeness, or timeliness of school information (including fees, ratings, and vacancy).',
      'To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential losses, or for decisions made in reliance on information in the App.',
      'Our total aggregate liability for any claim relating to the App shall not exceed AED 500. Nothing in these Terms excludes liability that cannot be excluded under UAE law (for example, for death or personal injury caused by negligence, fraud, or wilful misconduct).',
    ],
  },
  {
    heading: '11. Termination',
    body: [
      'You may delete your account at any time. We may suspend or terminate access for breach of these Terms.',
    ],
  },
  {
    heading: '12. Changes to these Terms',
    body: [
      'We may update these Terms; material changes will be notified in-app. Continued use after changes means you accept the updated Terms.',
    ],
  },
  {
    heading: '13. General',
    body: [
      'If any provision is held unenforceable, the rest remain in effect (severability). We may assign these Terms in connection with a merger or transfer of the App; you may not assign yours without our consent.',
      'We are not liable for failures caused by events beyond our reasonable control (force majeure). Our failure to enforce a provision is not a waiver. These Terms and the Privacy Policy are the entire agreement between you and us regarding the App.',
    ],
  },
  {
    heading: '14. Governing law',
    body: [
      `These Terms are governed by the laws of ${LEGAL_META.jurisdiction}, and disputes are subject to the competent courts of Dubai.`,
    ],
  },
  {
    heading: '15. Contact',
    body: [`Questions about these Terms: ${LEGAL_META.operator}, ${LEGAL_META.contactEmail}.`],
  },
];
