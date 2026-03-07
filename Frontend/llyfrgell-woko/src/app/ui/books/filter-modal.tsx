"use client";

import { useState } from "react";
import { Typography, Modal, Box } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

interface FilterModalProps {
    onApplyFilters: (filters: {
        shortStory?: boolean | null;
        genre?: string;
        status?: string;
        year?: number;
    }) => void;
    currentFilters: {
        shortStory?: boolean | null;
        genre?: string;
        status?: string;
        year?: number;
    };
}

export default function FilterModal({ onApplyFilters, currentFilters }: FilterModalProps) {
    const [open, setOpen] = useState(false);
    const [shortStory, setShortStory] = useState<string>(
        currentFilters.shortStory === true ? 'true' : 
        currentFilters.shortStory === false ? 'false' : 'all'
    );
    const [genre, setGenre] = useState(currentFilters.genre || '');
    const [status, setStatus] = useState(currentFilters.status || '');
    const [year, setYear] = useState(currentFilters.year?.toString() || '');

    const handleApply = () => {
        onApplyFilters({
            shortStory: shortStory === 'all' ? null : shortStory === 'true',
            genre: genre || undefined,
            status: status || undefined,
            year: year ? parseInt(year) : undefined,
        });
        setOpen(false);
    };

    const handleClear = () => {
        setShortStory('all');
        setGenre('');
        setStatus('');
        setYear('');
        onApplyFilters({});
        setOpen(false);
    };

    const activeFilterCount = [
        currentFilters.shortStory !== null && currentFilters.shortStory !== undefined,
        currentFilters.genre,
        currentFilters.status,
        currentFilters.year,
    ].filter(Boolean).length;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:bg-gradient-to-l font-small rounded-lg text-sm p-1 px-3"
            >
                <FilterListIcon fontSize="small" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                    <span className="bg-orange-500 rounded-full px-1.5 text-xs">{activeFilterCount}</span>
                )}
            </button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-600 rounded-lg p-4 w-96 max-w-[90vw]">
                    <div className="flex justify-between items-center mb-4">
                        <Typography className="text-gray-300" sx={{ fontSize: '18px', fontWeight: 'bold' }}>
                            Filter Books
                        </Typography>
                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-200">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-gray-300 text-sm mb-1 block">Short Stories</label>
                            <select
                                value={shortStory}
                                onChange={(e) => setShortStory(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded p-2"
                            >
                                <option value="all">All</option>
                                <option value="true">Short Stories Only</option>
                                <option value="false">Exclude Short Stories</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm mb-1 block">Genre</label>
                            <input
                                type="text"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                placeholder="e.g., Fantasy, Fiction"
                                className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded p-2 placeholder-gray-500"
                            />
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm mb-1 block">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded p-2"
                            >
                                <option value="">All</option>
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="owned">Owned (Not Started)</option>
                                <option value="not-owned">Not Owned</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm mb-1 block">Completed Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="e.g., 2024"
                                className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded p-2 placeholder-gray-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleApply}
                            className="flex-1 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:bg-gradient-to-l font-small rounded-lg text-sm p-2"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={handleClear}
                            className="flex-1 text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:bg-gradient-to-l font-small rounded-lg text-sm p-2"
                        >
                            Clear All
                        </button>
                    </div>
                </Box>
            </Modal>
        </>
    );
}
