$excel = New-Object -ComObject Excel.Application
$wb = $excel.Workbooks.Open("C:\Users\migue\Documents\GitHub\cdp\RadGridExport.xls")
$wb.SaveAs("C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv", 6)
$wb.Close($false)
$excel.Quit()
