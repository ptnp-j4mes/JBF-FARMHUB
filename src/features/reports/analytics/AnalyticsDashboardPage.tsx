'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsService } from './services/analytics.service';
import type { AnalyticsOverviewResponse } from './types';

const EMPTY_STATE: AnalyticsOverviewResponse = {
  lastUpdatedAt: new Date().toISOString(),
  totalStockHead: 0,
  totalDeathHead: 0,
  mortalityRatePct: 0,
  fcrAverage: 0,
  feedCostMonth: 0,
  farmCount: 0,
  monthlyTrends: [],
  farmPerformance: [],
};

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card sx={{ borderRadius: 10, height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboardPage() {
  const theme = useTheme();
  const [data, setData] = useState<AnalyticsOverviewResponse>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await analyticsService.getOverview();
        setData(response);
      } catch {
        setError('ไม่สามารถโหลดข้อมูลวิเคราะห์ได้ชั่วคราว');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const lastUpdatedText = useMemo(() => {
    const date = new Date(data.lastUpdatedAt);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
  }, [data.lastUpdatedAt]);

  const trendRows = useMemo(
    () =>
      data.monthlyTrends.map((row) => ({
        month: row.month,
        fcrAverage: row.fcrAverage,
        feedCost: row.feedCost,
      })),
    [data.monthlyTrends],
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          วิเคราะห์ข้อมูล
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          ข้อมูลล่าสุด {lastUpdatedText}
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        <Box>
          <MetricCard title="สต๊อกสุกรรวม" value={formatNumber(data.totalStockHead)} subtitle={`จาก ${data.farmCount} ฟาร์ม`} />
        </Box>
        <Box>
          <MetricCard title="อัตราสูญเสีย" value={`${formatNumber(data.mortalityRatePct, 2)}%`} subtitle={`สูญเสียรวม ${formatNumber(data.totalDeathHead)}`} />
        </Box>
        <Box>
          <MetricCard title="FCR เฉลี่ย" value={formatNumber(data.fcrAverage, 2)} subtitle="ภาพรวมเดือนปัจจุบัน" />
        </Box>
        <Box>
          <MetricCard title="ต้นทุนอาหารเดือนนี้" value={formatNumber(data.feedCostMonth, 2)} subtitle="บาท" />
        </Box>

        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <Card sx={{ borderRadius: 10, height: '100%', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                แนวโน้มรายเดือน
              </Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={trendRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="fcrAverage" stroke={theme.palette.primary.main} strokeWidth={3} name="FCR" />
                    <Line type="monotone" dataKey="feedCost" stroke={theme.palette.warning.main} strokeWidth={3} name="Feed Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <Card sx={{ borderRadius: 10, height: '100%', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                ประสิทธิภาพรายฟาร์ม
              </Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={data.farmPerformance.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="farmName" hide />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="mortalityRatePct" fill={alpha(theme.palette.error.main, 0.88)} name="Mortality %" />
                    <Bar dataKey="fcrAverage" fill={theme.palette.primary.main} name="FCR" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
