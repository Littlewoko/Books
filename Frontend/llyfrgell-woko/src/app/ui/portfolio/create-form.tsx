import { Typography } from "@mui/material";
import { CardContent } from "@mui/material";
import { Card } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { createPortfolio } from "@/app/lib/portfolio/actions";
interface Props {
    userId: string
}

export default function Form({ userId }: Props) {
    const createPortfolioWithId = createPortfolio.bind(null, userId);

    return (
        <form action={createPortfolioWithId}>
            <Card className="h-fit" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3 flex flex-col gap-2 flex-grow">
                    <div className="flex flex-col gap-0">
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
                            className="m-0 placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                        />
                    </div>
                    <div>
                        <label htmlFor="url">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                URL
                            </Typography>
                        </label>
                        <input
                            id="url"
                            name="url"
                            max={255}
                            placeholder="url"
                            required
                            className="placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-orange-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="description">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Description
                            </Typography>
                        </label>
                        <input
                            id="description"
                            name="description"
                            max={255}
                            placeholder="Description"
                            required
                            className="placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                        />
                    </div>

                    <div>
                        <label htmlFor="svg-icon">
                            <Typography
                                className='text-gray-300 mb-0'
                                sx={{
                                    fontSize: { xs: '10px', sm: '12px' }
                                }}>
                                Inline SVG Icon
                            </Typography>
                        </label>
                        <textarea
                            id="svg-icon"
                            name="svg-icon"
                            placeholder="SVG Icon"
                            rows={5}
                            required
                            className="placeholder-gray-300/80 border border-white bg-inherit text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="flex gap-2 w-fit items-center text-white bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                            <AddCircleIcon className="md:mr-1" fontSize="small" />
                            <span>Submit</span>
                        </button>
                    </div>
                </CardContent>


            </Card>
        </form >
    );
}