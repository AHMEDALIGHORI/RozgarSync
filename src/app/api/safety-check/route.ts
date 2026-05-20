// ============================================================================
// RozgarSync — Safety Check API (Gemini-Powered)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gigId, location, timeOfDay, category, employerVerified, city, description } = body;

    try {
      const result = await generateJSON<{
        riskLevel: string;
        riskScore: number;
        assessment: { en: string; ur: string };
        recommendations: string[];
        factors: Array<{ factor: string; severity: string; detail: string }>;
        requiresVerification: boolean;
        emergencyProtocol: string;
      }>(`You are the SafetyGuardian agent for RozgarSync. Assess safety risks for this gig in Pakistan.

GIG: ${category || 'general'} service in ${city || location || 'Pakistan'}
TIME: ${timeOfDay || 'daytime'}
EMPLOYER VERIFIED: ${employerVerified ? 'Yes' : 'No'}
DESCRIPTION: ${description || 'Standard service request'}

PAKISTAN SAFETY CONTEXT:
- Emergency: Police 15, Rescue 1122, Edhi 115
- Consider: area safety, time of day, category risk, employer verification
- Categories with physical risk: electrician, construction, driver
- Late night gigs (10PM-6AM) are higher risk

Respond in JSON:
{
  "riskLevel": "<low|medium|high|critical>",
  "riskScore": <0-100>,
  "assessment": {"en": "<detailed safety assessment>", "ur": "<Urdu translation>"},
  "recommendations": ["<safety recommendation 1>", "<recommendation 2>"],
  "factors": [{"factor": "<name>", "severity": "<low|medium|high>", "detail": "<explanation>"}],
  "requiresVerification": <boolean>,
  "emergencyProtocol": "<none|standby|active>"
}`);

      return NextResponse.json({ success: true, powered_by: 'gemini-2.0-flash', gigId, ...result });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        powered_by: 'rule-based-fallback',
        gigId,
        riskLevel: 'medium',
        riskScore: 35,
        assessment: {
          en: `Safety assessment for ${category || 'general'} service in ${city || 'Pakistan'}. Standard precautions recommended.`,
          ur: `${city || 'پاکستان'} میں ${category || 'عمومی'} سروس کی حفاظتی تشخیص۔ معیاری احتیاطی تدابیر کی سفارش کی جاتی ہے۔`,
        },
        recommendations: ['Verify employer identity', 'Share live location with emergency contact', 'Confirm payment in escrow before starting'],
        factors: [{ factor: 'category_risk', severity: 'medium', detail: 'Standard risk category' }],
        requiresVerification: !employerVerified,
        emergencyProtocol: 'standby',
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Safety check failed' }, { status: 500 });
  }
}
