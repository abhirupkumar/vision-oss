'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useApi } from '@/components/hooks';

export function InsightsSettings({ projectId, organizationId }: { projectId: string; organizationId: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { get, post } = useApi();

  useEffect(() => {
    get(`/insights/config`, { projectId })
      .then((data: any) => {
        setConfig(data || { enabled: false, frequency: 'daily', modelTier: 'balanced' });
      })
      .catch(() => {
        setConfig({ enabled: false, frequency: 'daily', modelTier: 'balanced' });
      });
  }, [projectId, get]);

  const saveConfig = async (updates: any) => {
    const newConfig = { ...config, ...updates, projectId, organizationId };
    setConfig(newConfig);
    try {
      await post('/insights/config', newConfig);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    try {
      await post('/insights/generate', { projectId });
      toast.success('Insights generation started. Check back soon.');
    } catch (e) {
      toast.error('Failed to start generation');
    } finally {
      setGenerating(false);
    }
  };

  if (!config) return <div className="h-40 animate-pulse bg-muted rounded-xl"></div>;

  return (
    <div className="flex flex-col gap-6 rounded-xl border p-6 bg-card">
      <div>
        <h2 className="text-lg font-medium">Smart Insights Configuration</h2>
        <p className="text-sm text-muted-foreground">Automated AI detection and investigation.</p>
      </div>

      <div className="flex flex-col gap-4 max-w-sm">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable Auto-Generation</label>
          <Switch 
            checked={config.enabled} 
            onCheckedChange={(c) => saveConfig({ enabled: c })} 
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Frequency</label>
          <select 
            className="rounded-md border p-2 text-sm bg-background"
            value={config.frequency}
            onChange={(e) => saveConfig({ frequency: e.target.value })}
            disabled={!config.enabled}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Model Intelligence Tier</label>
          <select 
            className="rounded-md border p-2 text-sm bg-background"
            value={config.modelTier}
            onChange={(e) => saveConfig({ modelTier: e.target.value })}
            disabled={!config.enabled}
          >
            <option value="fast">Fast (GPT-4o-mini)</option>
            <option value="balanced">Balanced (Gemini 2.0 Flash)</option>
            <option value="deep">Deep Investigation (Claude 3.5 Sonnet)</option>
          </select>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={generateNow} 
            disabled={generating || !config.enabled}
            variant="secondary"
          >
            {generating ? 'Generating...' : 'Run Generation Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
