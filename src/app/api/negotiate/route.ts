// ============================================================================
// RozgarSync — Wage Negotiation API (Gemini-Powered)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';

// Fallback market rates
const MARKET_RATES: Record<string, Record<string, { min: number; max: number; avg: number }>> = {
  plumber: { Lahore: { min: 1200, max: 3000, avg: 2000 }, Karachi: { min: 1500, max: 3500, avg: 2400 }, Islamabad: { min: 1800, max: 4000, avg: 2800 } },
  electrician: { Lahore: { min: 1000, max: 2800, avg: 1800 }, Karachi: { min: 1200, max: 3200, avg: 2200 }, Islamabad: { min: 1500, max: 3500, avg: 2500 } },
  ac_repair: { Lahore: { min: 1500, max: 4000, avg: 2500 }, Karachi: { min: 1800, max: 4500, avg: 3000 }, Islamabad: { min: 2000, max: 5000, avg: 3500 } },
  painter: { Lahore: { min: 800, max: 2500, avg: 1500 }, Karachi: { min: 1000, max: 3000, avg: 1800 }, Islamabad: { min: 1200, max: 3500, avg: 2200 } },
  driver: { Lahore: { min: 2000, max: 5000, avg: 3500 }, Karachi: { min: 2500, max: 6000, avg: 4000 }, Islamabad: { min: 3000, max: 7000, avg: 4500 } },
  carpenter: { Lahore: { min: 1200, max: 3500, avg: 2200 }, Karachi: { min: 1500, max: 4000, avg: 2600 }, Islamabad: { min: 1800, max: 4500, avg: 3000 } },
  tailor: { Lahore: { min: 500, max: 2000, avg: 1200 }, Karachi: { min: 600, max: 2500, avg: 1500 }, Islamabad: { min: 800, max: 3000, avg: 1800 } },
  cleaner: { Lahore: { min: 800, max: 2000, avg: 1200 }, Karachi: { min: 1000, max: 2500, avg: 1500 }, Islamabad: { min: 1200, max: 3000, avg: 1800 } },
};

const MINIMUM_WAGE_DAILY = 1200; // PKR

interface NegotiateRequest {
  category: string;
  city: string;
  proposedRate: number;
  rateUnit?: 'hourly' | 'daily' | 'fixed';
  urgency?: string;
  experienceLevel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NegotiateRequest = await request.json();
    const { category, city, proposedRate, rateUnit = 'fixed', urgency = 'medium', experienceLevel = 'intermediate' } = body;

    if (!category || !city || !proposedRate) {
      return NextResponse.json({ error: 'Missing required fields: category, city, proposedRate' }, { status: 400 });
    }

    const marketRate = MARKET_RATES[category]?.[city] || { min: 1000, max: 3000, avg: 2000 };

    try {
      // Real Gemini AI analysis
      const result = await generateJSON<{
        classification: string;
        fairnessScore: number;
        reasoning: { en: string; ur: string };
        counterOffer: number | null;
        deviationPercent: number;
        belowMinimumWage: boolean;
        belowLivingWage: boolean;
        flags: Array<{ severity: string; code: string; message: { en: string; ur: string } }>;
        recommendation: { en: string; ur: string };
      }>(`Analyze this wage proposal for a ${category} gig in ${city}, Pakistan.

PROPOSED RATE: PKR ${proposedRate} (${rateUnit})
EXPERIENCE: ${experienceLevel}
URGENCY: ${urgency}

MARKET DATA for ${category} in ${city}:
- Minimum rate: PKR ${marketRate.min}
- Maximum rate: PKR ${marketRate.max}
- Average rate: PKR ${marketRate.avg}
- Pakistan minimum daily wage: PKR ${MINIMUM_WAGE_DAILY}

Classify as: "fair" (within 10% of avg), "above_market" (>10% above avg), "below_market" (10-40% below avg), or "exploitative" (>40% below avg or below minimum wage).

Respond in JSON:
{
  "classification": "<fair|above_market|below_market|exploitative>",
  "fairnessScore": <0-100>,
  "reasoning": {"en": "<detailed English analysis>", "ur": "<Urdu translation>"},
  "counterOffer": <suggested PKR amount if below market, null if fair/above>,
  "deviationPercent": <percentage deviation from market average>,
  "belowMinimumWage": <boolean>,
  "belowLivingWage": <boolean>,
  "flags": [{"severity": "<low|medium|high|critical>", "code": "<flag_code>", "message": {"en": "<English>", "ur": "<Urdu>"}}],
  "recommendation": {"en": "<actionable advice>", "ur": "<Urdu advice>"}
}`);

      return NextResponse.json({
        success: true,
        powered_by: 'gemini-2.0-flash',
        ...result,
        marketRate,
        proposedRate,
        category,
        city,
      });
    } catch {
      // Fallback: rule-based analysis
      const deviationPercent = Math.round(((proposedRate - marketRate.avg) / marketRate.avg) * 100);
      const belowMinimum = proposedRate < MINIMUM_WAGE_DAILY;
      let classification = 'fair';
      if (belowMinimum || deviationPercent < -40) classification = 'exploitative';
      else if (deviationPercent < -10) classification = 'below_market';
      else if (deviationPercent > 10) classification = 'above_market';

      return NextResponse.json({
        success: true,
        powered_by: 'rule-based-fallback',
        classification,
        fairnessScore: Math.min(100, Math.max(0, 50 + deviationPercent)),
        reasoning: {
          en: `The proposed rate of PKR ${proposedRate} is ${Math.abs(deviationPercent)}% ${deviationPercent >= 0 ? 'above' : 'below'} the market average of PKR ${marketRate.avg} for ${category} in ${city}.`,
          ur: `تجویز کردہ شرح PKR ${proposedRate} مارکیٹ اوسط PKR ${marketRate.avg} سے ${Math.abs(deviationPercent)}% ${deviationPercent >= 0 ? 'اوپر' : 'نیچے'} ہے۔`,
        },
        counterOffer: classification === 'below_market' ? Math.round(marketRate.avg * 0.95) : null,
        deviationPercent,
        belowMinimumWage: belowMinimum,
        belowLivingWage: proposedRate < 1500,
        flags: belowMinimum ? [{ severity: 'critical', code: 'BELOW_MIN_WAGE', message: { en: 'Below legal minimum wage', ur: 'قانونی کم از کم اجرت سے کم' } }] : [],
        marketRate,
        proposedRate,
        category,
        city,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Negotiation analysis failed' }, { status: 500 });
  }
}
