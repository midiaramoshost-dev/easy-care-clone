import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Shield, FileText } from "lucide-react";

interface TermsOfServiceModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  planName: string;
}

const TermsOfServiceModal = ({ open, onClose, onAccept, planName }: TermsOfServiceModalProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const canProceed = acceptedTerms && acceptedPrivacy;

  const handleAccept = () => {
    if (!canProceed) return;
    onAccept();
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
  };

  const handleClose = () => {
    onClose();
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Termos de Uso e Política de Privacidade</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Plano selecionado: <span className="font-medium text-foreground">{planName}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 border border-border rounded-lg p-4 mt-2">
          <div className="space-y-5 text-sm text-foreground pr-2">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Identificação do Prestador de Serviços</h3>
              <p className="text-muted-foreground leading-relaxed">
                Os serviços descritos neste instrumento são prestados por <strong>CuidadoFácil</strong>, plataforma de intermediação e gestão de cuidados para pessoas idosas e dependentes, operando em conformidade com a legislação brasileira vigente.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Objeto do Contrato</h3>
              <p className="text-muted-foreground leading-relaxed">
                O presente Termo regula a contratação do plano de serviços selecionado pelo Contratante, incluindo acesso à plataforma, funcionalidades disponíveis conforme o plano escolhido, e eventual intermediação de cuidadores profissionais, nos termos da <strong>Lei nº 8.078/1990 (Código de Defesa do Consumidor)</strong>.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Direitos e Deveres do Contratante</h3>
              <ul className="text-muted-foreground space-y-1.5 leading-relaxed list-disc list-inside">
                <li>Fornecer informações verídicas no cadastro, sob pena de cancelamento imediato;</li>
                <li>Utilizar a plataforma exclusivamente para fins lícitos;</li>
                <li>Responsabilizar-se pelo acesso à conta mediante login e senha pessoais;</li>
                <li>Notificar imediatamente qualquer uso não autorizado da conta;</li>
                <li>Efetuar o pagamento das mensalidades nos vencimentos acordados.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Direito de Arrependimento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Em conformidade com o <strong>Art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990)</strong>, o Contratante tem direito ao arrependimento e cancelamento do serviço no prazo de <strong>7 (sete) dias corridos</strong> a contar da data de contratação, sem qualquer ônus, desde que a contratação tenha sido feita fora do estabelecimento comercial (internet).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Proteção de Dados Pessoais (LGPD)</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Em cumprimento à <strong>Lei Geral de Proteção de Dados Pessoais – LGPD (Lei nº 13.709/2018)</strong>, informamos:
              </p>
              <ul className="text-muted-foreground space-y-1.5 leading-relaxed list-disc list-inside">
                <li><strong>Dados coletados:</strong> nome, e-mail, telefone, endereço e dados de saúde do(s) idoso(s) cadastrado(s);</li>
                <li><strong>Finalidade:</strong> prestação dos serviços contratados, comunicação e melhoria da plataforma;</li>
                <li><strong>Base legal:</strong> execução de contrato e legítimo interesse (Art. 7º, V e IX da LGPD);</li>
                <li><strong>Compartilhamento:</strong> dados podem ser compartilhados com cuidadores vinculados ao plano;</li>
                <li><strong>Retenção:</strong> dados mantidos pelo prazo contratual e por até 5 anos após o encerramento, conforme obrigações legais;</li>
                <li><strong>Direitos do titular:</strong> acesso, correção, exclusão, portabilidade e revogação do consentimento, conforme Art. 18 da LGPD.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Dados Sensíveis de Saúde</h3>
              <p className="text-muted-foreground leading-relaxed">
                Informações de saúde dos beneficiários são consideradas <strong>dados sensíveis</strong> nos termos do Art. 11 da LGPD e serão tratadas com medidas de segurança reforçadas, sendo acessadas apenas por profissionais autorizados e estritamente necessários para a prestação do serviço.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Cancelamento e Rescisão</h3>
              <p className="text-muted-foreground leading-relaxed">
                O serviço poderá ser cancelado a qualquer momento pelo Contratante, com efeito ao final do ciclo de cobrança vigente. A empresa poderá rescindir o contrato em caso de descumprimento destes termos, uso indevido da plataforma ou inadimplência superior a 30 dias, sem prejuízo das medidas legais cabíveis.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Responsabilidade Limitada</h3>
              <p className="text-muted-foreground leading-relaxed">
                A plataforma atua como intermediadora entre clientes e cuidadores. A responsabilidade por danos decorrentes da prestação direta do serviço de cuidado é do cuidador contratado, não sendo a plataforma responsável por atos, omissões ou danos causados por terceiros, salvo nas hipóteses previstas no <strong>Código de Defesa do Consumidor</strong>.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Foro e Legislação Aplicável</h3>
              <p className="text-muted-foreground leading-relaxed">
                Este Termo é regido pelas leis da <strong>República Federativa do Brasil</strong>. Fica eleito o foro da comarca do domicílio do Contratante para dirimir quaisquer controvérsias, conforme Art. 101, I do Código de Defesa do Consumidor.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Contato com o Encarregado (DPO)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos como titular de dados ou esclarecer dúvidas sobre este Termo, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail: <strong>privacidade@cuidadofacil.com.br</strong>
              </p>
            </section>

            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Última atualização: fevereiro de 2026. Este documento foi elaborado em conformidade com a Lei 8.078/1990 (CDC), Lei 13.709/2018 (LGPD) e demais normas aplicáveis.
            </p>
          </div>
        </ScrollArea>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(!!v)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Li e aceito os <strong>Termos de Uso</strong> e compreendo as condições de contratação, incluindo o direito de arrependimento de 7 dias conforme o CDC.
            </Label>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(v) => setAcceptedPrivacy(!!v)}
              className="mt-0.5"
            />
            <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
              Consinto com o tratamento dos meus dados pessoais e dados de saúde dos beneficiários conforme a <strong>Política de Privacidade</strong> e a LGPD (Lei 13.709/2018).
            </Label>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!canProceed}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;
