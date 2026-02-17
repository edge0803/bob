"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent, MixpanelEvents } from "@/lib/mixpanel";

interface WatchRecord {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  watchedAt: string;
  startTime?: string;
  endTime?: string;
  selectedTime: string;
  selectedMood: string;
}

const moodLabels: Record<string, string> = {
  chef: "셰프 추천",
  trending: "오늘의 특선",
  info: "영양 만점",
  funny: "꿀잼 소스",
};

export default function HistoryPage() {
  const [records, setRecords] = useState<WatchRecord[]>([]);
  const [daysSinceStart, setDaysSinceStart] = useState(1);

  useEffect(() => {
    // 시청 기록 불러오기
    const history = localStorage.getItem("bobfriend-watch-history");
    if (history) {
      const parsed = JSON.parse(history) as WatchRecord[];
      // 최신순 정렬
      setRecords([...parsed].reverse());
    }

    // 첫 사용일 계산
    const firstUse = localStorage.getItem("bobfriend-first-use");
    if (firstUse) {
      const firstDate = new Date(firstUse);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysSinceStart(diffDays || 1);
    }

    // 페이지 뷰 트래킹
    trackEvent(MixpanelEvents.PAGE_VIEW_HISTORY);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReceiptClick = (record: WatchRecord) => {
    // 영수증 카드 클릭 트래킹
    trackEvent(MixpanelEvents.CLICK_RECEIPT_CARD, {
      video_id: record.id,
      video_title: record.title,
    });
    // 해당 영수증을 last-watched에 저장하고 영수증 페이지로 이동
    localStorage.setItem("bobfriend-last-watched", JSON.stringify(record));
  };

  return (
    <div className="app-container min-h-screen bg-[#F5F5F5]">
      {/* 상단 헤더 */}
      <header className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl">←</Link>
          <h1 className="text-lg font-bold text-gray-800">지난 영수증</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-9">
          밥친구와 함께한 지 <span className="font-semibold text-[#6B9B5E]">{daysSinceStart}일째</span> 🍚
        </p>
      </header>

      {/* 영수증 목록 */}
      <main className="px-4 py-4">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🥺</p>
            <p className="text-gray-600 font-medium mb-2">아직 같이 밥 먹은 적이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">영상을 보면 영수증이 생겨요!</p>
            <Link
              href="/"
              className="inline-block bg-[#6B9B5E] text-white font-semibold px-8 py-3 rounded-full"
            >
              밥 먹으러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => (
              <Link
                key={`${record.id}-${index}`}
                href="/receipt"
                onClick={() => handleReceiptClick(record)}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  {/* 썸네일 */}
                  <div className="w-20 h-[45px] rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={record.thumbnail}
                      alt={record.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {record.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(record.watchedAt)} {formatTime(record.watchedAt)}
                    </p>
                    <div className="flex gap-1 mt-2">
                      <span className="bg-[#E8F5E8] text-[#4A7C59] text-[10px] px-2 py-0.5 rounded-full">
                        {record.selectedTime}분
                      </span>
                      <span className="bg-[#E8F5E8] text-[#4A7C59] text-[10px] px-2 py-0.5 rounded-full">
                        {moodLabels[record.selectedMood]}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 하단 여백 */}
      <div className="h-8"></div>
    </div>
  );
}
