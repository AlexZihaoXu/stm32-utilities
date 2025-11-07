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
    switch (namingConvention) {
        case "UPPERCASE":
            return `${componentName.toUpperCase()}_${baseName}`;
        case "PascalCase":
            return `${componentName}${baseName}`;
        case "camelCase":
            return `${componentName.toLowerCase()}${baseName}`;
        case "snake_case":
            return `${componentName.toLowerCase()}_${baseName
                .replace(/([A-Z])/g, "_$1")
                .toLowerCase()
                .replace(/^_/, "")}`;
        default:
            return `${componentName}_${baseName}`;
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
}

export interface CodeTemplates {
    headerOnly: string;
    header: string;
    source: string;
}

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

    const headerOnly = `#ifndef ${headerGuard}
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
static inline void ${formatName("Init")}(void) {
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${varPrefix}_pulse);
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
 * @brief Change PWM frequency dynamically
 * @param frequency_hz Desired frequency in Hz
 * @note This will reset duty cycle to 50%
 */
static inline void ${formatName("SetFrequency")}(uint32_t frequency_hz) {
    HAL_TIM_PWM_Stop(&h${timerLower}, TIM_CHANNEL_${channelNum});

    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    uint32_t target_counts = timer_clock / frequency_hz;

    ${varPrefix}_prescaler = 0;
    ${varPrefix}_period = target_counts - 1;

    while (${varPrefix}_period > ${maxPeriod} && ${varPrefix}_prescaler < 65_535) {
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
static inline void ${formatName("SyncState")}(void) {
    ${varPrefix}_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${varPrefix}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${varPrefix}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}

#ifdef __cplusplus
}
#endif

#endif /* ${headerGuard} */`;

    const header = `#ifndef ${headerGuard}
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
void ${formatName("Init")}(void);

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

void ${formatName("Init")}(void) {
    // Timer already configured by CubeMX with:
    // - Prescaler: ${pscValue}
    // - ARR: ${arrValue}
    // - PWM Frequency: ${pwmFreq} Hz

    // Set initial duty cycle (${dutyCycle}%)
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);

    // Start PWM on Channel ${channelNum}
    HAL_TIM_PWM_Start(&h${timerLower}, TIM_CHANNEL_${channelNum});
}

float ${formatName("GetDutyCycle")}(void) {
    return ((float)${componentName.toLowerCase()}_current_pulse / (float)${componentName.toLowerCase()}_period) * 100.0f;
}

uint32_t ${formatName("GetPulse")}(void) {
    return ${componentName.toLowerCase()}_current_pulse;
}

uint32_t ${formatName("GetMaxPulse")}(void) {
    return ${componentName.toLowerCase()}_period;
}

float ${formatName("GetFrequency")}(void) {
    uint32_t timer_clock = ${timerClock}; // ${sysClock} MHz
    return (float)timer_clock / ((${componentName.toLowerCase()}_prescaler + 1) * (${componentName.toLowerCase()}_period + 1));
}

void ${formatName("SyncState")}(void) {
    ${componentName.toLowerCase()}_current_pulse = __HAL_TIM_GET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum});
    ${componentName.toLowerCase()}_period = __HAL_TIM_GET_AUTORELOAD(&h${timerLower});
    ${componentName.toLowerCase()}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
}

void ${formatName("SetDutyCycle")}(float duty_cycle) {
    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;

    ${componentName.toLowerCase()}_current_pulse = (uint32_t)((duty_cycle / 100.0f) * ${componentName.toLowerCase()}_period);
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

void ${formatName("SetPulse")}(uint32_t pulse) {
    if (pulse > ${componentName.toLowerCase()}_period) pulse = ${componentName.toLowerCase()}_period;

    ${componentName.toLowerCase()}_current_pulse = pulse;
    __HAL_TIM_SET_COMPARE(&h${timerLower}, TIM_CHANNEL_${channelNum}, ${componentName.toLowerCase()}_current_pulse);
}

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
    while (${componentName.toLowerCase()}_period > ${maxPeriod} && ${componentName.toLowerCase()}_prescaler < 65_535) {
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

#endif /* ${headerGuard} */`;

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
void ${formatName("Init")}(void) {
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
    ${componentName.toLowerCase()}_prescaler = __HAL_TIM_GET_PRESCALER(&h${timerLower});
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
    while (${componentName.toLowerCase()}_period > ${maxPeriod} && ${componentName.toLowerCase()}_prescaler < 65_535) {
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

    return { headerOnly, header, source };
};
