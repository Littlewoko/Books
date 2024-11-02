import { Portfolio } from "@/app/lib/classes/portfolio";
import { Card, CardContent, Typography } from "@mui/material";
import LaunchIcon from '@mui/icons-material/Launch';

interface props {
    portfolioItem: Portfolio
}

export default function PortfolioCard({ portfolioItem }: props) {
    const svgString = atob(portfolioItem.svgIcon);

    return (
        <a href={portfolioItem.url} rel="noopener noreferrer" className="flex" target="_blank">

            <Card className="h-fit" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.5)" }}>
                <CardContent className="p-3 flex gap-5 items-center">
                    <div
                        className="w-16 h-16 flex items-center justify-center" // Center the SVG
                        dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                    <div>
                        <Typography
                            variant="h5"
                            component="div"
                            className="text-orange-400"
                            sx={{
                                fontSize: { xs: '16px', sm: 'h5.fontSize' }
                            }}>
                            {portfolioItem.title}
                        </Typography>
                        <Typography
                            className='text-gray-300'
                            sx={{
                                mb: 1.5,
                                fontSize: { xs: '10px', sm: '12px' }
                            }}>
                            {portfolioItem.description}
                        </Typography>
                    </div>

                </CardContent>
                <LaunchIcon />
            </Card>
        </a>
    )
}