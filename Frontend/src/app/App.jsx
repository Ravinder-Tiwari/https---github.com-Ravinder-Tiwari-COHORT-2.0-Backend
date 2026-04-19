import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import remarkGfm from 'remark-gfm'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const createSystemMsg = (data) => ({
  id: Date.now().toString(),
  role: 'system',
  data
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [theme, setTheme] = useState('dark');
  const endRef = useRef(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchResponse(query) {
    const payload = { problem: query.trim() };
    console.info('POST /response payload:', payload);

    const response = await axios.post(`${API_BASE_URL}/response`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data?.result ?? response.data;
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {

    if (isTyping || !input.trim()) return;

    const query = input.trim();
    const userMsg = { id: Date.now().toString(), role: 'user', content: query };


    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await fetchResponse(query);

      const systemMsg = createSystemMsg(result);

      setMessages(prev => [...prev, systemMsg]);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Request failed';

      console.error('Failed to POST /response', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      setMessages(prev => [...prev, createSystemMsg({
        error: true,
        message
      })]);
    } finally {
      setIsTyping(false);
    }


  };

  return (
    <div className="bg-slate-50 dark:bg-[#0b0f19] text-gray-800 dark:text-gray-200 min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      <header className="py-6 px-10 border-b border-gray-200 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-300">
        <h1 className="text-xl tracking-wide font-light text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse block"></span>
          <span className="font-semibold text-indigo-500 dark:text-indigo-400">AI</span> Battle Arena
        </h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-gray-400"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-12 pb-32">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center pt-32 opacity-60">
              <svg className="w-16 h-16 mb-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
              <h2 className="text-2xl font-light tracking-wide text-slate-800 dark:text-gray-200">Awaiting Challenge</h2>
              <p className="text-sm mt-3 text-slate-500 dark:text-gray-400">Send a prompt below to see the competitive models jump into action.</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="bg-indigo-50 dark:bg-indigo-600/10 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-500/20 px-6 py-4 rounded-3xl rounded-tr-sm max-w-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/5">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="w-full">
                  <MessageCard data={msg.data} />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-4 rounded-3xl flex gap-3 items-center text-sm text-slate-500 dark:text-gray-400 shadow-sm">
                <span className="font-medium tracking-wide">Evaluating solutions</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-slate-50 via-slate-50 dark:from-[#0b0f19] dark:via-[#0b0f19] to-transparent pt-16 pb-8 px-4 md:px-10 flex justify-center transition-colors duration-300">
        <div className="w-full max-w-4xl relative group">
          <input
            type="text"
            className="w-full bg-white dark:bg-[#131a2b] border border-gray-200 dark:border-white/10 text-slate-800 dark:text-white pl-8 pr-16 py-5 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xl transition-all placeholder-slate-400 dark:placeholder-gray-500 font-light"
            placeholder="Describe your logical or structural problem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-3 top-3 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-full transition-colors flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </footer>
    </div>
  )
}

function MessageCard({ data }) {
  if (data?.error) {
    return (
      <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-5 text-red-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">Request failed</p>
        <p className="mt-2 text-sm text-red-100/90">{data.message}</p>
      </div>
    )
  }

  const graphData = data?.result ?? data;

  if (!graphData?.judge_recommendation) return null;

  return (
    <div className="w-full bg-white dark:bg-[#131a2b] border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-indigo-900/10 transition-colors duration-300">
      <div className="p-8 md:p-10 border-b border-gray-200 dark:border-white/5 bg-gradient-to-r from-slate-50 dark:from-white/[0.02] to-transparent">
        <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          Problem Addressed
        </h3>
        <div className="text-slate-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap font-light">{graphData.problem}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-white/5">
        <SolutionPanel
          title="Solution One"
          content={graphData.solution_1}
          score={graphData.judge_recommendation.solution_1_score}
          reasoning={graphData.judge_recommendation.solution_1_reasoning}
        />
        <SolutionPanel
          title="Solution Two"
          content={graphData.solution_2}
          score={graphData.judge_recommendation.solution_2_score}
          reasoning={graphData.judge_recommendation.solution_2_reasoning}
        />
      </div>
    </div>
  )
}

function SolutionPanel({ title, content, score, reasoning }) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (!content) return;
    const lines = content.split('\n');
    let currentIdx = 0;
    setDisplayedContent('');

    const timer = setInterval(() => {
      if (currentIdx < lines.length) {
        setDisplayedContent(prev => {
          const newLine = lines[currentIdx];
          return prev === '' ? newLine : prev + '\n' + newLine;
        });
        currentIdx++;
      } else {
        clearInterval(timer);
      }
    }, 70); // 70ms per line delay

    return () => clearInterval(timer);
  }, [content]);

  const getScoreColor = (sc) => {
    if (sc >= 9) return 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-500/20';
    if (sc >= 7) return 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-500/20';
    if (sc >= 5) return 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-500/20';
    return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-500/20';
  };

  const isMathText = (text) => {
    if (!text || typeof text !== 'string') return false;
    const hasOperators = /[+\-*\/=<>^]/.test(text);
    const hasNumbers = /\d/.test(text);
    const isDollarEnclosed = /^\s*\$\$.*\$\$\s*$/.test(text) || /^\s*\$.*\$\s*$/.test(text);
    const words = text.match(/[A-Za-z]{3,}/g) || [];
    return isDollarEnclosed || (hasOperators && hasNumbers && words.length <= 2 && text.length > 3);
  };

  return (
    <div className="flex flex-col h-full hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
      <div className="p-8 md:p-10 flex-1">
        <h4 className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-gray-400">{title.split(' ')[1]}</span>
          <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-gray-300 uppercase">{title}</span>
        </h4>
        <div className="mt-8 prose dark:prose-invert prose-pre:bg-slate-50 dark:prose-pre:bg-[#0d121c] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-white/5 prose-pre:shadow-inner max-w-none prose-p:text-slate-600 dark:prose-p:text-gray-400 prose-headings:text-slate-800 dark:prose-headings:text-gray-200 prose-a:text-indigo-500 dark:prose-a:text-indigo-400">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p({ node, children, className, ...props }) {
                const textContent = String(children);
                if (isMathText(textContent)) {
                  return (
                    <div className="font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 my-6 text-center text-lg overflow-x-auto shadow-sm transition-colors duration-300">
                      {textContent.replace(/\$/g, '')}
                    </div>
                  );
                }
                return <p className={className} {...props}>{children}</p>;
              },
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeStr = String(children).replace(/\n$/, '');
                if (isMathText(codeStr) && (!match || match[1] === 'math' || match[1] === 'latex')) {
                   return (
                     <div className="font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 my-6 text-center text-lg overflow-x-auto shadow-sm transition-colors duration-300">
                       {codeStr.replace(/\$/g, '')}
                     </div>
                   );
                }
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    children={codeStr}
                    style={vs2015}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl border border-gray-200 dark:border-white/5 !bg-slate-50 dark:!bg-[#0b0f19] text-[13px] leading-relaxed my-6 shadow-md transition-colors duration-300"
                  />
                ) : (
                  <code {...props} className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-mono text-[13px]">
                    {children}
                  </code>
                )
              }
            }}
          >
            {displayedContent}
          </ReactMarkdown>
        </div>
      </div>

      <div className="p-8 md:p-10 bg-slate-50 dark:bg-[#0d121c]/50 mt-auto border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-gray-500 mb-6 flex items-center gap-2">
          Judge Evaluation
          <div className="h-px bg-gray-200 dark:bg-white/5 flex-1"></div>
        </h5>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className={`shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl border ${getScoreColor(score)} shadow-inner transition-colors duration-300`}>
            <div className="text-center">
              <div className="text-3xl font-light leading-none">{score}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">/ 10</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed italic">{reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
