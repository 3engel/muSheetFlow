import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import { Toaster } from "../ui/sonner";
import { Header } from "./Header";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* <main className="flex flex-1 flex-col p-4">{children}</main> */}
          <main className="flex flex-col p-4">
            <div className="container mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            success: "[&_svg]:!text-green-500",
            error: "[&_svg]:!text-red-500",
          },
        }}
      />
      <TanStackDevtools
        config={{ position: "middle-right", panelLocation: "bottom" }}
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
};
