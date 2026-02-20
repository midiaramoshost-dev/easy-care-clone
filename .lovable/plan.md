
## Tornar a Home Mais Suave e Acolhedora

O objetivo é suavizar o visual da página inicial, reduzindo o contraste agressivo, os gradientes intensos e os elementos muito saturados, criando uma experiência mais acolhedora e profissional — ideal para o público-alvo (famílias que cuidam de idosos).

### O que será ajustado

**1. Paleta de cores — `src/index.css`**
- Suavizar a cor primária de um azul elétrico intenso (`199 89% 48%`) para um azul mais sereno (`199 70% 52%`)
- Suavizar o accent de um roxo vibrante (`262 83% 58%`) para um tom mais suave (`248 60% 62%`)
- Ajustar o fundo (`--background`) para um branco levemente quente (`30 20% 98%`) em vez de frio/acinzentado
- Reduzir a intensidade de `--primary-light` para tons mais pastel

**2. Hero Slideshow — `src/components/HeroSlideshow.tsx`**
- Reduzir o overlay escuro nas imagens de `from-foreground/85` para `from-foreground/70 via-foreground/55` — deixando as fotos respirarem mais
- Suavizar as sombras dos botões (remover `shadow-primary/25` intenso)
- Tornar o badge mais translúcido e delicado

**3. Stats Section — `src/components/NewStatsSection.tsx`**
- Trocar os ícones com gradiente total por ícones com fundo pastel suave (`bg-primary/10`) e ícone colorido
- Remover `group-hover:scale-110` (animação muito brusca) por transição mais sutil

**4. Features Section — `src/components/NewFeaturesSection.tsx`**
- Suavizar os ícones dos cards de gradiente cheio para fundo pastel com ícone colorido
- Reduzir `hover:shadow-xl` para `hover:shadow-md` com sombra mais suave
- Aumentar o espaçamento interno dos cards para dar mais "respiro"

**5. Technology Section — `src/components/TechnologySection.tsx`**
- Trocar os checkmarks de gradiente cheio por círculos pastel com check colorido
- Suavizar a sombra da imagem (`shadow-2xl` → `shadow-lg`)

**6. Testimonials Section — `src/components/NewTestimonialsSection.tsx`**
- Trocar os avatares de gradiente cheio por fundo pastel suave
- Suavizar `hover:shadow-xl` para `hover:shadow-md`

**7. CTA Section — `src/components/NewCTASection.tsx`**
- Trocar o gradiente de fundo sólido e saturado (`from-primary via-primary to-accent`) por uma versão mais suave com opacidade reduzida sobre fundo claro, ou um fundo escuro mais neutro e elegante (`from-slate-800 to-slate-900`) com detalhes em cor primária suave

**8. Header — `src/components/Header.tsx`**
- Adicionar leve blur e fundo branco com mais opacidade (já tem glass-effect, apenas reforçar)

**9. Footer — `src/components/Footer.tsx`**
- Suavizar de fundo completamente escuro para um tom mais neutro/azul-escuro (`from-slate-900 to-slate-800`) para não ser tão pesado visualmente

### Resultado esperado

A home ficará com visual mais:
- **Acolhedor**: tons mais suaves remetem à tranquilidade e cuidado
- **Profissional**: sem excessos de gradientes saturados
- **Acessível**: melhor contraste confortável para o público sênior/familiar
- **Coerente**: identidade visual consistente com o propósito emocional da marca
