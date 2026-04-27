import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, RefreshCw, MessageSquare, ChevronLeft, Sparkles, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startConversation, scenarios } from '../services/geminiService';
import { UserProfile } from '../types';
import { VoiceRecorder } from './VoiceRecorder';

interface Message {
  role: 'user' | 'model';
  text: string;
  audioUrl?: string;
}

export function AIConversationSimulator({ profile }: { profile: UserProfile | null }) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartChat = async (scenario: string) => {
    setIsLoading(true);
    setSelectedScenario(scenario);
    try {
      const session = await startConversation(
        profile?.name || 'Student',
        profile?.role === 'STUDENT' ? 'Intermediate' : 'Advanced', // Defaulting level for now as it's not in profile yet
        scenario
      );
      setChatSession(session);
      
      // Get initial greeting
      const response = await session.sendMessage({ message: "Hi! I am ready to start the scenario." });
      setMessages([{ role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Error starting chat:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setMessages([{ role: 'model', text: `Desculpe, estou com problemas para me conectar ao tutor de IA. Erro: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !chatSession) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, encontrei um erro ao processar sua mensagem. Poderia repetir?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (isLoading || !chatSession) return;
    setIsLoading(true);

    try {
      // 1. Create a local URL for the UI
      const audioUrl = URL.createObjectURL(blob);
      setMessages(prev => [...prev, { role: 'user', text: "🎤 (Voz)", audioUrl }]);

      // 2. Convert Blob to Base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) throw new Error("Base64 conversion failed");

        try {
          // Send to Gemini as a part
          // Note: The SDK might require specific format for multimodel
          const response = await chatSession.sendMessage({
            parts: [
              { text: "User sent an audio message. Please transcribe and respond to it." },
              { inlineData: { data: base64data, mimeType: blob.type } }
            ]
          });
          setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (error) {
          console.error("Gemini Audio Error:", error);
          setMessages(prev => [...prev, { role: 'model', text: "Desculpe, não consegui processar seu áudio. Tente novamente ou escreva por texto." }]);
        } finally {
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error("Audio Processing Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Erro ao processar áudio." }]);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setMessages([]);
    setChatSession(null);
    setInputValue('');
  };

  if (!selectedScenario) {
    return (
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-[#003366]" size={20} />
            <h4 className="text-[10px] font-mono uppercase text-[#003366] font-bold opacity-80 tracking-widest">AI Tutor</h4>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#003366]">Simulador de Conversação</h1>
          <p className="text-sm font-mono text-[#003366] font-medium opacity-70 uppercase mt-2">Pratique seu inglês em situações reais com nossa IA</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleStartChat(scenario.label)}
              className="text-left p-6 border border-[#003366] bg-white group hover:bg-[#003366] transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
            >
              <h3 className="text-lg font-bold group-hover:text-white mb-2">{scenario.label}</h3>
              <p className="text-xs text-[#003366] font-medium opacity-80 group-hover:text-white group-hover:opacity-90 leading-relaxed">
                {scenario.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase font-bold group-hover:text-white">
                <span>Começar Prática</span>
                <ChevronLeft size={14} className="rotate-180 transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#003366] flex justify-between items-center bg-[#003366] text-white">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-all"
            title="Voltar aos Cenários"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="text-sm font-bold">{selectedScenario}</h3>
            <p className="text-[10px] font-mono opacity-60 uppercase tracking-tighter">AI Practice Session</p>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="p-2 border border-white border-opacity-20 hover:bg-white hover:text-[#003366] transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#003366] bg-opacity-[0.02]"
      >
        <div className="text-center py-4">
          <span className="text-[9px] font-mono uppercase bg-white border border-[#003366] border-opacity-20 px-3 py-1 text-[#003366] opacity-60">
            Conversa Iniciada
          </span>
        </div>
        
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#003366] border-opacity-20 ${m.role === 'user' ? 'bg-white' : 'bg-[#003366]'}`}>
                  {m.role === 'user' ? <User size={14} className="text-[#003366]" /> : <Bot size={14} className="text-white" />}
                </div>
                <div 
                  className={`p-3 text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#003366] text-white shadow-[4px_4px_0px_0px_rgba(0,51,102,0.1)]' 
                      : 'bg-white border border-[#003366] border-opacity-10 shadow-[4px_4px_0px_0px_rgba(0,51,102,0.05)] text-[#003366]'
                  }`}
                >
                  {m.text}
                  {m.audioUrl && (
                    <div className="mt-2 min-w-[200px]">
                      <AudioPlayer url={m.audioUrl} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center animate-pulse">
                <Bot size={14} className="text-white" />
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#003366] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#003366] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#003366] rounded-full animate-bounce"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 bg-white border-t border-[#003366]"
      >
        <div className="flex gap-2 items-center">
          {!inputValue.trim() && (
            <VoiceRecorder onRecordingComplete={handleSendAudio} disabled={isLoading} />
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message in English..."
            disabled={isLoading || !chatSession}
            className="flex-1 p-3 border border-[#003366] text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || !chatSession}
            className="px-6 py-3 bg-[#003366] text-white transition-all hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[8px] font-mono uppercase opacity-30 text-center">
          Powered by BTechnology English AI
        </p>
      </form>
    </div>
  );
}

function AudioPlayer({ url }: { url: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  return (
    <div className="flex items-center gap-2 p-1.5 bg-white bg-opacity-10 rounded border border-white border-opacity-20 min-w-[140px]">
      <audio 
        ref={audioRef} 
        src={url} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button 
        type="button"
        onClick={toggle}
        className="w-7 h-7 flex items-center justify-center bg-white text-[#003366] rounded-full flex-shrink-0"
      >
        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </button>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-[7px] font-mono font-bold uppercase opacity-70 text-white">Prática Oral</span>
        <div className="flex gap-0.5 h-2 items-end">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div 
              key={i} 
              className={`w-0.5 bg-white rounded-full ${isPlaying ? 'animate-pulse' : 'opacity-30'}`}
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
