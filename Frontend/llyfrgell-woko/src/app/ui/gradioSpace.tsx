'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';

// This component provides a floating, mobile-friendly chat window
// that embeds a Hugging Face Gradio Space using an iframe.
const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const defaultPos = useRef({ x: 16, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const dp = { x: 16, y: window.innerHeight - 72 };
    defaultPos.current = dp;
    setPos(dp);
    requestAnimationFrame(() => setReady(true));
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!pos) return;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) d.moved = true;
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 56, d.startPosX + dx)), y: Math.max(0, Math.min(window.innerHeight - 56, d.startPosY + dy)) });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.dragging = false;
    if (!wasDrag) {
      if (!isOpen) setPos({ ...defaultPos.current });
      toggleChat();
    }
  }, [isOpen]);

  if (!pos) return null;

  return (
    <>
      {/* Draggable floating chat button */}
      <button
        style={{ position: 'fixed', left: pos!.x, top: pos!.y, zIndex: 50, touchAction: 'none', transition: (!ready || dragRef.current.dragging) ? 'none' : 'left 0.4s ease, top 0.4s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="
          p-4 rounded-full shadow-lg
          bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 text-white hover:bg-orange-600
          focus:outline-none focus:ring-4 focus:ring-orange-300
          cursor-grab active:cursor-grabbing
        "
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
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
    </>
  );
};

export default App;