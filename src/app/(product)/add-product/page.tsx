import Image from "next/image";

// 이미지
import defaultThumbnail from "../../assets/images/product_default_thumbnail.jpg";
import boxIcon from "../../assets/images/icon_box.png";
import infoIcon from "../../assets/images/icon_info.png";
import cashIcon from "../../assets/images/icon_cash.png";
import clipboardIcon from "../../assets/images/icon_clipboard.png";

export default function AddProduct() {
    return (
        <div className="container-1280 px mb-20 mt-10">
            {/* 이미지 */}
            <ul className="grid w-full grid-cols-3 gap-4">
                <li className="aspect-[100/80] overflow-hidden rounded-lg border-[1px] border-gray-200">
                    <Image className="h-full w-full object-cover" src={defaultThumbnail} alt="썸네일" />
                </li>
                <li className="aspect-[100/80] overflow-hidden rounded-lg border-[1px] border-gray-200">
                    <Image className="h-full w-full object-cover" src={defaultThumbnail} alt="썸네일" />
                </li>
                <li className="aspect-[100/80] overflow-hidden rounded-lg border-[1px] border-gray-200">
                    <input id="thumbnail-input" hidden type="file" />
                    <label className="flex-center h-full w-full cursor-pointer bg-brand-3" htmlFor="thumbnail-input">
                        <i className="xi-plus-min text-6xl text-brand-2"></i>
                    </label>
                </li>
            </ul>

            {/* 제품 정보 */}
            <div className="mt-8 flex flex-col gap-4">
                <strong className="text-2xl">제품 정보</strong>

                {/* 이름 */}
                <div>
                    <p className="mb-3">
                        이름 <span className="text-red-1">*</span>
                    </p>
                    <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                        <div className="flex w-full items-center gap-2">
                            <Image className="h-auto w-4" src={boxIcon} alt="" />
                            <input className="w-full bg-transparent text-sm" placeholder="이름" type="text" />
                        </div>
                        <Image className="h-auto w-4" src={infoIcon} alt="" />
                    </div>
                </div>

                {/* 구매 가격/개수 */}
                <div className="flex gap-3">
                    <div className="w-[65%]">
                        <p className="mb-3">구매 가격</p>
                        <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                            <div className="flex w-full items-center gap-2">
                                <Image className="h-auto w-4" src={boxIcon} alt="" />
                                <input className="w-full bg-transparent text-sm" placeholder="구매 가격" type="text" />
                            </div>
                            <Image className="h-auto w-4" src={cashIcon} alt="" />
                        </div>
                    </div>
                    <div className="w-[35%]">
                        <p className="mb-3">개수</p>
                        <div className="rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                            <div className="flex w-full items-center gap-2">
                                <Image className="h-auto w-4" src={boxIcon} alt="" />
                                <input className="w-full bg-transparent text-sm" placeholder="개수" type="text" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 선물여부 확인 */}
                <div className="flex items-center gap-2">
                    <input id="is-gift" type="checkbox" />
                    <label htmlFor="is-gift">이 제품을 무료로 받았다면 이 확인란을 선택해주세요.</label>
                </div>

                {/* 카테고리 */}
                <div>
                    <p>카테고리</p>
                    <ul className="mt-2 flex flex-wrap gap-2 rounded-xl border-[1px] border-dashed border-gray-300 p-3">
                        <li className="rounded-md border-[1px] border-gray-300 px-2 py-1"># 가구</li>
                        <li className="rounded-md border-[1px] border-gray-300 px-2 py-1"># 신발</li>
                    </ul>
                </div>

                {/* 추가정보 입력 토글 버튼 */}
                <button className="flex items-center gap-2">
                    <strong>추가정보 입력</strong>
                    <i className="xi-angle-down-min"></i>
                </button>

                {/* 추가정보 컨텐츠 */}
                <div className="flex flex-col gap-4">
                    {/* 모델명 */}
                    <div>
                        <p className="mb-3">모델명</p>
                        <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                            <div className="flex w-full items-center gap-2">
                                <Image className="h-auto w-4" src={boxIcon} alt="" />
                                <input
                                    className="w-full bg-transparent text-sm"
                                    placeholder="모델명을 입력해주세요"
                                    type="text"
                                />
                            </div>
                            <Image className="h-auto w-4" src={clipboardIcon} alt="" />
                        </div>
                    </div>

                    {/* 브랜드 */}
                    <div>
                        <p className="mb-3">브랜드</p>
                        <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                            <div className="flex w-full items-center gap-2">
                                <Image className="h-auto w-4" src={boxIcon} alt="" />
                                <input
                                    className="w-full bg-transparent text-sm"
                                    placeholder="브랜드를 입력해주세요"
                                    type="text"
                                />
                            </div>
                            <Image className="h-auto w-4" src={infoIcon} alt="" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 구매 정보 */}
            <div className="mt-8 flex flex-col gap-4">
                <strong className="text-2xl">구매 정보</strong>

                {/* 구매일 */}
                <div>
                    <p className="mb-3">구매일</p>
                    <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                        <div className="flex w-full items-center gap-2">
                            <Image className="h-auto w-4" src={boxIcon} alt="" />
                            <input className="bg-transparent text-sm" type="date" />
                        </div>
                        <Image className="h-auto w-4" src={infoIcon} alt="" />
                    </div>
                </div>

                {/* 구매처 */}
                <div>
                    <p className="mb-3">구매처</p>
                    <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                        <div className="flex w-full items-center gap-2">
                            <Image className="h-auto w-4" src={boxIcon} alt="" />
                            <input className="w-full bg-transparent text-sm" placeholder="구매처" type="text" />
                        </div>
                        <Image className="h-auto w-4" src={infoIcon} alt="" />
                    </div>
                </div>

                {/* 컨디션 */}
                <div>
                    <p className="mb-3">컨디션</p>
                    <ul className="flex flex-wrap gap-3">
                        <li className="flex items-center gap-2">
                            <input id="condition-1" name="condition" type="radio" />
                            <label htmlFor="condition-1">매우 나쁨</label>
                        </li>
                        <li className="flex items-center gap-2">
                            <input id="condition-2" name="condition" type="radio" />
                            <label htmlFor="condition-2">나쁨</label>
                        </li>
                        <li className="flex items-center gap-2">
                            <input id="condition-3" name="condition" type="radio" />
                            <label htmlFor="condition-3">중간</label>
                        </li>
                        <li className="flex items-center gap-2">
                            <input id="condition-4" name="condition" type="radio" />
                            <label htmlFor="condition-4">좋음</label>
                        </li>
                        <li className="flex items-center gap-2">
                            <input id="condition-5" name="condition" type="radio" />
                            <label htmlFor="condition-5">매우 좋음</label>
                        </li>
                    </ul>
                </div>

                {/* 코드 */}
                <div>
                    <p>카테고리</p>
                    <ul className="mt-2 flex flex-wrap gap-2 rounded-xl border-[1px] border-dashed border-gray-300 p-3">
                        <li className="rounded-md border-[1px] border-gray-300 px-2 py-1"># 가구</li>
                        <li className="rounded-md border-[1px] border-gray-300 px-2 py-1"># 신발</li>
                    </ul>
                </div>

                {/* 제품 정보 */}
                <div>
                    <p className="mb-3">제품 정보</p>
                    <div className="flex items-center justify-between rounded-lg border-[1px] border-[#D1D5DB] bg-gray-100 p-2">
                        <div className="flex w-full items-center gap-2">
                            <Image className="h-auto w-4" src={boxIcon} alt="" />
                            <input
                                className="w-full bg-transparent text-sm"
                                placeholder="제품의 상세한 정보를 입력해주세요"
                                type="text"
                            />
                        </div>
                        <Image className="h-auto w-4" src={infoIcon} alt="" />
                    </div>
                </div>
            </div>
        </div>
    );
}
