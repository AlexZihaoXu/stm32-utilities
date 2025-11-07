import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>

      <h1>
        Welcome to STM32 Utilities!
      </h1>
      <p className="mt-4 text-lg text-default-700">
        A collection of utilities to help you work with STM32 microcontrollers.
      </p>
      <h2 className="mt-8 text-2xl font-bold">Features</h2>
      <ul className="mt-4 list-disc list-inside text-default-700">
        <li><a href="/pwm-calculator">PWM Calculator</a></li>
        <li>More utilities coming soon!</li>
      </ul>

    </DefaultLayout>
  );
}
