$csvPath = "C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"
$connectionString = "Server=51.178.43.232,14330;Database=cdp;User Id=sa;Password=c8lpFUm1gEhgJb;TrustServerCertificate=true;MultipleActiveResultSets=true;"

function Get-MonthsBetween($start, $end) {
    if ($null -eq $start -or $null -eq $end) { return @() }
    $months = New-Object System.Collections.Generic.List[PSObject]
    $curr = [DateTime]::new($start.Year, $start.Month, 1)
    $targetEnd = [DateTime]::new($end.Year, $end.Month, 1)
    
    while ($curr -le $targetEnd) {
        $months.Add([PSCustomObject]@{
            Year  = $curr.Year
            Month = $curr.Month
        })
        $curr = $curr.AddMonths(1)
    }
    return $months
}

$conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$conn.Open()

try {
    $lines = Get-Content -Path $csvPath
    Write-Host ("Read " + $lines.Length + " lines from CSV.")
    
    $count = 0
    $totalPayments = 0
    $errors = 0

    for ($i = 1; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        $row = $line.Split(';')
        if ($row.Length -lt 34) { continue }

        $membershipNumber = $row[6].Trim()
        $memberSinceStr = $row[1].Trim()
        $paidUntilStr = $row[14].Trim()
        $amountRaw = $row[15].Trim()
        $amountStr = $amountRaw -replace '[^0-9,.]', ''
        $amountStr = $amountStr.Replace(',', '.')

        if ([string]::IsNullOrWhiteSpace($membershipNumber) -or [string]::IsNullOrWhiteSpace($memberSinceStr) -or [string]::IsNullOrWhiteSpace($paidUntilStr)) {
            continue
        }

        try {
            $memberSince = [DateTime]::ParseExact($memberSinceStr, "dd/MM/yyyy", $null)
            $paidUntil = [DateTime]::ParseExact($paidUntilStr, "dd/MM/yyyy", $null)
            $amount = if ([string]::IsNullOrWhiteSpace($amountStr)) { 0 } else { [decimal]$amountStr }
            
            if ($paidUntil -lt $memberSince) { continue }

            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "SELECT Id FROM MemberProfiles WHERE MembershipNumber = @mn"
            $cmd.Parameters.AddWithValue("@mn", $membershipNumber) | Out-Null
            $memberProfileId = $cmd.ExecuteScalar()

            if ($null -eq $memberProfileId) { continue }

            $months = Get-MonthsBetween $memberSince $paidUntil
            Write-Host ("[" + $count + "] " + $membershipNumber + " (" + $months.Count + " months)")

            if ($months.Count -gt 0) {
                # 1. Delete existing historical payments for this user
                $delCmd = $conn.CreateCommand()
                $delCmd.CommandText = "DELETE FROM Payments WHERE MemberProfileId = @pid AND Description = 'Migração histórica (Pago até)'"
                $delCmd.Parameters.AddWithValue("@pid", $memberProfileId) | Out-Null
                $delCmd.ExecuteNonQuery() | Out-Null

                # 2. Build batch insert
                $sqlBase = "INSERT INTO Payments (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status, Description, PeriodMonth, PeriodYear, CreatedAt) VALUES "
                $valuesList = New-Object System.Collections.Generic.List[string]
                
                $insBatchCmd = $conn.CreateCommand()
                $insBatchCmd.Parameters.AddWithValue("@pid", $memberProfileId) | Out-Null
                $insBatchCmd.Parameters.AddWithValue("@amt", $amount) | Out-Null
                $insBatchCmd.Parameters.AddWithValue("@pdate", [DateTime]::UtcNow) | Out-Null
                $insBatchCmd.Parameters.AddWithValue("@desc", "Migração histórica (Pago até)") | Out-Null
                $insBatchCmd.Parameters.AddWithValue("@cat", [DateTime]::UtcNow) | Out-Null

                foreach ($m in $months) {
                    $valuesList.Add("(@pid, @amt, @pdate, 'Manual', 'Completed', @desc, " + $m.Month + ", " + $m.Year + ", @cat)")
                }

                $insBatchCmd.CommandText = $sqlBase + [string]::Join(", ", $valuesList)
                $insBatchCmd.ExecuteNonQuery() | Out-Null
                $totalPayments += $months.Count
            }
            $count++
        } catch {
            Write-Host ("Error processing user " + $membershipNumber + " at row " + $i + ": " + $_.Exception.Message)
            $errors++
            continue
        }
    }
    Write-Host ("`nMigration finished. Total users: " + $count + ". Total payments: " + $totalPayments + ". Total errors: " + $errors + ".")
}
finally {
    $conn.Close()
}
