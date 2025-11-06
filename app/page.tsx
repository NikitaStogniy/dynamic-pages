'use client'
import {useRouter} from "next/navigation";
import {useAuth} from "@/lib/auth/context-new";
import {useEffect} from "react";

export default function Home() {
const user = useAuth();
const router = useRouter();

useEffect(() => {
    if(user) {
        router.push("/dashboard");
    } else {
        router.push("/signin");
    }
}, [user, router]);

return null;
}
