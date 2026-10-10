import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("search.json", "routes/search-data.ts"),
  route("theme", "routes/theme.ts"),
  route(":slug", "routes/module.tsx", [
    index("routes/module.skills.tsx"),
    route("toolkit", "routes/module.toolkit.tsx"),
    route("quiz", "routes/module.quiz.tsx"),
  ]),
] satisfies RouteConfig;
