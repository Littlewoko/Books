'use client'

import React, { useState } from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';

// This component provides a floating, mobile-friendly chat window
// that embeds a Hugging Face Gradio Space using an iframe.
const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the chat window's visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    // Main container for the entire floating UI, fixed to the bottom-right of the viewport.
    <div className="fixed bottom-4 right-4 z-50">
      
      {/* The floating chat button */}
      <button 
        onClick={toggleChat}
        className="
          p-4 rounded-full shadow-lg transition-all duration-300
          bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 text-white hover:bg-orange-600
          focus:outline-none focus:ring-4 focus:ring-orange-300
          transform hover:scale-110
        "
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {/* Using a MUI icon for a modern, clean look */}
        {isOpen ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
      </button>

      {/* The chat window container, which conditionally renders based on 'isOpen' state. */}
      <div
        className={`
          fixed inset-x-4 top-4 bottom-[5rem]
          bg-white rounded-xl shadow-2xl transition-all duration-500 transform
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
          flex flex-col overflow-hidden
        `}
      >
        {/* Chat header with a close button */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 text-white rounded-t-xl">
          <h2 className="text-lg font-bold">Ask Dracula!</h2>
          <button 
            onClick={toggleChat}
            className="text-white hover:text-gray-200 transition-colors focus:outline-none"
            aria-label="Close chat window"
          >
            {/* Using a MUI icon for the close button in the header as well */}
            <CloseIcon />
          </button>
        </div>

        <iframe
          src="https://littlewoko-llyfrgell-woko-dracula.hf.space"
          className="w-full h-full border-none rounded-b-xl"
          title="Hugging Face Gradio Chat"
        />
      </div>
    </div>
  );
};

export default App;