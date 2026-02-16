"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

export default function ReceiptPage() {
  const [record, setRecord] = useState<WatchRecord | null>(null);
  const [daysSinceStart, setDaysSinceStart] = useState(1);

  useEffect(() => {
    // 최근 시청 기록 불러오기
    const lastWatched = localStorage.getItem("bobfriend-last-watched");
    if (lastWatched) {
      setRecord(JSON.parse(lastWatched));
    }

    // 첫 사용일 계산
    const firstUse = localStorage.getItem("bobfriend-first-use");
    if (!firstUse) {
      localStorage.setItem("bobfriend-first-use", new Date().toISOString());
      setDaysSinceStart(1);
    } else {
      const firstDate = new Date(firstUse);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysSinceStart(diffDays || 1);
    }
  }, []);

  if (!record) {
    return (
      <div className="app-container min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-4xl mb-4">🧾</p>
          <p className="text-gray-600">영수증 정보가 없어요</p>
          <Link href="/" className="text-blue-500 underline mt-4 block">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const watchDate = new Date(record.watchedAt);
  const formattedDate = watchDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const formattedTime = watchDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="app-container min-h-screen bg-gray-100 py-8 px-4">
      {/* 영수증 카드 */}
      <div className="receipt relative bg-white rounded-lg p-6 mx-auto max-w-sm">
        {/* 상단 타이틀 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">🧾 오늘의 식사 영수증</h1>
          <p className="text-sm text-gray-500">BOB-FRIEND</p>
        </div>

        {/* 구분선 */}
        <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

        {/* 날짜, 시간 */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">{formattedDate}</p>
          <p className="text-lg font-semibold text-gray-800">{formattedTime}</p>
          {record.startTime && record.endTime && (
            <div className="mt-2 text-xs text-gray-400">
              <p>시작: {new Date(record.startTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
              <p>종료: {new Date(record.endTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

        {/* 영상 정보 */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 mb-3 tracking-wider">주문 내역</h2>
          
          {/* 썸네일 */}
          <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-gray-200">
            <Image
              src={record.thumbnail}
              alt={record.title}
              fill
              className="object-cover"
              unoptimized
            />
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {record.duration}
            </span>
          </div>

          {/* 제목 및 채널 */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
            {record.title}
          </h3>
          <p className="text-xs text-gray-500">{record.channel}</p>
        </div>

        {/* 구분선 */}
        <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

        {/* 선택한 조건 */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 mb-3 tracking-wider">주문 옵션</h2>
          <div className="flex gap-2">
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              ⏱️ {record.selectedTime}분
            </span>
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              🍽️ {moodLabels[record.selectedMood]}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

        {/* 하단 메시지 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">
            🎉 밥친구와 함께한 지 <span className="font-bold text-[#4A7C59]">{daysSinceStart}일째</span>
          </p>
          <p className="text-xs text-gray-400">맛있는 식사 되셨나요?</p>
        </div>

        {/* 바코드 느낌 */}
        <div className="mt-6 flex justify-center gap-[2px]">
          {[2,1,2,1,1,2,1,2,2,1,1,2,1,1,2,2,1,2,1,1,2,1,2,1,1,2,2,1,1,2].map((w, i) => (
            <div
              key={i}
              className="bg-gray-800"
              style={{
                width: `${w}px`,
                height: "30px",
              }}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2 font-mono">
          #{record.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* 하단 버튼들 */}
      <div className="mt-6 max-w-sm mx-auto space-y-3">
        <Link
          href={`/player/${record.id}?time=${record.selectedTime}&mood=${record.selectedMood}`}
          className="block w-full bg-black text-white font-semibold py-4 rounded-full text-center"
        >
          다시 보기
        </Link>
        <Link
          href="/"
          className="block w-full bg-[#6B9B5E] text-white font-semibold py-4 rounded-full text-center"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/history"
          className="block w-full text-center text-sm text-gray-500 underline underline-offset-2 mt-2"
        >
          지난 영수증 모아보기
        </Link>
      </div>
    </div>
  );
}
