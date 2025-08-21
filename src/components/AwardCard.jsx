import React, { useMemo, useState } from 'react';

const AwardCard = ({ title, date, organization, description, type = 'default' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 스파클 좌표를 한 번만 생성
  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: (i * 11) % 37 - 18,
        y: ((i * 17) % 41) - 20,
        delay: i * 0.18
      })),
    []
  );

  const getAwardIcon = (type) => {
    switch (type) {
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      case 'trophy': return '🏆';
      default: return '🏅';
    }
  };

  const getCardGradient = (type) => {
    switch (type) {
      case 'gold': return 'from-yellow-400 via-yellow-500 to-yellow-600';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-500';
      case 'bronze': return 'from-orange-400 via-orange-500 to-orange-600';
      case 'trophy': return 'from-purple-400 via-purple-500 to-purple-600';
      default: return 'from-blue-400 via-blue-500 to-blue-600';
    }
  };

  const getHolographicEffect = (type) =>
    (type === 'gold' || type === 'trophy')
      ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-skew-x-12 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000'
      : '';

  return (
    <div
      className="w-72 h-96 cursor-pointer"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className="relative w-full h-full transition-transform duration-600 ease-in-out"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Side */}
        <div
          className={`absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br ${getCardGradient(type)} p-1 ${getHolographicEffect(type)} overflow-hidden`}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center relative">
            {/* 스파클 효과 - 골드/트로피일 때만 */}
            {(type === 'gold' || type === 'trophy') && (
              <>
                {sparkles.map((s, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
                    style={{ 
                      left: `calc(50% + ${s.x}px)`, 
                      top: `calc(30% + ${s.y}px)`,
                      animationDelay: `${s.delay}s`
                    }}
                  />
                ))}
              </>
            )}
            
            {/* 아이콘 - 회전 애니메이션 제거 */}
            <div className="text-8xl mb-4">
              {getAwardIcon(type)}
            </div>

            <h3 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-lg font-semibold text-gray-600">{date}</p>
            
            {/* 상단 우측 표시등 */}
            <div className="absolute top-4 right-4 flex gap-1">
              {[...Array(type === 'gold' || type === 'trophy' ? 3 : type === 'silver' ? 2 : 1)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full" />
              ))}
            </div>
            
            {/* 하단 우측 등급 표시 */}
            <div className="absolute bottom-4 right-4">
              <div className={`w-6 h-6 rounded-full ${type === 'gold' || type === 'trophy' ? 'bg-yellow-400' : type === 'silver' ? 'bg-gray-400' : 'bg-orange-400'} flex items-center justify-center text-white text-xs font-bold`}>
                {type === 'gold' || type === 'trophy' ? '★' : type === 'silver' ? '◆' : '●'}
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className={`absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br ${getCardGradient(type)} p-1`} 
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col justify-center">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Awarded by</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">{organization}</p>
              <p className="text-sm text-gray-500 mt-2">{date}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-center leading-relaxed">{description}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Prestige</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${i < (type === 'gold' || type === 'trophy' ? 5 : type === 'silver' ? 4 : 3) ? 'bg-yellow-400' : 'bg-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span>Rarity</span>
                <span className="font-bold">
                  {type === 'gold' 
                    ? 'Legendary' 
                    : type === 'trophy' 
                      ? 'Special' 
                      : type === 'silver' 
                        ? 'Rare' 
                        : 'Uncommon'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AwardCard;