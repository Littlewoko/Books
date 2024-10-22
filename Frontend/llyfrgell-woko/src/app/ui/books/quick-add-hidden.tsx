import { Card, CardContent, Typography } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { ZoomOutMap } from "@mui/icons-material";
interface Props {
    click: () => void
}

export default function quickAddHidden({ click }: Props) {
    return (
        <Card onClick={click} className="h-fit justify-center" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent>
                <Typography
                    variant="h5"
                    component="div"
                    className="text-orange-400"
                    sx={{
                        fontSize: { xs: '16px', sm: 'h5.fontSize' }
                    }}>
                    <button onClick={click} type="button" className="flex items-center text-white bg-gradient-to-r from-orange-700 to-yellow-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                        <ZoomOutMap className="md:mr-1" fontSize="small" />
                    </button>
                </Typography>
            </CardContent>
        </Card>
    )
}