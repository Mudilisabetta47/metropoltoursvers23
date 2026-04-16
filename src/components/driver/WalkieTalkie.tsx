import { useState, useEffect, useRef, useCallback } from "react";
import { Radio, Mic, MicOff, Phone, PhoneOff, Users, User, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnlineDriver {
  userId: string;
  name: string;
  presenceRef: string;
}

type PTTMode = "idle" | "group" | "direct";

interface SignalPayload {
  type: "offer" | "answer" | "ice" | "hangup" | "ptt-start" | "ptt-stop";
  from: string;
  fromName: string;
  to?: string;
  data?: any;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function WalkieTalkie() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [mode, setMode] = useState<PTTMode>("idle");
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [connectedTo, setConnectedTo] = useState<string | null>(null);
  const [connectedToName, setConnectedToName] = useState<string>("");
  const [incomingCall, setIncomingCall] = useState<{ from: string; fromName: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const myName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Fahrer";
  const myId = user?.id || "";

  // ---- Realtime Presence + Broadcast channel ----
  useEffect(() => {
    if (!myId) return;

    const ch = supabase.channel("driver-radio", {
      config: { presence: { key: myId } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ userId: string; name: string }>();
      const drivers: OnlineDriver[] = [];
      Object.entries(state).forEach(([key, presences]) => {
        if (key !== myId && presences.length > 0) {
          drivers.push({
            userId: presences[0].userId,
            name: presences[0].name,
            presenceRef: key,
          });
        }
      });
      setOnlineDrivers(drivers);
    });

    ch.on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalPayload }) => {
      if (!payload || payload.from === myId) return;
      if (payload.to && payload.to !== myId) return;
      handleSignal(payload);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ userId: myId, name: myName });
      }
    });

    channelRef.current = ch;
    return () => {
      ch.untrack();
      supabase.removeChannel(ch);
      cleanup();
    };
  }, [myId]);

  // ---- Signal handler ----
  const handleSignal = useCallback(
    async (sig: SignalPayload) => {
      switch (sig.type) {
        case "offer":
          setIncomingCall({ from: sig.from, fromName: sig.fromName });
          // Store offer for when user accepts
          (window as any).__pendingOffer = sig.data;
          (window as any).__pendingFrom = sig.from;
          (window as any).__pendingFromName = sig.fromName;
          break;

        case "answer":
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(sig.data));
          }
          break;

        case "ice":
          if (peerRef.current && sig.data) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(sig.data));
            } catch {}
          }
          break;

        case "hangup":
          cleanup();
          toast({ title: "Verbindung beendet", description: `${sig.fromName} hat aufgelegt.` });
          break;

        case "ptt-start":
          // Remote is talking – unmute remote audio
          if (remoteAudioRef.current) remoteAudioRef.current.muted = false;
          break;

        case "ptt-stop":
          // Remote stopped talking
          break;
      }
    },
    [toast]
  );

  // ---- Broadcast signal ----
  const sendSignal = (payload: Omit<SignalPayload, "from" | "fromName">) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { ...payload, from: myId, fromName: myName } as SignalPayload,
    });
  };

  // ---- Get microphone ----
  const getMic = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    setupAnalyser(stream);
    return stream;
  };

  const setupAnalyser = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const poll = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(avg / 128);
      animFrameRef.current = requestAnimationFrame(poll);
    };
    poll();
  };

  // ---- Create peer connection ----
  const createPeer = (stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: "ice", to: connectedTo || undefined, data: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanup();
      }
    };

    peerRef.current = pc;
    return pc;
  };

  // ---- Call driver (1:1) ----
  const callDriver = async (targetId: string, targetName: string) => {
    try {
      const stream = await getMic();
      setConnectedTo(targetId);
      setConnectedToName(targetName);
      setMode("direct");

      const pc = createPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", to: targetId, data: offer });

      toast({ title: "Anruf", description: `Rufe ${targetName} an…` });
    } catch (err) {
      toast({ title: "Fehler", description: "Mikrofon konnte nicht aktiviert werden.", variant: "destructive" });
    }
  };

  // ---- Accept incoming call ----
  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await getMic();
      const offer = (window as any).__pendingOffer;
      const fromId = (window as any).__pendingFrom;
      const fromName = (window as any).__pendingFromName;

      setConnectedTo(fromId);
      setConnectedToName(fromName);
      setMode("direct");
      setIncomingCall(null);

      const pc = createPeer(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type: "answer", to: fromId, data: answer });
    } catch (err) {
      toast({ title: "Fehler", description: "Konnte Anruf nicht annehmen.", variant: "destructive" });
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      sendSignal({ type: "hangup", to: incomingCall.from });
    }
    setIncomingCall(null);
    delete (window as any).__pendingOffer;
    delete (window as any).__pendingFrom;
    delete (window as any).__pendingFromName;
  };

  // ---- Group mode ----
  const joinGroup = async () => {
    try {
      const stream = await getMic();
      // In group mode, mute local tracks initially – only unmute on PTT
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      setMode("group");

      // Create peer connections to all online drivers
      for (const driver of onlineDrivers) {
        const pc = createPeer(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", to: driver.userId, data: offer });
      }

      toast({ title: "Gruppenkanal", description: "Du bist dem Gruppenkanal beigetreten." });
    } catch (err) {
      toast({ title: "Fehler", description: "Mikrofon konnte nicht aktiviert werden.", variant: "destructive" });
    }
  };

  // ---- PTT (Push-to-Talk) ----
  const pttDown = () => {
    setIsPTTActive(true);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true));
    }
    sendSignal({ type: "ptt-start" });
  };

  const pttUp = () => {
    setIsPTTActive(false);
    if (mode === "group" && localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
    }
    sendSignal({ type: "ptt-stop" });
  };

  // ---- Hangup ----
  const hangup = () => {
    sendSignal({ type: "hangup", to: connectedTo || undefined });
    cleanup();
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    setMode("idle");
    setConnectedTo(null);
    setConnectedToName("");
    setIsPTTActive(false);
    setAudioLevel(0);
  };

  // ---- Render ----
  return (
    <div className="flex flex-col gap-4 p-4">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Funk</h2>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          {onlineDrivers.length} online
        </Badge>
      </div>

      {/* Incoming Call */}
      {incomingCall && (
        <Card className="bg-emerald-500/20 border-emerald-500/40 animate-pulse">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Eingehender Anruf</p>
              <p className="text-emerald-300 text-sm">{incomingCall.fromName}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={acceptCall}>
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={rejectCall}>
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode: Idle – show online drivers + join group */}
      {mode === "idle" && (
        <>
          <Button
            onClick={joinGroup}
            disabled={onlineDrivers.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Users className="w-4 h-4" />
            Gruppenkanal beitreten
          </Button>

          <div className="space-y-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Fahrer online</p>
            {onlineDrivers.length === 0 ? (
              <p className="text-zinc-500 text-sm">Keine anderen Fahrer online.</p>
            ) : (
              onlineDrivers.map((d) => (
                <Card key={d.userId} className="bg-zinc-800/60 border-zinc-700">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-white text-sm">{d.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 gap-1"
                      onClick={() => callDriver(d.userId, d.name)}
                    >
                      <Phone className="w-3 h-3" />
                      Anrufen
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Mode: Active (group or direct) */}
      {mode !== "idle" && (
        <div className="flex flex-col items-center gap-6">
          {/* Connection info */}
          <div className="text-center">
            {mode === "group" ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Users className="w-5 h-5" />
                <span className="font-medium">Gruppenkanal</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <User className="w-5 h-5" />
                <span className="font-medium">{connectedToName}</span>
              </div>
            )}
            <p className="text-zinc-500 text-xs mt-1">
              {isPTTActive ? "Du sprichst…" : "Halte den Button gedrückt zum Sprechen"}
            </p>
          </div>

          {/* Audio level indicator */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full transition-transform duration-75"
              style={{
                background: isPTTActive
                  ? `radial-gradient(circle, rgba(16,185,129,${0.2 + audioLevel * 0.4}) 0%, transparent 70%)`
                  : "transparent",
                transform: `scale(${1 + audioLevel * 0.3})`,
              }}
            />
            {/* PTT Button */}
            <button
              onPointerDown={pttDown}
              onPointerUp={pttUp}
              onPointerLeave={pttUp}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all select-none touch-none ${
                isPTTActive
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/40 scale-110"
                  : "bg-zinc-700 hover:bg-zinc-600"
              }`}
            >
              {isPTTActive ? (
                <Mic className="w-10 h-10 text-white" />
              ) : (
                <MicOff className="w-10 h-10 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              className={`gap-1 ${isMuted ? "text-red-400 border-red-500/50" : "text-zinc-400"}`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? "Stumm" : "Lautsprecher"}
            </Button>
            <Button size="sm" variant="destructive" className="gap-1" onClick={hangup}>
              <PhoneOff className="w-4 h-4" />
              Beenden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
