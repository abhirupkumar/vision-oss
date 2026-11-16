'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Play, Plug, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useApi, useNavigation } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SlackIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#4A154B" />
    <path
      d="M9.366 12.357c-1.077 0-1.95.884-1.95 1.975s.873 1.975 1.95 1.975c1.077 0 1.95-.884 1.95-1.975v-1.975H9.366zm.019-1.996c1.077 0 1.95-.884 1.95-1.975S10.462 6.41 9.385 6.41a1.962 1.962 0 00-1.95 1.976v1.975h1.95zm1.94 1.996h4.86c1.076 0 1.95-.884 1.95-1.975s-.874-1.975-1.95-1.975h-4.86c-1.076 0-1.95.884-1.95 1.975s.874 1.975 1.95 1.975zM8.384 16.275H3.525C2.45 16.275 1.575 17.16 1.575 18.25s.875 1.975 1.95 1.975h4.86c1.075 0 1.95-.885 1.95-1.975s-.875-1.975-1.95-1.975z"
      fill="#E01E5A"
    />
    <path
      d="M12.33 16.275v4.896c0 1.091.874 1.975 1.95 1.975 1.077 0 1.95-.884 1.95-1.975v-4.896c0-1.091-.873-1.975-1.95-1.975-1.076 0-1.95.884-1.95 1.975zm0-1.996c0-1.091-.874-1.975-1.95-1.975-1.077 0-1.95.884-1.95 1.975v1.975h1.95v-1.975zm1.968-1.996h4.86c1.075 0 1.95-.885 1.95-1.976s-.875-1.975-1.95-1.975h-4.86c-1.075 0-1.95.884-1.95 1.975s.875 1.976 1.95 1.976zM18.218 6.41h-4.86c-1.076 0-1.95.884-1.95 1.976s.874 1.975 1.95 1.975h4.86c1.076 0 1.95-.884 1.95-1.975s-.874-1.976-1.95-1.976z"
      fill="#36C5F0"
    />
    <path
      d="M16.269 12.357c1.076 0 1.95-.884 1.95-1.975s-.874-1.975-1.95-1.975c-1.077 0-1.95.884-1.95 1.975v1.975h1.95zm-.019 1.996c-1.076 0-1.95.884-1.95 1.975s.874 1.976 1.95 1.976a1.962 1.962 0 001.95-1.976v-1.975h-1.95zM12.35 12.357H7.49c-1.076 0-1.95.884-1.95 1.975s.874 1.975 1.95 1.975h4.86c1.076 0 1.95-.884 1.95-1.975s-.874-1.975-1.95-1.975zM13.33 6.41h4.86c1.076 0 1.95.884 1.95 1.976s-.874 1.975-1.95 1.975h-4.86c-1.076 0-1.95-.884-1.95-1.975S12.254 6.41 13.33 6.41z"
      fill="#2EB67D"
    />
    <path
      d="M9.366 16.275v-4.896c0-1.091-.873-1.975-1.95-1.975-1.077 0-1.95.884-1.95 1.975v4.896c0 1.091.873 1.975 1.95 1.975 1.077 0 1.95-.884 1.95-1.975zm0 1.996c0 1.091.873 1.975 1.95 1.975 1.076 0 1.95-.884 1.95-1.975v-1.975h-1.95v1.975zM7.398 12.357H2.538C1.463 12.357.588 11.472.588 10.382s.875-1.976 1.95-1.976h4.86c1.076 0 1.95.885 1.95 1.976s-.874 1.975-1.95 1.975zM3.525 6.41h4.86C9.46 6.41 10.335 7.294 10.335 8.386s-.875 1.975-1.95 1.975h-4.86C2.45 10.36 1.575 9.477 1.575 8.386S2.45 6.41 3.525 6.41z"
      fill="#ECB22E"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#5865F2" />
    <path
      d="M18.885 6.643a15.7 15.7 0 00-3.92-1.217.067.067 0 00-.071.033 11.082 11.082 0 00-1.63 3.327 16.035 16.035 0 00-4.805 0 11.134 11.134 0 00-1.637-3.327.068.068 0 00-.07-.033 15.688 15.688 0 00-3.922 1.217.065.065 0 00-.03.023C.614 13.064-.236 19.345.048 25.568c.002.046.027.089.064.116a15.82 15.82 0 004.772 2.42.068.068 0 00.073-.024c.34-.464.646-.95.918-1.455a.068.068 0 00-.037-.094 10.34 10.34 0 01-1.503-.715.068.068 0 01-.007-.113c.105-.079.208-.161.309-.244a.067.067 0 01.07-.01 11.233 11.233 0 009.684 0 .066.066 0 01.07.01c.101.082.204.165.31.244a.067.067 0 01-.007.113 10.355 10.355 0 01-1.506.713.068.068 0 00-.036.095c.273.506.58.992.922 1.454.019.025.05.038.082.024a15.827 15.827 0 004.767-2.42.066.066 0 00.065-.115c.338-7.144-.81-13.31-2.73-18.902a.057.057 0 00-.031-.023zM8.025 19.33c-1.127 0-2.05-.98-2.05-2.185s.906-2.185 2.05-2.185c1.15 0 2.066.989 2.05 2.185 0 1.205-.905 2.185-2.05 2.185zm7.95 0c-1.127 0-2.05-.98-2.05-2.185s.906-2.185 2.05-2.185c1.15 0 2.066.989 2.05 2.185 0 1.205-.905 2.185-2.05 2.185z"
      fill="#fff"
    />
  </svg>
);

export default function IntegrationsPage() {
  const { router, organizationId } = useNavigation();
  const { get, post, del } = useApi();

  const [activeForm, setActiveForm] = useState<'slack' | 'discord' | null>(null);

  const [slackName, setSlackName] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');

  const { data: integrations, refetch } = useQuery({
    queryKey: ['integrations', organizationId],
    queryFn: () => get(`/organizations/${organizationId}/integrations`),
  });

  const { mutate: testDiscord, isPending: isTestingDiscord } = useMutation({
    mutationFn: (url: string) =>
      post(`/organizations/${organizationId}/integrations`, {
        type: 'discord',
        url,
        test_only: true,
      }),
    onSuccess: () => {
      toast.success('Test notification sent');
    },
    onError: () => {
      toast.error('Failed to send test notification');
    },
  });

  const { mutate: addDiscord, isPending: isAddingDiscord } = useMutation({
    mutationFn: (data: { name: string; url: string }) =>
      post(`/organizations/${organizationId}/integrations`, {
        type: 'discord',
        url: data.url,
        name: data.name,
      }),
    onSuccess: () => {
      toast.success('Discord integration added');
      setDiscordName('');
      setDiscordUrl('');
      setActiveForm(null);
      refetch();
    },
    onError: () => {
      toast.error('Failed to add Discord integration');
    },
  });

  const { mutate: deleteIntegration } = useMutation({
    mutationFn: (id: string) => del(`/organizations/${organizationId}/integrations`, { id }),
    onSuccess: () => {
      toast.success('Integration removed');
      refetch();
    },
  });

  const handleSlackCreate = () => {
    if (!slackName) return;
    window.location.href = `/api/organizations/${organizationId}/integrations/slack?name=${encodeURIComponent(slackName)}`;
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl py-8 px-4 md:px-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-sm text-muted-foreground">Connect Vision with your favorite tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slack Card */}
        <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-6 flex-1">
            <div className="flex items-start gap-4 mb-4">
              <SlackIcon />
              <div>
                <h3 className="font-semibold text-lg leading-tight">Slack</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Slack workspace to get notified when new issues are created.
                </p>
              </div>
            </div>

            {activeForm === 'slack' && (
              <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Integration Name</label>
                  <Input
                    placeholder="e.g. Acme Engineering"
                    value={slackName}
                    onChange={e => setSlackName(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-4 border-t border-border flex justify-end gap-2">
            {activeForm === 'slack' ? (
              <>
                <Button variant="outline" onClick={() => setActiveForm(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSlackCreate} disabled={!slackName}>
                  Create
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setActiveForm('slack')} className="gap-2">
                <Plug size={16} />
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Discord Card */}
        <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-6 flex-1">
            <div className="flex items-start gap-4 mb-4">
              <DiscordIcon />
              <div>
                <h3 className="font-semibold text-lg leading-tight">Discord</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Discord server to get notified when new issues are created.
                </p>
              </div>
            </div>

            {activeForm === 'discord' && (
              <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Integration Name</label>
                  <Input
                    placeholder="e.g. Support Channel"
                    value={discordName}
                    onChange={e => setDiscordName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    type="text"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordUrl}
                    onChange={e => setDiscordUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-4 border-t border-border flex justify-end gap-2">
            {activeForm === 'discord' ? (
              <>
                <Button variant="outline" onClick={() => setActiveForm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testDiscord(discordUrl)}
                  disabled={!discordUrl || isTestingDiscord}
                  className="gap-2"
                >
                  <Play size={16} />
                  Test Connection
                </Button>
                <Button
                  onClick={() => addDiscord({ name: discordName, url: discordUrl })}
                  disabled={!discordUrl || !discordName || isAddingDiscord}
                >
                  Create
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setActiveForm('discord')} className="gap-2">
                <Plug size={16} />
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {integrations && integrations.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Active Integrations</h3>
          <div className="flex flex-col gap-3">
            {integrations.map((i: any) => (
              <div
                key={i.id}
                className="flex justify-between items-center border border-border p-4 rounded-lg bg-card"
              >
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{i.config?.type}</div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => deleteIntegration(i.id)}>
                  <Trash size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
