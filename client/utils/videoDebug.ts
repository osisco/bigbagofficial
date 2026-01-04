// Video debugging utilities
export const logVideoState = (rollId: string, state: {
  isActive: boolean;
  hasValidVideo: boolean;
  videoUrl: string;
  isPlaying: boolean;
  isVideoLoaded: boolean;
  hasError: boolean;
}) => {
  console.log(`🎥 Video Debug [${rollId}]:`, {
    isActive: state.isActive,
    hasValidVideo: state.hasValidVideo,
    videoUrl: state.videoUrl ? `${state.videoUrl.substring(0, 50)}...` : 'EMPTY',
    isPlaying: state.isPlaying,
    isVideoLoaded: state.isVideoLoaded,
    hasError: state.hasError,
  });
};

export const validateVideoUrl = (url: string): boolean => {
  if (!url || url.trim().length === 0) {
    console.warn('❌ Video URL is empty');
    return false;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('❌ Video URL is not a valid HTTP/HTTPS URL:', url);
    return false;
  }
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  if (!hasVideoExtension) {
    console.warn('⚠️ Video URL does not contain common video extensions:', url);
  }
  
  console.log('✅ Video URL appears valid:', url.substring(0, 50) + '...');
  return true;
};

export const logPlayerEvent = (rollId: string, event: string, data?: any) => {
  console.log(`🎬 Player Event [${rollId}] ${event}:`, data);
};