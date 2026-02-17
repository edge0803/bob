import mixpanel from "mixpanel-browser";

let isInitialized = false;

// Mixpanel 초기화
export const initMixpanel = () => {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  
  try {
    mixpanel.init('ab5d5f7b775fa04418cd064ce81e97fe', {
      autocapture: true,
      record_sessions_percent: 100,
      debug: process.env.NODE_ENV === 'development',
      ignore_dnt: true,
    });
    isInitialized = true;
  } catch (error) {
    console.error('Mixpanel init error:', error);
  }
};

// 이벤트 트래킹 헬퍼 함수들
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) {
    initMixpanel();
  }
  
  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('Mixpanel track error:', error);
  }
};

// 주요 이벤트들
export const MixpanelEvents = {
  // 홈
  PAGE_VIEW_HOME: 'page_view_home',
  SELECT_TIME: 'select_time',
  SELECT_MENU: 'select_menu',
  
  // 플레이어
  PAGE_VIEW_PLAYER: 'page_view_player',
  VIDEO_PLAY_START: 'video_play_start',
  VIDEO_PLAY_PAUSE: 'video_play_pause',
  VIDEO_PLAY_END: 'video_play_end',
  CLICK_FINISH_MEAL: 'click_finish_meal',
  CLICK_OTHER_VIDEO: 'click_other_video',
  
  // 영수증
  PAGE_VIEW_RECEIPT: 'page_view_receipt',
  CLICK_WATCH_AGAIN: 'click_watch_again',
  
  // 히스토리
  PAGE_VIEW_HISTORY: 'page_view_history',
  CLICK_RECEIPT_CARD: 'click_receipt_card',
};

export default mixpanel;
