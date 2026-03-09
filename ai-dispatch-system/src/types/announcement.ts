export interface AnnouncementGeneratePayload {
  reportDate: string;
  includeFullText?: boolean;
  includeLineText?: boolean;
  includeShortText?: boolean;
  includeVoiceText?: boolean;
  includeManagerText?: boolean;
}

export interface AnnouncementOutput {
  id?: number;
  reportDate: string;
  fullText: string | null;
  lineText: string | null;
  shortText: string | null;
  voiceText: string | null;
  managerText: string | null;
  finalConfirmText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementRegeneratePayload {
  reportDate: string;
  versionType: 'full' | 'line' | 'short' | 'voice' | 'manager';
}
