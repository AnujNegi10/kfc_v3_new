
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VoiceWaveform: React.FC<{ active: boolean }> = ({ active }) => {
  const [bars, setBars] = useState<number[]>(new Array(12).fill(4));

  useEffect(() => {
    if (!active) {
      setBars(new Array(12).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars(new Array(12).fill(0).map(() => Math.random() * 24 + 4));
    }, 80);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-4">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          animate={{ height }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-1 bg-[#E4002B] rounded-full"
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
