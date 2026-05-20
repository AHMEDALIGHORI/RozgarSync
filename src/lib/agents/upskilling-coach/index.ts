// @ts-nocheck
import { BaseAgent } from '../core/base-agent';
import { AgentContext, AgentDecision, AgentAction, AgentEventBus, AgentEventType } from '../core/types';
import { generateId } from '../core/types';
import { analyzeSkillGaps, createSkillGapAnalysisTool, SkillGapAnalysis } from './course-engine';
import type { ServiceCategory, SkillProfile } from '@/types';

export interface UpskillingCoachConfig {
  minimumSkillGapsThreshold?: number;
}

export class UpskillingCoachAgent extends BaseAgent<UpskillingCoachConfig, SkillGapAnalysis> {
  protected subscribedEvents: AgentEventType[] = [
    'gig.completed',
    'worker.registered'
  ];

  constructor(eventBus: AgentEventBus) {
    super(
      {
        agentId: `upskilling-coach-${generateId().slice(0, 8)}`,
        agentName: 'UpskillingCoach',
        agentVersion: '1.0.0',
        decisionTypes: ['skill_matching'],
        circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 60000, successThreshold: 2 },
      },
      eventBus
    );
    this.registerTool(createSkillGapAnalysisTool());
  }

  async perceive(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<any> {
    const { payload } = ctx.event;
    return {
      category: payload.category || 'other',
      currentSkills: payload.skills || [],
      currentLevel: payload.experienceLevel || 'beginner',
    };
  }

  async deliberate(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<any> {
    // Basic deliberation before tool use
    return {
      needsAnalysis: true,
      perceivedData: ctx.perceivedData
    };
  }

  async toolUse(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<void> {
    const analysisTool = this.getTool('analyze_skill_gaps');
    if (analysisTool) {
      const result = await analysisTool.execute({
        category: ctx.perceivedData.category as ServiceCategory,
        currentSkills: ctx.perceivedData.currentSkills as SkillProfile[],
        currentLevel: ctx.perceivedData.currentLevel as 'beginner' | 'intermediate' | 'expert'
      });
      ctx.toolResults.set('analyze_skill_gaps', result);
    }
  }

  async decide(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<AgentDecision> {
    const analysis = ctx.toolResults.get('analyze_skill_gaps') as SkillGapAnalysis;
    
    if (!analysis) {
      return {
        classification: 'noop',
        confidence: 1,
        reasoning: 'Analysis failed or no data available.',
        requiresHumanReview: false,
        data: {}
      };
    }

    return {
      classification: analysis.gaps.length > 0 ? 'gaps_identified' : 'no_gaps',
      confidence: 0.9,
      reasoning: analysis.rationale,
      requiresHumanReview: false,
      data: analysis
    };
  }

  async act(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const analysis = ctx.decision?.data as SkillGapAnalysis;
    
    if (analysis && analysis.gaps.length > 0 && analysis.recommendedCourses.length > 0) {
      actions.push({
        id: generateId(),
        type: 'recommend_courses',
        targetId: ctx.event.workerId || 'system',
        payload: { courses: analysis.recommendedCourses },
        status: 'pending'
      });
    }
    
    return actions;
  }

  async observe(ctx: AgentContext<UpskillingCoachConfig, SkillGapAnalysis>): Promise<void> {
    const actions = await this.act(ctx);
    if (actions.some(a => a.type === 'recommend_courses')) {
      await this.publishEvent({
        id: generateId(),
        type: 'course.recommended',
        timestamp: new Date().toISOString(),
        sourceAgent: this.metadata.agentId,
        workerId: ctx.event.workerId,
        payload: {
          recommendations: ctx.decision?.data
        }
      });
    }
  }

  shutdown() {}
}

export function createUpskillingCoach(eventBus: AgentEventBus): UpskillingCoachAgent {
  return new UpskillingCoachAgent(eventBus);
}
