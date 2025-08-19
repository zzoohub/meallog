import { ReactElement, ReactNode } from "react";

export interface FunnelProps<Steps extends string[]> {
  steps: Steps;
  step: Steps[number];
  children: ReactElement<StepProps<Steps>>[];
}

export interface StepProps<Steps extends string[]> {
  name: Steps[number];
  onEnter?: () => void;
  children: ReactNode;
}

export type RouteFunnelProps<Steps extends string[]> = Omit<FunnelProps<Steps>, "steps" | "step">;
export type FunnelComponent<Steps extends string[]> = ((props: RouteFunnelProps<Steps>) => ReactNode) & {
  Step: (props: StepProps<Steps>) => ReactNode;
};

export type FunnelSetState<Steps extends string[], State extends Record<string, unknown>> = (
  state: FunnelState<Steps, State> | ((next: FunnelState<Steps, State>) => FunnelState<Steps, State>),
) => void;
export type FunnelState<Steps extends string[], State extends Record<string, unknown>> = State & {
  step: Steps[number];
  searchParams?: Record<string, string>;
};

export type UseFunnelReturn<Steps extends string[], State extends Record<string, unknown>> = [
  FunnelComponent<Steps>,
  (step: Steps[number]) => void,
] & {
  useWithState: (initialState: State) => [FunnelComponent<Steps>, FunnelState<Steps, State>, FunnelSetState<Steps, State>];
};
