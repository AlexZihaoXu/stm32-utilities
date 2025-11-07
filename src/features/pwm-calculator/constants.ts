import { Preset, SelectOption, TimerOption } from "./types";

export const ARR_OPTIONS: SelectOption[] = [
    { key: "16", label: "16 bits" },
    { key: "32", label: "32 bits" },
];

export const TIMER_OPTIONS: TimerOption[] = [
    { label: "TIM1", key: "TIM1" },
    { label: "TIM2", key: "TIM2" },
    { label: "TIM3", key: "TIM3" },
    { label: "TIM4", key: "TIM4" },
    { label: "TIM5", key: "TIM5" },
    { label: "TIM6", key: "TIM6" },
    { label: "TIM7", key: "TIM7" },
    { label: "TIM8", key: "TIM8" },
    { label: "TIM9", key: "TIM9" },
    { label: "TIM10", key: "TIM10" },
    { label: "TIM11", key: "TIM11" },
    { label: "TIM12", key: "TIM12" },
    { label: "TIM13", key: "TIM13" },
    { label: "TIM14", key: "TIM14" },
    { label: "TIM15", key: "TIM15" },
    { label: "TIM16", key: "TIM16" },
    { label: "TIM17", key: "TIM17" },
    { label: "TIM18", key: "TIM18" },
    { label: "TIM19", key: "TIM19" },
    { label: "TIM20", key: "TIM20" },
    { label: "TIM21", key: "TIM21" },
    { label: "TIM22", key: "TIM22" },
    { label: "TIM23", key: "TIM23" },
    { label: "TIM24", key: "TIM24" },
];

export const PRESETS: Preset[] = [
    { key: "standard-servo", label: "Standard Servo", description: "RC servos with configurable angle range" },
    { key: "led-dimming", label: "LED Dimming", description: "Smooth LED brightness control" },
    { key: "toggle-pin", label: "Toggle Pin", description: "Dynamic frequency toggling" },
];
