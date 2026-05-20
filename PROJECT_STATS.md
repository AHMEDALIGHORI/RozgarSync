# RozgarSync Project Statistics

## File Tree
```text
src/app/api/course-recommend/route.ts
src/app/api/insurance-quote/route.ts
src/app/api/market-rate/route.ts
src/app/api/negotiate/route.ts
src/app/api/safety-check/route.ts
src/app/globals.css
src/app/layout.tsx
src/app/[locale]/dashboard/layout.tsx
src/app/[locale]/dashboard/page.tsx
src/app/[locale]/demo/page.tsx
src/app/[locale]/gigs/[id]/page.tsx
src/app/[locale]/layout.tsx
src/app/[locale]/onboarding/page.tsx
src/app/[locale]/page.tsx
src/app/[locale]/profile/page.tsx
src/app/[locale]/safety/page.tsx
src/app/[locale]/skills/page.tsx
src/app/[locale]/splash/page.tsx
src/app/[locale]/wallet/page.tsx
src/components/dashboard/StatCard.tsx
src/components/layout/Footer.tsx
src/components/layout/Header.tsx
src/components/layout/LocaleSwitcher.tsx
src/components/layout/Sidebar.tsx
src/components/map/MapView.tsx
src/components/services/ServiceCard.tsx
src/components/ui/AgentTraceViewer.tsx
src/components/ui/Badge.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/index.ts
src/components/ui/Input.tsx
src/components/ui/LoadingSpinner.tsx
src/components/ui/PulseBadge.tsx
src/i18n/i18n.ts
src/i18n/navigation.ts
src/i18n/request.ts
src/lib/agents/core/base-agent.ts
src/lib/agents/core/circuit-breaker.ts
src/lib/agents/core/confidence.ts
src/lib/agents/core/event-bus.ts
src/lib/agents/core/index.ts
src/lib/agents/core/types.ts
src/lib/agents/fair-wage-negotiator/index.ts
src/lib/agents/fair-wage-negotiator/market-rates.ts
src/lib/agents/fair-wage-negotiator/negotiation-engine.ts
src/lib/agents/financial-protector/eobi-tracker.ts
src/lib/agents/financial-protector/escrow-engine.ts
src/lib/agents/financial-protector/fraud-detector.ts
src/lib/agents/financial-protector/index.ts
src/lib/agents/index.ts
src/lib/agents/opportunity-matcher/index.ts
src/lib/agents/opportunity-matcher/scoring.ts
src/lib/agents/opportunity-matcher/tools.ts
src/lib/agents/safety-guardian/index.ts
src/lib/agents/safety-guardian/risk-engine.ts
src/lib/agents/safety-guardian/sos-protocol.ts
src/lib/agents/upskilling-coach/course-engine.ts
src/lib/agents/upskilling-coach/index.ts
src/lib/data/mock-gigs.ts
src/lib/firebase/auth.ts
src/lib/firebase/config.ts
src/lib/firebase/firestore.ts
src/lib/firebase/index.ts
src/lib/providers/AgentProvider.tsx
src/lib/providers/AuthProvider.tsx
src/lib/providers/Providers.tsx
src/lib/utils/cn.ts
src/lib/utils/constants.ts
src/lib/utils/index.ts
src/messages/en.json
src/messages/ur.json
src/middleware.ts
src/types/index.ts
```

## Line Counts

| File | Lines |
|---|---|
| `src/app/api/course-recommend/route.ts` | 48 |
| `src/app/api/insurance-quote/route.ts` | 35 |
| `src/app/api/market-rate/route.ts` | 85 |
| `src/app/api/negotiate/route.ts` | 66 |
| `src/app/api/safety-check/route.ts` | 43 |
| `src/app/globals.css` | 231 |
| `src/app/layout.tsx` | 39 |
| `src/app/[locale]/dashboard/layout.tsx` | 28 |
| `src/app/[locale]/dashboard/page.tsx` | 126 |
| `src/app/[locale]/demo/page.tsx` | 200 |
| `src/app/[locale]/gigs/[id]/page.tsx` | 168 |
| `src/app/[locale]/layout.tsx` | 106 |
| `src/app/[locale]/onboarding/page.tsx` | 204 |
| `src/app/[locale]/page.tsx` | 422 |
| `src/app/[locale]/profile/page.tsx` | 62 |
| `src/app/[locale]/safety/page.tsx` | 130 |
| `src/app/[locale]/skills/page.tsx` | 100 |
| `src/app/[locale]/splash/page.tsx` | 93 |
| `src/app/[locale]/wallet/page.tsx` | 119 |
| `src/components/dashboard/StatCard.tsx` | 101 |
| `src/components/layout/Footer.tsx` | 95 |
| `src/components/layout/Header.tsx` | 186 |
| `src/components/layout/LocaleSwitcher.tsx` | 90 |
| `src/components/layout/Sidebar.tsx` | 169 |
| `src/components/map/MapView.tsx` | 163 |
| `src/components/services/ServiceCard.tsx` | 118 |
| `src/components/ui/AgentTraceViewer.tsx` | 172 |
| `src/components/ui/Badge.tsx` | 61 |
| `src/components/ui/Button.tsx` | 79 |
| `src/components/ui/Card.tsx` | 65 |
| `src/components/ui/index.ts` | 6 |
| `src/components/ui/Input.tsx` | 78 |
| `src/components/ui/LoadingSpinner.tsx` | 62 |
| `src/components/ui/PulseBadge.tsx` | 82 |
| `src/i18n/i18n.ts` | 22 |
| `src/i18n/navigation.ts` | 9 |
| `src/i18n/request.ts` | 17 |
| `src/lib/agents/core/base-agent.ts` | 677 |
| `src/lib/agents/core/circuit-breaker.ts` | 359 |
| `src/lib/agents/core/confidence.ts` | 369 |
| `src/lib/agents/core/event-bus.ts` | 473 |
| `src/lib/agents/core/index.ts` | 75 |
| `src/lib/agents/core/types.ts` | 488 |
| `src/lib/agents/fair-wage-negotiator/index.ts` | 1203 |
| `src/lib/agents/fair-wage-negotiator/market-rates.ts` | 643 |
| `src/lib/agents/fair-wage-negotiator/negotiation-engine.ts` | 625 |
| `src/lib/agents/financial-protector/eobi-tracker.ts` | 262 |
| `src/lib/agents/financial-protector/escrow-engine.ts` | 174 |
| `src/lib/agents/financial-protector/fraud-detector.ts` | 178 |
| `src/lib/agents/financial-protector/index.ts` | 403 |
| `src/lib/agents/index.ts` | 16 |
| `src/lib/agents/opportunity-matcher/index.ts` | 840 |
| `src/lib/agents/opportunity-matcher/scoring.ts` | 475 |
| `src/lib/agents/opportunity-matcher/tools.ts` | 335 |
| `src/lib/agents/safety-guardian/index.ts` | 442 |
| `src/lib/agents/safety-guardian/risk-engine.ts` | 294 |
| `src/lib/agents/safety-guardian/sos-protocol.ts` | 241 |
| `src/lib/agents/upskilling-coach/course-engine.ts` | 258 |
| `src/lib/agents/upskilling-coach/index.ts` | 263 |
| `src/lib/data/mock-gigs.ts` | 630 |
| `src/lib/firebase/auth.ts` | 97 |
| `src/lib/firebase/config.ts` | 69 |
| `src/lib/firebase/firestore.ts` | 170 |
| `src/lib/firebase/index.ts` | 29 |
| `src/lib/providers/AgentProvider.tsx` | 81 |
| `src/lib/providers/AuthProvider.tsx` | 91 |
| `src/lib/providers/Providers.tsx` | 29 |
| `src/lib/utils/cn.ts` | 15 |
| `src/lib/utils/constants.ts` | 76 |
| `src/lib/utils/index.ts` | 22 |
| `src/messages/en.json` | 162 |
| `src/messages/ur.json` | 162 |
| `src/middleware.ts` | 18 |
| `src/types/index.ts` | 711 |

**Total Lines of Code (src/ directory):** 15335
