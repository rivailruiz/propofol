# TCI Simulator — Propofol (educacional)

Protótipo web mobile-first (landscape) de uma bomba de infusão alvo-controlada (TCI) de propofol, para fins **educacionais e de demonstração**.

> **SIMULADOR — NÃO UTILIZAR EM PACIENTES.** Não controla equipamentos reais, não recomenda doses para pacientes reais e não possui integração com hardware.

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + Recharts + Lucide React + Vitest.

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
