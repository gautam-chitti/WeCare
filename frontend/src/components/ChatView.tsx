import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Phone, Video, MoreVertical, Search, ArrowLeft, Image as ImageIcon, Paperclip } from 'lucide-react';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';
import { PrivacyMask } from './PrivacyMask';

// Helper Icon for empty state if image fails
const MessageCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
);

interface User {
  id: number;
  name: string;
  profilePicture?: string;
  role: string;
  specialization?: string;
  email?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

interface ChatViewProps {
  currentUser: any;
  initialUser?: User | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, initialUser }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(initialUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mobile View State
  const [showMobileChat, setShowMobileChat] = useState(!!initialUser);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
      try {
          const params: any = {};
          if (currentUser.activeProfile?.type === 'family') {
              params.family_member_id = currentUser.activeProfile.id;
          }
          const response = await axios.get('/api/messages/conversations', { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            params
          });
          setConversations(response.data);
      } catch (error) {
          console.error("Error fetching conversations", error);
      }
  };

  const fetchMessages = async (otherUserId: number) => {
      try {
          const params: any = {};
          if (currentUser.activeProfile?.type === 'family') {
              params.family_member_id = currentUser.activeProfile.id;
          }
          const response = await axios.get(`/api/messages/${otherUserId}`, { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            params
          });
          setMessages(response.data);
          scrollToBottom();
      } catch (error) {
          console.error("Error fetching messages", error);
      }
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeChat) return;

      try {
          const payload: any = {
            receiverId: activeChat.id,
            message: newMessage
          };
          
          if (currentUser.activeProfile?.type === 'family') {
              payload.familyMemberId = currentUser.activeProfile.id;
          }

          const response = await axios.post('/api/messages', payload, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          setMessages([...messages, response.data]);
          setNewMessage("");
          fetchConversations(); // Update last message in list
          scrollToBottom();
      } catch (error) {
          console.error("Error sending message", error);
      }
  };

  const filteredConversations = conversations.filter(c => 
      c.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      setShowMobileChat(true);
      const interval = setInterval(() => fetchMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    } else {
      setShowMobileChat(false);
    }
  }, [activeChat]);

  // Handle initial user prop changes
  useEffect(() => {
    if (initialUser) {
        setActiveChat(initialUser);
        setShowMobileChat(true);
    }
  }, [initialUser]);

  return (
    <div className="h-[calc(100vh-8rem)] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex animate-fade-in relative">
      
      {/* Sidebar - Users List */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-secondary/50 border-r border-white/10 flex-col transition-all`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.user.id}
                onClick={() => setActiveChat(conv.user)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                  activeChat?.id === conv.user.id ? 'bg-white/5 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                      {conv.user.profilePicture ? (
                        <PrivacyMask className="block w-full h-full">
                            <img 
                            src={getValidImageUrl(conv.user.profilePicture)} 
                            alt={conv.user.name}
                            className="w-full h-full object-cover"
                            />
                        </PrivacyMask>
                      ) : (
                        <PrivacyMask className="block w-full h-full">
                            <img 
                            src={getDefaultAvatar(undefined)} 
                            alt={conv.user.name}
                            className="w-full h-full object-cover"
                            />
                        </PrivacyMask>
                      )}
                    </div>
                    {/* Online Status Dot (Mock) */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {(() => {
                        const isUnread = !conv.lastMessage.isRead && conv.lastMessage.receiverId === currentUser.id;
                        
                        return (
                        <>
                            <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`truncate transition-colors ${
                                isUnread ? 'font-black text-white' : 'font-medium text-slate-300'
                            }`}>
                                <PrivacyMask>{conv.user.name}</PrivacyMask>
                            </h3>
                            <span className={`text-xs ${
                                isUnread ? 'text-emerald-400 font-bold' : 'text-slate-500'
                            }`}>
                                {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            </div>
                            <div className="flex justify-between items-center">
                            <p className={`text-sm truncate ${
                                isUnread ? 'text-white font-bold' : 'text-slate-400 font-normal'
                            }`}>
                                {conv.lastMessage.senderId === currentUser.id ? 'You: ' : ''} 
                                <PrivacyMask>{conv.lastMessage.message}</PrivacyMask>
                            </p>
                            {isUnread && (
                                <span className="ml-2 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse"></span>
                            )}
                            </div>
                        </>
                        );
                    })()}
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-slate-500 text-sm">
                No conversations found.
             </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showMobileChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-900 absolute inset-0 md:relative z-10 md:z-auto`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-secondary/30 backdrop-blur-md flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Back Button (Mobile) */}
                <button 
                  onClick={() => {
                    setActiveChat(null);
                    setShowMobileChat(false);
                  }}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
                    {activeChat.profilePicture ? (
                         <PrivacyMask className="block w-full h-full">
                            <img src={getValidImageUrl(activeChat.profilePicture)} alt={activeChat.name} className="w-full h-full object-cover" />
                         </PrivacyMask>
                    ) : (
                         <PrivacyMask className="block w-full h-full">
                             <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white font-bold text-lg">
                                {activeChat.name.charAt(0)}
                             </div>
                         </PrivacyMask>
                    )}
                </div>
                <div>
                  <h3 className="font-bold text-white"><PrivacyMask>{activeChat.name}</PrivacyMask></h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Video className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative"
                style={{
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), url(${getValidImageUrl('mobile-chat-bg.png')})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '400px'
                }}
            >
               {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                     <MessageCircle className="w-16 h-16 mb-4" />
                     <p>No messages yet. Start the conversation!</p>
                  </div>
               ) : (
                   messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-md ${
                          isMe 
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                        }`}>
                          <p className="text-sm leading-relaxed"><PrivacyMask>{msg.message}</PrivacyMask></p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-100/70' : 'text-slate-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-secondary/30 backdrop-blur-md border-t border-white/10">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                 <button type="button" className="p-2 text-slate-400 hover:text-white transition-colors">
                    <Paperclip className="w-5 h-5" />
                 </button>
                 <div className="flex-1 relative">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                 </div>
                 <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
                 >
                   <Send className="w-5 h-5" />
                 </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 relative overflow-hidden">
             {/* Background decoration */}
             <div className="absolute inset-0 opacity-10" 
                style={{
                    backgroundImage: `url(${getValidImageUrl('mobile-chat-bg.png')})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '400px'
                }}
             />
             
             <div className="z-10 flex flex-col items-center animate-fade-in-up">
                 <img 
                    src={getValidImageUrl('chat-empty-state.png')} 
                    alt="Start Chatting" 
                    className="w-full max-w-sm h-auto mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                 />
                 <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Your Messages
                 </h3>
                 <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                   Select a conversation from the sidebar to instant message with your doctors or patients.
                 </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

