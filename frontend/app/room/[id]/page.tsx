"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export default function VideoCallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Number(params.id);

  // ─── STATES & REFS FOR WEBRTC ─────────────────────────────────
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>("Connecting to signaling room...");
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // STUN servers configuration for ICE candidate gathering
  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Retrieve authentication details from storage
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to join the meeting.");
      router.push("/login");
      return;
    }

    let userEmail = "";
    let userId = 0;
    let isExpert = false;

    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      userEmail = tokenPayload.email || tokenPayload.sub || "";
      userId = tokenPayload.id || tokenPayload.user_id || 1;
      isExpert = tokenPayload.role === "expert" || tokenPayload.is_expert || false;
    } catch (e) {
      userEmail = localStorage.getItem("user_email") || "";
      userId = Number(localStorage.getItem("user_id") || "1");
      isExpert = localStorage.getItem("is_expert") === "true";
    }

    // ─── INITIALIZE MEDIA & WEBRTC CONNECTION ───────────────────
    async function initMediaAndSignaling() {
      try {
        // Get user camera and microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Peer Connection
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle incoming remote tracks from peer
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus("Connected");
          }
        };

        // Handle ICE candidates generation
        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
          }
        };

        // Connect to WebSocket signaling server with security parameters
        const wsUrl = `${API_WS_URL}/api/ws/room/${bookingId}?user_email=${encodeURIComponent(userEmail)}&user_id=${userId}&is_expert=${isExpert}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          setIsConnected(true);
          setCallStatus("Waiting for peer to join...");

          // If expert or initiator, create and send WebRTC Offer
          // Simple rule: Experts create the offer when joining, or vice versa. Let's create an offer if expert.
          if (isExpert) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", offer }));
            } catch (err) {
              console.error("Error creating WebRTC offer:", err);
            }
          }
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            const pcInstance = pcRef.current;
            if (!pcInstance) return;

            if (data.type === "offer") {
              await pcInstance.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pcInstance.createAnswer();
              await pcInstance.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: "answer", answer }));
            } else if (data.type === "answer") {
              await pcInstance.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.type === "ice-candidate") {
              await pcInstance.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else if (data.type === "peer-disconnected") {
              setCallStatus("Peer has left the call.");
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            }
          } catch (err) {
            console.error("Signaling message handling error:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setCallStatus("Signaling connection error.");
        };

        ws.onclose = () => {
          setIsConnected(false);
          setCallStatus("Disconnected from meeting room.");
        };

      } catch (err) {
        console.error("Failed to initialize media/signaling:", err);
        setCallStatus("Camera/Microphone permission denied or unavailable.");
      }
    }

    initMediaAndSignaling();

    // Cleanup on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [bookingId, router]);

  const handleLeaveCall = () => {
    router.push("/dashboard/mock-interviews");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
      <header className="flex justify-between items-center bg-slate-900 px-6 py-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold">Mock Interview Room (Booking ID: {bookingId})</h1>
          <p className="text-xs text-blue-400 mt-0.5">Status: {callStatus}</p>
        </div>
        <button
          onClick={handleLeaveCall}
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
        >
          Leave Meeting
        </button>
      </header>

      {/* VIDEO STREAMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 flex-1 items-center">
        <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
          <span className="absolute bottom-3 left-3 bg-slate-950/70 text-slate-200 text-[11px] px-2.5 py-1 rounded-md font-medium">
            You (Local Preview)
          </span>
        </div>

        <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <span className="absolute bottom-3 left-3 bg-slate-950/70 text-slate-200 text-[11px] px-2.5 py-1 rounded-md font-medium">
            Peer (Expert / Candidate)
          </span>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500">
        Secured WebRTC Peer-to-Peer Video Connection via WebSocket Signaling
      </footer>
    </div>
  );
}