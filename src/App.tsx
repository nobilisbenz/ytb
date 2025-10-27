import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const playerRef = useRef<any>(null);

  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleGo = () => {
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      setIsPlaying(true);
    } else {
      alert('Invalid YouTube URL');
    }
  };

  useEffect(() => {
    if (!isPlaying || !videoId) return;

    const loadYouTubeAPI = () => {
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    };

    loadYouTubeAPI();

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: videoId,
          events: {
            'onReady': (event: any) => {
              console.log('Player ready');
            }
          }
        });
      }
    };

    if ((window as any).YT) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }
  }, [isPlaying, videoId]);

  const handleSetStart = () => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const time = Math.floor(playerRef.current.getCurrentTime());
      setStartTime(time);
      console.log('Start time set:', time);
    } else {
      console.error('Player not ready');
      alert('Player not ready. Please wait a moment.');
    }
  };

  const copyToClipboard = async (text: string) => {
    // Try multiple methods for maximum compatibility
    
    // Method 1: Tauri API (if available)
    try {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
      return true;
    } catch (e) {
      console.log('Tauri clipboard not available:', e);
    }

    // Method 2: Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.log('Clipboard API failed:', e);
      }
    }

    // Method 3: Fallback using textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        return true;
      }
    } catch (e) {
      console.log('execCommand failed:', e);
    }

    return false;
  };

  const handleSetEnd = async () => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const time = Math.floor(playerRef.current.getCurrentTime());
      setEndTime(time);
      
      const embedCode = `<iframe src="https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${time}" height="360" width="95%" seamless="seamless" frameborder="0" allowfullscreen></iframe>`;
      
      console.log('Embed code:', embedCode);
      
      const success = await copyToClipboard(embedCode);
      
      if (success) {
        alert(`Copied! Start: ${startTime}s, End: ${time}s`);
      } else {
        alert('Failed to copy. Code: ' + embedCode);
      }
    } else {
      console.error('Player not ready');
      alert('Player not ready. Please wait a moment.');
    }
  };

  return (
    <div className="app">
      {!isPlaying ? (
        <div className="home-screen">
          <input
            type="text"
            className="url-input"
            placeholder="Paste YouTube URL here"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGo()}
          />
          <button className="go-button" onClick={handleGo}>
            GO
          </button>
        </div>
      ) : (
        <div className="player-screen">
          <div className="video-container">
            <div id="youtube-player"></div>
          </div>
          
          <div className="controls">
            <button className="time-btn" onClick={handleSetStart}>
              Start: {startTime}s
            </button>
            <button className="time-btn" onClick={handleSetEnd}>
              End & Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
