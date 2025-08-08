
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PostSkeleton() {
  return (
    <Card className="w-full max-w-xl">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <Skeleton className="aspect-square w-full" />

        <div className="p-4 space-y-3">
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-8 w-8" />
            </div>

            <Skeleton className="h-4 w-20" />
            
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            
            <Skeleton className="h-3 w-24" />
        </div>

        <div className="border-t px-4 py-3">
            <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
