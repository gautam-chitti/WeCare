import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';

interface VoiceNavigatorProps {
  setActiveTab?: (tab: string) => void;
}

export const VoiceNavigator: React.FC<VoiceNavigatorProps & { className?: string }> = ({ setActiveTab, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let recognition: any = null;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback('Listening...');
      };

      recognition.onmax = () => {
        setIsListening(false);
      }

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        processCommand(command);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setFeedback('Error listening');
      };
    }

    if (isListening && recognition) {
      recognition.start();
    } 

    return () => {
      if (recognition) recognition.stop();
    };
  }, [isListening]);

  const processCommand = (cmd: string) => {
    setFeedback(`Heard: "${cmd}"`);
    
    // Simple command matching
    if (cmd.includes('dashboard') || cmd.includes('home') || cmd.includes('overview')) {
      setActiveTab?.('overview');
      setFeedback('Navigating to Overview');
    } else if (cmd.includes('appointment') || cmd.includes('schedule') || cmd.includes('calendar')) {
      setActiveTab?.('appointments');
      setFeedback('Navigating to Schedule');
    } else if (cmd.includes('report') || cmd.includes('record')) {
      setActiveTab?.('reports');
      setFeedback('Navigating to Reports');
    } else if (cmd.includes('doctor') || cmd.includes('find') || cmd.includes('search')) {
      setActiveTab?.('doctors'); 
      setFeedback('opening Search');
    } else if (cmd.includes('x-ray') || cmd.includes('scan') || cmd.includes('radiology')) {
      setActiveTab?.('xray');
      setFeedback('Opening AI X-Ray');
    } else if (cmd.includes('symptom') || cmd.includes('check')) {
      setActiveTab?.('symptoms');
      setFeedback('Opening Symptom Checker');
    } else if (cmd.includes('chat') || cmd.includes('message')) {
      setActiveTab?.('chat');
      setFeedback('Opening Messages');
    } else if (cmd.includes('profile') || cmd.includes('account')) {
      setActiveTab?.('profile');
      setFeedback('Opening Profile');
    } else {
      setFeedback(`Unknown command: ${cmd}`);
    }

    // Clear feedback after delay
    setTimeout(() => {
      setFeedback('');
    }, 3000);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null; // Browser doesn't support speech API
  }

  return (
    <>
      {/* Feedback Toast (Global) */}
      {feedback && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2 backdrop-blur-md whitespace-nowrap">
          <Command className="w-4 h-4" />
          <span className="font-medium text-sm">{feedback}</span>
        </div>
      )}

      {/* Mic Button (Inline Style) */}
      <button
        onClick={toggleListening}
        className={`relative p-3 rounded-xl transition-all duration-300 ${
          isListening 
            ? 'bg-red-500/20 text-red-500 animate-pulse' 
            : 'bg-secondary text-muted hover:text-main hover:bg-white/5'
        } ${className}`}
        title="Voice Command"
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </>
  );
};
