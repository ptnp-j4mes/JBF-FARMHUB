'use client';

import CardSummary, { type CardSummaryItem } from '@/design-system/components/molecules/CardSummary/CardSummary';

type SummaryCard = CardSummaryItem & {
  status: string;
};

interface Props {
  cards: SummaryCard[];
  onCardClick?: (status: string) => void;
  selectedStatus?: string;
}

export default function StockReplenishmentSummaryCards({
  cards,
  onCardClick,
  selectedStatus,
}: Props) {
  return (
    <CardSummary
      cards={cards}
      selectedStatus={selectedStatus}
      onCardClick={onCardClick ? (card) => onCardClick(card.status ?? card.title) : undefined}
    />
  );
}
