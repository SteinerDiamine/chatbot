import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_history')
        .select('user_query, chatbot_response')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const history = data.flatMap(entry => [
          { role: 'user' as const, content: entry.user_query },
          { role: 'assistant' as const, content: entry.chatbot_response }
        ]);
        setMessages(history);
      }
    };

    loadChatHistory();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ prompt: input, pdfText })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const { response: botResponse } = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfName(file.name);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: arrayBuffer
        });

        if (!response.ok) {
          throw new Error('Failed to parse PDF');
        }

        const { text } = await response.json();
        setPdfText(text);
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-md p-4">
        <h1 className="text-xl font-bold">PDF Chatbot</h1>
        <div className="flex items-center mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {pdfName ? `Change PDF (${pdfName})` : 'Upload PDF'}
          </button>
          {pdfName && (
            <button
              onClick={() => {
                setPdfText('');
                setPdfName('');
              }}
              className="ml-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={isLoading}
            >
              Clear PDF
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {pdfText ? 'Ask a question about the PDF' : 'Upload a PDF to start chatting'}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-100 ml-auto max-w-3/4' : 'bg-gray-200 mr-auto max-w-3/4'}`}
            >
              <p>{message.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 shadow-md">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-blue-300"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}