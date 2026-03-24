"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logFirebaseEventSafe, initFirebaseAnalytics } from "@/lib/firebaseClient";

export default function FirebaseAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // 초기화만 선행 (페이지 이동 시마다 init을 반복하지 않게 내부에서 캐시함)
    initFirebaseAnalytics();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // SPA 라우팅용 page_view
    logFirebaseEventSafe("page_view", {
      page_path: pathname,
      page_location: window.location.href,
    });
  }, [pathname]);

  return <>{children}</>;
}

