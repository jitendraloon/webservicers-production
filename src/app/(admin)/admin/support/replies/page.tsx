'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface PredefinedReply {
  id: string;
  title: string;
  category: string;
  body: string;
}

interface CustomField {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
}

export default function AdminSupportRepliesPage() {
  const [replies, setReplies] = React.useState<PredefinedReply[]>([
    { id: 'PR-1', title: 'DNS Propagation Check', category: 'Technical', body: 'Please allow 30 mins for DNS propagation.' },
    { id: 'PR-2', title: 'VAT Invoice Re-issued', category: 'Billing', body: 'Updated VAT invoice has been sent to your billing address.' },
    { id: 'PR-3', title: 'Escalated to L3 Infra', category: 'Technical', body: 'Escalated to our L3 engineering team for review.' },
  ]);

  const [fields, setFields] = React.useState<CustomField[]>([
    { id: 'CF-1', label: 'Affected Domain / Hostname', key: 'affected_domain', type: 'text', required: true },
    { id: 'CF-2', label: 'Order / Invoice Reference', key: 'order_ref', type: 'text', required: false },
    { id: 'CF-3', label: 'Urgency Impact', key: 'impact_level', type: 'select', required: true },
  ]);

  const [isAddReply, setIsAddReply] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('Technical');
  const [body, setBody] = React.useState('');

  const [newFieldLabel, setNewFieldLabel] = React.useState('');
  const [newFieldType, setNewFieldType] = React.useState<'text' | 'select' | 'number'>('text');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const addReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setReplies((prev) => [...prev, { id: `PR-${Date.now()}`, title: title.trim(), category, body: body.trim() }]);
    setTitle('');
    setBody('');
    setIsAddReply(false);
    notify('Saved predefined reply macro');
  };

  const addField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setFields((prev) => [...prev, { id: `CF-${Date.now()}`, label: newFieldLabel.trim(), key, type: newFieldType, required: false }]);
    setNewFieldLabel('');
    notify('Added custom ticket field');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predefined Replies & Custom Fields"
        subtitle="Configure canned response macros for support agents and custom intake fields on ticket forms."
        actions={
          <Button size="sm" onClick={() => setIsAddReply(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Macro
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Tabs defaultValue="replies">
        <TabsList>
          <TabsTrigger value="replies">Predefined Replies ({replies.length})</TabsTrigger>
          <TabsTrigger value="fields">Custom Ticket Fields ({fields.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="replies" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {replies.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{r.title}</h3>
                  <Badge tone="lilac" variant="sm">{r.category}</Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{r.body}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-[var(--destructive)]"
                  onClick={() => setReplies((prev) => prev.filter((item) => item.id !== r.id))}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fields" className="mt-4 space-y-4">
          <Card className="p-4">
            <form onSubmit={addField} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Input label="Field Label" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="e.g. Server IP Address" />
              </div>
              <Select label="Input Type" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CustomField['type'])} className="w-36">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Dropdown</option>
              </Select>
              <Button type="submit" size="sm">Add Field</Button>
            </form>
          </Card>

          <div className="space-y-2">
            {fields.map((f) => (
              <Card key={f.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{f.label}</div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)]">key: {f.key} · type: {f.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={f.required ? 'primary' : 'neutral'} variant="sm">
                    {f.required ? 'Required' : 'Optional'}
                  </Badge>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setFields((prev) => prev.filter((item) => item.id !== f.id))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Modal isOpen={isAddReply} onClose={() => setIsAddReply(false)} title="Create Predefined Reply">
        <form onSubmit={addReply} className="space-y-3">
          <Input label="Macro Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. SSL Verification Help" />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="General">General</option>
          </Select>
          <Textarea label="Reply Body" value={body} onChange={(e) => setBody(e.target.value)} required rows={4} />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setIsAddReply(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Macro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
