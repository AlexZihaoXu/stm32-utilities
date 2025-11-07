import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateResolutionOptions } from "./utils";
import { MaybePresetKey, NamingConvention, PresetKey, ResolutionOption } from "./types";

interface UsePwmCalculatorReturn {
    sysClock: number;
    setSysClock: (value: number) => void;
    pwmFreq: number;
    setPwmFreq: (value: number) => void;
    arrWidth: number;
    setArrWidth: (value: number) => void;
    dutyCycle: number;
    setDutyCycle: (value: number) => void;
    selectedPreset: MaybePresetKey;
    handlePresetChange: (preset: MaybePresetKey) => void;
    selectedTimer: string;
    setSelectedTimer: (value: string) => void;
    selectedChannel: number;
    setSelectedChannel: (value: number) => void;
    selectedResolution: string;
    setSelectedResolution: (value: string) => void;
    resolutionOptions: ResolutionOption[];
    selectedResolutionOption?: ResolutionOption;
    servoMaxAngle: number;
    setServoMaxAngle: (value: number) => void;
    servoMinAngle: number;
    setServoMinAngle: (value: number) => void;
    servoInitialAngle: number;
    setServoInitialAngle: (value: number) => void;
    ledFrequency: number;
    setLedFrequency: (value: number) => void;
    ledInitialBrightness: number;
    setLedInitialBrightness: (value: number) => void;
    togglePinFrequency: number;
    setTogglePinFrequency: (value: number) => void;
    componentName: string;
    setComponentName: (value: string) => void;
    namingConvention: NamingConvention;
    setNamingConvention: (value: NamingConvention) => void;
}

const DEFAULT_COMPONENT_NAME = "Component";

export const usePwmCalculator = (): UsePwmCalculatorReturn => {
    const [sysClock, setSysClock] = useState<number>(72);
    const [pwmFreq, setPwmFreq] = useState<number>(1000);
    const [arrWidth, setArrWidth] = useState<number>(16);
    const [dutyCycle, setDutyCycle] = useState<number>(50);
    const [selectedPreset, setSelectedPreset] = useState<MaybePresetKey>("");
    const [selectedTimer, setSelectedTimer] = useState<string>("TIM1");
    const [selectedResolution, setSelectedResolution] = useState<string>("");
    const [selectedChannel, setSelectedChannel] = useState<number>(1);

    const [servoMaxAngle, setServoMaxAngle] = useState<number>(180);
    const [servoMinAngle, setServoMinAngle] = useState<number>(0);
    const [servoInitialAngle, setServoInitialAngle] = useState<number>(90);

    const [ledFrequency, setLedFrequency] = useState<number>(1000);
    const [ledInitialBrightness, setLedInitialBrightness] = useState<number>(50);

    const [togglePinFrequency, setTogglePinFrequency] = useState<number>(1);

    const [componentName, setComponentName] = useState<string>(DEFAULT_COMPONENT_NAME);
    const [namingConvention, setNamingConvention] = useState<NamingConvention>("PascalCase");

    const applyPreset = useCallback((preset: PresetKey) => {
        switch (preset) {
            case "standard-servo":
                setPwmFreq(50);
                setDutyCycle(7.5);
                setArrWidth(16);
                break;
            case "led-dimming":
                setPwmFreq(1000);
                setDutyCycle(50);
                setArrWidth(16);
                break;
            case "toggle-pin":
                setPwmFreq(1);
                setDutyCycle(50);
                setArrWidth(16);
                setSelectedResolution("");
                break;
            default:
                break;
        }
    }, []);

    const handlePresetChange = useCallback((preset: MaybePresetKey) => {
        if (preset) {
            applyPreset(preset);
        }
        setSelectedPreset(preset);
    }, [applyPreset]);

    const resolutionOptions = useMemo(
        () => calculateResolutionOptions(sysClock, arrWidth, pwmFreq),
        [sysClock, arrWidth, pwmFreq]
    );

    const selectedResolutionOption = useMemo(
        () => resolutionOptions.find((option) => option.key === selectedResolution),
        [resolutionOptions, selectedResolution]
    );

    useEffect(() => {
        if (selectedPreset === "toggle-pin") {
            if (selectedResolution !== "") {
                setSelectedResolution("");
            }
            return;
        }

        if (resolutionOptions.length === 0) {
            if (selectedResolution !== "") {
                setSelectedResolution("");
            }
            return;
        }

        const current = resolutionOptions.find((option) => option.key === selectedResolution);
        if (!current) {
            setSelectedResolution(resolutionOptions[0].key);
        }
    }, [resolutionOptions, selectedResolution, selectedPreset]);

    return {
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
    };
};
