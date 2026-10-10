import { data } from "react-router";
import type { Route } from "./+types/theme";
import { isTheme, serializeTheme } from "~/lib/theme.server.ts";

export async function action({ request }: Route.ActionArgs) {
  const theme = (await request.formData()).get("theme");
  if (!isTheme(theme)) throw data({ error: "unknown theme" }, { status: 400 });
  return data({ theme }, { headers: { "Set-Cookie": await serializeTheme(theme) } });
}
