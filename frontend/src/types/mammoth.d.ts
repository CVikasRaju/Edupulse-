// Minimal ambient types for `mammoth` (no @types/mammoth published on npm).
declare module "mammoth" {
  export interface ExtractResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: {
    buffer: ArrayBuffer | Buffer | Uint8Array;
  }): Promise<ExtractResult>;

  export function convertToHtml(input: {
    buffer: ArrayBuffer | Buffer | Uint8Array;
  }): Promise<{ value: string; messages: unknown[] }>;

  const mammoth: {
    extractRawText: typeof extractRawText;
    convertToHtml: typeof convertToHtml;
  };

  export default mammoth;
}
