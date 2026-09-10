"""
Synthetic Demonstration Dataset Generator for SIH26023.
Creates domain-accurate synthetic PDF, DOCX, CSV, and XLSX sample files
labeled strictly: 'SYNTHETIC DEMONSTRATION DATA — NOT OFFICIAL CIL DATA'.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import docx
import pandas as pd
from fpdf import FPDF
from config.settings import SAMPLE_DATA_DIR

class SyntheticPDF(FPDF):
    def __init__(self, title, sub, period):
        super().__init__()
        self.doc_title = title
        self.sub = sub
        self.period = period

    def header(self):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(24, 43, 73)
        self.cell(0, 7, "COAL INDIA LIMITED / CMPDI SUBSIDIARY REPORT", ln=True, align="C")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(180, 83, 9)
        self.cell(0, 5, self.doc_title, ln=True, align="C")
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(220, 38, 38)
        self.cell(0, 4, "[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]", ln=True, align="C")
        self.line(10, 28, 200, 28)
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} | Synthetic Demo Document for SIH26023", align="C")

def generate_sample_documents():
    SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    generated_files = []

    # 1. ECL Rajmahal Monthly Report (PDF)
    p1 = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
    pdf1 = SyntheticPDF("ECL RAJMAHAL OPENCAST PROJECT -- MONTHLY PERFORMANCE", "ECL", "May 2025")
    pdf1.add_page()
    pdf1.set_font("Helvetica", "B", 11)
    pdf1.set_text_color(24, 43, 73)
    pdf1.cell(0, 6, "1. Executive Summary & Administrative Context", ln=True)
    pdf1.set_font("Helvetica", "", 10)
    pdf1.set_text_color(51, 65, 85)
    pdf1.multi_cell(0, 5, (
        "This monthly performance review details the operational metrics of Eastern Coalfields Limited (ECL) "
        "at Rajmahal Open Cast Project for the reporting period May 2025. During May 2025, Rajmahal OCP achieved "
        "a total Coal Production of 1.32 Million Tonnes against a monthly budgeted Target of 1.40 Million Tonnes, "
        "representing an achievement rate of 94.28%. Overburden Removal (OBR) achieved was 3.85 M.Cum."
    ))
    pdf1.ln(3)

    pdf1.set_font("Helvetica", "B", 11)
    pdf1.set_text_color(24, 43, 73)
    pdf1.cell(0, 6, "2. Key Mining Figures & Geology", ln=True)
    pdf1.set_font("Helvetica", "", 10)
    pdf1.set_text_color(51, 65, 85)
    pdf1.multi_cell(0, 5, (
        "Mining activities were actively concentrated on Seam-II and Seam-III in Sector B. The average coal seam thickness "
        "measured 12.4 metres with an average Coal Ash Content of 38.5% and Moisture of 7.2%. The coal grade extracted "
        "conforms to Grade G11 non-coking thermal grade suitable for National Thermal Power Corporation (NTPC) power plants."
    ))
    pdf1.ln(3)

    pdf1.add_page()
    pdf1.set_font("Helvetica", "B", 11)
    pdf1.set_text_color(24, 43, 73)
    pdf1.cell(0, 6, "3. HEMM Fleet Utilization & Safety Review", ln=True)
    pdf1.set_font("Helvetica", "", 10)
    pdf1.set_text_color(51, 65, 85)
    pdf1.multi_cell(0, 5, (
        "The Heavy Earth Moving Machinery (HEMM) fleet recorded an overall HEMM Availability of 84.5% and HEMM Utilization of 76.2%. "
        "A total of 24 240-Tonne Dumpers and 4 20-Cu.M Electric Rope Shovels operated during the month. "
        "Safety performance remained stable with 0 Fatal Accidents and 1 Serious Accidents (minor machinery slipway, resolved). "
        "The calculated Lost Time Injury Frequency Rate (LTIFR) was 0.22 per million man-hours."
    ))
    pdf1.output(str(p1))
    generated_files.append(p1)

    # 2. ECL Annual Summary Discrepancy Doc (PDF) -- INTENTIONAL DISCREPANCY (1.28 MT instead of 1.32 MT)
    p2 = SAMPLE_DATA_DIR / "ECL_Annual_Production_Summary_Discrepancy_Check_2025.pdf"
    pdf2 = SyntheticPDF("ECL ANNUAL RECONCILIATION SUMMARY 2024-2025", "ECL", "FY 2024-25")
    pdf2.add_page()
    pdf2.set_font("Helvetica", "B", 11)
    pdf2.set_text_color(24, 43, 73)
    pdf2.cell(0, 6, "1. Subsidiary Reconciliation Table", ln=True)
    pdf2.set_font("Helvetica", "", 10)
    pdf2.set_text_color(51, 65, 85)
    pdf2.multi_cell(0, 5, (
        "In the annual reconciliation audit for Eastern Coalfields Limited (ECL), Rajmahal Open Cast Project reported "
        "historical month-wise figures. For the specific month of May 2025, preliminary internal railway dispatch receipts "
        "recorded Coal Production of 1.28 Million Tonnes and Overburden Removal (OBR) of 3.70 M.Cum. "
        "Note: This revised provisional figure is subject to final reconciliation with pithead weightbridge records."
    ))
    pdf2.output(str(p2))
    generated_files.append(p2)

    # 3. BCCL Jharia Geological Survey Report (DOCX)
    p3 = SAMPLE_DATA_DIR / "BCCL_Jharia_Coalfield_Geological_Survey_Report_2025.docx"
    doc = docx.Document()
    h = doc.add_heading("BHARAT COKING COAL LIMITED -- JHARIA COALFIELD GEOLOGICAL SURVEY", level=0)
    doc.add_paragraph("[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]\nSubsidiary: BCCL | Mine: Moonidih & Block-IV | Period: Q1 FY25-26")
    
    doc.add_heading("1. Geological Exploration & Seam Analysis", level=1)
    doc.add_paragraph(
        "Central Mine Planning and Design Institute (CMPDI) Regional Institute-II conducted deep exploratory drilling "
        "in the Jharia Coalfield across Borehole BH-JHR-108 and BH-JHR-112 reaching depths of 450 metres. "
        "The exploration verified significant reserves in Seam-XVIII, Seam-XVI, and Queen Seam with a composite thickness of 6.8 metres. "
        "The coal exhibits premium metallurgical properties with Coal Ash Content of 16.4% and Moisture of 1.2%, "
        "categorized as Prime Coking Coal Grade Steel-I."
    )

    doc.add_heading("2. Operational Production & Safety Status", level=1)
    doc.add_paragraph(
        "During Q1 FY25-26, BCCL achieved total Coal Production of 0.78 Million Tonnes from underground longwall and continuous miner operations. "
        "Safety compliance was strictly maintained with 0 Fatal Accidents and 0 Serious Accidents under DGMS supervision. "
        "Methane drainage systems operated at 99.4% efficiency."
    )
    doc.save(str(p3))
    generated_files.append(p3)

    # 4. SECL Korba HEMM Performance (XLSX)
    p4 = SAMPLE_DATA_DIR / "SECL_Korba_Operational_HEMM_Performance_Q1.xlsx"
    df_prod = pd.DataFrame([
        {"Subsidiary": "SECL", "Mine": "Gevra OCP", "Reporting_Period": "Q1 FY25-26", "Coal_Production_MT": 8.90, "Target_MT": 9.20, "OBR_MCum": 11.40, "HEMM_Availability_Pct": 88.2, "Fatal_Accidents": 0},
        {"Subsidiary": "SECL", "Mine": "Kusmunda OCP", "Reporting_Period": "Q1 FY25-26", "Coal_Production_MT": 5.60, "Target_MT": 5.50, "OBR_MCum": 6.80, "HEMM_Availability_Pct": 85.6, "Fatal_Accidents": 0},
        {"Subsidiary": "SECL", "Mine": "Dipka OCP", "Reporting_Period": "Q1 FY25-26", "Coal_Production_MT": 4.10, "Target_MT": 4.30, "OBR_MCum": 5.20, "HEMM_Availability_Pct": 82.4, "Fatal_Accidents": 0}
    ])
    df_summary = pd.DataFrame([
        {"Metric": "Total Coal Production (SECL Q1)", "Value": "18.60 Million Tonnes", "Target": "19.00 Million Tonnes", "Achievement_Pct": "97.89%"},
        {"Metric": "Total Overburden Removal (OBR)", "Value": "23.40 M.Cum", "Target": "24.00 M.Cum", "Achievement_Pct": "97.50%"},
        {"Metric": "Total Fatal Accidents", "Value": "0", "Target": "0", "Achievement_Pct": "100.00%"}
    ])
    with pd.ExcelWriter(str(p4), engine="openpyxl") as writer:
        df_prod.to_excel(writer, sheet_name="Mine_Production_Breakdown", index=False)
        df_summary.to_excel(writer, sheet_name="Consolidated_KPIs", index=False)
    generated_files.append(p4)

    # 5. CMPDI Talcher Borehole Drilling Log (CSV)
    p5 = SAMPLE_DATA_DIR / "CMPDI_Drilling_and_Seam_Exploration_Talcher_Block.csv"
    df_csv = pd.DataFrame([
        {"Borehole_ID": "BH-TL-201", "Subsidiary": "CMPDI", "Coalfield": "Talcher", "Seam_Name": "Seam-I", "Depth_From_m": 42.5, "Depth_To_m": 58.2, "Thickness_m": 15.7, "Coal_Grade": "G12", "Ash_Pct": 41.2, "Moisture_Pct": 8.1, "GCV_kcal_kg": 3450},
        {"Borehole_ID": "BH-TL-202", "Subsidiary": "CMPDI", "Coalfield": "Talcher", "Seam_Name": "Seam-II", "Depth_From_m": 84.0, "Depth_To_m": 96.5, "Thickness_m": 12.5, "Coal_Grade": "G10", "Ash_Pct": 35.8, "Moisture_Pct": 7.4, "GCV_kcal_kg": 3900},
        {"Borehole_ID": "BH-TL-203", "Subsidiary": "CMPDI", "Coalfield": "Talcher", "Seam_Name": "Queen Seam", "Depth_From_m": 135.2, "Depth_To_m": 144.8, "Thickness_m": 9.6, "Coal_Grade": "G9", "Ash_Pct": 32.4, "Moisture_Pct": 6.8, "GCV_kcal_kg": 4350},
        {"Borehole_ID": "BH-TL-204", "Subsidiary": "CMPDI", "Coalfield": "Talcher", "Seam_Name": "King Seam", "Depth_From_m": 190.0, "Depth_To_m": 204.2, "Thickness_m": 14.2, "Coal_Grade": "G8", "Ash_Pct": 29.5, "Moisture_Pct": 6.2, "GCV_kcal_kg": 4700}
    ])
    df_csv.to_csv(str(p5), index=False)
    generated_files.append(p5)

    # 6. WCL Environmental Audit (PDF)
    p6 = SAMPLE_DATA_DIR / "WCL_Nagpur_Environmental_Compliance_Air_Water_Audit.pdf"
    pdf6 = SyntheticPDF("WCL UMRER OCP -- STATUTORY ENVIRONMENTAL AUDIT", "WCL", "May 2025")
    pdf6.add_page()
    pdf6.set_font("Helvetica", "B", 11)
    pdf6.set_text_color(24, 43, 73)
    pdf6.cell(0, 6, "1. Environmental & Pollution Control Parameters", ln=True)
    pdf6.set_font("Helvetica", "", 10)
    pdf6.set_text_color(51, 65, 85)
    pdf6.multi_cell(0, 5, (
        "Western Coalfields Limited (WCL) Umrer Open Cast Project conducted comprehensive statutory environmental monitoring "
        "for the period May 2025. Ambient air particulate matter PM10 recorded 78 ug/m3 and PM2.5 recorded 38 ug/m3, "
        "strictly within National Ambient Air Quality Standards. Treated mine effluent water exhibited pH of 7.4. "
        "Afforestation covered 25,000 native tree saplings across reclaimed overburden dumps."
    ))
    pdf6.output(str(p6))
    generated_files.append(p6)

    # 7. Parliamentary Inquiry Reference Template (DOCX)
    p7 = SAMPLE_DATA_DIR / "Ministry_Parliamentary_Question_Starred_142_Coal_Shortfall.docx"
    doc_inq = docx.Document()
    doc_inq.add_heading("PARLIAMENT OF INDIA -- LOK SABHA QUESTION NO. 142", level=0)
    doc_inq.add_paragraph("[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]\nMinistry: Ministry of Coal | Subject: Coal Production Targets, Shortfalls and Safety Measures")
    doc_inq.add_paragraph(
        "Will the Minister of COAL be pleased to state:\n"
        "(a) The subsidiary-wise details of coal production targets versus actual achievements in ECL, BCCL, and SECL during May 2025 and Q1 FY25-26;\n"
        "(b) Whether any discrepancies were detected in reported production figures between mine pithead and annual dispatch summaries;\n"
        "(c) The number of fatal and serious safety accidents recorded across CIL operational mines in the stated period; and\n"
        "(d) The concrete remedial steps taken by the government to enhance HEMM availability and enforce DGMS safety standards?"
    )
    doc_inq.save(str(p7))
    generated_files.append(p7)

    return generated_files

if __name__ == "__main__":
    files = generate_sample_documents()
    print(f"Successfully generated {len(files)} synthetic demonstration documents in {SAMPLE_DATA_DIR}")
