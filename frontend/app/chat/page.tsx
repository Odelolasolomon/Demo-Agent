"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { CustomLoader } from "@/components/custom-loader";
import { Sidebar } from "@/components/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';

import { useChat } from "@ai-sdk/react";
import { CopyIcon, EditIcon, RefreshCcwIcon, Volume2Icon, SquareIcon } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const suggestions = [
  "Should I invest in buying Bitcoin now?",
  "what stocks are likely to perform well this quarter?",
  "BTC vs ETH - which is a better investment?",
];

const ASSETS = [
  "BTC",
  "ETH",
  "BNB",
  "ADA",
  "SOL",
  "XRP",
  "DOT",
  "DOGE",
  "AVAX",
  "MATIC",
] as const;

const TIMEFRAMES = ["short", "medium", "long"] as const;

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "sw-KE", name: "Swahili" },
  { code: "yo-NG", name: "Yoruba" },
  { code: "ha-NG", name: "Hausa" },
  { code: "ig-NG", name: "Igbo" },
  { code: "am-ET", name: "Amharic" },
  { code: "zu-ZA", name: "Zulu" },
  { code: "fr-FR", name: "French" },
] as const;

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("id");

  const [input, setInput] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("medium");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US");
  const [userId, setUserId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | undefined>(conversationIdParam || undefined);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Initialize User ID
  useEffect(() => {
    let storedUserId = localStorage.getItem("multi_asset_ai_user_id");
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("multi_asset_ai_user_id", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Update conversation ID from URL
  useEffect(() => {
    if (conversationIdParam) {
      setConversationId(conversationIdParam);
    } else {
      setConversationId(undefined);
    }
  }, [conversationIdParam]);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    // @ts-ignore
    api: "/api/chat",
    body: {
      userId,
      conversationId,
      language: selectedLanguage,
    },
    onFinish: (message) => {
      setSidebarRefreshKey(prev => prev + 1);
    }
  });

  // Load conversation history if ID is present
  useEffect(() => {
    if (conversationIdParam && userId) {
      const fetchHistory = async () => {
        try {
          // Placeholder for history fetching logic
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [conversationIdParam, userId]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text.trim());

    if (!hasText) {
      return;
    }

    sendMessage(
      { text: message.text.trim() },
      {
        body: {
          asset: selectedAsset,
          timeframe: selectedTimeframe,
          userId,
          conversationId,
        },
      }
    );
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(
      { text: suggestion },
      {
        body: {
          asset: selectedAsset,
          timeframe: selectedTimeframe,
          userId,
          conversationId
        },
      }
    );
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    router.push("/chat");
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  const speak = (text: string, messageId: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speakingMessageId === messageId) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      setSpeakingMessageId(messageId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEdit = (index: number) => {
    const messageToEdit = messages[index];
    if (!messageToEdit || messageToEdit.role !== 'user') return;

    // Find text content
    const textPart = messageToEdit.parts.find(p => p.type === 'text');
    if (textPart && textPart.text) {
      setInput(textPart.text);
      // Remove setMessages call to prevent deleting history
      // setMessages(messages.slice(0, index)); 
    }
  };

  const isLoading =
    status === "submitted" ||
    (status === "streaming" &&
      !Boolean(
        messages[messages.length - 1]?.parts.some(
          (part) => part.type === "text" && Boolean(part.text)
        )
      ));

  return (
    <div className="flex h-screen w-full bg-background font-mono">
      {/* Sidebar */}
      <div className="w-64 h-full shrink-0">
        <Sidebar
          userId={userId}
          currentConversationId={conversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          refreshKey={sidebarRefreshKey}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex flex-col h-full">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Hello there! 👋"
                  description="I'm MarketSenseAI. How can I help you today?"
                />
              ) : (
                messages.map((message, messageIndex) => (
                  <Fragment key={message.id}>
                    {message.parts.map((part, partIndex) => {
                      switch (part.type) {
                        case "text":
                          const isLastMessage =
                            messages.length - 1 === messageIndex;

                          return (
                            <Fragment key={`${message.id}-${partIndex}`}>
                              <Message from={message.role}>
                                <MessageContent>
                                  <MessageResponse>{part.text}</MessageResponse>
                                </MessageContent>
                              </Message>
                              <MessageActions>
                                {message.role === "assistant" && (
                                  <>
                                    <MessageAction
                                      onClick={() => speak(part.text, message.id)}
                                      label={speakingMessageId === message.id ? "Stop" : "Speak"}
                                    >
                                      {speakingMessageId === message.id ? (
                                        <SquareIcon className="size-3 fill-current" />
                                      ) : (
                                        <Volume2Icon className="size-3" />
                                      )}
                                    </MessageAction>
                                    {isLastMessage && (
                                      <MessageAction
                                        onClick={() => regenerate()}
                                        label="Retry"
                                      >
                                        <RefreshCcwIcon className="size-3" />
                                      </MessageAction>
                                    )}
                                    <MessageAction
                                      onClick={() =>
                                        navigator.clipboard.writeText(part.text)
                                      }
                                      label="Copy"
                                    >
                                      <CopyIcon className="size-3" />
                                    </MessageAction>
                                  </>
                                )}
                                {message.role === "user" && (
                                  <MessageAction
                                    onClick={() => handleEdit(messageIndex)}
                                    label="Edit"
                                  >
                                    <EditIcon className="size-3" />
                                  </MessageAction>
                                )}
                              </MessageActions>
                            </Fragment>
                          );
                        default:
                          return null;
                      }
                    })}
                  </Fragment>
                ))
              )}

              {isLoading && <CustomLoader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="grid shrink-0 gap-4 pt-4">
            <Suggestions className="px-4">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  suggestion={suggestion}
                />
              ))}
            </Suggestions>
          </div>

          <PromptInput
            onSubmit={handleSubmit}
            className="mt-4 w-full max-w-2xl mx-auto relative mb-4"
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Type your message..."
                className="pr-12"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools className="flex items-center gap-2">
                <PromptInputSpeechButton
                  onTranscriptionChange={(text) => setInput((prev) => (prev + " " + text).trim())}
                  lang={selectedLanguage}
                />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Language:</span>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                    required
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="text-xs">
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Asset:</span>
                  <Select
                    value={selectedAsset}
                    onValueChange={setSelectedAsset}
                    required
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSETS.map((asset) => (
                        <SelectItem key={asset} value={asset} className="text-xs">
                          {asset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Timeframe:</span>
                  <Select
                    value={selectedTimeframe}
                    onValueChange={setSelectedTimeframe}
                    required
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs capitalize">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map((timeframe) => (
                        <SelectItem
                          key={timeframe}
                          value={timeframe}
                          className="text-xs capitalize"
                        >
                          {timeframe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PromptInputTools>
            </PromptInputFooter>
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim() && !status}
              className="absolute bottom-1 right-1 bg-blue-500"
            />
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
