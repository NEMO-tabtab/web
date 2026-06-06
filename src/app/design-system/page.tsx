import React from "react";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function DesignSystemPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Design System</Heading>
                <Text size="lg" className="mt-4">
                    NEMO 프로젝트를 위한 디자인 가이드 및 공통 컴포넌트입니다.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Colors</Heading>
                <Card>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                            <div key={shade} className="space-y-2">
                                <div className={`h-16 w-full rounded-lg bg-brand-${shade} shadow-sm`} />
                                <Text size="sm" className="text-center">brand-{shade}</Text>
                            </div>
                        ))}
                    </div>
                </Card>
            </section>

            <section className="space-y-6">
                <Heading level={2}>Typography</Heading>
                <Card className="space-y-4">
                    <Heading level={1}>Heading 1</Heading>
                    <Heading level={2}>Heading 2</Heading>
                    <Heading level={3}>Heading 3</Heading>
                    <Heading level={4}>Heading 4</Heading>
                    <div className="h-px bg-gray-100 my-4" />
                    <Text size="xl">Text XL - 본문 텍스트 예시입니다.</Text>
                    <Text size="lg">Text LG - 본문 텍스트 예시입니다.</Text>
                    <Text size="base">Text Base - 본문 텍스트 예시입니다.</Text>
                    <Text size="sm">Text SM - 본문 텍스트 예시입니다.</Text>
                </Card>
            </section>
            
            <section className="space-y-6">
                <Heading level={2}>Cards</Heading>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card padding="sm">
                        <Heading level={4}>Small Padding</Heading>
                        <Text className="mt-2">Card content with small padding.</Text>
                    </Card>
                    <Card padding="lg">
                        <Heading level={4}>Large Padding</Heading>
                        <Text className="mt-2">Card content with large padding.</Text>
                    </Card>
                </div>
            </section>
        </div>
    );
}
