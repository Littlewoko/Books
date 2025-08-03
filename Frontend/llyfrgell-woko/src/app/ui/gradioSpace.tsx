'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
// The import for '@gradio/client' has been moved inside the component
// to ensure it is only processed on the client side.

// Define the expected output type for the Gradio Space's /chat endpoint.
type GradioOutput = [string[]];

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

const GradioSpace: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // We now store the Client class in state after it's dynamically imported.
    const [gradioClient, setGradioClient] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    // This effect now handles both the dynamic import and the client connection.
    useEffect(() => {
        const initializeClient = async () => {
            try {
                // Dynamically import the Client module here. This ensures it's only
                // loaded in the browser, bypassing the server-side bundler completely.
                const { Client } = await import('@gradio/client');
                const clientInstance = await Client.connect("https://littlewoko-llyfrgell-woko-dracula.hf.space");
                setGradioClient(clientInstance);
                console.log("Gradio Client connected successfully.");
            } catch (error) {
                console.error("Failed to connect to Gradio Client:", error);
                setMessages((prev) => [...prev, { text: "Error: Could not connect to the assistant.", sender: 'bot' }]);
            }
        };
        initializeClient();
    }, []); // Empty dependency array ensures this runs only once on mount.

    // Scroll to the latest message whenever messages change.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens.
    useEffect(() => {
        if (isOpen && chatInputRef.current) {
            chatInputRef.current.focus();
        }
    }, [isOpen]);

    const appendMessage = useCallback((text: string, sender: 'user' | 'bot') => {
        setMessages((prevMessages) => [...prevMessages, { text, sender }]);
    }, []);

    const sendMessage = useCallback(async () => {
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading || !gradioClient) return;

        appendMessage(userMessage, 'user');
        setInputValue('');
        setIsLoading(true);

        try {
            const result = await gradioClient.predict("/chat", {
                message: { "text": userMessage, "files": [] }
            });
            const botResponse = (result.data as GradioOutput)[0].join('\n');
            appendMessage(botResponse, 'bot');
        } catch (error) {
            console.error('Error sending message to Gradio:', error);
            appendMessage('Sorry, there was an error processing your request.', 'bot');
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, gradioClient, appendMessage]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[1000]">
            {/* Chat Toggle Button */}
            <button
                className="w-12 h-12 rounded-full bg-blue-600 text-white text-2xl border-none cursor-pointer flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="chat-container"
            >
                💬
            </button>

            {/* Chat Container */}
            <div
                id="chat-container"
                className={`fixed bottom-20 right-5 w-80 h-[400px] bg-white rounded-lg shadow-xl flex flex-col ${isOpen ? 'block' : 'hidden'}`}
            >
                {/* Chat Header */}
                <div className="p-3 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Gradio Assistant</h3>
                    <button
                        className="text-white text-2xl leading-none bg-transparent border-none cursor-pointer p-0"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                    >
                        &times;
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-grow overflow-y-auto p-3" ref={messagesEndRef}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`my-2 p-2 rounded-md max-w-[80%] ${
                                msg.sender === 'user' ? 'bg-gray-200 ml-auto' : 'bg-gray-100 mr-auto'
                            } ${
                                msg.sender === 'user' ? 'text-right' : 'text-left'
                            }`}
                        >
                            <div>{msg.text}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="my-2 p-2 rounded-md bg-gray-100 mr-auto">
                            <span className="animate-pulse">Typing...</span>
                        </div>
                    )}
                </div>

                {/* Chat Input Area */}
                <div className="p-3 border-t border-gray-200 flex items-center">
                    <input
                        type="text"
                        ref={chatInputRef}
                        className="flex-grow p-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ask a question..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading || !gradioClient}
                    />
                    <button
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={sendMessage}
                        disabled={isLoading || !gradioClient || inputValue.trim() === ''}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradioSpace;
