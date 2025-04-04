"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Menu, MessageSquare, Settings, Sun, Moon, LogOut, Mic } from 'lucide-react'
import { addDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Loader2, Send, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

interface IWindow extends Window {
  webkitSpeechRecognition: new () => SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type ChatHistory = {
  _id: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

type Message = {
  id: string
  content: string
  role: 'user' | 'bot'
  isStreaming?: boolean
}

export function TripEaseInterfaceComponent(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [darkMode, setDarkMode] = useState<boolean>(true)
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [initialChatId, setInitialChatId] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState<boolean>(false)
  const recognition = useRef<SpeechRecognition | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const WindowWithSpeechRecognition = window as IWindow;
      recognition.current = new WindowWithSpeechRecognition.webkitSpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = true

      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          //@ts-ignore
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }

        if (finalTranscript !== '') {
          setInputMessage(prevMessage => prevMessage + ' ' + finalTranscript);
        }
      }

      recognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const toggleListening = (): void => {
    if (isListening) {
      recognition.current?.stop()
    } else {
      recognition.current?.start()
    }
    setIsListening(!isListening)
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'authorization': token || ''
    };
  };

  const handleAuthError = (error: any) => {
    if (error.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      router.push('/login');  // Redirect to login page
    }
    console.error('API Error:', error);
  };

  async function getInitialChatId(): Promise<string> {
    try {
      const historyResponse = await fetch('https://tripease-2alb.onrender.com/chat/gethistory', {
        headers: getAuthHeaders()
      })
      if (!historyResponse.ok) {
        await handleAuthError(historyResponse);
        return "";
      }
      const historyData = await historyResponse.json()
      
      if (historyData.status === 200 && historyData.history.length > 0) {
        const mostRecentChat = historyData.history[0]
        setInitialChatId(mostRecentChat._id)
        setSelectedChatId(mostRecentChat._id)
        setChatHistory(historyData.history)
        return mostRecentChat._id
      } else {
        const newChatResponse = await fetch("https://tripease-2alb.onrender.com/chat/newchat", {
          method: "POST",
          headers: getAuthHeaders()
        })
        if (!newChatResponse.ok) {
          await handleAuthError(newChatResponse);
          return "";
        }
        const newChatData = await newChatResponse.json()
        setInitialChatId(newChatData.id)
        setSelectedChatId(newChatData.id)
        setChatHistory([{
          _id: newChatData.id,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        return newChatData.id
      }
    } catch (error) {
      handleAuthError(error);
      return "";
    }
  }

  useEffect(() => {
    const initializeChat = async () => {
      const chatId = await getInitialChatId();
      if (chatId) {
        setSelectedChatId(chatId);
        await loadChatHistory(chatId);
      }
    };
    initializeChat();
  }, []);

  const createNewChat = async (): Promise<void> => {
    try {
      const response = await fetch('https://tripease-2alb.onrender.com/chat/newchat', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (!response.ok) {
        await handleAuthError(response);
        return;
      }
      const data = await response.json()
      if (data.status === 200) {
        const newChat: ChatHistory = {
          _id: data.id,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setChatHistory(prev => [...prev, newChat])
        setSelectedChatId(newChat._id)
        setMessages([])
        setFrom('')
        setTo('')
        setStartDate(undefined)
        setEndDate(undefined)
        setInputMessage('')
        setInitialChatId(data.id)
      }
    } catch (error) {
      handleAuthError(error);
    }
  }

  const handleChatSelect = async (chatId: string): Promise<void> => {
    setSelectedChatId(chatId)
    const selectedChat = chatHistory.find(chat => chat._id === chatId)
    if (selectedChat) {
      setMessages(selectedChat.messages.slice(2))
    } else {
      try {
        const response = await fetch(`https://tripease-2alb.onrender.com/chat/getchat?id=${chatId}`, {
          headers: getAuthHeaders()
        })
        if (!response.ok) {
          await handleAuthError(response);
          return;
        }
        const data = await response.json()
        if (data.status === 200) {
          setMessages(data.chat.messages.slice(2))
          setChatHistory(prev => prev.map(chat => 
            chat._id === chatId ? { ...chat, messages: data.chat.messages } : chat
          ))
        }
      } catch (error) {
        handleAuthError(error);
      }
    }
  }

  const handleLogout = (): void => {
    localStorage.removeItem('token')
    router.push("/")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isDateDisabled = (date: Date): boolean => {
    return date < today
  }

  const handleStartDateChange = (date: Date | undefined): void => {
    setStartDate(date)
    if (date && endDate && date > endDate) {
      setEndDate(addDays(date, 1))
    }
  }

  const handleEndDateChange = (date: Date | undefined): void => {
    if (date && startDate && date < startDate) {
      setStartDate(addDays(date, -1))
    }
    setEndDate(date)
  }

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(`https://tripease-2alb.onrender.com/chat/send?id=${initialChatId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: userMessage
        })
      })
      if (!response.ok) {
        await handleAuthError(response);
        return "Sorry, I couldn't process your request. Please try again."
      }
      const data = await response.json()
      return data.response
    } catch (error) {
      handleAuthError(error);
      return "Sorry, I couldn't process your request. Please try again."
    }
  }

  const getChatTitle = (chat: ChatHistory): string => {
    const firstUserMessage = chat.messages.find(msg => msg.role === 'user')
    return firstUserMessage ? firstUserMessage.content.slice(0, 30) + '...' : 'New Chat'
  }

  const simulateBotResponse = async (userMessage: string, chatId: string): Promise<void> => {
    setIsStreaming(true)
    const botResponse = await generateBotResponse(userMessage)
    const formattedResponse = botResponse
      .replace(/^\*\s*(.*)$/gm, '<li>$1</li>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
    const wrappedResponse = `<ul>${formattedResponse}</ul>`

    const newMessage: Message = { id: Date.now().toString(), content: '', role: 'bot', isStreaming: true }
    setMessages(prev => [...prev, newMessage])

    if (wrappedResponse && typeof wrappedResponse === 'string') {
      for (let i = 0; i < wrappedResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20))
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? { ...msg, content: wrappedResponse.slice(0, i + 1) }
              : msg
          )
        )
      }
    }

    setMessages(prev =>
      prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, isStreaming: false }
          : msg
      )
    )

    setIsStreaming(false)
  }

  const handleSendMessage = async (): Promise<void> => {
    if (inputMessage.trim() === '') return
    const userMessage: Message = { id: Date.now().toString(), content: inputMessage, role: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    setChatHistory(prev => prev.map(chat => 
      chat._id === selectedChatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ))
    setFrom("");
    setTo("");

    await simulateBotResponse(inputMessage, selectedChatId!)
  }

  const loadChatHistory = async (chatIdToLoad: string) => {
    try {
      const response = await fetch(`https://tripease-2alb.onrender.com/chat/getchat?id=${chatIdToLoad}`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) {
        await handleAuthError(response);
        return;
      }
      const data = await response.json()
      if (data.status === 200) {
        setMessages(data.chat.messages.slice(2))
        setChatHistory(prev => prev.map(chat => 
          chat._id === chatIdToLoad ? { ...chat, messages: data.chat.messages } : chat
        ))
      }
    } catch (error) {
      handleAuthError(error);
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Card className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden flex flex-col border-0 rounded-none bg-background border-r border-[#ffffff1a]`}>
        <CardHeader className="p-3 space-y-0">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={() => setSidebarOpen(false)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-medium text-base">TripEase</span>
          </div>
          <Button 
            variant="outline" 
            className="w-full h-9 bg-transparent border border-input hover:bg-accent text-foreground flex items-center gap-2 text-sm font-normal"
            onClick={createNewChat}
          >
            <span className="text-lg">+</span>
            New chat
          </Button>
        </CardHeader>
        <Separator className="bg-border" />
        <ScrollArea className="flex-grow px-1.5">
          <div className="py-1.5">
            <div className="flex flex-col space-y-[2px]">
              {chatHistory.map((chat) => (
                <Button
                  key={chat._id}
                  variant="ghost"
                  className={`w-full justify-start text-[13px] py-1.5 px-2 h-8 ${
                    chat._id === selectedChatId 
                      ? 'bg-accent text-foreground' 
                      : 'text-foreground hover:bg-accent'
                  }`}
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <MessageSquare className="h-[14px] w-[14px] mr-2 flex-shrink-0" />
                  <span className="truncate">{getChatTitle(chat)}</span>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
        <Separator className="bg-border" />
        <div className="p-2">
          <div className="flex flex-col space-y-[2px]">
            <Button
              variant="ghost"
              className="w-full justify-start text-[13px] py-1.5 px-2 h-8 text-foreground hover:bg-accent"
            >
              <span className="mr-2">📁</span> Projects
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-[13px] py-1.5 px-2 h-8 text-foreground hover:bg-accent"
            >
              <MessageSquare className="h-[14px] w-[14px] mr-2" /> Chats
            </Button>
          </div>
        </div>
      </Card>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <Card className="border-0 rounded-none h-12">
          <CardContent className="flex items-center justify-between p-3 h-full">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center">
              <span className="font-medium text-base"></span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg hover:bg-[#ffffff0a] relative flex items-center justify-center"
              >
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Settings className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40">
                  <Button variant="ghost" className="w-full justify-start text-[13px] h-8" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <div className="flex-grow overflow-hidden relative">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <Card className="p-6">
                  <CardHeader>
                    <div className="text-center">
                      <div className="bg-muted rounded-full p-4 inline-block mb-4">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-4">Plan your trip with TripEase</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-4 w-full">
                      <Input 
                        placeholder="From" 
                        value={from} 
                        onChange={(e) => setFrom(e.target.value)} 
                        className="flex-1"
                      />
                      <Input 
                        placeholder="To" 
                        value={to} 
                        onChange={(e) => setTo(e.target.value)} 
                        className="flex-1"
                      />
                    </div>
                    <div className="flex space-x-4 w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            {startDate ? startDate.toDateString() : "Start Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleStartDateChange}
                            disabled={isDateDisabled}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            {endDate ? endDate.toDateString() : "End Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={handleEndDateChange}
                            disabled={(date) => isDateDisabled(date) || (startDate ? date <= startDate : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <Card
                      key={index}
                      className={`${
                        message.role === 'user' 
                          ? 'ml-auto bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      } max-w-[85%] shadow-none border-0`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-2">
                          <div
                            className="prose prose-xl dark:prose-invert max-w-none text-[16px] leading-[1.75]"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input area */}
        <Card className="border-0 rounded-none">
          <CardContent className="p-4">
            <div className="max-w-3xl mx-auto relative">
              <Textarea
                placeholder="Message TripEase..."
                className="w-full pr-20 min-h-[44px] py-3 px-4 resize-none text-[16px]"
                rows={1}
                value={inputMessage}
                onChange={(e) => {
                  if (from.length > 0 && to.length > 0 && startDate && endDate) {
                    const msg = `plan a trip from ${from} to ${to} between ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()} and ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}. Give details of flights and hotels.`
                    setInputMessage(msg + " " + e.target.value)
                  } else {
                    setInputMessage(e.target.value)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                className="absolute right-12 top-1/2 transform -translate-y-1/2 w-8 h-8"
                size="icon"
                variant="ghost"
                onClick={toggleListening}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive' : ''}`} />
              </Button>
              <Button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8"
                size="icon"
                variant="ghost"
                onClick={handleSendMessage}
                disabled={isStreaming}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-5 w-5"
                  strokeWidth="2"
                >
                  <path
                    d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}