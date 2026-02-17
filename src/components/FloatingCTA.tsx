import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Phone, Mail } from "lucide-react";

const contactOptions = [
  {
    icon: Phone,
    label: "Telefone",
    href: "tel:+5511999999999",
    bg: "bg-primary",
  },
  {
    icon: Mail,
    label: "Email",
    href: "mailto:contato@cuidadofacil.com",
    bg: "bg-accent",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/5511999999999?text=Olá! Gostaria de mais informações.",
    bg: "bg-success",
  },
];

const FloatingCTA = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open &&
          contactOptions.map((opt, i) => (
            <motion.a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 20 }}
              className={`${opt.bg} text-primary-foreground flex items-center gap-3 rounded-2xl px-5 py-3 shadow-lg hover:opacity-90 transition-opacity`}
            >
              <opt.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{opt.label}</span>
            </motion.a>
          ))}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 transition-all animate-pulse-glow"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline font-medium">{open ? "Fechar" : "Fale Conosco"}</span>
      </motion.button>
    </div>
  );
};

export default FloatingCTA;
