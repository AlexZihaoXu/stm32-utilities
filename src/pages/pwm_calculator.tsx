import DefaultLayout from "@/layouts/default";
import { PwmCalculator } from "@/features/pwm-calculator/PwmCalculator";

export default function PWMCalculatorPage() {
    return (
        <DefaultLayout>
            <PwmCalculator />
        </DefaultLayout>
    );
}