'use client'

import { User } from 'lucide-react';
import Link from "next/link";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/auth/context-new";

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/settings', label: 'Settings' },
];
export const UserComponent = () => {

    const [isOpen, setIsOpen] = useState(false);
    const handleOpen = () => {setIsOpen(prevState => !prevState);};
    const { user, signOut } = useAuth();
    if(user ){
    return (
        <>
        <div className="flex items-center space-x-4" onClick={handleOpen}>
            <span className="text-sm text-gray-700 dark:text-gray-100">{user.email}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-b dark:from-gray-700 dark:to-gray-600 from-gray-50 to-gray-100 flex justify-center align-center items-center">
                <User />
            </div>
            <button
                onClick={signOut}
                className="cursor-pointer text-sm text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 hover:text-gray-700"
            >
                Sign out
            </button>
        </div>
            {isOpen && (
            <OpenedComponent />)}
        </>
    )
    }
    return null;
}

const OpenedComponent = () => {
    const pathname = usePathname();
    return (<nav className="shadow-sm flex justify-between h-16 flex-col">
        {navItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === item.href
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'border-transparent dark:text-shadow-gray-200 dark:hover:text-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
                {item.label}
            </Link>
        ))}
    </nav>)
}