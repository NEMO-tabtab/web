import React from "react";
import Image from "next/image";

interface Props {
    children: React.ReactNode;
}

const homeLayout = ({ children }: Props) => {
    return (
        <div className="relative">
            {children}
            <div className="md:hidden block sticky bottom-0 h-16 bg-white grid grid-cols-3">
                <Image
                    src="/icon/home.png"
                    width={32}
                    height={32}
                    className="w-12 asepect-ratio justify-self-center self-center"
                    alt="제품 썸네일"
                />
                <Image
                    src="/icon/home.png"
                    width={32}
                    height={32}
                    className="w-12 asepect-ratio justify-self-center self-center"
                    alt="제품 썸네일"
                />
                <Image
                    src="/icon/home.png"
                    width={32}
                    height={32}
                    className="w-12 asepect-ratio justify-self-center self-center"
                    alt="제품 썸네일"
                />
            </div>
        </div>
    );
};

export default homeLayout;
