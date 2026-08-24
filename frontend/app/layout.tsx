import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import WelcomeModal from "./components/WelcomeModal";

export const metadata = {
  title: "KNP Record Management System",
  description: "Secure institutional portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <WelcomeModal />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
