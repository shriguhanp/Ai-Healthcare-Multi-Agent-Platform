import React, { useContext, useEffect, useState, useRef } from 'react'
import { DoctorChatContext } from '../../context/DoctorChatContext'
import { DoctorContext } from '../../context/DoctorContext'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const DoctorChat = () => {
    const { partnerId } = useParams()
    const navigate = useNavigate()
    const { dToken } = useContext(DoctorContext)
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
    } = useContext(DoctorChatContext)

    const [newMessage, setNewMessage] = useState('')
    const [file, setFile] = useState(null)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Handle initial partner selection from URL
    useEffect(() => {
        if (partnerId) {
            loadConversation(partnerId)
            const chat = conversations.find(c => c.partnerId === partnerId)
            if (chat) {
                setSelectedChat(chat)
            }
        }
    }, [partnerId, conversations])


    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() && !file) return

        if (!socket || !socket.connected) {
            toast.error("Connection lost. Please try again.")
            // Optional: Try to reconnect or reload
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
            if (selected.size > 5 * 1024 * 1024) {
                toast.error("File size too large (max 5MB)")
                return
            }
            setFile(selected)
        }
    }


    return (
        <div className='flex h-[80vh] bg-white border rounded-lg overflow-hidden m-5 shadow-sm'>

            {/* Sidebar - Patient List */}
            <div className={`w-full md:w-1/3 border-r bg-gray-50 flex flex-col ${partnerId ? 'hidden md:flex' : 'flex'}`}>
                <div className='p-4 border-b bg-white'>
                    <h2 className='text-lg font-semibold text-gray-800'>Patient Messages</h2>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    {conversations.length > 0 ? (
                        conversations.map((chat) => (
                            <div
                                key={chat.partnerId}
                                onClick={() => navigate(`/doctor-chat/${chat.partnerId}`)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors ${partnerId === chat.partnerId ? 'bg-blue-50' : ''}`}
                            >
                                <div className='relative'>
                                    <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase'>
                                        {chat.partnerName[0]}
                                    </div>
                                    {onlineUsers.has(chat.partnerId) && (
                                        <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                                    )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <h3 className='font-medium text-gray-900 truncate'>{chat.partnerName}</h3>
                                    <p className='text-sm text-gray-500 truncate'>
                                        {chat.lastMessage.startsWith('http') ? '📎 Attachment' : chat.lastMessage}
                                    </p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className='bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full'>
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className='p-8 text-center text-gray-500'>
                            <p>No messages yet.</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col ${!partnerId ? 'hidden md:flex' : 'flex'}`}>
                {partnerId ? (
                    <>
                        {/* Chat Header */}
                        <div className='p-4 border-b bg-white flex items-center gap-3'>
                            <button onClick={() => navigate('/doctor-chat')} className='md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>

                            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase'>
                                {selectedChat?.partnerName?.[0] || 'P'}
                            </div>
                            <div>
                                <h3 className='font-medium text-gray-900'>{selectedChat?.partnerName || 'Patient'}</h3>
                                <p className='text-xs text-green-500 flex items-center gap-1'>
                                    {onlineUsers.has(partnerId) ? '● Online' : 'Offline'}
                                </p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className='flex-1 overflow-y-auto p-4 bg-[#e5ddd5]/10 space-y-4'>
                            {isLoading ? (
                                <div className='flex justify-center mt-10'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div></div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.senderRole === 'doctor';
                                    return (
                                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-[#d9fdd3] text-gray-800' : 'bg-white border text-gray-800'}`}>

                                                {/* File Display */}
                                                {msg.fileUrl && (
                                                    <div className='mb-2'>
                                                        {msg.fileType?.startsWith('image') ? (
                                                            <img src={msg.fileUrl} alt="attachment" className='max-h-60 rounded-lg cursor-pointer' onClick={() => window.open(msg.fileUrl, '_blank')} />
                                                        ) : (
                                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className='flex items-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200 transition-colors'>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                </svg>
                                                                <span className='underline text-blue-600 truncate max-w-[150px]'>{msg.fileName || 'View Document'}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                <p className='text-sm whitespace-pre-wrap'>{msg.message}</p>
                                                <p className='text-[10px] text-gray-500 text-right mt-1'>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className='p-3 bg-gray-50 border-t flex items-center gap-2'>

                            {/* File Upload Button */}
                            <label className='p-2 text-gray-500 hover:bg-gray-200 rounded-full cursor-pointer transition-colors relative'>
                                <input type="file" onChange={handleFileChange} className='hidden' />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                {file && <span className='absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white'></span>}
                            </label>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={file ? `File selected: ${file.name}` : "Type a message"}
                                className='flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary'
                            />

                            <button type="submit" disabled={!newMessage.trim() && !file} className='p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
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
                        <h2 className='text-xl font-medium text-gray-700'>Welcome to Doctor Chat</h2>
                        <p className='mt-2'>Select a patient to view messages</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DoctorChat
