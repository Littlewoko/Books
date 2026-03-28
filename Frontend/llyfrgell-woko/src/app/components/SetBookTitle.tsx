"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "./BreadcrumbContext";

export default function SetBookTitle({ title, returnTo }: { title?: string; returnTo?: string }) {
    const { setBookTitle, setReturnTo } = useBreadcrumbContext();
    useEffect(() => {
        setBookTitle(title);
        setReturnTo(returnTo);
        return () => {
            setBookTitle(undefined);
            setReturnTo(undefined);
        };
    }, [title, returnTo, setBookTitle, setReturnTo]);
    return null;
}
