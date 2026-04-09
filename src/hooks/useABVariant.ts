"use client";

import { useEffect, useState } from "react";
import { AB_VARIANT_KEY, type Variant, type InputType } from "@/lib/experiment";
import { trackEvent, MixpanelEvents } from "@/lib/mixpanel";

interface ABVariantResult {
  variant: Variant;
  inputType: InputType;
}

const chooseRandomVariant = (): Variant => (Math.random() < 0.5 ? "A" : "B");

export const useABVariant = (): ABVariantResult => {
  const [variant, setVariant] = useState<Variant>("A");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(AB_VARIANT_KEY) as Variant | null;
    if (saved === "A" || saved === "B") {
      setVariant(saved);
      return;
    }

    const assigned = chooseRandomVariant();
    window.localStorage.setItem(AB_VARIANT_KEY, assigned);
    setVariant(assigned);

    trackEvent(MixpanelEvents.AB_VARIANT_ASSIGNED, {
      variant: assigned,
    });
  }, []);

  const inputType: InputType = variant === "A" ? "select" : "sentence";

  return { variant, inputType };
};

