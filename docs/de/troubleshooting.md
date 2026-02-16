---
layout: page
lang: de
title: Problembehandlung
description: Loesungen fuer haeufige Probleme mit Priska PDF Tool
permalink: /de/troubleshooting/
---

Haben Sie Probleme mit Priska PDF Tool? Dieser Leitfaden behandelt haeufige Probleme und ihre Loesungen.

---

## Haeufige Probleme {#common-issues}

### Die App laesst sich unter macOS nicht oeffnen

**Problem:** Wenn Sie versuchen, die App zu oeffnen, zeigt macOS eine Sicherheitswarnung an oder die App startet nicht.

**Loesung:**
1. Rechtsklicken (oder Ctrl+Klick) auf die App
2. Waehlen Sie "Oeffnen" aus dem Kontextmenue
3. Klicken Sie im erscheinenden Dialog auf "Oeffnen"
4. Die App sollte nun starten und als sicher gespeichert werden

Dies ist erforderlich, weil die App nicht bei Apple notarisiert ist. Es muss nur einmal durchgefuehrt werden.

---

### PDF-Dateien werden nicht korrekt angezeigt

**Problem:** Einige PDFs erscheinen leer, verzerrt oder mit fehlenden Inhalten.

**Moegliche Ursachen und Loesungen:**

1. **Beschaedigte PDF-Datei**
   - Versuchen Sie, die PDF in einer anderen Anwendung zu oeffnen, um ihre Gueltigkeit zu ueberpruefen
   - Laden Sie die PDF erneut herunter oder erstellen Sie sie neu, wenn moeglich

2. **Verschluesselte oder passwortgeschuetzte PDF**
   - Priska PDF Tool unterstuetzt derzeit keine passwortgeschuetzten PDFs
   - Entfernen Sie den Passwortschutz mit einem anderen Tool, bevor Sie oeffnen

3. **Komplexe PDF-Funktionen**
   - Einige erweiterte PDF-Funktionen werden moeglicherweise nicht korrekt dargestellt
   - Versuchen Sie, die PDF zuerst in eine neue PDF-Datei zu drucken

---

### Gespeicherte PDF ist viel groesser als erwartet

**Problem:** Die zusammengefuehrte PDF-Datei ist deutlich groesser als die Summe der Originaldateien.

**Loesung:** Dieses Problem wurde in neueren Versionen behoben. Stellen Sie sicher, dass Sie die neueste Version von Priska PDF Tool verwenden, die optimiertes PDF-Zusammenfuehren mit Entfernung doppelter Ressourcen verwendet.

Wenn Sie dieses Problem weiterhin haben, [melden Sie es bitte auf GitHub](https://github.com/dansailer/pdftool/issues).

---

### Drag and Drop funktioniert nicht

**Problem:** Das Ziehen von PDF-Dateien auf das Fenster oeffnet sie nicht.

**Loesungen:**
1. Stellen Sie sicher, dass Sie PDF-Dateien ziehen (`.pdf`-Erweiterung)
2. Ziehen Sie Dateien in den Hauptfensterbereich, nicht in die Titelleiste
3. Versuchen Sie stattdessen Datei > Oeffnen zu verwenden

---

### Miniaturansichten laden langsam

**Problem:** Miniaturansichten brauchen lange, um bei grossen PDFs zu erscheinen.

**Dies ist normales Verhalten.** Grosse PDFs mit vielen Seiten oder hochaufloesenden Bildern brauchen laenger zum Rendern. Die App rendert Miniaturansichten im Hintergrund, um die Oberflaeche reaktionsfaehig zu halten.

**Tipps:**
- Warten Sie einen Moment, bis die Miniaturansichten vollstaendig geladen sind
- Grosse PDFs (Hunderte von Seiten) koennen 10-30 Sekunden dauern

---

### Aenderungen werden nicht gespeichert

**Problem:** Nach der Bearbeitung erscheinen meine Aenderungen nicht in der gespeicherten PDF.

**Stellen Sie sicher, dass Sie:**
1. **Datei > Speichern unter...** verwenden (nicht einfach das Fenster schliessen)
2. Einen neuen Dateinamen waehlen oder das Ueberschreiben bestaetigen
3. Warten, bis der Speichervorgang abgeschlossen ist

**Hinweis:** Der "(Bearbeitet)"-Indikator in der Titelleiste zeigt an, wenn Sie ungespeicherte Aenderungen haben.

---

### Rueckgaengig funktioniert nicht

**Problem:** Das Druecken von Cmd+Z / Strg+Z macht meine Aktion nicht rueckgaengig.

**Moegliche Ursachen:**
1. Sie haben bereits alle verfuegbaren Aktionen rueckgaengig gemacht (maximal 50)
2. Sie versuchen, nach dem erneuten Oeffnen der App rueckgaengig zu machen (Rueckgaengig-Verlauf wird nicht gespeichert)
3. Der Fokus liegt moeglicherweise auf einem anderen Element

**Loesung:** Klicken Sie irgendwo im Hauptfenster, um sicherzustellen, dass es den Fokus hat, und versuchen Sie dann erneut Rueckgaengig.

---

### Anwendung stuerzt ab

**Problem:** Die App stuerzt bei bestimmten Operationen ab.

**Schritte zur Behebung:**
1. Starten Sie die Anwendung neu
2. Versuchen Sie es mit einer kleineren oder anderen PDF-Datei
3. Pruefen Sie, ob Sie genuegend Speicherplatz und Arbeitsspeicher haben
4. Aktualisieren Sie auf die neueste Version

**Wenn Abstuerze anhalten:**
1. Notieren Sie, was Sie getan haben, als der Absturz auftrat
2. Pruefen Sie die Konsolenprotokolle (Entwicklertools > Konsole)
3. [Melden Sie das Problem auf GitHub](https://github.com/dansailer/pdftool/issues) mit Details

---

## Hilfe erhalten {#contact-support}

Wenn Sie keine Loesung fuer Ihr Problem finden:

### FAQ pruefen
Sehen Sie die [Haeufig gestellten Fragen](/de/faq/) fuer weitere Antworten.

### Problem melden
1. Gehen Sie zur [GitHub Issues-Seite](https://github.com/dansailer/pdftool/issues)
2. Suchen Sie nach bestehenden Problemen, die zu Ihrem passen
3. Wenn nicht gefunden, erstellen Sie ein neues Issue mit:
   - Ihrem Betriebssystem und Version
   - App-Version (siehe Info-Dialog)
   - Schritte zur Reproduktion des Problems
   - Eventuelle Fehlermeldungen, die Sie sehen

### Quellcode ansehen
Priska PDF Tool ist Open Source. Sie koennen:
- Den Code auf [GitHub](https://github.com/dansailer/pdftool) ansehen
- Korrekturen oder Verbesserungen beitragen
- Aus dem Quellcode fuer Ihre Plattform bauen
