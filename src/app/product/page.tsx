import axios from "axios";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import Filter from "./components/Filter";

// 이미지
import barcodeIcon from "@/app/assets/images/icon_barcode.png";
import defaultThumbnail from "@/app/assets/images/product_default_thumbnail.jpg";

const getProductList = async () => {
    try {
        const response = await axios.post(`http://localhost:8080/api/product/list`, {
            page: 1,
            size: 10,
        });
        return response.data;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
};

export default async function Product() {
    const productList = await getProductList();

    console.log(productList);

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

    return (
        <div className="pb-20 lg:pb-40">
            <Suspense>
                <Filter locationList={locationList} gnbCategory={gnbCategory} />
            </Suspense>
            <div className="container-1280 px mt-10">
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {productList.content.map((product: any, index: number) => (
                        <li className="border-b-[1px] border-gray-200 pb-5" key={index}>
                            <Link className="flex items-start gap-5" href="/product/edit/4">
                                <div className="overflow-hidden rounded-lg md:w-[200px]">
                                    <Image
                                        src={
                                            product.files.length > 0
                                                ? `http://localhost:8080/${product.files[0].filePath}`
                                                : defaultThumbnail
                                        }
                                        width={200}
                                        height={200}
                                        className="h-full w-full object-cover"
                                        alt="제품 썸네일"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-lg lg:text-xl">{product.productNm}</p>

                                    {/* 위치, 가격 정보 */}
                                    <div className="flex items-end gap-3 font-bold">
                                        <div className="flex-center bg-brand-2 w-fit rounded-full px-2 py-[2px] text-xs text-white">
                                            본가
                                        </div>
                                        <div className="leading-none">{product.productValue.toLocaleString()}원</div>
                                        <div className="text-brand-2 text-xs leading-none">
                                            {product.productPrice.toLocaleString()}원
                                        </div>
                                    </div>

                                    {product.content && <p className="text-xs text-black/50">{product.content}</p>}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 플로팅 버튼 */}
            <div className="fixed bottom-10 right-10 flex flex-col items-center gap-2">
                <Link className="block" href="/product/add">
                    <i className="xi-plus-circle-o text-brand-2 text-5xl"></i>
                </Link>
                <Link className="flex-center bg-brand-2 h-10 w-10 rounded-full" href="#">
                    <Image className="h-auto w-[60%]" src={barcodeIcon} alt="필터" />
                </Link>
            </div>
        </div>
    );
}
