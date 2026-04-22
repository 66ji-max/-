export interface NavItem {
  label: string;
  href: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export type Page = 'home' | 'ai-saas' | 'ecommerce' | 'news' | 'governance' | 'about' | 'join' | 'login' | 'register' | 'dashboard' | 'admin';

export type Language = 'zh' | 'en';