import { Book } from "@/app/lib/classes/book";
import { formatDateForDatePicker } from "@/app/utils/formatDate";
import SaveIcon from '@mui/icons-material/Save';
import { Card, CardContent, Typography } from "@mui/material";
import { UpdateBook } from "@/app/lib/books/actions";

interface Props {
    book: Book | undefined
}

const Form: React.FC<Props> = ({ book }) => {
    if (!book || !book.id) {
        return (
            <>
                No such book
            </>
        )
    }

    const updateBookWithId = UpdateBook.bind(null, book.id.toString());
    return (
        <form action={updateBookWithId}>
            <Card className="h-fit" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3 flex flex-col gap-2 flex-grow">
                    <div className="flex flex-col gap-0">
                        <label htmlFor="author">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Author
                            </Typography>
                        </label>
                        <input
                            id="author"
                            name="author"
                            max={255}
                            placeholder="Author"
                            required
                            className="m-0 placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                            defaultValue={book.author}
                        />
                    </div>
                    <div>
                        <label htmlFor="title">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Title
                            </Typography>
                        </label>
                        <input
                            id="title"
                            name="title"
                            max={255}
                            placeholder="Title"
                            required
                            className="placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-orange-400"
                            defaultValue={book.title}
                        />
                    </div>
                    <div>
                        <label htmlFor="genre">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Genre
                            </Typography>
                        </label>
                        <input
                            id="genre"
                            name="genre"
                            max={255}
                            placeholder="Genre"
                            required
                            className="placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                            defaultValue={book.genre}
                        />
                    </div>

                    <div className="flex mt-3 gap-2 align-middle">
                        <label htmlFor="shortstory">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Short story?
                            </Typography>
                        </label>
                        <input
                            type="checkbox"
                            id="shortStory"
                            name="shortStory"
                            defaultChecked={book.shortStory}
                        />
                    </div>
                </CardContent>
                <CardContent className="ml-auto min-w-36 flex flex-col p-3">
                    <div className="flex flex-col gap-2.5">
                        <div>
                            <label htmlFor="dateobtained">
                                <Typography
                                    className='text-gray-300 mb-0'
                                    sx={{
                                        fontSize: { xs: '10px', sm: '12px' }
                                    }}>
                                    Obtained
                                </Typography>
                            </label>
                            <input
                                type="date"
                                id="dateobtained"
                                name="dateobtained"
                                className="bg-inherit border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-0.5 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-white/70"
                                defaultValue={book.dateObtained ? formatDateForDatePicker(book.dateObtained) : ""}
                            />
                        </div>
                        <div>
                            <label htmlFor="datestartedreading">
                                <Typography
                                    className='text-gray-300 mb-0'
                                    sx={{
                                        fontSize: { xs: '10px', sm: '12px' }
                                    }}>
                                    Began
                                </Typography>
                            </label>
                            <input
                                type="date"
                                id="datestartedreading"
                                name="datestartedreading"
                                className="bg-inherit border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-0.5 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-white/70"
                                defaultValue={book.dateStartedReading ? formatDateForDatePicker(book.dateStartedReading) : ""}
                            />
                        </div>
                        <div>
                            <label htmlFor="datecompleted">
                                <Typography
                                    className='text-gray-300 mb-0'
                                    sx={{
                                        fontSize: { xs: '10px', sm: '12px' }
                                    }}>
                                    Completed
                                </Typography>
                            </label>
                            <input
                                type="date"
                                id="datecompleted"
                                name="datecompleted"
                                className="bg-inherit border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-0.5 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-white/70"
                                defaultValue={book.dateCompleted ? formatDateForDatePicker(book.dateCompleted) : ""}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-3 gap-2">
                        <button type="submit" className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                            <SaveIcon className="md:mr-1" fontSize="small" />
                            <span className="hidden md:inline">Submit</span>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

export default Form;