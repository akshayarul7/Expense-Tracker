'use client';

import { useState } from 'react';
import { getMerchantDomain } from '@/lib/merchant-logos';

interface MerchantLogoProps {
  name?: string;
  category?: string;
  className?: string;
}

export function MerchantLogo({ name = '', className = '' }: MerchantLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const domain = getMerchantDomain(name);

  // Logo URL from Google Favicons (64x64 high resolution)
  // default_error=1 ensures Google returns 404 instead of a generic globe icon if missing
  const logoUrl = domain && !imgFailed
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64&default_error=1`
    : null;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 w-7 h-7 rounded-full overflow-hidden border border-border/50 bg-muted/60 ${className}`}
      title={name}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-4 h-4 object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
