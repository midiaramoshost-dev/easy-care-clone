import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string | null;
  description: string | null;
  features: string[];
  popular: boolean;
  cta_text: string;
  sort_order: number;
}

const fallbackPlans: Plan[] = [
  {
    id: "1",
    name: "Básico",
    price: 0,
    period: null,
    description: "Para começar a organizar o cuidado",
    features: ["1 idoso monitorado", "Agenda básica", "Relatórios simples", "Suporte por email"],
    popular: false,
    cta_text: "Começar Grátis",
    sort_order: 1,
  },
  {
    id: "2",
    name: "Família",
    price: 49,
    period: "/mês",
    description: "Para famílias que precisam de mais recursos",
    features: ["Até 3 idosos", "Agenda completa", "Relatórios detalhados", "Alertas personalizados", "Suporte prioritário"],
    popular: true,
    cta_text: "Escolher Plano",
    sort_order: 2,
  },
  {
    id: "3",
    name: "Profissional",
    price: 99,
    period: "/mês",
    description: "Para cuidadores e profissionais de saúde",
    features: ["Idosos ilimitados", "Todas as funcionalidades", "API e integrações", "Relatórios avançados", "Suporte 24/7", "Treinamento incluso"],
    popular: false,
    cta_text: "Escolher Plano",
    sort_order: 3,
  },
];

export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        features: (p.features as string[]) || [],
      }));
    },
    placeholderData: fallbackPlans,
  });
};
