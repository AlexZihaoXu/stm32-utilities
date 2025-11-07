import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { ARR_OPTIONS, PRESETS, TIMER_OPTIONS } from "../constants";
import { MaybePresetKey, ResolutionOption } from "../types";

interface PwmInputGridProps {
    sysClock: number;
    onSysClockChange: (value: number) => void;
    pwmFreq: number;
    onPwmFreqChange: (value: number) => void;
    arrWidth: number;
    onArrWidthChange: (value: number) => void;
    dutyCycle: number;
    onDutyCycleChange: (value: number) => void;
    selectedPreset: MaybePresetKey;
    selectedTimer: string;
    onTimerChange: (value: string) => void;
    selectedChannel: number;
    onChannelChange: (value: number) => void;
    resolutionOptions: ResolutionOption[];
    selectedResolution: string;
    onResolutionChange: (value: string) => void;
}

export function PwmInputGrid({
    sysClock,
    onSysClockChange,
    pwmFreq,
    onPwmFreqChange,
    arrWidth,
    onArrWidthChange,
    dutyCycle,
    onDutyCycleChange,
    selectedPreset,
    selectedTimer,
    onTimerChange,
    selectedChannel,
    onChannelChange,
    resolutionOptions,
    selectedResolution,
    onResolutionChange,
}: PwmInputGridProps) {
    const currentPreset = PRESETS.find((preset) => preset.key === selectedPreset);
    const pwmFrequencyLabel = `${selectedPreset === "toggle-pin" ? "Initial " : ""}PWM Frequency (Hz)${currentPreset ? ` [${currentPreset.label}]` : ""}`;
    const dutyCycleLabel = `Initial Duty Cycle (%)${currentPreset ? ` [${currentPreset.label}]` : ""}`;
    const isResolutionDisabled = resolutionOptions.length === 0 || selectedPreset === "toggle-pin";
    const resolutionPlaceholder = selectedPreset === "toggle-pin"
        ? "Dynamic"
        : resolutionOptions.length === 0
            ? "No valid resolution"
            : "Select resolution";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
                isRequired
                label="System Clock (MHz)"
                type="number"
                value={sysClock.toString()}
                onValueChange={(value) => onSysClockChange(Number(value))}
                min="1"
                max="1000"
            />
            <Input
                isRequired
                label={pwmFrequencyLabel}
                type="number"
                value={pwmFreq.toString()}
                onValueChange={(value) => onPwmFreqChange(Number(value))}
                min="1"
                isDisabled={!!selectedPreset}
            />
            <Select
                isRequired
                label="ARR Register Width"
                selectedKeys={[arrWidth.toString()]}
                onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0];
                    if (key) {
                        onArrWidthChange(Number(key));
                    }
                }}
            >
                {ARR_OPTIONS.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
            </Select>
            <Input
                isRequired
                label={dutyCycleLabel}
                type="number"
                value={dutyCycle.toString()}
                onValueChange={(value) => onDutyCycleChange(Number(value))}
                min="0"
                max="100"
                isDisabled={!!selectedPreset}
            />
            <Autocomplete
                isRequired
                label="Timer"
                defaultItems={TIMER_OPTIONS}
                selectedKey={selectedTimer}
                onSelectionChange={(key) => {
                    if (key) {
                        onTimerChange(key as string);
                    }
                }}
                placeholder="Select or type timer"
            >
                {(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
            </Autocomplete>
            <Select
                isRequired
                isClearable={false}
                label="Channel"
                selectedKeys={[selectedChannel.toString()]}
                onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0];
                    if (key) {
                        onChannelChange(Number(key));
                    }
                }}
            >
                {[1, 2, 3, 4].map((channel) => (
                    <SelectItem key={channel.toString()} textValue={`PWM Generation CH${channel}`}>
                        PWM Generation CH{channel}
                    </SelectItem>
                ))}
            </Select>
            <Select
                isRequired
                label={`PWM Resolution${selectedPreset === "toggle-pin" ? " [Toggle Pin]" : ""}`}
                selectedKeys={selectedResolution ? [selectedResolution] : []}
                onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0];
                    if (key) {
                        onResolutionChange(key as string);
                    }
                }}
                placeholder={resolutionPlaceholder}
                isDisabled={isResolutionDisabled}
            >
                {selectedPreset === "toggle-pin"
                    ? null
                    : resolutionOptions.map((option) => (
                          <SelectItem key={option.key} textValue={option.label}>
                              {option.label}
                          </SelectItem>
                      ))}
            </Select>
        </div>
    );
}
