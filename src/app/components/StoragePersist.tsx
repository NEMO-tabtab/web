"use client";

import { useEffect } from "react";

/**
 * 로그인 전에는 기기 저장소가 유일한 원본이라, 브라우저가 공간이 부족할 때 지우지 않도록 요청한다.
 * Android(설치형 PWA·TWA)는 대개 바로 허용하고, iOS Safari 는 홈 화면에 추가한 앱일 때 효과가 있다.
 * 거절돼도 앱은 그대로 동작한다.
 */
export default function StoragePersist() {
    useEffect(() => {
        navigator.storage?.persist?.().catch(() => {});
    }, []);

    return null;
}
