import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  sendChatMessage, 
  sendMultilingualChatMessage, 
  ChatMessage, 
  LanguagePreference
} from "@/lib/openai";
import { MessageSquare, Send, X, Bot, Globe, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ChatWidget: React.FC = () => {
  const { t, language: interfaceLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t("chat.welcomeMessage"),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [languageSettings, setLanguageSettings] = useState<LanguagePreference>({
    conversationLanguage: interfaceLanguage || "en",
    responseLanguage: interfaceLanguage || "en",
    translateUserInput: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Toggle language settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // Handle language setting changes
  const handleLanguageChange = (key: keyof LanguagePreference, value: string | boolean) => {
    setLanguageSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = {
      role: "user" as const,
      content: message,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Prepare context for the AI
      const allMessages: ChatMessage[] = [
        {
          role: "system",
          content: "You are ReachImpact's customer support AI assistant. You help users with questions about the ReachImpact platform, which is an AI-powered outbound calling platform with the following features: contact management, campaign setup, AI calling, follow-ups, analytics, and appointment scheduling. Be concise, helpful, and friendly.",
        },
        ...messages,
        userMessage,
      ];
      
      // Decide whether to use multilingual or regular chat
      let response;
      
      // Use multilingual chat if any language settings differ from defaults
      if (
        languageSettings.conversationLanguage !== interfaceLanguage ||
        languageSettings.responseLanguage !== languageSettings.conversationLanguage ||
        languageSettings.translateUserInput
      ) {
        response = await sendMultilingualChatMessage(allMessages, languageSettings);
      } else {
        response = await sendChatMessage(allMessages);
      }
      
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Chat button */}
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full"
          variant="default"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        
        {/* Chat window */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in">
            <div className="bg-primary-600 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("chat.assistant")}</h3>
                <div className="flex items-center space-x-1">
                  <Popover open={showSettings} onOpenChange={setShowSettings}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSettings}
                        className="text-white hover:text-white/90 h-8 w-8"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Language Settings</h4>
                        
                        {/* Conversation Language */}
                        <div className="space-y-2">
                          <Label htmlFor="conversationLanguage">Primary Conversation Language</Label>
                          <Select 
                            value={languageSettings.conversationLanguage}
                            onValueChange={(value) => handleLanguageChange('conversationLanguage', value)}
                          >
                            <SelectTrigger id="conversationLanguage">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                              <SelectItem value="ja">Japanese</SelectItem>
                              <SelectItem value="ko">Korean</SelectItem>
                              <SelectItem value="ar">Arabic</SelectItem>
                              <SelectItem value="ru">Russian</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Translation Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="translateToggle">Auto-translate your messages</Label>
                            <p className="text-xs text-gray-500">
                              Automatically translate your messages to the primary language
                            </p>
                          </div>
                          <Switch
                            id="translateToggle"
                            checked={languageSettings.translateUserInput}
                            onCheckedChange={(checked) => handleLanguageChange('translateUserInput', checked)}
                          />
                        </div>
                        
                        {/* Response Language - only show when translation is enabled */}
                        {languageSettings.translateUserInput && (
                          <div className="space-y-2">
                            <Label htmlFor="responseLanguage">Response Language</Label>
                            <p className="text-xs text-gray-500">
                              The language the AI will use to respond to you
                            </p>
                            <Select 
                              value={languageSettings.responseLanguage}
                              onValueChange={(value) => handleLanguageChange('responseLanguage', value)}
                            >
                              <SelectTrigger id="responseLanguage">
                                <SelectValue placeholder="Same as conversation language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={languageSettings.conversationLanguage}>
                                  Same as conversation language
                                </SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="zh">Chinese</SelectItem>
                                <SelectItem value="ja">Japanese</SelectItem>
                                <SelectItem value="ko">Korean</SelectItem>
                                <SelectItem value="ar">Arabic</SelectItem>
                                <SelectItem value="ru">Russian</SelectItem>
                                <SelectItem value="pt">Portuguese</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleChat}
                    className="text-white hover:text-white/90 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-primary-100">{t("chat.howCanIHelp")}</p>
            </div>
            
            <ScrollArea ref={scrollAreaRef} className="h-80 p-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start mb-4 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg shadow-sm max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary-100 text-gray-800"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg shadow-sm max-w-[80%] bg-white text-gray-800">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <div className="p-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex">
                <Input
                  ref={inputRef}
                  type="text"
                  className="flex-1 rounded-l-md focus-visible:ring-1"
                  placeholder={t("chat.typingPlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  className="rounded-l-none"
                  disabled={isLoading || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
