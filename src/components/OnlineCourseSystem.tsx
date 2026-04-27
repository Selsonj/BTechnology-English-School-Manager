import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, MessageSquare, Play, GraduationCap } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

const EnglishLevels = [
  { id: 'BEGINNER', label: 'Beginner', desc: 'Can understand basic phrases.' },
  { id: 'ELEMENTARY', label: 'Elementary', desc: 'Can communicate in simple tasks.' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Can handle most travel situations.' },
  { id: 'UPPER_INTERMEDIATE', label: 'Upper Intermediate', desc: 'Can interact with native speakers fluently.' },
  { id: 'ADVANCED', label: 'Advanced', desc: 'Can express ideas fluently and spontaneously.' },
  { id: 'PROFICIENT', label: 'Proficient', desc: 'Can understand almost everything with ease.' }
];

export function PlacementTest({ onComplete }: { onComplete: (level: string) => void }) {
  const [step, setStep] = useState<'INTRO' | 'TEST' | 'RESULT'>('INTRO');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultLevel, setResultLevel] = useState<any>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: "Generate 10 multiple choice questions to assess English level from Beginner to Advanced. Each question should have 4 options and 1 correct answer. Focus on grammar, vocabulary, and situational usage.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING }
              },
              required: ["text", "options", "correctAnswer"]
            }
          }
        }
      });
      const data = JSON.parse(resp.text || '[]');
      setQuestions(data);
      setStep('TEST');
    } catch (err) {
      console.error("Failed to generate test:", err);
      // Fallback questions if AI fails
      setQuestions([
        { text: "What ____ your name?", options: ["is", "am", "are", "be"], correctAnswer: "is" },
        { text: "I ____ to the gym every morning.", options: ["goes", "go", "going", "gone"], correctAnswer: "go" },
        { text: "If I ____ more time, I would learn Japanese.", options: ["have", "had", "has", "having"], correctAnswer: "had" },
        { text: "She ____ lunch at the moment.", options: ["is having", "has", "had", "have"], correctAnswer: "is" },
        { text: "They ____ in London since 2010.", options: ["have lived", "live", "lived", "are living"], correctAnswer: "have lived" },
        { text: "I'm looking forward ____ you.", options: ["to seeing", "to see", "see", "seeing"], correctAnswer: "to seeing" },
        { text: "By the time he arrived, the film ____.", options: ["had started", "started", "has started", "is starting"], correctAnswer: "had started" },
        { text: "You ____ smoke in the hospital.", options: ["mustn't", "don't have to", "might not", "can't"], correctAnswer: "mustn't" },
        { text: "I wish I ____ speak more languages.", options: ["could", "can", "would", "will"], correctAnswer: "could" },
        { text: "That is the house ____ I was born.", options: ["where", "which", "that", "who"], correctAnswer: "where" }
      ]);
      setStep('TEST');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (ans: string) => {
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers: string[]) => {
    setLoading(true);
    try {
      const prompt = `Based on these answers to an English placement test: ${JSON.stringify(questions.map((q, i) => ({ q: q.text, studentAns: finalAnswers[i], isCorrect: finalAnswers[i] === q.correctAnswer })))}, determine the most appropriate English level. Select from: BEGINNER, ELEMENTARY, INTERMEDIATE, UPPER_INTERMEDIATE, ADVANCED, PROFICIENT. Return ONLY the JSON object with "level" and "explanation".`;
      
      const resp = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["level", "explanation"]
          }
        }
      });
      const result = JSON.parse(resp.text || '{}');
      setResultLevel(result);
      setStep('RESULT');
    } catch (err) {
      setResultLevel({ level: 'ELEMENTARY', explanation: 'Você demonstrou conhecimentos básicos do idioma.' });
      setStep('RESULT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <AnimatePresence mode="wait">
        {step === 'INTRO' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="w-20 h-20 bg-[#003366] text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Sparkles size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-sans font-bold text-[#003366] tracking-tighter">Placement Test</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Vamos descobrir o seu nível de inglês com a ajuda da nossa Inteligência Artificial para que possas começar no nível certo.
              </p>
            </div>
            <button 
              onClick={fetchQuestions}
              disabled={loading}
              className="px-8 py-4 bg-[#003366] text-white font-mono uppercase tracking-widest text-sm shadow-[8px_8px_0px_0px_rgba(0,51,102,0.2)] hover:shadow-none transition-all flex items-center gap-3 mx-auto"
            >
              {loading ? 'Gerando Teste...' : 'Começar Avaliação'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 'TEST' && (
          <motion.div 
            key="test"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <span>Questão {currentIdx + 1} de {questions.length}</span>
              <div className="h-1 flex-1 mx-4 bg-gray-100">
                <div 
                  className="h-full bg-[#003366] transition-all duration-300" 
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-sans font-bold text-[#003366]">{questions[currentIdx].text}</h3>
              <div className="grid grid-cols-1 gap-3">
                {questions[currentIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className="p-4 text-left border-2 border-gray-100 hover:border-[#003366] transition-all font-sans text-sm flex justify-between items-center group"
                  >
                    {opt}
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="p-10 border-4 border-[#003366] bg-white shadow-[12px_12px_0px_0px_rgba(0,51,102,1)] space-y-6">
              <div className="inline-block px-4 py-1 bg-[#003366] text-white font-mono text-[10px] uppercase tracking-widest">
                Seu Nível Detetado
              </div>
              <h2 className="text-5xl font-sans font-black text-[#003366]">{resultLevel.level}</h2>
              <p className="text-sm text-gray-600 font-sans leading-relaxed italic">
                "{resultLevel.explanation}"
              </p>
              
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <p className="text-[10px] font-mono text-gray-400 uppercase">Sugestão de Próximo Passo</p>
                <button 
                  onClick={() => onComplete(resultLevel.level)}
                  className="w-full py-4 bg-[#003366] text-white font-mono uppercase text-sm tracking-widest flex items-center justify-center gap-3"
                >
                  Continuar para Matrícula
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function RegistrationForm({ level, onBack }: { level: string, onBack: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const proofFile = formData.get('proof') as File;
    
    let proofDataUrl = '';
    if (proofFile && proofFile.size > 0) {
      if (proofFile.size > 800000) { // ~800KB limit for Base64 in Firestore (1MB doc limit)
        alert("O arquivo é muito grande. Por favor, envie uma imagem menor que 800KB.");
        setIsSubmitting(false);
        return;
      }
      
      try {
        proofDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(proofFile);
        });
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
    
    try {
      await addDoc(collection(db, 'onlineRegistrations'), {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        levelDetected: level,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        hasProof: !!proofDataUrl,
        proofData: proofDataUrl
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error saving registration:", err);
      alert("Erro ao enviar matrícula. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 p-8">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-3xl font-sans font-bold text-[#003366]">Matrícula Enviada!</h2>
        <p className="text-sm text-gray-500">
          Recebemos o seu comprovativo. O nosso administrador irá validar o pagamento e entrará em contacto por e-mail em até 24 horas úteis.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-[#003366] text-[#003366] font-mono text-xs uppercase"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-8">
        <button onClick={onBack} className="text-[10px] font-mono uppercase text-[#003366] opacity-60 hover:opacity-100 flex items-center gap-2">
          ← Mudar Nível
        </button>
        <h2 className="text-4xl font-sans font-bold text-[#003366] tracking-tighter">Matrícula Online</h2>
        
        <div className="p-6 bg-blue-50 border-l-4 border-[#003366] space-y-4">
          <h4 className="text-xs font-mono uppercase font-bold text-[#003366]">Informações de Pagamento</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-blue-100 pb-1">
              <span className="opacity-60">Banco</span>
              <span className="font-bold text-right">MILLENIUM ATLÂNTICO</span>
            </div>
            <div className="flex flex-col border-b border-blue-100 pb-1">
              <span className="opacity-60">IBAN</span>
              <span className="font-mono font-bold text-xs">0055 0000 1991 8865 101 2 0</span>
            </div>
            <div className="flex justify-between border-b border-blue-100 pb-1">
              <span className="opacity-60">Beneficiário</span>
              <span className="font-bold text-right text-xs">MIGUEL LONGUENDA HUNGULO</span>
            </div>
            <div className="flex justify-between border-b border-blue-100 pb-1">
              <span className="opacity-60 text-xs">Multicaixa Express</span>
              <span className="font-bold text-right">921 272 974</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="opacity-60">Valor do Curso ({level})</span>
              <span className="font-bold text-lg">15.000,00 Kz</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 italic">
            * O acesso às aulas será libertado após a validação do comprovativo bancário enviado no formulário ao lado.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 border border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase opacity-50">Nome Completo</label>
            <input required name="name" className="w-full p-2 border-b-2 border-[#003366] border-opacity-20 focus:border-opacity-100 outline-none text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase opacity-50">E-mail</label>
            <input required type="email" name="email" className="w-full p-2 border-b-2 border-[#003366] border-opacity-20 focus:border-opacity-100 outline-none text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase opacity-50">WhatsApp / Telefone</label>
            <input required name="phone" className="w-full p-2 border-b-2 border-[#003366] border-opacity-20 focus:border-opacity-100 outline-none text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase opacity-50">Comprovativo Bancário (Imagem/PDF)</label>
            <div className="mt-2 border-2 border-dashed border-[#003366] border-opacity-20 p-4 text-center">
              <input required name="proof" type="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#003366] file:text-white file:text-[10px] file:font-mono" />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#003366] text-white font-mono uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'A Enviar...' : 'Finalizar Inscrição'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LearningPortal({ enrollment }: { enrollment: any }) {
  // Mock data for lessons based on level
  const lessons = [
    { id: 1, title: 'Introduction to Grammar', duration: '12:40', locked: false },
    { id: 2, title: 'Vocabulary Mastery', duration: '15:20', locked: false },
    { id: 3, title: 'The Art of Conversation', duration: '22:15', locked: true },
    { id: 4, title: 'Final Assessment', duration: '30:00', locked: true },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-sans font-black text-[#003366]">My Journey</h1>
          <p className="text-sm font-mono uppercase opacity-50 mt-1">Nível: {enrollment.levelDetected || 'Intermediate'}</p>
        </div>
        <div className="flex items-center gap-4 bg-[#003366] text-white p-4 rounded-sm shadow-xl">
          <GraduationCap size={32} />
          <div>
            <p className="text-[9px] font-mono uppercase opacity-70">Aproveitamento Atual</p>
            <p className="text-2xl font-black">65%</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer shadow-2xl">
            <Play className="text-white opacity-40 group-hover:opacity-100 transition-opacity" size={64} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
              <h2 className="text-white text-2xl font-sans font-bold">1. Introduction to Grammar</h2>
            </div>
          </div>
          
          <div className="p-8 border border-[#003366] border-opacity-10 space-y-4">
            <h3 className="text-xl font-sans font-bold text-[#003366]">Descrição da Aula</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Nesta aula inaugural, vamos explorar os pilares fundamentais da gramática inglesa. Faremos uma revisão dos tempos verbais essenciais e como utilizá-los de forma fluida no dia a dia.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#003366] font-bold">Conteúdo do Módulo</h3>
          <div className="space-y-2">
            {lessons.map(lesson => (
              <div 
                key={lesson.id} 
                className={`p-4 border transition-all flex items-center justify-between ${
                  lesson.locked ? 'opacity-40 bg-gray-50' : 'hover:border-[#003366] cursor-pointer bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs font-mono">
                    {lesson.id}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#003366]">{lesson.title}</p>
                    <p className="text-[9px] font-mono opacity-50">{lesson.duration}</p>
                  </div>
                </div>
                {lesson.locked ? <div className="text-[8px] font-mono uppercase">Locked</div> : <Play size={12} className="text-[#003366]" />}
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-yellow-50 border border-yellow-200 space-y-3">
            <h4 className="text-xs font-bold text-yellow-800 flex items-center gap-2">
              < Sparkles size={14} />
              Requisito de Certificado
            </h4>
            <p className="text-[10px] text-yellow-700 leading-tight">
              Para desbloquear o seu certificado estilo Coursera, precisas de completar todos os testes com um mínimo de 80% de aproveitamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
