import React from "react";
import Image from "next/image";

interface Props {
    children: React.ReactNode;
}

const homeLayout = ({ children }: Props) => {
    return <>{children}</>;
};

export default homeLayout;
