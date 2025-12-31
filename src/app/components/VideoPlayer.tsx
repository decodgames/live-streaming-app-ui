import { useState, useEffect, useRef } from 'react';
import { Play, VolumeOff, Volume2, Expand, Circle, Star, AlertCircle, WifiOff, RotateCw } from 'lucide-react';
import Hls from 'hls.js';

type StreamStatus = 'idle' | 'loading' | 'playing' | 'error' | 'buffering';

interface VideoPlayerProps {
  streamKey: string;
  streamUrl: string;
  onRemove: () => void;
  onTogglePin: () => void;
  isPinned?: boolean;
}

export function VideoPlayer({ streamKey, streamUrl, onRemove, onTogglePin, isPinned = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // HLS.js integration
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setStatus('loading');
    setErrorMessage('');
    setTime(0);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('playing');
        video.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn('HLS error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response?.code === 0 || !data.response?.code) {
                setStatus('error');
                setErrorMessage('CORS or Connection Error');
              } else if (data.response?.code === 404) {
                setStatus('error');
                setErrorMessage('Stream Not Found (404)');
              } else {
                setStatus('error');
                setErrorMessage('Network Error');
              }
              // Try to recover
              setTimeout(() => {
                if (hlsRef.current) {
                  hlsRef.current.startLoad();
                }
              }, 3000);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStatus('error');
              setErrorMessage('Media Error');
              hls.recoverMediaError();
              break;
            default:
              setStatus('error');
              setErrorMessage('Stream Error');
              break;
          }
        } else if (data.details === 'bufferStalledError') {
          setStatus('buffering');
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        if (status === 'buffering') {
          setStatus('playing');
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setStatus('playing');
        video.play().catch((err) => console.warn('Autoplay failed:', err));
      });
      video.addEventListener('error', () => {
        setStatus('error');
        setErrorMessage('Failed to load stream');
      });
      video.addEventListener('waiting', () => setStatus('buffering'));
      video.addEventListener('playing', () => setStatus('playing'));
    } else {
      setStatus('error');
      setErrorMessage('HLS not supported in this browser');
    }
  }, [streamUrl, refreshKey]);

  useEffect(() => {
    if (status === 'playing') {
      const interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExpand = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="text-6xl opacity-30 mb-4">📡</div>
            <p className="text-base font-medium text-slate-600">Waiting for stream...</p>
            <p className="mt-1 text-xs text-slate-500">No stream URL configured</p>
          </div>
        );
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="relative mb-4">
              <Circle className="animate-spin text-blue-600" size={48} strokeWidth={3} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-100"></div>
              </div>
            </div>
            <p className="text-base font-medium text-slate-700 animate-pulse">Connecting...</p>
            <p className="mt-1 text-xs text-slate-500">Loading stream</p>
          </div>
        );
      case 'buffering':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <WifiOff size={32} className="text-amber-600 animate-pulse" />
            </div>
            <p className="font-semibold text-amber-700">Buffering...</p>
            <p className="text-xs text-amber-600/70 mt-1">Slow connection</p>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <p className="font-semibold text-red-700">{errorMessage || 'Stream Error'}</p>
            <p className="text-xs text-red-600/70 mt-1">Check stream key and server</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative bg-white rounded-lg overflow-hidden border border-slate-200/60 hover:border-slate-300 transition-all duration-200">
      {/* Pin/Star Button */}
      <button
        onClick={onTogglePin}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-slate-200/50 transition-all duration-200"
      >
        <Star 
          size={14} 
          className={isPinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400 hover:text-amber-500'}
        />
      </button>

      {/* Video Area */}
      <div className="aspect-video relative bg-slate-900 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted={isMuted}
          playsInline
        />
        
        {getStatusDisplay()}

        {/* Live Badge */}
        {status === 'playing' && (
          <div className="absolute top-2.5 left-2.5 bg-red-600/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1 z-10">
            <Circle size={6} className="fill-white animate-pulse" />
            LIVE
          </div>
        )}

        {/* Signal Quality Indicator */}
        {status === 'playing' && (
          <div className="absolute top-2.5 right-12 flex gap-0.5 z-10">
            <div className="w-0.5 h-2.5 bg-white/80 rounded-full"></div>
            <div className="w-0.5 h-3 bg-white/80 rounded-full"></div>
            <div className="w-0.5 h-3.5 bg-white/80 rounded-full"></div>
            <div className="w-0.5 h-4 bg-white/80 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-50/50 backdrop-blur-sm px-3.5 py-2.5 flex items-center justify-between border-t border-slate-200/60">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {status === 'playing' && (
            <button className="p-1 hover:bg-slate-100 rounded-md transition-all">
              <Play size={13} fill="currentColor" className="text-blue-600" />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-600"></div>
            <span className="text-xs font-medium text-slate-600">
              {status === 'playing' ? formatTime(time) : '0:00'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mute Button */}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-all cursor-pointere"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeOff size={15} className="text-slate-500" /> : <Volume2 size={15} className="text-blue-600" />}
          </button>

          {/* Expand Button */}
          <button
            onClick={handleExpand}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
            title="Fullscreen"
          >
            <Expand size={15} className="text-slate-500" />
          </button>

          {/* Record Button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <Circle size={15} className={isRecording ? 'fill-red-600 text-red-600 animate-pulse' : 'text-slate-500'} />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
            title="Refresh Stream"
          >
            <RotateCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Key Name */}
      <div className="bg-white px-3.5 py-2 border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Key:</span>
          <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">{streamKey}</span>
        </div>
      </div>
    </div>
  );
}