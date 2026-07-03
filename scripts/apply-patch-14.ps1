$path = "app/page.tsx"
$content = Get-Content $path -Raw -Encoding UTF8

# Ratio display: keep only one decimal place.
$content = $content -replace 'maximumFractionDigits:2', 'maximumFractionDigits:1'

# Remove duplicate success notice after lock/unlock. Error messages still remain.
$content = $content -replace 'await loadMonth\(\);setMessage\(status==="LOCKED"\?"Month locked\.":"Month unlocked\."\)', 'await loadMonth();setMessage("")'

# Use native month picker instead of text input for month selection.
$content = $content -replace '<input value=\{month\} onChange=\{e=>setMonth\(e\.target\.value\)\}/>', '<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/>'

# Shorten Review title to reduce wrapping on mobile.
$content = $content -replace 'Month review - \{month\}', 'Review - {month}'

# Stronger modal scroll lock: add class as well as overflow style.
$content = $content -replace 'useEffect\(\(\)=>\{document\.body\.style\.overflow=modalOpen\?"hidden":"";return\(\)=>\{document\.body\.style\.overflow=""\}\},\[modalOpen\]\);', 'useEffect(()=>{document.body.style.overflow=modalOpen?"hidden":"";document.body.classList.toggle("modal-open",modalOpen);return()=>{document.body.style.overflow="";document.body.classList.remove("modal-open")}},[modalOpen]);'

Set-Content $path $content -Encoding UTF8
Write-Host "Patch 14 page tweaks applied."
