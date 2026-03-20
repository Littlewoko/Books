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

    const inputClass = "placeholder-gray-300/80 border border-white bg-inherit text-sm block w-full p-1 text-gray-300";

    return (
        <div className="mt-4 p-3 border border-gray-600 rounded bg-black/30">
            <div className="flex items-center justify-between mb-3">
                <Typography className="text-gray-300" sx={{ fontSize: { xs: '10px', sm: '12px' } }}>
                    Book Club Q&A
                </Typography>
                <button
                    type="button"
                    onClick={addNote}
                    className="flex items-center text-gray-400 hover:text-gray-200 transition-colors text-xs gap-1"
                >
                    <AddCircleIcon sx={{ fontSize: '14px' }} />
                    Add Question
                </button>
            </div>

            {notes.map((note, index) => (
                <div key={index} className="mb-3 flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                        <input
                            type="text"
                            placeholder="Question"
                            value={note.question}
                            onChange={(e) => updateNote(index, 'question', e.target.value)}
                            className={inputClass}
                        />
                        <textarea
                            placeholder="Answer (optional)"
                            value={note.answer}
                            onChange={(e) => updateNote(index, 'answer', e.target.value)}
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeNote(index)}
                        className="text-red-500/60 hover:text-red-400 transition-colors self-start mt-1"
                    >
                        <RemoveCircleIcon sx={{ fontSize: '16px' }} />
                    </button>
                </div>
            ))}

            {notes.length > 0 && (
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:bg-gradient-to-l disabled:opacity-50 font-small rounded-lg text-sm p-1 px-3"
                >
                    <SaveIcon className="mr-1" sx={{ fontSize: '14px' }} />
                    {saving ? 'Saving...' : 'Save Notes'}
                </button>
            )}

            {notes.length === 0 && (
                <Typography className="text-gray-500 text-center" sx={{ fontSize: '11px' }}>
                    No book club questions yet
                </Typography>
            )}
        </div>
    );
}
