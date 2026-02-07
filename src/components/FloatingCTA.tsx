import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const FloatingCTA = () => {
  return (
    <motion.button 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 transition-all z-50 animate-pulse-glow"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">Fale Conosco</span>
    </motion.button>
  );
};

export default FloatingCTA;
