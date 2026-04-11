'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MobileMenuButton } from './mobileMenuButton';
import { MobileDrawer } from './mobileDrawer';
import { LogoLink } from './logoLink';
import { DesktopNavLinks } from './desktopNavLinks';
import RestTimer from './workouts/rest-timer';

export default function Navbar() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const pathname = usePathname();
    const showTimer = pathname.startsWith('/workouts');

    const handleToggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    }

    return (
        <>
            <nav className="relative bg-gradient-to-b from-stone-800/80 via-stone-900/90 to-stone-950/95 shadow-md shadow-black/30">
                <div className="hidden sm:flex justify-between items-center px-4 py-2">
                    <LogoLink />
                    <div className="flex items-center gap-4">
                        {showTimer && <RestTimer />}
                        <DesktopNavLinks />
                    </div>
                </div>
                <div className="sm:hidden flex justify-between items-center px-3 py-2">
                    <LogoLink />
                    <div className="flex items-center gap-3">
                        {showTimer && <RestTimer />}
                        <MobileMenuButton onClick={handleToggleDrawer} />
                        <MobileDrawer isOpen={isDrawerOpen} onClose={handleToggleDrawer} />
                    </div>
                </div>
            </nav>
            {/* Shelf base */}
            <div className="h-[4px] bg-gradient-to-b from-stone-700/60 via-stone-800/70 to-stone-900/40" />
        </>
    )
}
