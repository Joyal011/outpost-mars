<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Game rules live in `src/game/sim.ts` as pure TypeScript (no React/DOM); UI in `src/components/game/` only renders state and calls `takeAction`/`resolveEvent`. Why: rules stay unit-testable in `src/game/sim.test.ts`.
- Real-world numbers and facts live in `src/game/data.ts` with a source string; the `/science` page renders them. Why: every number shown to players stays traceable.
- Live NASA data is fetched client-side with a fallback to archived data, and the UI labels which one is in use. Why: never present static data as live.
- Ambient crew motion stays in presentation CSS with reduced-motion support and never advances the simulation. Why: background activity must not change turn-based game rules.
- Mission progress is saved as the whole `GameState` in localStorage (versioned via `SAVE_VERSION`/`isSave`), loaded only after hydration in `Game.tsx`. Why: a refresh keeps the mission without a backend, and old saves are safely ignored.
