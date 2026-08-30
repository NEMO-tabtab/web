import BarcodeScanner from "./barcodeScanner";

/**
 * 바코드 스캔 라우트.
 *
 * 카메라·zxing 은 브라우저 API라 실제 화면은 클라이언트 컴포넌트가 전부 담당한다.
 * 이 파일은 클라이언트 경계만 긋는 얇은 껍데기로 둔다 — 레이아웃·여백은 PageShell 이 잡는다.
 */
export default function BarcodePage() {
    return <BarcodeScanner />;
}
