import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BusSvg = ({ color = "hsl(var(--primary))" }: { color?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
    {/* Bus body with subtle bounce */}
    <g className="animate-[bus-drive_3s_ease-in-out_infinite]">
      {/* Bus body */}
      <rect x="4" y="12" width="32" height="18" rx="4" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      {/* Windshield */}
      <rect x="26" y="14.5" width="8" height="10" rx="2" fill={color} opacity="0.25" />
      {/* Windows */}
      <rect x="7" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="14" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="21" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Headlight with pulse */}
      <circle cx="34" cy="25" r="1.5" fill={color} className="animate-[headlight-pulse_2s_ease-in-out_infinite]" />
    </g>
    {/* Wheels spin independently */}
    <g className="animate-[wheel-spin_1s_linear_infinite] origin-center" style={{ transformOrigin: '12px 32px' }}>
      <circle cx="12" cy="32" r="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="32" r="1.2" fill={color} />
      <line x1="12" y1="29.5" x2="12" y2="34.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
    </g>
    <g className="animate-[wheel-spin_1s_linear_infinite] origin-center" style={{ transformOrigin: '28px 32px' }}>
      <circle cx="28" cy="32" r="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2" />
      <circle cx="28" cy="32" r="1.2" fill={color} />
      <line x1="28" y1="29.5" x2="28" y2="34.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
    </g>
    {/* Road line with dash animation */}
    <line x1="2" y1="38" x2="38" y2="38" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3 2" className="animate-[road-move_1s_linear_infinite]" />
  </svg>
);

export function Logo({ size = 'md', className }: LogoProps) {
  const containerSizes = { sm: 'gap-2', md: 'gap-2.5', lg: 'gap-3' };
  const iconSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center group', containerSizes[size], className)}>
      <div className={cn('relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110', iconSizes[size])}>
        <BusSvg />
      </div>
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
  const containerSizes = { sm: 'gap-2', md: 'gap-2.5', lg: 'gap-3' };
  const iconSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center group', containerSizes[size], className)}>
      <div className={cn('relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110', iconSizes[size])}>
        <BusSvg color="white" />
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
