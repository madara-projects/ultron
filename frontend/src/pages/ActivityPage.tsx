import { useFills, useOpenOrders } from "../api/client";
import { PageHeader } from "../components/layout/PageHeader";
import { SideBadge } from "../components/portfolio";
import { Callout, Card, EmptyState, ErrorState, LoadingRows } from "../components/ui/primitives";
import { Table, Td, Th, Tr } from "../components/ui/table";
import { formatDateTime, formatFullDateTime, formatMoney, formatPrice, formatQuantity } from "../lib/format";

const quoteOf = (symbol: string) => symbol.split("/")[1] ?? "";

function When({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatFullDateTime(iso)} className="text-ink-2">
      {formatDateTime(iso)}
    </time>
  );
}

function OpenOrders() {
  const orders = useOpenOrders();

  return (
    <Card title="Open orders" description="Orders resting on the exchange. Funds they hold show as locked.">
      {orders.isPending ? (
        <LoadingRows rows={2} label="Loading open orders" />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.data.length === 0 ? (
        <EmptyState title="No open orders" />
      ) : (
        <Table label="Open orders">
          <thead>
            <tr>
              <Th>Placed</Th>
              <Th>Pair</Th>
              <Th>Side</Th>
              <Th>Type</Th>
              <Th numeric>Price</Th>
              <Th numeric>Quantity</Th>
              <Th numeric>Filled</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {orders.data.data.map((order) => (
              <Tr key={order.order_id}>
                <Td>
                  <When iso={order.created_at} />
                </Td>
                <Td className="font-semibold text-ink">{order.symbol}</Td>
                <Td>
                  <SideBadge side={order.side} />
                </Td>
                <Td className="text-ink-2 capitalize">{order.order_type.replace("_", " ")}</Td>
                <Td numeric>{order.price ? formatPrice(order.price, quoteOf(order.symbol)) : "Market"}</Td>
                <Td numeric>{formatQuantity(order.quantity)}</Td>
                <Td numeric>{formatQuantity(order.filled_quantity)}</Td>
                <Td className="text-ink-2 capitalize">{order.status.replace("_", " ")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function Fills() {
  const fills = useFills(100);

  return (
    <Card title="Fills" description="Executed trades as reported by the exchange, newest first.">
      {fills.isPending ? (
        <LoadingRows rows={6} label="Loading fills" />
      ) : fills.isError ? (
        <ErrorState error={fills.error} onRetry={() => fills.refetch()} />
      ) : fills.data.data.length === 0 ? (
        <EmptyState title="No fills yet" />
      ) : (
        <Table label="Fills">
          <thead>
            <tr>
              <Th>Executed</Th>
              <Th>Pair</Th>
              <Th>Side</Th>
              <Th numeric>Price</Th>
              <Th numeric>Quantity</Th>
              <Th numeric>Value</Th>
              <Th numeric>Fee</Th>
            </tr>
          </thead>
          <tbody>
            {fills.data.data.map((fill) => (
              <Tr key={fill.fill_id}>
                <Td>
                  <When iso={fill.executed_at} />
                </Td>
                <Td className="font-semibold text-ink">{fill.symbol}</Td>
                <Td>
                  <SideBadge side={fill.side} />
                </Td>
                <Td numeric>{formatPrice(fill.price, quoteOf(fill.symbol))}</Td>
                <Td numeric>{formatQuantity(fill.quantity)}</Td>
                <Td numeric className="font-semibold text-ink">
                  {formatMoney(fill.value, quoteOf(fill.symbol))}
                </Td>
                <Td numeric className="text-ink-2">
                  {formatMoney(fill.fee, fill.fee_asset)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export function ActivityPage() {
  const fills = useFills(100);

  return (
    <>
      <PageHeader title="Activity" description="Open orders and executed trades." asOf={fills.data?.generated_at} />
      <div className="space-y-4">
        <Callout title="Profit and loss is not shown yet">
          Fills alone can't give an accurate P&L. It also needs deposits, withdrawals, and transfers, which arrive with the
          read-only Giottus connection.
        </Callout>
        <OpenOrders />
        <Fills />
      </div>
    </>
  );
}
