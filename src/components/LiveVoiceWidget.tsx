import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

function float32ToPcm16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export const LiveVoiceWidget: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // Ignore cleanup errors
    }
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void inputCtxRef.current?.close();
    inputCtxRef.current = null;
    void outputCtxRef.current?.close();
    outputCtxRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    nextStartTimeRef.current = 0;
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setStatus('connecting');
    setErrorMsg(null);
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as {
          ready?: boolean;
          audio?: string;
          interrupted?: boolean;
          inputTranscript?: string;
          outputTranscript?: string;
          error?: string;
        };

        if (msg.error) {
          setErrorMsg(msg.error);
          setStatus('error');
          stopSession();
          return;
        }
        if (msg.ready) {
          setStatus('live');
        }
        if (msg.inputTranscript) {
          setTranscript((prev) => `${prev ? `${prev}\n` : ''}أنت: ${msg.inputTranscript}`);
        }
        if (msg.outputTranscript) {
          setTranscript((prev) => `${prev ? `${prev}\n` : ''}DoDo: ${msg.outputTranscript}`);
        }
        if (msg.interrupted && outputCtxRef.current) {
          nextStartTimeRef.current = outputCtxRef.current.currentTime;
        }
        if (msg.audio && outputCtxRef.current) {
          const ctx = outputCtxRef.current;
          const samples = base64Pcm16ToFloat32(msg.audio);
          const buffer = ctx.createBuffer(1, samples.length, 24000);
          buffer.getChannelData(0).set(samples);
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.connect(ctx.destination);
          const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
          src.start(startAt);
          nextStartTimeRef.current = startAt + buffer.duration;
        }
      };

      ws.onerror = () => {
        setErrorMsg('تعذر فتح الاتصال الصوتي المباشر مع الخادم.');
        setStatus('error');
      };

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        }
      };
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `تعذر تشغيل الميكروفون أو المحادثة الصوتية: ${err.message}`
          : 'تعذر تشغيل المحادثة الصوتية.'
      );
      setStatus('error');
      stopSession();
    }
  };

  return (
    <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-teal-700" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              مكالمة صوتية مباشرة مع صديقك DoDo
            </div>
            <div className="text-[11px] text-slate-600">
              ناقش اسم البراند، القطع، والخامات بالصوت الفوري (Live Voice)
            </div>
          </div>
        </div>

        {status === 'live' || status === 'connecting' ? (
          <button
            type="button"
            onClick={stopSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            <MicOff className="h-3.5 w-3.5" />
            <span>{status === 'connecting' ? 'جاري الاتصال...' : 'إنهاء المكالمة'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>ابدأ حديثاً صوتياً</span>
          </button>
        )}
      </div>

      {status === 'live' && (
        <div className="text-[11px] font-semibold text-emerald-800">
          متصل الآن — تكلّم بحرية وسيرد عليك DoDo صوتياً مباشرة...
        </div>
      )}

      {transcript && (
        <pre className="max-h-24 overflow-y-auto rounded-lg bg-white p-2 text-[11px] text-slate-700 whitespace-pre-wrap font-sans border border-slate-200">
          {transcript}
        </pre>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
