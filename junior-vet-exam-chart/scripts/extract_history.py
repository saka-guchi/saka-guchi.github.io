import fitz
import os
import subprocess
import glob
import re

pdfs = [
    'junior-vet-exam-chart/docs/中学入試即答キーワードで覚える歴史人物80 1.pdf',
    'junior-vet-exam-chart/docs/中学入試即答キーワードで覚える歴史人物80 2.pdf',
    'junior-vet-exam-chart/docs/中学入試即答キーワードで覚える歴史人物80 3.pdf'
]

os.makedirs('temp_history_pages', exist_ok=True)

# ページごとのスキャンとOCR実行
print('Extracting sample pages and analyzing content structure...')
results = []

for pdf_idx, pdf_path in enumerate(pdfs):
    doc = fitz.open(pdf_path)
    print(f'Processing {os.path.basename(pdf_path)} ({len(doc)} pages)...')
    for p_idx in range(len(doc)):
        img_name = f'temp_history_pages/pdf{pdf_idx+1}_p{p_idx:02d}.png'
        if not os.path.exists(img_name):
            pix = doc[p_idx].get_pixmap(dpi=100)
            pix.save(img_name)

print('Images generated. Ready for OCR parsing.')

