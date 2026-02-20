import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle, Loader2, CreditCard, QrCode, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const presetAmounts = [5, 10, 20, 50, 100];

const paymentMethods = [
  { id: "stripe", label: "Cartão", icon: CreditCard, description: "Débito ou crédito" },
  { id: "mercado_pago", label: "PIX / Boleto", icon: QrCode, description: "Via Mercado Pago" },
  { id: "manual", label: "PIX Manual", icon: Banknote, description: "Transferência direta" },
];

const DonationSection = () => {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manualPix, setManualPix] = useState(false);

  const finalAmount = customAmount
    ? parseFloat(customAmount.replace(",", "."))
    : selectedAmount;

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    finalAmount != null &&
    !isNaN(finalAmount) &&
    finalAmount >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      // First, register the donation intent
      const { data: donation, error: dbError } = await supabase
        .from("donations")
        .insert({
          donor_name: name.trim(),
          donor_email: email.trim().toLowerCase(),
          amount: finalAmount!,
          message: message.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (paymentMethod === "manual") {
        // Manual PIX - just show success with instructions
        setManualPix(true);
        setSuccess(true);
        return;
      }

      // Process via payment gateway
      const origin = window.location.origin;
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("process-payment", {
        body: {
          gateway: paymentMethod,
          action: paymentMethod === "stripe" ? "create_checkout_session" : "create_preference",
          ...(paymentMethod === "stripe"
            ? {
                mode: "payment",
                price_data: {
                  currency: "brl",
                  unit_amount: Math.round(finalAmount! * 100),
                  product_data: { name: `Doação para Asilos de Sorocaba - ${name.trim()}` },
                },
                success_url: `${origin}/?doacao=sucesso`,
                cancel_url: `${origin}/?doacao=cancelado`,
                customer_email: email.trim(),
              }
            : {
                items: [
                  {
                    title: "Doação para Asilos de Sorocaba",
                    quantity: 1,
                    unit_price: finalAmount!,
                    currency_id: "BRL",
                  },
                ],
                payer: { name: name.trim(), email: email.trim() },
                back_urls: {
                  success: `${origin}/?doacao=sucesso`,
                  failure: `${origin}/?doacao=cancelado`,
                  pending: `${origin}/?doacao=pendente`,
                },
              }),
        },
      });

      if (paymentError) throw new Error(paymentError.message);

      const redirectUrl = paymentData?.url || paymentData?.init_point;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("URL de pagamento não retornada.");
      }
    } catch (err: any) {
      console.error("Donation error:", err);
      toast({
        title: "Erro ao processar doação",
        description: err.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="container-custom mx-auto relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Solidariedade
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Doe para os asilos de Sorocaba
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sua doação ajuda a melhorar a qualidade de vida de idosos em asilos da nossa cidade.
              Cada contribuição faz a diferença.
            </p>
          </motion.div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-8 rounded-3xl border border-border/50 bg-background"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Muito obrigado!</h3>
              {manualPix ? (
                <div className="max-w-md mx-auto">
                  <p className="text-muted-foreground mb-4">
                    Sua doação foi registrada! Realize o pagamento via PIX para a chave abaixo:
                  </p>
                  <div className="p-4 bg-muted rounded-xl text-left mb-6">
                    <p className="text-xs text-muted-foreground mb-1">Chave PIX (CNPJ)</p>
                    <p className="font-mono font-semibold text-foreground text-sm">00.000.000/0001-00</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-1">Favorecido</p>
                    <p className="font-semibold text-sm text-foreground">CuidadoFácil — Asilos de Sorocaba</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-1">Valor</p>
                    <p className="font-bold text-primary">R$ {finalAmount?.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Após o pagamento, envie o comprovante para <strong>doacoes@cuidadofacil.com.br</strong>
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Sua doação foi registrada com sucesso. Você receberá uma confirmação no seu e-mail em breve.
                </p>
              )}
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSuccess(false);
                  setManualPix(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                  setCustomAmount("");
                  setSelectedAmount(10);
                }}
              >
                Fazer outra doação
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 gap-8 items-start"
            >
              {/* Left: Info */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-background border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Como funciona?</h3>
                  <ul className="space-y-3">
                    {[
                      "Escolha o valor que deseja doar (mínimo R$ 2,00)",
                      "Preencha seus dados e escolha a forma de pagamento",
                      "Você é redirecionado para o ambiente seguro de pagamento",
                      "Sua doação é repassada integralmente aos asilos parceiros",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground italic">
                    "Cada gesto de carinho transforma a vida dos nossos idosos. 
                    Obrigado por fazer parte dessa corrente do bem."
                  </p>
                  <p className="text-xs text-primary font-medium mt-3">— Equipe CuidadoFácil</p>
                </div>
              </div>

              {/* Right: Form */}
              <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-2xl bg-background border border-border/50">
                {/* Amount selection */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Valor da doação <span className="text-muted-foreground">(mín. R$ 2,00)</span>
                  </Label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handlePresetClick(amt)}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          selectedAmount === amt
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        R${amt}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      R$
                    </span>
                    <Input
                      type="number"
                      min="2"
                      step="0.01"
                      placeholder="Outro valor"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="donor-name" className="text-sm font-medium text-foreground mb-1.5 block">
                    Seu nome
                  </Label>
                  <Input
                    id="donor-name"
                    type="text"
                    placeholder="Maria Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="donor-email" className="text-sm font-medium text-foreground mb-1.5 block">
                    Seu e-mail
                  </Label>
                  <Input
                    id="donor-email"
                    type="email"
                    placeholder="maria@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="donor-message" className="text-sm font-medium text-foreground mb-1.5 block">
                    Mensagem <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="donor-message"
                    type="text"
                    placeholder="Uma mensagem de carinho para os idosos..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={300}
                  />
                </div>

                {/* Payment method */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Forma de pagamento
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
                        }`}
                      >
                        <method.icon className="w-4 h-4 mb-1" />
                        <p className="text-xs font-semibold">{method.label}</p>
                        <p className="text-xs opacity-70">{method.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isValid || loading}
                  className="w-full h-12 rounded-xl font-semibold text-base gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                  {loading
                    ? "Processando..."
                    : paymentMethod === "manual"
                    ? `Registrar doação de R$ ${finalAmount?.toFixed(2) ?? "–"}`
                    : `Pagar R$ ${finalAmount?.toFixed(2) ?? "–"}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Pagamento seguro. Seus dados são protegidos.
                </p>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DonationSection;
