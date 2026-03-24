$csvPath = "C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"
$lines = Get-Content -Path $csvPath -TotalCount 5
$headers = $lines[0].Split(";")
Write-Host "Headers:"
$headers | ForEach-Object { Write-Host " - $_" }
Write-Host "`nSample Data (Row 1):"
$lines[1]
