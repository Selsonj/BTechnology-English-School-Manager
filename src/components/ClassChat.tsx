import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp, 
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage, UserProfile } from '../types';
import { Send, MessageSquare, CheckCheck, User, Play, Pause, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceRecorder } from './VoiceRecorder';

interface ClassChatProps {
  classId: string;
  userProfile: UserProfile | null;
  teacherId?: string;
  isOpenDefault?: boolean;
}

export function ClassChat({ classId, userProfile, teacherId, isOpenDefault = true }: ClassChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSendAudio = async (blob: Blob) => {
    if (!userProfile) return;
    setIsSending(true);

    try {
      const audioFileName = `class_chats/${classId}/${Date.now()}.webm`;
      const audioRef = ref(storage, audioFileName);
      
      const uploadResult = await uploadBytes(audioRef, blob);
      const audioUrl = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'classChats', classId, 'messages'), {
        senderId: userProfile.id,
        senderName: userProfile.name,
        audioUrl,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `classChats/${classId}/messages (audio)`);
    } finally {
      setIsSending(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um ficheiro de imagem.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const storageRef = ref(storage, `class_chats/${classId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'classChats', classId, 'messages'), {
        senderId: userProfile.id,
        senderName: userProfile.name,
        imageUrl,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `classChats/${classId}/messages (image)`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deleteConfirmId !== messageId) {
      setDeleteConfirmId(messageId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'classChats', classId, 'messages', messageId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classChats/${classId}/messages/${messageId}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !userProfile) return;

    setIsSending(true);
    const text = newMessage.trim();

    try {
      await addDoc(collection(db, 'classChats', classId, 'messages'), {
        senderId: userProfile.id,
        senderName: userProfile.name,
        text,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `classChats/${classId}/messages`);
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
    <div className="mt-4 border border-[#003366] bg-white flex flex-col h-[550px] shadow-[6px_6px_0px_0px_rgba(0,51,102,1)]">
      <div className="p-3 border-b border-[#003366] bg-[#003366] text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} />
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold">Chat da Turma</h4>
        </div>
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
                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                    {m.imageUrl && (
                      <div className="mt-2 rounded-sm overflow-hidden border border-[#003366] border-opacity-10 bg-white shadow-sm">
                        <img 
                          src={m.imageUrl} 
                          alt="Shared" 
                          className="max-w-full h-auto max-h-[250px] object-contain block cursor-pointer"
                          onClick={() => window.open(m.imageUrl, '_blank')}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {m.audioUrl && (
                      <div className="mt-2">
                        <AudioPlayer url={m.audioUrl} invert={isOwn} />
                      </div>
                    )}
                    <div className={`mt-1 flex items-center gap-1 text-[8px] font-mono justify-end font-bold ${isOwn || isTeacherMessage || !isOwn ? 'opacity-60 text-[#003366]' : 'opacity-60 text-white'}`}>
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      {isOwn && <CheckCheck size={10} />}
                      {(isOwn || userProfile?.role === 'ADMIN') && (
                        <button 
                          onClick={(e) => handleDeleteMessage(e, m.id)}
                          className={`ml-2 transition-all p-1.5 rounded flex items-center gap-1 ${
                            deleteConfirmId === m.id 
                              ? 'bg-red-600 text-white font-bold px-2' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={deleteConfirmId === m.id ? "Confirmar" : "Eliminar"}
                          type="button"
                        >
                          <Trash2 size={14} />
                          {deleteConfirmId === m.id && <span className="text-[7px] uppercase">Apagar?</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#003366] border-opacity-10">
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          {!newMessage.trim() && (
            <div className="flex gap-1 items-center">
              <VoiceRecorder onRecordingComplete={handleSendAudio} disabled={isSending} />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isSending}
                className="p-2 text-[#003366] hover:bg-blue-50 rounded-sm transition-colors"
                title="Sincronizar Imagem"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-[#003366] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>
            </div>
          )}
          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            placeholder="Escreva na turma..." 
            rows={1}
            className="flex-1 p-2 border border-[#003366] border-opacity-20 text-xs focus:outline-none focus:border-opacity-100 font-sans resize-none min-h-[38px] max-h-[100px]"
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

function AudioPlayer({ url, invert }: { url: string, invert?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded min-w-[140px] ${invert ? 'bg-[#003366] text-white' : 'bg-[#003366] bg-opacity-10 text-[#003366]'}`}>
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
        className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${invert ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white'}`}
      >
        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </button>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-[7px] font-mono font-bold uppercase mb-1">Áudio da Turma</span>
        <div className="flex gap-0.5 h-3 items-end">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div 
              key={i} 
              className={`w-0.5 rounded-full ${invert ? 'bg-white' : 'bg-[#003366]'} ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
              style={{ height: `${(Math.sin(i * 0.7) * 30 + 70)}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
