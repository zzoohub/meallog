import { Children, isValidElement, ReactElement, useEffect } from "react";
import { FunnelProps, StepProps } from "./type";

export const Funnel = <Steps extends string[]>({ steps, step, children }: FunnelProps<Steps>) => {
  const validChildren = Children.toArray(children)
    .filter(isValidElement)
    .filter(i => steps.includes((i.props as Partial<StepProps<Steps>>).name ?? "")) as ReactElement<StepProps<Steps>>[];

  const targetStep = validChildren.find(child => child.props.name === step);

  return <>{targetStep}</>;
};

export const Step = <Steps extends string[]>({ onEnter, children }: StepProps<Steps>) => {
  useEffect(() => {
    onEnter?.();
  }, [onEnter]);

  return <>{children}</>;
};
