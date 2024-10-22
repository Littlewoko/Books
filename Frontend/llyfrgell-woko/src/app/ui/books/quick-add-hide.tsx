import { Card, CardContent, Typography } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';

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
                        <AddCircleIcon className="md:mr-1" fontSize="medium" />
                </Typography>
            </CardContent>
        </Card>
    )
}