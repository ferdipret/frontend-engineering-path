import { useEffect, useState } from "react";
import { data, useFetcher, useLocation } from "react-router";
import type { Route } from "./+types/module.quiz";
import { loadModule } from "~/lib/content.server.ts";
import { addQuizResult, getQuizResults } from "~/lib/db.server.ts";
import { inline, render } from "~/lib/markdown.ts";
import { pct } from "~/lib/stats.ts";
import type { TocHandle } from "~/components/Toc.tsx";

export function loader({ params }: Route.LoaderArgs) {
  const mod = loadModule(params.slug);
  if (!mod) throw new Response("Not found", { status: 404 });
  const summary = getQuizResults()[mod.slug] ?? null;
  return {
    questions: mod.quiz.map((q) => ({
      promptHtml: render(q.prompt),
      options: q.options.map((o) => ({ html: inline(o.text), correct: o.correct })),
      answerHtml: render(q.answer),
    })),
    history: summary && { attempts: summary.attempts, best: pct(summary.best.score, summary.best.total), last: pct(summary.last.score, summary.last.total) },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const score = Number(form.get("score"));
  const total = Number(form.get("total"));
  const mod = loadModule(params.slug);
  const valid = Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total;
  if (!mod || !valid) throw data({ error: "bad result" }, { status: 400 });
  addQuizResult(mod.slug, score, total);
  return { saved: true };
}

export const handle: TocHandle = {
  toc: (data) => ({
    compact: true,
    entries: (data as Awaited<ReturnType<typeof loader>>).questions.map((_, i) => ({ id: `q-${i + 1}`, label: `${i + 1}` })),
  }),
};

export default function Quiz({ loaderData }: Route.ComponentProps) {
  const { questions, history } = loaderData;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [saved, setSaved] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  const mc = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.options.length);
  const answered = mc.filter(({ i }) => answers[i] !== undefined);
  const correct = answered.filter(({ q, i }) => q.options[answers[i]!]?.correct).length;
  const finished = mc.length > 0 && answered.length === mc.length;

  // The result is saved once, when the last multiple-choice question is answered.
  useEffect(() => {
    if (finished && !saved) {
      setSaved(true);
      fetcher.submit({ score: String(correct), total: String(mc.length) }, { method: "post" });
    }
  }, [finished, saved, correct, mc.length, fetcher]);

  const reset = () => {
    setAnswers({});
    setRevealed(new Set());
    setSaved(false);
  };

  if (!questions.length) return <p className="empty">No practice test written for this module yet.</p>;

  return (
    <>
      <div className="quiz-bar">
        <span>
          {finished ? (
            <>
              <strong>
                Final score: {correct}/{mc.length} ({pct(correct, mc.length)}%)
              </strong>{" "}
              · {fetcher.state !== "idle" ? "saving…" : "saved"}
            </>
          ) : (
            <>
              <strong>{correct} correct</strong> · {answered.length}/{mc.length} answered
            </>
          )}
        </span>
        <span className="history">
          {history ? `Best ${history.best}% · last ${history.last}% · ${history.attempts} attempt${history.attempts === 1 ? "" : "s"}` : "No attempts saved yet"}
        </span>
        <button className="btn" type="button" onClick={reset}>
          {answered.length ? "Start over" : "Reset"}
        </button>
      </div>
      <p className="summary" style={{ marginTop: 14 }}>
        Multiple-choice questions are scored and the result is saved when you finish them all. Open questions show a model answer to
        compare against your own.
      </p>
      {questions.map((q, i) => {
        const chosen = answers[i];
        const isAnswered = chosen !== undefined;
        const right = isAnswered && q.options[chosen]?.correct;
        return (
          <article className="question" id={`q-${i + 1}`} key={i}>
            <div className="num">
              Question {i + 1}
              {q.options.length ? "" : " · open"}
            </div>
            <div className="md" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
            {q.options.length ? (
              <>
                <div className="options">
                  {q.options.map((o, j) => {
                    const state = !isAnswered ? "" : o.correct ? " correct" : j === chosen ? " wrong" : "";
                    return (
                      <button
                        key={j}
                        className={`opt${state}`}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => setAnswers((prev) => ({ ...prev, [i]: j }))}
                        dangerouslySetInnerHTML={{ __html: o.html }}
                      />
                    );
                  })}
                </div>
                {isAnswered && (
                  <>
                    <div className={`verdict ${right ? "good" : "bad"}`}>{right ? "Correct" : "Not quite"}</div>
                    <div className="explain md" dangerouslySetInnerHTML={{ __html: q.answerHtml }} />
                  </>
                )}
              </>
            ) : revealed.has(i) ? (
              <div className="explain md">
                <h4>Model answer</h4>
                <div dangerouslySetInnerHTML={{ __html: q.answerHtml }} />
              </div>
            ) : (
              <button className="btn" type="button" onClick={() => setRevealed((prev) => new Set(prev).add(i))}>
                Show model answer
              </button>
            )}
          </article>
        );
      })}
    </>
  );
}
