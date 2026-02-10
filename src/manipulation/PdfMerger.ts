import { invoke } from "@tauri-apps/api/core";
import { DocumentManager } from "../core/DocumentManager";
import { PageReference } from "../core/PageReference";

/**
 * PDF document metadata for search and identification.
 */
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

/**
 * Page specification for the Rust merge command.
 */
interface PageSpec {
  pdf_data_base64: string;
  page_number: number;
  rotation: number;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cache for base64 encoded PDF data to avoid re-encoding
 */
const base64Cache = new WeakMap<Uint8Array, string>();

function getBase64(data: Uint8Array): string {
  let cached = base64Cache.get(data);
  if (!cached) {
    cached = uint8ArrayToBase64(data);
    base64Cache.set(data, cached);
  }
  return cached;
}

/**
 * Utility for merging and exporting PDF documents using Rust/lopdf.
 * Uses native Rust backend for efficient merging with metadata support.
 */
export class PdfMerger {
  /**
   * Merge all pages from the DocumentManager into a single PDF.
   * Uses Rust backend (lopdf) for efficient merging with pruning of unused objects.
   *
   * @param docManager - The document manager containing pages to merge
   * @param metadata - Optional metadata to embed in the PDF (title, author, subject, keywords)
   */
  static async merge(
    docManager: DocumentManager,
    metadata?: PdfMetadata
  ): Promise<Uint8Array> {
    const pageRefs = docManager.getPages();
    if (pageRefs.length === 0) {
      throw new Error("No pages to merge");
    }

    // Build page specifications in order
    const pages: PageSpec[] = pageRefs.map((pageRef) => ({
      pdf_data_base64: getBase64(pageRef.document.data),
      page_number: pageRef.sourcePageNumber,
      rotation: pageRef.rotation,
    }));

    // Call Rust backend to merge PDFs with metadata
    const resultBase64 = await invoke<string>("merge_pdfs", {
      pages,
      metadata: metadata ?? null,
    });

    return base64ToUint8Array(resultBase64);
  }

  /**
   * Export a single page to a new PDF.
   *
   * @param pageRef - The page reference to export
   * @param metadata - Optional metadata to embed in the PDF
   */
  static async exportPage(
    pageRef: PageReference,
    metadata?: PdfMetadata
  ): Promise<Uint8Array> {
    const pages: PageSpec[] = [
      {
        pdf_data_base64: getBase64(pageRef.document.data),
        page_number: pageRef.sourcePageNumber,
        rotation: pageRef.rotation,
      },
    ];

    const resultBase64 = await invoke<string>("merge_pdfs", {
      pages,
      metadata: metadata ?? null,
    });
    return base64ToUint8Array(resultBase64);
  }

  /**
   * Export selected pages to a new PDF.
   *
   * @param pageRefs - The page references to export
   * @param metadata - Optional metadata to embed in the PDF
   */
  static async exportPages(
    pageRefs: PageReference[],
    metadata?: PdfMetadata
  ): Promise<Uint8Array> {
    if (pageRefs.length === 0) {
      throw new Error("No pages to export");
    }

    const pages: PageSpec[] = pageRefs.map((pageRef) => ({
      pdf_data_base64: getBase64(pageRef.document.data),
      page_number: pageRef.sourcePageNumber,
      rotation: pageRef.rotation,
    }));

    const resultBase64 = await invoke<string>("merge_pdfs", {
      pages,
      metadata: metadata ?? null,
    });
    return base64ToUint8Array(resultBase64);
  }
}
