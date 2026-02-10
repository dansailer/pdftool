import { PdfDocument } from "./PdfDocument";

/**
 * Represents a reference to a specific page within a PDF document.
 * Used to track pages across multiple documents and their transformations.
 */
export interface PageReference {
  /** Unique identifier for this page reference */
  id: string;
  /** The source PDF document */
  document: PdfDocument;
  /** Original page number in the source document (1-based) */
  sourcePageNumber: number;
  /** Rotation applied to this page (0, 90, 180, 270) */
  rotation: number;
  /** Original filename for display purposes */
  fileName: string;
}

let pageIdCounter = 0;

/**
 * Creates a new PageReference with a unique ID
 */
export function createPageReference(
  document: PdfDocument,
  sourcePageNumber: number,
  fileName: string
): PageReference {
  return {
    id: `page-${++pageIdCounter}`,
    document,
    sourcePageNumber,
    rotation: 0,
    fileName,
  };
}
