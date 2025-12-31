import { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { Plus, Settings, Play, Copy, Check } from 'lucide-react';
import logo from '../assets/1cb47d0da4fc1adf26a0817c4a6efe030aeece24.png';

interface Stream {
  id: string;
  key: string;
  isPinned?: boolean;
}

export default function App() {
  const [keyInput, setKeyInput] = useState('');
  const [host, setHost] = useState('apidecodgames.site');
  const [port, setPort] = useState('80');
  const [app, setApp] = useState('hls');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildStreamUrl = (key: string) => {
    const protocol = 'https';
    const portStr = port ? `:${port}` : '';
    console.log('Building stream URL with:', `${protocol}://${host}/${app}/${key}.m3u8`);
    // return `${protocol}://${host}${portStr}/${app}/${key}.m3u8`;
    return `${protocol}://${host}/${app}/${key}.m3u8`;
  };

  const handleAddKey = () => {
    if (keyInput.trim() && streams.length < 10) {
      // Split by comma and process each key
      const keys = keyInput.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      // Get existing stream keys
      const existingKeys = new Set(streams.map(s => s.key));
      
      // Filter out duplicate keys
      const uniqueKeys = keys.filter(key => !existingKeys.has(key));
      
      if (uniqueKeys.length === 0) {
        // All keys are duplicates - could show an error message here
        return;
      }
      
      // Calculate how many streams we can add
      const availableSlots = 10 - streams.length;
      const keysToAdd = uniqueKeys.slice(0, availableSlots);
      
      // Create new streams for each key
      const newStreams: Stream[] = keysToAdd.map((key, index) => ({
        id: `${Date.now()}_${index}`,
        key: key
      }));
      
      setStreams([...streams, ...newStreams]);
      setKeyInput('');
    }
  };

  const handleLoadStreams = () => {
    // Load sample streams with different keys
    const sampleStreams: Stream[] = [
      { id: '1', key: 'drone1' },
      { id: '2', key: 'drone2' },
      { id: '3', key: 'drone3' },
      { id: '4', key: 'drone4' },
      { id: '5', key: 'test1' },
      { id: '6', key: 'test2' },
      { id: '7', key: 'test3' },
      { id: '8', key: 'test4' },
      { id: '9', key: 'stream1' },
      { id: '10', key: 'stream2' },
    ];
    setStreams(sampleStreams);
  };

  const handleRemoveStream = (id: string) => {
    setStreams(streams.filter(s => s.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setStreams(streams.map(s => 
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddKey();
    }
  };

  const handleCopyUrl = async () => {
    const urlFormat = `http://${host}:${port}/${app}/{key}.m3u8`;
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlFormat);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for browsers/contexts where Clipboard API is blocked
        copyToClipboardFallback(urlFormat);
      }
    } catch (err) {
      // If Clipboard API fails, use fallback method
      copyToClipboardFallback(urlFormat);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    // Clean up
    document.body.removeChild(textarea);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-[1920px] mx-auto mb-8">
        {/* Logo/Title */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Decod Live Logo" className="w-[32px] h-[32px]" />
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 rounded-md hover:bg-slate-50 transition-all"
          >
            <Settings size={14} />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-slate-200/60 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Stream Server Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="13.232.150.48"
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Port</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="80"
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">App Path</label>
                <input
                  type="text"
                  value={app}
                  onChange={(e) => setApp(e.target.value)}
                  placeholder="hls"
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100/50 flex items-center justify-between">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Stream URL format:</span> http://{host}:{port}/{app}/&#123;key&#125;.m3u8
              </p>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-xs font-medium transition-all ml-3 whitespace-nowrap"
                title="Copy URL format"
              >
                {copied ? (
                  <>
                    <Check size={13} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-100/50">
              <p className="text-xs text-amber-800 font-medium mb-1">⚠️ Troubleshooting CORS Errors:</p>
              <p className="text-xs text-amber-700">
                If streams show "CORS or Connection Error", your HLS server needs to enable CORS headers. 
                Add <code className="bg-amber-100 px-1 rounded">Access-Control-Allow-Origin: *</code> to your server config.
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Stream Key:
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter stream key (comma-separated for multiple)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-slate-400 transition-all"
            />
            <button
              onClick={handleAddKey}
              disabled={!keyInput.trim() || streams.length >= 10}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md text-white text-xs font-medium whitespace-nowrap transition-all"
            >
              <Plus size={14} />
              Add Stream
            </button>
            <button
              onClick={handleLoadStreams}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white text-xs font-medium whitespace-nowrap transition-all"
            >
              Load All Streams
            </button>
          </div>

          {/* Stream Counter */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
              <span className="text-sm font-medium text-slate-700">
                Active Streams: <span className="text-blue-600">{streams.length}</span>/10
              </span>
            </div>
            {streams.length >= 10 && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-medium border border-amber-100/50">
                Maximum capacity reached
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-[1920px] mx-auto">
        {streams.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-lg border border-slate-200/60">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-4 border border-blue-100/50">
              <Play size={32} className="text-blue-600" />
            </div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No active streams</p>
            <p className="text-sm text-slate-500">Enter a key and click "Add Stream" or click "Load All Streams" to view 10 drone feeds</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {streams
              .sort((a, b) => {
                // Pinned streams first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0;
              })
              .map((stream) => (
                <VideoPlayer
                  key={stream.id}
                  streamKey={stream.key}
                  streamUrl={buildStreamUrl(stream.key)}
                  onRemove={() => handleRemoveStream(stream.id)}
                  onTogglePin={() => handleTogglePin(stream.id)}
                  isPinned={stream.isPinned}
                />
              ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-[1920px] mx-auto mt-8 text-center text-xs text-slate-400">
        <p>Decod Live Streaming App - Premium Drone Feed Platform</p>
      </div>
    </div>
  );
}