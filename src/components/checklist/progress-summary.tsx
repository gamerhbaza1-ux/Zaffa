"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProgressSummaryProps = {
  purchasedCount: number;
  totalCount: number;
};

export function ProgressSummary({ purchasedCount, totalCount }: ProgressSummaryProps) {
  const remainingCount = totalCount - purchasedCount;
  const progressPercentage = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg font-semibold text-foreground">
            {remainingCount > 0 ? `${remainingCount} Items Remaining` : 'All items purchased! 🎉'}
          </p>
          <p className="text-sm text-muted-foreground">
            {purchasedCount}/{totalCount} Purchased
          </p>
        </div>
        <Progress value={progressPercentage} aria-label={`${Math.round(progressPercentage)}% complete`} />
      </CardContent>
    </Card>
  );
}
