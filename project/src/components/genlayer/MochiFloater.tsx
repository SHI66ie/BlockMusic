import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaRobot, FaMagic, FaShieldAlt, FaLightbulb } from 'react-icons/fa';

/**
 * Mochi - The GenLayer Mascot Floater
 * 
 * An interactive, AI-powered floating assistant that helps users understand 
 * the Intelligent Contract features in BlockMusic.
 */

const MOCHI_ASSETS = {
  main: 'https://raw.githubusercontent.com/genlayer-foundation/genlayer-mascot/main/assets/renders/mochi-main.png',
  love: 'https://raw.githubusercontent.com/genlayer-foundation/genlayer-mascot/main/assets/stickers/mochi-sticker-love.png',
  idea: 'https://raw.githubusercontent.com/genlayer-foundation/genlayer-mascot/main/assets/stickers/mochi-sticker-idea.png',
  cookie: 'https://raw.githubusercontent.com/genlayer-foundation/genlayer-mascot/main/assets/stickers/mochi-sticker-cookie.png',
};

const MOCHI_TIPS = [
  {
    icon: <FaRobot />,
    text: "Hi! I'm Mochi. I help run the AI that moderates your music on BlockMusic!",
    mood: 'main'
  },
  {
    icon: <FaShieldAlt />,
    text: "Did you know? Our AI check happens on-chain on GenLayer before your NFT is even minted!",
    mood: 'idea'
  },
  {
    icon: <FaMagic />,
    text: "I can recommend tracks chosen specifically for your taste by our Intelligent Contracts.",
    mood: 'love'
  },
  {
    icon: <FaLightbulb />,
    text: "Click me if you need help understanding how AI power makes this platform unique!",
    mood: 'idea'
  },
  {
    icon: <FaRobot />,
    text: "Mmm... GenLayer nodes are processing so much smart data today!",
    mood: 'cookie'
  }
];

export function MochiFloater() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [mood, setMood] = useState<'main' | 'love' | 'idea' | 'cookie'>('main');
  const [isBouncing, setIsBouncing] = useState(true);

  // Cycle tips
  const nextTip = useCallback(() => {
    const nextIdx = (currentTip + 1) % MOCHI_TIPS.length;
    setCurrentTip(nextIdx);
    setMood(MOCHI_TIPS[nextIdx].mood as any);
  }, [currentTip]);

  // Handle interaction
  const handleClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsBouncing(false);
    } else {
      nextTip();
    }
    
    // Quick reaction mood
    const originalMood = mood;
    setMood('love');
    setTimeout(() => setMood(originalMood), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 mr-2 max-w-xs bg-gray-900/95 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-2xl pointer-events-auto relative"
          >
            {/* Close Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsBouncing(true); }}
              className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 hover:text-white p-1 rounded-full border border-gray-700 shadow-lg transition-colors"
            >
              <FaTimes size={10} />
            </button>

            <div className="flex gap-3">
              <div className="mt-1 text-purple-400 text-xl flex-shrink-0">
                {MOCHI_TIPS[currentTip].icon}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-200 leading-relaxed font-medium">
                  {MOCHI_TIPS[currentTip].text}
                </p>
                <button 
                  onClick={nextTip}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider"
                >
                  Next Tip »
                </button>
              </div>
            </div>

            {/* Pointer */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gray-900 border-r border-b border-purple-500/30 rotate-45 transform" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-auto cursor-pointer relative group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        animate={isBouncing ? {
          y: [0, -10, 0],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Mochi Image */}
        <motion.img
          key={mood}
          initial={{ opacity: 0, rotate: mood === 'idea' ? 10 : 0 }}
          animate={{ opacity: 1, rotate: 0 }}
          src={MOCHI_ASSETS[mood]}
          alt="Mochi Mascot"
          className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] object-contain"
        />

        {/* Status Bubble */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-gray-900 shadow-lg"
          >
            <span className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
