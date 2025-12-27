import FuturisticLoader from "@/components/ui/FuturisticLoader";

export default function Loading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
            <FuturisticLoader text="Initializing Neural Interface..." subtext="Syncing with Nebula Core" />
        </div>
    );
}
