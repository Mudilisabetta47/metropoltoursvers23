import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const busSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Icon */}
      <div className={cn(
        'relative rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105',
        iconSizes[size]
      )}>
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
        {/* Bus icon as SVG for crispness */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('relative z-10 text-primary-foreground', busSizes[size])}
        >
          <path d="M8 6v6" />
          <path d="M15 6v6" />
          <path d="M2 12h19.6" />
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
          <circle cx="7" cy="18" r="2" />
          <path d="M9 18h5" />
          <circle cx="16" cy="18" r="2" />
        </svg>
      </div>

      {/* Text */}
      <span className={cn('font-extrabold tracking-tight leading-none', textSizes[size])}>
        <span className="text-foreground">METROPOL</span>
        {' '}
        <span className="text-primary">TOURS</span>
      </span>
    </div>
  );
}

export function LogoLight({ size = 'md', className }: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const busSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn(
        'relative rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
        iconSizes[size]
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('text-white', busSizes[size])}
        >
          <path d="M8 6v6" />
          <path d="M15 6v6" />
          <path d="M2 12h19.6" />
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
          <circle cx="7" cy="18" r="2" />
          <path d="M9 18h5" />
          <circle cx="16" cy="18" r="2" />
        </svg>
      </div>
      <span className={cn('font-extrabold tracking-tight leading-none text-white', textSizes[size])}>
        METROPOL TOURS
      </span>
    </div>
  );
}
