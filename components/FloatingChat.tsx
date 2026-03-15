import React, { useState, useRef, useEffect } from 'react';
import { getMedicalChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: "Hello! I'm Dr. Probe. Ask me anything about these questions or related medical concepts." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = getMedicalChat();
    }
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponse = "";
      const modelMsgId = (Date.now() + 1).toString();
      
      // Add empty placeholder for streaming
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: "" }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullResponse } : msg
          ));
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I encountered an error accessing the medical database. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple Markdown-like formatter for bold and lists
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let listBuffer: React.ReactNode[] = [];

    const parseBold = (str: string) => {
      // Splits text by bold markers **text**
      return str.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      // Detect bullet points (starts with * or - followed by space)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
         const content = trimmed.substring(2);
         listBuffer.push(<li key={`li-${i}`}>{parseBold(content)}</li>);
      } else {
        // Flush list if exists
        if (listBuffer.length > 0) {
          nodes.push(
            <ul key={`ul-${i}`} className="list-disc pl-5 mb-2 space-y-1">
              {listBuffer}
            </ul>
          );
          listBuffer = [];
        }
        
        // Render paragraph if content exists
        if (trimmed) {
          nodes.push(
            <p key={`p-${i}`} className="mb-2 last:mb-0">
              {parseBold(trimmed)}
            </p>
          );
        }
      }
    });

    // Flush remaining list items
    if (listBuffer.length > 0) {
      nodes.push(
        <ul key={`ul-end`} className="list-disc pl-5 mb-2 space-y-1">
          {listBuffer}
        </ul>
      );
    }

    return nodes;
  };

  return (
    <div className="relative">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all border shadow-sm ${
           isOpen 
            ? 'bg-indigo-600 text-white border-transparent' 
            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
         <div className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${isOpen ? 'bg-white/20' : 'bg-indigo-100'}`}>👩‍⚕️</div>
         <span className="font-bold text-sm">Ask Dr. Probe</span>
      </button>

      {/* Dropdown Window */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in-up z-[60] origin-top-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-indigo-200">
                👩‍⚕️
              </div>
              <span className="font-brand font-semibold text-sm">Dr. Probe Chat</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 min-h-0">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask strictly from textbooks..."
              className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingChat;