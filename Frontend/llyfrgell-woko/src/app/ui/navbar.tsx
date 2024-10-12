'use client';

import React, { useState } from 'react';
import { MobileMenuButton } from './mobileMenuButton';
import { MobileDrawer } from './mobileDrawer';
import { LogoLink } from './logoLink';
import { DesktopNavLinks } from './desktopNavLinks';
import LogOut from './logout-form';

export default function Navbar() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleToggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    }

    return (
        <>
            <div className="hidden relative py-6 sm:flex flex-col justify-center">
                <LogoLink />
                <DesktopNavLinks />
                <LogOut />
            </div>
            <div className="sm:hidden relative flex flex-row my-4">
                <LogoLink />
                <MobileMenuButton onClick={handleToggleDrawer} />
                <MobileDrawer isOpen={isDrawerOpen} onClose={handleToggleDrawer} />
                <LogOut />
            </div>
        </>
    )
}