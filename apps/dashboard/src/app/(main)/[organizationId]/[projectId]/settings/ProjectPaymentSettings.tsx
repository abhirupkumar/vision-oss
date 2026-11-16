'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Key,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import {
  PAYMENT_PROVIDERS,
  PROVIDER_MAP,
  type PaymentProvider,
  type ProviderConfig,
} from '@/lib/payments/providers';

interface PaymentConnectionItem {
  id: string;
  projectId: string;
  provider: PaymentProvider;
  status: 'active' | 'pending' | 'failed' | 'disconnected';
  config?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export function ProjectPaymentSettings({ projectId }: { projectId: string }) {
  const [connections, setConnections] = useState<PaymentConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [addFields, setAddFields] = useState<Record<string, string>>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Dialog State
  const [editingConnection, setEditingConnection] = useState<PaymentConnectionItem | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payment-connections?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const json = await res.json();
        const items = json.data || json || [];
        setConnections(items.filter((c: any) => c.status !== 'disconnected'));
      }
    } catch (err) {
      toast.error('Failed to load payment connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [projectId]);

  const connectedProviders = new Set(connections.map(c => c.provider));
  const availableProviders = PAYMENT_PROVIDERS.filter(p => !connectedProviders.has(p.key));

  const handleOpenAdd = () => {
    setSelectedProvider(availableProviders[0]?.key ?? null);
    setAddFields({});
    setAddError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setIsSubmittingAdd(true);
    setAddError(null);

    try {
      const res = await fetch('/api/payment-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          projectId,
          config: addFields,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${PROVIDER_MAP[selectedProvider]?.label || selectedProvider} connected successfully`);
        setIsAddOpen(false);
        fetchConnections();
      } else {
        setAddError(data.error || 'Failed to connect provider. Please check credentials.');
      }
    } catch (err) {
      setAddError('Network error. Please try again.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (conn: PaymentConnectionItem) => {
    setEditingConnection(conn);
    setEditFields({
      apiKey: '',
      storeId: conn.config?.storeId || '',
      organizationId: conn.config?.organizationId || '',
    });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConnection) return;

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const payloadConfig: Record<string, string> = {};
      if (editFields.apiKey && editFields.apiKey.trim()) {
        payloadConfig.apiKey = editFields.apiKey.trim();
      }
      if (editFields.storeId && editFields.storeId.trim()) {
        payloadConfig.storeId = editFields.storeId.trim();
      }
      if (editFields.organizationId && editFields.organizationId.trim()) {
        payloadConfig.organizationId = editFields.organizationId.trim();
      }

      const res = await fetch(
        `/api/payment-connections/${encodeURIComponent(editingConnection.id)}?projectId=${encodeURIComponent(projectId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: payloadConfig,
            status: 'active',
          }),
        },
      );

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Connection credentials updated');
        setEditingConnection(null);
        fetchConnections();
      } else {
        setEditError(data.error || 'Failed to update connection.');
      }
    } catch (err) {
      setEditError('Network error. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRemove = async (conn: PaymentConnectionItem) => {
    const providerName = PROVIDER_MAP[conn.provider]?.label || conn.provider;
    if (!confirm(`Are you sure you want to disconnect ${providerName}?`)) return;

    setDeletingId(conn.id);
    try {
      const res = await fetch(
        `/api/payment-connections/${encodeURIComponent(conn.id)}?projectId=${encodeURIComponent(projectId)}`,
        { method: 'DELETE' },
      );

      if (res.ok) {
        toast.success(`${providerName} disconnected`);
        fetchConnections();
      } else {
        toast.error(`Failed to disconnect ${providerName}`);
      }
    } catch (err) {
      toast.error('Network error while disconnecting');
    } finally {
      setDeletingId(null);
    }
  };

  const getOrigin = () => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://api.vision.com';
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const addConfig = selectedProvider ? PROVIDER_MAP[selectedProvider] : null;
  const editConfig = editingConnection ? PROVIDER_MAP[editingConnection.provider] : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <Label className="text-lg font-semibold">Payment Gateways & Revenue Connections</Label>
          <p className="text-sm text-muted-foreground">
            Connect multiple payment providers to consolidate and attribute revenue across all your gateways.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          disabled={availableProviders.length === 0}
          className="shrink-0"
        >
          <Plus size={14} className="mr-1.5" />
          Connect Gateway
        </Button>
      </div>

      {/* Connections List */}
      {loading ? (
        <div className="p-8 flex items-center justify-center text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading payment connections...
        </div>
      ) : connections.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed border-border bg-muted/10 space-y-3">
          <div className="text-3xl">💳</div>
          <div className="text-sm font-medium">No payment gateways connected yet</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Connect Stripe, Lemon Squeezy, Paddle, or Polar to track order count, revenue, average order value,
            and gateway breakdowns in your Revenue dashboard.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={handleOpenAdd}>
            <Plus size={14} className="mr-1.5" />
            Connect Your First Gateway
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {connections.map(conn => {
            const cfg = PROVIDER_MAP[conn.provider];
            const isDeleting = deletingId === conn.id;

            return (
              <div
                key={conn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{cfg?.logo ?? '💳'}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">
                        {cfg?.label ?? conn.provider}
                      </span>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-xs">
                        <CheckCircle2 size={12} className="mr-1" />
                        {conn.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-mono">
                      {conn.config?.apiKey && (
                        <span className="flex items-center gap-1">
                          <Key size={11} />
                          {conn.config.apiKey}
                        </span>
                      )}
                      {conn.config?.storeId && (
                        <span>Store: {conn.config.storeId}</span>
                      )}
                      {conn.config?.organizationId && (
                        <span>Org: {conn.config.organizationId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(conn)}
                    className="h-8 text-xs"
                  >
                    <Pencil size={13} className="mr-1.5" />
                    Edit API Key
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleRemove(conn)}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook & Attribution Instructions */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <HelpCircle size={15} className="text-primary" />
          Webhook & Metadata Integration Guide
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Configure your payment provider&apos;s webhook settings to forward payment events to Vision:
        </p>

        <div className="space-y-2">
          {PAYMENT_PROVIDERS.map(p => (
            <div
              key={p.key}
              className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border font-mono"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{p.logo}</span>
                <span className="font-sans font-medium text-foreground">{p.label}:</span>
                <span className="truncate text-muted-foreground">
                  {getOrigin()}/api/webhooks/payments/{p.key}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyText(`${getOrigin()}/api/webhooks/payments/${p.key}`)}
              >
                <Copy size={11} />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="font-medium text-foreground mb-1">Checkout Metadata Contract:</p>
          <p className="text-muted-foreground mb-2">
            Attach these parameters in your checkout session metadata so payments are attributed to your sessions:
          </p>
          <div className="p-2.5 rounded bg-background border border-border font-mono space-y-1">
            <div>
              <span className="text-muted-foreground">projectId:</span>{' '}
              <span className="text-primary">&quot;{projectId}&quot;</span>
            </div>
            <div>
              <span className="text-muted-foreground">visitorid:</span>{' '}
              <span className="text-primary">&quot;visitor-id&quot;</span>{' '}
              <span className="text-muted-foreground">{`// or deviceid: "device-id"`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Connection Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Payment Gateway</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Provider</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableProviders.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.key);
                      setAddFields({});
                      setAddError(null);
                    }}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all',
                      selectedProvider === p.key
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <span className="text-lg">{p.logo}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {addConfig && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">API Credentials</span>
                  <a
                    href={addConfig.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Get API Key <ExternalLink size={10} />
                  </a>
                </div>

                {addConfig.fields.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={`add-${field.name}`} className="text-xs">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id={`add-${field.name}`}
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      value={addFields[field.name] ?? ''}
                      onChange={e => setAddFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                      required={field.required}
                      autoComplete="off"
                      className="text-sm h-9"
                    />
                  </div>
                ))}
              </div>
            )}

            {addError && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                {addError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmittingAdd}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingAdd || !addConfig || !Object.values(addFields).some(v => v.trim())}
              >
                {isSubmittingAdd ? (
                  <>
                    <Loader2 size={13} className="mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Gateway'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Connection Dialog */}
      <Dialog open={!!editingConnection} onOpenChange={open => !open && setEditingConnection(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{editConfig?.logo}</span>
              Edit {editConfig?.label} Connection
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-apiKey" className="text-xs font-medium">
                New API Key
              </Label>
              <Input
                id="edit-apiKey"
                type="password"
                placeholder="Leave blank to keep current key (••••••••)"
                value={editFields.apiKey ?? ''}
                onChange={e => setEditFields(prev => ({ ...prev, apiKey: e.target.value }))}
                autoComplete="off"
                className="text-sm h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter a new API key only if you want to rotate or update the existing credentials.
              </p>
            </div>

            {editingConnection?.provider === 'lemonsqueezy' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-storeId" className="text-xs font-medium">
                  Store ID
                </Label>
                <Input
                  id="edit-storeId"
                  placeholder="12345"
                  value={editFields.storeId ?? ''}
                  onChange={e => setEditFields(prev => ({ ...prev, storeId: e.target.value }))}
                  className="text-sm h-9"
                />
              </div>
            )}

            {editingConnection?.provider === 'polar' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-orgId" className="text-xs font-medium">
                  Organization ID (optional)
                </Label>
                <Input
                  id="edit-orgId"
                  placeholder="org_..."
                  value={editFields.organizationId ?? ''}
                  onChange={e => setEditFields(prev => ({ ...prev, organizationId: e.target.value }))}
                  className="text-sm h-9"
                />
              </div>
            )}

            {editError && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                {editError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingConnection(null)}
                disabled={isSubmittingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingEdit}>
                {isSubmittingEdit ? (
                  <>
                    <Loader2 size={13} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
