"use client";

import { useState, useRef, useEffect } from "react";
import { Modal, Box } from "@mui/material";

interface FilterModalProps {
    onApplyFilters: (filters: {
        shortStory?: boolean | null;
        audiobook?: boolean | null;
        genre?: string;
        status?: string;
        year?: number;
    }) => void;
    currentFilters: {
        shortStory?: boolean | null;
        audiobook?: boolean | null;
        genre?: string;
        status?: string;
        year?: number;
    };
}

const LINE = 28;
const lineHeight = `${LINE}px`;
const fontStyle: React.CSSProperties = { fontSize: '18px', lineHeight, fontFamily: 'var(--font-caveat)' };

interface InlinePickerProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}

function InlinePicker({ options, value, onChange }: InlinePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} className="relative" style={{ height: lineHeight }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-stone-800 hover:text-amber-800 transition-colors p-0 m-0 border-0 bg-transparent cursor-pointer flex items-center gap-1"
                style={fontStyle}
            >
                {selected?.label || '—'}
                <span className="text-stone-400" style={{ fontSize: '12px' }}>▾</span>
            </button>

            {isOpen && (
                <div
                    className="absolute left-0 top-[28px] z-50 rounded-sm shadow-md shadow-black/20 py-1 min-w-[180px]"
                    style={{ backgroundColor: '#f5f0e1', border: '1px solid #c9b99a60' }}
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`block w-full text-left px-3 py-0 m-0 border-0 bg-transparent cursor-pointer transition-colors ${
                                opt.value === value ? 'text-amber-800' : 'text-stone-600 hover:text-amber-800'
                            }`}
                            style={fontStyle}
                        >
                            {opt.value === value && <span className="mr-1">›</span>}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FilterModal({ onApplyFilters, currentFilters }: FilterModalProps) {
    const [open, setOpen] = useState(false);
    const [shortStory, setShortStory] = useState<string>(
        currentFilters.shortStory === true ? 'true' :
        currentFilters.shortStory === false ? 'false' : 'all'
    );
    const [audiobook, setAudiobook] = useState<string>(
        currentFilters.audiobook === true ? 'true' :
        currentFilters.audiobook === false ? 'false' : 'all'
    );
    const [genre, setGenre] = useState(currentFilters.genre || '');
    const [status, setStatus] = useState(currentFilters.status || '');
    const [year, setYear] = useState(currentFilters.year?.toString() || '');

    const handleApply = () => {
        onApplyFilters({
            shortStory: shortStory === 'all' ? null : shortStory === 'true',
            audiobook: audiobook === 'all' ? null : audiobook === 'true',
            genre: genre || undefined,
            status: status || undefined,
            year: year ? parseInt(year) : undefined,
        });
        setOpen(false);
    };

    const handleClear = () => {
        setShortStory('all');
        setAudiobook('all');
        setGenre('');
        setStatus('');
        setYear('');
        onApplyFilters({});
        setOpen(false);
    };

    const activeFilterCount = [
        currentFilters.shortStory !== null && currentFilters.shortStory !== undefined,
        currentFilters.audiobook !== null && currentFilters.audiobook !== undefined,
        currentFilters.genre,
        currentFilters.status,
        currentFilters.year,
    ].filter(Boolean).length;

    const shortStoryOptions = [
        { value: 'all', label: 'All' },
        { value: 'true', label: 'Short Stories Only' },
        { value: 'false', label: 'Exclude Short Stories' },
    ];

    const audiobookOptions = [
        { value: 'all', label: 'All' },
        { value: 'true', label: 'Audiobooks Only' },
        { value: 'false', label: 'Exclude Audiobooks' },
    ];

    const statusOptions = [
        { value: '', label: 'All' },
        { value: 'completed', label: 'Completed' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'owned', label: 'Owned (Not Started)' },
        { value: 'not-owned', label: 'Not Owned' },
    ];

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-stone-600 hover:text-amber-800 transition-colors px-3 py-1"
                style={{ fontFamily: 'var(--font-caveat)', fontSize: '20px' }}
            >
                <span>✎</span>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                    <span className="text-amber-800 font-bold">({activeFilterCount})</span>
                )}
            </button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-sm overflow-hidden shadow-xl shadow-black/30 w-96 max-w-[90vw]"
                >
                    {/* Notebook header line */}
                    <div className="h-[3px] bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40" />

                    <div
                        className="relative pl-12 pr-6"
                        style={{
                            backgroundColor: '#f5f0e1',
                            backgroundImage: `repeating-linear-gradient(transparent, transparent ${LINE - 1}px, #c9b99a40 ${LINE - 1}px, #c9b99a40 ${LINE}px)`,
                            backgroundPosition: '0 0',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                        }}
                    >
                        {/* Red margin line */}
                        <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                        {/* Title */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-800" style={fontStyle}>Filter Books</span>
                        </div>

                        {/* Blank line */}
                        <div style={{ height: lineHeight }} />

                        {/* Short Stories */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-400" style={fontStyle}>Short Stories:</span>
                        </div>
                        <InlinePicker options={shortStoryOptions} value={shortStory} onChange={setShortStory} />

                        {/* Audiobooks */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-400" style={fontStyle}>Audiobooks:</span>
                        </div>
                        <InlinePicker options={audiobookOptions} value={audiobook} onChange={setAudiobook} />

                        {/* Genre */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-400" style={fontStyle}>Genre:</span>
                        </div>
                        <div style={{ height: lineHeight }}>
                            <input
                                type="text"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                placeholder="e.g., Fantasy, Fiction"
                                className="bg-transparent border-0 text-stone-800 p-0 m-0 focus:outline-none focus:ring-0 w-full placeholder-stone-300"
                                style={fontStyle}
                            />
                        </div>

                        {/* Status */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-400" style={fontStyle}>Status:</span>
                        </div>
                        <InlinePicker options={statusOptions} value={status} onChange={setStatus} />

                        {/* Completed Year */}
                        <div style={{ height: lineHeight }}>
                            <span className="text-stone-400" style={fontStyle}>Completed Year:</span>
                        </div>
                        <div style={{ height: lineHeight }}>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="e.g., 2024"
                                className="bg-transparent border-0 text-stone-800 p-0 m-0 focus:outline-none focus:ring-0 w-full placeholder-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={fontStyle}
                            />
                        </div>

                        {/* Blank line */}
                        <div style={{ height: lineHeight }} />

                        {/* Actions */}
                        <div className="flex gap-6" style={{ height: lineHeight }}>
                            <button
                                type="button"
                                onClick={handleApply}
                                className="text-amber-800 hover:text-amber-900 transition-colors p-0 m-0 border-0 bg-transparent cursor-pointer underline underline-offset-2 decoration-amber-800/40"
                                style={fontStyle}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-stone-400 hover:text-stone-600 transition-colors p-0 m-0 border-0 bg-transparent cursor-pointer"
                                style={fontStyle}
                            >
                                Clear
                            </button>
                        </div>

                        {/* Bottom blank lines */}
                        <div style={{ height: '56px' }} />
                    </div>
                </Box>
            </Modal>
        </>
    );
}
