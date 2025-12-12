"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseSpeechRecognitionProps {
    onResult: (transcript: string) => void;
    lang?: string;
    continuous?: boolean;
}

export function useSpeechRecognition({
    onResult,
    lang = "en-US",
    continuous = false,
}: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const reco = new SpeechRecognition();
                reco.continuous = continuous;
                reco.interimResults = true;
                reco.lang = lang;

                reco.onresult = (event: any) => {
                    let finalTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            // Interim results could be handled here if needed
                        }
                    }
                    if (finalTranscript) {
                        onResult(finalTranscript);
                    }
                    // Fallback for non-continuous if needed or just grabbing interim
                    const current = event.results[event.results.length - 1][0].transcript;
                    // We might want to stream interim results for better UX
                    // For now, let's stick to final or just passing current
                    onResult(current);
                };

                reco.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setError(event.error);
                    setIsListening(false);
                };

                reco.onend = () => {
                    setIsListening(false);
                };

                setRecognition(reco);
            } else {
                setError("Speech recognition not supported in this browser.");
            }
        }
    }, [lang, continuous, onResult]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                recognition.start();
                setIsListening(true);
                setError(null);
            } catch (e) {
                console.error(e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    }, [recognition, isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return { isListening, startListening, stopListening, toggleListening, error, isSupported: !!recognition };
}
