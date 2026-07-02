const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak, UnderlineType, LevelFormat } = require("./node_modules/docx");
const fs = require("fs");

const headerColor = "1F3864";
const accentColor = "C9A020";

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 32, font: "Arial", color: headerColor },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 28, font: "Arial", color: headerColor },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 26, font: "Arial", color: headerColor },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // COVER PAGE
      new Paragraph({ text: "", spacing: { after: 400 } }),
      new Paragraph({
        text: "FIXERA",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "COMPREHENSIVE LEGAL DOCUMENTATION",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: "CORRECTED VERSION",
        alignment: AlignmentType.CENTER,
        bold: true,
        spacing: { after: 300 },
        border: { 
          bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor }
        }
      }),
      new Paragraph({
        text: "Business Terms & Conditions | Partner Agreements | IP Protection",
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        italics: true
      }),
      new Paragraph({
        text: "6 Partner Types | Updated Commission Rates | Corrected Wallet System",
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        bold: true
      }),
      new Paragraph({ text: "", spacing: { after: 200 } }),
      new Paragraph({
        text: "Date Prepared: June 10, 2026",
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: "Version: 1.1 - CORRECTED",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      
      // PAGE BREAK
      new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }),
      
      // TABLE OF CONTENTS
      new Paragraph({
        text: "QUICK REFERENCE",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Partner Types: 6 (Service Workers, Vendors, Riders, Suppliers, Movers, Water Carriers)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Commission Rates: 15-20% (Service Workers & Riders: 15%, All others: 20%)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Wallet System: ONLY Service Workers & Riders (KSh 500 minimum)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "All Partners: KSh 500 mandatory deposit",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 300 }
      }),
      
      // COMMISSION TABLE
      new Paragraph({
        text: "COMMISSION STRUCTURE",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 150 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                shading: { fill: headerColor, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ text: "Partner Type", bold: true, color: "FFFFFF" })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                shading: { fill: headerColor, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ text: "Commission", bold: true, color: "FFFFFF" })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                shading: { fill: headerColor, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ text: "Wallet", bold: true, color: "FFFFFF" })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Service Workers
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Service Workers")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("15%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("✅ YES")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Vendors
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Vendors")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("20%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("❌ NO")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Riders
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Riders")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("15%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("✅ YES")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Suppliers
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Suppliers")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("20%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("❌ NO")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Movers
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Movers")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("20%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("❌ NO")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          // Water Carriers
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("Water Carriers")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("20%")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph("❌ NO")],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ text: "", spacing: { after: 300 } }),
      
      // WALLET SECTION
      new Paragraph({
        text: "WALLET SYSTEM - SERVICE WORKERS & RIDERS ONLY",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 150 }
      }),
      new Paragraph({
        text: "Mandatory Deposit: KSh 500 (minimum)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Additional Deposits: Partners can deposit MORE than KSh 500 for MORE opportunities",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Job Opportunity Tiers:",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "KSh 500 = Standard access",
        indent: { left: 1080 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: "KSh 1,000 = More opportunities",
        indent: { left: 1080 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: "KSh 2,000+ = Premium access",
        indent: { left: 1080 },
        spacing: { after: 150 }
      }),
      
      // KEY CORRECTIONS
      new Paragraph({
        text: "KEY CORRECTIONS MADE",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 150 }
      }),
      new Paragraph({
        text: "Partner types reduced from 7 to 6",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 }
      }),
      new Paragraph({
        text: "Removed Carpentry from Service Workers list",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 }
      }),
      new Paragraph({
        text: "Removed Cleaners as separate category (now part of Service Workers)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 }
      }),
      new Paragraph({
        text: "Updated commission rates: Vendors 20%, Suppliers 20%, Movers 20%, Water Carriers 20%",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 }
      }),
      new Paragraph({
        text: "Wallet system ONLY for Service Workers & Riders (KSh 500 minimum)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 }
      }),
      new Paragraph({
        text: "All other partners use monthly invoicing or bank transfers (NO wallet)",
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 300 }
      }),
      
      new Paragraph({
        text: "[Complete legal documentation with all 5 sections: Business T&C, Master Partner Agreement, 6 Partner-Specific Agreements, IP Protection, and Compliance Checklist follows in CORRECTED-TEXT.txt file]",
        italics: true,
        spacing: { after: 200 },
        color: "808080"
      }),
      
      new Paragraph({
        text: "This professional Word document provides a summary of all corrections made. For the complete detailed legal text with all clauses, definitions, and requirements, please refer to FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt",
        border: { left: { style: BorderStyle.SINGLE, size: 24, color: accentColor } },
        indent: { left: 360 },
        spacing: { after: 300 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("FIXERA-LEGAL-DOCUMENTATION-CORRECTED.docx", buffer);
  console.log("✅ Professional Word document created successfully!");
  console.log("📄 File: FIXERA-LEGAL-DOCUMENTATION-CORRECTED.docx");
  console.log("✨ Ready to send to your lawyer");
});
