export type NamingConvention = "UPPERCASE" | "PascalCase" | "camelCase" | "snake_case";

export type PresetKey = "standard-servo" | "led-dimming" | "toggle-pin";

export type MaybePresetKey = "" | PresetKey;

export interface SelectOption {
    key: string;
    label: string;
}

export interface TimerOption {
    key: string;
    label: string;
}

export interface Preset {
    key: PresetKey;
    label: string;
    description: string;
}

export interface ResolutionOption {
    key: string;
    label: string;
    arr: number;
    psc: number;
}
