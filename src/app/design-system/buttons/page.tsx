import React from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function ButtonsPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Button</Heading>
                <Text size="lg" className="mt-4">
                    Button component is used to trigger an action or event, such as submitting a form, opening a dialog, canceling an action, or performing a delete operation.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Variants</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Buttons come in different variants to convey different levels of emphasis.
                        </Text>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="space-y-6">
                <Heading level={2}>Sizes</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Buttons can have different sizes, ranging from small to large.
                        </Text>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button size="lg">Large</Button>
                            <Button size="md">Medium</Button>
                            <Button size="sm">Small</Button>
                        </div>
                    </div>
                </Card>
            </section>
            
            <section className="space-y-6">
                <Heading level={2}>States</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Buttons can be disabled to prevent user interaction.
                        </Text>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary" disabled>Disabled Primary</Button>
                            <Button variant="secondary" disabled>Disabled Secondary</Button>
                            <Button variant="outline" disabled>Disabled Outline</Button>
                            <Button variant="ghost" disabled>Disabled Ghost</Button>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="space-y-6">
                <Heading level={2}>Layout</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Full width button that spans 100% of its container.
                        </Text>
                        <div className="w-full md:w-1/2">
                            <Button fullWidth>Full Width</Button>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
