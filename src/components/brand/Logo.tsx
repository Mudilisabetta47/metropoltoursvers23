import { cn } from '@/lib/utils';
const logoAsset = { url: '/brand/metropol-logo.png' };
const logoLightAsset = { url: '/brand/metropol-logo-light.png' };

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LOGO_URL = logoAsset.url;
export const LOGO_LIGHT_URL = logoLightAsset.url;

const heights = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
};

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <img
      src={logoAsset.url}
      alt="METROPOL TOURS GmbH Logo"
      className={cn('w-auto object-contain', heights[size], className)}
      loading="eager"
      decoding="async"
    />
  );
}

export function LogoLight({ size = 'md', className }: LogoProps) {
  return (
    <img
      src={logoLightAsset.url}
      alt="METROPOL TOURS GmbH Logo"
      className={cn('w-auto object-contain', heights[size], className)}
      loading="eager"
      decoding="async"
    />
  );
}
