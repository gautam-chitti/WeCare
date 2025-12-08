import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number; // Number of skeletons to render
  containerClassName?: string; // Class for the container if count > 1
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  count = 1,
  containerClassName = ""
}) => {
  const skeletons = Array(count).fill(0).map((_, index) => (
    <div
      key={index}
      className={`
        relative overflow-hidden bg-slate-800/50 backdrop-blur-sm rounded-xl
        before:absolute before:inset-0
        before:-translate-x-full
        before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r
        before:from-transparent before:via-white/5 before:to-transparent
        ${className}
      `}
    />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return (
    <div className={containerClassName}>
      {skeletons}
    </div>
  );
};
