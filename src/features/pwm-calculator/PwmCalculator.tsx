import { Divider } from "@heroui/divider";
import { PwmInputGrid } from "./components/PwmInputGrid";
import { PresetPanel } from "./components/PresetPanel";
import { CubeMxConfiguration } from "./components/CubeMxConfiguration";
import { usePwmCalculator } from "./usePwmCalculator";

export function PwmCalculator() {
    const {
        sysClock,
        setSysClock,
        pwmFreq,
        setPwmFreq,
        arrWidth,
        setArrWidth,
        dutyCycle,
        setDutyCycle,
        selectedPreset,
        handlePresetChange,
        selectedTimer,
        setSelectedTimer,
        selectedChannel,
        setSelectedChannel,
        selectedResolution,
        setSelectedResolution,
        resolutionOptions,
        selectedResolutionOption,
        servoMaxAngle,
        setServoMaxAngle,
        servoMinAngle,
        setServoMinAngle,
        servoInitialAngle,
        setServoInitialAngle,
        ledFrequency,
        setLedFrequency,
        ledInitialBrightness,
        setLedInitialBrightness,
        togglePinFrequency,
        setTogglePinFrequency,
        componentName,
        setComponentName,
        namingConvention,
        setNamingConvention,
    } = usePwmCalculator();

    return (
        <>
            <h1>PWM Calculator</h1>
            <p className="mt-4 text-lg text-default-700">
                A tool to help you calculate PWM values for STM32 microcontrollers.
            </p>

            <div className="mt-8 flex flex-col lg:flex-row gap-6 min-h-[300px]">
                <div className="flex-1 space-y-6">
                    <PwmInputGrid
                        sysClock={sysClock}
                        onSysClockChange={setSysClock}
                        pwmFreq={pwmFreq}
                        onPwmFreqChange={setPwmFreq}
                        arrWidth={arrWidth}
                        onArrWidthChange={setArrWidth}
                        dutyCycle={dutyCycle}
                        onDutyCycleChange={setDutyCycle}
                        selectedPreset={selectedPreset}
                        selectedTimer={selectedTimer}
                        onTimerChange={setSelectedTimer}
                        selectedChannel={selectedChannel}
                        onChannelChange={setSelectedChannel}
                        resolutionOptions={resolutionOptions}
                        selectedResolution={selectedResolution}
                        onResolutionChange={setSelectedResolution}
                    />
                </div>
                <PresetPanel
                    selectedPreset={selectedPreset}
                    onPresetChange={handlePresetChange}
                    pwmFreq={pwmFreq}
                    onPwmFreqChange={setPwmFreq}
                    servoMaxAngle={servoMaxAngle}
                    onServoMaxAngleChange={setServoMaxAngle}
                    servoMinAngle={servoMinAngle}
                    onServoMinAngleChange={setServoMinAngle}
                    servoInitialAngle={servoInitialAngle}
                    onServoInitialAngleChange={setServoInitialAngle}
                    ledFrequency={ledFrequency}
                    onLedFrequencyChange={setLedFrequency}
                    ledInitialBrightness={ledInitialBrightness}
                    onLedInitialBrightnessChange={setLedInitialBrightness}
                    togglePinFrequency={togglePinFrequency}
                    onTogglePinFrequencyChange={setTogglePinFrequency}
                    dutyCycle={dutyCycle}
                    onDutyCycleChange={setDutyCycle}
                />
            </div>

            <Divider className="my-8" />

            <CubeMxConfiguration
                selectedOption={selectedResolutionOption}
                arrWidth={arrWidth}
                dutyCycle={dutyCycle}
                selectedChannel={selectedChannel}
                componentName={componentName}
                onComponentNameChange={setComponentName}
                namingConvention={namingConvention}
                onNamingConventionChange={setNamingConvention}
                pwmFreq={pwmFreq}
                sysClock={sysClock}
                selectedTimer={selectedTimer}
                selectedPreset={selectedPreset}
                servoMinAngle={servoMinAngle}
                servoMaxAngle={servoMaxAngle}
                servoInitialAngle={servoInitialAngle}
                ledInitialBrightness={ledInitialBrightness}
            />
        </>
    );
}
