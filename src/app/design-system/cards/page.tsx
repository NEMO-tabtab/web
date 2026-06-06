import React from "react";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function CardsPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Card</Heading>
                <Text size="lg" className="mt-4">
                    Card component is used to group related information in a structured format.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Default Variant</Heading>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card padding="md">
                        <Heading level={4}>Default Card</Heading>
                        <Text className="mt-2 text-gray-500">
                            A simple default card with border and slight shadow.
                        </Text>
                    </Card>
                    <Card padding="md" interactive>
                        <Heading level={4}>Interactive Card</Heading>
                        <Text className="mt-2 text-gray-500">
                            Hover me to see the translation effect.
                        </Text>
                    </Card>
                </div>
            </section>

            <section className="space-y-6">
                <Heading level={2}>Glass Variant</Heading>
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 min-h-[300px]">
                    <div className="grid md:grid-cols-2 gap-6 relative z-10 w-full h-full">
                        <Card variant="glass" padding="md">
                            <Heading level={4}>Glassmorphism</Heading>
                            <Text className="mt-2 text-gray-600">
                                This card uses backdrop-blur over a colorful background.
                            </Text>
                        </Card>

                        <Card variant="glass" interactive padding="md">
                            <Heading level={4}>Interactive Glass</Heading>
                            <Text className="mt-2 text-gray-600">
                                Glass card with hover effects (translate-y and shadow changes).
                            </Text>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
