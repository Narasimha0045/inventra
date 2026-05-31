import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme,
  Divider, alpha, Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import InventoryIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded';
import MenuIcon from '@mui/icons-material/MenuRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const navItems = [
  { label: 'Dashboard', path: '/', icon: DashboardIcon },
  { label: 'Products', path: '/products', icon: InventoryIcon },
  { label: 'Customers', path: '/customers', icon: PeopleIcon },
  { label: 'Orders', path: '/orders', icon: ShoppingCartIcon },
];

export default function MainLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawerWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          px: collapsed ? 1.5 : 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontSize: '1rem',
                fontWeight: 800,
              }}
            >
              I
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                Inventra
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                Management System
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              fontSize: '1rem',
              fontWeight: 800,
            }}
          >
            I
          </Avatar>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{
              color: 'text.secondary',
              display: collapsed ? 'none' : 'flex',
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* Navigation */}
      <List sx={{ px: 0.5, py: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mb: 0.5,
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                px: collapsed && !isMobile ? 2 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed && !isMobile ? 0 : 40,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  justifyContent: 'center',
                }}
              >
                <item.icon sx={{ fontSize: 22 }} />
              </ListItemIcon>
              {(!collapsed || isMobile) && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center' }}>
            Inventra v1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              transition: 'width 0.2s ease',
              borderRight: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: 'width 0.2s ease',
        }}
      >
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: alpha('#f8f9fb', 0.8),
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #f1f5f9',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }}>
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            {!isMobile && collapsed && (
              <IconButton
                onClick={() => setCollapsed(false)}
                sx={{ mr: 2, color: 'text.secondary' }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              A
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
