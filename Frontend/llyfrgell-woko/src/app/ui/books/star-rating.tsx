"use client";

import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface StarRatingProps {
    rating: number;
    interactive?: boolean;
    handwritten?: boolean;
    onChange?: (rating: number) => void;
}

export default function StarRating({ rating, interactive = false, handwritten = false, onChange }: StarRatingProps) {
    const stars = [1, 2, 3, 4, 5];

    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value === rating ? 0 : value);
        }
    };

    if (handwritten) {
        return (
            <div className="flex" style={{ fontFamily: 'var(--font-caveat)', fontSize: '16px', lineHeight: '28px' }}>
                {stars.map((star) => (
                    <span
                        key={star}
                        onClick={() => handleClick(star)}
                        className={`${star <= rating ? "text-amber-700" : "text-stone-300"} ${interactive ? "cursor-pointer" : "cursor-default"}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-0.5">
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleClick(star)}
                    disabled={!interactive}
                    className={interactive ? "cursor-pointer" : "cursor-default"}
                >
                    {star <= rating ? (
                        <StarIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} className="text-yellow-400" />
                    ) : (
                        <StarBorderIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} className="text-gray-400" />
                    )}
                </button>
            ))}
        </div>
    );
}
