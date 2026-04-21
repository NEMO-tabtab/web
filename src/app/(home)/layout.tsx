import React from "react";

interface Props {
    children: React.ReactNode;
}

const homeLayout = ({ children }: Props) => {
    return <>{children}</>;
};

export default homeLayout;
