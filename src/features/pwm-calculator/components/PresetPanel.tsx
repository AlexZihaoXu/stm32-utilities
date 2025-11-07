import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import type { Selection } from "@react-types/shared";
import { PRESETS } from "../constants";
import { MaybePresetKey } from "../types";

interface PresetPanelProps {
    selectedPreset: MaybePresetKey;
    onPresetChange: (preset: MaybePresetKey) => void;
    pwmFreq: number;
    onPwmFreqChange: (value: number) => void;
    servoMaxAngle: number;
    onServoMaxAngleChange: (value: number) => void;
    servoMinAngle: number;
    onServoMinAngleChange: (value: number) => void;
    servoInitialAngle: number;
    onServoInitialAngleChange: (value: number) => void;
    ledFrequency: number;
    onLedFrequencyChange: (value: number) => void;
    ledInitialBrightness: number;
    onLedInitialBrightnessChange: (value: number) => void;
    togglePinFrequency: number;
    onTogglePinFrequencyChange: (value: number) => void;
    dutyCycle: number;
    onDutyCycleChange: (value: number) => void;
}

export function PresetPanel({
    selectedPreset,
    onPresetChange,
    pwmFreq,
    onPwmFreqChange,
    servoMaxAngle,
    onServoMaxAngleChange,
    servoMinAngle,
    onServoMinAngleChange,
    servoInitialAngle,
    onServoInitialAngleChange,
    ledFrequency,
    onLedFrequencyChange,
    ledInitialBrightness,
    onLedInitialBrightnessChange,
    togglePinFrequency,
    onTogglePinFrequencyChange,
    dutyCycle,
    onDutyCycleChange,
}: PresetPanelProps) {
    const currentPreset = PRESETS.find((preset) => preset.key === selectedPreset);

    const handlePresetSelection = (keys: Selection) => {
        if (keys === "all") {
            return;
        }
        const key = Array.from(keys)[0] as MaybePresetKey | undefined;
        onPresetChange(key ?? "");
    };

    const updateServoInitialAngle = (value: number) => {
        onServoInitialAngleChange(value);
        const minDutyCycle = 5;
        const maxDutyCycle = 10;
        const angleRange = Math.max(servoMaxAngle - servoMinAngle, 1);
        const angleOffset = value - servoMinAngle;
        const calculatedDutyCycle = minDutyCycle + (angleOffset / angleRange) * (maxDutyCycle - minDutyCycle);
        onDutyCycleChange(Number(calculatedDutyCycle.toFixed(2)));
    };

    return (
        <div className="w-full lg:w-80 lg:border-l lg:border-default-100 lg:pl-6 space-y-4">
            <h3 className="text-lg font-semibold">Presets</h3>
            <Select
                isClearable
                selectedKeys={selectedPreset ? [selectedPreset] : []}
                onSelectionChange={handlePresetSelection}
                placeholder="Select a preset"
            >
                {PRESETS.map((preset) => (
                    <SelectItem key={preset.key} textValue={preset.label}>
                        <div className="flex flex-col">
                            <span className="text-small">{preset.label}</span>
                            <span className="text-tiny text-default-400">{preset.description}</span>
                        </div>
                    </SelectItem>
                ))}
            </Select>
            <h4 className="text-md font-semibold mt-4">Preset Configuration</h4>
            {selectedPreset === "standard-servo" ? (
                <div className="space-y-4">
                    <p className="text-sm text-default-600">Configuration for Standard Servo</p>
                    <div>
                        <Input
                            isRequired
                            label={pwmFreq < 50 ? "PWM Frequency (Hz) - Below 50Hz" : "PWM Frequency (Hz)"}
                            type="number"
                            value={pwmFreq.toString()}
                            onValueChange={(value) => onPwmFreqChange(Number(value))}
                            min="1"
                            color={pwmFreq < 50 ? "warning" : "default"}
                        />
                    </div>
                    <Input
                        isRequired
                        label="Max Angle (degrees)"
                        type="number"
                        value={servoMaxAngle.toString()}
                        onValueChange={(value) => onServoMaxAngleChange(Number(value))}
                        min={servoMinAngle + 1}
                    />
                    <Input
                        isRequired
                        label="Min Angle (degrees)"
                        type="number"
                        value={servoMinAngle.toString()}
                        onValueChange={(value) => onServoMinAngleChange(Number(value))}
                        max={servoMaxAngle - 1}
                    />
                    <Input
                        isRequired
                        label="Initial Angle (degrees)"
                        type="number"
                        value={servoInitialAngle.toString()}
                        onValueChange={(value) => updateServoInitialAngle(Number(value))}
                        min={servoMinAngle}
                        max={servoMaxAngle}
                    />
                </div>
            ) : selectedPreset === "led-dimming" ? (
                <div className="space-y-4">
                    <p className="text-sm text-default-600">Configuration for LED Dimming</p>
                    <Input
                        isRequired
                        label="Frequency (Hz)"
                        type="number"
                        value={ledFrequency.toString()}
                        onValueChange={(value) => {
                            const nextValue = Number(value);
                            onLedFrequencyChange(nextValue);
                            onPwmFreqChange(nextValue);
                        }}
                        min="1"
                    />
                    <Input
                        isRequired
                        label="Initial Brightness (%)"
                        type="number"
                        value={ledInitialBrightness.toString()}
                        onValueChange={(value) => {
                            const nextValue = Number(value);
                            onLedInitialBrightnessChange(nextValue);
                            onDutyCycleChange(nextValue);
                        }}
                        min="0"
                        max="100"
                    />
                </div>
            ) : selectedPreset === "toggle-pin" ? (
                <div className="space-y-4">
                    <p className="text-sm text-default-600">Configuration for Toggle Pin</p>
                    <Input
                        isRequired
                        label="Initial Frequency (Hz)"
                        type="number"
                        value={togglePinFrequency.toString()}
                        onValueChange={(value) => {
                            const nextValue = Number(value);
                            onTogglePinFrequencyChange(nextValue);
                            onPwmFreqChange(nextValue);
                        }}
                        min="1"
                    />
                    <Input
                        isRequired
                        label="Duty Cycle (%)"
                        type="number"
                        value={dutyCycle.toString()}
                        onValueChange={(value) => onDutyCycleChange(Number(value))}
                        min="0"
                        max="100"
                    />
                </div>
            ) : currentPreset ? (
                <p>Configuration for {currentPreset.label}</p>
            ) : (
                <p className="text-default-500">Please select a preset to start configuring</p>
            )}
        </div>
    );
}
