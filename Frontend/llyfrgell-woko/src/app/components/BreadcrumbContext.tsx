"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const BreadcrumbContext = createContext<{
    bookTitle: string | undefined;
    setBookTitle: (title: string | undefined) => void;
}>({ bookTitle: undefined, setBookTitle: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [bookTitle, setBookTitle] = useState<string | undefined>();
    return (
        <BreadcrumbContext.Provider value={{ bookTitle, setBookTitle }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBookTitle() {
    return useContext(BreadcrumbContext);
}
