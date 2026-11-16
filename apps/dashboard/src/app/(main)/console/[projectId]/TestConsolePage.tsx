'use client';
import { Button, Column, Grid, Heading } from '@umami/react-zen';
import Link from 'next/link';
import Script from 'next/script';
import { ProjectChart } from '@/app/(main)/[organizationId]/[projectId]/ProjectChart';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useProjectQuery } from '@/components/hooks';
import { EventsChart } from '@/components/metrics/EventsChart';

export function TestConsolePage({ projectId }: { projectId: string }) {
  const { data } = useProjectQuery(projectId);

  function handleRunScript() {
    ((window as any).vision || (window as any).sigma).track(props => ({
      ...props,
      url: '/page-view',
      referrer: 'https://www.google.com',
    }));
    ((window as any).vision || (window as any).sigma).track('track-event-no-data');
    ((window as any).vision || (window as any).sigma).track('track-event-with-data', {
      test: 'test-data',
      boolean: true,
      booleanError: 'true',
      time: new Date(),
      user: `user${Math.round(Math.random() * 10)}`,
      number: 1,
      number2: Math.random() * 100,
      time2: new Date().toISOString(),
      nested: {
        test: 'test-data',
        number: 1,
        object: {
          test: 'test-data',
        },
      },
      array: [1, 2, 3],
    });
  }

  function handleRunRevenue() {
    ((window as any).vision || (window as any).sigma).track(props => ({
      ...props,
      url: '/checkout-cart',
      referrer: 'https://www.google.com',
    }));
    ((window as any).vision || (window as any).sigma).track('checkout-cart', {
      revenue: parseFloat((Math.random() * 1000).toFixed(2)),
      currency: 'USD',
    });
    ((window as any).vision || (window as any).sigma).track('affiliate-link', {
      revenue: parseFloat((Math.random() * 1000).toFixed(2)),
      currency: 'USD',
    });
    ((window as any).vision || (window as any).sigma).track('promotion-link', {
      revenue: parseFloat((Math.random() * 1000).toFixed(2)),
      currency: 'USD',
    });
    ((window as any).vision || (window as any).sigma).track('checkout-cart', {
      revenue: parseFloat((Math.random() * 1000).toFixed(2)),
      currency: 'EUR',
    });
    ((window as any).vision || (window as any).sigma).track('promotion-link', {
      revenue: parseFloat((Math.random() * 1000).toFixed(2)),
      currency: 'EUR',
    });
    ((window as any).vision || (window as any).sigma).track('affiliate-link', {
      item1: {
        productIdentity: 'ABC424',
        revenue: parseFloat((Math.random() * 10000).toFixed(2)),
        currency: 'JPY',
      },
      item2: {
        productIdentity: 'ZYW684',
        revenue: parseFloat((Math.random() * 10000).toFixed(2)),
        currency: 'JPY',
      },
    });
  }

  function handleRunIdentify() {
    ((window as any).vision || (window as any).sigma).identify({
      userId: 123,
      name: 'brian',
      number: Math.random() * 100,
      test: 'test-data',
      boolean: true,
      booleanError: 'true',
      time: new Date(),
      time2: new Date().toISOString(),
      nested: {
        test: 'test-data',
        number: 1,
        object: {
          test: 'test-data',
        },
      },
      array: [1, 2, 3],
    });
  }

  if (!data) {
    return null;
  }

  return (
    <PageBody>
      <PageHeader title="Test console">
        <Column>{data.name}</Column>
      </PageHeader>
      <Column gap="6" paddingY="6">
        <Script
          async
          data-project-id={projectId}
          src={`${process.env.basePath || ''}/script.js`}
          data-cache="true"
        />
        <Panel>
          <Grid columns="1fr 1fr 1fr" gap>
            <Column gap>
              <Heading>Page links</Heading>
              <div>
                <Link href={`/console/${projectId}?page=1`}>page one</Link>
              </div>
              <div>
                <Link href={`/console/${projectId}?page=2 `}>page two</Link>
              </div>
              <div>
                <a href="https://www.google.com" data-vision-event="external-link-direct">
                  external link (direct)
                </a>
              </div>
              <div>
                <a
                  href="https://www.google.com"
                  data-vision-event="external-link-tab"
                  target="_blank"
                  rel="noreferrer"
                >
                  external link (tab)
                </a>
              </div>
            </Column>
            <Column gap>
              <Heading>Click events</Heading>
              <Button id="send-event-button" data-vision-event="button-click" variant="primary">
                Send event
              </Button>
              <Button
                id="send-event-data-button"
                data-vision-event="button-click"
                data-vision-event-name="bob"
                data-vision-event-id="123"
                variant="primary"
              >
                Send event with data
              </Button>
              <Button
                id="generate-revenue-button"
                data-vision-event="checkout-cart"
                data-vision-event-revenue={(Math.random() * 10000).toFixed(2).toString()}
                data-vision-event-currency="USD"
                variant="primary"
              >
                Generate revenue data
              </Button>
              <Button
                id="button-with-div-button"
                data-vision-event="button-click"
                data-vision-event-name={'bob'}
                data-vision-event-id="123"
                variant="primary"
              >
                <div>Button with div</div>
              </Button>
              <div data-vision-event="div-click">DIV with attribute</div>
              <div data-vision-event="div-click-one">
                <div data-vision-event="div-click-two">
                  <div data-vision-event="div-click-three">Nested DIV</div>
                </div>
              </div>
            </Column>
            <Column gap>
              <Heading>Javascript events</Heading>
              <Button id="manual-button" variant="primary" onClick={handleRunScript}>
                Run script
              </Button>
              <Button id="manual-button" variant="primary" onClick={handleRunIdentify}>
                Run identify
              </Button>
              <Button id="manual-button" variant="primary" onClick={handleRunRevenue}>
                Revenue script
              </Button>
            </Column>
          </Grid>
        </Panel>
        <Heading>Pageviews</Heading>
        <ProjectChart projectId={projectId} />
        <Heading>Events</Heading>
        <Panel>
          <EventsChart projectId={projectId} />
        </Panel>
      </Column>
    </PageBody>
  );
}
