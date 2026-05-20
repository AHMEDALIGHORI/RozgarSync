import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get('workerId');
  const gigCategory = searchParams.get('category');

  // Baseline standard Sehat Sahulat-style micro-insurance premium
  let weeklyPremium = 50; 
  let coverageLimit = 50000;

  // Adjust risk factors based on category
  const highRiskCategories = ['electrical', 'ac_repair', 'moving', 'carpentry'];
  if (gigCategory && highRiskCategories.includes(gigCategory)) {
    weeklyPremium = 75; 
    coverageLimit = 100000;
  }

  return NextResponse.json({
    provider: 'Sehat Sahulat Micro',
    premium: {
      amount: weeklyPremium,
      currency: 'PKR',
      interval: 'weekly'
    },
    coverage: {
      limit: coverageLimit,
      currency: 'PKR',
      includes: ['Accidental Injury', 'OPD Consultations', 'Emergency Room']
    },
    isEligible: true,
    optInUrl: `/wallet/insurance/opt-in?workerId=${workerId || 'anon'}`
  });
}
