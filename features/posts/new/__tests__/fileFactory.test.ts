import { fileToSelectedFile, newId } from '../services/fileFactory';
import type { SelectedFile } from '../types';

const jpg = (name = 'photo.jpg') => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:fake-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('newId', () => {
  it('returns a non-empty string', () => {
    expect(newId().length).toBeGreaterThan(0);
  });

  it('returns unique values on each call', () => {
    const a = newId();
    const b = newId();
    expect(a).not.toBe(b);
  });
});

describe('fileToSelectedFile', () => {
  it('returns a SelectedFile with a unique id', () => {
    const a = fileToSelectedFile(jpg());
    const b = fileToSelectedFile(jpg());
    expect(a.id).not.toBe(b.id);
  });

  it('calls URL.createObjectURL and stores the result as url', () => {
    const file = jpg();
    const result = fileToSelectedFile(file);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(result.url).toBe('blob:fake-url');
  });

  it('preserves the original File reference', () => {
    const file = jpg();
    expect(fileToSelectedFile(file).file).toBe(file);
  });

  it('conforms to the SelectedFile shape', () => {
    const result: SelectedFile = fileToSelectedFile(jpg());
    expect(result).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
      file: expect.any(File),
      type: expect.any(String),
    });
  });
});
