import type { Activity, DailyStat } from "../types";

export const sampleDailyStat: DailyStat = {
  statDate: "2026-01-01",
  steps: 4820,
  stepGoal: 8000,
  totalDistanceMi: 2.42,
  activeMinutes: 38.5,
  activeCalories: 210,
  floors: 4,
  restingHr: 62,
  minHr: 68,
  maxHr: 148,
  intensityMinutes: 24,
  moderateMinutes: 14,
  vigorousMinutes: 5,
  syncedAt: new Date().toISOString(),
};

export const sampleActivities: Activity[] = [
  {
    id: "sample-multisport",
    type: "multisport",
    title: "Demo multisport",
    startedAt: "2026-01-01T07:30:00-08:00",
    distanceMi: 1.25,
    durationSeconds: 1020,
    segments: [
      {
        id: "sample-walk",
        type: "walk",
        label: "Walk",
        distanceMi: 0.35,
        durationSeconds: 420,
        avgPaceSecPerMi: 1200,
        avgHr: 92,
        startedAt: "2026-01-01T07:30:00-08:00",
      },
      {
        id: "sample-transition",
        type: "transition",
        label: "Transition",
        distanceMi: 0.05,
        durationSeconds: 90,
        startedAt: "2026-01-01T07:37:00-08:00",
      },
      {
        id: "sample-run",
        type: "run",
        label: "Run",
        distanceMi: 0.85,
        durationSeconds: 510,
        avgPaceSecPerMi: 600,
        avgHr: 138,
        startedAt: "2026-01-01T07:38:30-08:00",
      },
    ],
  },
];
