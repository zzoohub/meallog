import { create } from "zustand";

export interface TimePeriod {
  type: "day" | "week" | "month" | "custom";
  startDate?: Date;
  endDate?: Date;
}

export interface PeriodStats {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  water: { current: number; target: number };
  fiber: { current: number; target: number };
  periodType: "day" | "week" | "month" | "custom";
  periodLabel: string;
  metricsType: "total" | "average" | "dailyAverage";
}

export type SortMethod =
  | "date-desc"
  | "date-asc"
  | "calories-desc"
  | "calories-asc"
  | "protein-desc"
  | "protein-asc"
  | "health-score-desc"
  | "health-score-asc"
  | "nutrition-density-desc"
  | "nutrition-density-asc";

export type MetricsDisplayType = "total" | "dailyAverage";

interface AnalyticsState {
  globalPeriod: TimePeriod;
  sortMethod: SortMethod;
  metricsDisplayType: MetricsDisplayType;
}

interface AnalyticsActions {
  setGlobalPeriod: (period: TimePeriod) => void;
  setSortMethod: (method: SortMethod) => void;
  setMetricsDisplayType: (type: MetricsDisplayType) => void;
  getPeriodLabel: (period: TimePeriod) => string;
}

type AnalyticsStore = AnalyticsState & AnalyticsActions;

const initialState: AnalyticsState = {
  globalPeriod: { type: "day" },
  sortMethod: "date-desc",
  metricsDisplayType: "total",
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  ...initialState,

  setGlobalPeriod: (period: TimePeriod) => {
    set({ globalPeriod: period });
  },

  setSortMethod: (method: SortMethod) => {
    set({ sortMethod: method });
  },

  setMetricsDisplayType: (type: MetricsDisplayType) => {
    set({ metricsDisplayType: type });
  },

  getPeriodLabel: (period: TimePeriod): string => {
    const today = new Date();

    switch (period.type) {
      case "day":
        return today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      case "month":
        return today.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "custom":
        if (period.startDate && period.endDate) {
          return `${period.startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${period.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        }
        if (period.startDate) {
          return `From ${period.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        }
        if (period.endDate) {
          return `Until ${period.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        }
        return "Custom Range";
      default:
        return "Today";
    }
  },
}));

// Helper selectors for common use cases
export const selectCurrentPeriodLabel = (state: AnalyticsStore) => 
  state.getPeriodLabel(state.globalPeriod);

export const selectIsCurrentPeriod = (state: AnalyticsStore, period: TimePeriod) => 
  state.globalPeriod.type === period.type &&
  state.globalPeriod.startDate?.getTime() === period.startDate?.getTime() &&
  state.globalPeriod.endDate?.getTime() === period.endDate?.getTime();