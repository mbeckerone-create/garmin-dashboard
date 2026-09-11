import {
  Activity,
  Bike,
  CalendarDays,
  Footprints,
  HeartPulse,
  RefreshCw,
  Route,
  ShieldCheck,
  Timer,
  TrendingUp,
  Watch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { sampleActivities, sampleDailyStat } from "./lib/data";
import type { Activity as FitnessActivity, DailyStat } from "./types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(seconds?: number) {
  if (!seconds) return "n/a";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
}

function activityIcon(type: string) {
  if (type === "ride") return <Bike size={18} />;
  if (type === "walk") return <Footprints size={18} />;
  if (type === "run") return <Activity size={18} />;
  return <Route size={18} />;
}

function mapDailyStat(row: Record<string, unknown>): DailyStat {
  return {
    statDate: String(row.stat_date),
    steps: Number(row.steps ?? 0),
    stepGoal: Number(row.step_goal ?? 7000),
    totalDistanceMi: Number(row.total_distance_mi ?? 0),
    activeMinutes: Number(row.active_minutes ?? 0),
    activeCalories: Number(row.active_calories ?? 0),
    floors: Number(row.floors ?? 0),
    restingHr: Number(row.resting_hr ?? 0),
    minHr: Number(row.min_hr ?? 0),
    maxHr: Number(row.max_hr ?? 0),
    intensityMinutes: Number(row.intensity_minutes ?? 0),
    moderateMinutes: Number(row.moderate_minutes ?? 0),
    vigorousMinutes: Number(row.vigorous_minutes ?? 0),
    sleepMinutes: row.sleep_minutes ? Number(row.sleep_minutes) : undefined,
    hrvMs: row.hrv_ms ? Number(row.hrv_ms) : undefined,
    stressAvg: row.stress_avg ? Number(row.stress_avg) : undefined,
    syncedAt: String(row.synced_at ?? new Date().toISOString()),
  };
}

function mapActivity(row: Record<string, unknown>): FitnessActivity {
  const segments = Array.isArray(row.activity_segments) ? row.activity_segments : [];
  return {
    id: String(row.id),
    type: String(row.activity_type) as FitnessActivity["type"],
    title: String(row.title),
    startedAt: String(row.started_at),
    distanceMi: Number(row.distance_mi ?? 0),
    durationSeconds: Number(row.duration_seconds ?? 0),
    avgHr: row.avg_hr ? Number(row.avg_hr) : undefined,
    avgPaceSecPerMi: row.avg_pace_sec_per_mi ? Number(row.avg_pace_sec_per_mi) : undefined,
    segments: segments
      .map((segment) => {
        const item = segment as Record<string, unknown>;
        return {
          id: String(item.id),
          order: Number(item.segment_order ?? 0),
          type: String(item.segment_type) as FitnessActivity["segments"][number]["type"],
          label: String(item.label),
          distanceMi: Number(item.distance_mi ?? 0),
          durationSeconds: Number(item.duration_seconds ?? 0),
          avgPaceSecPerMi: item.avg_pace_sec_per_mi ? Number(item.avg_pace_sec_per_mi) : undefined,
          avgHr: item.avg_hr ? Number(item.avg_hr) : undefined,
          startedAt: item.started_at ? String(item.started_at) : undefined,
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
}

function ActivityCard({ activity }: { activity: FitnessActivity }) {
  const primarySegments = activity.segments.filter((segment) => segment.type !== "transition");

  return (
    <article className="activity-card">
      <div className="card-topline">
        <div className="icon-chip">{activityIcon(activity.type)}</div>
        <div>
          <h2>{activity.title}</h2>
          <p>{formatTime(activity.startedAt)}</p>
        </div>
        <strong>{activity.distanceMi.toFixed(2)} mi</strong>
      </div>
      <div className="segment-list">
        {activity.segments.map((segment) => (
          <div className="segment" key={segment.id}>
            <div>
              <span>{segment.label}</span>
              <small>{segment.startedAt ? formatTime(segment.startedAt) : "Logged"}</small>
            </div>
            <div>
              <b>{segment.distanceMi.toFixed(2)} mi</b>
              <small>
                {formatDuration(segment.durationSeconds)}
                {segment.avgPaceSecPerMi ? ` · ${formatPace(segment.avgPaceSecPerMi)}` : ""}
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="activity-footer">
        <span>{primarySegments.length} recorded legs</span>
        <span>{activity.avgHr ? `${activity.avgHr} bpm avg` : "HR by leg"}</span>
      </div>
    </article>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

function Dashboard() {
  const [dailyStat, setDailyStat] = useState<DailyStat>(sampleDailyStat);
  const [activities, setActivities] = useState<FitnessActivity[]>(sampleActivities);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);
  const [dataMessage, setDataMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    async function loadFitnessData() {
      setDataMessage("");
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: stats, error: statsError }, { data: activityRows, error: activitiesError }] =
        await Promise.all([
          supabase!
            .from("daily_stats")
            .select("stat_date, steps, step_goal, total_distance_mi, active_minutes, active_calories, floors, resting_hr, min_hr, max_hr, intensity_minutes, moderate_minutes, vigorous_minutes, sleep_minutes, hrv_ms, stress_avg, synced_at")
            .lte("stat_date", today)
            .order("stat_date", { ascending: false })
            .limit(1),
          supabase!
            .from("activities")
            .select("id, activity_type, title, started_at, distance_mi, duration_seconds, avg_pace_sec_per_mi, avg_hr, activity_segments(id, segment_order, segment_type, label, started_at, distance_mi, duration_seconds, avg_pace_sec_per_mi, avg_hr)")
            .lte("activity_date", today)
            .order("started_at", { ascending: false })
            .limit(5),
        ]);

      if (statsError || activitiesError) {
        setDataMessage("Live data is not available yet. Showing the sample dashboard.");
        setIsLoading(false);
        return;
      }

      if (stats?.[0]) setDailyStat(mapDailyStat(stats[0]));
      if (activityRows?.length) setActivities(activityRows.map(mapActivity));
      if (!stats?.[0] && !activityRows?.length) {
        setDataMessage("No Garmin rows found yet. Showing the sample dashboard.");
      }
      setIsLoading(false);
    }

    loadFitnessData();
  }, []);

  const stepPercent = Math.min(100, Math.round((dailyStat.steps / dailyStat.stepGoal) * 100));
  const recordedDistance = useMemo(
    () => activities.reduce((total, activity) => total + activity.distanceMi, 0),
    [activities],
  );
  const displayDate = formatDisplayDate(dailyStat.statDate);

  if (hasSupabaseConfig && isLoading) {
    return (
      <main className="app-shell loading-shell">
        <RefreshCw size={22} />
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{displayDate}</p>
          <h1>Today</h1>
        </div>
        <div className="header-actions">
          <span className={hasSupabaseConfig ? "status live" : "status sample"}>
            {hasSupabaseConfig ? "Live data" : "Sample mode"}
          </span>
        </div>
      </header>

      {dataMessage ? <p className="data-message">{dataMessage}</p> : null}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Recorded activities first</p>
          <h2>{recordedDistance.toFixed(2)} mi</h2>
          <p>Run, walk, and transition legs stay separate from total daily movement.</p>
        </div>
        <div className="watch-face" aria-label={`${stepPercent}% of step goal`}>
          <Watch size={34} />
          <strong>{stepPercent}%</strong>
          <span>steps</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <p className="eyebrow">Activities</p>
            <h2>Recorded Today</h2>
          </div>
          <button className="quiet-button">
            <RefreshCw size={16} />
            Sync
          </button>
        </div>
        <div className="activity-stack">
          {activities.map((activity) => (
            <ActivityCard activity={activity} key={activity.id} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <p className="eyebrow">Daily movement</p>
            <h2>Totals</h2>
          </div>
          <span className="sync-note">Synced {formatTime(dailyStat.syncedAt)}</span>
        </div>
        <div className="steps-card">
          <div>
            <p>Steps</p>
            <strong>{dailyStat.steps.toLocaleString()}</strong>
            <span>{stepPercent}% of {dailyStat.stepGoal.toLocaleString()}</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${stepPercent}%` }} />
          </div>
        </div>
        <div className="metric-grid">
          <MetricCard icon={<Route size={18} />} label="Total miles" value={dailyStat.totalDistanceMi.toFixed(2)} note="all movement" />
          <MetricCard icon={<Timer size={18} />} label="Active min" value={dailyStat.activeMinutes.toFixed(1)} note="today" />
          <MetricCard icon={<TrendingUp size={18} />} label="Calories" value={dailyStat.activeCalories.toString()} note="active" />
          <MetricCard icon={<CalendarDays size={18} />} label="Floors" value={dailyStat.floors.toString()} note="climbed" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <p className="eyebrow">Heart & intensity</p>
            <h2>Body Signals</h2>
          </div>
          <ShieldCheck size={20} className="shield" />
        </div>
        <div className="metric-grid two">
          <MetricCard icon={<HeartPulse size={18} />} label="Resting HR" value={`${dailyStat.restingHr}`} note="bpm" />
          <MetricCard icon={<HeartPulse size={18} />} label="HR range" value={`${dailyStat.minHr}-${dailyStat.maxHr}`} note="bpm" />
          <MetricCard icon={<Activity size={18} />} label="Intensity" value={`${dailyStat.intensityMinutes}`} note="minutes" />
          <MetricCard icon={<Activity size={18} />} label="Moderate/Vig" value={`${dailyStat.moderateMinutes}/${dailyStat.vigorousMinutes}`} note="minutes" />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return <Dashboard />;
}
