import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import remarkGfm from 'remark-gfm'
import axios from 'axios'


const createSystemMsg = (data) => ({
  id: Date.now().toString(),
  role: 'system',
  data
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchResponse(query) {
    const response = await axios.post([
      "https://aibattlearena1.onrender.com/response",
      "http://localhost:3000/response"
    ], {problem: query});
    return response.data ;
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {

    if (!input.trim()) return;  
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };


    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await fetchResponse(input); // ✅ await here

      const systemMsg = createSystemMsg(result);

      setMessages(prev => [...prev, systemMsg]);
    } catch (err) {
      console.error(err);
    }


    setIsTyping(false);


  };

  return (
    <div className="bg-[#0b0f19] text-gray-200 min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="py-6 px-10 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0b0f19]/90 backdrop-blur-md z-10 shadow-sm">
        <h1 className="text-xl tracking-wide font-light text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse block"></span>
          <span className="font-semibold text-indigo-400">AI</span> Battle Arena
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-12 pb-32">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center pt-32 opacity-60">
              <svg className="w-16 h-16 mb-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
              <h2 className="text-2xl font-light tracking-wide">Awaiting Challenge</h2>
              <p className="text-sm mt-3 text-gray-400">Send a prompt below to see the competitive models jump into action.</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="bg-indigo-600/10 text-indigo-100 border border-indigo-500/20 px-6 py-4 rounded-3xl rounded-tr-sm max-w-xl shadow-lg ring-1 ring-white/5">
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
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl flex gap-3 items-center text-sm text-gray-400">
                <span className="font-medium tracking-wide">Evaluating solutions</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-[#0b0f19] via-[#0b0f19] to-transparent pt-16 pb-8 px-4 md:px-10 flex justify-center">
        <div className="w-full max-w-4xl relative group">
          <input
            type="text"
            className="w-full bg-[#131a2b] border border-white/10 text-white pl-8 pr-16 py-5 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xl transition-all placeholder-gray-500 font-light"
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
  if (!data?.judge_recommendation) return null;
  return (
    <div className="w-full bg-[#131a2b] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-900/10">
      <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          Problem Addressed
        </h3>
        <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap font-light">{data.problem}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        <SolutionPanel
          title="Solution One"
          content={data.solution_1}
          score={data.judge_recommendation.solution_1_score}
          reasoning={data.judge_recommendation.solution_1_reasoning}
        />
        <SolutionPanel
          title="Solution Two"
          content={data.solution_2}
          score={data.judge_recommendation.solution_2_score}
          reasoning={data.judge_recommendation.solution_2_reasoning}
        />
      </div>
    </div>
  )
}

function SolutionPanel({ title, content, score, reasoning }) {
  const getScoreColor = (sc) => {
    if (sc >= 9) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (sc >= 7) return 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20';
    if (sc >= 5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
    return 'text-red-400 bg-red-400/10 border-red-500/20';
  };

  return (
    <div className="flex flex-col h-full hover:bg-white/[0.01] transition-colors">
      <div className="p-8 md:p-10 flex-1">
        <h4 className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">{title.split(' ')[1]}</span>
          <span className="text-sm font-semibold tracking-wide text-gray-300 uppercase">{title}</span>
        </h4>
        <div className="mt-8 prose prose-invert prose-pre:bg-[#0d121c] prose-pre:border prose-pre:border-white/5 prose-pre:shadow-inner max-w-none prose-p:text-gray-400 prose-headings:text-gray-200 prose-a:text-indigo-400">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    children={String(children).replace(/\n$/, '')}
                    style={vs2015}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl border border-white/5 !bg-[#0b0f19] text-[13px] leading-relaxed my-6 shadow-md"
                  />
                ) : (
                  <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[13px]">
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="p-8 md:p-10 bg-[#0d121c]/50 mt-auto border-t border-white/5">
        <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-6 flex items-center gap-2">
          Judge Evaluation
          <div className="h-px bg-white/5 flex-1"></div>
        </h5>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className={`shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl border ${getScoreColor(score)} shadow-inner`}>
            <div className="text-center">
              <div className="text-3xl font-light leading-none">{score}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">/ 10</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 leading-relaxed italic">{reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
