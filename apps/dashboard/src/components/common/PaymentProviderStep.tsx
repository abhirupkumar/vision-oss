'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import {
  PAYMENT_PROVIDERS,
  PROVIDER_MAP,
  type PaymentProvider,
  type ProviderConfig,
} from '@/lib/payments/providers';

export type { PaymentProvider, ProviderConfig };

interface ConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  missingPermissions?: string[];
  errorMessage?: string;
}

export interface ConnectedProviderItem {
  id: string;
  provider: PaymentProvider;
  status: string;
  config?: Record<string, any>;
}

export interface PaymentProviderStepProps {
  projectId: string;
  onConnected?: (provider: PaymentProvider) => void;
  onAttemptStarted?: () => void;
  onConnectionsChange?: (connections: ConnectedProviderItem[]) => void;
}

export function PaymentProviderStep({
  projectId,
  onConnected,
  onAttemptStarted,
  onConnectionsChange,
}: PaymentProviderStepProps) {
  const [connections, setConnections] = useState<ConnectedProviderItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'idle' });
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Load existing connections
  useEffect(() => {
    let cancelled = false;
    async function loadConnections() {
      try {
        const res = await fetch(`/api/payment-connections?projectId=${encodeURIComponent(projectId)}`);
        if (res.ok) {
          const json = await res.json();
          const items: ConnectedProviderItem[] = json.data || json || [];
          const activeOnly = items.filter(c => c.status !== 'disconnected');
          if (!cancelled) {
            setConnections(activeOnly);
            onConnectionsChange?.(activeOnly);
            if (activeOnly.length > 0 && onConnected) {
              onConnected(activeOnly[0].provider);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load payment connections:', err);
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    loadConnections();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const connectedProviders = new Set(connections.map(c => c.provider));
  const availableProviders = PAYMENT_PROVIDERS.filter(p => !connectedProviders.has(p.key));
  const providerConfig = selectedProvider ? PROVIDER_MAP[selectedProvider] : null;

  const handleFieldChange = (name: string, value: string) => {
    setFields(prev => ({ ...prev, [name]: value }));
  };

  const handleConnect = async () => {
    if (!selectedProvider || !providerConfig) return;

    onAttemptStarted?.();
    setConnectionState({ status: 'connecting' });

    try {
      const res = await fetch('/api/payment-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          projectId,
          config: fields,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newConnection: ConnectedProviderItem = data.connection || {
          id: data.connection?.id || `${selectedProvider}-${Date.now()}`,
          provider: selectedProvider,
          status: 'active',
          config: fields,
        };

        const updated = [...connections.filter(c => c.provider !== selectedProvider), newConnection];
        setConnections(updated);
        onConnectionsChange?.(updated);
        setConnectionState({ status: 'idle' });
        setSelectedProvider(null);
        setFields({});
        onConnected?.(selectedProvider);
      } else {
        setConnectionState({
          status: 'error',
          missingPermissions: data.missingPermissions,
          errorMessage: data.error ?? 'Connection failed',
        });
      }
    } catch (err) {
      setConnectionState({
        status: 'error',
        errorMessage: 'Network error. Please try again.',
      });
    }
  };

  const handleRemove = async (conn: ConnectedProviderItem) => {
    setRemovingId(conn.id);
    try {
      const res = await fetch(
        `/api/payment-connections/${encodeURIComponent(conn.id)}?projectId=${encodeURIComponent(projectId)}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        const updated = connections.filter(c => c.id !== conn.id);
        setConnections(updated);
        onConnectionsChange?.(updated);
      }
    } catch (err) {
      console.error('Failed to remove payment connection:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const isConnecting = connectionState.status === 'connecting';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Payment Providers</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect one or more payment providers to automatically track revenue from all your gateways.
          <span className="text-xs font-medium text-primary ml-1">Optional</span>
        </p>
      </div>

      {/* Connected Providers List */}
      {connections.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connected Gateways ({connections.length})
          </Label>
          <div className="space-y-2">
            {connections.map(conn => {
              const cfg = PROVIDER_MAP[conn.provider];
              const isRemoving = removingId === conn.id;
              return (
                <div
                  key={conn.id || conn.provider}
                  className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cfg?.logo ?? '💳'}</span>
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        {cfg?.label ?? conn.provider}
                        <CheckCircle2 size={14} className="text-emerald-500 inline-block" />
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {conn.config?.apiKey ? `Key: ${conn.config.apiKey}` : 'Active'}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => handleRemove(conn)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2.5"
                  >
                    {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Provider Selector for adding a new provider */}
      {availableProviders.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {connections.length > 0 ? 'Add Another Provider' : 'Select Provider'}
          </Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              disabled={isConnecting}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all',
                'bg-background text-foreground border-input',
                'hover:border-ring focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20',
              )}
            >
              {providerConfig ? (
                <span className="flex items-center gap-2">
                  <span className="text-base">{providerConfig.logo}</span>
                  <span className="font-medium">{providerConfig.label}</span>
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Plus size={14} />
                  Choose a payment provider to connect...
                </span>
              )}
              <ChevronDown size={15} className="text-muted-foreground shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                {availableProviders.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.key);
                      setDropdownOpen(false);
                      setFields({});
                      setConnectionState({ status: 'idle' });
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                      'hover:bg-accent',
                      selectedProvider === p.key && 'bg-accent',
                    )}
                  >
                    <span className="text-lg">{p.logo}</span>
                    <div>
                      <div className="font-medium text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 text-center">
          All supported payment providers have been connected.
        </div>
      )}

      {/* Credential fields for selected provider */}
      {providerConfig && (
        <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {providerConfig.label} Credentials
            </span>
            <a
              href={providerConfig.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              Get API key <ExternalLink size={10} />
            </a>
          </div>

          {providerConfig.fields.map(field => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`payment-${field.name}`} className="text-xs font-medium">
                {field.label}
              </Label>
              <Input
                id={`payment-${field.name}`}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                value={fields[field.name] ?? ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                disabled={isConnecting}
                className="text-sm h-9"
                autoComplete="off"
              />
            </div>
          ))}

          {/* Error: missing permissions or failure */}
          {connectionState.status === 'error' && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle size={14} />
                {connectionState.errorMessage}
              </div>
              {connectionState.missingPermissions &&
                connectionState.missingPermissions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Missing permissions:</p>
                    <ul className="space-y-1">
                      {connectionState.missingPermissions.map(perm => (
                        <li
                          key={perm}
                          className="text-xs font-mono bg-muted rounded px-2 py-0.5 text-destructive inline-block mr-1 mb-1"
                        >
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isConnecting}
              onClick={() => {
                setSelectedProvider(null);
                setFields({});
                setConnectionState({ status: 'idle' });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={handleConnect}
              disabled={isConnecting || !Object.values(fields).some(v => v.trim())}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={13} className="mr-2 animate-spin" />
                  Connecting {providerConfig.label}...
                </>
              ) : (
                `Connect ${providerConfig.label}`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Metadata contract hint */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Checkout Metadata Required
        </p>
        <p className="text-xs text-muted-foreground">
          Pass these two keys in your checkout session metadata to enable revenue attribution:
        </p>
        <div className="space-y-1">
          <code className="block text-xs bg-muted rounded px-2 py-1 font-mono">
            projectId: <span className="text-primary">&quot;{projectId}&quot;</span>
          </code>
          <code className="block text-xs bg-muted rounded px-2 py-1 font-mono">
            visitorid: <span className="text-primary">&quot;visitor-id&quot;</span>
            <span className="text-muted-foreground"> {/* or */} </span>
            deviceid: <span className="text-primary">&quot;device-id&quot;</span>
          </code>
        </div>
      </div>
    </div>
  );
}
