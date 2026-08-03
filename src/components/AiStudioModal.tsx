import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Video,
  Image as ImageIcon,
  Music,
  Search,
  MessageSquare,
  BrainCircuit,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Download,
  Loader2,
  Check,
  Send,
  Play,
  Film,
  ExternalLink,
  Flame,
  Wand2
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  syncUserProfile,
  saveFirestoreCreation,
  fetchFirestoreCreations,
  User
} from '../lib/firebase';
import { SupportedLanguage } from '../types';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export function AiStudioModal({ isOpen, onClose, currentLang, onShowToast }: AiStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'veo' | 'thinking' | 'image' | 'music' | 'creations'>('chat');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hello! I am Omni AI Studio Assistant. How can I help you generate media, download video formats, or compose soundtracks today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ text: string; sources?: any[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Veo Video Generation State
  const [veoPrompt, setVeoPrompt] = useState('A futuristic glowing neon cyber city with sleek flying cars under rain at night');
  const [veoAspect, setVeoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [veoLoading, setVeoLoading] = useState(false);
  const [veoResult, setVeoResult] = useState<string | null>(null);

  // Thinking State
  const [thinkingQuery, setThinkingQuery] = useState('Explain how modern video codecs (H.264 vs AV1) compress 4K video streams with maximum visual quality.');
  const [thinkingMode, setThinkingMode] = useState<'high-thinking' | 'low-latency'>('high-thinking');
  const [thinkingResult, setThinkingResult] = useState<string | null>(null);
  const [thinkingLoading, setThinkingLoading] = useState(false);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('Cyberpunk neon YouTube thumbnail poster with bold glowing title text 4K ultra detailed');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);

  // Music Generation State
  const [musicPrompt, setMusicPrompt] = useState('Upbeat synthwave video background track with driving bass and melodic lead');
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicResult, setMusicResult] = useState<string | null>(null);

  // Saved Creations
  const [creations, setCreations] = useState<any[]>([]);
  const [creationsLoading, setCreationsLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        await syncUserProfile(currentUser);
        loadUserCreations(currentUser.uid);
      }
    });
    return () => unsub();
  }, []);

  const loadUserCreations = async (uid: string) => {
    setCreationsLoading(true);
    const data = await fetchFirestoreCreations(uid);
    setCreations(data);
    setCreationsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncUserProfile(res.user);
        onShowToast(`Welcome, ${res.user.displayName || 'User'}! Connected with Firebase Auth.`);
        loadUserCreations(res.user.uid);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      onShowToast('Firebase Login failed: ' + (err.message || 'Error logging in'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setCreations([]);
    onShowToast('Signed out of Firebase Account');
  };

  // Chat Submission
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          messages: newHistory.slice(-6),
          systemInstruction: 'You are Omni AI Studio Assistant, expert in video downloading, video editing, codec optimization, and media creation.'
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setChatMessages([...newHistory, { role: 'assistant', text: data.text }]);
      } else {
        setChatMessages([...newHistory, { role: 'assistant', text: data.error || 'Failed to get reply.' }]);
      }
    } catch (e) {
      setChatMessages([...newHistory, { role: 'assistant', text: 'Network error connecting to Gemini Chat service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Search Grounding Submission
  const handleSearchGrounding = async () => {
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults({ text: data.text, sources: data.sources });
      } else {
        onShowToast('Search failed: ' + (data.error || 'Unable to fetch results'));
      }
    } catch (e) {
      onShowToast('Network error during Google Search grounding');
    } finally {
      setSearchLoading(false);
    }
  };

  // Veo Video Generation
  const handleGenerateVeo = async () => {
    if (!veoPrompt.trim() || veoLoading) return;
    setVeoLoading(true);
    setVeoResult(null);
    try {
      const res = await fetch('/api/veo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: veoPrompt, aspectRatio: veoAspect })
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setVeoResult(data.videoUrl);
        onShowToast('Veo 3 Video generated successfully!');
        if (user) {
          await saveFirestoreCreation(user.uid, {
            type: 'video',
            prompt: veoPrompt,
            url: data.videoUrl
          });
          loadUserCreations(user.uid);
        }
      } else {
        onShowToast('Veo Video generation error: ' + (data.error || 'Failed'));
      }
    } catch (e) {
      onShowToast('Veo Video generation failed');
    } finally {
      setVeoLoading(false);
    }
  };

  // Thinking Mode Submission
  const handleThinkingQuery = async () => {
    if (!thinkingQuery.trim() || thinkingLoading) return;
    setThinkingLoading(true);
    setThinkingResult(null);
    try {
      const res = await fetch('/api/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: thinkingQuery, mode: thinkingMode })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setThinkingResult(data.text);
      } else {
        onShowToast('Thinking query error: ' + (data.error || 'Failed'));
      }
    } catch (e) {
      onShowToast('Error executing thinking query');
    } finally {
      setThinkingLoading(false);
    }
  };

  // Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);
    setImageResult(null);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setImageResult(data.imageUrl);
        onShowToast('AI Image generated!');
        if (user) {
          await saveFirestoreCreation(user.uid, {
            type: 'image',
            prompt: imagePrompt,
            url: data.imageUrl
          });
          loadUserCreations(user.uid);
        }
      } else {
        onShowToast('Image generation failed: ' + (data.error || 'Error'));
      }
    } catch (e) {
      onShowToast('Image generation failed');
    } finally {
      setImageLoading(false);
    }
  };

  // Music Generation
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    setMusicResult(null);
    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: musicPrompt, duration: 15 })
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        setMusicResult(data.audioUrl);
        onShowToast('Lyria 3 Music clip generated!');
        if (user) {
          await saveFirestoreCreation(user.uid, {
            type: 'music',
            prompt: musicPrompt,
            url: data.audioUrl
          });
          loadUserCreations(user.uid);
        }
      } else {
        onShowToast('Music generation failed: ' + (data.error || 'Error'));
      }
    } catch (e) {
      onShowToast('Music generation network error');
    } finally {
      setMusicLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Omni AI Studio & Creator Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30 uppercase">
                  Powered by Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Veo 3 Video, Imagen 3, Lyria Music, Search Grounding & Firebase Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Account / Auth Button */}
            {authLoading ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-6 h-6 rounded-full border border-indigo-400" />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                )}
                <span className="font-semibold text-slate-200 hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
                <button onClick={handleSignOut} className="p-1 hover:text-red-400 text-slate-400 transition-colors" title="Sign Out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}

            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Search Grounding</span>
          </button>

          <button
            onClick={() => setActiveTab('veo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'veo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-4 h-4 text-pink-400" />
            <span>Veo 3 Video AI</span>
          </button>

          <button
            onClick={() => setActiveTab('thinking')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'thinking'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>Thinking / Fast AI</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>AI Thumbnails</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'music'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Music className="w-4 h-4 text-cyan-400" />
            <span>Lyria Music</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('creations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'creations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Saved Assets ({creations.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CHATBOT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full justify-between space-y-4">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-md shadow-indigo-600/20'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is thinking...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask Gemini AI for download advice, codecs, video summaries or suggestions..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-center gap-3">
                <Search className="w-5 h-5 text-emerald-400 shrink-0" />
                <p>
                  Search Grounding uses <strong>gemini-3.5-flash</strong> with live Google Search data to discover up-to-date viral clips, social media trends, or video details!
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                  placeholder="e.g. Latest viral TikTok dances 2026, top YouTube tech video links..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSearchGrounding}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Ground Search</span>
                </button>
              </div>

              {searchResults && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Live Grounded Results
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {searchResults.text}
                  </p>

                  {searchResults.sources && searchResults.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400">Google Search Sources:</div>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.sources.map((src: any, i: number) => (
                          <a
                            key={i}
                            href={src.web?.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-1 transition-colors"
                          >
                            <span>{src.web?.title || 'Web Link'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VEO 3 VIDEO GENERATOR */}
          {activeTab === 'veo' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-800/40 text-xs text-pink-200 flex items-center gap-3">
                <Video className="w-5 h-5 text-pink-400 shrink-0" />
                <p>
                  Generate cinematic AI videos using model <strong>veo-3.1-fast-generate-preview</strong> in 16:9 landscape or 9:16 portrait format!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Video Prompt</label>
                  <textarea
                    rows={3}
                    value={veoPrompt}
                    onChange={(e) => setVeoPrompt(e.target.value)}
                    placeholder="Describe the motion, lighting, subject, and style..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Aspect Ratio</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setVeoAspect('16:9')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        veoAspect === '16:9'
                          ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      <span>16:9 Landscape (YouTube/Desktop)</span>
                    </button>
                    <button
                      onClick={() => setVeoAspect('9:16')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        veoAspect === '9:16'
                          ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Film className="w-4 h-4 rotate-90" />
                      <span>9:16 Portrait (TikTok/Reels/Shorts)</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateVeo}
                  disabled={veoLoading || !veoPrompt.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all disabled:opacity-50"
                >
                  {veoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering Veo 3 AI Video Clip...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Veo 3 Video</span>
                    </>
                  )}
                </button>
              </div>

              {veoResult && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-pink-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Generated Veo 3 Video Ready
                  </h3>
                  <div className="relative rounded-xl overflow-hidden bg-black max-w-lg mx-auto border border-slate-800">
                    <video src={veoResult} controls autoPlay loop className="w-full h-auto max-h-[380px] object-contain" />
                  </div>
                  <div className="flex justify-center pt-2">
                    <a
                      href={veoResult}
                      download="veo3_ai_video.mp4"
                      className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download AI Video</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THINKING & LOW LATENCY MODE */}
          {activeTab === 'thinking' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-purple-400 shrink-0" />
                <p>
                  Toggle between <strong>gemini-3.1-pro-preview</strong> (Thinking Level: HIGH) for deep architectural analysis and <strong>gemini-3.1-flash-lite</strong> for instant low-latency queries!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Query Mode</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setThinkingMode('high-thinking')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        thinkingMode === 'high-thinking'
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <BrainCircuit className="w-4 h-4 text-amber-400" />
                      <span>High Thinking (gemini-3.1-pro-preview)</span>
                    </button>
                    <button
                      onClick={() => setThinkingMode('low-latency')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        thinkingMode === 'low-latency'
                          ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-cyan-300 animate-bounce" />
                      <span>Low Latency (gemini-3.1-flash-lite)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Technical Query</label>
                  <textarea
                    rows={3}
                    value={thinkingQuery}
                    onChange={(e) => setThinkingQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={handleThinkingQuery}
                  disabled={thinkingLoading || !thinkingQuery.trim()}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {thinkingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  <span>Execute Query ({thinkingMode})</span>
                </button>
              </div>

              {thinkingResult && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Response ({thinkingMode})
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {thinkingResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI THUMBNAIL / IMAGE CREATOR */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
                <p>
                  Create high-resolution YouTube thumbnails, video poster covers, and social graphics with <strong>gemini-3.1-flash-image-preview</strong>!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Image Prompt</label>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={imageLoading || !imagePrompt.trim()}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>Generate AI Image / Thumbnail</span>
                </button>
              </div>

              {imageResult && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Generated AI Image
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-w-md mx-auto">
                    <img src={imageResult} alt="Generated AI Thumbnail" className="w-full h-auto object-cover" />
                  </div>
                  <div className="flex justify-center pt-2">
                    <a
                      href={imageResult}
                      download="ai_generated_thumbnail.jpg"
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Image</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LYRIA MUSIC GENERATION */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-center gap-3">
                <Music className="w-5 h-5 text-cyan-400 shrink-0" />
                <p>
                  Generate custom background music & soundtrack audio clips for your videos using model <strong>lyria-3-clip-preview</strong>!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Music / Sound Style Prompt</label>
                  <textarea
                    rows={3}
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleGenerateMusic}
                  disabled={musicLoading || !musicPrompt.trim()}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {musicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  <span>Generate Lyria 3 Music Clip</span>
                </button>
              </div>

              {musicResult && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Generated Audio Soundtrack
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <audio src={musicResult} controls className="w-full" />
                  </div>
                  <div className="flex justify-center pt-2">
                    <a
                      href={musicResult}
                      download="lyria_soundtrack.ogg"
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Audio Track</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SAVED CREATIONS IN FIRESTORE */}
          {activeTab === 'creations' && user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Your Firebase Firestore Saved AI Assets
                </h3>
                <span className="text-xs text-slate-400">{creations.length} item(s)</span>
              </div>

              {creationsLoading ? (
                <div className="py-12 flex justify-center text-indigo-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : creations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No saved creations yet. Generate videos with Veo 3, thumbnails, or soundtracks to save them automatically!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {creations.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.type}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{item.prompt}</p>

                      {item.type === 'image' && item.url && (
                        <img src={item.url} alt="Creation" className="w-full h-32 object-cover rounded-lg border border-slate-800" />
                      )}
                      {item.type === 'video' && item.url && (
                        <video src={item.url} controls className="w-full h-32 object-cover rounded-lg border border-slate-800" />
                      )}
                      {item.type === 'music' && item.url && (
                        <audio src={item.url} controls className="w-full" />
                      )}

                      <a
                        href={item.url}
                        download={`ai_${item.type}_${item.id}`}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Asset</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
