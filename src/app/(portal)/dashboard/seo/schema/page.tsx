'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Layers,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';

type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'Article'
  | 'Product'
  | 'FAQPage';

interface FaqItem {
  question: string;
  answer: string;
}

interface SchemaFormState {
  // Organization & LocalBusiness
  orgName: string;
  orgUrl: string;
  orgLogo: string;
  orgEmail: string;
  // LocalBusiness
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  // Article
  headline: string;
  authorName: string;
  datePublished: string;
  articleImage: string;
  articleDescription: string;
  // Product
  productName: string;
  productBrand: string;
  productSku: string;
  productPrice: string;
  productCurrency: string;
  productAvailability: string;
  productDescription: string;
  // FAQPage
  faqs: FaqItem[];
}

const DEFAULT_FORM: SchemaFormState = {
  orgName: 'Acme Commerce Inc.',
  orgUrl: 'https://acme-commerce.com',
  orgLogo: 'https://acme-commerce.com/assets/logo.png',
  orgEmail: 'support@acme-commerce.com',
  phone: '+1-415-555-0192',
  streetAddress: '548 Market St',
  city: 'San Francisco',
  postalCode: '94104',
  country: 'US',
  headline: 'How Technical SEO Improves Core Web Vitals in 2026',
  authorName: 'Maya Lin',
  datePublished: '2026-11-20',
  articleImage: 'https://acme-commerce.com/blog/cwv-guide.jpg',
  articleDescription:
    'A practical guide to reducing LCP, INP, and CLS on modern storefronts.',
  productName: 'Pro Ergonomic Desk Chair',
  productBrand: 'Acme Studio',
  productSku: 'ACME-CHR-204',
  productPrice: '349.00',
  productCurrency: 'USD',
  productAvailability: 'https://schema.org/InStock',
  productDescription:
    'Breathable mesh ergonomic chair with lumbar support and 5-year warranty.',
  faqs: [
    {
      question: 'How long does website migration take?',
      answer:
        'Most managed migrations complete within 48 hours with zero downtime and full 301 redirect mapping.',
    },
    {
      question: 'Is SSL included in every managed plan?',
      answer:
        'Yes, automated TLS 1.3 SSL certificates and daily backups are included at no extra cost.',
    },
  ],
};

function buildSchemaObject(type: SchemaType, state: SchemaFormState) {
  switch (type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: state.orgName,
        url: state.orgUrl,
        logo: state.orgLogo,
        contactPoint: {
          '@type': 'ContactPoint',
          email: state.orgEmail,
          contactType: 'customer support',
        },
      };

    case 'LocalBusiness':
      return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: state.orgName,
        url: state.orgUrl,
        telephone: state.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: state.streetAddress,
          addressLocality: state.city,
          postalCode: state.postalCode,
          addressCountry: state.country,
        },
      };

    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: state.headline,
        description: state.articleDescription,
        image: state.articleImage,
        datePublished: state.datePublished,
        author: {
          '@type': 'Person',
          name: state.authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: state.orgName,
        },
      };

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: state.productName,
        description: state.productDescription,
        sku: state.productSku,
        brand: {
          '@type': 'Brand',
          name: state.productBrand,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: state.productCurrency,
          price: state.productPrice,
          availability: state.productAvailability,
        },
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: state.faqs
          .filter((f) => f.question.trim() || f.answer.trim())
          .map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
      };
  }
}

export default function SchemaGeneratorPage() {
  const [schemaType, setSchemaType] = useState<SchemaType>('Organization');
  const [form, setForm] = useState<SchemaFormState>(DEFAULT_FORM);
  const [copied, setCopied] = useState(false);

  const updateField = <K extends keyof SchemaFormState>(
    key: K,
    value: SchemaFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFaq = (index: number, field: keyof FaqItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const scriptOutput = useMemo(() => {
    const schemaObj = buildSchemaObject(schemaType, form);
    const json = JSON.stringify(schemaObj, null, 2);
    return `<script type="application/ld+json">\n${json}\n</script>`;
  }, [schemaType, form]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored when unavailable
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="JSON-LD Schema Generator"
        subtitle="Build valid Schema.org structured data, preview the script tag live, and copy it to your site."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Sample
            </Button>
            <Button variant="primary" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON-LD
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Schema Type & Form Fields */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Schema Configuration
              </h2>
            </div>
            <Badge variant="sm" tone="primary">
              {schemaType}
            </Badge>
          </div>

          <div className="space-y-4">
            <Select
              label="Schema Type"
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value as SchemaType)}
            >
              <option value="Organization">Organization</option>
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="Article">Article</option>
              <option value="Product">Product</option>
              <option value="FAQPage">FAQPage</option>
            </Select>

            {schemaType === 'Organization' && (
              <div className="space-y-3">
                <Input
                  label="Organization Name"
                  value={form.orgName}
                  onChange={(e) => updateField('orgName', e.target.value)}
                />
                <Input
                  label="Website URL"
                  value={form.orgUrl}
                  onChange={(e) => updateField('orgUrl', e.target.value)}
                />
                <Input
                  label="Logo URL"
                  value={form.orgLogo}
                  onChange={(e) => updateField('orgLogo', e.target.value)}
                />
                <Input
                  label="Support Email"
                  type="email"
                  value={form.orgEmail}
                  onChange={(e) => updateField('orgEmail', e.target.value)}
                />
              </div>
            )}

            {schemaType === 'LocalBusiness' && (
              <div className="space-y-3">
                <Input
                  label="Business Name"
                  value={form.orgName}
                  onChange={(e) => updateField('orgName', e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Website URL"
                    value={form.orgUrl}
                    onChange={(e) => updateField('orgUrl', e.target.value)}
                  />
                  <Input
                    label="Telephone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
                <Input
                  label="Street Address"
                  value={form.streetAddress}
                  onChange={(e) => updateField('streetAddress', e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="City"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                  <Input
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                  />
                  <Input
                    label="Country Code"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                </div>
              </div>
            )}

            {schemaType === 'Article' && (
              <div className="space-y-3">
                <Input
                  label="Headline"
                  value={form.headline}
                  onChange={(e) => updateField('headline', e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Author Name"
                    value={form.authorName}
                    onChange={(e) => updateField('authorName', e.target.value)}
                  />
                  <Input
                    label="Published Date"
                    type="date"
                    value={form.datePublished}
                    onChange={(e) =>
                      updateField('datePublished', e.target.value)
                    }
                  />
                </div>
                <Input
                  label="Featured Image URL"
                  value={form.articleImage}
                  onChange={(e) => updateField('articleImage', e.target.value)}
                />
                <Textarea
                  label="Description"
                  rows={3}
                  value={form.articleDescription}
                  onChange={(e) =>
                    updateField('articleDescription', e.target.value)
                  }
                />
              </div>
            )}

            {schemaType === 'Product' && (
              <div className="space-y-3">
                <Input
                  label="Product Name"
                  value={form.productName}
                  onChange={(e) => updateField('productName', e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Brand"
                    value={form.productBrand}
                    onChange={(e) =>
                      updateField('productBrand', e.target.value)
                    }
                  />
                  <Input
                    label="SKU"
                    value={form.productSku}
                    onChange={(e) => updateField('productSku', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="Price"
                    value={form.productPrice}
                    onChange={(e) =>
                      updateField('productPrice', e.target.value)
                    }
                  />
                  <Input
                    label="Currency"
                    value={form.productCurrency}
                    onChange={(e) =>
                      updateField('productCurrency', e.target.value)
                    }
                  />
                  <Select
                    label="Availability"
                    value={form.productAvailability}
                    onChange={(e) =>
                      updateField('productAvailability', e.target.value)
                    }
                  >
                    <option value="https://schema.org/InStock">In Stock</option>
                    <option value="https://schema.org/OutOfStock">
                      Out of Stock
                    </option>
                    <option value="https://schema.org/PreOrder">
                      Pre-Order
                    </option>
                  </Select>
                </div>
                <Textarea
                  label="Product Description"
                  rows={3}
                  value={form.productDescription}
                  onChange={(e) =>
                    updateField('productDescription', e.target.value)
                  }
                />
              </div>
            )}

            {schemaType === 'FAQPage' && (
              <div className="space-y-3">
                {form.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="space-y-2.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        Question #{idx + 1}
                      </span>
                      {form.faqs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => removeFaq(idx)}
                          aria-label={`Remove question ${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[var(--destructive)]" />
                        </Button>
                      )}
                    </div>
                    <Input
                      label="Question"
                      value={faq.question}
                      onChange={(e) =>
                        updateFaq(idx, 'question', e.target.value)
                      }
                    />
                    <Textarea
                      label="Answer"
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFaq}>
                  <Plus className="h-3.5 w-3.5" />
                  Add FAQ Item
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Live JSON-LD Preview */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Live JSON-LD Preview
              </h2>
            </div>
            <Badge variant="sm" tone="success">
              Valid JSON-LD
            </Badge>
          </div>

          <pre className="flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 font-mono text-xs leading-relaxed text-[var(--foreground)]">
            <code>{scriptOutput}</code>
          </pre>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Paste inside your page&apos;s{' '}
              <code className="font-mono text-[var(--foreground)]">&lt;head&gt;</code>{' '}
              or via CMS header injection.
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
