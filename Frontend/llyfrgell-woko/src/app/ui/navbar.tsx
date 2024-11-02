'use client';

import React, { useState } from 'react';
import { MobileMenuButton } from './mobileMenuButton';
import { MobileDrawer } from './mobileDrawer';
import { LogoLink } from './logoLink';
import { DesktopNavLinks } from './desktopNavLinks';

export default function Navbar() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleToggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    }

    return (
        <>
            <div className="hidden relative mx-1 my-3 sm:flex justify-between mr-3 items-center">
                <LogoLink />
                <DesktopNavLinks />
            </div>
            <div className="sm:hidden relative flex flex-row ml-1 my-3 justify-between items-center">
                <LogoLink />
                <MobileMenuButton onClick={handleToggleDrawer} />
                <MobileDrawer isOpen={isDrawerOpen} onClose={handleToggleDrawer} />
            </div>
        </>
    )
}