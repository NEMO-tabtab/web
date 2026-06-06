import React from "react";
import { FAB } from "@/components/common/FAB";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function FABsPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Floating Action Button (FAB)</Heading>
                <Text size="lg" className="mt-4">
                    FAB component represents the primary action on a screen.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Variants</Heading>
                <Card className="space-y-6 p-8 relative min-h-[300px]">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Hover over the FABs to see the scaling and shadow animations.
                        </Text>
                        <div className="flex gap-8 items-center mt-8 p-12 bg-gray-50 rounded-lg">
                            <FAB 
                                icon={<i className="xi-plus text-2xl font-bold">+</i>} 
                                variant="solid" 
                                aria-label="Add" 
                            />
                            
                            <FAB 
                                icon={<span className="text-2xl font-bold">@</span>} 
                                variant="gradient" 
                                aria-label="Gradient Action" 
                            />
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
