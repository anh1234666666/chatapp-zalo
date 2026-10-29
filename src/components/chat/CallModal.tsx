import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertTriangle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { WebRTCService } from '../../lib/webrtc';
import { Profile } from '../../types/database';

interface CallModalProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  otherUser: Profile;
  currentUserId: string;
  isInitiator: boolean;
  onEndCall: (duration: number, callType: 'audio' | 'video') => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  otherUser,
  currentUserId,
  isInitiator,
  onEndCall,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callType === 'audio');
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [remoteFrame, setRemoteFrame] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const remoteImgRef = useRef<HTMLImageElement>(null);

  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;

  const otherUserRef = useRef(otherUser);
  otherUserRef.current = otherUser;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const isInitiatorRef = useRef(isInitiator);
  isInitiatorRef.current = isInitiator;

  const callTypeRef = useRef(callType);
  callTypeRef.current = callType;

  const isAudioMutedRef = useRef(isAudioMuted);
  isAudioMutedRef.current = isAudioMuted;

  const isVideoDisabledRef = useRef(isVideoDisabled);
  isVideoDisabledRef.current = isVideoDisabled;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const rtcServiceRef = useRef<WebRTCService | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Web Audio Context cho việc truyền và phát âm thanh PCM trực tiếp
  const audioSendCtxRef = useRef<AudioContext | null>(null);
  const audioPlayCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callDurationRef = useRef(0);
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const localStreamReadyRef = useRef(false);
  const pendingOfferRef = useRef<any>(null);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // Gửi tín hiệu WebRTC qua Local Backend
  const sendSignal = useCallback(async (signalType: string, payload: any = {}) => {
    try {
      await fetch('/api/local/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: otherUserRef.current.id,
          signalType,
          payload,
          fromUserId: currentUserIdRef.current,
        }),
      });
    } catch (e) {
      console.warn('Lỗi gửi signal WebRTC:', e);
    }
  }, []);

  // Mở khóa âm thanh Web Audio
  const tryUnlockAudio = useCallback(() => {
    if (audioPlayCtxRef.current) {
      if (audioPlayCtxRef.current.state === 'suspended') {
        audioPlayCtxRef.current.resume().then(() => {
          setAudioBlocked(false);
        }).catch(() => {});
      } else {
        setAudioBlocked(false);
      }
    }
  }, []);

  // Khởi tạo toàn bộ phiên gọi
  const startCallSession = useCallback(async () => {
    setCallStatus('connecting');
    setErrorMessage(null);
    setAudioBlocked(false);
    setHasRemoteVideo(false);
    setRemoteFrame(null);
    if (remoteImgRef.current) remoteImgRef.current.src = '';
    localStreamReadyRef.current = false;
    pendingOfferRef.current = null;
    processedSignalsRef.current.clear();
    nextPlayTimeRef.current = 0;

    if (rtcServiceRef.current) {
      rtcServiceRef.current.close();
      rtcServiceRef.current = null;
    }

    // Khởi tạo Playback AudioContext (16kHz Mono cho giọng nói chuẩn)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const playCtx = new AudioCtxClass({ sampleRate: 16000 });
        audioPlayCtxRef.current = playCtx;
        if (playCtx.state === 'suspended') {
          playCtx.resume().catch(() => setAudioBlocked(true));
        }
      }
    } catch (e) {
      console.warn('Playback AudioContext setup error:', e);
    }

    const rtc = new WebRTCService();
    rtcServiceRef.current = rtc;

    rtc.setOnRemoteStream((stream) => {
      console.log('[WebRTC Remote Stream Direct]:', stream.getTracks());
      if (callTypeRef.current === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
      }
      setHasRemoteVideo(true);
      setCallStatus('connected');
    });

    rtc.setOnIceCandidate((candidate) => {
      sendSignal('webrtc_ice', { candidate });
    });

    rtc.setOnConnectionState((state) => {
      if (state === 'connected') {
        setCallStatus('connected');
        tryUnlockAudio();
      }
    });

    // Mở Camera & Microphone
    try {
      const isVideo = callTypeRef.current === 'video';
      const localStream = await rtc.startLocalStream(isVideo, true);
      localStreamRef.current = localStream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      localStreamReadyRef.current = true;

      // Khởi tạo luồng thu âm giọng nói trực tiếp qua PCM (100% không bao giờ lỗi container)
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const sendCtx = new AudioCtxClass({ sampleRate: 16000 });
          audioSendCtxRef.current = sendCtx;
          const source = sendCtx.createMediaStreamSource(localStream);
          // Buffer 1024 mẫu = 64ms mỗi gói âm thanh (cực nhanh, không có độ trễ)
          const processor = sendCtx.createScriptProcessor(1024, 1, 1);

          processor.onaudioprocess = (e) => {
            if (isAudioMutedRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);

            // Đo độ lớn âm thanh để chỉ gửi khi có tiếng nói (tiết kiệm băng thông)
            let maxVol = 0;
            for (let i = 0; i < inputData.length; i++) {
              const abs = Math.abs(inputData[i]);
              if (abs > maxVol) maxVol = abs;
            }
            if (maxVol < 0.005) return; // Im lặng thì bỏ qua

            // Nén float32 thành Int16 PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Chuyển binary sang Base64
            let binary = '';
            const bytes = new Uint8Array(pcm16.buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            fetch('/api/local/call/media/audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetUserId: otherUserRef.current.id,
                data: base64,
              }),
            }).catch(() => {});
          };

          source.connect(processor);
          processor.connect(sendCtx.destination);
        }
      } catch (err) {
        console.warn('Audio sender setup error:', err);
      }

      // Xử lý Offer đang chờ
      if (!isInitiatorRef.current && pendingOfferRef.current) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        const answer = await rtc.createAnswer(offer);
        sendSignal('webrtc_answer', { answer });
      }

      // Thông báo sẵn sàng
      if (isInitiatorRef.current) {
        sendSignal('call_request', { type: callTypeRef.current });
      } else {
        sendSignal('call_accepted', { type: callTypeRef.current });
      }
    } catch (err: any) {
      console.error('Lỗi getUserMedia:', err);
      setCallStatus('error');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Trình duyệt chưa được cấp quyền truy cập Camera/Micro. Vui lòng bấm Cho Phép trên thanh địa chỉ.'
          : 'Không thể mở Camera / Micro: ' + (err.message || 'Thiết bị không khả dụng')
      );
    }
  }, [sendSignal, tryUnlockAudio]);

  // VÒNG LẶP DUY NHẤT: Khởi tạo khi isOpen = true
  useEffect(() => {
    if (!isOpen) return;

    startCallSession();

    // Canvas ảo để trích xuất khung hình video mượt mà (360x270 ~ 18-20 FPS)
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    // 1. Gửi khung hình video của mình đi (mỗi 55ms ~ 18 FPS)
    const videoSendInterval = setInterval(() => {
      if (callTypeRef.current === 'video' && !isVideoDisabledRef.current && localVideoRef.current && ctx) {
        try {
          if (localVideoRef.current.readyState >= 2) {
            ctx.drawImage(localVideoRef.current, 0, 0, 360, 270);
            const frame = canvas.toDataURL('image/jpeg', 0.40);
            fetch('/api/local/call/media/frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetUserId: otherUserRef.current.id,
                frame,
              }),
            }).catch(() => {});
          }
        } catch {}
      }
    }, 55);

    // 2. Nhận khung hình video của đối phương (mỗi 45ms) - Gán trực tiếp vào DOM Image để không gây lag Virtual DOM
    const videoReceiveInterval = setInterval(async () => {
      if (callTypeRef.current === 'video') {
        try {
          const res = await fetch(`/api/local/call/media/frame?userId=${currentUserIdRef.current}`);
          if (res.ok) {
            const data = await res.json();
            if (data.frame) {
              if (remoteImgRef.current) {
                remoteImgRef.current.src = data.frame;
              }
              setHasRemoteVideo((prev) => (prev ? prev : true));
              setCallStatus('connected');
            }
          }
        } catch {}
      }
    }, 45);

    // 3. Nhận và phát các gói âm thanh PCM trực tiếp (mỗi 45ms) - Triệt tiêu hoàn toàn delay
    const audioReceiveInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/local/call/media/audio?userId=${currentUserIdRef.current}`);
        if (res.ok) {
          const data = await res.json();
          let chunks: Array<{ id: number; data: string }> = data.chunks || [];
          if (chunks.length > 0) {
            setCallStatus('connected');
            const playCtx = audioPlayCtxRef.current;

            if (playCtx) {
              if (playCtx.state === 'suspended') {
                playCtx.resume().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
              } else {
                setAudioBlocked(false);
              }

              // Nếu có nhiều gói bị dồn lại do mạng jitter, chỉ lấy tối đa 3 gói mới nhất để triệt tiêu delay
              if (chunks.length > 3) {
                chunks = chunks.slice(-3);
              }

              chunks.forEach((c) => {
                try {
                  const binary = atob(c.data);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                  }
                  const int16 = new Int16Array(bytes.buffer);

                  const float32 = new Float32Array(int16.length);
                  for (let i = 0; i < int16.length; i++) {
                    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
                  }

                  const audioBuf = playCtx.createBuffer(1, float32.length, 16000);
                  audioBuf.getChannelData(0).set(float32);

                  const srcNode = playCtx.createBufferSource();
                  srcNode.buffer = audioBuf;
                  srcNode.connect(playCtx.destination);

                  const now = playCtx.currentTime;
                  // Đảm bảo không bao giờ bị lệch delay tích lũy quá 80ms
                  if (nextPlayTimeRef.current < now || nextPlayTimeRef.current > now + 0.08) {
                    nextPlayTimeRef.current = now + 0.015;
                  }
                  srcNode.start(nextPlayTimeRef.current);
                  nextPlayTimeRef.current += audioBuf.duration;
                } catch (decodeErr) {
                  console.warn('PCM decode error:', decodeErr);
                }
              });
            }
          }
        }
      } catch {}
    }, 45);

    // 4. Polling WebRTC Signals (Offer, Answer, ICE, Ended) mỗi 200ms
    const signalInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/local/call/signals?userId=${currentUserIdRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        const signals = data.signals || [];

        for (const sig of signals) {
          const rtc = rtcServiceRef.current;
          if (!rtc) continue;

          const sigKey = `${sig.signalType}_${sig.timestamp || ''}_${JSON.stringify(sig.payload || {}).slice(0, 30)}`;
          if (processedSignalsRef.current.has(sigKey)) continue;
          processedSignalsRef.current.add(sigKey);

          if (sig.signalType === 'call_accepted') {
            if (isInitiatorRef.current) {
              const offer = await rtc.createOffer();
              sendSignal('webrtc_offer', { offer });
            }
          } else if (sig.signalType === 'webrtc_offer') {
            if (!isInitiatorRef.current && sig.payload?.offer) {
              if (localStreamReadyRef.current) {
                const answer = await rtc.createAnswer(sig.payload.offer);
                sendSignal('webrtc_answer', { answer });
              } else {
                pendingOfferRef.current = sig.payload.offer;
              }
            }
          } else if (sig.signalType === 'webrtc_answer') {
            if (isInitiatorRef.current && sig.payload?.answer) {
              await rtc.handleAnswer(sig.payload.answer);
            }
          } else if (sig.signalType === 'webrtc_ice') {
            if (sig.payload?.candidate) {
              await rtc.addIceCandidate(sig.payload.candidate);
            }
          } else if (sig.signalType === 'call_ended') {
            cleanup();
            onEndCallRef.current(callDurationRef.current, callTypeRef.current);
            return;
          }
        }
      } catch {}
    }, 200);

    const cleanup = () => {
      clearInterval(videoSendInterval);
      clearInterval(videoReceiveInterval);
      clearInterval(audioReceiveInterval);
      clearInterval(signalInterval);

      if (remoteImgRef.current) {
        remoteImgRef.current.src = '';
      }

      if (audioSendCtxRef.current) {
        try { audioSendCtxRef.current.close(); } catch {}
        audioSendCtxRef.current = null;
      }

      if (audioPlayCtxRef.current) {
        try { audioPlayCtxRef.current.close(); } catch {}
        audioPlayCtxRef.current = null;
      }

      if (rtcServiceRef.current) {
        rtcServiceRef.current.close();
        rtcServiceRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };

    return cleanup;
  }, [isOpen, startCallSession, sendSignal]);

  // Bộ đếm thời gian khi đã kết nối
  useEffect(() => {
    if (callStatus === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callStatus]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    rtcServiceRef.current?.toggleAudio(!next);
  };

  const toggleCam = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isVideoDisabled;
    setIsVideoDisabled(next);
    rtcServiceRef.current?.toggleVideo(!next);
  };

  const handleEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    sendSignal('call_ended');
    if (rtcServiceRef.current) {
      rtcServiceRef.current.close();
    }
    onEndCallRef.current(callDurationRef.current, callTypeRef.current);
  };

  return (
    <div
      onClick={tryUnlockAudio}
      onTouchStart={tryUnlockAudio}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[86vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between">
        
        {/* 1. Header Bar */}
        <div className="p-3 sm:p-5 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border-2 border-white/20">
              <img
                src={otherUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.username}`}
                alt={otherUser.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">{otherUser.display_name}</h3>
              <p className="text-xs text-blue-400 font-medium">
                {callStatus === 'connecting'
                  ? 'Đang thiết lập kết nối HD...'
                  : callStatus === 'connected'
                  ? `Đang đàm thoại • ${formatTimer(callDuration)}`
                  : 'Chờ cấp quyền thiết bị'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white backdrop-blur-md border border-white/10">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{callType === 'video' ? 'Video HD' : 'Thoại HD'}</span>
            </span>
          </div>
        </div>

        {/* Thông báo nếu trình duyệt Safari/Chrome chặn Autoplay âm thanh */}
        {audioBlocked && (
          <div
            onClick={tryUnlockAudio}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full text-xs shadow-xl cursor-pointer flex items-center gap-2 animate-bounce"
          >
            <VolumeX className="w-4 h-4" />
            <span>Chạm vào đây để bật âm thanh đối phương!</span>
          </div>
        )}

        {/* 2. Video Canvas / Voice Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
          
          {/* Lỗi quyền thiết bị */}
          {callStatus === 'error' ? (
            <div className="p-6 max-w-md text-center text-red-400 space-y-4 z-20">
              <AlertTriangle className="w-14 h-14 mx-auto text-amber-500 animate-bounce" />
              <h4 className="font-bold text-lg text-white">Yêu cầu quyền Camera / Micro</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                {errorMessage}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); startCallSession(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg transition-transform hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại kết nối</span>
              </button>
            </div>
          ) : (callType === 'audio' || !hasRemoteVideo) ? (
            /* Avatar to chính giữa khi gọi thoại hoặc khi chưa nhận được hình đối phương */
            <div className="flex flex-col items-center justify-center text-center z-10 space-y-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl animate-pulse">
                  <img
                    src={otherUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.username}`}
                    alt={otherUser.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {callStatus === 'connected' && (
                  <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-1">{otherUser.display_name}</h4>
                <p className="text-xs sm:text-sm text-emerald-400 font-medium">
                  {callStatus === 'connected' ? 'Đang truyền âm thanh 2 chiều siêu rõ...' : 'Đang kết nối...'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Remote Video Stream qua Cloudflare Media Tunnel (Cực kỳ mượt mà, render GPU trực tiếp) */}
          {callType === 'video' && (
            <img
              ref={remoteImgRef}
              alt="Remote Video"
              className={`absolute inset-0 w-full h-full object-cover z-10 ${hasRemoteVideo ? 'block' : 'hidden'}`}
            />
          )}

          {/* WebRTC Video Direct (fallback thêm) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              callType === 'video' && hasRemoteVideo ? 'block' : 'hidden'
            }`}
          />

          {/* Local Video Mini Preview (PiP ở góc dưới) */}
          {callType === 'video' && !isVideoDisabled && (
            <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 sm:w-40 h-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                Bạn
              </span>
            </div>
          )}

        </div>

        {/* 3. Footer Control Buttons */}
        <div className="p-4 sm:p-6 flex items-center justify-center gap-4 sm:gap-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30">
          
          {/* Bật/Tắt Micro */}
          <button
            onClick={toggleMic}
            className={`p-3.5 sm:p-4 rounded-full transition-all shadow-lg ${
              isAudioMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isAudioMuted ? 'Bật Micro' : 'Tắt Micro'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Bật/Tắt Camera */}
          {callType === 'video' && (
            <button
              onClick={toggleCam}
              className={`p-3.5 sm:p-4 rounded-full transition-all shadow-lg ${
                isVideoDisabled ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isVideoDisabled ? 'Bật Camera' : 'Tắt Camera'}
            >
              {isVideoDisabled ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* Kết thúc cuộc gọi */}
          <button
            onClick={handleEnd}
            className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-all hover:scale-110 active:scale-95"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

        </div>

      </div>
    </div>
  );
};
