"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Location {
    name: string;
}
interface GnbCategory {
    name: string;
}

export default function Filter({
    locationList,
    gnbCategory,
}: {
    locationList: Location[];
    gnbCategory: GnbCategory[];
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const locationIndex = Number(searchParams.get("location")) || 0;
    const gnbCategoryIndex = Number(searchParams.get("category")) || 0;

    const locationClick = (index: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("location", String(index));

        // replace를 사용하면 브라우저 히스토리에 쌓이지 않음
        router.replace(`${pathname}?${params}`);
    };

    const categoryClick = (index: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("category", String(index));

        // replace를 사용하면 브라우저 히스토리에 쌓이지 않음
        router.replace(`${pathname}?${params}`);
    };

    return (
        <nav className="container-1280 px sticky left-0 right-0 top-14 z-10 bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.1)] lg:top-20">
            {/* 장소 필터 */}
            <div className="w-full overflow-x-auto border-b-[1px] border-gray-200">
                <ul className="flex w-max gap-2 py-3">
                    {locationList.map((location, index) => (
                        <li key={index}>
                            <button
                                onClick={() => locationClick(index)}
                                className={`${locationIndex === index ? "bg-brand-2 text-brand-3" : "bg-brand-3 text-brand-2"} rounded-full px-4 py-2 text-sm font-bold`}
                            >
                                {location.name}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button className="aspect-square h-full rounded-full bg-brand-2 text-sm font-bold text-brand-3">
                            <i className="xi-plus"></i>
                        </button>
                    </li>
                </ul>
            </div>

            {/* 카테고리 필터 */}
            <div className="w-full overflow-x-auto">
                <ul className="flex w-max gap-2 py-3">
                    {gnbCategory.map((category, index) => (
                        <li key={index}>
                            <button
                                onClick={() => categoryClick(index)}
                                className={`${gnbCategoryIndex === index ? "bg-brand-2 text-brand-3" : "bg-brand-3 text-brand-2"} rounded-full px-4 py-2 text-sm font-bold`}
                            >
                                {category.name}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button className="aspect-square h-full rounded-full bg-brand-2 text-sm font-bold text-brand-3">
                            <i className="xi-plus"></i>
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
