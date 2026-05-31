import React from 'react';
import { Card, CardContent, Box, Typography, alpha, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#6366f1', trend, tooltip }) {
  const valueNode = (
    <Typography
      variant="h4"
      sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mb: 0.5, cursor: tooltip ? 'help' : 'default' }}
    >
      {value}
    </Typography>
  );

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
        },
      }}
    >
      {/* Gradient accent bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
        }}
      />
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1, display: 'block' }}
            >
              {title}
            </Typography>
            {tooltip ? (
              <Tooltip title={tooltip} arrow placement="top">
                {valueNode}
              </Tooltip>
            ) : valueNode}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {trend && <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.05)})`,
                color: color,
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
