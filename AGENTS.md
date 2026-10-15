<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render the journal on a client-only home route; Three.js and browser-saved messages require client execution.
- Keep book geometry and turn animation separate from the accessible DOM pages so text remains crisp and input usable.
- Use AI Elements for composing and rendering messages, and keep all live and demo streams behind the same server chat boundary.
- Persist one conversation as complete AI SDK UI messages in browser storage; no account or cloud transcript is needed.
- Keep AI providers and request helpers server-only, with complete conversation history supplied on every call.
