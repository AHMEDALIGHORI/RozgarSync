// ============================================================================
// RozgarSync — Market Rate API (Gemini-Powered)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';

const MARKET_RATES: Record<string, Record<string, { min: number; max: number; avg: number; hourly: number }>> = {
  plumber: { Lahore: { min: 1200, max: 3000, avg: 2000, hourly: 250 }, Karachi: { min: 1500, max: 3500, avg: 2400, hourly: 300 }, Islamabad: { min: 1800, max: 4000, avg: 2800, hourly: 350 } },
  electrician: { Lahore: { min: 1000, max: 2800, avg: 1800, hourly: 225 }, Karachi: { min: 1200, max: 3200, avg: 2200, hourly: 275 }, Islamabad: { min: 1500, max: 3500, avg: 2500, hourly: 310 } },
  ac_repair: { Lahore: { min: 1500, max: 4000, avg: 2500, hourly: 310 }, Karachi: { min: 1800, max: 4500, avg: 3000, hourly: 375 }, Islamabad: { min: 2000, max: 5000, avg: 3500, hourly: 440 } },
  painter: { Lahore: { min: 800, max: 2500, avg: 1500, hourly: 190 }, Karachi: { min: 1000, max: 3000, avg: 1800, hourly: 225 }, Islamabad: { min: 1200, max: 3500, avg: 2200, hourly: 275 } },
  driver: { Lahore: { min: 2000, max: 5000, avg: 3500, hourly: 440 }, Karachi: { min: 2500, max: 6000, avg: 4000, hourly: 500 }, Islamabad: { min: 3000, max: 7000, avg: 4500, hourly: 560 } },
  carpenter: { Lahore: { min: 1200, max: 3500, avg: 2200, hourly: 275 }, Karachi: { min: 1500, max: 4000, avg: 2600, hourly: 325 }, Islamabad: { min: 1800, max: 4500, avg: 3000, hourly: 375 } },
  tailor: { Lahore: { min: 500, max: 2000, avg: 1200, hourly: 150 }, Karachi: { min: 600, max: 2500, avg: 1500, hourly: 190 }, Islamabad: { min: 800, max: 3000, avg: 1800, hourly: 225 } },
  cleaner: { Lahore: { min: 800, max: 2000, avg: 1200, hourly: 150 }, Karachi: { min: 1000, max: 2500, avg: 1500, hourly: 190 }, Islamabad: { min: 1200, max: 3000, avg: 1800, hourly: 225 } },
  mechanic: { Lahore: { min: 1500, max: 4000, avg: 2500, hourly: 310 }, Karachi: { min: 1800, max: 4500, avg: 3000, hourly: 375 }, Islamabad: { min: 2000, max: 5000, avg: 3200, hourly: 400 } },
  welder: { Lahore: { min: 1500, max: 3500, avg: 2200, hourly: 275 }, Karachi: { min: 1800, max: 4000, avg: 2800, hourly: 350 }, Islamabad: { min: 2000, max: 4500, avg: 3000, hourly: 375 } },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'plumber';
  const city = searchParams.get('city') || 'Lahore';

  const rates = MARKET_RATES[category]?.[city] || { min: 1000, max: 3000, avg: 2000, hourly: 250 };

  try {
    const aiAnalysis = await generateJSON<{
      analysis: { en: string; ur: string };
      insights: string[];
      demandLevel: string;
      seasonalFactor: string;
      trendDirection: string;
    }>(`Provide market analysis for ${category} services in ${city}, Pakistan.

CURRENT RATES (PKR):
- Minimum: ${rates.min}
- Maximum: ${rates.max}
- Average: ${rates.avg}
- Hourly: ${rates.hourly}

Analyze demand trends, seasonal factors (Eid, monsoon, wedding season), and provide actionable insights.

Respond in JSON:
{
  "analysis": {"en": "<2-3 sentence market analysis>", "ur": "<Urdu translation>"},
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "demandLevel": "<low|moderate|high|very_high>",
  "seasonalFactor": "<description of current seasonal impact>",
  "trendDirection": "<increasing|stable|decreasing>"
}`);

    return NextResponse.json({
      success: true,
      powered_by: 'gemini-2.0-flash',
      category,
      city,
      rates,
      ...aiAnalysis,
    });
  } catch {
    return NextResponse.json({
      success: true,
      powered_by: 'rule-based-fallback',
      category,
      city,
      rates,
      analysis: {
        en: `Market rates for ${category} in ${city} range from PKR ${rates.min} to PKR ${rates.max} with an average of PKR ${rates.avg}.`,
        ur: `${city} میں ${category} کی مارکیٹ ریٹ PKR ${rates.min} سے PKR ${rates.max} تک ہے، اوسط PKR ${rates.avg} ہے۔`,
      },
      insights: ['Rates vary by experience level', 'Urgency commands premium pricing', 'Seasonal demand affects availability'],
      demandLevel: 'moderate',
      seasonalFactor: 'Standard demand period',
      trendDirection: 'stable',
    });
  }
}
