import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import DefaultLayout from "@/layouts/default";
import { title, subtitle } from "@/components/primitives";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-3xl text-center justify-center">
          <h1 className={title({ size: "lg" })}>
            STM32&nbsp;
            <span className={title({ color: "blue", size: "lg" })}>
              Utilities
            </span>
          </h1>
          <h2 className={subtitle({ class: "mt-4" })}>
            Professional tools for STM32 embedded development
          </h2>
        </div>

        <div className="mt-8 w-full max-w-4xl">
          <h3 className="text-2xl font-bold mb-6">Available Tools</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <Link href="/pwm-calculator" className="w-full">
              <Card className="border-2 border-default-100 hover:border-primary transition-colors cursor-pointer w-full">
                <CardHeader className="flex gap-3">
                  <div className="flex flex-col flex-1">
                    <p className="text-2xl font-bold">PWM Calculator</p>
                    <p className="text-small text-default-500">
                      Timer configuration with automatic code generation
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <p className="text-default-700">
                      Generate optimized PWM configurations for STM32 timers with ready-to-use code templates.
                    </p>
                    <ul className="list-disc list-inside text-default-600 space-y-1 ml-4">
                      <li>Preset configurations: Servo Control, LED Dimming, Toggle Pin</li>
                      <li>Multiple resolution options and naming conventions</li>
                      <li>Header-only or .h/.c file generation</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Card className="border-2 border-default-100 opacity-60">
              <CardHeader className="flex gap-3">
                <div className="flex flex-col flex-1">
                  <p className="text-2xl font-bold">More Tools Coming Soon</p>
                  <p className="text-small text-default-500">
                    Additional utilities in development
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-default-600">
                  Stay tuned for more STM32 development tools...
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
