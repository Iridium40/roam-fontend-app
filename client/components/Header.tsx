import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
              ROAM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#services"
              className="text-foreground/70 hover:text-roam-blue transition-colors"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className="text-foreground/70 hover:text-roam-blue transition-colors"
            >
              How it Works
            </a>
            <Link
              to="/providers"
              className="text-foreground/70 hover:text-roam-blue transition-colors"
            >
              Become a Provider
            </Link>
            <Button
              variant="outline"
              className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
            >
              Sign In
            </Button>
            <Button className="bg-roam-blue hover:bg-roam-blue/90">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <a
                href="#services"
                className="text-foreground/70 hover:text-roam-blue transition-colors"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="text-foreground/70 hover:text-roam-blue transition-colors"
              >
                How it Works
              </a>
              <Link
                to="/providers"
                className="text-foreground/70 hover:text-roam-blue transition-colors"
              >
                Become a Provider
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button
                  variant="outline"
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                >
                  Sign In
                </Button>
                <Button className="bg-roam-blue hover:bg-roam-blue/90">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
