# Speedrunner HQ

Interní command center pro FXSpeedrunner: Sales co-pilot, Asistent (chat), Post creator — sdílenej brand brain. Next.js + Anthropic API. Postaveno pro jednoho uživatele (tebe).

## Jak to spustit lokálně

1. **Node 18+** (`node -v`).
2. V téhle složce:
   ```bash
   npm install
   ```
3. Zkopíruj `.env.local.example` na `.env.local` a vyplň:
   ```
   ANTHROPIC_API_KEY=sk-ant-...      # z https://console.anthropic.com
   APP_PASSWORD=neco-tajneho         # heslo, kterým appku zamkneš
   ```
4. ```bash
   npm run dev
   ```
   → otevři http://localhost:3000 , zadej heslo, jeď.

## Deploy na Vercel (vlastní URL, vždy zapnutý)

1. Pushni složku na GitHub (nový repo).
2. https://vercel.com → **Add New → Project** → import ten repo.
3. V **Environment Variables** přidej `ANTHROPIC_API_KEY` a `APP_PASSWORD` (stejný jako v `.env.local`).
4. **Deploy.** Dostaneš `https://...vercel.app`. Hotovo.

## Jak to funguje (architektura)

- **`app/page.js`** — celej dashboard (frontend, běží v prohlížeči).
- **`app/api/claude/route.js`** — backend proxy. Drží API klíč na serveru (nikdy v prohlížeči) a kontroluje heslo. Frontend volá `/api/claude`, ne Anthropic přímo.
- **Brand brain** se ukládá do `localStorage` prohlížeče (per zařízení). Chceš sync přes víc zařízení + ukládání draftů/historie? → Supabase (jako u Subko), to je další krok.

## Náklady (čti)

Tady platíš **svým** Anthropic API klíčem za každý volání (na rozdíl od náhledu v Claude chatu, co byl zdarma). Pro tenhle typ použití jsou to drobný, ale reálný. Doporučení:
- V Anthropic konzoli si nastav **spend limit / budget alert**.
- Model přepneš v `app/api/claude/route.js` (`claude-haiku-4-5-20251001` = nejlevnější /default/, `claude-sonnet-4-6` = balanc, `claude-opus-4-8` = nejlepší). Aktuální názvy ověř na https://docs.claude.com .
- `APP_PASSWORD` drž nastavený, ať ti na backendu nikdo cizí neprojede kredit.

## Další kroky (až to budeš pár dní používat)

1. Persistnout drafty + historii chatu (Supabase).
2. Reálný integrace (Discord/IG) — až bude jádro osahaný.
3. Z tohohle se dá vyrobit B2B verze pro jiný trading komunity (multi-tenant).
