import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, Skeleton, Card,
} from '@mui/material';

export default function DataTable({ columns, rows, loading, emptyMessage = 'No data found', renderRow }) {
  if (loading) {
    return (
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={52}
              sx={{ borderRadius: 2, mb: 1, opacity: 1 - i * 0.15 }}
            />
          ))}
        </Box>
      </Card>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Card>
        <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: 32 }}>📭</Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Get started by adding your first record
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ width: col.width }}>
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => renderRow(row, index))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
