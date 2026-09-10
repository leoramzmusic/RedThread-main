export const RADIUS_MIN = 5;
export const RADIUS_MAX = 100;

export const RADIUS_STEPS = [
    5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100
] as const;

export function radiusStepFor(value: number): number {
    return value <= 20 ? 5 : 10;
}

export const RADIUS_MARKS: { value: number }[] = RADIUS_STEPS.map((value) => ({ value }));

export const RADIUS_STEP_HELP =
    ''; // 'Pasos de 5 km hasta 20 km; de 20 km en adelante, saltos de 10 km.';