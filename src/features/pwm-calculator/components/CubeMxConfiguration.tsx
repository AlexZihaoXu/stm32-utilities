import { useMemo } from "react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Tab, Tabs } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import Editor from "@monaco-editor/react";
import { Divider } from "@heroui/divider";
import { createCodeTemplates } from "../utils";
import { NamingConvention, ResolutionOption } from "../types";
import { useAppTheme } from "@/context/theme";

interface CubeMxConfigurationProps {
    selectedOption?: ResolutionOption;
    arrWidth: number;
    dutyCycle: number;
    selectedChannel: number;
    componentName: string;
    onComponentNameChange: (value: string) => void;
    namingConvention: NamingConvention;
    onNamingConventionChange: (value: NamingConvention) => void;
    pwmFreq: number;
    sysClock: number;
    selectedTimer: string;
}

const NAMING_OPTIONS: NamingConvention[] = ["UPPERCASE", "PascalCase", "camelCase", "snake_case"];

export function CubeMxConfiguration({
    selectedOption,
    arrWidth,
    dutyCycle,
    selectedChannel,
    componentName,
    onComponentNameChange,
    namingConvention,
    onNamingConventionChange,
    pwmFreq,
    sysClock,
    selectedTimer,
}: CubeMxConfigurationProps) {
    const { theme } = useAppTheme();
    const editorTheme = theme === "light" ? "vs" : "vs-dark";

    const templates = useMemo(() => {
        if (!selectedOption) {
            return null;
        }
        return createCodeTemplates({
            componentName,
            namingConvention,
            selectedTimer,
            selectedChannel,
            dutyCycle,
            pwmFreq,
            arrWidth,
            sysClock,
            arrValue: selectedOption.arr,
            pscValue: selectedOption.psc,
        });
    }, [selectedOption, componentName, namingConvention, selectedTimer, selectedChannel, dutyCycle, pwmFreq, arrWidth, sysClock]);

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">STM32 CubeMX / CubeIDE Configuration</h2>
            <p className="text-default-600 mb-6">
                Configure these settings in your STM32 project to match the calculated PWM parameters above.
            </p>

            {!selectedOption || !templates ? (
                <div className="text-center py-8 text-default-500">
                    Please select a PWM resolution above to see the configuration settings.
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                            <h3 className="text-lg font-semibold mb-3">Counter Settings</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                    <span className="text-sm text-default-700 flex-shrink">Prescaler (PSC - {arrWidth} bits value)</span>
                                    <span className="font-mono font-semibold flex-shrink-0">{selectedOption.psc}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                    <span className="text-sm text-default-700 flex-shrink">Counter Mode</span>
                                    <span className="font-semibold text-sm flex-shrink-0">Up</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                    <span className="text-sm text-default-700 flex-shrink">
                                        Counter Period (AutoReload Register - {arrWidth} bits value)
                                    </span>
                                    <span className="font-mono font-semibold flex-shrink-0">{selectedOption.arr}</span>
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

                        <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                            <h3 className="text-lg font-semibold mb-3">PWM Generation Channel {selectedChannel}</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                    <span className="text-sm text-default-700 flex-shrink">Mode</span>
                                    <span className="font-semibold text-sm flex-shrink-0">PWM mode 1</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-default-200 gap-4">
                                    <span className="text-sm text-default-700 flex-shrink">Pulse ({arrWidth} bits value)</span>
                                    <span className="font-mono font-semibold flex-shrink-0">
                                        {Math.round((dutyCycle / 100) * selectedOption.arr)}
                                    </span>
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

                    <Divider className="my-2" />

                    <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                        <h3 className="text-lg font-semibold mb-3">Code Implementation</h3>
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Component Name"
                                placeholder="PWM"
                                value={componentName}
                                onValueChange={onComponentNameChange}
                                description="Prefix for generated functions"
                            />
                            <Select
                                label="Naming Convention"
                                selectedKeys={[namingConvention]}
                                onSelectionChange={(keys) => {
                                    if (keys === "all") {
                                        return;
                                    }
                                    const key = Array.from(keys)[0];
                                    if (typeof key === "string") {
                                        onNamingConventionChange(key as NamingConvention);
                                    }
                                }}
                                description="Function naming style"
                                renderValue={(items) =>
                                    items.map((item) => (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <span>{item.textValue}</span>
                                        </div>
                                    ))
                                }
                            >
                                {NAMING_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option}
                                        textValue={`${option} (${formatPreview(componentName, option)})`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-small">{option}</span>
                                            <span className="text-tiny text-default-400 font-mono">
                                                {formatPreview(componentName, option)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <Tabs aria-label="Code sections" className="w-full">
                            <Tab key="header-only" title="Header Only (.h)">
                                <Card>
                                    <CardBody>
                                        <div className="mb-2 text-sm text-default-600">
                                            File: <span className="font-mono font-semibold">{componentName.toLowerCase()}.h</span>
                                            <span className="ml-2 text-xs text-default-500">
                                                (Single-file solution with inline functions)
                                            </span>
                                        </div>
                                        <Editor
                                            height="70vh"
                                            defaultLanguage="c"
                                            value={templates.headerOnly}
                                            theme={editorTheme}
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                lineNumbers: "on",
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
                                            value={templates.header}
                                            theme={editorTheme}
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                lineNumbers: "on",
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
                                            value={templates.source}
                                            theme={editorTheme}
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                lineNumbers: "on",
                                                scrollBeyondLastLine: false,
                                            }}
                                        />
                                    </CardBody>
                                </Card>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            )}
        </div>
    );
}

const formatPreview = (componentName: string, naming: NamingConvention): string => {
    const basePreview = "Init";
    switch (naming) {
        case "UPPERCASE":
            return `${componentName.toUpperCase()}_${basePreview}`;
        case "PascalCase":
            return `${componentName}${basePreview}`;
        case "camelCase":
            return `${componentName.toLowerCase()}${basePreview}`;
        case "snake_case":
            return `${componentName.toLowerCase()}_${basePreview.toLowerCase()}`;
        default:
            return `${componentName}_${basePreview}`;
    }
};
