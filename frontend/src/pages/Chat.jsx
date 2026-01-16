import React, { useContext, useEffect, useState, useRef } from 'react'
import { ChatContext } from '../context/ChatContext'
import { AppContext } from '../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { toast } from 'react-toastify'

const Chat = () => {
    const { partnerId } = useParams()
    const navigate = useNavigate()
    const { userData, doctors } = useContext(AppContext)
    const {
        socket,
        messages,
        conversations,
        getUserConversations,
        selectedChat,
        setSelectedChat,
        loadConversation,
        sendMessage,
        sendFile,
        onlineUsers,
        isLoading
    } = useContext(ChatContext)

    const [newMessage, setNewMessage] = useState('')
    const [file, setFile] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const messagesEndRef = useRef(null)

    const filteredConversations = conversations.filter(chat => 
        chat.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });
        return groups;
    }

    const formatHeaderDate = (dateStr) => {
        const today = new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        if (dateStr === today) return 'Today';
        if (dateStr === yesterdayStr) return 'Yesterday';
        return dateStr;
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Handle initial partner selection from URL or conversations list
    useEffect(() => {
        if (partnerId) {
            // Find partner details from available doctors or conversations
            // For now, load conversation immediately
            loadConversation(partnerId)

            // Set selected chat if exists in conversations, else we might need to fetch partner details
            // The quick fix is to simulate a selected chat object if not found in list (e.g. first time chat)
            const chat = conversations.find(c => c.partnerId === partnerId)
            if (chat) {
                setSelectedChat(chat)
                if (doctors) {
                    const doc = doctors.find(d => d._id === partnerId)
                    if (doc) {
                        setSelectedChat({
                            partnerId: doc._id,
                            partnerName: doc.name,
                            partnerImage: doc.image,
                            lastMessage: '',
                            unreadCount: 0
                        })
                    }
                }
            }
        }
    }, [partnerId, conversations, doctors])


    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() && !file) return

        if (!socket || !socket.connected) {
            toast.error("Connection lost. Please try again.")
            return
        }

        if (file) {
            await sendFile(partnerId || selectedChat?.partnerId, file)
            setFile(null)
        } else {
            sendMessage(partnerId || selectedChat?.partnerId, newMessage)
        }
        setNewMessage('')
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("File size too large (max 5MB)")
                return
            }
            setFile(selected)
        }
    }


    return (
        <div className='flex h-[80vh] bg-white border rounded-lg overflow-hidden my-5 shadow-sm'>

            {/* Sidebar - Conversation List */}
            <div className={`w-full md:w-1/3 border-r bg-white flex flex-col ${partnerId ? 'hidden md:flex' : 'flex'}`}>
                <div className='p-4 bg-gray-50 flex items-center justify-between border-b'>
                    <h2 className='text-xl font-bold text-gray-800'>Chats</h2>
                    <div className='flex gap-3'>
                        <button className='p-2 hover:bg-gray-200 rounded-full transition-colors'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className='p-3 border-b'>
                    <div className='relative'>
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full bg-gray-100 border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-0 placeholder-gray-500'
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((chat) => (
                            <div
                                key={chat.partnerId}
                                onClick={() => navigate(`/chat/${chat.partnerId}`)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${partnerId === chat.partnerId ? 'bg-gray-100' : ''}`}
                            >
                                <div className='relative flex-shrink-0'>
                                    {chat.partnerImage ? (
                                        <img src={chat.partnerImage} alt="" className='w-12 h-12 rounded-full object-cover border border-gray-200' />
                                    ) : (
                                        <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase'>
                                            {chat.partnerName[0]}
                                        </div>
                                    )}
                                    {onlineUsers.has(chat.partnerId) && (
                                        <div className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white'></div>
                                    )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex justify-between items-baseline mb-0.5'>
                                        <h3 className='font-semibold text-[15px] text-gray-900 truncate'>{chat.partnerName}</h3>
                                        <span className='text-[11px] text-gray-400'>
                                            {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <p className='text-[13px] text-gray-500 truncate pr-2'>
                                            {chat.lastMessage.startsWith('http') ? (
                                                <span className='flex items-center gap-1'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                    </svg>
                                                    Photo
                                                </span>
                                            ) : chat.lastMessage}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <div className='bg-green-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1'>
                                                {chat.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='p-8 text-center text-gray-500'>
                            <p>No conversations yet.</p>
                            <p className='text-sm mt-2'>Book an appointment to start chatting!</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col ${!partnerId ? 'hidden md:flex' : 'flex'}`}>
                {partnerId ? (
                    <>
                        {/* Chat Header */}
                        <div className='p-3 border-b bg-gray-50 flex items-center justify-between shadow-sm z-10'>
                            <div className='flex items-center gap-3'>
                                <button onClick={() => navigate('/chat')} className='md:hidden p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>

                                <div className='relative cursor-pointer' onClick={() => navigate(`/doctor/${partnerId}`)}>
                                    {selectedChat?.partnerImage ? (
                                        <img src={selectedChat.partnerImage} alt="" className='w-10 h-10 rounded-full object-cover border border-gray-200' />
                                    ) : (
                                        <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase border border-gray-200'>
                                            {selectedChat?.partnerName?.[0] || 'D'}
                                        </div>
                                    )}
                                    {onlineUsers.has(partnerId) && (
                                        <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className='font-semibold text-gray-900 leading-tight'>{selectedChat?.partnerName || 'Doctor'}</h3>
                                    <p className={`text-[11px] ${onlineUsers.has(partnerId) ? 'text-green-600' : 'text-gray-500'}`}>
                                        {onlineUsers.has(partnerId) ? 'online' : 'offline'}
                                    </p>
                                </div>
                            </div>

                            <div className='flex items-center gap-1'>
                                <button className='p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </button>
                                <button className='p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className='flex-1 overflow-y-auto p-4 bg-[#efe7dd] relative space-y-2 custom-scrollbar'>
                            {/* Background Pattern Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>
                            
                            <div className="relative z-0 space-y-2">
                                {isLoading ? (
                                    <div className='flex justify-center mt-10'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div></div>
                                ) : (
                                    Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                                        <div key={date} className="space-y-2">
                                            <div className="flex justify-center my-4">
                                                <span className="bg-white px-3 py-1 rounded-lg text-[11px] text-gray-500 uppercase shadow-sm border border-gray-100 font-medium tracking-wider">
                                                    {formatHeaderDate(date)}
                                                </span>
                                            </div>
                                            {dateMessages.map((msg, index) => {
                                                const isMe = msg.senderId === userData._id;
                                                return (
                                                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                                        <div className={`relative max-w-[75%] px-3 py-1.5 shadow-sm ${isMe ? 'bg-[#d9fdd3] rounded-l-lg rounded-br-lg' : 'bg-white rounded-r-lg rounded-bl-lg'}`}>
                                                            
                                                            {/* Bubble Tail */}
                                                            <div className={`absolute top-0 w-2 h-2 ${isMe ? '-right-1.5 bg-[#d9fdd3]' : '-left-1.5 bg-white'}`} style={{ clipPath: isMe ? "polygon(0 0, 0% 100%, 100% 0)" : "polygon(100% 0, 100% 100%, 0 0)" }}></div>

                                                            {/* File Display */}
                                                            {msg.fileUrl && (
                                                                <div className='mb-1.5'>
                                                                    {msg.fileType?.startsWith('image') ? (
                                                                        <div className='relative group'>
                                                                            <img src={msg.fileUrl} alt="attachment" className='max-h-64 rounded cursor-pointer border border-black/5' onClick={() => window.open(msg.fileUrl, '_blank')} />
                                                                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none'></div>
                                                                        </div>
                                                                    ) : (
                                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className='flex items-center gap-3 bg-black/5 p-2 rounded hover:bg-black/10 transition-colors border border-black/5'>
                                                                            <div className='p-2 bg-white rounded'>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className='text-xs font-medium text-gray-700 truncate max-w-[150px]'>{msg.fileName || 'Document'}</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className='flex flex-wrap items-end gap-2'>
                                                                <p className='text-[14.5px] text-[#111b21] leading-relaxed whitespace-pre-wrap flex-1'>{msg.message}</p>
                                                                <div className='flex items-center gap-1 min-w-fit mb-[-2px]'>
                                                                    <p className='text-[10px] text-gray-500 uppercase'>
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </p>
                                                                    {isMe && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500">
                                                                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                                                            <path fillRule="evenodd" d="M12.58 18.114l-4.59-4.59L6.93 14.58l5.65 5.65 1.15-1.15-1.15-1.15z" clipRule="evenodd" opacity="0.5" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className='p-2 bg-[#f0f2f5] border-t flex items-center gap-2'>
                            <div className='flex items-center gap-1'>
                                <button type="button" className='p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                    </svg>
                                </button>
                                
                                <label className='p-2 text-gray-500 hover:bg-gray-200 rounded-full cursor-pointer transition-colors relative'>
                                    <input type="file" onChange={handleFileChange} className='hidden' />
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                    </svg>
                                    {file && <span className='absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white'></span>}
                                </label>
                            </div>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={file ? `File: ${file.name}` : "Type a message"}
                                className='flex-1 bg-white border-none rounded-lg px-4 py-2.5 text-[15px] focus:ring-0 placeholder-gray-500 shadow-sm'
                            />

                            <button 
                                type="submit" 
                                disabled={!newMessage.trim() && !file} 
                                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${(!newMessage.trim() && !file) ? 'text-gray-400' : 'bg-primary text-white shadow-md hover:scale-105 active:scale-95'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className='flex-1 flex flex-col items-center justify-center text-gray-500 bg-white'>
                        <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                        </div>
                        <h2 className='text-xl font-medium text-gray-700'>Welcome to HealthCare Chat</h2>
                        <p className='mt-2'>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Chat
