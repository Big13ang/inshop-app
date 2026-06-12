'use client'

import Footer from "./Footer";
import { PlusSquare, LogOut, Clock } from "lucide-react";

const MAIN_HEADER_TABS = [
    {
        id: "waiting-posts",
        icon: Clock,
    },
    {
        id: "new-post",
        icon: PlusSquare,
    },
    {
        id: "logout",
        icon: LogOut,
    },
];


export const MainFooter = () => {
    return (
        <Footer.Nav activeTab="dashboard" onTabChange={() => { }} tabs={MAIN_HEADER_TABS} />
    )
}