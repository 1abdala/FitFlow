import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';

/**
 * Reusable Company Logo component with clean error handling for blocked images (e.g., net::ERR_BLOCKED_BY_CLIENT).
 */
export const CompanyLogo = ({
  src,
  alt = 'Company',
  size = 18,
  fallbackText,
  style = {},
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    if (fallbackText) {
      return (
        <span 
          className={className} 
          style={{ 
            display: 'flex', 
            width: '100%', 
            height: '100%', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            color: 'var(--text-mute)',
            ...style 
          }}
        >
          {fallbackText}
        </span>
      );
    }
    return (
      <Icons.IconBriefcase 
        size={size} 
        className={className}
        style={{ color: 'var(--text-mute)', flexShrink: 0, ...style }} 
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit', ...style }}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

export default CompanyLogo;
