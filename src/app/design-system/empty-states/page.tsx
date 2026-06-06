import React from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";
import { Button } from "@/components/common/Button";

export default function EmptyStatesPage() {
    return (
        <div className="space-y-12">
            <header>
                <Heading level={1}>Empty State</Heading>
                <Text size="lg" className="mt-4">
                    EmptyState component is used when there is no data to display in a list or section.
                </Text>
            </header>

            <section className="space-y-6">
                <Heading level={2}>Basic</Heading>
                <Card className="p-8">
                    <EmptyState 
                        title="등록된 제품이 없습니다" 
                        description="오른쪽 아래 버튼을 눌러 제품을 추가해보세요!" 
                    />
                </Card>
            </section>

            <section className="space-y-6">
                <Heading level={2}>With Action</Heading>
                <Card className="p-8">
                    <EmptyState 
                        icon="🔍"
                        title="검색 결과가 없습니다" 
                        description="다른 검색어로 다시 시도해보세요."
                        action={<Button variant="outline">돌아가기</Button>}
                    />
                </Card>
            </section>
        </div>
    );
}
