import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative w-full max-w-sm h-[75vh] rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-white/5">
      {/* Shimmer Background (Image Placeholder) */}
      <div className="absolute inset-0 shimmer opacity-50"></div>

      {/* Overlay Placeholder */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent z-20 flex flex-col justify-end px-5 pb-24">
           
           {/* Pills */}
           <div className="flex gap-2 mb-2">
               <div className="h-5 w-24 bg-white/10 rounded-md shimmer"></div>
               <div className="h-5 w-20 bg-white/10 rounded-md shimmer"></div>
           </div>

           {/* Name & Age */}
           <div className="h-10 w-48 bg-white/10 rounded-xl mb-2 shimmer"></div>

           {/* Bio Lines */}
           <div className="h-3 w-full bg-white/10 rounded-full mb-1 shimmer"></div>
           <div className="h-3 w-2/3 bg-white/10 rounded-full shimmer"></div>
      </div>

      {/* Actions Buttons Placeholders */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-6 z-50">
          <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 shimmer"></div>
          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 shimmer -translate-y-2"></div>
          <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 shimmer"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;