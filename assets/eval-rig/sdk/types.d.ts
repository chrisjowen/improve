export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface EvaluationContext {
  schema_version: 1;
  project_root: string;
  objective: {
    id: string;
    description: string;
    success_criteria: string[];
  };
  task: { id: string; prompts: string[]; [key: string]: Json };
  changes: {
    base_revision?: string | null;
    head_revision?: string | null;
    patch?: string;
    files: Array<{ path: string; status?: string; [key: string]: Json }>;
  };
  transcript: {
    messages: Json[];
    tool_calls: Json[];
    agent_calls: Json[];
    events: Json[];
    redactions?: Json[];
    truncated?: boolean;
  };
  run: { id: string; attempt: number; [key: string]: Json };
  artifacts: Json[];
  step: { id: string; evaluator: string; metadata: Record<string, Json> };
  metadata: Record<string, Json>;
}

export interface EvaluationEvidence {
  kind: string;
  message: string;
  path?: string;
  line?: number;
  data?: Json;
}

export interface EvaluationResult {
  success: boolean;
  score: number;
  notes: string[];
  metadata?: Record<string, Json>;
  evidence?: EvaluationEvidence[];
  metrics?: Record<string, number>;
}

export type Evaluate = (
  context: EvaluationContext,
) => EvaluationResult | Promise<EvaluationResult>;
