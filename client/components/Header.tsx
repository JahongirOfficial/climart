import { Bell, Search, Settings, CircleUser, Moon, Sun } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export const Header = () => {
  const [isDark, setIsDark] = useState(false);

  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors duration-1000">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        {/* Left Section: Logo and App Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold">
            CE
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:inline">
            CLIMART ERP
          </span>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 h-9 bg-secondary border-0 rounded-lg focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Right Section: Dark Mode, Notifications, Settings, User Profile */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
            onClick={toggleDarkMode}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-foreground transition-transform duration-1000 rotate-0" />
            ) : (
              <Moon className="h-5 w-5 text-foreground transition-transform duration-1000 rotate-0" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
          >
            <Bell className="h-5 w-5 text-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
          >
            <Settings className="h-5 w-5 text-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
          >
            <CircleUser className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
};
