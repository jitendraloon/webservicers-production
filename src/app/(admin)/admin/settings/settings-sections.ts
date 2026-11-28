import {
  Globe,
  DollarSign,
  ShieldCheck,
  Receipt,
  FileText,
  Headphones,
  Search,
  Bell,
  Lock,
  FileCheck,
  Code2,
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  { id: 'general', num: '1', title: 'General & Branding', href: '/admin/settings/general', icon: Globe, desc: 'Identity, logo, contact, footer' },
  { id: 'localization', num: '2', title: 'Localization & Currency', href: '/admin/settings/localization', icon: DollarSign, desc: 'Currencies, timezone, date formats' },
  { id: 'auth', num: '3', title: 'Authentication & 2FA', href: '/admin/settings/auth', icon: ShieldCheck, desc: 'SSO, registration, 2FA policy' },
  { id: 'billing', num: '4', title: 'Billing & Tax Rules', href: '/admin/settings/billing', icon: Receipt, desc: 'VAT/GST, deposit limits, payment fees' },
  { id: 'invoicing', num: '5', title: 'Invoicing & Dunning', href: '/admin/settings/invoicing', icon: FileText, desc: 'Invoice numbering, dunning schedule' },
  { id: 'support', num: '6', title: 'Support & SLA', href: '/admin/settings/support', icon: Headphones, desc: 'Departments, SLA targets, hours' },
  { id: 'seo', num: '7', title: 'SEO & Metadata', href: '/admin/settings/seo', icon: Search, desc: 'Meta tags, OG preview, robots.txt' },
  { id: 'notifications', num: '8', title: 'Notifications & Webhooks', href: '/admin/settings/notifications', icon: Bell, desc: 'SMTP relay, admin alerts, webhooks' },
  { id: 'security', num: '9', title: 'Security & Rate Limits', href: '/admin/settings/security', icon: Lock, desc: 'WAF rules, throttling, IP blacklist' },
  { id: 'compliance', num: '10', title: 'Compliance & GDPR', href: '/admin/settings/compliance', icon: FileCheck, desc: 'Cookie consent, erasure, policies' },
  { id: 'developer', num: '11', title: 'Developer & API', href: '/admin/settings/developer', icon: Code2, desc: 'API keys, maintenance mode, webhooks' },
];
