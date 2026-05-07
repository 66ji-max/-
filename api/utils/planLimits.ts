export interface PlanLimits {
  dailyAiLimit: number | null;
  allowAttachment: boolean;
  allowMultimodal: boolean;
  allowEci: boolean;
  allowAdvancedTools: boolean;
  supportLevel: string;
}

export const planLimits: Record<string, PlanLimits> = {
  free: {
    dailyAiLimit: 10,
    allowAttachment: false,
    allowMultimodal: false,
    allowEci: false,
    allowAdvancedTools: false,
    supportLevel: 'basic'
  },
  startup: {
    dailyAiLimit: 50,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: false,
    allowAdvancedTools: true,
    supportLevel: 'email'
  },
  pro: {
    dailyAiLimit: null,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: true,
    allowAdvancedTools: true,
    supportLevel: 'priority'
  }
};
