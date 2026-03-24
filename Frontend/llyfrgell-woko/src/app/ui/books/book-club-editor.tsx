"use client";

import { useState } from "react";
import { Typography } from "@mui/material";
import { BookClubNote } from "@/app/lib/classes/book-club-note";
import { saveBookClubNotes } from "@/app/lib/books/book-club-actions";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveIcon from '@mui/icons-material/Save';

interface Props {
    bookId: string;
    initialNotes: BookClubNote[];
}

export default function BookClubEditor({ bookId, initialNotes }: Props) {
    const [notes, setNotes] = useState<{ question: string; answer: string }[]>(
        initialNotes.length > 0
            ? initialNotes.map(n => ({ question: n.question, answer: n.answer || "" }))
            : []
    );
    const [saving, setSaving] = useState(false);

    const addNote = () => {
        setNotes(prev => [...prev, { question: "", answer: "" }]);
    };

    const removeNote = (index: number) => {
        setNotes(prev => prev.filter((_, i) => i !== index));
    };

    const updateNote = (index: number, field: 'question' | 'answer', value: string) => {
        setNotes(prev => prev.map((n, i) => i === index ? { ...n, [field]: value } : n));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveBookClubNotes(bookId, notes.filter(n => n.question.trim()));
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-2 mt-6">
            <div className="rounded-sm overflow-hidden shadow-lg shadow-black/30">
                <div className="h-[3px] bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40" />

                <div
                    className="relative pl-12 sm:pl-16 pr-5 sm:pr-8"
                    style={{
                        backgroundColor: '#f5f0e1',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c9b99a40 27px, #c9b99a40 28px)',
                        paddingTop: '8px',
                        paddingBottom: '24px',
                    }}
                >
                    {/* Red margin line */}
                    <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                    {/* Header */}
                    <div className="flex items-center justify-between" style={{ height: '28px' }}>
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Notes:
                        </Typography>
                        <button
                            type="button"
                            onClick={addNote}
                            className="flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors"
                            style={{ fontFamily: 'var(--font-caveat)', fontSize: '16px' }}
                        >
                            <AddCircleIcon sx={{ fontSize: '14px' }} />
                            Add Question
                        </button>
                    </div>

                    {notes.map((note, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1">
                                <div style={{ height: '28px' }}>
                                    <input
                                        type="text"
                                        placeholder="Question..."
                                        value={note.question}
                                        onChange={(e) => updateNote(index, 'question', e.target.value)}
                                        className="w-full bg-transparent border-none text-indigo-800 placeholder-stone-300 focus:outline-none p-0 m-0"
                                        style={{ fontSize: '18px', height: '28px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                                    />
                                </div>
                                <textarea
                                    placeholder="Answer..."
                                    value={note.answer}
                                    onChange={(e) => updateNote(index, 'answer', e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-none text-stone-700 placeholder-stone-300 focus:outline-none resize-none p-0 m-0 block"
                                    style={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeNote(index)}
                                className="text-rose-400/50 hover:text-rose-500 transition-colors self-start"
                                style={{ height: '28px', display: 'flex', alignItems: 'center' }}
                            >
                                <RemoveCircleIcon sx={{ fontSize: '16px' }} />
                            </button>
                        </div>
                    ))}

                    {notes.length === 0 && (
                        <div style={{ height: '28px' }}>
                            <Typography className="text-stone-300 text-center" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                No book club questions yet
                            </Typography>
                        </div>
                    )}

                    <div style={{ height: '84px' }} />
                </div>
            </div>

            {notes.length > 0 && (
                <div className="mt-8 mb-6 flex justify-center">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center text-stone-600 hover:text-stone-300 disabled:opacity-50 transition-colors text-sm gap-1"
                    >
                        <SaveIcon sx={{ fontSize: '14px' }} />
                        {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                </div>
            )}
        </div>
    );
}
