import { createBook } from "@/app/lib/books/actions";

export default function QuickAddForm() {
    return (<form action={createBook}>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="w-full">
                <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Title
                </label>
                <input
                    id="title"
                    name="title"
                    max={255}
                    placeholder="Please enter book title"
                    required
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
            </div>
            <div className="w-full">
                <label htmlFor="author" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Author
                </label>
                <input
                    id="author"
                    name="author"
                    max={255}
                    placeholder="Please enter the author's name"
                    required
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
            </div>
            <div className="w-full">
                <label htmlFor="genre" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Genre
                </label>
                <input
                    id="genre"
                    name="genre"
                    max={255}
                    placeholder="Please enter the book's genre"
                    required
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
            </div>

            <button type="submit" className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-black rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800">
                Submit
            </button>
        </div>
    </form>
    );
}