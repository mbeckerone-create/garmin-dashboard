export type DailyStat = {
  statDate: string;
  steps: number;
  stepGoal: number;
  totalDistanceMi: number;
  activeMinutes: number;
  activeCalories: number;
  floors: number;
  restingHr: number;
  minHr: number;
  maxHr: number;
  intensityMinutes: number;
  moderateMinutes: number;
  vigorousMinutes: number;
  sleepMinutes?: number;
  hrvMs?: number;
  stressAvg?: number;
  syncedAt: string;
};

export type ActivitySegment = {
  id: string;
  order?: number;
  type: "run" | "walk" | "transition" | "ride" | "other";
  label: string;
  distanceMi: number;
  durationSeconds: number;
  avgPaceSecPerMi?: number;
  avgHr?: number;
  startedAt?: string;
};

export type Activity = {
  id: string;
  type: "run" | "walk" | "multisport" | "ride" | "other";
  title: string;
  startedAt: string;
  distanceMi: number;
  durationSeconds: number;
  avgHr?: number;
  avgPaceSecPerMi?: number;
  segments: ActivitySegment[];
};
