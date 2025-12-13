import { Assessment } from './outcomes';

export interface Dot {
    size: number,
    opacity: number,
    angle: number,
    center_x: number,
    center_y: number,
    left: number,
    top: number,
    offset_radius: number,
    assessment: Assessment,
    tooltip: {
        points: number,
        name: string,
        date: string
    }
}