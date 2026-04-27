import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  query as firestoreQuery,
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  limit,
  setDoc,
  getDocs,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Chat, ChatMessage, UserProfile, Student } from '../types';
import { Send, User, MessageCircle, ChevronLeft, Search, CheckCheck, Plus, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceRecorder } from './VoiceRecorder';

interface MessagingProps {
  userProfile: UserProfile;
  students: Student[];
}

export function Messaging({ userProfile, students }: MessagingProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Listen to chats where current user is a participant
  useEffect(() => {
    // Important: Students should listen for their studentId, Staff for their userProfile.id
    const myId = (userProfile.role === 'STUDENT' && userProfile.studentId) 
      ? userProfile.studentId 
      : userProfile.id;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', myId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));
    });

    return () => unsubscribe();
  }, [userProfile.id, userProfile.studentId, userProfile.role]);

  const startChat = async (targetUser: Student | UserProfile) => {
    // Check if chat already exists
    // Again, ensure we use studentId if the target is a student
    const senderId = (userProfile.role === 'STUDENT' && userProfile.studentId) ? userProfile.studentId : userProfile.id;
    const targetId = targetUser.id; // Correct as the list provided has studentId for students
    
    const participants = [senderId, targetId].sort();
    const chatId = participants.join('_');
    
    const chatDoc = doc(db, 'chats', chatId);
    const names: Record<string, string> = {
      [senderId]: userProfile.name,
      [targetId]: targetUser.name
    };

    try {
      await setDoc(chatDoc, {
        participants,
        participantNames: names,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const newChat: Chat = {
        id: chatId,
        participants,
        participantNames: names,
        updatedAt: new Date(),
      };

      setSelectedChat(newChat);
      setIsNewChatOpen(false);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex border border-[#003366] bg-white shadow-[8px_8px_0px_0px_rgba(0,51,102,1)] overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-[#003366] flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#003366] flex justify-between items-center bg-[#003366] text-white">
          <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Mensagens</h3>
          {userProfile.role !== 'STUDENT' && (
            <button 
              onClick={() => setIsNewChatOpen(true)}
              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-all"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && !isNewChatOpen && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
              <MessageCircle size={48} className="mb-4" />
              <p className="text-xs font-mono uppercase">Nenhuma conversa iniciada</p>
              {userProfile.role === 'STUDENT' && (
                <p className="text-[10px] mt-2 leading-relaxed">Aguarde o contacto de um professor ou coordenador.</p>
              )}
            </div>
          )}

          {chats.map(chat => {
            const myId = (userProfile.role === 'STUDENT' && userProfile.studentId) ? userProfile.studentId : userProfile.id;
            const otherId = chat.participants.find(p => p !== myId);
            const otherName = otherId ? chat.participantNames[otherId] : 'Utilizador';
            const unreadCount = chat.unreadCount?.[myId] || 0;
            
            return (
              <button
                key={chat.id}
                onClick={async () => {
                  setSelectedChat(chat);
                  if (unreadCount > 0) {
                    await updateDoc(doc(db, 'chats', chat.id), {
                      [`unreadCount.${myId}`]: 0
                    });
                  }
                }}
                className={`w-full p-4 flex items-center gap-3 border-b border-[#003366] border-opacity-10 transition-all ${
                  selectedChat?.id === chat.id 
                    ? 'bg-[#003366] text-white' 
                    : 'hover:bg-[#003366] hover:bg-opacity-5'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0 relative ${
                  selectedChat?.id === chat.id 
                    ? 'bg-white text-[#003366]' 
                    : 'bg-[#003366] bg-opacity-10 text-[#003366]'
                }`}>
                  {otherName.charAt(0)}
                  {unreadCount > 0 && selectedChat?.id !== chat.id && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-sm font-bold truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-[#003366]'}`}>{otherName}</p>
                    {unreadCount > 0 && selectedChat?.id !== chat.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    )}
                  </div>
                  <p className={`text-[10px] font-mono truncate uppercase ${
                    selectedChat?.id === chat.id ? 'text-white opacity-80' : 'text-[#003366] opacity-80'
                  } ${unreadCount > 0 && selectedChat?.id !== chat.id ? 'font-bold opacity-100' : ''}`}>
                    {chat.lastMessage || 'Nova conversa'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} currentUser={userProfile} onBack={() => setSelectedChat(null)} />
        ) : (
          <div className="text-center opacity-20">
            <MessageCircle size={80} className="mx-auto mb-4" />
            <p className="font-mono text-sm uppercase">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>

      {/* New Chat Modal (for Staff) */}
      <AnimatePresence>
        {isNewChatOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#003366] bg-opacity-50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md border border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]"
            >
              <div className="p-4 border-b border-[#003366] bg-[#003366] text-white flex justify-between items-center">
                <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Nova Conversa</h3>
                <button onClick={() => setIsNewChatOpen(false)}><Plus size={20} className="rotate-45" /></button>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar aluno por nome ou email..." 
                    className="w-full pl-9 pr-4 py-2 border border-[#003366] text-xs focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => startChat(student as any)}
                      className="w-full p-3 flex items-center gap-3 transition-all hover:bg-[#003366] hover:bg-opacity-5 border border-transparent hover:border-[#003366] hover:border-opacity-10"
                    >
                      <div className="w-8 h-8 bg-[#003366] bg-opacity-10 text-[#003366] flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">{student.name}</p>
                        <p className="text-[9px] font-mono opacity-50 uppercase">{student.email}</p>
                      </div>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-center py-8 text-[10px] font-mono opacity-40">Nenhum aluno encontrado.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatWindow({ chat, currentUser, onBack }: { chat: Chat, currentUser: UserProfile, onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherId = chat.participants.find(p => p !== currentUser.id);
  const otherName = otherId ? chat.participantNames[otherId] : 'Utilizador';

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });

    return () => unsubscribe();
  }, [chat.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendAudio = async (blob: Blob) => {
    setIsSending(true);
    const senderId = (currentUser.role === 'STUDENT' && currentUser.studentId) ? currentUser.studentId : currentUser.id;
    const otherId = chat.participants.find(p => p !== senderId);

    try {
      const audioFileName = `chats/${chat.id}/${Date.now()}.webm`;
      const audioRef = ref(storage, audioFileName);
      
      const uploadResult = await uploadBytes(audioRef, blob);
      const audioUrl = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        senderId,
        senderName: currentUser.name,
        audioUrl,
        createdAt: serverTimestamp(),
      });

      const updateData: any = {
        lastMessage: '🎵 Áudio',
        updatedAt: serverTimestamp(),
      };
      if (otherId) {
        updateData[`unreadCount.${otherId}`] = increment(1);
      }
      
      await updateDoc(doc(db, 'chats', chat.id), updateData);
    } catch (error) {
      console.error("Error sending audio:", error);
      alert("Erro ao enviar áudio.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    const senderId = (currentUser.role === 'STUDENT' && currentUser.studentId) ? currentUser.studentId : currentUser.id;

    const otherId = chat.participants.find(p => p !== senderId);

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        senderId,
        senderName: currentUser.name,
        text,
        createdAt: serverTimestamp(),
      });

      // Update chat metadata and increment unread count for other person
      const updateData: any = {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      };
      if (otherId) {
        updateData[`unreadCount.${otherId}`] = increment(1);
      }
      
      await updateDoc(doc(db, 'chats', chat.id), updateData);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#003366]">
      {/* Header */}
      <div className="p-4 border-b border-[#003366] flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1">
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-[#003366] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#003366] ring-opacity-10">
            {otherName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-[#003366]">{otherName}</p>
            <p className="text-[8px] font-mono opacity-70 uppercase text-[#003366] font-bold">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="text-center py-4">
          <span className="text-[8px] font-mono uppercase bg-white bg-opacity-10 border border-white border-opacity-20 px-3 py-1 text-white opacity-60">
            Início da Conversa
          </span>
        </div>
        
        {messages.map((m, idx) => {
          const senderId = (currentUser.role === 'STUDENT' && currentUser.studentId) ? currentUser.studentId : currentUser.id;
          const isOwn = m.senderId === senderId;
          
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
                  <div className={`rounded-sm p-3 text-xs leading-relaxed ${
                    isOwn 
                      ? 'bg-white text-[#003366] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]' 
                      : 'bg-blue-100 text-[#003366] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]'
                  }`}>
                    {m.text && <p>{m.text}</p>}
                    {m.audioUrl && (
                      <div className="flex items-center gap-2 py-1">
                        <AudioPlayer url={m.audioUrl} invert={isOwn} />
                      </div>
                    )}
                    <div className={`mt-1 flex items-center gap-1 text-[8px] font-mono justify-end font-bold opacity-60 text-[#003366]`}>
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

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#003366] border-opacity-10">
        <div className="flex gap-2 items-center">
          {!newMessage.trim() && (
            <VoiceRecorder onRecordingComplete={handleSendAudio} disabled={isSending} />
          )}
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            placeholder="Escreva uma mensagem..." 
            className="flex-1 p-3 border border-[#003366] border-opacity-20 text-xs focus:outline-none focus:border-opacity-100 font-sans"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-6 bg-[#003366] text-white transition-all hover:bg-opacity-90 disabled:opacity-30 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <Send size={16} />
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
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded min-w-[160px] ${invert ? 'bg-[#003366] text-white' : 'bg-[#003366] bg-opacity-10 text-[#003366]'}`}>
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
        className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${invert ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white'}`}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="flex flex-col flex-1">
        <span className="text-[8px] font-mono font-bold uppercase mb-1">Mensagem de Áudio</span>
        <div className="flex gap-0.5 h-3 items-end overflow-hidden">
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
            <div 
              key={i} 
              className={`w-1 rounded-full ${invert ? 'bg-white' : 'bg-[#003366]'} ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
              style={{ 
                height: `${(Math.sin(i * 0.5) * 40 + 60)}%`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
