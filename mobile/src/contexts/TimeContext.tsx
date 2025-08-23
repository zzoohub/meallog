import React, { createContext, useContext, useState, ReactNode } from "react";

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

interface TimeContextType {
  globalPeriod: TimePeriod;
  setGlobalPeriod: (period: TimePeriod) => void;
  sortMethod: SortMethod;
  setSortMethod: (method: SortMethod) => void;
  metricsDisplayType: MetricsDisplayType;
  setMetricsDisplayType: (type: MetricsDisplayType) => void;
  getPeriodLabel: (period: TimePeriod) => string;
}

export const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [globalPeriod, setGlobalPeriod] = useState<TimePeriod>({ type: "day" });
  const [sortMethod, setSortMethod] = useState<SortMethod>("date-desc");
  const [metricsDisplayType, setMetricsDisplayType] = useState<MetricsDisplayType>("total");

  const getPeriodLabel = (period: TimePeriod): string => {
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
  };

  const contextValue: TimeContextType = {
    globalPeriod,
    setGlobalPeriod,
    sortMethod,
    setSortMethod,
    metricsDisplayType,
    setMetricsDisplayType,
    getPeriodLabel,
  };

  return <TimeContext.Provider value={contextValue}>{children}</TimeContext.Provider>;
}

export function useTimeContext(): TimeContextType {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error("useTimeContext must be used within a TimeProvider");
  }
  return context;
}
