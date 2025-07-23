import Image from "next/image";

export default function Product() {
    const gnbCategory = [
        {
            name: "전체",
        },
        {
            name: "가전제품",
        },
        {
            name: "의류",
        },
        {
            name: "식품",
        },
    ];

    const locationList = [
        {
            name: "레인보우 RGB 키보드1",
            price: 10000,
            marketPrice: 10000,
            location: "내 자취방",
            description: "레인보우 RGB 키보드1 입니다.",
        },
        {
            name: "레인보우 RGB 키보드2",
            price: 20000,
            marketPrice: 10000,
            location: "내 자취방",
            description: "레인보우 RGB 키보드2 입니다.",
        },
        {
            name: "레인보우 RGB 키보드3",
            price: 30000,
            marketPrice: 10000,
            location: "내 자취방",
            description: "레인보우 RGB 키보드3 입니다.",
        },
        {
            name: "레인보우 RGB 키보드4",
            price: 40000,
            marketPrice: 10000,
            location: "내 자취방",
            description: "레인보우 RGB 키보드4 입니다.",
        },
        {
            name: "레인보우 RGB 키보드1",
            price: 10000,
            marketPrice: 10000,
            location: "본가",
            description: "레인보우 RGB 키보드1 입니다.",
        },
        {
            name: "레인보우 RGB 키보드2",
            price: 20000,
            marketPrice: 10000,
            location: "본가",
            description: "레인보우 RGB 키보드2 입니다.",
        },
        {
            name: "레인보우 RGB 키보드3",
            price: 30000,
            marketPrice: 10000,
            location: "본가",
            description: "레인보우 RGB 키보드3 입니다.",
        },
        {
            name: "레인보우 RGB 키보드4",
            price: 40000,
            marketPrice: 10000,
            location: "본가",
            description: "레인보우 RGB 키보드4 입니다.",
        },
    ];

    return (
        <div className="lg:pb-40 pb-20">
            {/* 카테고리 필터 */}
            <nav className="sticky z-10 lg:top-20 top-14 left-0 right-0 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.1)] bg-white">
                <ul className="container-1280 px flex gap-2 py-3">
                    {gnbCategory.map((category) => (
                        <li key={category.name}>
                            <button className="lg:text-base text-sm rounded-full px-4 py-2 text-brand-2 bg-brand-3">
                                {category.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="container-1280 px">
                <div className="lg:pt-20 pt-10">
                    {/* 공간 분류 리스트 */}
                    <ul className="grid lg:grid-cols-2 grid-1 gap-x-5 lg:gap-y-12 gap-y-4 lg:mt-5">
                        {locationList.map((product, index) => (
                            <li
                                key={product.name}
                                style={{
                                    borderTop: index === 0 ? "0px none" : "",
                                    paddingTop: index === 0 ? "0px" : "",
                                }}
                                className="overflow-hidden flex items-start gap-5 border-solid md:border-t-[0px] border-t-[1px] border-gray-200 pt-4"
                            >
                                <div className="overflow-hidden md:min-w-[200px] min-w-[100px] lg:rounded-xl rounded-md">
                                    <Image
                                        src="https://placehold.co/200x200.jpg"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover"
                                        alt="물건 썸네일"
                                    />
                                </div>
                                <div className="flex flex-col lg:gap-3 gap-2 w-full">
                                    {/* 물건 이름 */}
                                    <strong className="lg:text-xl text-lg">{product.name}</strong>

                                    {/* 물건 위치, 구매가격, 시세 */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-fit leading-none lg:text-base text-xs rounded-full lg:py-2 lg:px-3 py-1 px-2 text-white bg-brand-2">
                                            {product.location}
                                        </div>
                                        <strong className="lg:text-xl text-sm">
                                            {product.price.toLocaleString()}원
                                        </strong>
                                        <strong className="lg:text-lg text-xs text-brand-2">
                                            {product.marketPrice.toLocaleString()}원
                                        </strong>
                                    </div>
                                    <p className="opacity-50 lg:text-base text-xs lg:mt-4 mt-2">
                                        {product.description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 플로팅 버튼 */}
            {/* <div>
                <button></button>
            </div> */}
        </div>
    );
}
