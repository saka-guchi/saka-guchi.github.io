$raw = Get-Content "temp_history_ocr_all.json" -Raw -Encoding UTF8
$data = ConvertFrom-Json $raw

foreach ($prop in $data.psobject.Properties) {
    $pageName = $prop.Name
    $lines = $prop.Value
    $schools = @($lines | Where-Object { $_ -like "*中学校*" -or $_ -like "*中等部*" })
    
    Write-Output "=== PAGE: $pageName ==="
    if ($schools.Count -gt 0) {
        Write-Output ("SCHOOLS: " + ($schools -join " / "))
    }
    for ($i = 0; $i -lt [Math]::Min(12, $lines.Count); $i++) {
        Write-Output ("  " + $lines[$i])
    }
}
