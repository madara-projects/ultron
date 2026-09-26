import { PageHeader } from "../components/layout/PageHeader";
import { ResearchIcon } from "../components/ui/icons";
import { Badge, Card } from "../components/ui/primitives";

const PREREQUISITES = [
  "Crypto candle history for the pairs you trade, covering 24/7 sessions.",
  "A strategy evaluated out of sample, with Giottus fees, GST, and slippage included.",
  "A paper-trading record comparing its calls with what happened next.",
  "Your limits: risk per idea, maximum allocation per asset, and maximum order value.",
];

const EACH_IDEA_SHOWS = [
  "Pair, direction, and the evidence for and against it",
  "Uncertainty, and the price that would prove it wrong",
  "Suggested amount from available balance and your risk limit",
  "Estimated fees, exchange minimums, and data timestamp",
];

export function ResearchPage() {
  return (
    <>
      <PageHeader
        title="Research"
        description="Trade ideas for you to review. Ultron never places orders."
        refreshable={false}
      />
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-80 lg:shrink-0">
            <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-line">
              <ResearchIcon className="size-5" />
            </span>
            <h2 className="mt-4 flex items-center gap-2 text-lg font-bold text-ink">
              Recommendations are off <Badge>Not enabled</Badge>
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              The old stock rules (moving averages and RSI) have not been validated for crypto. Ultron will show no trade
              ideas until a strategy has earned it.
            </p>
          </div>
          <div className="grid flex-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Needed before turning on</h3>
              <ol className="mt-3 space-y-2.5 text-sm text-ink-2">
                {PREREQUISITES.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="num grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-ink-2 ring-1 ring-line">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Each idea will show</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-2">
                {EACH_IDEA_SHOWS.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
