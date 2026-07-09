'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SEGMENTS = [
  { id: 'all_users', label: 'All subscribed users' },
  { id: 'no_bookings', label: 'No bookings yet' },
  { id: 'active_users', label: 'Active (1+ booking)' },
  { id: 'inactive_users', label: 'Inactive (no booking in 30 days)' },
] as const;

const CAMPAIGN_TYPES = [
  { id: 'promo', label: 'Promo' },
  { id: 'discount', label: 'Discount' },
  { id: 'reminder', label: 'Reminder' },
] as const;

const AUDIENCES = [
  'new users',
  'inactive users',
  'active customers',
  'all subscribers',
] as const;

export function MarketingCampaignPanel() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [segment, setSegment] = useState<string>('all_users');
  const [loading, setLoading] = useState(false);
  const [campaignType, setCampaignType] = useState<string>('promo');
  const [audience, setAudience] = useState<string>(AUDIENCES[0]);
  const [loadingAi, setLoadingAi] = useState(false);

  async function onGenerateAi() {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_type: campaignType, audience }),
      });
      const data = (await res.json()) as { ok?: boolean; subject?: string; html?: string; error?: string };
      if (!res.ok || !data.ok || !data.subject || !data.html) {
        toast.error(data.error || 'Generation failed');
        return;
      }
      setSubject(data.subject);
      setHtml(data.html);
      toast.success('Draft inserted — review before sending');
    } catch {
      toast.error('Network error');
    } finally {
      setLoadingAi(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, segment }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Campaign failed to queue');
        return;
      }
      toast.success(data.message || 'Campaign queued');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-medium">Generate with AI</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Campaign type</Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={onGenerateAi} disabled={loadingAi}>
          {loadingAi ? 'Generating…' : 'Generate with AI'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="m-subject">Subject</Label>
        <Input
          id="m-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="April promo"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-html">HTML content</Label>
        <Textarea
          id="m-html"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="<p>Hello {{name}}</p>"
          className="min-h-[200px] font-mono text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          Full HTML body. Recipients are loaded from subscribed subscribers in the selected segment.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Segment</Label>
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger>
            <SelectValue placeholder="Choose segment" />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Queueing…' : 'Send campaign'}
      </Button>
    </form>
  );
}
