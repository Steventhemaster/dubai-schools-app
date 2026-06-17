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
      'To operate, secure, moderate, and improve the service (including preventing spam and abuse).',
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
      'We do not sell your personal data.',
      'School facts (names, areas, curriculum, ratings, fees) are sourced from KHDA open data and other public sources and are not personal data about you.',
      'We may disclose data where required by law or competent UAE authorities.',
    ],
  },
  {
    heading: '6. Storage, location and retention',
    body: [
      'Data is stored with our processor and may be hosted outside the UAE; we take steps so that any international transfer has appropriate safeguards as required by UAE law.',
      'We keep your account data while your account is active. When you delete your account, your account data is removed and your reviews are disassociated from your identity.',
    ],
  },
  {
    heading: '7. Your rights',
    body: [
      'You may access, correct, or delete your personal data. Account deletion is available in the app (Profile → Delete account) and removes your account data.',
      'You may withdraw consent, object to certain processing, or request a copy of your data by contacting us.',
      `To exercise any right, contact ${LEGAL_META.contactEmail}.`,
    ],
  },
  {
    heading: '8. Children',
    body: [
      'The App is intended for adults (18+), typically parents and guardians. It is not directed at children, and we do not knowingly collect data from anyone under 18.',
    ],
  },
  {
    heading: '9. Security',
    body: [
      'We apply administrative and technical safeguards (including row-level security and encrypted credentials). No system is perfectly secure, but we work to protect your data.',
    ],
  },
  {
    heading: '10. Changes & contact',
    body: [
      'We may update this policy; material changes will be notified in-app. Continued use after changes means you accept the updated policy.',
      `Questions or requests: ${LEGAL_META.contactEmail}.`,
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
      'You grant us a non-exclusive, royalty-free licence to host, display, and distribute your content within the App.',
      'Reviews are tied to your account to keep the community accountable.',
    ],
  },
  {
    heading: '6. Moderation & reporting',
    body: [
      'You can report objectionable content in the App. We may remove content and suspend or ban accounts that violate these Terms, at our discretion, and we may pre-moderate content before it appears.',
    ],
  },
  {
    heading: '7. Prohibited conduct',
    body: [
      'No spam, scraping, reverse engineering, attempts to break security, impersonation, or use of the App for unlawful purposes.',
    ],
  },
  {
    heading: '8. Intellectual property',
    body: [
      'The App, its design and software are owned by us or our licensors. Public school data remains attributable to its sources (e.g., KHDA).',
    ],
  },
  {
    heading: '9. Disclaimers & liability',
    body: [
      'The App is provided "as is" without warranties of any kind. We do not warrant the accuracy or completeness of school information.',
      'To the maximum extent permitted by law, we are not liable for indirect or consequential losses, or for decisions made in reliance on information in the App.',
    ],
  },
  {
    heading: '10. Termination',
    body: [
      'You may delete your account at any time. We may suspend or terminate access for breach of these Terms.',
    ],
  },
  {
    heading: '11. Governing law',
    body: [
      `These Terms are governed by the laws of ${LEGAL_META.jurisdiction}, and disputes are subject to the competent courts of Dubai.`,
    ],
  },
  {
    heading: '12. Contact',
    body: [`Questions about these Terms: ${LEGAL_META.contactEmail}.`],
  },
];
