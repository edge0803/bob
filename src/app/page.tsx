"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import videosData from "../../data/videos.json";

type TimeOption = "10" | "20" | "30" | null;
type MoodOption = "chef" | "trending" | "info" | "funny" | null;

const menuCards = [
  {
    id: "chef" as const,
    title: "셰프 추천",
    description: "에디터 Pick\n당신의 식탁을 완성할\n깊은 맛의 영상",
    image: "/images/chef.png",
    bgColor: "bg-[#E0EDDF]",
    badge: "Best",
  },
  {
    id: "trending" as const,
    title: "오늘의 특선",
    description: "지금 가장 핫한,\n실시간 인기 메뉴!",
    image: "/images/trending.png",
    bgColor: "bg-[#FDEEE4]",
    badge: null,
  },
  {
    id: "info" as const,
    title: "영양 만점",
    description: "식사하며 채우는\n한 스푼의 지식",
    image: "/images/info.png",
    bgColor: "bg-[#EDE8F5]",
    badge: null,
  },
  {
    id: "funny" as const,
    title: "꿀잼 소스",
    description: "짧고 강렬하게\n즐기는 웃음 한입",
    image: "/images/funny.png",
    bgColor: "bg-[#FCE8EC]",
    badge: null,
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<TimeOption>("20");
  const [selectedMood, setSelectedMood] = useState<MoodOption>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("bobfriend-watched-videos");
    if (saved) {
      setWatchedVideos(JSON.parse(saved));
    }
  }, []);

  const getRandomVideo = (time: string, mood: string) => {
    // 해당 조건에 맞는 영상 필터링
    const allMatching = videosData.videos.filter(
      (v) => v.time === time && v.mood === mood
    );
    
    // 이미 본 영상 제외
    let available = allMatching.filter((v) => !watchedVideos.includes(v.id));
    
    // 전부 봤으면 기록 리셋
    if (available.length === 0 && allMatching.length > 0) {
      localStorage.removeItem("bobfriend-watched-videos");
      setWatchedVideos([]);
      available = allMatching;
    }
    
    if (available.length === 0) return null;
    
    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  };

  const handleMenuClick = (mood: MoodOption) => {
    setSelectedMood(mood);
    
    if (selectedTime && mood) {
      const video = getRandomVideo(selectedTime, mood);
      if (video) {
        router.push(`/player/${video.id}?time=${selectedTime}&mood=${mood}`);
      }
    }
  };

  const handleTimeClick = (time: TimeOption) => {
    setSelectedTime(time);
  };

  return (
    <div className="app-container">
      {/* 상단 초록색 헤더 영역 */}
      <header className="bg-[#A8C459] px-4 sm:px-6 pt-6 sm:pt-8 pb-16 sm:pb-20 text-white relative">
        <h1 className="text-lg sm:text-[22px] font-bold leading-tight mb-0.5 sm:mb-1">
          꼬르륵, 배고프시죠?
        </h1>
        <h1 className="text-lg sm:text-[22px] font-bold leading-tight mb-1.5 sm:mb-2">
          딱 맞는 영상을 서빙해 드릴게요!
        </h1>
        <p className="text-xs sm:text-sm text-white/90 mb-3 sm:mb-4">당신의 완벽한 혼밥 파트너</p>
        <div className="flex items-end">
          <span 
            className="text-[26px] sm:text-[34px] font-black tracking-tight text-[#2D4A22]" 
            style={{ fontFamily: 'Pretendard, sans-serif' }}
          >
            BOB-FRIEND
          </span>
        </div>
        {/* 메인 캐릭터 - 경계 위에 겹치게 배치 */}
        <div className="absolute right-4 sm:right-6 bottom-0 translate-y-6 sm:translate-y-8 z-20 w-40 h-50 sm:w-50 sm:h-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/main.png"
            alt="밥친구 캐릭터"
            className="w-full h-full object-contain"
          />
        </div>
      </header>

      {/* 중간 흰색 영역 - 시간 선택 */}
      <section className="bg-white px-4 sm:px-6 py-6 sm:py-8 rounded-t-3xl -mt-6 relative z-10">
        <h2 className="text-[15px] sm:text-[17px] font-bold text-center text-gray-800 mb-4 sm:mb-6">
          오늘 밥친구와 함께할 시간을 알려주세요!
        </h2>
        <div className="flex justify-center gap-2 sm:gap-3">
          {(["10", "20", "30"] as const).map((time) => (
            <button
              key={time}
              onClick={() => handleTimeClick(time)}
              className={`pill-button px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-[15px] transition-all ${
                selectedTime === time
                  ? "bg-[#3D3D3D] text-white"
                  : "bg-white text-[#3D3D3D] border-2 border-[#3D3D3D]"
              }`}
            >
              {time}분
            </button>
          ))}
        </div>
      </section>

      {/* 하단 MENU 섹션 */}
      <section className="bg-[#F5F5F5] px-4 sm:px-5 py-4 sm:py-5">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-3 sm:mb-4 tracking-wider">MENU</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {menuCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleMenuClick(card.id)}
              className={`menu-card relative ${card.bgColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center ${
                selectedMood === card.id ? "ring-2 sm:ring-3 ring-[#3D3D3D] ring-offset-2" : ""
              }`}
            >
              {card.badge && (
                <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#E85A5A] text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                  {card.badge}
                </span>
              )}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-1.5 sm:mb-2 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-bold text-gray-800 text-sm sm:text-[15px] mb-1 sm:mb-1.5">{card.title}</h4>
              <p className="text-[10px] sm:text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 지난 영수증 보기 버튼 */}
      <div className="bg-[#F5F5F5] px-4 sm:px-5 pt-5 pb-10">
        <Link
          href="/history"
          className="block w-full h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center text-[15px] font-bold text-black"
        >
          지난 영수증 모아보기
        </Link>
      </div>
    </div>
  );
}
