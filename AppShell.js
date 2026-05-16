import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Chip, Divider, Tooltip,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import InputIcon from '@mui/icons-material/Input';
import VerifiedIcon from '@mui/icons-material/Verified';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { tokens } from '../theme/theme';

/**
 * AppShell — replaces the original plain-text Navbar.
 * --------------------------------------------------------------------------
 * Original:  <nav><Link>Home</Link>| &nbsp;<Link>...</Link></nav>
 * Now:       a fixed, branded sidebar with grouped navigation, active
 *            highlighting, and a top context bar — the standard layout for
 *            enterprise data tooling (think Fabric / Linear / Vercel).
 */

const SIDEBAR_W = 248;

const NAV = [
  {
    section: 'Pipeline Stages',
    items: [
      { to: '/sourcetolanding', label: 'Landing Tasks', sub: 'Source → Landing', icon: <InputIcon /> },
      { to: '/sourcetovalidated', label: 'Bronze Tasks', sub: 'Bronze → Validated', icon: <VerifiedIcon /> },
      { to: '/validatedtoenriched', label: 'Silver Tasks', sub: 'Validated → Enriched', icon: <AutoAwesomeIcon /> },
    ],
  },
  {
    section: 'Design',
    items: [
      { to: '/workflow', label: 'Pipeline Workflow', sub: 'Orchestration DAG', icon: <AccountTreeIcon /> },
    ],
  },
];

function SidebarItem({ item }) {
  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      sx={{
        borderRadius: 1.5,
        mx: 1,
        my: 0.25,
        px: 1.5,
        py: 1,
        color: tokens.color.slate[500],
        '& .MuiListItemIcon-root': { color: tokens.color.slate[500], minWidth: 36 },
        '&.active': {
          backgroundColor: tokens.color.brand[50],
          color: tokens.color.brand[700],
          fontWeight: 700,
          '& .MuiListItemIcon-root': { color: tokens.color.brand[600] },
        },
        '&:hover': { backgroundColor: tokens.color.slate[50] },
      }}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText
        primary={item.label}
        secondary={item.sub}
        primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600 }}
        secondaryTypographyProps={{ fontSize: '0.7rem' }}
      />
    </ListItemButton>
  );
}

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const current = NAV.flatMap((g) => g.items).find((i) => i.to === pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_W,
            boxSizing: 'border-box',
            borderRight: `1px solid ${tokens.color.slate[100]}`,
            backgroundColor: tokens.color.slate[0],
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 34, height: 34, borderRadius: 2,
              background: `linear-gradient(135deg, ${tokens.color.brand[500]}, ${tokens.color.brand[700]})`,
              display: 'grid', placeItems: 'center', color: '#fff',
              boxShadow: tokens.shadow.sm,
            }}
          >
            <LayersIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>
              ConfigBuilder
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: tokens.color.slate[500] }}>
              Microsoft Fabric
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: tokens.color.slate[100] }} />

        {/* Navigation */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
          {NAV.map((group) => (
            <Box key={group.section} sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  px: 2.5, pt: 1.5, pb: 0.5,
                  fontSize: '0.66rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: tokens.color.slate[300],
                }}
              >
                {group.section}
              </Typography>
              <List disablePadding>
                {group.items.map((item) => (
                  <SidebarItem key={item.to} item={item} />
                ))}
              </List>
            </Box>
          ))}
        </Box>

        {/* User footer */}
        <Divider sx={{ borderColor: tokens.color.slate[100] }} />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.color.brand[100], color: tokens.color.brand[700], fontSize: '0.8rem', fontWeight: 700 }}>
            DS
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, noWrap: true }}>
              Data Steward
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: tokens.color.slate[500] }}>
              Signed in via MSAL
            </Typography>
          </Box>
          <Tooltip title="Connected">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.color.success }} />
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          sx={{
            height: 60, px: 4, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: `1px solid ${tokens.color.slate[100]}`,
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            position: 'sticky', top: 0, zIndex: 10,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {current?.label || 'Dashboard'}
          </Typography>
          {current && (
            <Chip
              size="small"
              label={current.sub}
              sx={{
                bgcolor: tokens.color.slate[50],
                color: tokens.color.slate[500],
                border: `1px solid ${tokens.color.slate[100]}`,
                fontSize: '0.68rem',
              }}
            />
          )}
        </Box>
        <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
