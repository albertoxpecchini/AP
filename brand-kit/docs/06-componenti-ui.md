# 06 · Componenti UI

In [`components/ui/`](../components/ui/) ci sono **32 file**: i componenti
**shadcn/ui** costruiti su **Radix UI** + **Tailwind v4**. Sono già stilizzati
sui token del tema (`theme.css`), quindi rispettano automaticamente chiaro/scuro.

## Cosa c'è

Accordion · Alert · Aspect Ratio · Avatar · Badge · **Button** · Calendar ·
**Card** · Checkbox · Collapsible · Context Menu · **Dialog** · Drawer · Form ·
**Input** · Label · Popover · Progress · Radio Group · **Select** · Separator ·
Sheet · Sidebar · Skeleton · Switch · **Table** · **Tabs** · Textarea · Toggle ·
**Tooltip** · più `use-mobile.ts` (hook) e `utils.ts` (la funzione `cn`).

## La funzione `cn`

Tutti i componenti usano `cn()` per comporre le classi (unisce `clsx` +
`tailwind-merge`):

```ts
// components/ui/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

Serve: `npm i clsx tailwind-merge`.

## Dipendenze

Ogni componente importa il primitivo Radix corrispondente (es. `button` usa
`@radix-ui/react-slot`, `dialog` usa `@radix-ui/react-dialog`, ecc.) e le icone da
`lucide-react`. La lista completa dei pacchetti Radix è in
[07-avvio-nuovo-sito.md](07-avvio-nuovo-sito.md). Puoi installarli tutti, oppure
solo quelli dei componenti che usi (se importi solo `Button`/`Card`/`Dialog`,
installi solo i loro Radix).

## Esempio

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader><CardTitle>Ciao azienda</CardTitle></CardHeader>
  <CardContent>
    <Button>Contattaci</Button>
  </CardContent>
</Card>
```

## Personalizzazione

Non modificare i componenti per cambiare i colori: cambia i **token** in
`theme.css` / `design-tokens.css`. I componenti leggono `--primary`, `--background`,
`--border`, `--ring`, `--radius`… e si adeguano da soli, anche al tema scuro.
