"use client";

import { useState } from "react";
import { QuickCompleteBook } from "@/app/lib/books/actions";
import StarRating from "./star-rating";

interface Props {
    bookId: string;
    hasStartedReading: boolean;
    returnTo?: string;
}

const font = { fontFamily: 'var(--font-caveat)', fontSize: '18px', lineHeight: '28px', height: '28px' } as const;

export default function QuickComplete({ bookId, hasStartedReading, returnTo }: Props) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const today = new Date().toISOString().split('T')[0];

    const quickCompleteWithId = QuickCompleteBook.bind(null, bookId);

    if (!open) {
        return (
            <div style={{ height: '28px' }} className="flex items-baseline justify-end">
                <button
                    onClick={() => setOpen(true)}
                    className="text-amber-700 hover:text-amber-600 transition-colors"
                    style={font}
                >
                    Mark as complete
                </button>
            </div>
        );
    }

    return (
        <form action={quickCompleteWithId}>
            <input type="hidden" name="setStarted" value={(!hasStartedReading).toString()} />
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            <input type="hidden" name="rating" value={rating} />

            <div style={{ height: '28px' }} className="flex items-baseline gap-2">
                <span className="text-stone-400" style={font}>Completed:</span>
                <input
                    type="date"
                    name="dateCompleted"
                    defaultValue={today}
                    required
                    className="bg-transparent border-none text-stone-700 focus:outline-none"
                    style={font}
                />
            </div>

            <div style={{ height: '28px' }} className="flex items-baseline gap-2">
                <span className="text-stone-400" style={font}>Rating:</span>
                <StarRating rating={rating} interactive onChange={setRating} handwritten />
            </div>

            <div style={{ height: '28px' }} className="flex items-baseline">
                <span className="text-stone-400" style={font}>Review:</span>
            </div>

            <textarea
                name="review"
                maxLength={2000}
                placeholder="Write your thoughts..."
                className="w-full bg-transparent border-none text-stone-800 placeholder-stone-300 focus:outline-none resize-none block"
                style={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)', height: '84px', padding: 0, margin: 0 }}
            />

            <div style={{ height: '28px' }} className="flex items-baseline justify-end gap-4">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-stone-400 hover:text-stone-600 transition-colors"
                    style={font}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="text-amber-700 hover:text-amber-600 transition-colors"
                    style={font}
                >
                    Done
                </button>
            </div>
        </form>
    );
}
