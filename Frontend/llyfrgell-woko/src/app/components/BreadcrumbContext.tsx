"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const BreadcrumbContext = createContext<{
    bookTitle: string | undefined;
    setBookTitle: (title: string | undefined) => void;
    returnTo: string | undefined;
    setReturnTo: (returnTo: string | undefined) => void;
}>({ bookTitle: undefined, setBookTitle: () => {}, returnTo: undefined, setReturnTo: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [bookTitle, setBookTitle] = useState<string | undefined>();
    const [returnTo, setReturnTo] = useState<string | undefined>();
    return (
        <BreadcrumbContext.Provider value={{ bookTitle, setBookTitle, returnTo, setReturnTo }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbContext() {
    return useContext(BreadcrumbContext);
}

// Keep backward compat alias
export const useBookTitle = useBreadcrumbContext;
