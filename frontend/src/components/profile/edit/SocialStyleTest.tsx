import React, { useState } from 'react';
import {
    Typography,
    Box,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Stepper,
    Step,
    StepLabel,
    alpha,
    useTheme,
    Paper,
    Button,
    Collapse,
    Fade
} from '@mui/material';
import { Psychology, CheckCircle } from '@mui/icons-material';

interface SocialStyleTestProps {
    open: boolean;
    onClose: () => void;
    onResult: (result: string) => void;
}

const questions = [
    {
        id: 1,
        text: '¿Cómo recargas energía después de un día largo?',
        options: [
            { value: 'extrovert', label: 'Estando con amigos o en una reunión.' },
            { value: 'introvert', label: 'En casa, solo/a, leyendo o descansando.' },
            { value: 'ambivert', label: 'Depende del día, a veces social, a veces tranquilo.' }
        ]
    },
    {
        id: 2,
        text: 'En una fiesta donde no conoces a nadie, tú…',
        options: [
            { value: 'extrovert', label: 'Te acercas a hablar con varias personas.' },
            { value: 'introvert', label: 'Observas, te quedas en tu rincón o con alguien conocido.' },
            { value: 'ambivert', label: 'Te adaptas según el ambiente y tu estado de ánimo.' }
        ]
    },
    {
        id: 3,
        text: '¿Qué te resulta más agotador?',
        options: [
            { value: 'extrovert', label: 'Estar solo mucho tiempo.' },
            { value: 'introvert', label: 'Estar rodeado de gente por horas.' },
            { value: 'ambivert', label: 'Ambos, depende del contexto.' }
        ]
    },
    {
        id: 4,
        text: '¿Cómo prefieres trabajar o estudiar?',
        options: [
            { value: 'extrovert', label: 'En equipo, compartiendo ideas.' },
            { value: 'introvert', label: 'En silencio, concentrado/a en solitario.' },
            { value: 'ambivert', label: 'Alterno entre ambos según el proyecto.' }
        ]
    },
    {
        id: 5,
        text: '¿Qué te describe mejor?',
        options: [
            { value: 'extrovert', label: 'Me encanta hablar y compartir.' },
            { value: 'introvert', label: 'Prefiero escuchar y reflexionar.' },
            { value: 'ambivert', label: 'Hago ambas cosas según la situación.' }
        ]
    }
];

export default function SocialStyleTest({ open, onClose, onResult }: SocialStyleTestProps) {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResult, setShowResult] = useState(false);

    const handleNext = () => {
        if (activeStep < questions.length - 1) {
            setActiveStep((prev) => prev + 1);
        } else {
            setShowResult(true);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const calculateResult = () => {
        const counts: Record<string, number> = { extrovert: 0, introvert: 0, ambivert: 0 };
        Object.values(answers).forEach((val) => {
            counts[val] = (counts[val] || 0) + 1;
        });

        let maxCount = 0;
        let result = 'ambivert';
        for (const [style, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                result = style;
            }
        }
        return result;
    };

    const resultStyle = calculateResult();

    const handleApply = () => {
        onResult(resultStyle);
        handleClose();
    };

    const handleClose = () => {
        setTimeout(() => {
            setActiveStep(0);
            setAnswers({});
            setShowResult(false);
        }, 300);
        onClose();
    };

    const styleLabels: Record<string, string> = {
        extrovert: 'Extrovertido',
        introvert: 'Introvertido',
        ambivert: 'Ambivertido'
    };

    return (
        <Collapse in={open}>
            <Box
                className="microtest-container"
                sx={{
                    width: 'calc(100% + 48px)', // Negate parent padding (p: 3 = 24px * 2)
                    mx: -3, // Move outside parent padding
                    // Using the new CSS variables suggested by user
                    pl: 'var(--container-padding-left)',
                    pr: 'var(--container-padding-right)',
                    py: 3,
                    boxSizing: 'border-box',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                    borderRadius: 4,
                    mt: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Psychology color="primary" />
                    <Typography variant="h6" fontWeight={700}>Microtest: Estilo Social</Typography>
                </Box>

                {!showResult ? (
                    <Fade in={!showResult}>
                        <Box>
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
                                {questions.map((_, index) => (
                                    <Step key={index}>
                                        <StepLabel />
                                    </Step>
                                ))}
                            </Stepper>

                            <Box sx={{ minHeight: 180 }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                                    {questions[activeStep].text}
                                </Typography>
                                <FormControl component="fieldset" fullWidth>
                                    <RadioGroup
                                        value={answers[questions[activeStep].id] || ''}
                                        onChange={(e) => handleAnswerChange(questions[activeStep].id, e.target.value)}
                                    >
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            {questions[activeStep].options.map((opt) => (
                                                <Paper
                                                    key={opt.value}
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: 2,
                                                        bgcolor: answers[questions[activeStep].id] === opt.value
                                                            ? alpha(theme.palette.primary.main, 0.05)
                                                            : 'background.paper',
                                                        borderColor: answers[questions[activeStep].id] === opt.value
                                                            ? theme.palette.primary.main
                                                            : 'divider',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                                                        }
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value={opt.value}
                                                        control={<Radio size="small" />}
                                                        label={<Typography variant="body2">{opt.label}</Typography>}
                                                        sx={{ m: 0, p: 1, width: '100%' }}
                                                    />
                                                </Paper>
                                            ))}
                                        </Box>
                                    </RadioGroup>
                                </FormControl>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mt={4}>
                                <Button onClick={handleClose} size="small" color="inherit">Cancelar</Button>
                                <Box display="flex" gap={1}>
                                    <Button disabled={activeStep === 0} onClick={handleBack} size="small" variant="outlined">
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={!answers[questions[activeStep].id]}
                                        size="small"
                                    >
                                        {activeStep === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Fade>
                ) : (
                    <Fade in={showResult}>
                        <Box textAlign="center" py={2}>
                            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1, opacity: 0.8 }} />
                            <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                                ¡Test completado!
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Tu estilo social parece ser: <strong>{styleLabels[resultStyle]}</strong>
                            </Typography>

                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3, textAlign: 'left', mb: 4 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Basado en tus respuestas, este es el estilo que mejor encaja contigo. Puedes aplicarlo ahora o cambiarlo manualmente después.
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="center" gap={2}>
                                <Button onClick={() => setShowResult(false)} color="inherit" size="small">
                                    Revisar respuestas
                                </Button>
                                <Button variant="contained" onClick={handleApply} size="small">
                                    Aceptar y aplicar
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Box>
        </Collapse>
    );
}
