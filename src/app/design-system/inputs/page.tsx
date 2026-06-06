import React from "react";
import { Input } from "@/components/common/Input";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function InputsPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Input</Heading>
                <Text size="lg" className="mt-4">
                    TextInput component allows users to enter text into a UI.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Basic Usage</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4 max-w-sm">
                        <Input placeholder="Enter some text..." />
                        <Input label="Email Address" placeholder="name@example.com" type="email" />
                        <Input label="Password" required placeholder="Enter password" type="password" />
                    </div>
                </Card>
            </section>

            <section className="space-y-6">
                <Heading level={2}>States</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4 max-w-sm">
                        <Input label="Disabled state" disabled placeholder="You cannot type here" />
                        <Input 
                            label="Error state" 
                            error="This field is required and cannot be empty." 
                            placeholder="Invalid input" 
                            defaultValue="Wrong data"
                        />
                    </div>
                </Card>
            </section>
            
            <section className="space-y-6">
                <Heading level={2}>With Icons</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4 max-w-sm">
                        <Input 
                            label="Search" 
                            placeholder="Search..." 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                                </svg>
                            } 
                        />
                    </div>
                </Card>
            </section>
        </div>
    );
}
