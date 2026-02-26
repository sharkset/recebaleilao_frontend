interface SkeletonCardProps {
    viewMode?: 'grid' | 'list';
}

export default function SkeletonCard({ viewMode = 'grid' }: SkeletonCardProps) {
    if (viewMode === 'list') {
        return (
            <div className="flex flex-row overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm animate-pulse min-h-[110px]">
                <div className="w-[160px] sm:w-[200px] shrink-0 bg-gray-100" />
                <div className="flex-1 p-4 flex flex-col gap-3 justify-center">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="flex gap-4">
                        <div className="h-3 bg-gray-100 rounded w-16" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                    </div>
                </div>
                <div className="flex flex-col gap-2 p-4 justify-center items-end shrink-0">
                    <div className="h-5 bg-gray-100 rounded w-28" />
                    <div className="h-8 bg-gray-100 rounded w-24" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm animate-pulse">
            <div className="aspect-[4/3] bg-gray-100" />
            <div className="p-4 flex flex-col gap-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-4 mt-1">
                    <div className="h-3 bg-gray-100 rounded w-16" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between items-center mt-2">
                    <div className="h-6 bg-gray-100 rounded w-24" />
                    <div className="h-8 bg-gray-100 rounded w-20" />
                </div>
            </div>
        </div>
    );
}
