import { Loader2 } from "lucide-react";
import { Activity } from "react";

export const LoadingActivity = ({ showLoader }: { showLoader: boolean }) => {
  return (
    <Activity mode={showLoader ? "visible" : "hidden"}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <Loader2 className="animate-spin w-12 h-12 text-white" />
      </div>
    </Activity>
  );
};
