import { SelectedFile } from '../types';

let _idCounter = 0;

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sf-${Date.now()}-${++_idCounter}`;
}


export function fileToSelectedFile(file: File): SelectedFile {
  return {
    id: newId(),
    url: URL.createObjectURL(file),
    file,
    type: 'image',
  };
}
