// ============================================================================
// RozgarSync — Course Recommendation API (Gemini-Powered)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills = [], rejectedCategories = [], experienceLevel = 'intermediate', city = 'Lahore', category = 'general' } = body;

    try {
      const result = await generateJSON<{
        courses: Array<{
          name: string;
          provider: string;
          duration: string;
          estimatedBoost: string;
          difficulty: string;
          description: { en: string; ur: string };
        }>;
        learningPath: { en: string; ur: string };
        skillGaps: string[];
        estimatedIncomeBoost: number;
        demandTrend: string;
      }>(`You are the UpskillingCoach for RozgarSync. Recommend courses for a ${experienceLevel} ${category} worker in ${city}, Pakistan.

CURRENT SKILLS: ${skills.length > 0 ? skills.join(', ') : 'Basic skills only'}
REJECTED FROM: ${rejectedCategories.length > 0 ? rejectedCategories.join(', ') : 'None'}

Recommend courses available in Pakistan (NAVTTC, PSDF, Coursera, YouTube, local training centers).
Focus on skills that will increase earning potential by 20-40%.

Respond in JSON:
{
  "courses": [
    {"name": "<course name>", "provider": "<NAVTTC|PSDF|Coursera|YouTube|Local>", "duration": "<duration>", "estimatedBoost": "<X%>", "difficulty": "<beginner|intermediate|advanced>", "description": {"en": "<English desc>", "ur": "<Urdu desc>"}}
  ],
  "learningPath": {"en": "<recommended learning path narrative>", "ur": "<Urdu translation>"},
  "skillGaps": ["<gap1>", "<gap2>"],
  "estimatedIncomeBoost": <overall percentage>,
  "demandTrend": "<increasing|stable|decreasing>"
}`);

      return NextResponse.json({ success: true, powered_by: 'gemini-2.0-flash', ...result });
    } catch {
      return NextResponse.json({
        success: true,
        powered_by: 'rule-based-fallback',
        courses: [
          { name: 'Advanced Technical Skills', provider: 'NAVTTC', duration: '3 months', estimatedBoost: '25%', difficulty: 'intermediate', description: { en: 'Comprehensive technical training', ur: 'جامع تکنیکی تربیت' } },
          { name: 'Customer Service Excellence', provider: 'PSDF', duration: '2 weeks', estimatedBoost: '15%', difficulty: 'beginner', description: { en: 'Professional customer service skills', ur: 'پیشہ ورانہ کسٹمر سروس کی مہارتیں' } },
          { name: 'Digital Literacy for Workers', provider: 'Coursera', duration: '4 weeks', estimatedBoost: '20%', difficulty: 'beginner', description: { en: 'Essential digital skills for gig workers', ur: 'گگ ورکرز کے لیے ضروری ڈیجیٹل مہارتیں' } },
        ],
        learningPath: { en: 'Start with basic digital literacy, then advance to specialized technical skills for your category.', ur: 'بنیادی ڈیجیٹل خواندگی سے شروع کریں، پھر اپنے شعبے کی مخصوص تکنیکی مہارتوں کی طرف بڑھیں۔' },
        skillGaps: ['Advanced techniques', 'Digital tools', 'Safety certifications'],
        estimatedIncomeBoost: 25,
        demandTrend: 'increasing',
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Course recommendation failed' }, { status: 500 });
  }
}
