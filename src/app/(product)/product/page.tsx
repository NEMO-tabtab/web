import Image from "next/image";

export default function Product() {
    const gnbCategory = [
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

    const productList = [
        {
            name: "제품1",
        },
        {
            name: "제품2",
        },
        {
            name: "제품3",
        },
        {
            name: "제품4",
        },
    ];

    const locationList = [
        {
            name: "내 자취방",
            productCount: 0,
            shareCount: 0,
            productList: [
                { name: "제품1", price: 10000 },
                { name: "제품2", price: 20000 },
                { name: "제품3", price: 30000 },
                { name: "제품4", price: 40000 },
            ],
        },
        {
            name: "회사 책상",
            productCount: 0,
            shareCount: 0,
            productList: [
                { name: "제품1", price: 10000 },
                { name: "제품2", price: 20000 },
                { name: "제품3", price: 30000 },
                { name: "제품4", price: 40000 },
            ],
        },
    ];

    return (
        <div className="lg:pb-40 pb-20">
            {/* 카테고리 필터 */}
            <nav className="sticky z-10 lg:top-20 top-14 left-0 right-0 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.1)] bg-white">
                <ul className="container-1280 px flex gap-2 py-3">
                    {gnbCategory.map((category) => (
                        <li key={category.name}>
                            <button className="lg:text-base text-sm border-[1px] border-gray-200 border-solid rounded-full px-4 py-2">
                                {category.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="container-1280 px">
                {/* 제품 정보 리스트 */}
                <ul className="grid xl:grid-cols-4 lg:grid-cols-2 grid-1 lg:gap-4 gap-3 pt-10">
                    {productList.map((product) => (
                        <li key={product.name} className="border-[1px] border-gray-200 border-solid rounded-lg p-8">
                            <div>
                                <strong className="text-xl">{product.name}</strong>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* 공간 분류 */}
                <div className="border-t-[1px] border-gray-200 border-solid lg:pt-20 pt-10 lg:mt-20 mt-10">
                    <ul className="flex flex-col gap-20">
                        {locationList.map((location) => (
                            <li key={location.name}>
                                <div className="flex lg:flex-row flex-col justify-between lg:items-end gap-2">
                                    <h2 className="lg:text-3xl text-2xl font-bold">{location.name}</h2>
                                    <div className="flex gap-4 lg:text-base text-sm">
                                        <div>
                                            <span>제품 수 : </span>
                                            <span>{location.productCount}개</span>
                                        </div>
                                        <div>
                                            <span>공유중인 사람 : </span>
                                            <span>{location.shareCount}개</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 리스트 */}
                                <ul className="grid lg:grid-cols-2 grid-1 gap-4 mt-5">
                                    {location.productList.map((product) => (
                                        <li
                                            key={product.name}
                                            className="overflow-hidden flex md:flex-row flex-col items-start border-[1px] border-gray-200 border-solid rounded-2xl"
                                        >
                                            <Image
                                                src="https://placehold.co/200x200.jpg"
                                                width={200}
                                                height={200}
                                                className="md:w-[200px] w-full"
                                                alt="제품 썸네일"
                                            />
                                            <div className="flex flex-col gap-2 p-8">
                                                <strong className="lg:text-xl text-lg">{product.name}</strong>
                                                <div className="lg:text-xl text-lg mt-auto">
                                                    <strong>{product.price.toLocaleString()}</strong>
                                                    <span>원</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
