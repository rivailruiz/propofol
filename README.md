# TCI Simulator — Propofol (educacional)

Protótipo web mobile-first (landscape) de uma bomba de infusão alvo-controlada (TCI) de propofol, para fins **educacionais e de demonstração**.

> **SIMULADOR — NÃO UTILIZAR EM PACIENTES.** Não controla equipamentos reais, não recomenda doses para pacientes reais e não possui integração com hardware.

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + Recharts + Lucide React + Vitest.

## Modelo farmacocinético

A simulação de Cp/Ce usa o modelo publicado de **Schnider** para propofol em
adultos, com as covariáveis do "paciente virtual" (idade, peso, altura, sexo)
configuráveis nas Configurações:

- Schnider TW, Minto CF, Gambus PL, et al. "The influence of method of
  administration and covariates on the pharmacokinetics of propofol in
  adult volunteers." *Anesthesiology*. 1998;88(5):1170-1182. (V1–V3, Cl1–Cl3)
- Schnider TW, Minto CF, Shafer SL, et al. "The influence of age on
  propofol pharmacodynamics." *Anesthesiology*. 1999;90(6):1502-1516.
  (artigo original do ke0)
- Barakat AR, Sutcliffe N, Schwab M. "Effect site concentration during
  propofol TCI sedation: a comparison of sedation score with two
  pharmacokinetic models." *Anaesthesia*. 2007;62(7):661-666.
  (ke0 = 0.459 min⁻¹, T½ = 1.5 min, valor usado aqui)

Ver [src/lib/pk.ts](src/lib/pk.ts) para a implementação e citações completas,
e [src/lib/pk.test.ts](src/lib/pk.test.ts) para os testes que conferem os
coeficientes derivados contra os valores publicados. Mesmo assim, isto
continua sendo um simulador educacional — não é um dispositivo médico e não
deve orientar decisões clínicas reais.

> **Nota sobre o Barakat et al. (2007):** esse estudo clínico comparou o
> modelo de Marsh (plasma) com o de Schnider (local de efeito) em 40
> pacientes reais e encontrou que as previsões de concentração no local de
> efeito do **Marsh** correlacionaram melhor com a sedação clínica observada
> (escore OAAS, índice BIS) do que as do Schnider — em ambos os grupos, mesmo
> quando a bomba era controlada pelo Schnider. Isso não muda a implementação
> atual (que segue Schnider), mas é uma limitação conhecida do modelo
> reconhecida na literatura.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra em um celular (ou emule no DevTools) em orientação horizontal — a interface é otimizada para landscape mobile (ex.: 667×375, 740×360, 844×390, 932×430) e também funciona em tablet/desktop.

## Testes

```bash
npm test
```

## Build / Deploy (GitHub Pages)

```bash
npm run deploy
```

Publica o build estático na branch `gh-pages`.
