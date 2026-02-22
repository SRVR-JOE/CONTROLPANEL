'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Server,
  Grid3x3,
  Activity,
  Monitor,
  Pin,
  HardDrive,
  Save,
  Sliders,
  Camera,
  Clock,
  Circle,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Racks', icon: Server },
  { href: '/matrix', label: 'Matrix', icon: Grid3x3 },
  { href: '/health', label: 'Health', icon: Activity },
  { href: '/brompton', label: 'Brompton', icon: Monitor },
  { href: '/robo', label: 'ROBO', icon: Camera },
  { href: '/disguise-config', label: 'Disguise', icon: Sliders },
  { href: '/pinboard', label: 'Pin Board', icon: Pin },
  { href: '/devices', label: 'Devices', icon: HardDrive },
  { href: '/presets', label: 'Presets', icon: Save },
  { href: '/timecode', label: 'Timecode', icon: Clock },
  { href: '/recording', label: 'Recording', icon: Circle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar fixed left-0 top-0 z-40 flex h-screen w-16 flex-col overflow-hidden border-r border-border bg-surface/80 backdrop-blur-xl transition-all duration-300 ease-in-out hover:w-52">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          AV
        </div>
        <span className="whitespace-nowrap text-sm font-bold tracking-wide text-foreground opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
          AV CTRL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 transition-all duration-200 ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
