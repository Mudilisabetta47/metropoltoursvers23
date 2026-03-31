import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const containerSizes = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center', containerSizes[size], className)}>
      {/* Elegant shield/crest icon */}
      <div className={cn(
        'relative flex items-center justify-center',
        iconSizes[size]
      )}>
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          {/* Shield shape */}
          <path
            d="M20 2L36 8V20C36 30 28 36 20 38C12 36 4 30 4 20V8L20 2Z"
            fill="hsl(var(--primary))"
            opacity="0.15"
          />
          <path
            d="M20 2L36 8V20C36 30 28 36 20 38C12 36 4 30 4 20V8L20 2Z"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Stylized M letter */}
          <path
            d="M12 27V14L16.5 22L20 14L23.5 22L28 14V27"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Small star accent */}
          <circle cx="20" cy="10" r="1.5" fill="hsl(var(--primary))" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className={cn('font-bold tracking-wide text-foreground', textSizes[size])}>
          METROPOL
        </span>
        <span className={cn('font-medium text-primary uppercase', subtextSizes[size])}>
          Tours
        </span>
      </div>
    </div>
  );
}

export function LogoLight({ size = 'md', className }: LogoProps) {
  const containerSizes = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center', containerSizes[size], className)}>
      <div className={cn(
        'relative flex items-center justify-center',
        iconSizes[size]
      )}>
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          <path
            d="M20 2L36 8V20C36 30 28 36 20 38C12 36 4 30 4 20V8L20 2Z"
            fill="white"
            opacity="0.15"
          />
          <path
            d="M20 2L36 8V20C36 30 28 36 20 38C12 36 4 30 4 20V8L20 2Z"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M12 27V14L16.5 22L20 14L23.5 22L28 14V27"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="20" cy="10" r="1.5" fill="white" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className={cn('font-bold tracking-wide text-white', textSizes[size])}>
          METROPOL
        </span>
        <span className={cn('font-medium text-white/80 uppercase', subtextSizes[size])}>
          Tours
        </span>
      </div>
    </div>
  );
}
