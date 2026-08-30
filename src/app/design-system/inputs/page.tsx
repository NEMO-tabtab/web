import { Card, Checkbox, Input, RadioGroup, Text, Textarea } from "@/components/common";

import { ClassName, DocSection, PageHeader } from "../_components/DocSection";

const GENDER_OPTIONS = [
    { value: "M", label: "남성" },
    { value: "W", label: "여성" },
] as const;

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

export default function InputsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Form Controls"
                description="모든 필드의 생김새는 globals.css 의 .field 한 곳에서 나옵니다 — 2px 먹선, 비대칭 손그림 모서리, 3px 포커스 아웃라인."
            />

            <DocSection title="Input — 기본" description="label · hint · icon 은 모든 필드가 공유하는 API 입니다.">
                <Card variant="default" padding="lg" className="max-w-md space-y-6">
                    <Input id="ds-name" label="물건 이름" placeholder="예: 라이카 M6" />
                    <Input
                        id="ds-price"
                        label="구매 가격"
                        placeholder="0"
                        required
                        inputMode="numeric"
                        hint="원 단위로 입력하세요."
                        className="font-sans tabular-nums"
                    />
                    <Input id="ds-search" placeholder="제품 검색" icon={<SearchIcon />} />
                </Card>
                <Text size="sm" tone="muted">
                    금액·수량 필드에는 <ClassName>font-sans tabular-nums</ClassName> 를 넘기세요. 손글씨 서체(Gaegu)는
                    숫자 글리프 폭이 불규칙해서 입력 중에 글자가 흔들립니다.
                </Text>
            </DocSection>

            <DocSection
                title="Input — 상태"
                description="에러는 danger 먹선으로만 표시합니다. 이 시스템에서 색이 의미를 갖는 유일한 자리입니다."
            >
                <Card variant="default" padding="lg" className="max-w-md space-y-6">
                    <Input id="ds-err" label="구매 가격" defaultValue="비싼거" error="숫자만 입력할 수 있어요." />
                    <Input id="ds-dis" label="일련번호" defaultValue="자동 생성됩니다" disabled />
                </Card>
                <Text size="sm" tone="muted">
                    <ClassName>required</ClassName> 의 별표는 먹선 그대로입니다 — danger 는 삭제·오류 전용이라
                    &quot;필수 입력&quot; 같은 평상시 표시에는 쓰지 않습니다. 비활성 필드는{" "}
                    <ClassName>bg-cream</ClassName> 으로 가라앉습니다.
                </Text>
            </DocSection>

            <DocSection title="Textarea" description="Input 과 동일한 label · hint · error · fullWidth API.">
                <Card variant="default" padding="lg" className="max-w-md space-y-6">
                    <Textarea id="ds-memo" label="메모" placeholder="어디서 구했는지, 왜 샀는지" hint="선택 사항" />
                    <Textarea id="ds-memo-err" label="메모" defaultValue="…" error="500자를 넘을 수 없어요." />
                    <Textarea id="ds-memo-dis" label="메모" defaultValue="읽기 전용" disabled />
                </Card>
            </DocSection>

            <DocSection title="Checkbox" description="선택 상태는 먹으로 꽉 채우고 흰 획으로 체크를 얹습니다.">
                <Card variant="default" padding="lg" className="max-w-md space-y-4">
                    <Checkbox label="이용약관에 동의합니다" defaultChecked />
                    <Checkbox label="마케팅 정보 수신에 동의합니다" />
                    <Checkbox boxed label="선물 받은 제품인가요? (가격 0원 처리)" />
                    <Checkbox label="비활성 상태" disabled />
                </Card>
                <Text size="sm" tone="muted">
                    <ClassName>boxed</ClassName> 는 라벨 전체를 <ClassName>.field</ClassName> 박스로 감쌉니다 — 폼
                    안에서 한 줄짜리 선택지가 묻히지 않아야 할 때만 씁니다.
                </Text>
            </DocSection>

            <DocSection title="RadioGroup" description="fieldset/legend 로 묶여 스크린리더가 그룹으로 읽습니다.">
                <Card variant="default" padding="lg" className="max-w-md space-y-6">
                    <RadioGroup name="ds-gender" label="성별" options={GENDER_OPTIONS} defaultValue="M" />
                    <RadioGroup
                        name="ds-gender-vertical"
                        label="성별 (세로)"
                        orientation="vertical"
                        options={GENDER_OPTIONS}
                        defaultValue="W"
                        required
                    />
                </Card>
            </DocSection>

            <DocSection title="레이블 연결">
                <Text size="sm" tone="muted">
                    필드 전체가 <ClassName>&lt;label&gt;</ClassName> 로 감싸여 있어 레이블을 눌러도 포커스가 갑니다.{" "}
                    <ClassName>id</ClassName> 를 넘기면 <ClassName>htmlFor</ClassName> 와{" "}
                    <ClassName>aria-describedby</ClassName> 가 명시적으로 연결됩니다. 필드 컴포넌트는{" "}
                    <ClassName>useId()</ClassName> 를 쓰지 않습니다 — 훅을 쓰는 순간 모듈이 클라이언트 경계로 넘어가
                    서버 컴포넌트인 폼 페이지까지 딸려오기 때문입니다.
                </Text>
            </DocSection>
        </div>
    );
}
