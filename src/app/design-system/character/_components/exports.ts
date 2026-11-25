import { composeCapsule, type CapsuleOptions } from "@/lib/nemo/capsule";
import { composeNemo, composeSymbol, type NemoOptions } from "@/lib/nemo/compose";
import { toSvgString } from "@/lib/nemo/exportSvg";
import { composeScene, type SceneId } from "@/lib/nemo/scenes";

/*
 * 시트에서 내려받는 그림의 SVG 문자열. 화면에 보이는 크기와 상관없이 큰 그림 기준으로 만든다 —
 * 소품과 표시가 다 들어가고, 입체 보기도 그려지는 크기다.
 */

/** 내려받는 그림에서 캐릭터의 크기(px). PNG 는 이 두 배로 나온다 */
export const EXPORT_SIZE = 512;

export const nemoSvg = (options: Omit<NemoOptions, "size">) =>
    toSvgString(composeNemo({ ...options, size: EXPORT_SIZE }), EXPORT_SIZE);

export const symbolSvg = (options: Pick<NemoOptions, "expression"> = {}) =>
    toSvgString(composeSymbol(options), EXPORT_SIZE);

export const capsuleSvg = (options: Omit<CapsuleOptions, "size">) =>
    toSvgString(composeCapsule({ ...options, size: EXPORT_SIZE }), EXPORT_SIZE);

export const sceneSvg = (id: SceneId) => toSvgString(composeScene(id, EXPORT_SIZE), EXPORT_SIZE);
