// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Sparkles, Menu, MoreVertical, LayoutDashboard, History } from 'lucide-react';
import ChatMessage from './ChatMessage';

function App() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Medicare Analytics AI. Ask me about star ratings.' }
  ]); 
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    const newMessages = [...messages, { role: 'user', text: prompt }];
    setMessages(newMessages);
    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    const history = newMessages.slice(-3).map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
    ).join('\n');
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/chat', { 
        prompt: `PREVIOUS CONVERSATION:\n${history}\n\nCURRENT REQUEST: ${currentPrompt}` 
      });
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: res.data.reply,
        data: res.data.type === 'data' ? res.data.data : null 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN CONTAINER: Forces full screen height and width
    <div className="flex h-screen w-full bg-gray-50 text-slate-800 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- 
          w-64 = Fixed width 
          h-full = Full height
          bg-slate-900 = Dark background
      */}
      <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0 transition-all duration-300">
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-6 text-white font-bold tracking-wide border-b border-slate-800">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <Sparkles size={18} fill="white" />
          </div>
          <span className="text-lg">Medicare AI</span>
        </div>
        
        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Menu</div>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium transition-colors">
            <LayoutDashboard size={18} />
            <span>New Chat</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white">
            <History size={18} />
            <span>History</span>
          </button>
        </div>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button className="flex items-center gap-3 w-full p-2 hover:bg-slate-800 rounded-xl transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-2 ring-slate-900 group-hover:ring-slate-700 transition-all"></div>
            <div className="flex flex-col text-left">
              <span className="text-sm text-white font-medium">Admin User</span>
              <span className="text-xs text-slate-500">Pro Plan</span>
            </div>
          </button>
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- 
          flex-1 = Takes up remaining space
      */}
      <main className="flex-1 flex flex-col h-full relative bg-white">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-slate-700">
             <span className="font-semibold text-lg">Analysis Dashboard</span>
             <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Live</span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-slate-400 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            
            {loading && (
              <div className="flex items-center gap-3 pl-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                   <Sparkles size={14} className="text-indigo-600" />
                </div>
                <div className="flex gap-1">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto relative group">
            <input 
              type="text" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about Humana, CVS, or general market trends..."
              className="w-full p-4 pr-16 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={!prompt.trim() || loading}
              className="absolute right-2 top-2 bottom-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md aspect-square flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            AI generated content. Please verify with official CMS documents.
          </p>
        </div>

      </main>
    </div>
  );
}

export default App;