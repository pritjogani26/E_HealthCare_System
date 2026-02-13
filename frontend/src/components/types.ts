import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  section?: string;
  subitems?: SubMenuItem[];
}

export interface SubMenuItem {
  label: string;
  badge?: string;
}

export interface SupportMenuItem {
  icon: LucideIcon;
  label: string;
  badge: string;
  badgeColor: string;
  section?: string;
  subitems?: { label: string; route: string }[];
  route?: string;
}

export interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  color: string;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'create' | 'update' | 'delete' | 'report';
}

export interface Product {
  id: number;
  name: string;
  sales: number;
  revenue: string;
  trend: 'up' | 'down';
}

export interface ExpandedSections {
  [key: string]: boolean;
}