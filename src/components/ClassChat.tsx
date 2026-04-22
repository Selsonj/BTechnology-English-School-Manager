import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatMessage, UserProfile } from '../types';
import { Send, MessageSquare, CheckCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClassChatProps {
  classId: string;
  userProfile: UserProfile | null;
  teacherId?: string;
}

export function ClassChat({ classId, userProfile, teacherId }: ClassChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classId || !isOpen) return;

    const q = query(
      collection(db, 'classChats', classId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });

    return () => unsubscribe();
  }, [classId, isOpen]);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !userProfile) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'classChats', classId, 'messages'), {
        senderId: userProfile.id,
        senderName: userProfile.name,
        text,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message to class chat:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 p-4 border border-[#003366] bg-white text-[#003366] flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold hover:bg-[#003366] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,51,102,0.1)] hover:shadow-none"
      >
        <MessageSquare size={16} />
        Abrir Chat da Turma
      </button>
    );
  }

  return (
    <div className="mt-8 border border-[#003366] bg-white flex flex-col h-[450px] shadow-[6px_6px_0px_0px_rgba(0,51,102,1)]">
      <div className="p-3 border-b border-[#003366] bg-[#003366] text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} />
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold">Chat da Turma</h4>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-[10px] font-mono uppercase opacity-70 hover:opacity-100"
        >
          Fechar
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#003366]"
      >
        {messages.length === 0 && (
          <div className="text-center py-12 opacity-80 text-white">
            <MessageSquare size={32} className="mx-auto mb-2" />
            <p className="text-[10px] font-mono uppercase font-bold">Nenhuma mensagem ainda.</p>
            <p className="text-[10px] font-mono uppercase">Inicie a conversa com seus colegas e professor!</p>
          </div>
        )}
        
        {messages.map((m, idx) => {
          const isOwn = m.senderId === userProfile?.id;
          const isTeacherMessage = m.senderId === teacherId;
          
          // Date separator logic
          let showDateSeparator = false;
          let dateStr = '';
          if (m.createdAt?.toDate) {
            const currentDate = m.createdAt.toDate().toLocaleDateString();
            const prevDate = idx > 0 && messages[idx-1].createdAt?.toDate ? messages[idx-1].createdAt.toDate().toLocaleDateString() : null;
            if (currentDate !== prevDate) {
              showDateSeparator = true;
              const today = new Date().toLocaleDateString();
              const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
              if (currentDate === today) dateStr = 'Hoje';
              else if (currentDate === yesterday) dateStr = 'Ontem';
              else dateStr = currentDate;
            }
          }

          return (
            <React.Fragment key={m.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-6">
                  <span className="text-[9px] font-mono uppercase bg-[#003366] bg-opacity-30 border border-white border-opacity-40 px-4 py-1.5 text-white font-bold shadow-sm backdrop-blur-sm">
                    {dateStr}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isOwn ? 'text-right' : 'text-left'}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <p className="text-[8px] font-mono uppercase text-white font-bold opacity-90">{m.senderName}</p>
                      {isTeacherMessage && (
                        <span className="text-[7px] font-mono px-1.5 py-0.5 bg-yellow-400 text-[#003366] font-bold rounded-sm uppercase tracking-tighter shadow-sm border border-[#003366] border-opacity-10">
                          Professor
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`rounded-sm p-3 text-xs leading-relaxed ${
                    isOwn 
                      ? 'bg-white text-[#003366] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]' 
                      : isTeacherMessage
                        ? 'bg-yellow-50 text-[#003366] border-l-4 border-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]'
                        : 'bg-blue-100 text-[#003366] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]'
                  }`}>
                    <p>{m.text}</p>
                    <div className={`mt-1 flex items-center gap-1 text-[8px] font-mono justify-end font-bold ${isOwn || isTeacherMessage || !isOwn ? 'opacity-60 text-[#003366]' : 'opacity-60 text-white'}`}>
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      {isOwn && <CheckCheck size={10} />}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#003366] border-opacity-10">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            placeholder="Escreva na turma..." 
            className="flex-1 p-2 border border-[#003366] border-opacity-20 text-xs focus:outline-none focus:border-opacity-100 font-sans"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-[#003366] text-white transition-all hover:bg-opacity-90 disabled:opacity-30 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,51,102,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
