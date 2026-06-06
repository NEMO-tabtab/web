import React from "react";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

export default function BadgesPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Badge</Heading>
                <Text size="lg" className="mt-4">
                    Badge component is used to display status, labels, or tags.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Variants</Heading>
                <Card className="space-y-6 p-8">
                    <div className="space-y-4">
                        <Text className="text-gray-500">
                            Badges come in different semantic variants.
                        </Text>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Badge variant="success">보유 중</Badge>
                            <Badge variant="warning">승인 대기</Badge>
                            <Badge variant="neutral">기본 태그</Badge>
                            <Badge variant="brand">신규 제품</Badge>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
