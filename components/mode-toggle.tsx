'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className="flex w-full items-center justify-between opacity-0 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4" /> {/* placeholder */}
                    <span className="text-xs">Theme</span>
                </div>
                <Switch id="mode-toggle" checked={false} disabled />
            </div>
        );
    }

    const isLight = theme === 'light';
    const toggleTheme = () => setTheme(isLight ? 'dark' : 'light');

    return (
        <div className="flex w-full items-center justify-between cursor-pointer" onClick={toggleTheme}>
            <div className="flex items-center gap-2 ml-2">
                {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="text-xs">{isLight ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <Switch id="mode-toggle" checked={isLight} onCheckedChange={toggleTheme} />
        </div>
    );
}
