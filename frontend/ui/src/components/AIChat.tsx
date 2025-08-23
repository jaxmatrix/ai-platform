import { useState, useEffect, useRef } from 'preact/hooks';
import { useChatStore } from '../store/chatStore';
import { useSocket } from '../contexts/SocketContext';
import { useAIModeStore } from '../store/aiModeStore';
import type { AIMode } from '../types/chat';
// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './AIChat.css';

// Custom code component that renders SVG inline and provides syntax highlighting
const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');
  const [showCode, setShowCode] = useState(false);

  // Check if content contains SVG
  const containsSvg = codeContent.includes('<svg') && codeContent.includes('</svg>');

  if (!inline && (language === 'svg' || language === 'html') && containsSvg) {
    // For SVG/HTML code blocks that contain SVG, render the SVG and show foldable code
    return (
      <div className="my-4 flex flex-col gap-2">
        <div className="text-xs text-gray-500 font-mono">
          {language === 'svg' ? 'SVG Visualization:' : 'HTML with SVG Visualization:'}
        </div>

        {/* Render the SVG/HTML content */}
        <div
          className="border border-gray-200 rounded-lg p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: codeContent }}
        />

        {/* Foldable code section */}
        <div className="mt-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-blue-500 hover:text-blue-700 font-mono flex items-center gap-1"
          >
            {showCode ? '▼' : '▶'} {showCode ? 'Hide' : 'Show'} Code
          </button>

          {showCode && (
            <div className="mt-2">
              <SyntaxHighlighter
                language={language === 'svg' ? 'xml' : 'html'}
                style={vscDarkPlus}
                customStyle={{
                  margin: '0',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
                showLineNumbers={true}
                {...props}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!inline && (language === 'html' || language === 'svg')) {
    // For HTML/SVG without SVG content, show as regular code
    return (
      <SyntaxHighlighter
        language={language === 'svg' ? 'xml' : 'html'}
        style={vscDarkPlus}
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers={false}
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
    );
  }

  if (!inline && language) {
    // For code blocks with language, use syntax highlighter
    return (
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers={false}
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
    );
  }

  if (!inline) {
    // For code blocks without language, use simple code styling
    return (
      <SyntaxHighlighter
        language="text"
        style={vscDarkPlus}
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers={false}
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
    );
  }

  // For inline code
  return (
    <code className={`${className} bg-gray-200 px-1 py-0.5 rounded text-sm font-mono`} {...props}>
      {children}
    </code>
  );
};

// Custom components configuration
const components = {
  code: CodeComponent,
  // Disable potentially problematic elements
  iframe: () => null,
  script: () => null,
  object: () => null,
  embed: () => null,
};

export function AIChat() {
  const { messages, addMessage, chatid } = useChatStore();
  const { socket, isConnected } = useSocket();
  const { mode, setMode } = useAIModeStore();
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    // Add user message to store
    addMessage({
      content: input,
      role: 'user',
      chatid,
    });

    // Send message via socket
    socket.emit('user_message', {
      chatid,
      content: input,
      timestamp: new Date().toISOString(),
      aiMode: mode,
    });

    // Clear input and contentEditable div
    setInput('');
    const inputDiv = document.querySelector('[contenteditable]') as HTMLDivElement;
    if (inputDiv) {
      inputDiv.innerText = '';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: insert new line (default behavior)
        return;
      } else {
        // Enter: send message
        e.preventDefault();
        if (input.trim() && socket && isConnected) {
          handleSubmit(new Event('submit'));
        }
      }
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setInput(target.innerText || '');
  };


  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Chat</h2>
          <div className="flex items-center gap-4">
            {/* AI Mode Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-gray-700">{mode}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {(['test-chat', 'spec1'] as AIMode[]).map((aiMode) => (
                      <button
                        key={aiMode}
                        onClick={() => {
                          setMode(aiMode);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${mode === aiMode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                      >
                        {aiMode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="w-full chat-message"
          >
            <div
              className={`px-6 py-4 rounded-lg ${message.role === 'user'
                ? 'chat-message-user'
                : 'chat-message-ai'
                }`}
            >
              <div className="text-sm text-left w-full markdown-content">
                <ReactMarkdown
                  components={components}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <p className={`text-xs opacity-70 mt-2 text-left ${message.role === 'user' ? 'text-gray-200' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Type your message (Markdown supported):
            </label>
            <div className="relative">
              <div
                contentEditable
                onInput={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[120px] max-h-[300px] p-4 pb-8 border-2 border-gray-300 rounded-lg 
                           bg-white text-gray-900 text-sm leading-relaxed
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                           hover:border-gray-400 transition-all duration-200
                           overflow-y-auto resize-none
                           before:content-[attr(data-placeholder)] before:text-gray-400 before:pointer-events-none
                           empty:before:block before:absolute"
                data-placeholder={input ? "" : "Type your message here... (Shift+Enter for new line, Enter to send)"}
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
                suppressContentEditableWarning={true}
              />

            </div>

            {/* Helpful text - moved below with better spacing */}
            <div className="w-full mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              {/* Character count indicator */}
              <div className="text-xs text-gray-400 bg-white/90 px-2 py-1 rounded shadow-sm border">
                {input.length} chars
              </div>
              <div className="w-100 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-3">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 rounded border">Enter</kbd>
                  <span>
                    Send message
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 rounded border">Shift</kbd>
                  +
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 rounded border">Enter</kbd>
                  New line
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

            <div className="flex gap-2 flex-shrink-0 justify-end">
              <button
                type="button"
                onClick={() => {
                  const inputDiv = document.querySelector('[contenteditable]') as HTMLDivElement;
                  if (inputDiv) {
                    inputDiv.innerText = '';
                    setInput('');
                    inputDiv.focus();
                  }
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md 
                           hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200
                           transition-all duration-200 whitespace-nowrap"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={!isConnected || !input.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-md font-medium
                           hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400
                           transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
