"use client";

import { useEffect } from "react";
import { useBookTitle } from "./BreadcrumbContext";

export default function SetBookTitle({ title }: { title?: string }) {
    const { setBookTitle } = useBookTitle();
    useEffect(() => {
        setBookTitle(title);
        return () => setBookTitle(undefined);
    }, [title, setBookTitle]);
    return null;
}
