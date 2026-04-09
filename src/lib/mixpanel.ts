import mixpanel from "mixpanel-browser";

let isInitialized = false;

// Mixpanel 초기화
export const initMixpanel = () => {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  
  try {
    mixpanel.init('ab5d5f7b775fa04418cd064ce81e97fe', {
      autocapture: false,
      record_sessions_percent: 100,
      debug: true,
      ignore_dnt: true,
      persistence: 'localStorage',
    });
    isInitialized = true;
    console.log('[Mixpanel] Initialized successfully');
  } catch (error) {
    console.error('[Mixpanel] Init error:', error);
  }
};

// 이벤트 트래킹 헬퍼 함수들
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) {
    initMixpanel();
  }
  
  try {
    console.log('[Mixpanel] Tracking event:', eventName, properties);
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('[Mixpanel] Track error:', error);
  }
};

// 이벤트 전송 후 콜백 실행 (페이지 이동 전 사용)
export const trackEventWithCallback = (
  eventName: string, 
  properties?: Record<string, unknown>
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (!isInitialized) {
      initMixpanel();
    }
    
    try {
      console.log('[Mixpanel] Tracking event with callback:', eventName, properties);
      
      // mixpanel.track(event, properties, callback) 형식 사용
      mixpanel.track(eventName, properties, () => {
        console.log('[Mixpanel] Event sent:', eventName);
      });
      
      // 이벤트 전송 시간 확보 (500ms 대기)
      setTimeout(() => {
        console.log('[Mixpanel] Timeout reached, proceeding:', eventName);
        resolve();
      }, 500);
    } catch (error) {
      console.error('[Mixpanel] Track error:', error);
      resolve();
    }
  });
};

// 주요 이벤트들
export const MixpanelEvents = {
  // 세션
  SESSION_START: 'Session Start',
  SESSION_END: 'Session End',

  // A 버전
  SELECTION_COMPLETED: 'Selection Completed',

  // B 버전
  QUESTIONS_ANSWERED: 'Questions Answered',
  FREE_INPUT_SUBMITTED: 'Free Input Submitted',

  // 공통 추천/재생
  VIDEO_RECOMMENDED: 'Video Recommended',
  VIDEO_CARD_ACTION: 'Video Card Action',

  // 홈 (기존)
  PAGE_VIEW_HOME: 'page_view_home',
  SELECT_TIME: 'select_time',
  SELECT_MENU: 'select_menu',
  LANDING_VIEW: 'landing_view',
  AB_VARIANT_ASSIGNED: 'ab_variant_assigned',
  DURATION_SELECTED: 'duration_selected',
  SENTENCE_OPTION_SELECTED: 'sentence_option_selected',
  CATEGORY_SELECTED: 'category_selected',
  
  // 플레이어
  PAGE_VIEW_PLAYER: 'page_view_player',
  VIDEO_PLAY_START: 'video_play_start',
  VIDEO_PLAY_PAUSE: 'video_play_pause',
  VIDEO_PLAY_END: 'video_play_end',
  VIDEO_COMPLETE: 'video_complete',
  RECOMMENDATION_VIEW: 'recommendation_view',
  PLAY_CLICK: 'play_click',
  RETRY_CLICK: 'retry_click',
  CLICK_HEART: 'click_heart',
  CLICK_FINISH_MEAL: 'click_finish_meal',
  CLICK_OTHER_VIDEO: 'click_other_video',
  
  // 영수증
  PAGE_VIEW_RECEIPT: 'page_view_receipt',
  CLICK_WATCH_AGAIN: 'click_watch_again',
  
  // 히스토리
  PAGE_VIEW_HISTORY: 'page_view_history',
  CLICK_RECEIPT_CARD: 'click_receipt_card',

  // 피드백
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
};

export default mixpanel;
