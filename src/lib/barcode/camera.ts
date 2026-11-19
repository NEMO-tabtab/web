/*
 * 바코드를 읽기 좋게 카메라를 연다.
 *
 * 해상도를 정하지 않으면 브라우저는 보통 640×480 으로 연다. 막대가 뭉개져서 휴대폰을 바짝 대야 읽히는데,
 * 그러면 카메라의 최소 초점 거리 안으로 들어가 초점이 안 맞는다. 그래서:
 * - 높은 해상도로 열고
 * - 연속 초점을 켜고
 * - 확대를 걸어, 휴대폰을 떼고도(초점이 맞는 거리에서) 바코드가 크게 찍히게 한다
 */

/** 표준 타입에 아직 없는 카메라 기능들 */
interface CameraCapabilities extends MediaTrackCapabilities {
    focusMode?: string[];
    torch?: boolean;
    zoom?: { min: number; max: number; step?: number };
}
type CameraConstraint = MediaTrackConstraintSet & { focusMode?: string; torch?: boolean; zoom?: number };

export interface Camera {
    /** 손전등을 켤 수 있는 기기인가 */
    canTorch: boolean;
    /** 확대 단계 — 확대를 못 하는 기기면 [1] 하나뿐이다 */
    zoomLevels: number[];
    /** 처음 걸어 둔 확대 */
    zoom: number;
    setTorch: (on: boolean) => Promise<boolean>;
    setZoom: (level: number) => Promise<boolean>;
    stop: () => void;
}

const PREFERRED_ZOOM = 2;

function unsupported(): Error {
    const error = new Error("camera unsupported");
    error.name = "CameraUnsupportedError";
    return error;
}

export async function openCamera(video: HTMLVideoElement): Promise<Camera> {
    // http 주소이거나 오래된 브라우저면 mediaDevices 자체가 없다
    if (!navigator.mediaDevices?.getUserMedia) throw unsupported();

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
        },
    });
    const track = stream.getVideoTracks()[0];

    const apply = async (constraint: CameraConstraint): Promise<boolean> => {
        try {
            await track.applyConstraints({ advanced: [constraint] });
            return true;
        } catch {
            return false;
        }
    };

    const stop = () => {
        for (const each of stream.getTracks()) each.stop();
        video.srcObject = null;
    };

    try {
        // iOS 는 이 속성들이 없으면 전체 화면 재생으로 넘어가거나 재생을 막는다
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
    } catch (error) {
        stop();
        throw error;
    }

    const capabilities: CameraCapabilities = track.getCapabilities?.() ?? {};

    if (capabilities.focusMode?.includes("continuous")) await apply({ focusMode: "continuous" });

    let zoomLevels = [1];
    let zoom = 1;
    const range = capabilities.zoom;
    if (range && range.max > range.min) {
        const levels = [1, PREFERRED_ZOOM, 3].filter((level) => level >= range.min && level <= range.max);
        if (levels.length > 1) {
            zoomLevels = levels;
            const wanted = levels.includes(PREFERRED_ZOOM) ? PREFERRED_ZOOM : levels[0];
            if (await apply({ zoom: wanted })) zoom = wanted;
        }
    }

    return {
        canTorch: capabilities.torch === true,
        zoomLevels,
        zoom,
        setTorch: (on) => apply({ torch: on }),
        setZoom: (level) => apply({ zoom: level }),
        stop,
    };
}
