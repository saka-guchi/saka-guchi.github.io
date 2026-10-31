param(
    [string]$ImageDir = "temp_history_pages",
    [string]$OutputFile = "temp_history_ocr_all.json"
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
}[0]

function Await($asyncOp, $type) {
    $asTask = $asTaskGeneric.MakeGenericMethod($type)
    $netTask = $asTask.Invoke($null, @($asyncOp))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine,Windows.Media.Ocr,ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.FileAccessMode,Windows.Storage,ContentType=WindowsRuntime] | Out-Null

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('ja'))

$images = Get-ChildItem -Path $ImageDir -Filter "*.png" | Sort-Object Name
$total = $images.Count
Write-Host "Processing $total images in $ImageDir..."

$allResults = [ordered]@{}
$i = 0

foreach ($img in $images) {
    $i++
    $resolved = $img.FullName
    $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($resolved)) ([Windows.Storage.StorageFile])
    $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    
    $lines = @($result.Lines | ForEach-Object { $_.Text })
    $allResults[$img.Name] = $lines
    Write-Host "[$i/$total] $($img.Name): $($lines.Count) lines"
}

$json = $allResults | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Resolve-Path .).Path + "\" + $OutputFile, $json, [System.Text.Encoding]::UTF8)
Write-Host "Successfully wrote $OutputFile"

