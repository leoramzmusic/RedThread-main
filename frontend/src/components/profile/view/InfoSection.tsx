import { useState } from 'react';
import { Paper, Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface InfoSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const InfoSection = ({ title, icon, children, defaultExpanded = false }: InfoSectionProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <Paper
            className="profile-section"
            sx={{
                overflow: 'hidden',
                p: 0, // Padding handled by class, but check if inner content needs it. 
                // The class puts padding: 16px on the container.
                // Existing code had children inside Collapse -> Box p=3.
                // If I put padding on the container, the header is padded.
                // InfoSection header was `Box p={2.5}`.
                // If I let class add padding, it adds it to the wrapper.
                // I should probably REMOVE padding from the wrapper class for InfoSection if the inner formatting relies on sub-boxes, OR adjust sub-boxes.
                // BUT the user said "Estilos para cada sección... padding: 16px".
                // I will override padding to 0 in SX if I want to preserve internal layout, OR better: adapt internal structure.
                // The Header "onClick" Box has padding.
                // I'll keep the class as requested but override padding or layout if it breaks.
                // Let's try to remove standard styles and let the class drive it.
                // BUT `InfoSection` has an accordion mechanism.
                // If I modify it too much, it might break.
                // I'll apply the class but maybe override padding to 0 and let the child Boxes handle padding if it looks disjointed?
                // No, "padding: 16px" on the container acts as a frame.
                // I'll stick to the class.
                // I need to ensure background color from class is visible.
                // MUI Paper has white bg by default. I should un-set it. `bgcolor: 'transparent'` in sx.
                bgcolor: 'transparent',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }
            }}
            elevation={0}
        >
            <Box
                p={2.5}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setExpanded(!expanded)}
                sx={{
                    cursor: 'pointer',
                    bgcolor: 'transparent'
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        color="primary.main"
                        display="flex"
                        p={1}
                        bgcolor="primary.50"
                        borderRadius="50%"
                    >
                        {icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">{title}</Typography>
                </Box>
                <IconButton
                    size="small"
                    sx={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        bgcolor: 'action.hover'
                    }}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </Box>
            <Collapse in={expanded}>
                <Box p={3} pt={0}>
                    {children}
                </Box>
            </Collapse>
        </Paper>
    );
};
