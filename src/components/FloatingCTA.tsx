import { MessageCircle } from "lucide-react";

const FloatingCTA = () => {
  return (
    <button className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 z-50">
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">Fale Conosco</span>
    </button>
  );
};

export default FloatingCTA;
