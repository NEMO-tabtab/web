import Image from "next/image";

export default function AddProduct() {
    // 물건 썸네일 src 리스트
    const productThumbnailSrcList = ["https://placehold.co/300x200.jpg", "https://placehold.co/300x200.jpg"];

    const categoryList = [
        {
            id: 1,
            name: "의류",
        },
        {
            id: 2,
            name: "가구",
        },
        {
            id: 3,
            name: "가전제품",
        },
        {
            id: 4,
            name: "문구",
        },
        {
            id: 5,
            name: "책",
        },
        {
            id: 6,
            name: "신발",
        },
        {
            id: 7,
            name: "디지털기기",
        },
        {
            id: 8,
            name: "기타",
        },
    ];

    return (
        <div className="container-1280 px lg:py-20 py-10">
            {/* 이미지 등록 */}
            <ul className="grid grid-cols-3 lg:gap-4 gap-2">
                {productThumbnailSrcList.map((src) => (
                    <li className="overflow-hidden rounded-xl" key={src}>
                        <Image
                            src={src}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                            alt="물건 썸네일"
                        />
                    </li>
                ))}
                <li className="rounded-xl bg-gray-200">
                    <input id="product-thumbnail" className="hidden" type="file" />
                    <label className="flex-center w-full h-full" htmlFor="product-thumbnail">
                        <strong className="lg:text-4xl text-2xl">+</strong>
                    </label>
                </li>
            </ul>

            {/* 제품 정보 */}
            <div className="lg:pt-20 pt-10">
                <div className="flex justify-between items-end">
                    <h2 className="title-type-1">제품정보</h2>
                    <p className="lg:text-base text-sm text-red-1">* 는 필수입력입니다</p>
                </div>

                <div className="flex flex-col gap-12 mt-10">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="product-name">
                            <strong className="lg:text-xl text-base">
                                이름 <span>*</span>
                            </strong>
                        </label>
                        <input
                            id="product-name"
                            className="input-type-1"
                            type="text"
                            placeholder="물건 이름을 입력해주세요"
                        />
                    </div>

                    {/* 구매 가격, 수량 */}
                    <div className="grid lg:grid-cols-2 gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input type="radio" name="is-gift" id="is-gift-no" />
                                <label htmlFor="is-gift-no">제가 구매했어요</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="is-gift" id="is-gift-yes" />
                                <label htmlFor="is-gift-yes">무료로 받았어요</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:gap-5 gap-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="product-name">
                                    <strong className="lg:text-xl text-base">구매 가격</strong>
                                </label>
                                <div className="flex items-end lg:gap-2 gap-1">
                                    <input
                                        id="product-name"
                                        className="input-type-1 w-full"
                                        type="text"
                                        placeholder="구매 가격을 입력해주세요"
                                    />
                                    <strong className="lg:text-base text-sm">원</strong>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="product-name">
                                    <strong className="lg:text-xl text-base">수량</strong>
                                </label>
                                <input
                                    id="product-name"
                                    className="input-type-1"
                                    type="text"
                                    placeholder="수량을 입력해주세요"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 카테고리 */}
                    <div>
                        <div className="flex flex-col gap-2">
                            <div>
                                <strong className="lg:text-xl text-base">카테고리</strong>
                            </div>

                            {/* 리스트 */}
                            <ul className="flex flex-wrap lg:gap-3 gap-2 border-solid border-gray-200 border-[1px] rounded-md lg:p-5 p-3">
                                {categoryList.map((category) => (
                                    <li className="rounded-full bg-slate-200" key={category.id}>
                                        <input type="checkbox" id={`category-${category.id}`} />
                                        <label
                                            className="block lg:text-base text-sm px-4 py-2"
                                            htmlFor={`category-${category.id}`}
                                        >
                                            {category.name}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 추가 정보 입력 */}
                    <button>
                        <p className="text-left font-bold">추가정보 입력</p>
                        <i></i>
                    </button>

                    <div className="grid lg:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-name">
                                <strong className="lg:text-xl text-base">모델명</strong>
                            </label>
                            <input
                                id="product-name"
                                className="input-type-1"
                                type="text"
                                placeholder="모델명을 입력해주세요"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-name">
                                <strong className="lg:text-xl text-base">브랜드</strong>
                            </label>
                            <input
                                id="product-name"
                                className="input-type-1"
                                type="text"
                                placeholder="브랜드를 입력해주세요"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 구매 정보 */}
            <div className="border-t-[1px] border-solid border-gray-200 lg:pt-20 pt-10 lg:mt-20 mt-10">
                <h2 className="title-type-1">구매 정보</h2>

                <div className="flex flex-col gap-12 mt-10">
                    {/* 구매일, 구매처 */}
                    <div className="grid lg:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-name">
                                <strong className="lg:text-xl text-base">구매일</strong>
                            </label>
                            <input
                                id="product-name"
                                className="input-type-1"
                                type="text"
                                placeholder="구매일을 입력해주세요"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-name">
                                <strong className="lg:text-xl text-base">구매처</strong>
                            </label>
                            <input
                                id="product-name"
                                className="input-type-1"
                                type="text"
                                placeholder="구매처를 입력해주세요"
                            />
                        </div>
                    </div>

                    {/* 컨디션 */}
                    <div>
                        <strong className="lg:text-xl text-base">컨디션</strong>
                        <div className="flex md:flex-row flex-col md:items-center md:gap-4 gap-2 mt-2">
                            <div className="flex items-center gap-2">
                                <input type="radio" name="" id="" />
                                <label htmlFor="">매우 나쁨</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="" id="" />
                                <label htmlFor="">나쁨</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="" id="" />
                                <label htmlFor="">중간</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="" id="" />
                                <label htmlFor="">좋음</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="" id="" />
                                <label htmlFor="">매우 좋음</label>
                            </div>
                        </div>
                    </div>

                    {/* 태그 코드 */}
                    <div>
                        <strong className="lg:text-xl text-base">태그 코드</strong>

                        <ul className="flex flex-wrap gap-3 mt-2 bg-gray-100 rounded-md lg:p-5 p-3">
                            <li className="rounded-md lg:text-base text-sm px-4 py-2 bg-white">태그코드 1</li>
                            <li className="rounded-md lg:text-base text-sm px-4 py-2 bg-white">
                                <button>추가 +</button>
                            </li>
                        </ul>
                    </div>

                    {/* 제품 정보 */}
                    <div>
                        <strong className="lg:text-xl text-base">제품 정보</strong>
                        <textarea
                            name=""
                            id=""
                            placeholder="제품 정보를 입력해주세요"
                            className="input-type-1 w-full h-[200px] mt-2"
                        ></textarea>
                    </div>

                    {/* 등록하기 */}
                    <button className="md:w-96 w-full md:h-12 h-10 rounded-md mx-auto text-brand-2 bg-brand-3">
                        등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}
