import React, { useEffect, useState } from 'react';
import {
  OfferImageSize,
  OFFER_IMAGE_PLACEHOLDER,
  offerImageInBox,
  offerImageThumb,
  onOfferImageError,
} from '../utils/offerImageDisplay';

type OfferImageProps = {
  src?: string | null;
  alt?: string;
  /** Tailwind classes applied to the <img> (defaults to offerImageInBox). */
  className?: string;
  size?: OfferImageSize;
  /** Eager load for LCP (hero / above-the-fold). Default lazy. */
  eager?: boolean;
  /** Extra classes on the outer wrapper (must be position:relative for shimmer). */
  wrapperClassName?: string;
};

/**
 * Marketplace photo with Cloudinary thumbs, lazy decode, and shimmer until paint.
 */
export const OfferImage: React.FC<OfferImageProps> = ({
  src,
  alt = '',
  className = offerImageInBox,
  size = 'card',
  eager = false,
  wrapperClassName = 'absolute inset-0',
}) => {
  const resolved = offerImageThumb(src, size);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
    setLoaded(false);
  }, [resolved]);

  const showShimmer = !loaded && currentSrc !== OFFER_IMAGE_PLACEHOLDER;

  return (
    <div className={`${wrapperClassName} overflow-hidden bg-gray-100`}>
      {showShimmer && (
        <div className="agm-shimmer absolute inset-0 z-[1]" aria-hidden="true" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} relative z-[2]`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          onOfferImageError(e);
          setCurrentSrc(OFFER_IMAGE_PLACEHOLDER);
          setLoaded(true);
        }}
      />
    </div>
  );
};
