   "use client";
   import Sidebar from "@/app/components/Sidebar";
   import TopBar from "@/app/components/TopBar";

   export default function IDManagementLayout({ children }: { children: React.ReactNode }) {
     return (
       <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
         <Sidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
           <TopBar />
           <main className="flex-1 overflow-y-auto p-6">
             <div className="max-w-7xl mx-auto">
               {children}
             </div>
           </main>
         </div>
       </div>
     );
   }
