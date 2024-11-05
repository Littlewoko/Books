"use client";

import { Portfolio } from "@/app/lib/classes/portfolio";
import { Card, CardContent, Link, Typography } from "@mui/material";
import LaunchIcon from '@mui/icons-material/Launch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { deletePortfolio } from "@/app/lib/portfolio/actions";

interface props {
    portfolioItem: Portfolio
}

export default function PortfolioCard({ portfolioItem }: props) {
    const svgString = atob(portfolioItem.svgIcon);

    const Delete = async () => {
        const wantToDelete = confirm(`Are you sure you want to delete ${portfolioItem.title}? This action cannot be undone`);
        if (!wantToDelete) return;

        await deletePortfolio(portfolioItem.id?.toString() ?? "");
    }

    return (
        <Card className="h-fit p-2" sx={{ minWidth: 275, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <Link href={portfolioItem.url} rel="noopener noreferrer" className="flex" target="_blank">
                <CardContent className="m-0 p-0 flex flex-grow gap-5 items-center">
                    <div
                        className="min-w-14 min-h-14 max-w-14 max-h-14 flex items-center justify-center" // Center the SVG
                        dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                    <CardContent>
                        <Typography
                            variant="h5"
                            component="div"
                            className="text-orange-400 mb-2"
                            sx={{
                                fontSize: { xs: '16px', sm: 'h5.fontSize' }
                            }}>
                            {portfolioItem.title}
                        </Typography>
                        <Typography
                            className='text-white'
                            sx={{
                                mb: 1.5,
                                fontSize: { xs: '12px', sm: '14px' }
                            }}>
                            {portfolioItem.description}
                        </Typography>

                    </CardContent>
                </CardContent>

                <LaunchIcon />
            </Link >
            <div className="flex justify-end gap-2">
                <Link href={`/portfolio/${portfolioItem.id}/edit`}>
                    <button type="button" className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                        <EditIcon className="md:mr-1" fontSize="small" />
                        <span className="hidden md:inline">Edit</span>
                    </button>
                </Link>

                <button
                    onClick={Delete}
                    type="button"
                    className="flex items-center text-white bg-gradient-to-r from-red-500 to-red-700 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-red-200 dark:focus:ring-red-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm"
                >
                    <DeleteIcon className="md:mr-1" fontSize="small" />
                    <span className="hidden md:inline">Delete</span>
                </button>
            </div>

        </Card>
    )
}