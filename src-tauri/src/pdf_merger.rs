use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::Local;
use lopdf::{dictionary, Document, Object, ObjectId, StringFormat};
use serde::Deserialize;
use std::collections::BTreeMap;
use std::io::Cursor;

/// Represents a page to be included in the merged PDF
#[derive(Debug, Deserialize)]
pub struct PageSpec {
    /// Base64-encoded PDF bytes
    pub pdf_data_base64: String,
    /// 1-based page number in the source PDF
    pub page_number: u32,
    /// Rotation to apply (0, 90, 180, 270)
    pub rotation: i32,
}

/// PDF document metadata
#[derive(Debug, Deserialize)]
pub struct PdfMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Option<String>,
}

/// Generate a PDF date string in the format D:YYYYMMDDHHmmss+HH'mm'
fn pdf_date_string() -> Vec<u8> {
    let now = Local::now();
    let date_part = now.format("D:%Y%m%d%H%M%S").to_string();
    let tz = now.format("%z").to_string();

    let tz_formatted = if tz.len() >= 5 {
        format!("{}'{}'", &tz[0..3], &tz[3..5])
    } else {
        tz
    };

    format!("{}{}", date_part, tz_formatted).into_bytes()
}

/// Encode a string as PDF text string (UTF-16BE with BOM for Unicode support)
fn encode_pdf_text_string(text: &str) -> Object {
    let mut bytes: Vec<u8> = vec![0xFE, 0xFF];
    for c in text.encode_utf16() {
        bytes.push((c >> 8) as u8);
        bytes.push((c & 0xFF) as u8);
    }
    Object::String(bytes, StringFormat::Hexadecimal)
}

/// Create the Info dictionary with metadata
fn create_info_dictionary(metadata: Option<PdfMetadata>) -> lopdf::Dictionary {
    let mut info_dict = lopdf::Dictionary::new();

    if let Some(ref meta) = metadata {
        if let Some(ref title) = meta.title {
            if !title.is_empty() {
                info_dict.set("Title", encode_pdf_text_string(title));
            }
        }
        if let Some(ref author) = meta.author {
            if !author.is_empty() {
                info_dict.set("Author", encode_pdf_text_string(author));
            }
        }
        if let Some(ref subject) = meta.subject {
            if !subject.is_empty() {
                info_dict.set("Subject", encode_pdf_text_string(subject));
            }
        }
        if let Some(ref keywords) = meta.keywords {
            if !keywords.is_empty() {
                info_dict.set("Keywords", encode_pdf_text_string(keywords));
            }
        }
    }

    info_dict.set(
        "Creator",
        Object::String(b"Priska PDF Tool".to_vec(), StringFormat::Literal),
    );
    info_dict.set(
        "Producer",
        Object::String(b"Priska PDF Tool (lopdf)".to_vec(), StringFormat::Literal),
    );

    let date = pdf_date_string();
    info_dict.set(
        "CreationDate",
        Object::String(date.clone(), StringFormat::Literal),
    );
    info_dict.set("ModDate", Object::String(date, StringFormat::Literal));

    info_dict
}

/// Merge multiple PDF pages into a single PDF document.
/// Preserves page ordering as specified in the input.
#[tauri::command]
pub fn merge_pdfs(pages: Vec<PageSpec>, metadata: Option<PdfMetadata>) -> Result<String, String> {
    if pages.is_empty() {
        return Err("No pages to merge".to_string());
    }

    // Group pages by source document to find which pages are needed from each
    let mut doc_pages: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    for page in &pages {
        doc_pages
            .entry(page.pdf_data_base64.clone())
            .or_default()
            .push(page.page_number);
    }

    // Load, prune, and renumber each source document
    let mut max_id: u32 = 1;
    let mut pruned_docs: BTreeMap<String, Document> = BTreeMap::new();
    // Track mapping from original page number to new page number after pruning
    let mut page_num_mappings: BTreeMap<String, BTreeMap<u32, u32>> = BTreeMap::new();

    for (key, needed_pages) in &doc_pages {
        let pdf_bytes = STANDARD
            .decode(key)
            .map_err(|e| format!("Failed to decode PDF data: {}", e))?;

        let cursor = Cursor::new(pdf_bytes);
        let mut doc =
            Document::load_from(cursor).map_err(|e| format!("Failed to load PDF: {}", e))?;

        // Get all page numbers
        let all_page_nums: Vec<u32> = doc.get_pages().keys().cloned().collect();

        // Calculate which pages to delete
        let unique_needed: std::collections::HashSet<u32> = needed_pages.iter().cloned().collect();
        let pages_to_delete: Vec<u32> = all_page_nums
            .iter()
            .filter(|p| !unique_needed.contains(p))
            .cloned()
            .collect();

        // Build mapping from original page number to new page number
        let mut sorted_kept: Vec<u32> = unique_needed.iter().cloned().collect();
        sorted_kept.sort();
        let mut mapping: BTreeMap<u32, u32> = BTreeMap::new();
        for (new_idx, old_num) in sorted_kept.iter().enumerate() {
            mapping.insert(*old_num, (new_idx + 1) as u32);
        }
        page_num_mappings.insert(key.clone(), mapping);

        // Delete unwanted pages
        if !pages_to_delete.is_empty() {
            doc.delete_pages(&pages_to_delete);
        }

        // Prune unused objects
        doc.prune_objects();

        // Renumber objects to avoid ID collisions between documents
        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        pruned_docs.insert(key.clone(), doc);
    }

    // Build the output document
    let mut output_doc = Document::with_version("1.5");

    // Reserve an ID for the Pages dictionary
    let pages_id: ObjectId = (max_id, 0);
    max_id += 1;

    // First, copy ALL non-page objects from all pruned documents
    // This ensures resources (fonts, images, etc.) are available
    for doc in pruned_docs.values() {
        for (object_id, object) in doc.objects.iter() {
            // Skip Page, Pages, Catalog, and Outline objects - we'll create our own structure
            match object.type_name().unwrap_or(b"") {
                b"Catalog" | b"Pages" | b"Outlines" | b"Outline" => {}
                b"Page" => {} // We'll handle pages specially below
                _ => {
                    output_doc.objects.insert(*object_id, object.clone());
                }
            }
        }
    }

    let mut kids: Vec<Object> = Vec::new();

    // Now add each page in the correct order
    // Key insight: each page needs its own unique ID in the output,
    // even if we're including the same page multiple times or pages from the same doc
    for page_spec in &pages {
        let doc = pruned_docs
            .get(&page_spec.pdf_data_base64)
            .ok_or("Document not found in cache")?;

        let page_num_mapping = page_num_mappings
            .get(&page_spec.pdf_data_base64)
            .ok_or("Page mapping not found")?;

        // Find the new page number after pruning
        let new_page_num = page_num_mapping.get(&page_spec.page_number).ok_or(format!(
            "Page {} not found in mapping",
            page_spec.page_number
        ))?;

        // Get the page ID from the pruned document
        let doc_pages_map = doc.get_pages();
        let source_page_id = doc_pages_map.get(new_page_num).ok_or(format!(
            "Page {} not found at position {}",
            page_spec.page_number, new_page_num
        ))?;

        // Get the page object
        if let Ok(page_obj) = doc.get_object(*source_page_id) {
            if let Object::Dictionary(dict) = page_obj {
                let mut page_dict = dict.clone();

                // Apply rotation
                if page_spec.rotation != 0 {
                    let current = page_dict
                        .get(b"Rotate")
                        .ok()
                        .and_then(|r| r.as_i64().ok())
                        .unwrap_or(0) as i32;
                    let new_rotation = (current + page_spec.rotation).rem_euclid(360);
                    page_dict.set("Rotate", Object::Integer(new_rotation as i64));
                }

                // Set parent to our Pages dictionary
                page_dict.set("Parent", Object::Reference(pages_id));

                // Create a NEW unique ID for this page in the output
                let output_page_id: ObjectId = (max_id, 0);
                max_id += 1;

                output_doc
                    .objects
                    .insert(output_page_id, Object::Dictionary(page_dict));
                kids.push(Object::Reference(output_page_id));
            }
        }
    }

    // Create Pages dictionary
    let pages_dict = dictionary! {
        "Type" => "Pages",
        "Kids" => kids.clone(),
        "Count" => kids.len() as i32,
    };
    output_doc
        .objects
        .insert(pages_id, Object::Dictionary(pages_dict));

    // Create Catalog
    let catalog_id: ObjectId = (max_id, 0);
    max_id += 1;
    output_doc.objects.insert(
        catalog_id,
        Object::Dictionary(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        }),
    );

    output_doc
        .trailer
        .set("Root", Object::Reference(catalog_id));

    // Add Info dictionary with metadata
    let info_dict = create_info_dictionary(metadata);
    let info_id: ObjectId = (max_id, 0);
    max_id += 1;
    output_doc
        .objects
        .insert(info_id, Object::Dictionary(info_dict));
    output_doc.trailer.set("Info", Object::Reference(info_id));

    output_doc.max_id = max_id;

    // Compress streams
    output_doc.compress();

    // Save to bytes
    let mut output_bytes = Vec::new();
    output_doc
        .save_to(&mut output_bytes)
        .map_err(|e| format!("Failed to save merged PDF: {}", e))?;

    Ok(STANDARD.encode(&output_bytes))
}
