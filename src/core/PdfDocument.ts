/**
 * PDF Document wrapper using pdf.js for rendering.
 * 
 * IMPORTANT: This project uses pdfjs-dist v4.x, NOT v5.x!
 * 
 * pdf.js v5.x has a critical bug affecting multi-document scenarios:
 * The PagesMapper class uses static (global) state shared across ALL documents.
 * When loading multiple PDFs, the global `pagesNumber` gets overwritten by the
 * last loaded document, causing "Invalid page request" errors when accessing
 * pages from other documents.
 * 
 * Root cause in pdf.js v5:
 *   class PagesMapper {
 *     static #pagesNumber = 0;  // GLOBAL - shared by ALL documents!
 *   }
 * 
 * The validation in getPage() checks: pageNumber > this.#pagesMapper.pagesNumber
 * which fails because pagesNumber reflects the LAST loaded document, not the
 * document being queried.
 * 
 * Before upgrading to pdf.js v5+, verify the PagesMapper is instance-based.
 * See: https://github.com/nicokoenig/nicokoenig/pdf.js
 */
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, PageViewport, RenderTask } from "pdfjs-dist";

// Set the worker source globally - pdf.js will manage the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export interface RenderOptions {
  scale?: number;
  rotation?: number;
}

// Counter to give each document a unique ID for debugging
let docIdCounter = 0;

export class PdfDocument {
  private _doc: PDFDocumentProxy;
  private _data: Uint8Array;
  private _renderTasks: Map<number, RenderTask> = new Map();
  private _docId: number;

  private constructor(doc: PDFDocumentProxy, data: Uint8Array, docId: number) {
    this._doc = doc;
    this._data = data;
    this._docId = docId;
  }

  static async fromBytes(data: Uint8Array): Promise<PdfDocument> {
    const docId = ++docIdCounter;
    // Create a copy of the data to store for later use (e.g., pdf-lib merging)
    // We need a separate copy because pdf.js may transfer ownership of its buffer
    const storedData = new Uint8Array(data.length);
    storedData.set(data);
    
    // Create another copy for pdf.js to use (it may detach/transfer the buffer)
    const pdfJsData = new Uint8Array(data.length);
    pdfJsData.set(data);
    
    console.log(`[PdfDocument#${docId}] Loading document, data size: ${storedData.length}`);
    
    // Let pdf.js manage the worker - don't create custom workers
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfJsData,
    });
    
    const doc = await loadingTask.promise;
    console.log(`[PdfDocument#${docId}] Loaded with ${doc.numPages} pages`);
    
    return new PdfDocument(doc, storedData, docId);
  }

  get numPages(): number {
    return this._doc.numPages;
  }

  get proxy(): PDFDocumentProxy {
    return this._doc;
  }

  get data(): Uint8Array {
    return this._data;
  }

  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    console.log(`[PdfDocument#${this._docId}] getPage(${pageNumber}), numPages=${this._doc.numPages}`);
    return this._doc.getPage(pageNumber);
  }

  async renderPage(
    canvas: HTMLCanvasElement,
    pageNumber: number,
    options: RenderOptions = {}
  ): Promise<void> {
    const existingTask = this._renderTasks.get(pageNumber);
    if (existingTask) {
      existingTask.cancel();
      this._renderTasks.delete(pageNumber);
    }

    const page = await this.getPage(pageNumber);
    const scale = options.scale ?? 1;
    const rotation = options.rotation ?? 0;
    const viewport: PageViewport = page.getViewport({ scale, rotation });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) {
      throw new Error("Failed to get 2D canvas context");
    }
    const renderTask = page.render({ canvasContext, viewport });
    this._renderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "RenderingCancelledException") {
        return;
      }
      throw err;
    } finally {
      this._renderTasks.delete(pageNumber);
    }
  }

  destroy(): void {
    console.log(`[PdfDocument#${this._docId}] destroy()`);
    for (const task of this._renderTasks.values()) {
      task.cancel();
    }
    this._renderTasks.clear();
    this._doc.destroy();
  }
}
