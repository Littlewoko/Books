'use client';

import React, {useState} from 'react';
import {usePathname} from 'next/navigation';
import {MobileMenuButton} from './mobileMenuButton';
import {MobileDrawer} from './mobileDrawer';
import {LogoLink} from './logoLink';
import {DesktopNavLinks} from './desktopNavLinks';
import RestTimer from './workouts/rest-timer';
import WorkoutSidebar from './workouts/workout-sidebar';
import SyncIndicator from './workouts/sync-indicator';

export default function Navbar() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isWorkoutSidebarOpen, setIsWorkoutSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isWorkouts = pathname.startsWith('/workouts');

    const handleToggle = () => {
        if (isWorkouts) {
            setIsWorkoutSidebarOpen(!isWorkoutSidebarOpen);
        } else {
            setIsDrawerOpen(!isDrawerOpen);
        }
    };

    return (
        <>
            <nav
                className="relative bg-gradient-to-b from-stone-800/80 via-stone-900/90 to-stone-950/95 shadow-md shadow-black/30">
                <div className="hidden sm:flex justify-between items-center px-4 py-2">
                    <LogoLink/>
                    <div className="flex items-center gap-4">
                        {isWorkouts && <SyncIndicator/>}
                        {isWorkouts && <RestTimer/>}
                        <DesktopNavLinks/>
                        {isWorkouts && (
                            <MobileMenuButton onClick={() => setIsWorkoutSidebarOpen(true)}/>
                        )}
                    </div>
                </div>
                <div className="sm:hidden flex justify-between items-center px-3 py-2">
                    <LogoLink/>
                    <div className="flex items-center gap-3">
                        {isWorkouts && <SyncIndicator/>}
                        {isWorkouts && <RestTimer/>}
                        <MobileMenuButton onClick={handleToggle}/>
                        {!isWorkouts && <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}/>}
                    </div>
                </div>
            </nav>
            {/* Shelf base */}
            <div className="h-[4px] bg-gradient-to-b from-stone-700/60 via-stone-800/70 to-stone-900/40"/>

            <WorkoutSidebar isOpen={isWorkoutSidebarOpen} onClose={() => setIsWorkoutSidebarOpen(false)}/>
        </>
    )
}
