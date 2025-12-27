import FuturisticLoader from "@/components/ui/FuturisticLoader";

export default function Loading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] pt-20">
            <FuturisticLoader
                text="Calibrating Daily Goals..."
                subtext="analyzing learning patterns"
            />
        </div>
    );
}
