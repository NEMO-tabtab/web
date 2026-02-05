import Image from "next/image";
import Link from "next/link";
import Filter from "../components/filter";
import { Suspense } from "react";
// 이미지
import barcodeIcon from "../../assets/images/icon_barcode.png";

// const getProductList = async () => {
//     const response = await fetch(`http://localhost:8080/api/product/list`);
//     return response;
// };

export default async function Product() {
    // const productList = await getProductList();

    const locationList = [
        {
            name: "본가",
        },
        {
            name: "자취방",
        },
        {
            name: "창고",
        },
    ];
    const gnbCategory = [
        {
            name: "가전제품",
        },
        {
            name: "가구",
        },
        {
            name: "컴퓨터",
        },
        {
            name: "주방용품",
        },
    ];

    const productList = [
        {
            title: "레인보우 RGB 키보드",
            description: "나에게서 8개월 차",
            location: "본가",
            purchasePrice: 10000,
            marketPrice: 10000,
            imgUrl: "https://placehold.co/200x200.jpg",
        },
        {
            title: "레인보우 RGB 키보드",
            description: "나에게서 8개월 차",
            location: "본가",
            purchasePrice: 10000,
            marketPrice: 10000,
            imgUrl: "https://placehold.co/200x200.jpg",
        },
    ];

    return (
        <div className="pb-20 lg:pb-40">
            <Suspense>
                <Filter locationList={locationList} gnbCategory={gnbCategory} />
            </Suspense>
            <div className="container-1280 px mt-10">
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {productList.map((product, index) => (
                        <li className="border-b-[1px] border-gray-200 pb-5" key={index}>
                            <Link className="flex items-start gap-5" href="">
                                <div className="overflow-hidden rounded-lg md:w-[200px]">
                                    <Image
                                        src={product.imgUrl}
                                        width={200}
                                        height={200}
                                        className="h-full w-full object-cover"
                                        alt="제품 썸네일"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-lg lg:text-xl">{product.title}</p>

                                    {/* 위치, 가격 정보 */}
                                    <div className="flex items-end gap-3 font-bold">
                                        <div className="flex-center bg-brand-2 w-fit rounded-full px-2 py-[2px] text-xs text-white">
                                            본가
                                        </div>
                                        <div className="leading-none">{product.marketPrice.toLocaleString()}원</div>
                                        <div className="text-brand-2 text-xs leading-none">
                                            {product.purchasePrice.toLocaleString()}원
                                        </div>
                                    </div>

                                    {product.description && (
                                        <p className="text-xs text-black/50">{product.description}</p>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 플로팅 버튼 */}
            <div className="fixed bottom-10 right-10 flex flex-col items-center gap-2">
                <Link className="block" href="/add-product">
                    <i className="xi-plus-circle-o text-brand-2 text-5xl"></i>
                </Link>
                <Link className="flex-center bg-brand-2 h-10 w-10 rounded-full" href="#">
                    <Image className="h-auto w-[60%]" src={barcodeIcon} alt="필터" />
                </Link>
            </div>
        </div>
    );
}
