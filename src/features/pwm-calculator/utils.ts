import { NamingConvention, ResolutionOption } from "./types";

export const calculateResolutionOptions = (
    sysClock: number,
    arrWidth: number,
    pwmFreq: number
): ResolutionOption[] => {
    const timerClock = sysClock * 1_000_000;
    const maxARR = Math.pow(2, arrWidth) - 1;
    const targetCounts = timerClock / pwmFreq;
    const options: ResolutionOption[] = [];

    for (let psc = 0; psc <= 65_535; psc++) {
        const arr = Math.round(targetCounts / (psc + 1)) - 1;

        if (arr > 0 && arr <= maxARR) {
            const resolution = arr + 1;
            const actualFreq = timerClock / ((psc + 1) * (arr + 1));
            const freqError = Math.abs(actualFreq - pwmFreq) / pwmFreq;

            if (freqError < 0.01) {
                const formattedRes =
                    resolution >= 1_000_000
                        ? `${(resolution / 1_000_000).toFixed(1)}M`
                        : resolution >= 1_000
                            ? `${(resolution / 1_000).toFixed(1)}k`
                            : resolution.toString();

                options.push({
                    key: `${psc}-${arr}`,
                    label: `${formattedRes} steps`,
                    arr,
                    psc,
                });
            }
        }

        if (arr < 100 || options.length >= 20) {
            break;
        }
    }

    return options.sort((a, b) => b.arr - a.arr);
};

export const generateHash = (value: string): string => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
};

export const formatFunctionName = (
    componentName: string,
    namingConvention: NamingConvention,
    baseName: string
): string => {
    // Add PWM prefix to base PWM functions
    const pwmBaseFunctions = [
        "PwmInit", "GetDutyCycle", "GetPulse", "GetMaxPulse", "GetFrequency",
        "SetDutyCycle", "SetPulse", "SetFrequency", "SyncState"
    ];
    
    const needsPwmPrefix = pwmBaseFunctions.includes(baseName);
    
    switch (namingConvention) {
        case "UPPERCASE":
            if (needsPwmPrefix) {
                const upperBase = baseName.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, "");
                return `${componentName.toUpperCase()}_${upperBase}`;
            }
            return `${componentName.toUpperCase()}_${baseName.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, "")}`;
        case "PascalCase":
            return needsPwmPrefix ? `${componentName}${baseName}` : `${componentName}${baseName}`;
        case "camelCase":
            return needsPwmPrefix ? `${componentName.toLowerCase()}${baseName}` : `${componentName.toLowerCase()}${baseName}`;
        case "snake_case":
            if (needsPwmPrefix) {
                const snakeBase = baseName.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
                return `${componentName.toLowerCase()}_${snakeBase}`;
            }
            return `${componentName.toLowerCase()}_${baseName
                .replace(/([A-Z])/g, "_$1")
                .toLowerCase()
                .replace(/^_/, "")}`;
        default:
            return needsPwmPrefix ? `${componentName}_${baseName}` : `${componentName}_${baseName}`;
    }
};

export interface CodeTemplateParams {
    componentName: string;
    namingConvention: NamingConvention;
    selectedTimer: string;
    selectedChannel: number;
    dutyCycle: number;
    pwmFreq: number;
    arrWidth: number;
    sysClock: number;
    arrValue: number;
    pscValue: number;
    presetKey?: string;
    servoMinAngle?: number;
    servoMaxAngle?: number;
    servoInitialAngle?: number;
    ledInitialBrightness?: number;
}

export interface CodeTemplates {
    headerOnly: string;
    header: string;
    source: string;
}

// Helper function to generate servo-specific code
const generateServoCode = (
    formatName: (base: string) => string,
    componentName: string,
    timerLower: string,
    channelNum: number,
    varPrefix: string,
    minAngle: number,
    maxAngle: number,
    isInline: boolean
): { declarations: string; implementations: string } => {
    const minPulseUs = 1000; // 1ms for 0 degrees
    const maxPulseUs = 2000; // 2ms for 180 degrees (typical servo)
    const minDutyCycle = 5.0; // 1ms / 20ms * 100
    const maxDutyCycle = 10.0; // 2ms / 20ms * 100
    
    const inlineKeyword = isInline ? "static inline " : "";
    
    const declarations = `
/* Servo Control Constants ---------------------------------------------------*/
#define ${componentName.toUpperCase()}_MIN_ANGLE    ${minAngle}
#define ${componentName.toUpperCase()}_MAX_ANGLE    ${maxAngle}
#define ${componentName.toUpperCase()}_MIN_PULSE_US ${minPulseUs}
#define ${componentName.toUpperCase()}_MAX_PULSE_US ${maxPulseUs}

/* Servo Control Functions ---------------------------------------------------*/

/**
 * @brief Set angle
 * @param angle_degrees Target angle (${minAngle} to ${maxAngle} degrees)
 */
${inlineKeyword}void ${formatName("SetAngle")}(float angle_degrees);

/**
 * @brief Get current angle
 * @return Current angle in degrees
 */
${inlineKeyword}float ${formatName("GetAngle")}(void);

/**
 * @brief Get minimum angle setting
 * @return Minimum angle in degrees
 */
${inlineKeyword}float ${formatName("GetMinAngle")}(void);

/**
 * @brief Get maximum angle setting
 * @return Maximum angle in degrees
 */
${inlineKeyword}float ${formatName("GetMaxAngle")}(void);`;

    const implementations = `
${inlineKeyword}void ${formatName("SetAngle")}(float angle_degrees) {
    // Clamp angle to valid range
    if (angle_degrees < ${minAngle}.0f) angle_degrees = ${minAngle}.0f;
    if (angle_degrees > ${maxAngle}.0f) angle_degrees = ${maxAngle}.0f;
    
    // Map angle to duty cycle
    // Servo pulse width: ${minPulseUs}us (${minAngle}°) to ${maxPulseUs}us (${maxAngle}°)
    float angle_range = ${maxAngle}.0f - ${minAngle}.0f;
    float angle_normalized = (angle_degrees - ${minAngle}.0f) / angle_range;
    float duty_cycle = ${minDutyCycle}f + (angle_normalized * ${maxDutyCycle - minDutyCycle}f);
    
    ${varPrefix}_pulse = (uint32_t)((duty_cycle / 100.0f) * ${varPrefix}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
}

${inlineKeyword}float ${formatName("GetAngle")}(void) {
    float duty_cycle = ((float)${varPrefix}_pulse / (float)${varPrefix}_period) * 100.0f;
    float angle_normalized = (duty_cycle - ${minDutyCycle}f) / ${maxDutyCycle - minDutyCycle}f;
    return ${minAngle}.0f + (angle_normalized * ${maxAngle - minAngle}.0f);
}

${inlineKeyword}float ${formatName("GetMinAngle")}(void) {
    return ${minAngle}.0f;
}

${inlineKeyword}float ${formatName("GetMaxAngle")}(void) {
    return ${maxAngle}.0f;
}`;

    return { declarations, implementations };
};

// Helper function to generate LED dimming-specific code
const generateLedCode = (
    formatName: (base: string) => string,
    _componentName: string,
    _timerLower: string,
    _channelNum: number,
    _varPrefix: string,
    isInline: boolean
): { declarations: string; implementations: string } => {
    const inlineKeyword = isInline ? "static inline " : "";
    
    const declarations = `
/* LED Dimming Functions -----------------------------------------------------*/

/**
 * @brief Set LED brightness
 * @param brightness_percent Brightness level (0 = off, 100 = max)
 */
${inlineKeyword}void ${formatName("SetBrightness")}(float brightness_percent);

/**
 * @brief Get current LED brightness
 * @return Brightness percentage (0.0 - 100.0)
 */
${inlineKeyword}float ${formatName("GetBrightness")}(void);`;

    const implementations = `
${inlineKeyword}void ${formatName("SetBrightness")}(float brightness_percent) {
    // Brightness is just duty cycle
    ${formatName("SetDutyCycle")}(brightness_percent);
}

${inlineKeyword}float ${formatName("GetBrightness")}(void) {
    return ${formatName("GetDutyCycle")}();
}`;

    return { declarations, implementations };
};

// Helper function to generate toggle pin-specific code
const generateTogglePinCode = (
    formatName: (base: string) => string,
    _componentName: string,
    timerLower: string,
    channelNum: number,
    varPrefix: string,
    arrWidth: number,
    sysClock: number,
    isInline: boolean
): { declarations: string; implementations: string } => {
    const maxPeriod = Math.pow(2, arrWidth) - 1;
    const timerClock = sysClock * 1_000_000;
    const inlineKeyword = isInline ? "static inline " : "";
    const staticKeyword = isInline ? "static " : "";
    
    const declarations = `
/* Toggle Pin Configuration --------------------------------------------------*/
#define ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE    50  // Cache for frequency intervals
#define ${varPrefix.toUpperCase()}_TICK_DEBOUNCE      1   // Set to 0 to disable tick debouncing

/* Toggle Pin Functions ------------------------------------------------------*/

/**
 * @brief Initialize frequency cache for fast runtime switching
 * @note Call this once during initialization after ${formatName("Init")}()
 * @note Pre-calculates PSC/ARR values at regular intervals (every 1kHz, 10kHz, etc.)
 */
${inlineKeyword}void ${formatName("InitFrequencyCache")}(void);

/**
 * @brief Set toggle frequency with interval-based cached lookup (50% duty cycle maintained)
 * @param frequency_hz Desired toggle frequency in Hz
 * @note Uses nearest cached interval to minimize calculation iterations
 */
${inlineKeyword}void ${formatName("SetToggleFrequency")}(uint32_t frequency_hz);

/**
 * @brief Get current toggle frequency
 * @return Frequency in Hz
 */
${inlineKeyword}float ${formatName("GetToggleFrequency")}(void);

/**
 * @brief Start toggling at configured frequency
 */
${inlineKeyword}void ${formatName("StartToggle")}(void);

/**
 * @brief Stop toggling (PWM stopped)
 */
${inlineKeyword}void ${formatName("StopToggle")}(void);`;

    const implementations = `
// Frequency cache for fast runtime switching (interval-based)
${staticKeyword}struct {
    uint32_t freq;
    uint32_t psc;
    uint32_t arr;
} ${varPrefix}_freq_cache[${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE];
${staticKeyword}uint8_t ${varPrefix}_freq_cache_count = 0;
${staticKeyword}uint32_t ${varPrefix}_last_tick = 0;

${inlineKeyword}void ${formatName("InitFrequencyCache")}(void) {
    // Pre-calculate at intervals to cover frequency ranges efficiently:
    // - Every 1 Hz from 1-10 Hz (10 entries)
    // - Every 10 Hz from 10-100 Hz (9 entries)
    // - Every 100 Hz from 100-1000 Hz (9 entries)
    // - Every 1 kHz from 1k-10k Hz (9 entries)
    // - Every 10 kHz from 10k-100k Hz (9 entries)
    
    uint32_t timer_clock = ${timerClock};
    uint32_t freq, target_counts, psc, arr;
    uint8_t i;
    
    ${varPrefix}_freq_cache_count = 0;
    
    // 1-10 Hz: every 1 Hz
    for (i = 0; i < 10; i++) {
        freq = i + 1;
        if (${varPrefix}_freq_cache_count >= ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE) break;
        
        target_counts = timer_clock / freq;
        psc = 0;
        arr = target_counts - 1;
        
        while (arr > ${maxPeriod} && psc < 65535) {
            psc++;
            arr = (target_counts / (psc + 1)) - 1;
        }
        
        if (arr <= ${maxPeriod} && psc <= 65535) {
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].freq = freq;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].psc = psc;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].arr = arr;
            ${varPrefix}_freq_cache_count++;
        }
    }
    
    // 10-100 Hz: every 10 Hz
    for (i = 0; i < 9; i++) {
        freq = (i + 2) * 10;
        if (${varPrefix}_freq_cache_count >= ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE) break;
        
        target_counts = timer_clock / freq;
        psc = 0;
        arr = target_counts - 1;
        
        while (arr > ${maxPeriod} && psc < 65535) {
            psc++;
            arr = (target_counts / (psc + 1)) - 1;
        }
        
        if (arr <= ${maxPeriod} && psc <= 65535) {
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].freq = freq;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].psc = psc;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].arr = arr;
            ${varPrefix}_freq_cache_count++;
        }
    }
    
    // 100-1000 Hz: every 100 Hz
    for (i = 0; i < 9; i++) {
        freq = (i + 2) * 100;
        if (${varPrefix}_freq_cache_count >= ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE) break;
        
        target_counts = timer_clock / freq;
        psc = 0;
        arr = target_counts - 1;
        
        while (arr > ${maxPeriod} && psc < 65535) {
            psc++;
            arr = (target_counts / (psc + 1)) - 1;
        }
        
        if (arr <= ${maxPeriod} && psc <= 65535) {
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].freq = freq;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].psc = psc;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].arr = arr;
            ${varPrefix}_freq_cache_count++;
        }
    }
    
    // 1k-10k Hz: every 1 kHz
    for (i = 0; i < 9; i++) {
        freq = (i + 2) * 1000;
        if (${varPrefix}_freq_cache_count >= ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE) break;
        
        target_counts = timer_clock / freq;
        psc = 0;
        arr = target_counts - 1;
        
        while (arr > ${maxPeriod} && psc < 65535) {
            psc++;
            arr = (target_counts / (psc + 1)) - 1;
        }
        
        if (arr <= ${maxPeriod} && psc <= 65535) {
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].freq = freq;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].psc = psc;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].arr = arr;
            ${varPrefix}_freq_cache_count++;
        }
    }
    
    // 10k-100k Hz: every 10 kHz
    for (i = 0; i < 9; i++) {
        freq = (i + 2) * 10000;
        if (${varPrefix}_freq_cache_count >= ${varPrefix.toUpperCase()}_FREQ_CACHE_SIZE) break;
        
        target_counts = timer_clock / freq;
        psc = 0;
        arr = target_counts - 1;
        
        while (arr > ${maxPeriod} && psc < 65535) {
            psc++;
            arr = (target_counts / (psc + 1)) - 1;
        }
        
        if (arr <= ${maxPeriod} && psc <= 65535) {
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].freq = freq;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].psc = psc;
            ${varPrefix}_freq_cache[${varPrefix}_freq_cache_count].arr = arr;
            ${varPrefix}_freq_cache_count++;
        }
    }
}

${inlineKeyword}void ${formatName("SetToggleFrequency")}(uint32_t frequency_hz) {
#if ${varPrefix.toUpperCase()}_TICK_DEBOUNCE
    // Tick debouncing - ignore if called within the same tick
    uint32_t current_tick = HAL_GetTick();
    if (current_tick == ${varPrefix}_last_tick) {
        return;  // Ignore rapid calls within same tick
    }
    ${varPrefix}_last_tick = current_tick;
#endif

    // Check if PWM was running before
    uint8_t was_running = ${formatName("IsToggling")}() && (${formatName("GetFrequency")}() > 0);
    
    // Stop PWM temporarily for configuration
    if (was_running) {
        HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
    }
    
    // Hardware level stop - frequency <= 0
    if (frequency_hz <= 0) {
        // Stop at hardware level, don't restart
        return;
    }
    
    // Find nearest cached frequency as starting point
    uint32_t nearest_psc = 0;
    uint32_t nearest_arr = 0;
    uint32_t min_diff = 0xFFFFFFFF;
    
    for (uint8_t i = 0; i < ${varPrefix}_freq_cache_count; i++) {
        uint32_t diff = (${varPrefix}_freq_cache[i].freq > frequency_hz) 
            ? (${varPrefix}_freq_cache[i].freq - frequency_hz)
            : (frequency_hz - ${varPrefix}_freq_cache[i].freq);
            
        if (diff < min_diff) {
            min_diff = diff;
            nearest_psc = ${varPrefix}_freq_cache[i].psc;
            nearest_arr = ${varPrefix}_freq_cache[i].arr;
            
            // Exact match - use it directly
            if (diff == 0) {
                ${varPrefix}_prescaler = nearest_psc;
                ${varPrefix}_period = nearest_arr;
                ${varPrefix}_pulse = ${varPrefix}_period / 2;
                
                // Direct register access
                h${timerLower}.Instance->PSC = ${varPrefix}_prescaler;
                h${timerLower}.Instance->ARR = ${varPrefix}_period;
                h${timerLower}.Instance->CCR${channelNum} = ${varPrefix}_pulse;
                
                // Restart if it was running before AND not logically stopped
                if (was_running && !${varPrefix}_is_logically_stopped) {
                    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
                }
                return;
            }
        }
    }
    
    // Use nearest cached values as starting point for calculation
    // This drastically reduces iterations needed
    uint32_t timer_clock = ${timerClock};
    uint32_t target_counts = timer_clock / frequency_hz;
    
    ${varPrefix}_prescaler = nearest_psc;
    ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
    
    // Fine-tune from the cached starting point (much fewer iterations)
    while (${varPrefix}_period > ${maxPeriod} && ${varPrefix}_prescaler < 65535) {
        ${varPrefix}_prescaler++;
        ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
    }
    
    // Fine-tune downward if needed
    while (${varPrefix}_period < (${maxPeriod} / 2) && ${varPrefix}_prescaler > 0) {
        ${varPrefix}_prescaler--;
        ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
        if (${varPrefix}_period > ${maxPeriod}) {
            ${varPrefix}_prescaler++;
            ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
            break;
        }
    }
    
    ${varPrefix}_pulse = ${varPrefix}_period / 2;
    
    h${timerLower}.Instance->PSC = ${varPrefix}_prescaler;
    h${timerLower}.Instance->ARR = ${varPrefix}_period;
    h${timerLower}.Instance->CCR${channelNum} = ${varPrefix}_pulse;
    
    // Restart if it was running before AND not logically stopped
    if (was_running && !${varPrefix}_is_logically_stopped) {
        HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
    }
}

${inlineKeyword}float ${formatName("GetToggleFrequency")}(void) {
    return ${formatName("GetFrequency")}();
}

${inlineKeyword}void ${formatName("StartToggle")}(void) {
    ${varPrefix}_is_logically_stopped = 0;  // Clear logical stop
    if (${formatName("GetFrequency")}() > 0) {  // Only start if frequency is valid
        HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
    }
}

${inlineKeyword}void ${formatName("StopToggle")}(void) {
    ${varPrefix}_is_logically_stopped = 1;  // Set logical stop
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});
}`;

    return { declarations, implementations };
};

export const createCodeTemplates = ({
    componentName,
    namingConvention,
    selectedTimer,
    selectedChannel,
    dutyCycle,
    pwmFreq,
    arrWidth,
    sysClock,
    arrValue,
    pscValue,
    presetKey,
    servoMinAngle = 0,
    servoMaxAngle = 180,
}: CodeTemplateParams): CodeTemplates => {
    const timerLower = selectedTimer.toLowerCase();
    const channelNum = selectedChannel;
    const pulseValue = Math.round((dutyCycle / 100) * arrValue);
    const headerGuard = `${componentName.toUpperCase()}_H`;
    const hash = generateHash(componentName);
    const varPrefix = `${componentName.toLowerCase()}_${hash}`;

    const formatName = (base: string) => formatFunctionName(componentName, namingConvention, base);
    const maxPeriod = Math.pow(2, arrWidth) - 1;
    const timerClock = sysClock * 1_000_000;

    // Generate preset-specific code additions
    let presetHeaderDeclarations = "";
    let presetHeaderOnlyImplementations = "";
    let presetSourceImplementations = "";
    let presetInitCalls = "";
    
    if (presetKey === "standard-servo") {
        const servo = generateServoCode(
            formatName,
            componentName,
            timerLower,
            channelNum,
            varPrefix,
            servoMinAngle,
            servoMaxAngle,
            false
        );
        const servoInline = generateServoCode(
            formatName,
            componentName,
            timerLower,
            channelNum,
            varPrefix,
            servoMinAngle,
            servoMaxAngle,
            true
        );
        presetHeaderDeclarations = servo.declarations;
        presetHeaderOnlyImplementations = servoInline.declarations + "\n" + servoInline.implementations;
        presetSourceImplementations = servo.implementations;
        presetInitCalls = "";  // Servo doesn't need additional init
    } else if (presetKey === "led-dimming") {
        const led = generateLedCode(formatName, componentName, timerLower, channelNum, varPrefix, false);
        const ledInline = generateLedCode(formatName, componentName, timerLower, channelNum, varPrefix, true);
        presetHeaderDeclarations = led.declarations;
        presetHeaderOnlyImplementations = ledInline.declarations + "\n" + ledInline.implementations;
        presetSourceImplementations = led.implementations;
        presetInitCalls = "";  // LED doesn't need additional init
    } else if (presetKey === "toggle-pin") {
        const toggle = generateTogglePinCode(formatName, componentName, timerLower, channelNum, varPrefix, arrWidth, sysClock, false);
        const toggleInline = generateTogglePinCode(formatName, componentName, timerLower, channelNum, varPrefix, arrWidth, sysClock, true);
        presetHeaderDeclarations = toggle.declarations;
        presetHeaderOnlyImplementations = toggleInline.declarations + "\n" + toggleInline.implementations;
        presetSourceImplementations = toggle.implementations;
        presetInitCalls = `\n    ${formatName("InitFrequencyCache")}();`;
    }

    const headerOnly = `#ifndef ${headerGuard}
#define ${headerGuard}

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
static uint8_t ${varPrefix}_is_logically_stopped = 0;

/* Inline function implementations -------------------------------------------*/

/**
 * @brief Initialize PWM with default settings
 * @note Called automatically by ${formatName("Init")}()
 */
static inline void ${formatName("PwmInit")}(void) {
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
    ${varPrefix}_is_logically_stopped = 0;  // Reset logical stop flag
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

/**
 * @brief Get current duty cycle as percentage
 * @return Duty cycle (0.0 - 100.0)
 */
static inline float ${formatName("GetDutyCycle")}(void) {
    return ((float)${varPrefix}_pulse / (float)${varPrefix}_period) * 100.0f;
}

/**
 * @brief Get current pulse value (CCR register)
 * @return Pulse value (0 to ARR)
 */
static inline uint32_t ${formatName("GetPulse")}(void) {
    return ${varPrefix}_pulse;
}

/**
 * @brief Get maximum pulse value (ARR register)
 * @return Maximum pulse value
 */
static inline uint32_t ${formatName("GetMaxPulse")}(void) {
    return ${varPrefix}_period;
}

/**
 * @brief Get current PWM frequency in Hz
 * @return Frequency in Hz
 */
static inline float ${formatName("GetFrequency")}(void) {
    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    return (float)timer_clock / ((${varPrefix}_prescaler + 1) * (${varPrefix}_period + 1));
}

/**
 * @brief Set duty cycle as percentage
 * @param duty_cycle Duty cycle (0.0 - 100.0)
 */
static inline void ${formatName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;

    ${varPrefix}_pulse = (uint32_t)((duty_cycle / 100.0f) * ${varPrefix}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
}

/**
 * @brief Set pulse value directly
 * @param pulse Pulse value (0 to ARR)
 */
static inline void ${formatName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${varPrefix}_period) pulse = ${varPrefix}_period;

    ${varPrefix}_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
}

/**
 * @brief Check if PWM output is currently active
 * @return 1 if PWM is active, 0 if stopped
 */
static inline uint8_t ${formatName("IsToggling")}(void) {
    return !${varPrefix}_is_logically_stopped;
}

/**
 * @brief Change PWM frequency dynamically
 * @param frequency_hz Desired frequency in Hz
 * @note This will reset duty cycle to 50%
 * @note PWM will stop if frequency_hz <= 0 (hardware level stop)
 */
static inline void ${formatName("SetFrequency")}(uint32_t frequency_hz) {
    // Check if PWM was running before
    uint8_t was_running = ${formatName("IsToggling")}() && (${formatName("GetFrequency")}() > 0);
    
    // Stop PWM temporarily for configuration
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});

    // Hardware level stop - frequency <= 0
    if (frequency_hz <= 0) {
        // Stop at hardware level, don't restart
        return;
    }

    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;

    ${varPrefix}_prescaler = 0;
    ${varPrefix}_period = target_counts - 1;

    while (${varPrefix}_period > ${maxPeriod} && ${varPrefix}_prescaler < 65535) {
        ${varPrefix}_prescaler++;
        ${varPrefix}_period = (target_counts / (${varPrefix}_prescaler + 1)) - 1;
    }

    __HAL_TIM_SET_PRESCALER(&h${timerLower}, ${varPrefix}_prescaler);
    __HAL_TIM_SET_AUTORELOAD(&h${timerLower}, ${varPrefix}_period);

    ${varPrefix}_pulse = ${varPrefix}_period / 2;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);

    // Only restart if it was running before AND not logically stopped
    if (was_running && !${varPrefix}_is_logically_stopped) {
        HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
    }
}

/**
 * @brief Synchronize cached state with hardware
 * @note Call if timer was modified externally
 */
static inline void ${formatName("SyncState")}(void) {
    ${varPrefix}_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${varPrefix}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${varPrefix}_prescaler = h${timerLower}.Instance->PSC;
}
${presetHeaderOnlyImplementations}

/**
 * @brief Master initialization - calls all required init functions
 * @note Call this once after MX_${selectedTimer}_Init() in main.c
 */
static inline void ${formatName("Init")}(void) {
    ${formatName("PwmInit")}();${presetInitCalls}
}

#endif /* ${headerGuard} */`;

    const header = `#ifndef ${headerGuard}
#define ${headerGuard}

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
 * @note Called automatically by ${formatName("Init")}()
 */
void ${formatName("PwmInit")}(void);

/**
 * @brief Get current duty cycle as percentage
 * @return Duty cycle (0.0 - 100.0)
 */
float ${formatName("GetDutyCycle")}(void);

/**
 * @brief Get current pulse value (CCR register)
 * @return Pulse value (0 to ARR)
 */
uint32_t ${formatName("GetPulse")}(void);

/**
 * @brief Get maximum pulse value (ARR register)
 * @return Maximum pulse value
 */
uint32_t ${formatName("GetMaxPulse")}(void);

/**
 * @brief Get current PWM frequency in Hz
 * @return Frequency in Hz
 */
float ${formatName("GetFrequency")}(void);

/**
 * @brief Set duty cycle as percentage
 * @param duty_cycle Duty cycle (0.0 - 100.0)
 */
void ${formatName("SetDutyCycle")}(float duty_cycle);

/**
 * @brief Set pulse value directly
 * @param pulse Pulse value (0 to ARR)
 */
void ${formatName("SetPulse")}(uint32_t pulse);

/**
 * @brief Change PWM frequency dynamically
 * @param frequency_hz Desired frequency in Hz
 * @note This will reset duty cycle to 50%
 */
void ${formatName("SetFrequency")}(uint32_t frequency_hz);

/**
 * @brief Synchronize cached state with hardware
 * @note Call if timer was modified externally
 */
void ${formatName("SyncState")}(void);
${presetHeaderDeclarations}

/**
 * @brief Master initialization - calls all required init functions
 * @note Call this once after MX_${selectedTimer}_Init() in main.c
 */
void ${formatName("Init")}(void);

#endif /* ${headerGuard} */
`;

    const source = `/* Includes ------------------------------------------------------------------*/
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
void ${formatName("PwmInit")}(void) {
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
float ${formatName("GetDutyCycle")}(void) {
    return ((float)${componentName.toLowerCase()}_current_pulse / (float)${componentName.toLowerCase()}_period) * 100.0f;
}

/**
 * @brief Get current pulse value (CCR register)
 */
uint32_t ${formatName("GetPulse")}(void) {
    return ${componentName.toLowerCase()}_current_pulse;
}

/**
 * @brief Get maximum pulse value (ARR register)
 */
uint32_t ${formatName("GetMaxPulse")}(void) {
    return ${componentName.toLowerCase()}_period;
}

/**
 * @brief Get current PWM frequency in Hz
 */
float ${formatName("GetFrequency")}(void) {
    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    return (float)timer_clock / ((${componentName.toLowerCase()}_prescaler + 1) * (${componentName.toLowerCase()}_period + 1));
}

/**
 * @brief Synchronize cached state with hardware
 */
void ${formatName("SyncState")}(void) {
    ${componentName.toLowerCase()}_current_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${componentName.toLowerCase()}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${componentName.toLowerCase()}_prescaler = h${timerLower}.Instance->PSC;
}

/**
 * @brief Set duty cycle as percentage
 */
void ${formatName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;

    ${componentName.toLowerCase()}_current_pulse = (uint32_t)((duty_cycle / 100.0f) * ${componentName.toLowerCase()}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

/**
 * @brief Set pulse value directly
 */
void ${formatName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${componentName.toLowerCase()}_period) pulse = ${componentName.toLowerCase()}_period;

    ${componentName.toLowerCase()}_current_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

/**
 * @brief Change PWM frequency dynamically
 */
void ${formatName("SetFrequency")}(uint32_t frequency_hz) {
    // Stop PWM
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});

    // Calculate new prescaler and period
    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;

    // Try to maintain high resolution
    ${componentName.toLowerCase()}_prescaler = 0;
    ${componentName.toLowerCase()}_period = target_counts - 1;

    // If period exceeds ${arrWidth}-bit limit, adjust prescaler
    while (${componentName.toLowerCase()}_period > ${maxPeriod} && ${componentName.toLowerCase()}_prescaler < 65535) {
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
${presetSourceImplementations}

/**
 * @brief Master initialization - calls all required init functions
 */
void ${formatName("Init")}(void) {
    ${formatName("PwmInit")}();${presetInitCalls}
}

/* Private functions ---------------------------------------------------------*/`;

    return { headerOnly, header, source };
};
