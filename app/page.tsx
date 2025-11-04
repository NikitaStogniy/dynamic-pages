'use client'
import {useRouter} from "next/navigation";
import {useAuth} from "@/lib/auth/context-new";

export default function Home() {
const user = useAuth();
const router = useRouter();
if(user) {
    router.push("/dashboard");
} else {
    router.push("/signin");
}
return null;
}
