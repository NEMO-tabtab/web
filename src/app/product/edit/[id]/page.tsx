import axios from "axios";
import DetailPage from "@/app/product/components/DetailPage";

const editProduct = async (data: any) => {
    try {
        const formData = new FormData();

        // 각 필드를 FormData에 추가
        Object.keys(data).forEach((key) => {
            formData.append(key, data[key]);
        });

        const response = await axios.put(`http://localhost:8080/api/product`, data);
        return response.data;
    } catch (error: any) {
        console.error("Error:", error);
        return null;
    }
};

export default async function EditProduct() {
    const dummyData = {
        barcode: "1234567890123",
        selTag: "노트북,애플,맥북",
        prchPlace: "Apple Store",
        productValue: 1200000,
        brandNm: "Apple",
        modelNm: "MacBook Pro 13",
        information: "실버, 256GB SSD, 8GB RAM",
        productNm: "api 테스트",
        productIdx: 4,
        status: "EXCELLENT",
        prchDate: "2023-01-15",
        serialNo: "MBP2023001",
        spaceIdx: 1,
        selCategory: "전자기기",
        carrotYn: "N",
        content: "2023년 구매한 MacBook Pro입니다.",
        productPrice: 1500000,
        productCnt: 1,
    };

    const response = await editProduct(dummyData);
    console.log(response);

    return <DetailPage />;
}
