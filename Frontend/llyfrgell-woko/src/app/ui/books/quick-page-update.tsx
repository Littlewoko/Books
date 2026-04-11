"use client";

import { useState, useTransition } from "react";
import { UpdateCurrentPage } from "@/app/lib/books/actions";

interface Props {
    bookId: string;
    currentPage: number | null;
}

const font = { fontFamily: 'var(--font-caveat)', fontSize: '18px', lineHeight: '28px' } as const;

export default function QuickPageUpdate({ bookId, currentPage }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(currentPage?.toString() ?? "");
    const [displayPage, setDisplayPage] = useState(currentPage);
    const [isPending, startTransition] = useTransition();

    const save = () => {
        const parsed = value.trim() === "" ? null : parseInt(value, 10);
        if (value.trim() !== "" && (isNaN(parsed!) || parsed! < 0)) return;
        setEditing(false);
        setDisplayPage(parsed);
        startTransition(() => UpdateCurrentPage(bookId, parsed));
    };

    if (!editing) {
        return (
            <div style={{ height: '28px' }} className="flex items-baseline gap-1">
                <span className="text-stone-400" style={font}>Page: </span>
                <button
                    onClick={() => { setValue(displayPage?.toString() ?? ""); setEditing(true); }}
                    className={`${isPending ? 'text-stone-400' : 'text-stone-700'} hover:text-amber-700 transition-colors`}
                    style={font}
                >
                    {displayPage ?? "—"}
                </button>
            </div>
        );
    }

    return (
        <div style={{ height: '28px' }} className="flex items-baseline gap-1">
            <span className="text-stone-400" style={font}>Page: </span>
            <input
                type="number"
                min={0}
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                className="bg-transparent border-b border-stone-400 text-stone-700 focus:outline-none w-20"
                style={font}
            />
        </div>
    );
}
