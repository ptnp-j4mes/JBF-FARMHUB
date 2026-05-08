'use client';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

export type CardSummaryItem = {
  title: string;
  value: number;
  subtitle: string;
  color: string;
  icon: ReactNode;
  status?: string;
  iconBg?: string;
  bar?: string;
};

interface CardSummaryProps {
  cards: CardSummaryItem[];
  onCardClick?: (card: CardSummaryItem) => void;
  selectedStatus?: string;
}

const CARD_WIDTH = 220;

const cardShellSx = {
  position: 'relative',
  overflow: 'hidden',
  px: 2,
  py: 1.8,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 10,
  bgcolor: 'background.paper',
} as const;

export default function CardSummary({
  cards,
  onCardClick,
  selectedStatus,
}: CardSummaryProps) {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 0.5,
        scrollbarGutter: 'stable',
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#2e7d32', borderRadius: 10},
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1.5,
          width: 'fit-content',
          minWidth: '100%',
          '& > *': { flex: `0 0 ${CARD_WIDTH}px` },
        }}
      >
        {cards.map((card) => {
          const isSelected = selectedStatus !== undefined && card.status !== undefined && selectedStatus === card.status;
          const iconBg = card.iconBg ?? card.color;
          const barColor = card.bar ?? card.color;

          return (
            <Box
              key={card.title}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
              sx={{
                ...cardShellSx,
                width: CARD_WIDTH,
                flex: `0 0 ${CARD_WIDTH}px`,
                cursor: onCardClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                border: isSelected ? '2px solid' : cardShellSx.border,
                borderColor: isSelected ? card.color : cardShellSx.borderColor,
                '&:hover': onCardClick
                  ? {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha(card.color, 0.1)}`,
                      borderColor: alpha(card.color, 0.5),
                    }
                  : undefined,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${alpha(iconBg, 0.82)} 0%, rgba(255,255,255,0) 55%)`,
                  pointerEvents: 'none',
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                    {card.value.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', color: '#2f3a37', fontWeight: 800, mt: 0.55 }}>
                    {card.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 10,
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(card.color, 0.15)}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.84rem', color: '#6b7c74' }}>
                {card.subtitle}
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  mt: 1.8,
                  width: 118,
                  height: 8,
                  borderRadius: 10,
                  bgcolor: '#e7ece8',
                }}
              >
                <Box sx={{ width: 58, height: '100%', bgcolor: barColor, borderRadius: 10}} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
