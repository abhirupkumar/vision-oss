'use client';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FolderPlus,
  Rocket,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLoginQuery } from '@/components/hooks';
import { useApi } from '@/components/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { PaymentProviderStep } from './PaymentProviderStep';
import { TrackingScriptStep } from './TrackingScriptStep';

// ─── Types ────────────────────────────────────────────────────────────────────

/** workspace = onboarding (create org + project); project = add project to existing org */
export type ModalMode = 'workspace' | 'project';

type Step = 'details' | 'payment' | 'tracking';
const STEPS: Step[] = ['details', 'payment', 'tracking'];

const STEP_LABELS: Record<Step, string> = {
  details: 'Details',
  payment: 'Payments',
  tracking: 'Install Script',
};

const DOMAIN_REGEX = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface CreateProjectModalProps {
  /** Controls Step 1 layout. 'workspace' = create org+project. 'project' = pick org + create project. */
  mode?: ModalMode;
  /** Pre-selected / default organization (used in 'project' mode) */
  defaultOrganizationId?: string;
  /** Name of the default org — shown immediately before async org list loads */
  defaultOrganizationName?: string;
  /** Called on final finish with the created org and project IDs */
  onSuccess?: (orgId: string, projectId: string) => void;
  onCancel?: () => void;
  isCancellable?: boolean;
}

// ─── Org Selector Dropdown ────────────────────────────────────────────────────

function OrgSelector({
  orgs,
  selectedId,
  onChange,
  disabled,
}: {
  orgs: Organization[];
  selectedId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = orgs.find(o => o.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || orgs.length <= 1}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all',
          'bg-background text-foreground border-input',
          'hover:border-ring focus:outline-none',
          (disabled || orgs.length <= 1) && 'cursor-default opacity-70',
        )}
      >
        <span className="flex items-center gap-2">
          <Building2 size={14} className="text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{selected?.name ?? 'Select organization…'}</span>
        </span>
        {orgs.length > 1 && <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>

      {open && orgs.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {orgs.map(org => (
            <button
              key={org.id}
              type="button"
              onClick={() => {
                onChange(org.id);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent',
                org.id === selectedId && 'bg-accent',
              )}
            >
              <Building2 size={14} className="text-muted-foreground shrink-0" />
              <span className="font-medium">{org.name}</span>
              {org.id === selectedId && <Check size={12} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const idx = STEPS.indexOf(currentStep);
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all shrink-0',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-primary/15 border-2 border-primary text-primary',
                !done && !active && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-xs font-medium hidden sm:block',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {STEP_LABELS[step]}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn('mx-3 h-px w-8 transition-all', i < idx ? 'bg-primary' : 'bg-border')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreateProjectModal({
  mode = 'project',
  defaultOrganizationId,
  defaultOrganizationName,
  onSuccess,
  onCancel,
  isCancellable = true,
}: CreateProjectModalProps) {
  const router = useRouter();
  const { user } = useLoginQuery();
  const { get, post } = useApi();

  const [currentStep, setCurrentStep] = useState<Step>('details');
  const idx = STEPS.indexOf(currentStep);

  // ── Step 1 state ────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState(''); // workspace mode only
  const [projectName, setProjectName] = useState('');
  const [domain, setDomain] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Org selector state (project mode)
  // Pre-seed with the known default org so the name shows immediately on open
  const [orgs, setOrgs] = useState<Organization[]>(() => {
    if (defaultOrganizationId && defaultOrganizationName) {
      return [{ id: defaultOrganizationId, name: defaultOrganizationName }];
    }
    return [];
  });
  const [selectedOrgId, setSelectedOrgId] = useState<string>(defaultOrganizationId ?? '');
  const [orgsLoading, setOrgsLoading] = useState(false);

  // Created IDs (set after Step 1 submit)
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // ── Step 2 (payment) gating ─────────────────────────────────────────
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [paymentConnected, setPaymentConnected] = useState(false);

  // ── Load user orgs (project mode) ──────────────────────────────────
  useEffect(() => {
    if (mode !== 'project' || !user?.id) return;
    setOrgsLoading(true);
    get(`/users/${user.id}/organizations`)
      .then((data: any) => {
        const list: Organization[] = data?.data ?? data ?? [];
        setOrgs(list);
        // Default to provided org, or first in list
        if (!selectedOrgId && list.length > 0) {
          setSelectedOrgId(defaultOrganizationId ?? list[0].id);
        } else if (defaultOrganizationId) {
          setSelectedOrgId(defaultOrganizationId);
        }
      })
      .catch(() => { })
      .finally(() => setOrgsLoading(false));
  }, [mode, user?.id]);

  // ── Validation ──────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === 'workspace' && !orgName.trim()) errs.orgName = 'Organization name is required';
    if (mode === 'project' && !selectedOrgId) errs.org = 'Please select an organization';
    if (!projectName.trim()) errs.projectName = 'Project name is required';
    if (!domain.trim()) {
      errs.domain = 'Domain is required';
    } else if (!DOMAIN_REGEX.test(domain.trim())) {
      errs.domain = 'Enter a valid domain (e.g. example.com)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit Step 1 ───────────────────────────────────────────────────
  const handleSubmitDetails = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let orgId = selectedOrgId;

      // Workspace mode: create org first
      if (mode === 'workspace') {
        const org = await post('/organizations', { name: orgName.trim() }).catch(() => null);
        if (!org) {
          setErrors({ orgName: 'Failed to create organization' });
          return;
        }
        orgId = org.id;
      }

      // Create project
      const project = await post('/projects', {
        name: projectName.trim(),
        domain: domain.trim(),
        organizationId: orgId,
      }).catch(() => null);

      if (!project) {
        setErrors({ projectName: 'Failed to create project' });
        return;
      }

      setCreatedOrgId(orgId);
      setCreatedProjectId(project.id);
      setCurrentStep('payment');
    } catch {
      setErrors({ projectName: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Finish ──────────────────────────────────────────────────────────
  const handleFinish = () => {
    if (createdOrgId && createdProjectId) {
      if (onSuccess) {
        onSuccess(createdOrgId, createdProjectId);
      } else {
        window.location.href = `/${createdOrgId}/${createdProjectId}`;
        router.refresh();
      }
    }
  };

  // ── Navigation ───────────────────────────────────────────────────────
  const handleNext = () => {
    const next = STEPS[idx + 1];
    if (next) setCurrentStep(next);
  };
  const handleBack = () => {
    const prev = STEPS[idx - 1];
    if (prev) setCurrentStep(prev);
  };

  const isLastStep = currentStep === 'tracking';
  const paymentBlocked = currentStep === 'payment' && paymentAttempted && !paymentConnected;

  const icon =
    mode === 'workspace' ? (
      <Rocket size={18} className="text-primary" />
    ) : (
      <FolderPlus size={18} className="text-primary" />
    );

  const title =
    mode === 'workspace'
      ? currentStep === 'details'
        ? 'Create Workspace'
        : currentStep === 'payment'
          ? 'Connect Revenue'
          : 'Install Tracking'
      : currentStep === 'details'
        ? 'New Project'
        : currentStep === 'payment'
          ? 'Connect Revenue'
          : 'Install Tracking';

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-7 pb-5 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              Step {idx + 1} of {STEPS.length}
            </p>
          </div>
        </div>
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Body */}
      <div className="px-7 py-6 min-h-80">
        {/* ── Step 1: Details ─────────────────────────────────────────── */}
        {currentStep === 'details' && (
          <div className="space-y-4">
            {/* Workspace mode: org name */}
            {mode === 'workspace' && (
              <div className="space-y-1.5">
                <Label htmlFor="modal-orgName">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-orgName"
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
                {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
              </div>
            )}

            {/* Project mode: org selector */}
            {mode === 'project' && (
              <div className="space-y-1.5">
                <Label>Organization</Label>
                {orgsLoading ? (
                  <div className="h-10 rounded-lg border border-input bg-muted animate-pulse" />
                ) : (
                  <OrgSelector orgs={orgs} selectedId={selectedOrgId} onChange={setSelectedOrgId} />
                )}
                {errors.org && <p className="text-xs text-destructive">{errors.org}</p>}
              </div>
            )}

            {/* Divider between org section and project fields */}
            <div className={cn('space-y-4', mode === 'workspace' && 'pt-3 border-t border-border')}>
              {mode === 'workspace' && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  First Project
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-projName">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modal-projName"
                    placeholder="e.g. My App"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    autoFocus={mode === 'project'}
                    autoComplete="off"
                  />
                  {errors.projectName && (
                    <p className="text-xs text-destructive">{errors.projectName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-domain">
                    Domain <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modal-domain"
                    placeholder="e.g. myapp.com"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    autoComplete="off"
                  />
                  {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Payment ──────────────────────────────────────────── */}
        {currentStep === 'payment' && createdProjectId && (
          <PaymentProviderStep
            projectId={createdProjectId}
            onConnected={() => setPaymentConnected(true)}
            onAttemptStarted={() => setPaymentAttempted(true)}
          />
        )}

        {/* ── Step 3: Tracking Script ──────────────────────────────────── */}
        {currentStep === 'tracking' && createdProjectId && (
          <TrackingScriptStep projectId={createdProjectId} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-border bg-muted/20">
        {/* Left: back / cancel */}
        <div className="flex items-center gap-2">
          {idx > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
          )}
          {isCancellable && idx === 0 && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Right: skip / next / finish */}
        <div className="flex items-center gap-2">
          {/* Skip payment if not yet attempted */}
          {currentStep === 'payment' && !paymentAttempted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          )}
          {/* Skip tracking */}
          {currentStep === 'tracking' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFinish}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          )}

          {isLastStep ? (
            <Button type="button" size="sm" onClick={handleFinish}>
              <Check size={14} className="mr-1.5" />
              {mode === 'workspace' ? 'Launch Dashboard' : 'Finish'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={currentStep === 'details' ? handleSubmitDetails : handleNext}
              disabled={saving || paymentBlocked}
            >
              {saving ? (
                'Creating…'
              ) : currentStep === 'details' ? (
                mode === 'workspace' ? (
                  'Create Workspace'
                ) : (
                  'Create Project'
                )
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight size={14} className="ml-1.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
