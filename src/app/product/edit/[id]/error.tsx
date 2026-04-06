"use client";

import { Text } from "@/components/common/Typography";

export default function Error() {
    return (
        <div className="flex h-96 flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
            <Text size="lg" weight="medium" color="text-neutral-500">
                제품 데이터를 불러오는데 실패했습니다
            </Text>
            <Text size="sm" color="text-neutral-400" className="mt-2">
                잠시 후 다시 시도해주세요.
            </Text>
        </div>
    );
}
