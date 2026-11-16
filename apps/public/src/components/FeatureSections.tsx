import React from 'react';
import BetterStackSection from './BetterStackSection';

// Cards
import {
  EventTrackingCard,
  RealtimeTrackingCard,
  UserJourneysCard,
  GeoMappingsCard,
  SessionReplaysCard,
} from './cards/ProductAnalyticsCards';

import {
  AiModelsUsedCard,
  NoOfTokensCard,
  CostsPerUserCard,
} from './cards/LlmAnalyticsCards';

import {
  PaymentsSubscriptionsCard,
  PerUserRevenueCard,
} from './cards/RevenueAnalyticsCards';

import {
  PerUserProfitCard,
  KpiScorecardCard,
  ProfitMarginsCard,
} from './cards/UnitEconomicsCards';

import {
  ErrorTrackingCard,
  LatencyPerformanceCard,
  SystemReliabilityCard,
} from './cards/ErrorsPerformanceCards';

import {
  AbTestsCard,
  FeatureFlagsCard,
} from './cards/ExperimentsCards';

import {
  McpTerminalCard,
} from './cards/McpServerCards';

export default function FeatureSections() {
  return (
    <div id="features" className="space-y-4">
      {/* ─── 1. PRODUCT ANALYTICS ───────────────────────────────────────── */}
      <BetterStackSection
        id="product-analytics"
        tag="📊  Product Analytics"
        tagColor="text-blue-500"
        title="Product Analytics"
        description="Track user journeys, live events, geographical distributions, and session recordings to uncover exact customer behavior."
        exploreText="Explore Product Analytics"
        exploreHref="#product-analytics"
      >
        <EventTrackingCard />
        <RealtimeTrackingCard />
        <UserJourneysCard />
        <GeoMappingsCard />
        <SessionReplaysCard />
      </BetterStackSection>

      {/* ─── 2. LLM ANALYTICS ───────────────────────────────────────────── */}
      <BetterStackSection
        id="llm-analytics"
        tag="🤖  LLM Observability"
        tagColor="text-emerald-600 dark:text-[#00E599]"
        title="LLM Analytics"
        description="Comprehensive insight into foundation model usage, token velocity, inference latency, and per-user cost allocation."
        exploreText="Explore LLM Analytics"
        exploreHref="#llm-analytics"
      >
        <AiModelsUsedCard />
        <NoOfTokensCard />
        <CostsPerUserCard />
      </BetterStackSection>

      {/* ─── 3. UNIT ECONOMICS (INCLUDES REVENUE ANALYTICS) ─────────────── */}
      <div id="revenue-analytics" className="scroll-mt-20" />
      <BetterStackSection
        id="unit-economics"
        tag="📈  Unit Economics & Revenue"
        tagColor="text-amber-500"
        title="Unit Economics"
        description="Quantify true profitability: Per User Revenue minus Per User AI Cost. Track Stripe/Paddle revenue streams, customer LTV, gross margins, and payback periods."
        exploreText="Explore Unit Economics"
        exploreHref="#unit-economics"
      >
        <PerUserProfitCard />
        <PaymentsSubscriptionsCard />
        <PerUserRevenueCard />
        <KpiScorecardCard />
        <ProfitMarginsCard />
      </BetterStackSection>

      {/* ─── 4. ERRORS & PERFORMANCE ────────────────────────────────────── */}
      <BetterStackSection
        id="errors-performance"
        tag="⚡  Errors & Performance"
        tagColor="text-red-400"
        title="Errors and Performance"
        description="Trace uncaught exceptions, upstream LLM timeouts, and API latency percentiles with instant root-cause grouping and synthetic uptime."
        exploreText="Explore Errors & Performance"
        exploreHref="#errors-performance"
      >
        <ErrorTrackingCard />
        <LatencyPerformanceCard />
        <SystemReliabilityCard />
      </BetterStackSection>

      {/* ─── 5. EXPERIMENTS & ASK AI (WITH MCP TERMINAL) ────────────────── */}
      <BetterStackSection
        id="experiments"
        tag="🧪  Continuous Experimentation & AI"
        tagColor="text-purple-400"
        title="Experiments & Flags"
        description="Deploy features with progressive rollout flags, conduct statistically rigorous A/B tests, and query live observability via the interactive MCP Terminal."
        exploreText="Explore Experiments"
        exploreHref="#experiments"
      >
        <AbTestsCard />
        <FeatureFlagsCard />
        <McpTerminalCard />
      </BetterStackSection>
    </div>
  );
}
