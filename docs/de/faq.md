---
layout: page
lang: de
title: Haeufig gestellte Fragen
description: Finden Sie Antworten auf haeufige Fragen zu Priska PDF Tool
permalink: /de/faq/
---

## Allgemeine Fragen

### Was ist Priska PDF Tool?

Priska PDF Tool ist eine kostenlose, Open-Source-Desktop-Anwendung zum Anzeigen und Bearbeiten von PDF-Dateien. Sie ermoeglicht das Zusammenfuehren mehrerer PDFs, Neuanordnen von Seiten, Loeschen von Seiten, Drehen von Seiten und Speichern des Ergebnisses als neue PDF.

### Ist Priska PDF Tool kostenlos?

Ja! Priska PDF Tool ist voellig kostenlos und Open Source. Sie koennen es fuer private oder kommerzielle Zwecke ohne Einschraenkungen nutzen.

### Welche Plattformen werden unterstuetzt?

Priska PDF Tool laeuft auf:
- **macOS** (Intel und Apple Silicon)
- **Windows** (64-Bit)
- **Linux** (AppImage und DEB-Pakete)

### Gibt es eine mobile Version?

Derzeit ist Priska PDF Tool nur fuer Desktop-Betriebssysteme verfuegbar. Es gibt derzeit keine Plaene fuer eine mobile Version.

---

## Funktionen

### Kann ich Seiten von einer PDF zu einer anderen hinzufuegen?

Ja! Oeffnen Sie einfach beide PDFs (Drag-and-Drop oder Datei > Oeffnen) und sie werden automatisch zusammengefuehrt. Sie koennen dann die Seiten nach Bedarf neu anordnen und als neue PDF speichern.

### Kann ich eine PDF in mehrere Dateien aufteilen?

Nein, diese Funktion ist derzeit nicht verfuegbar. Priska PDF Tool konzentriert sich auf das Zusammenfuehren und Neuanordnen von Seiten innerhalb eines einzelnen Dokuments.

### Kann ich Anmerkungen oder Notizen hinzufuegen?

Nein, Anmerkungsfunktionen sind in der aktuellen Version nicht enthalten. Verwenden Sie fuer diesen Zweck ein spezielles PDF-Annotationswerkzeug.

### Kann ich Text in einer PDF bearbeiten?

Nein, Priska PDF Tool ist fuer Operationen auf Seitenebene konzipiert (Zusammenfuehren, Neuanordnen, Loeschen, Drehen). Es unterstuetzt nicht das Bearbeiten von Textinhalten innerhalb von Seiten.

### Kann ich passwortgeschuetzte PDFs oeffnen?

Nein, passwortgeschuetzte PDFs werden derzeit nicht unterstuetzt. Sie muessen das Passwort mit einem anderen Tool entfernen, bevor Sie in Priska PDF Tool oeffnen.

### Wie viele PDFs kann ich gleichzeitig zusammenfuehren?

Es gibt keine feste Grenze. Sie koennen so viele PDFs zusammenfuehren, wie der Arbeitsspeicher Ihres Computers verarbeiten kann. Sehr grosse Dokumente benoetigen moeglicherweise laenger zur Verarbeitung.

---

## Speichern und Exportieren

### In welchem Format wird gespeichert?

Priska PDF Tool speichert Dokumente als Standard-PDF-Dateien, die von jedem PDF-Viewer geoeffnet werden koennen.

### Kann ich die Originaldatei ueberschreiben?

Ja, aber wir empfehlen, zuerst unter einem neuen Dateinamen zu speichern, bis Sie sicher sind, dass die Ausgabe korrekt ist.

### Welche Metadaten kann ich hinzufuegen?

Beim Speichern koennen Sie hinzufuegen:
- Titel
- Autor
- Betreff
- Schluesselwoerter

Alle Felder sind optional.

---

## Technische Fragen

### Warum ist die zusammengefuehrte PDF groesser als erwartet?

Fruehere Versionen hatten ein Problem mit der Dateigroesse. Die aktuelle Version verwendet optimiertes PDF-Zusammenfuehren, das doppelte Ressourcen entfernt. Stellen Sie sicher, dass Sie die neueste Version verwenden.

### Werden meine Dateien irgendwohin hochgeladen?

Nein! Priska PDF Tool ist eine vollstaendig Offline-Anwendung. Ihre PDF-Dateien werden niemals auf irgendeinen Server hochgeladen. Alle Verarbeitung geschieht lokal auf Ihrem Computer.

### Wie funktioniert Auto-Update?

Die App prueft beim Start GitHub Releases auf neue Versionen. Wenn ein Update verfuegbar ist, sehen Sie eine Benachrichtigung. Updates werden direkt von GitHub heruntergeladen und lokal installiert.

---

## Problembehandlung

### Warum kann ich die App unter macOS nicht oeffnen?

macOS blockiert moeglicherweise die App, weil sie nicht notarisiert ist. Rechtsklicken Sie auf die App und waehlen Sie "Oeffnen", um diese Warnung zu umgehen. Siehe [Problembehandlung](/de/troubleshooting/) fuer Details.

### Warum werden einige PDFs nicht korrekt angezeigt?

Einige komplexe PDF-Funktionen werden moeglicherweise nicht korrekt dargestellt. Versuchen Sie, die PDF in einer anderen Anwendung zu oeffnen, um ihre Gueltigkeit zu ueberpruefen. Siehe [Problembehandlung](/de/troubleshooting/) fuer weitere Loesungen.

### Ich habe einen Fehler gefunden. Wie melde ich ihn?

Bitte melden Sie Fehler auf der [GitHub Issues-Seite](https://github.com/dansailer/pdftool/issues). Enthalten Sie:
- Ihr Betriebssystem und Version
- Schritte zur Reproduktion des Fehlers
- Eventuelle Fehlermeldungen

---

## Beitragen

### Ist der Quellcode verfuegbar?

Ja! Priska PDF Tool ist Open Source und auf [GitHub](https://github.com/dansailer/pdftool) verfuegbar.

### Wie kann ich beitragen?

Sie koennen beitragen durch:
- Melden von Fehlern und Vorschlagen von Funktionen auf GitHub
- Einreichen von Pull Requests fuer Fehlerbehebungen oder Verbesserungen
- Verbesserung der Dokumentation
- Testen auf verschiedenen Plattformen

### Welche Technologien werden verwendet?

Priska PDF Tool ist gebaut mit:
- **Tauri** - Desktop-Anwendungs-Framework
- **Rust** - Backend-Sprache fuer PDF-Verarbeitung
- **TypeScript** - Frontend-Sprache
- **pdf.js** - PDF-Darstellung
- **lopdf** - PDF-Manipulation (Rust-Bibliothek)
