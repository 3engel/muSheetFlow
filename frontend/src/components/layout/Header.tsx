import { SidebarTrigger } from "../ui/sidebar";
import { AppBreadcrumb } from "./AppBreadcrumb";
import { ModeToggle } from "../ModeToggle";

export const Header = () => {
  return (
    <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 z-10 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-full flex items-center border-r border-white/40 mr-2">
          <SidebarTrigger />
        </div>
        <AppBreadcrumb />
      </div>
      <div>
        <ModeToggle />
      </div>
    </header>
  );
};
