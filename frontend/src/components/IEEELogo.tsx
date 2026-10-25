import React from 'react';

export interface IEEELogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withContainer?: boolean;
  containerClassName?: string;
  alt?: string;
}

/**
 * Reusable Official IEEE NISB Logo Component.
 * Employs high-fidelity containment, maintains 1:1 aspect ratio,
 * and ensures crisp contrast against dark themes.
 */
export const IEEELogo: React.FC<IEEELogoProps> = ({
  size = 'md',
  className = '',
  withContainer = false,
  containerClassName = '',
  alt = 'IEEE NISB logo',
}) => {
  let imgSizeClass = 'w-6 h-6';
  let containerSizeClass = 'w-9 h-9 p-1.5 rounded-lg';

  switch (size) {
    case 'sm':
      imgSizeClass = 'w-4 h-4';
      containerSizeClass = 'w-7 h-7 p-1 rounded-md';
      break;
    case 'md':
      imgSizeClass = 'w-5 h-5 sm:w-6 sm:h-6';
      containerSizeClass = 'w-9 h-9 p-1.5 rounded-lg';
      break;
    case 'lg':
      imgSizeClass = 'w-8 h-8 sm:w-10 sm:h-10';
      containerSizeClass = 'w-14 h-14 sm:w-16 sm:h-16 p-2.5 sm:p-3 rounded-xl';
      break;
    case 'xl':
      imgSizeClass = 'w-12 h-12 sm:w-16 sm:h-16';
      containerSizeClass = 'w-20 h-20 sm:w-24 sm:h-24 p-3.5 sm:p-4 rounded-2xl';
      break;
  }

  const imageNode = (
    <img
      src="/assets/ieee-nisb-logo.png"
      alt={alt}
      className={`object-contain select-none pointer-events-none transition-transform duration-200 ${imgSizeClass} ${className}`}
      loading="eager"
    />
  );

  if (withContainer) {
    return (
      <div
        className={`flex items-center justify-center bg-[#12151c] border border-gray-800/90 shadow-md flex-shrink-0 ${containerSizeClass} ${containerClassName}`}
        aria-hidden="true"
      >
        {imageNode}
      </div>
    );
  }

  return imageNode;
};
