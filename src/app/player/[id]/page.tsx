"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import videosData from "../../../../data/videos.json";
import { trackEvent, MixpanelEvents } from "@/lib/mixpanel";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationMinutes: number;
  time: string;
  mood: string;
  url: string;
  channel: string;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
}

const moodLabels: Record<string, string> = {
  chef: "셰프 추천",
  trending: "오늘의 특선",
  info: "영양 만점",
  funny: "꿀잼 소스",
};

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialVideoId = params.id as string;
  const time = searchParams.get("time");
  const mood = searchParams.get("mood");

  const [video, setVideo] = useState<Video | null>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [allWatched, setAllWatched] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 영상 데이터 찾기 및 watched 기록
  useEffect(() => {
    const foundVideo = videosData.videos.find((v) => v.id === initialVideoId);
    if (foundVideo) {
      setVideo(foundVideo);
      setStartTime(new Date().toISOString());
      
      // 페이지 뷰 트래킹
      trackEvent(MixpanelEvents.PAGE_VIEW_PLAYER, {
        video_id: foundVideo.id,
        video_title: foundVideo.title,
        channel: foundVideo.channel,
        time: time,
        mood: mood,
      });
      
      // watched 기록 업데이트
      const saved = localStorage.getItem("bobfriend-watched-videos");
      const watched = saved ? JSON.parse(saved) : [];
      if (!watched.includes(initialVideoId)) {
        watched.push(initialVideoId);
        localStorage.setItem("bobfriend-watched-videos", JSON.stringify(watched));
      }
    }
  }, [initialVideoId, time, mood]);

  // 영수증 페이지로 이동하는 함수
  const goToReceipt = useCallback(() => {
    if (!video) return;

    const endTime = new Date().toISOString();

    // 시청 기록 저장
    const watchRecord = {
      ...video,
      watchedAt: endTime,
      startTime: startTime,
      endTime: endTime,
      selectedTime: time || video.time,
      selectedMood: mood || video.mood,
    };

    // 기존 기록 불러오기
    const existingRecords = localStorage.getItem("bobfriend-watch-history");
    const records = existingRecords ? JSON.parse(existingRecords) : [];
    records.push(watchRecord);
    localStorage.setItem("bobfriend-watch-history", JSON.stringify(records));

    // 최근 시청 정보 저장 (영수증 페이지용)
    localStorage.setItem("bobfriend-last-watched", JSON.stringify(watchRecord));

    // 첫 사용일 기록
    const firstUse = localStorage.getItem("bobfriend-first-use");
    if (!firstUse) {
      localStorage.setItem("bobfriend-first-use", new Date().toISOString());
    }

    // 영수증 페이지로 이동
    router.push("/receipt");
  }, [video, time, mood, router, startTime]);

  // 카운트다운 시작
  const startCountdown = useCallback(() => {
    setCountdown(3);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          goToReceipt();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [goToReceipt]);

  // 컴포넌트 언마운트 시 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (!video) return;

    // 이미 API가 로드되어 있는지 확인
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // API 스크립트 로드
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video]);

  // 플레이어 초기화
  useEffect(() => {
    if (!isAPIReady || !video || playerRef.current) return;

    playerRef.current = new window.YT.Player("youtube-player", {
      videoId: video.id,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          console.log("player_ready", video.id);
        },
        onStateChange: (event) => {
          const currentTime = event.target.getCurrentTime();
          
          switch (event.data) {
            case 1: // 재생 시작
              console.log("play_started", video.id, currentTime);
              trackEvent(MixpanelEvents.VIDEO_PLAY_START, {
                video_id: video.id,
                video_title: video.title,
                current_time: currentTime,
              });
              break;
            case 2: // 일시정지
              console.log("play_paused", video.id, currentTime);
              trackEvent(MixpanelEvents.VIDEO_PLAY_PAUSE, {
                video_id: video.id,
                video_title: video.title,
                current_time: currentTime,
              });
              break;
            case 0: // 영상 종료
              console.log("play_ended", video.id, currentTime);
              trackEvent(MixpanelEvents.VIDEO_PLAY_END, {
                video_id: video.id,
                video_title: video.title,
                current_time: currentTime,
              });
              startCountdown();
              break;
          }
        },
      },
    });
  }, [isAPIReady, video, startCountdown]);

  // 다른 영상 보기
  const handleNextVideo = () => {
    if (!time || !mood) return;

    // 다른 영상 보기 트래킹
    trackEvent(MixpanelEvents.CLICK_OTHER_VIDEO, {
      current_video_id: video?.id,
      current_video_title: video?.title,
      time: time,
      mood: mood,
    });

    // 카운트다운 취소
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      setCountdown(null);
    }

    // 현재 영상을 watched에 추가
    const saved = localStorage.getItem("bobfriend-watched-videos");
    const watched = saved ? JSON.parse(saved) : [];
    if (video && !watched.includes(video.id)) {
      watched.push(video.id);
      localStorage.setItem("bobfriend-watched-videos", JSON.stringify(watched));
    }

    // 해당 조건에 맞는 영상 필터링
    const allMatching = videosData.videos.filter(
      (v) => v.time === time && v.mood === mood
    );
    
    // 이미 본 영상 제외
    const available = allMatching.filter((v) => !watched.includes(v.id));
    
    if (available.length === 0) {
      setAllWatched(true);
      return;
    }
    
    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * available.length);
    const nextVideo = available[randomIndex];

    // 새 영상으로 이동
    router.push(`/player/${nextVideo.id}?time=${time}&mood=${mood}`);
  };

  // 수동으로 식사 끝
  const handleFinishMeal = () => {
    // 식사 끝 버튼 트래킹
    trackEvent(MixpanelEvents.CLICK_FINISH_MEAL, {
      video_id: video?.id,
      video_title: video?.title,
      time: time,
      mood: mood,
    });

    // 카운트다운 취소
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    goToReceipt();
  };

  if (!video) {
    return (
      <div className="app-container min-h-screen flex items-center justify-center">
        <p className="text-gray-500">영상을 찾을 수 없어요</p>
      </div>
    );
  }

  // 셰프 추천인지 확인
  const isChefRecommend = mood === "chef";

  return (
    <div className="app-container min-h-screen flex flex-col bg-white">
      {/* 상단 헤더 */}
      <header className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <Link href="/" className="text-2xl">
          ←
        </Link>
        <h1 className="flex-1 font-semibold text-gray-900 text-sm truncate">
          {video.title}
        </h1>
      </header>

      {/* 플레이어 영역 */}
      <div className="w-full aspect-video bg-black">
        <div id="youtube-player" className="w-full h-full" ref={playerContainerRef} />
      </div>

      {/* 영상 정보 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">{video.channel}</p>
        <p className="text-sm text-gray-500 mt-1">{video.duration}</p>
        <div className="flex gap-2 mt-3">
          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
            {time || video.time}분
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
            {moodLabels[mood || video.mood]}
          </span>
        </div>
      </div>

      {/* 카운트다운 메시지 */}
      {countdown !== null && (
        <div className="px-4 py-6 text-center bg-[#F5F5F5]">
          <p className="text-gray-700 font-medium">{countdown}초 후 영수증이 나와요...</p>
        </div>
      )}

      {/* 다 봤을 때 메시지 */}
      {allWatched && (
        <div className="px-4 py-6 text-center">
          <p className="text-gray-600">다 봤어요! 새 영상이 올 때까지 기다려주세요 🍚</p>
        </div>
      )}

      {/* 여백 */}
      <div className="flex-1" />

      {/* 하단 고정 버튼 */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        {/* 식사 끝 버튼 */}
        <button
          onClick={handleFinishMeal}
          className="w-full bg-[#A8C459] text-white font-semibold py-3 rounded-full text-sm mb-3"
        >
          🍚 식사 끝!
        </button>
        
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 bg-white border-2 border-black text-black font-semibold py-3 rounded-full text-center text-sm"
          >
            홈으로
          </Link>
          {!isChefRecommend && !allWatched && (
            <button
              onClick={handleNextVideo}
              className="flex-1 bg-black text-white font-semibold py-3 rounded-full text-sm"
            >
              다른 영상 보기
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
