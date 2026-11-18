"use client";

import { useSyncExternalStore } from "react";

import { readSession, subscribeSession, type Session } from "./session";

const serverSnapshot = () => null;
const clientSnapshot = () => readSession();

/** 로그인 상태. 로그인 전이면 null. 서버에서 그릴 때와 첫 그리기에서는 항상 null 이다 */
export function useSession(): Session | null {
    return useSyncExternalStore(subscribeSession, clientSnapshot, serverSnapshot);
}
