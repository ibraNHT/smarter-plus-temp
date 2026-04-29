/**
 * Styling for offer / cart / product photos in a fixed box.
 * `object-cover` crops to fill the frame and often looks "zoomed in";
 * `object-contain` shows the full image with possible letterboxing on a neutral background.
 */
export const offerImageInBox = 'h-full w-full object-contain object-center';

/** Large detail/hero: center in padded area, never crop the photo. */
export const offerImageHero =
  'max-h-full max-w-full object-contain object-center';
