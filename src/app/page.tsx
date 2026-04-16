"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import videosData from "../../data/videos.json";
import { trackEvent, trackEventWithCallback, MixpanelEvents } from "@/lib/mixpanel";
import { saveFreeInput } from "@/lib/firebaseClient";
import { useABVariant } from "@/hooks/useABVariant";

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

const moodOptionsB = [
  { key: "tired", label: "피곤해요", internalMood: "info" },
  { key: "energetic", label: "활기차요", internalMood: "funny" },
  { key: "focused", label: "집중하고 싶어요", internalMood: "info" },
  { key: "other", label: "기타", internalMood: "chef" },
];

export default function Home() {
  const router = useRouter();
  const { variant, inputType: _inputType } = useABVariant();
  
  const [selectedTime, setSelectedTime] = useState<TimeOption>("10");
  const [selectedMood, setSelectedMood] = useState<MoodOption>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

  // A/B 테스트용 추가 상태
  const [recommendedVideo, setRecommendedVideo] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [selectedMoodB, setSelectedMoodB] = useState<string | null>(null); // B 버전 기분
  const [freeInput, setFreeInput] = useState("");
  const [showFreeInput, setShowFreeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // B 버전 채팅 상태
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [chatInput, setChatInput] = useState("");

  // 세션 트래킹용 refs (렌더 불필요)
  const sessionStartTime = useRef<number>(Date.now());
  const freeInputStartTime = useRef<number | null>(null);
  const recommendationCountRef = useRef<number>(0);
  const videosPlayedRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const sessionEndFired = useRef<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("bobfriend-watched-videos");
    if (saved) {
      setWatchedVideos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!variant) return;

    trackEvent(MixpanelEvents.PAGE_VIEW_HOME);
    trackEvent(MixpanelEvents.SESSION_START, {
      variant,
      timestamp: new Date().toISOString(),
    });

    if (variant === "B") {
      initializeChatB();
    }
  }, [variant]);

  // Session End: 페이지 이탈 또는 탭 숨김 시
  useEffect(() => {
    const fireSessionEnd = () => {
      if (sessionEndFired.current) return;
      sessionEndFired.current = true;
      trackEvent(MixpanelEvents.SESSION_END, {
        variant,
        total_duration_ms: Date.now() - sessionStartTime.current,
        videos_recommended: recommendationCountRef.current,
        videos_played: videosPlayedRef.current,
        retry_count: retryCountRef.current,
        abandoned: recommendationCountRef.current > 0 && videosPlayedRef.current === 0,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") fireSessionEnd();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      fireSessionEnd(); // 컴포넌트 언마운트 (플레이어 이동 등)
    };
  }, [variant]);

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

  const handleMenuClick = async (mood: MoodOption) => {
    setSelectedMood(mood);
    
    if (selectedTime && mood) {
      const video = getRandomVideo(selectedTime, mood);
      if (video) {
        // A 버전: 카드 표시
        if (variant === "A") {
          recommendationCountRef.current += 1;
          setRecommendedVideo(video);
          setShowCard(true);
          trackEvent(MixpanelEvents.SELECTION_COMPLETED, {
            variant: "A",
            time_taken_ms: Date.now() - sessionStartTime.current,
            selected_time: selectedTime,
            selected_category: mood,
          });
          trackEvent(MixpanelEvents.VIDEO_RECOMMENDED, {
            variant: "A",
            video_id: video.id,
            recommendation_count: recommendationCountRef.current,
          });
          await trackEventWithCallback(MixpanelEvents.SELECT_MENU, {
            menu: mood,
            selected_time: selectedTime,
            variant: "A",
          });
        } else {
          // B 버전: 아직 구현 안 됨, 일단 기존 로직
          await trackEventWithCallback(MixpanelEvents.SELECT_MENU, {
            menu: mood,
            selected_time: selectedTime,
            variant: "B",
          });
          router.push(`/player/${video.id}?time=${selectedTime}&mood=${mood}`);
        }
      }
    }
  };

  const handleTimeClick = async (timeValue: TimeOption) => {
    setSelectedTime(timeValue);
    // 시간 선택 트래킹
    await trackEventWithCallback(MixpanelEvents.SELECT_TIME, { selected_time: timeValue, variant: variant });
  };

  // B 버전 채팅 초기화
  const initializeChatB = () => {
    setChatMessages([
      {
        type: 'bot',
        content: '안녕하세요! 오늘 어떤 기분이세요?',
        options: moodOptionsB.map(mood => ({ key: mood.key, label: mood.label }))
      }
    ]);
    setCurrentStep(0);
  };

  // B 버전 채팅 옵션 선택 핸들러
  const handleChatOptionSelect = async (optionKey: string) => {
    const currentMessage = chatMessages[chatMessages.length - 1];
    if (!currentMessage || currentMessage.type !== 'bot') return;

    // 사용자 선택 메시지 추가
    const selectedOption = currentMessage.options.find((opt: any) => opt.key === optionKey);
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: selectedOption.label
    }]);

    // 다음 단계로 진행
    setTimeout(() => {
      if (currentStep === 0) {
        // 기분 선택 후 시간 선택
        setSelectedMoodB(optionKey);
        setChatMessages(prev => [...prev, {
          type: 'bot',
          content: '얼마나 시간이 있으세요?',
          options: [
            { key: '10', label: '10분' },
            { key: '20', label: '20분' },
            { key: '30', label: '30분' }
          ]
        }]);
        setCurrentStep(1);
        trackEvent(MixpanelEvents.SENTENCE_OPTION_SELECTED, { mood: optionKey, variant: "B" });
      } else if (currentStep === 1) {
        // 시간 선택 후 자유 입력 여부
        setSelectedTime(optionKey as TimeOption);
        setChatMessages(prev => [...prev, {
          type: 'bot',
          content: '더 자세히 말하고 싶으신가요?',
          options: [
            { key: 'yes', label: '네, 입력하기' },
            { key: 'no', label: '아니오' }
          ]
        }]);
        setCurrentStep(2);
        trackEvent(MixpanelEvents.DURATION_SELECTED, { selected_time: optionKey, variant: "B" });
        trackEvent(MixpanelEvents.QUESTIONS_ANSWERED, {
          variant: "B",
          time_taken_ms: Date.now() - sessionStartTime.current,
          mood: selectedMoodB,
          time: optionKey,
          used_free_input: false,
        });
      } else if (currentStep === 2) {
        // 자유 입력 선택
        if (optionKey === 'yes') {
          freeInputStartTime.current = Date.now();
          setShowFreeInput(true);
          setChatMessages(prev => [...prev, {
            type: 'bot',
            content: '상황을 자유롭게 설명해주세요',
            example: '(예: 점심 먹으면서 가벼운 거)',
            input: true
          }]);
          setCurrentStep(3);
        } else {
          // 바로 추천
          handleRecommendB();
        }
      }
    }, 500); // 채팅 효과를 위한 딜레이
  };

  // B 버전 채팅 입력 제출
  const handleChatInputSubmit = async () => {
    if (!chatInput.trim()) return;

    trackEvent(MixpanelEvents.FREE_INPUT_SUBMITTED, {
      variant: "B",
      input_text: chatInput,
      input_length: chatInput.length,
      time_taken_ms: freeInputStartTime.current
        ? Date.now() - freeInputStartTime.current
        : null,
    });
    saveFreeInput({ input_text: chatInput, mood: selectedMoodB, time: selectedTime });

    setChatMessages(prev => [...prev, {
      type: 'user',
      content: chatInput
    }]);

    setFreeInput(chatInput);
    setChatInput("");

    setTimeout(() => {
      handleRecommendB();
    }, 500);
  };

  const handleRecommendB = async () => {
    if (!selectedMoodB || !selectedTime) return;

    setIsLoading(true);

    let mood = moodOptionsB.find(m => m.key === selectedMoodB)?.internalMood || "chef";

    let video: any = null;
    if (showFreeInput && freeInput.trim()) {
      // Claude API 호출
      try {
        const response = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freeInput, time: selectedTime, mood }),
        });
        const data = await response.json();
        video = data.video;
        setRecommendedVideo(data.video);
      } catch (error) {
        console.error('Claude API error:', error);
        // Fallback to local logic
        video = getRandomVideo(selectedTime, mood);
        setRecommendedVideo(video);
      }
    } else {
      video = getRandomVideo(selectedTime, mood);
      setRecommendedVideo(video);
    }

    recommendationCountRef.current += 1;
    setShowCard(true);
    setIsLoading(false);

    trackEvent(MixpanelEvents.VIDEO_RECOMMENDED, {
      variant: "B",
      video_id: video?.id,
      recommendation_count: recommendationCountRef.current,
    });

    // 채팅에 추천 메시지 추가
    setChatMessages(prev => [...prev, {
      type: 'bot',
      content: '이 영상 어떠세요?',
      video: video
    }]);

    await trackEventWithCallback(MixpanelEvents.RECOMMENDATION_VIEW, { variant: "B", used_free_input: showFreeInput });
  };

  // 공통 핸들러
  const handlePlay = async () => {
    if (recommendedVideo) {
      videosPlayedRef.current += 1;
      trackEvent(MixpanelEvents.VIDEO_CARD_ACTION, {
        variant,
        video_id: recommendedVideo.id,
        action: "play",
        recommendation_count: recommendationCountRef.current,
      });
      await trackEventWithCallback(MixpanelEvents.PLAY_CLICK, { video_id: recommendedVideo.id, variant });
      router.push(`/player/${recommendedVideo.id}?time=${selectedTime}&mood=${selectedMood || selectedMoodB}`);
    }
  };

  const handleRecommendAgain = async () => {
    retryCountRef.current += 1;
    trackEvent(MixpanelEvents.VIDEO_CARD_ACTION, {
      variant,
      video_id: recommendedVideo?.id,
      action: "retry",
      recommendation_count: recommendationCountRef.current,
    });
    if (variant === "A" && selectedTime && selectedMood) {
      const video = getRandomVideo(selectedTime, selectedMood);
      setRecommendedVideo(video);
      await trackEventWithCallback(MixpanelEvents.RETRY_CLICK, { variant: "A" });
    } else if (variant === "B") {
      handleRecommendB();
    }
  };

  // VideoCard 컴포넌트
  const VideoCard = ({ video, onPlay, onRecommendAgain, isLoading }: { video: any; onPlay: () => void; onRecommendAgain: () => void; isLoading: boolean }) => (
    <div className="app-container">
      {/* 상단 초록색 헤더 영역 */}
      <header className="bg-[#A8C459] px-4 sm:px-6 pt-5 sm:pt-6 pb-14 sm:pb-16 text-white relative min-h-[220px] overflow-visible">
        <button
          onClick={() => setShowCard(false)}
          className="absolute top-5 left-4 sm:left-6 text-white hover:opacity-80 transition-opacity z-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* 메인 캐릭터 */}
        <div className="absolute right-4 sm:right-6 bottom-0 translate-y-6 sm:translate-y-8 z-20 w-40 h-50 sm:w-50 sm:h-50">
          <img
            src="/images/main.png"
            alt="밥친구 캐릭터"
            className="w-full h-full object-contain"
          />
        </div>
      </header>

      {/* 영상 카드 섹션 */}
      <section className="bg-white px-4 sm:px-6 py-6 sm:py-8 rounded-t-3xl -mt-6 relative z-10">
        <h2 className="text-[15px] sm:text-[17px] font-bold text-center text-gray-800 mb-4 sm:mb-6">
          추천 영상
        </h2>
        <div className="max-w-sm mx-auto">
          <img src={video.thumbnail} alt={video.title} className="w-full rounded-lg mb-4" />
          <h3 className="font-bold text-lg mb-2">{video.title}</h3>
          <div className="flex gap-2">
            <button 
              onClick={onPlay} 
              className="flex-1 bg-[#A8C459] text-white py-3 rounded-lg font-semibold text-sm"
              disabled={isLoading}
            >
              재생
            </button>
            <button 
              onClick={onRecommendAgain} 
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold text-sm"
              disabled={isLoading}
            >
              다시 추천
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  if (variant === null) {
    return (
      <div className="app-container">
        <header className="bg-[#A8C459] px-4 sm:px-6 pt-6 sm:pt-8 pb-16 sm:pb-20 text-white relative">
          <div className="h-6 w-48 bg-white/30 rounded mb-2 animate-pulse" />
          <div className="h-6 w-64 bg-white/30 rounded mb-3 animate-pulse" />
          <div className="h-4 w-36 bg-white/20 rounded animate-pulse" />
          <div className="absolute right-4 sm:right-6 bottom-0 translate-y-6 sm:translate-y-8 z-20 w-40 h-50 sm:w-50 sm:h-50">
            <img src="/images/main.png" alt="밥친구 캐릭터" className="w-full h-full object-contain" />
          </div>
        </header>
        <section className="bg-white px-4 sm:px-6 py-6 sm:py-8 rounded-t-3xl -mt-6 relative z-10">
          <div className="h-5 w-56 bg-gray-200 rounded mx-auto mb-6 animate-pulse" />
          <div className="flex justify-center gap-3">
            {["10분", "20분", "30분"].map((t) => (
              <div key={t} className="h-10 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </section>
        <section className="bg-[#F5F5F5] px-4 sm:px-5 py-4 sm:py-5">
          <div className="h-4 w-12 bg-gray-300 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (showCard && recommendedVideo) {
    return <VideoCard video={recommendedVideo} onPlay={handlePlay} onRecommendAgain={handleRecommendAgain} isLoading={isLoading} />;
  }

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

      {variant === "A" ? (
        <>
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
        </>
      ) : (
        <>
          {/* B 버전: 채팅 인터페이스 */}
          <section className="bg-white px-0 py-0 rounded-t-3xl -mt-6 relative z-10 flex-1 flex flex-col min-h-[600px]">
            
            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col gap-4">
              <div className="space-y-4">
                {chatMessages.map((message, index) => {
                  const isLastMessage = index === chatMessages.length - 1;
                  return (
                  <div key={index} className={`flex items-end ${message.type === 'bot' ? 'justify-start' : 'justify-end'}`}>
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden mr-2">
                        <img src="/images/main.png" alt="밥친구" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={message.type === 'bot'
                      ? 'max-w-xs lg:max-w-md bg-white text-gray-800 rounded-3xl rounded-bl-xl px-4 py-3 shadow-md border border-gray-200'
                      : 'max-w-xs lg:max-w-md bg-[#E67E50] text-white rounded-full px-5 py-3 shadow-lg'
                    }>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.example && (
                        <p className="text-xs text-gray-500 mt-2 opacity-80">{message.example}</p>
                      )}
                      {message.options && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {message.options.map((option: any) => (
                            <button
                              key={option.key}
                              onClick={() => isLastMessage && handleChatOptionSelect(option.key)}
                              disabled={!isLastMessage}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isLastMessage ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-default'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {message.video && (
                        <div className="mt-3 p-3 bg-white/80 rounded-2xl border border-gray-200">
                          <img src={message.video.thumbnail} alt={message.video.title} className="w-full rounded-xl mb-2" />
                          <h4 className="font-bold text-sm mb-3 text-gray-800">{message.video.title}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={handlePlay}
                              className="flex-1 bg-[#E67E50] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#D46D3F] transition-colors"
                            >
                              재생
                            </button>
                            <button
                              onClick={handleRecommendAgain}
                              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg text-xs font-medium hover:bg-gray-400 transition-colors"
                            >
                              다시 추천
                            </button>
                          </div>
                        </div>
                      )}
                      {message.input && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleChatInputSubmit()}
                            placeholder="입력해주세요..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C459]"
                            autoFocus
                          />
                          <button
                            onClick={handleChatInputSubmit}
                            disabled={!chatInput.trim() || isLoading}
                            className="w-full py-2 bg-[#E67E50] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#D46D3F] transition-colors"
                          >
                            {isLoading ? '보내는 중...' : '보내기'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                {isLoading && (
                  <div className="flex items-end justify-start">
                    <div className="w-8 h-8 bg-[#A8C459] rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold mr-2 text-sm">
                      🤖
                    </div>
                    <div className="bg-white text-gray-800 px-5 py-3 rounded-3xl rounded-bl-xl border border-gray-200 shadow-md">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-[#E67E50] rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-[#E67E50] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2.5 h-2.5 bg-[#E67E50] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

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
