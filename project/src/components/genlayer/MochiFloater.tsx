import { useState, useCallback, useRef } from 'react';
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
  const constraintsRef = useRef(null);

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
    <div 
      ref={constraintsRef}
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{ x: window.innerWidth - 120, y: window.innerHeight - 150 }}
        className="absolute w-24 h-24 md:w-32 md:h-32 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ zIndex: 100000 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: -10 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute bottom-full mb-2 w-64 bg-gray-900/95 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-2xl relative"
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
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 border-r border-b border-purple-500/30 rotate-45 transform" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="relative group"
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
          <div className="absolute inset-0 bg-purple-600/30 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          
          {/* Mochi Image */}
          <motion.img
            key={mood}
            initial={{ opacity: 0, rotate: mood === 'idea' ? 10 : 0 }}
            animate={{ opacity: 1, rotate: 0 }}
            src={MOCHI_ASSETS[mood]}
            alt="Mochi Mascot"
            className="w-full h-full drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] object-contain relative z-10"
          />

          {/* Status Bubble */}
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-0 right-0 bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-lg z-20"
            >
              <span className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
