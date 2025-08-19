import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FunnelState, RouteFunnelProps, UseFunnelReturn } from "./type";
import { Funnel, Step } from "./Funnel";

export const useFunnel = <Steps extends string[], State extends Record<string, unknown>>(
  steps: Steps,
): UseFunnelReturn<Steps, State> => {
  const route = useRoute();
  const navigation = useNavigation();

  const step = ((route.params as { step: Steps[number] })?.step as Steps[number]) || steps[0];

  const FunnelComponent = Object.assign(
    ({ children }: RouteFunnelProps<Steps>) => (
      <Funnel<Steps> steps={steps} step={step}>
        {children}
      </Funnel>
    ),
    { Step },
  );

  const setStep = (newStep: Steps[number], newParams?: Record<string, string>) => {
    navigation.setParams({ step: newStep, ...newParams } as any);
  };

  const useWithState = <State extends Record<string, unknown>>(initialState: State) => {
    const [state, setState] = useState<FunnelState<Steps, State>>(() => ({
      ...initialState,
      step,
    }));

    const updateState = (
      next: FunnelState<Steps, State> | ((next: FunnelState<Steps, State>) => FunnelState<Steps, State>),
    ) => {
      let nextState: FunnelState<Steps, State>;
      if (typeof next === "function") {
        nextState = next(state);
      } else {
        nextState = next;
      }
      setState(nextState);
      requestAnimationFrame(() => setStep(nextState.step, nextState.params as Record<string, string>));
    };

    return [FunnelComponent, state, updateState] as const;
  };

  return Object.assign([FunnelComponent, setStep], { useWithState }) as UseFunnelReturn<Steps, State>;
};
