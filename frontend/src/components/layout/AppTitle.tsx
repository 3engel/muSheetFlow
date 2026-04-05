import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export function AppTitle(props: {
  appTitle: string;
  appVersion?: string;
  isMultiLine?: boolean;
  className?: string;
}) {
  const { appTitle, appVersion, isMultiLine, className } = props;
  return (
    <div
      className={cn(
        className,
        isMultiLine && appVersion?.trim() !== "" ? "flex-col" : "items-center",
        "flex"
      )}
    >
      <h1>{appTitle}</h1>
      {appVersion && (
        <Badge
          variant="secondary"
          className={cn(!isMultiLine ? "ml-2" : "")}
        >
          {appVersion}
        </Badge>
      )}
    </div>
  );
}