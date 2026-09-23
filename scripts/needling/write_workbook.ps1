$ErrorActionPreference = 'Stop'
# All Korean text comes from excel_config.json (UTF-8) so this file stays ASCII.
$cfgPath = Join-Path $PSScriptRoot 'excel_config.json'
$cfg = [IO.File]::ReadAllText($cfgPath, [Text.Encoding]::UTF8) | ConvertFrom-Json

function To-Array2D($rows) {
    $r = $rows.Count; $c = $rows[0].Count
    $arr = New-Object 'object[,]' $r, $c
    for ($i = 0; $i -lt $r; $i++) { for ($j = 0; $j -lt $c; $j++) { $arr[$i, $j] = $rows[$i][$j] } }
    return ,$arr
}

$excel = $null; $wb = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false; $excel.DisplayAlerts = $false; $excel.ScreenUpdating = $false
    $wb = $excel.Workbooks.Open(($cfg.source -replace '/', [string][char]92), 0, $true)

    # S column: KCMRIC raw text for GB rows
    $main = $wb.Worksheets.Item($cfg.mainSheet)
    foreach ($u in $cfg.sUpdates) { $main.Cells.Item([int]$u[0], 19).Value2 = [string]$u[1] }

    # New sheets appended at the end
    foreach ($s in $cfg.sheets) {
        $ws = $wb.Worksheets.Add([Type]::Missing, $wb.Worksheets.Item($wb.Worksheets.Count))
        $ws.Name = $s.name
        $rows = @($s.rows)
        $nr = $rows.Count; $nc = @($rows[0]).Count
        $rng = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item($nr, $nc))
        $rng.Value2 = (To-Array2D $rows)
        $hdr = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item(1, $nc))
        $hdr.Font.Bold = $true; $hdr.Interior.Color = 0xEADCD9; $hdr.WrapText = $true
        $rng.Font.Name = 'Arial'; $rng.Font.Size = 9
        $rng.VerticalAlignment = -4160
        $rng.ColumnWidth = 16
        if ($nr -gt 1) { $rng.AutoFilter() | Out-Null }
        $ws.Activate(); $excel.ActiveWindow.SplitRow = 1; $excel.ActiveWindow.FreezePanes = $true
    }

    # Criteria rows appended after last used row
    $crit = $wb.Worksheets.Item($cfg.critSheet)
    $last = $crit.Cells.Item($crit.Rows.Count, 1).End(-4162).Row
    $start = $last + 2
    $crows = @($cfg.criteria)
    $crng = $crit.Range($crit.Cells.Item($start, 1), $crit.Cells.Item($start + $crows.Count - 1, 3))
    $crng.Value2 = (To-Array2D $crows)
    $crit.Cells.Item($start, 1).Font.Bold = $true

    $wb.Worksheets.Item($cfg.mainSheet).Activate()
    $wb.SaveAs(($cfg.output -replace '/', [string][char]92), 52)
    Write-Output ('saved ' + $cfg.output)
}
finally {
    if ($wb) { $wb.Close($false) }
    if ($excel) { $excel.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null }
}
