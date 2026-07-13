"use client";

type TimelineItem = {
  id: string;
  type: "followup" | "activity";
  createdAt: Date;
  title: string;
  description: string | null;
  meta?: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No activity yet.</p>;
  }

  return (
    <div className="relative border-l border-muted pl-4 space-y-4">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
              {item.type === "followup" && (
                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Follow-up</span>
              )}
            </div>
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
            {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
