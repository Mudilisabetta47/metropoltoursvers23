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
          {/* Bus body */}
          <rect x="4" y="12" width="32" height="18" rx="4" fill="hsl(var(--primary))" opacity="0.15" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          {/* Windshield */}
          <rect x="26" y="14.5" width="8" height="10" rx="2" fill="hsl(var(--primary))" opacity="0.25" />
          {/* Windows */}
          <rect x="7" y="15" width="5" height="5" rx="1" stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
          <rect x="14" y="15" width="5" height="5" rx="1" stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
          <rect x="21" y="15" width="5" height="5" rx="1" stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
          {/* Wheels */}
          <circle cx="12" cy="32" r="3" fill="hsl(var(--primary))" opacity="0.3" stroke="hsl(var(--primary))" strokeWidth="1.2" />
          <circle cx="12" cy="32" r="1.2" fill="hsl(var(--primary))" />
          <circle cx="28" cy="32" r="3" fill="hsl(var(--primary))" opacity="0.3" stroke="hsl(var(--primary))" strokeWidth="1.2" />
          <circle cx="28" cy="32" r="1.2" fill="hsl(var(--primary))" />
          {/* Headlight */}
          <circle cx="34" cy="25" r="1.5" fill="hsl(var(--primary))" />
          {/* Road line accent */}
          <line x1="2" y1="38" x2="38" y2="38" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className={cn('font-bold tracking-wide text-primary-foreground', textSizes[size])}>
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
          <rect x="4" y="12" width="32" height="18" rx="4" fill="white" opacity="0.15" stroke="white" strokeWidth="1.5" />
          <rect x="26" y="14.5" width="8" height="10" rx="2" fill="white" opacity="0.25" />
          <rect x="7" y="15" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" fill="none" />
          <rect x="14" y="15" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" fill="none" />
          <rect x="21" y="15" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" fill="none" />
          <circle cx="12" cy="32" r="3" fill="white" opacity="0.3" stroke="white" strokeWidth="1.2" />
          <circle cx="12" cy="32" r="1.2" fill="white" />
          <circle cx="28" cy="32" r="3" fill="white" opacity="0.3" stroke="white" strokeWidth="1.2" />
          <circle cx="28" cy="32" r="1.2" fill="white" />
          <circle cx="34" cy="25" r="1.5" fill="white" />
          <line x1="2" y1="38" x2="38" y2="38" stroke="white" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
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
