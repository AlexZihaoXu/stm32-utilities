import DefaultLayout from "@/layouts/default";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import { MdWarning } from "react-icons/md";

const arrOptions = [
    { key: "16", label: "16 bits" },
    { key: "32", label: "32 bits" },
];

export default function PWMCalculator() {
    const [sysClock, setSysClock] = useState<number>(72); // Default STM32 clock
    const [pwmFreq, setPwmFreq] = useState<number>(1000);
    const [arrWidth, setArrWidth] = useState<number>(16);
    const [dutyCycle, setDutyCycle] = useState<number>(50);
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    const [selectedTimer, setSelectedTimer] = useState<string>("TIM1");
    const [selectedResolution, setSelectedResolution] = useState<string>("");
    const [selectedChannel, setSelectedChannel] = useState<number>(1);

    // Servo configuration
    const [servoMaxAngle, setServoMaxAngle] = useState<number>(180);
    const [servoMinAngle, setServoMinAngle] = useState<number>(0);
    const [servoInitialAngle, setServoInitialAngle] = useState<number>(90);

    // LED Dimming configuration
    const [ledFrequency, setLedFrequency] = useState<number>(1000);
    const [ledInitialBrightness, setLedInitialBrightness] = useState<number>(50);

    // Toggle Pin configuration
    const [togglePinFrequency, setTogglePinFrequency] = useState<number>(1);

    // Code generation
    const [componentName, setComponentName] = useState<string>("PWM");
    const [namingConvention, setNamingConvention] = useState<string>("UPPERCASE");

    const applyStandardServo = () => {
        setPwmFreq(50);
        setDutyCycle(7.5);
        setArrWidth(16);
    };

    const applyLEDDimming = () => {
        setPwmFreq(1000);
        setDutyCycle(50);
        setArrWidth(16);
    };

    const applyTogglePin = () => {
        setPwmFreq(1);
        setDutyCycle(50);
        setArrWidth(16);
    };

    const presets = [
        {key: "standard-servo", label: "Standard Servo", description: "RC servos with configurable angle range"},
        {key: "led-dimming", label: "LED Dimming", description: "Smooth LED brightness control"},
        {key: "toggle-pin", label: "Toggle Pin", description: "Dynamic frequency toggling"},
    ];

    // Calculate possible PWM resolutions based on system clock and frequency
    const calculateResolutionOptions = () => {
        const timerClock = sysClock * 1000000; // Convert MHz to Hz
        const maxARR = Math.pow(2, arrWidth) - 1;
        const options: Array<{key: string, label: string, arr: number, psc: number}> = [];
        
        // Calculate target counts per PWM period
        const targetCounts = timerClock / pwmFreq;
        
        // Try different prescaler values to find valid combinations
        for (let psc = 0; psc <= 65535; psc++) {
            const arr = Math.round(targetCounts / (psc + 1)) - 1;
            
            // Check if ARR is valid
            if (arr > 0 && arr <= maxARR) {
                const resolution = arr + 1;
                const actualFreq = timerClock / ((psc + 1) * (arr + 1));
                const freqError = Math.abs(actualFreq - pwmFreq) / pwmFreq;
                
                // Only include if frequency error is less than 1%
                if (freqError < 0.01) {
                    const formattedRes = resolution >= 1000000 
                        ? `${(resolution / 1000000).toFixed(1)}M` 
                        : resolution >= 1000 
                            ? `${(resolution / 1000).toFixed(1)}k` 
                            : resolution.toString();
                    
                    options.push({
                        key: `${psc}-${arr}`,
                        label: `${formattedRes} steps`,
                        arr,
                        psc
                    });
                }
            }
            
            // Stop if we've found enough options or ARR is getting too small
            if (arr < 100 || options.length >= 20) break;
        }
        
        // Sort by resolution (descending)
        return options.sort((a, b) => b.arr - a.arr);
    };

    const resolutionOptions = calculateResolutionOptions();

    // Auto-select highest resolution if not already selected or if options changed
    if (resolutionOptions.length > 0 && (!selectedResolution || !resolutionOptions.find(opt => opt.key === selectedResolution))) {
        setSelectedResolution(resolutionOptions[0].key);
    }

    const timerOptions = [
        {label: "TIM1", key: "TIM1"},
        {label: "TIM2", key: "TIM2"},
        {label: "TIM3", key: "TIM3"},
        {label: "TIM4", key: "TIM4"},
        {label: "TIM5", key: "TIM5"},
        {label: "TIM6", key: "TIM6"},
        {label: "TIM7", key: "TIM7"},
        {label: "TIM8", key: "TIM8"},
        {label: "TIM9", key: "TIM9"},
        {label: "TIM10", key: "TIM10"},
        {label: "TIM11", key: "TIM11"},
        {label: "TIM12", key: "TIM12"},
        {label: "TIM13", key: "TIM13"},
        {label: "TIM14", key: "TIM14"},
        {label: "TIM15", key: "TIM15"},
        {label: "TIM16", key: "TIM16"},
        {label: "TIM17", key: "TIM17"},
        {label: "TIM18", key: "TIM18"},
        {label: "TIM19", key: "TIM19"},
        {label: "TIM20", key: "TIM20"},
        {label: "TIM21", key: "TIM21"},
        {label: "TIM22", key: "TIM22"},
        {label: "TIM23", key: "TIM23"},
        {label: "TIM24", key: "TIM24"},
    ];

    // Simple hash function for variable names
    const generateHash = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    };

    // Helper function to format function names based on naming convention
    const formatFunctionName = (baseName: string) => {
        switch (namingConvention) {
            case "UPPERCASE":
                return `${componentName.toUpperCase()}_${baseName}`;
            case "PascalCase":
                return `${componentName}${baseName}`;
            case "camelCase":
                return `${componentName.toLowerCase()}${baseName}`;
            case "snake_case":
                return `${componentName.toLowerCase()}_${baseName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
            default:
                return `${componentName}_${baseName}`;
        }
    };

    // Code generation functions
    const generateInitCode = (pscValue: number, arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        const pulseValue = Math.round((dutyCycle / 100) * arrValue);
        
        return `// Initialize ${selectedTimer} for PWM Generation
// This should be called after MX_${selectedTimer}_Init() in main.c

// Static variables to track PWM state
static uint32_t ${componentName.toLowerCase()}_current_pulse = ${pulseValue};
static uint32_t ${componentName.toLowerCase()}_period = ${arrValue};
static uint32_t ${componentName.toLowerCase()}_prescaler = ${pscValue};

void ${formatFunctionName("Init")}(void) {
    // Timer is already configured by CubeMX with:
    // - Prescaler: ${pscValue}
    // - ARR: ${arrValue}
    // - PWM Frequency: ${pwmFreq} Hz
    
    // Set initial duty cycle (${dutyCycle}%)
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Start PWM on Channel ${channelNum}
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}`;
    };

    const generateGetterCode = (arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        
        return `// Get current PWM duty cycle and frequency

// Get duty cycle as percentage (0-100)
float ${formatFunctionName("GetDutyCycle")}(void) {
    // Use cached value for faster access
    return ((float)${componentName.toLowerCase()}_current_pulse / (float)${componentName.toLowerCase()}_period) * 100.0f;
}

// Get current pulse value (CCR register)
uint32_t ${formatFunctionName("GetPulse")}(void) {
    // Return cached value instead of reading register
    return ${componentName.toLowerCase()}_current_pulse;
}

// Get maximum pulse value (ARR register)
uint32_t ${formatFunctionName("GetMaxPulse")}(void) {
    // Return cached value instead of reading register
    return ${componentName.toLowerCase()}_period;
}

// Get current PWM frequency in Hz
float ${formatFunctionName("GetFrequency")}(void) {
    // Use cached values for calculation
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    return (float)timer_clock / ((${componentName.toLowerCase()}_prescaler + 1) * (${componentName.toLowerCase()}_period + 1));
}

// Sync cached values with hardware (call if timer was modified externally)
void ${formatFunctionName("SyncState")}(void) {
    ${componentName.toLowerCase()}_current_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${componentName.toLowerCase()}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${componentName.toLowerCase()}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}`;
    };

    const generateSetterCode = (arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        
        return `// Set PWM parameters

// Set duty cycle as percentage (0-100)
void ${formatFunctionName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;
    
    ${componentName.toLowerCase()}_current_pulse = (uint32_t)((duty_cycle / 100.0f) * ${componentName.toLowerCase()}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

// Set pulse value directly (0 to ARR)
void ${formatFunctionName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${componentName.toLowerCase()}_period) pulse = ${componentName.toLowerCase()}_period;
    
    ${componentName.toLowerCase()}_current_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

// Change PWM frequency (requires stopping and reconfiguring timer)
// Note: This will reset the duty cycle to 50%
void ${formatFunctionName("SetFrequency")}(uint32_t frequency_hz) {
    // Stop PWM
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
    
    // Calculate new prescaler and period
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;
    
    // Try to maintain high resolution
    ${componentName.toLowerCase()}_prescaler = 0;
    ${componentName.toLowerCase()}_period = target_counts - 1;
    
    // If period exceeds ${arrWidth}-bit limit, adjust prescaler
    while (${componentName.toLowerCase()}_period > ${Math.pow(2, arrWidth) - 1} && ${componentName.toLowerCase()}_prescaler < 65535) {
        ${componentName.toLowerCase()}_prescaler++;
        ${componentName.toLowerCase()}_period = (target_counts / (${componentName.toLowerCase()}_prescaler + 1)) - 1;
    }
    
    // Update timer configuration
    __HAL_TIM_SET_PRESCALER(&h${timerLower}, ${componentName.toLowerCase()}_prescaler);
    __HAL_TIM_SET_AUTORELOAD(&h${timerLower}, ${componentName.toLowerCase()}_period);
    
    // Reset pulse to 50% duty cycle
    ${componentName.toLowerCase()}_current_pulse = ${componentName.toLowerCase()}_period / 2;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Restart PWM
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}`;
    };

    const generateHeaderFile = (pscValue: number, arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        const pulseValue = Math.round((dutyCycle / 100) * arrValue);
        const headerGuard = `${componentName.toUpperCase()}_H`;
        
        return `#ifndef ${headerGuard}
#define ${headerGuard}

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include <stdint.h>

/* Exported types ------------------------------------------------------------*/
/* Exported constants --------------------------------------------------------*/
#define ${componentName.toUpperCase()}_TIMER              ${selectedTimer}
#define ${componentName.toUpperCase()}_CHANNEL            TIM_CHANNEL_${channelNum}
#define ${componentName.toUpperCase()}_DEFAULT_FREQ       ${pwmFreq}
#define ${componentName.toUpperCase()}_DEFAULT_DUTY       ${dutyCycle}

/* Exported variables --------------------------------------------------------*/
// Timer handle (defined in main.c by CubeMX)
extern TIM_HandleTypeDef h${timerLower};

/* Exported functions --------------------------------------------------------*/

/**
 * @brief Initialize PWM with default settings
 * @note Call this after MX_${selectedTimer}_Init() in main.c
 */
void ${formatFunctionName("Init")}(void);

/**
 * @brief Get current duty cycle as percentage
 * @return Duty cycle (0.0 - 100.0)
 */
float ${formatFunctionName("GetDutyCycle")}(void);

/**
 * @brief Get current pulse value (CCR register)
 * @return Pulse value (0 to ARR)
 */
uint32_t ${formatFunctionName("GetPulse")}(void);

/**
 * @brief Get maximum pulse value (ARR register)
 * @return Maximum pulse value
 */
uint32_t ${formatFunctionName("GetMaxPulse")}(void);

/**
 * @brief Get current PWM frequency in Hz
 * @return Frequency in Hz
 */
float ${formatFunctionName("GetFrequency")}(void);

/**
 * @brief Set duty cycle as percentage
 * @param duty_cycle Duty cycle (0.0 - 100.0)
 */
void ${formatFunctionName("SetDutyCycle")}(float duty_cycle);

/**
 * @brief Set pulse value directly
 * @param pulse Pulse value (0 to ARR)
 */
void ${formatFunctionName("SetPulse")}(uint32_t pulse);

/**
 * @brief Change PWM frequency dynamically
 * @param frequency_hz Desired frequency in Hz
 * @note This will reset duty cycle to 50%
 */
void ${formatFunctionName("SetFrequency")}(uint32_t frequency_hz);

/**
 * @brief Synchronize cached state with hardware
 * @note Call if timer was modified externally
 */
void ${formatFunctionName("SyncState")}(void);

#ifdef __cplusplus
}
#endif

#endif /* ${headerGuard} */

/********************** Implementation (.c file) ***********************/

/* Private variables ---------------------------------------------------------*/
// Static variables to track PWM state for performance
static uint32_t ${componentName.toLowerCase()}_current_pulse = ${pulseValue};
static uint32_t ${componentName.toLowerCase()}_period = ${arrValue};
static uint32_t ${componentName.toLowerCase()}_prescaler = ${pscValue};

/* Function implementations --------------------------------------------------*/

void ${formatFunctionName("Init")}(void) {
    // Timer already configured by CubeMX with:
    // - Prescaler: ${pscValue}
    // - ARR: ${arrValue}
    // - PWM Frequency: ${pwmFreq} Hz
    
    // Set initial duty cycle (${dutyCycle}%)
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Start PWM on Channel ${channelNum}
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

float ${formatFunctionName("GetDutyCycle")}(void) {
    return ((float)${componentName.toLowerCase()}_current_pulse / (float)${componentName.toLowerCase()}_period) * 100.0f;
}

uint32_t ${formatFunctionName("GetPulse")}(void) {
    return ${componentName.toLowerCase()}_current_pulse;
}

uint32_t ${formatFunctionName("GetMaxPulse")}(void) {
    return ${componentName.toLowerCase()}_period;
}

float ${formatFunctionName("GetFrequency")}(void) {
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    return (float)timer_clock / ((${componentName.toLowerCase()}_prescaler + 1) * (${componentName.toLowerCase()}_period + 1));
}

void ${formatFunctionName("SyncState")}(void) {
    ${componentName.toLowerCase()}_current_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${componentName.toLowerCase()}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${componentName.toLowerCase()}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}

void ${formatFunctionName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;
    
    ${componentName.toLowerCase()}_current_pulse = (uint32_t)((duty_cycle / 100.0f) * ${componentName.toLowerCase()}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

void ${formatFunctionName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${componentName.toLowerCase()}_period) pulse = ${componentName.toLowerCase()}_period;
    
    ${componentName.toLowerCase()}_current_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

void ${formatFunctionName("SetFrequency")}(uint32_t frequency_hz) {
    // Stop PWM
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
    
    // Calculate new prescaler and period
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;
    
    // Try to maintain high resolution
    ${componentName.toLowerCase()}_prescaler = 0;
    ${componentName.toLowerCase()}_period = target_counts - 1;
    
    // If period exceeds ${arrWidth}-bit limit, adjust prescaler
    while (${componentName.toLowerCase()}_period > ${Math.pow(2, arrWidth) - 1} && ${componentName.toLowerCase()}_prescaler < 65535) {
        ${componentName.toLowerCase()}_prescaler++;
        ${componentName.toLowerCase()}_period = (target_counts / (${componentName.toLowerCase()}_prescaler + 1)) - 1;
    }
    
    // Update timer configuration
    __HAL_TIM_SET_PRESCALER(&h${timerLower}, ${componentName.toLowerCase()}_prescaler);
    __HAL_TIM_SET_AUTORELOAD(&h${timerLower}, ${componentName.toLowerCase()}_period);
    
    // Reset pulse to 50% duty cycle
    ${componentName.toLowerCase()}_current_pulse = ${componentName.toLowerCase()}_period / 2;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Restart PWM
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}`;
    };

    const generateHeaderOnly = (pscValue: number, arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        const headerGuard = `${componentName.toUpperCase()}_H`;
        const pulseValue = Math.round((dutyCycle / 100) * arrValue);
        const hash = generateHash(componentName);
        const varPrefix = `${componentName.toLowerCase()}_${hash}`;
        
        return `#ifndef ${headerGuard}
#define ${headerGuard}

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include <stdint.h>

/* Exported types ------------------------------------------------------------*/
/* Exported constants --------------------------------------------------------*/
#define ${componentName.toUpperCase()}_TIMER              ${selectedTimer}
#define ${componentName.toUpperCase()}_CHANNEL            TIM_CHANNEL_${channelNum}
#define ${componentName.toUpperCase()}_DEFAULT_FREQ       ${pwmFreq}
#define ${componentName.toUpperCase()}_DEFAULT_DUTY       ${dutyCycle}
#define ${componentName.toUpperCase()}_PRESCALER          ${pscValue}
#define ${componentName.toUpperCase()}_PERIOD             ${arrValue}

/* Exported variables --------------------------------------------------------*/
// Timer handle (defined in main.c by CubeMX)
extern TIM_HandleTypeDef h${timerLower};

/* Private variables (static inline safe) ------------------------------------*/
// Static variables with hash to prevent conflicts: ${hash}
static uint32_t ${varPrefix}_pulse = ${pulseValue};
static uint32_t ${varPrefix}_period = ${arrValue};
static uint32_t ${varPrefix}_prescaler = ${pscValue};

/* Inline function implementations -------------------------------------------*/

/**
 * @brief Initialize PWM with default settings
 * @note Call this after MX_${selectedTimer}_Init() in main.c
 */
static inline void ${formatFunctionName("Init")}(void) {
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

/**
 * @brief Get current duty cycle as percentage
 * @return Duty cycle (0.0 - 100.0)
 */
static inline float ${formatFunctionName("GetDutyCycle")}(void) {
    return ((float)${varPrefix}_pulse / (float)${varPrefix}_period) * 100.0f;
}

/**
 * @brief Get current pulse value (CCR register)
 * @return Pulse value (0 to ARR)
 */
static inline uint32_t ${formatFunctionName("GetPulse")}(void) {
    return ${varPrefix}_pulse;
}

/**
 * @brief Get maximum pulse value (ARR register)
 * @return Maximum pulse value
 */
static inline uint32_t ${formatFunctionName("GetMaxPulse")}(void) {
    return ${varPrefix}_period;
}

/**
 * @brief Get current PWM frequency in Hz
 * @return Frequency in Hz
 */
static inline float ${formatFunctionName("GetFrequency")}(void) {
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    return (float)timer_clock / ((${varPrefix}_prescaler + 1) * (${varPrefix}_period + 1));
}

/**
 * @brief Set duty cycle as percentage
 * @param duty_cycle Duty cycle (0.0 - 100.0)
 */
static inline void ${formatFunctionName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;
    
    ${varPrefix}_pulse = (uint32_t)((duty_cycle / 100.0f) * ${varPrefix}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
}

/**
 * @brief Set pulse value directly
 * @param pulse Pulse value (0 to ARR)
 */
static inline void ${formatFunctionName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${varPrefix}_period) pulse = ${varPrefix}_period;
    
    ${varPrefix}_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
}

/**
 * @brief Change PWM frequency dynamically
 * @param frequency_hz Desired frequency in Hz
 * @note This will reset duty cycle to 50%
 */
static inline void ${formatFunctionName("SetFrequency")}(uint32_t frequency_hz) {
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
    
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;
    
    ${varPrefix}_prescaler = 0;
    ${varPrefix}_period = target_counts - 1;
    
    while (${varPrefix}_period > ${Math.pow(2, arrWidth) - 1} && ${varPrefix}_prescaler < 65535) {
        ${varPrefix}_prescaler++;
        ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
    }
    
    __HAL_TIM_SET_PRESCALER(&h${timerLower}, ${varPrefix}_prescaler);
    __HAL_TIM_SET_AUTORELOAD(&h${timerLower}, ${varPrefix}_period);
    
    ${varPrefix}_pulse = ${varPrefix}_period / 2;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
    
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

/**
 * @brief Synchronize cached state with hardware
 * @note Call if timer was modified externally
 */
static inline void ${formatFunctionName("SyncState")}(void) {
    ${varPrefix}_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${varPrefix}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${varPrefix}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}

#ifdef __cplusplus
}
#endif

#endif /* ${headerGuard} */`;
    };

    const generateSourceFile = (pscValue: number, arrValue: number) => {
        const timerLower = selectedTimer.toLowerCase();
        const channelNum = selectedChannel;
        const pulseValue = Math.round((dutyCycle / 100) * arrValue);
        
        return `/* Includes ------------------------------------------------------------------*/
#include "${componentName.toLowerCase()}.h"

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
// Static variables to track PWM state for performance
static uint32_t ${componentName.toLowerCase()}_current_pulse = ${pulseValue};
static uint32_t ${componentName.toLowerCase()}_period = ${arrValue};
static uint32_t ${componentName.toLowerCase()}_prescaler = ${pscValue};

/* Private function prototypes -----------------------------------------------*/
/* Exported functions --------------------------------------------------------*/

/**
 * @brief Initialize PWM with default settings
 */
void ${formatFunctionName("Init")}(void) {
    // Timer already configured by CubeMX with:
    // - Prescaler: ${pscValue}
    // - ARR: ${arrValue}
    // - PWM Frequency: ${pwmFreq} Hz
    
    // Set initial duty cycle (${dutyCycle}%)
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Start PWM on Channel ${channelNum}
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

/**
 * @brief Get current duty cycle as percentage
 */
float ${formatFunctionName("GetDutyCycle")}(void) {
    return ((float)${componentName.toLowerCase()}_current_pulse / (float)${componentName.toLowerCase()}_period) * 100.0f;
}

/**
 * @brief Get current pulse value (CCR register)
 */
uint32_t ${formatFunctionName("GetPulse")}(void) {
    return ${componentName.toLowerCase()}_current_pulse;
}

/**
 * @brief Get maximum pulse value (ARR register)
 */
uint32_t ${formatFunctionName("GetMaxPulse")}(void) {
    return ${componentName.toLowerCase()}_period;
}

/**
 * @brief Get current PWM frequency in Hz
 */
float ${formatFunctionName("GetFrequency")}(void) {
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    return (float)timer_clock / ((${componentName.toLowerCase()}_prescaler + 1) * (${componentName.toLowerCase()}_period + 1));
}

/**
 * @brief Synchronize cached state with hardware
 */
void ${formatFunctionName("SyncState")}(void) {
    ${componentName.toLowerCase()}_current_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${componentName.toLowerCase()}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${componentName.toLowerCase()}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}

/**
 * @brief Set duty cycle as percentage
 */
void ${formatFunctionName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;
    
    ${componentName.toLowerCase()}_current_pulse = (uint32_t)((duty_cycle / 100.0f) * ${componentName.toLowerCase()}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

/**
 * @brief Set pulse value directly
 */
void ${formatFunctionName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${componentName.toLowerCase()}_period) pulse = ${componentName.toLowerCase()}_period;
    
    ${componentName.toLowerCase()}_current_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

/**
 * @brief Change PWM frequency dynamically
 */
void ${formatFunctionName("SetFrequency")}(uint32_t frequency_hz) {
    // Stop PWM
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
    
    // Calculate new prescaler and period
    uint32_t timer_clock = ${sysClock * 1000000}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;
    
    // Try to maintain high resolution
    ${componentName.toLowerCase()}_prescaler = 0;
    ${componentName.toLowerCase()}_period = target_counts - 1;
    
    // If period exceeds ${arrWidth}-bit limit, adjust prescaler
    while (${componentName.toLowerCase()}_period > ${Math.pow(2, arrWidth) - 1} && ${componentName.toLowerCase()}_prescaler < 65535) {
        ${componentName.toLowerCase()}_prescaler++;
        ${componentName.toLowerCase()}_period = (target_counts / (${componentName.toLowerCase()}_prescaler + 1)) - 1;
    }
    
    // Update timer configuration
    __HAL_TIM_SET_PRESCALER(&h${timerLower}, ${componentName.toLowerCase()}_prescaler);
    __HAL_TIM_SET_AUTORELOAD(&h${timerLower}, ${componentName.toLowerCase()}_period);
    
    // Reset pulse to 50% duty cycle
    ${componentName.toLowerCase()}_current_pulse = ${componentName.toLowerCase()}_period / 2;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
    
    // Restart PWM
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

/* Private functions ---------------------------------------------------------*/`;
    };

    return (
        <DefaultLayout>
            <h1>PWM Calculator</h1>
            <p className="mt-4 text-lg text-default-700">
                A tool to help you calculate PWM values for STM32 microcontrollers.
            </p>

            <div className="mt-8 flex flex-col lg:flex-row gap-6 min-h-[300px]">
                <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            isRequired
                            label="System Clock (MHz)"
                            type="number"
                            value={sysClock.toString()}
                            onValueChange={(value) => setSysClock(Number(value))}
                            min="1"
                            max="1000"
                        />
                        <Input
                            isRequired
                            label={`${selectedPreset === "toggle-pin" ? "Initial " : ""}PWM Frequency (Hz)${selectedPreset ? ` [${presets.find(p => p.key === selectedPreset)?.label}]` : ''}`}
                            type="number"
                            value={pwmFreq.toString()}
                            onValueChange={(value) => setPwmFreq(Number(value))}
                            min="1"
                            isDisabled={!!selectedPreset}
                        />
                        <Select
                            isRequired
                            label="ARR Register Width"
                            selectedKeys={[arrWidth.toString()]}
                            onSelectionChange={(keys) => setArrWidth(Number(Array.from(keys)[0]))}
                        >
                            {arrOptions.map((option) => (
                                <SelectItem key={option.key}>{option.label}</SelectItem>
                            ))}
                        </Select>
                        <Input
                            isRequired
                            label={`Initial Duty Cycle (%)${selectedPreset ? ` [${presets.find(p => p.key === selectedPreset)?.label}]` : ''}`}
                            type="number"
                            value={dutyCycle.toString()}
                            onValueChange={(value) => setDutyCycle(Number(value))}
                            min="0"
                            max="100"
                            isDisabled={!!selectedPreset}
                        />
                        <Autocomplete
                            isRequired
                            label="Timer"
                            defaultItems={timerOptions}
                            selectedKey={selectedTimer}
                            onSelectionChange={(key) => { if (key) setSelectedTimer(key as string); }}
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
                                if (key) setSelectedChannel(Number(key));
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
                                const key = Array.from(keys)[0] as string;
                                if (key) setSelectedResolution(key);
                            }}
                            placeholder={selectedPreset === "toggle-pin" ? "Dynamic" : (resolutionOptions.length === 0 ? "No valid resolution" : "Select resolution")}
                            isDisabled={resolutionOptions.length === 0 || selectedPreset === "toggle-pin"}
                        >
                            {selectedPreset === "toggle-pin" ? [] : resolutionOptions.map((option) => (
                                <SelectItem key={option.key} textValue={option.label}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="w-full lg:w-80 lg:border-l lg:border-default-100 lg:pl-6 space-y-4">
                    <h3 className="text-lg font-semibold">Presets</h3>
                    <Select
                        isClearable={true}
                        selectedKeys={selectedPreset ? [selectedPreset] : []}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0] as string;
                            // Always apply preset values when selected, even if it's the same preset
                            if (key) {
                                if (key === "standard-servo") applyStandardServo();
                                else if (key === "led-dimming") applyLEDDimming();
                                else if (key === "toggle-pin") {
                                    applyTogglePin();
                                    setSelectedResolution("");
                                }
                            }
                            setSelectedPreset(key);
                        }}
                        placeholder="Select a preset"
                    >
                        {presets.map((preset) => (
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
                                    onValueChange={(value) => setPwmFreq(Number(value))}
                                    min="1"
                                    color={pwmFreq < 50 ? "warning" : "default"}
                                />
                            </div>
                            <Input
                                isRequired
                                label="Max Angle (degrees)"
                                type="number"
                                value={servoMaxAngle.toString()}
                                onValueChange={(value) => setServoMaxAngle(Number(value))}
                                min={servoMinAngle + 1}
                            />
                            <Input
                                isRequired
                                label="Min Angle (degrees)"
                                type="number"
                                value={servoMinAngle.toString()}
                                onValueChange={(value) => setServoMinAngle(Number(value))}
                                max={servoMaxAngle - 1}
                            />
                            <Input
                                isRequired
                                label="Initial Angle (degrees)"
                                type="number"
                                value={servoInitialAngle.toString()}
                                onValueChange={(value) => {
                                    const angle = Number(value);
                                    setServoInitialAngle(angle);
                                    // Calculate duty cycle based on angle
                                    // Standard servo: 0° = 5% (1ms), 180° = 10% (2ms) at 50Hz
                                    const minDutyCycle = 5; // 1ms at 50Hz
                                    const maxDutyCycle = 10; // 2ms at 50Hz
                                    const angleRange = servoMaxAngle - servoMinAngle;
                                    const angleOffset = angle - servoMinAngle;
                                    const calculatedDutyCycle = minDutyCycle + (angleOffset / angleRange) * (maxDutyCycle - minDutyCycle);
                                    setDutyCycle(Number(calculatedDutyCycle.toFixed(2)));
                                }}
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
                                    const newValue = Number(value);
                                    setLedFrequency(newValue);
                                    setPwmFreq(newValue);
                                }}
                                min="1"
                            />
                            <Input
                                isRequired
                                label="Initial Brightness (%)"
                                type="number"
                                value={ledInitialBrightness.toString()}
                                onValueChange={(value) => {
                                    const newValue = Number(value);
                                    setLedInitialBrightness(newValue);
                                    setDutyCycle(newValue);
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
                                    const newValue = Number(value);
                                    setTogglePinFrequency(newValue);
                                    setPwmFreq(newValue);
                                }}
                                min="1"
                            />
                            <Input
                                isRequired
                                label="Duty Cycle (%)"
                                type="number"
                                value={dutyCycle.toString()}
                                onValueChange={(value) => setDutyCycle(Number(value))}
                                min="0"
                                max="100"
                            />
                        </div>
                    ) : selectedPreset ? (
                        <p>Configuration for {presets.find(p => p.key === selectedPreset)?.label}</p>
                    ) : (
                        <p className="text-default-500">Please select a preset to start configuring</p>
                    )}
                </div>
            </div>

            <Divider className="my-8" />

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">STM32 CubeMX / CubeIDE Configuration</h2>
                <p className="text-default-600 mb-6">
                    Configure these settings in your STM32 project to match the calculated PWM parameters above.
                </p>
                
                {selectedResolution ? (() => {
                    const selectedOption = resolutionOptions.find(opt => opt.key === selectedResolution);
                    const pscValue = selectedOption?.psc ?? 0;
                    const arrValue = selectedOption?.arr ?? 0;
                    
                    return (
                        <div className="space-y-6">
                            {/* Counter Settings and PWM Generation Channel - Side by Side */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Counter Settings */}
                                <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                                    <h3 className="text-lg font-semibold mb-3">Counter Settings</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Prescaler (PSC - {arrWidth} bits value)</span>
                                            <span className="font-mono font-semibold flex-shrink-0">{pscValue}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Counter Mode</span>
                                            <span className="font-semibold text-sm flex-shrink-0">Up</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Counter Period (AutoReload Register - {arrWidth} bits value)</span>
                                            <span className="font-mono font-semibold flex-shrink-0">{arrValue}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Internal Clock Division (CKD)</span>
                                            <span className="font-semibold text-sm flex-shrink-0">No Division</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">auto-reload preload</span>
                                            <span className="font-semibold text-sm flex-shrink-0">Enable</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PWM Generation Channel */}
                                <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                                    <h3 className="text-lg font-semibold mb-3">PWM Generation Channel {selectedChannel}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Mode</span>
                                            <span className="font-semibold text-sm flex-shrink-0">PWM mode 1</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Pulse ({arrWidth} bits value)</span>
                                            <span className="font-mono font-semibold flex-shrink-0">{Math.round((dutyCycle / 100) * arrValue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Output compare preload</span>
                                            <span className="font-semibold text-sm flex-shrink-0">Enable</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">Fast Mode</span>
                                            <span className="font-semibold text-sm flex-shrink-0">Disable</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">CH Polarity</span>
                                            <span className="font-semibold text-sm flex-shrink-0">High</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 gap-4">
                                            <span className="text-sm text-default-700 flex-shrink">CH Idle State</span>
                                            <span className="font-semibold text-sm flex-shrink-0">Reset</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Code Implementation */}
                            <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                                <h3 className="text-lg font-semibold mb-3">Code Implementation</h3>
                                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Component Name"
                                        placeholder="PWM"
                                        value={componentName}
                                        onValueChange={setComponentName}
                                        description="Prefix for generated functions"
                                    />
                                    <Select
                                        label="Naming Convention"
                                        selectedKeys={[namingConvention]}
                                        onSelectionChange={(keys) => {
                                            const key = Array.from(keys)[0] as string;
                                            if (key) setNamingConvention(key);
                                        }}
                                        description="Function naming style"
                                        renderValue={(items) => {
                                            return items.map((item) => (
                                                <div key={item.key} className="flex items-center gap-2">
                                                    <span>{item.textValue}</span>
                                                </div>
                                            ));
                                        }}
                                    >
                                        <SelectItem 
                                            key="UPPERCASE" 
                                            textValue={`UPPERCASE (${componentName.toUpperCase()}_Init)`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-small">UPPERCASE</span>
                                                <span className="text-tiny text-default-400 font-mono">{componentName.toUpperCase()}_Init</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem 
                                            key="PascalCase" 
                                            textValue={`PascalCase (${componentName}Init)`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-small">PascalCase</span>
                                                <span className="text-tiny text-default-400 font-mono">{componentName}Init</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem 
                                            key="camelCase" 
                                            textValue={`camelCase (${componentName.toLowerCase()}Init)`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-small">camelCase</span>
                                                <span className="text-tiny text-default-400 font-mono">{componentName.toLowerCase()}Init</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem 
                                            key="snake_case" 
                                            textValue={`snake_case (${componentName.toLowerCase()}_init)`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-small">snake_case</span>
                                                <span className="text-tiny text-default-400 font-mono">{componentName.toLowerCase()}_init</span>
                                            </div>
                                        </SelectItem>
                                    </Select>
                                </div>
                                <Tabs aria-label="Code sections" className="w-full">
                                    <Tab key="header-only" title="Header Only (.h)">
                                        <Card>
                                            <CardBody>
                                                <div className="mb-2 text-sm text-default-600">
                                                    File: <span className="font-mono font-semibold">{componentName.toLowerCase()}.h</span>
                                                    <span className="ml-2 text-xs text-default-500">(Single-file solution with inline functions)</span>
                                                </div>
                                                <Editor
                                                    height="70vh"
                                                    defaultLanguage="c"
                                                    value={generateHeaderOnly(pscValue, arrValue)}
                                                    theme="vs-dark"
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: 'on',
                                                        scrollBeyondLastLine: false,
                                                    }}
                                                />
                                            </CardBody>
                                        </Card>
                                    </Tab>
                                    <Tab key="header" title="Header File (.h)">
                                        <Card>
                                            <CardBody>
                                                <div className="mb-2 text-sm text-default-600">
                                                    File: <span className="font-mono font-semibold">{componentName.toLowerCase()}.h</span>
                                                    <span className="ml-2 text-xs text-default-500">(Requires separate .c file)</span>
                                                </div>
                                                <Editor
                                                    height="70vh"
                                                    defaultLanguage="c"
                                                    value={generateHeaderFile(pscValue, arrValue)}
                                                    theme="vs-dark"
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: 'on',
                                                        scrollBeyondLastLine: false,
                                                    }}
                                                />
                                            </CardBody>
                                        </Card>
                                    </Tab>
                                    <Tab key="source-file" title="Source File (.c)">
                                        <Card>
                                            <CardBody>
                                                <div className="mb-2 text-sm text-default-600">
                                                    File: <span className="font-mono font-semibold">{componentName.toLowerCase()}.c</span>
                                                    <span className="ml-2 text-xs text-default-500">(Pairs with Header File)</span>
                                                </div>
                                                <Editor
                                                    height="70vh"
                                                    defaultLanguage="c"
                                                    value={generateSourceFile(pscValue, arrValue)}
                                                    theme="vs-dark"
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: 'on',
                                                        scrollBeyondLastLine: false,
                                                    }}
                                                />
                                            </CardBody>
                                        </Card>
                                    </Tab>
                                </Tabs>
                            </div>
                        </div>
                    );
                })() : (
                    <div className="text-center py-8 text-default-500">
                        Please select a PWM resolution above to see the configuration settings.
                    </div>
                )}
            </div>
        </DefaultLayout>
    );
}