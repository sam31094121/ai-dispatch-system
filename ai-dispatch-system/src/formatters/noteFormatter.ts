/** noteFormatter — ReportNote → NoteCardVM */
import type { ReportNote, NoteCardVM } from '../types/dispatchReport';

const NOTE_BADGE_COLORS: Record<string, string> = {
  'employment-status': '#f59e0b',
  'audit-note':        '#00d4ff',
  'calc-note':         '#c084fc',
  'general':           '#94a3b8',
};

export function toNoteCardVM(note: ReportNote): NoteCardVM {
  return {
    title:           note.title,
    content:         note.content,
    affectsReport:   note.affectsReport,
    affectsDispatch: note.affectsDispatch,
    badgeColor:      NOTE_BADGE_COLORS[note.type] ?? '#94a3b8',
    displayOrder:    note.displayOrder,
  };
}

export function toNoteCardVMs(notes: ReportNote[]): NoteCardVM[] {
  return [...notes]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toNoteCardVM);
}
