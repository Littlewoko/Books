import { Card, CardContent, Typography } from "@mui/material";

interface Props {
    text: string, 
    colour?: string
}

export default function Header({ text, colour }: Props) {
    return (
        <Card className="h-fit justify-center" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent>
                <Typography
                    variant="h5"
                    component="div"
                    className={colour}
                    sx={{
                        fontSize: { xs: '16px', sm: 'h5.fontSize' }
                    }}>
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}