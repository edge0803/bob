"use client";

import { useEffect } from "react";
import { initMixpanel } from "@/lib/mixpanel";

export default function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initMixpanel();
  }, []);

  return <>{children}</>;
}
