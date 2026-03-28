'use client'

import AllTable from "../ui/books/all-table";
import React, { useEffect, useState } from "react";
import { GetBooks } from "../lib/books/actions";
import { Book } from "../lib/classes/book";
import { useSearchParams } from "next/navigation";
import SearchBar from "../ui/searchbar";
import FilterModal from "../ui/books/filter-modal";

export default function Page() {
  const searchParams = useSearchParams();

  const query = searchParams.get('query');
  const shortStoryParam = searchParams.get('shortStory');
  const genreParam = searchParams.get('genre');
  const statusParam = searchParams.get('status');
  const yearParam = searchParams.get('year');

  const pageSize = 50;

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    shortStory: shortStoryParam === 'true' ? true : shortStoryParam === 'false' ? false : null,
    genre: genreParam || undefined,
    status: statusParam || undefined,
    year: yearParam ? parseInt(yearParam) : undefined,
  });

  const handleApplyFilters = (newFilters: {
    shortStory?: boolean | null;
    genre?: string;
    status?: string;
    year?: number;
  }) => {
    setFilters({
      shortStory: newFilters.shortStory ?? null,
      genre: newFilters.genre,
      status: newFilters.status,
      year: newFilters.year,
    });
  };

  // Reset when filters or query change
  useEffect(() => {
    setBooks([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  }, [filters, query]);

  // Fetch books for current page
  useEffect(() => {
    if (!loading && !loadingMore) return;

    GetBooks(page, pageSize, query ?? '', filters).then(res => {
      setBooks(prev => page === 0 ? res : [...prev, ...res]);
      setHasMore(res.length === pageSize);
      setLoading(false);
      setLoadingMore(false);
    });
  }, [page, loading, loadingMore]);

  const loadMore = () => {
    if (!hasMore || loading || loadingMore) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
  };

  const cleanParams = new URLSearchParams(searchParams.toString());
  cleanParams.forEach((value, key) => { if (!value) cleanParams.delete(key); });
  const returnTo = cleanParams.toString() ? `/books?${cleanParams.toString()}` : undefined;

  return (
    <div className="overflow-x-auto m-2 max-w-3xl mx-auto">
      <div>
        <div className="flex flex-col m-1 gap-y-1">
          <SearchBar defaultQuery={query || ''}/>
        </div>
        <div className="flex items-center justify-end">
          <FilterModal onApplyFilters={handleApplyFilters} currentFilters={filters} />
        </div>
        {loading ? (
          <div className="text-center">
            <div role="status">
              <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <AllTable books={books} returnTo={returnTo} />
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-stone-500 hover:text-amber-800 transition-colors text-lg"
                  style={{ fontFamily: 'var(--font-caveat)' }}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
