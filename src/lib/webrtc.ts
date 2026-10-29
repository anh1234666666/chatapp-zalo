/**
 * WebRTC Service - Xử lý Video Call & Voice Call P2P Chuẩn Quốc Tế
 * Hỗ trợ STUN Servers tốc độ cao của Google, Cloudflare và Twilio
 */

const defaultIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    let customServers = defaultIceServers;
    try {
      const envServers = import.meta.env.VITE_ICE_SERVERS;
      if (envServers) {
        customServers = JSON.parse(envServers);
      }
    } catch {
      customServers = defaultIceServers;
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: customServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      iceTransportPolicy: 'all',
    });

    this.remoteStream = new MediaStream();

    // Xử lý khi nhận track từ đối phương (hoạt động tốt trên iOS Safari, Android, PC)
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC ontrack] Nhận track:', event.track.kind, event.track.id);

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        // Nếu trình duyệt gửi kèm stream, gán track từ stream đó
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream!.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream!.addTrack(track);
          }
        });
      } else if (event.track) {
        // Fallback cho trình duyệt chỉ gửi riêng track (iOS Safari)
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateCallback) {
        console.log('[WebRTC State Changed]:', this.peerConnection.connectionState);
        this.onConnectionStateCallback(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('[WebRTC ICE State]:', this.peerConnection.iceConnectionState);
      }
    };
  }

  public async startLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      // Cấu hình âm thanh & hình ảnh mượt mà, không bị giật khung hình
      const constraints: MediaStreamConstraints = {
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              facingMode: 'user',
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
            }
          : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (err) {
      console.warn('Lỗi getUserMedia chuẩn, thử cấu hình cơ bản:', err);
      // Fallback: Thử với cấu hình tối giản
      try {
        const fallbackConstraints: MediaStreamConstraints = {
          audio: true,
          video: video ? { facingMode: 'user' } : false,
        };
        this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        if (this.peerConnection && this.localStream) {
          this.localStream.getTracks().forEach((track) => {
            this.peerConnection!.addTrack(track, this.localStream!);
          });
        }
        return this.localStream;
      } catch (fallbackErr) {
        console.error('Không thể mở Camera / Micro:', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  public setOnRemoteStream(cb: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = cb;
    if (this.remoteStream && this.remoteStream.getTracks().length > 0) {
      cb(this.remoteStream);
    }
  }

  public setOnIceCandidate(cb: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = cb;
  }

  public setOnConnectionState(cb: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateCallback = cb;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection chưa khởi tạo');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection chưa khởi tạo');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainPendingCandidates();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    if (this.peerConnection.signalingState !== 'stable') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainPendingCandidates();
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !candidate) return;
    if (typeof candidate.candidate === 'string' && candidate.candidate.trim() === '') return;
    
    if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (e) {
      console.warn('Lỗi thêm ICE Candidate:', e);
    }
  }

  private async drainPendingCandidates() {
    if (!this.peerConnection) return;
    while (this.pendingCandidates.length > 0) {
      const c = this.pendingCandidates.shift();
      if (c && c.candidate) {
        try {
          await this.peerConnection.addIceCandidate(c);
        } catch (e) {
          console.warn('Lỗi nạp pending ICE candidate:', e);
        }
      }
    }
  }

  public toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  public toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  public close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.pendingCandidates = [];
  }
}
