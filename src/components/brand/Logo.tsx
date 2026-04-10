import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BusSvg = ({ color = "hsl(var(--primary))" }: { color?: string }) => (
  <svg viewBox="0 0 50 40" fill="none" className="w-full h-full overflow-visible">
    {/* Exhaust puffs - visible on hover via group-hover */}
    <circle cx="2" cy="28" r="1.5" fill={color} opacity="0" className="group-hover:animate-[exhaust-1_1.2s_ease-out_infinite]" />
    <circle cx="-1" cy="26" r="1" fill={color} opacity="0" className="group-hover:animate-[exhaust-2_1.2s_ease-out_0.3s_infinite]" />
    <circle cx="0" cy="30" r="1.2" fill={color} opacity="0" className="group-hover:animate-[exhaust-3_1.2s_ease-out_0.6s_infinite]" />

    {/* Bus group - drives forward on hover */}
    <g className="transition-transform duration-700 ease-in-out group-hover:translate-x-[3px]">
      {/* Bus body with road-bounce */}
      <g className="animate-[bus-drive_2s_ease-in-out_infinite]">
        {/* Body */}
        <rect x="8" y="12" width="32" height="18" rx="4" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
        {/* Windshield */}
        <rect x="32" y="14.5" width="7" height="10" rx="2" fill={color} opacity="0.3" />
        {/* Windows */}
        <rect x="11" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
        <rect x="18" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
        <rect x="25" y="15" width="5" height="5" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
        {/* Headlight */}
        <circle cx="39" cy="25" r="1.5" fill={color} className="animate-[headlight-pulse_2s_ease-in-out_infinite]" />
        {/* Door line */}
        <line x1="15" y1="22" x2="15" y2="29" stroke={color} strokeWidth="0.8" opacity="0.4" />
      </g>

      {/* Wheels with spin */}
      <g className="animate-[wheel-spin_1s_linear_infinite]" style={{ transformOrigin: '16px 32px' }}>
        <circle cx="16" cy="32" r="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2" />
        <circle cx="16" cy="32" r="1.2" fill={color} />
        <line x1="16" y1="29.5" x2="16" y2="34.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </g>
      <g className="animate-[wheel-spin_1s_linear_infinite]" style={{ transformOrigin: '33px 32px' }}>
        <circle cx="33" cy="32" r="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2" />
        <circle cx="33" cy="32" r="1.2" fill={color} />
        <line x1="33" y1="29.5" x2="33" y2="34.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </g>
    </g>

    {/* Road */}
    <line x1="0" y1="38" x2="50" y2="38" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3 2" className="animate-[road-move_1s_linear_infinite]" />
  </svg>
);

export function Logo({ size = 'md', className }: LogoProps) {
  const containerSizes = { sm: 'gap-2', md: 'gap-2.5', lg: 'gap-3' };
  const iconSizes = { sm: 'w-9 h-8', md: 'w-11 h-10', lg: 'w-14 h-12' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center group', containerSizes[size], className)}>
      <div className={cn('relative flex items-center justify-center', iconSizes[size])}>
        <BusSvg />
      </div>
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
  const containerSizes = { sm: 'gap-2', md: 'gap-2.5', lg: 'gap-3' };
  const iconSizes = { sm: 'w-9 h-8', md: 'w-11 h-10', lg: 'w-14 h-12' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const subtextSizes = {
    sm: 'text-[9px] tracking-[0.35em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-[11px] tracking-[0.45em]',
  };

  return (
    <div className={cn('flex items-center group', containerSizes[size], className)}>
      <div className={cn('relative flex items-center justify-center', iconSizes[size])}>
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
