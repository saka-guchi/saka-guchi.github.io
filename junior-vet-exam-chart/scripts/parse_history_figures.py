import subprocess
import glob
import os
import json

images = sorted(glob.glob('temp_history_pages/*.png'))
print(f'Total images to parse: {len(images)}')

# PowerShell OCRスクリプトを呼び出してテキストを抽出
results = {}

for idx, img in enumerate(images):
    cmd = [
        'powershell',
        '-ExecutionPolicy', 'Bypass',
        '-File', 'junior-vet-exam-chart/scripts/ocr_page.ps1',
        '-ImagePath', img
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        lines = [l.strip() for l in proc.stdout.splitlines() if l.strip()]
        results[os.path.basename(img)] = lines
        # 人物名っぽい行（2〜6文字の漢字やカタカナ、でる順等）を簡易表示
        print(f'[{idx+1}/{len(images)}] {os.path.basename(img)}: {len(lines)} lines extracted')
    except Exception as e:
        print(f'Error on {img}: {e}')

with open('temp_history_ocr_all.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print('Finished saving temp_history_ocr_all.json')

