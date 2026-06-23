# Generatore PDF "fatto a mano" (PDF 1.4, font standard Helvetica, no embedding).
# Legge scripts/schemi-orale.txt (UTF-8) e produce public/schemi-orale-letteratura.pdf.
# Usa System.Drawing solo per MISURARE le stringhe (word-wrap); il PDF e' scritto
# byte per byte. ASCII-only nel codice: il testo con accenti arriva dal .txt.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root        = 'c:\Users\Administrator\Documents\AP'
$contentPath = Join-Path $root 'scripts\schemi-orale.txt'
$pdfPath     = Join-Path $root 'public\schemi-orale-letteratura.pdf'

# ---- geometria pagina (punti tipografici, 72 = 1 pollice) ----
$script:PW = 595.0; $script:PH = 842.0          # A4
$script:ML = 56.0;  $script:MR = 56.0
$script:MT = 58.0;  $script:MB = 58.0
$script:contentW = $script:PW - $script:ML - $script:MR

# ---- colori (r g b in 0..1) ----
$cViolet   = @(0.357,0.294,0.839)   # #5B4BD6
$cBody     = @(0.13,0.14,0.18)
$cHeading  = @(0.10,0.10,0.18)
$cMeta     = @(0.42,0.40,0.55)
$cQuestion = @(0.22,0.17,0.42)

# ---- misura testo via GDI (Arial ~ Helvetica) ----
$bmp = New-Object System.Drawing.Bitmap -ArgumentList 8,8
$script:g = [System.Drawing.Graphics]::FromImage($bmp)
$script:g.PageUnit = [System.Drawing.GraphicsUnit]::Point
$script:fmt = [System.Drawing.StringFormat]::GenericTypographic
$script:fontCache = @{}
function GetFont([single]$size,[string]$style){
  $key = "$size|$style"
  if(-not $script:fontCache.ContainsKey($key)){
    $fs = [System.Drawing.FontStyle]::Regular
    if($style -eq 'B'){ $fs = [System.Drawing.FontStyle]::Bold }
    elseif($style -eq 'I'){ $fs = [System.Drawing.FontStyle]::Italic }
    $script:fontCache[$key] = New-Object System.Drawing.Font -ArgumentList 'Arial',$size,$fs,([System.Drawing.GraphicsUnit]::Point)
  }
  return $script:fontCache[$key]
}
function MeasureW([string]$t,[single]$size,[string]$style){
  if([string]::IsNullOrEmpty($t)){ return 0.0 }
  $f = GetFont $size $style
  return [double]$script:g.MeasureString($t,$f,100000,$script:fmt).Width
}
function WrapText([string]$text,[single]$size,[string]$style,[double]$maxW){
  $out = New-Object System.Collections.ArrayList
  $words = $text -split ' '
  $cur = ''
  foreach($w in $words){
    if($w -eq ''){ continue }
    $try = if($cur -eq ''){ $w } else { "$cur $w" }
    if((MeasureW $try $size $style) -le $maxW){ $cur = $try }
    else {
      if($cur -ne ''){ [void]$out.Add($cur) }
      $cur = $w
    }
  }
  if($cur -ne ''){ [void]$out.Add($cur) }
  if($out.Count -eq 0){ [void]$out.Add('') }
  return $out
}

# ---- pagine come liste di record ----
$script:pages = New-Object System.Collections.ArrayList
$script:cur   = New-Object System.Collections.ArrayList
[void]$script:pages.Add($script:cur)
$script:y = $script:MT
function NewPage(){
  $script:cur = New-Object System.Collections.ArrayList
  [void]$script:pages.Add($script:cur)
  $script:y = $script:MT
}
function AddBlock([string]$text,[single]$size,[string]$style,$color,[double]$indent,[double]$spBefore,[double]$spAfter,[double]$lf,[bool]$center){
  $script:y += $spBefore
  $maxW = $script:contentW - $indent
  $lines = WrapText $text $size $style $maxW
  $lh = $size * $lf
  $fontKey = if($style -eq 'B'){'F2'} elseif($style -eq 'I'){'F3'} else {'F1'}
  foreach($ln in $lines){
    if(($script:y + $lh) -gt ($script:PH - $script:MB)){ NewPage }
    $x = $script:ML + $indent
    if($center){ $w = MeasureW $ln $size $style; $x = ($script:PW - $w)/2.0 }
    [void]$script:cur.Add(@{ K='t'; T=$ln; X=$x; Y=$script:y; Size=$size; Font=$fontKey; CR=$color[0]; CG=$color[1]; CB=$color[2] })
    $script:y += $lh
  }
  $script:y += $spAfter
}
function AddRule($color,[double]$spBefore,[double]$spAfter){
  $script:y += $spBefore
  $h = 1.4
  if(($script:y + $h) -gt ($script:PH - $script:MB)){ NewPage }
  [void]$script:cur.Add(@{ K='r'; X=$script:ML; Y=$script:y; W=$script:contentW; H=$h; CR=$color[0]; CG=$color[1]; CB=$color[2] })
  $script:y += $h + $spAfter
}

# ---- parse del contenuto ----
$raw   = [System.IO.File]::ReadAllText($contentPath, [System.Text.Encoding]::UTF8)
$lines = ($raw -replace "`r",'') -split "`n"
$seenQ = $false

foreach($line in $lines){
  if($line.StartsWith('#TITLE ')){
    AddBlock $line.Substring(7) 23 'B' $cViolet 0 4 6 1.2 $true
  }
  elseif($line.StartsWith('#SUB ')){
    AddBlock $line.Substring(5) 10.5 'I' $cMeta 0 0 22 1.3 $true
  }
  elseif($line.StartsWith('#MOD ')){
    $seenQ = $false
    if(($script:y + 78) -gt ($script:PH - $script:MB)){ NewPage }
    AddBlock $line.Substring(5) 15 'B' $cViolet 0 16 2 1.2 $false
    AddRule $cViolet 1 9
  }
  elseif($line.StartsWith('#META ')){
    AddBlock $line.Substring(6) 9.5 'I' $cMeta 0 0 10 1.3 $false
  }
  elseif($line.StartsWith('#H ')){
    AddBlock $line.Substring(3) 11.5 'B' $cHeading 0 5 3 1.25 $false
  }
  elseif($line.StartsWith('#> ')){
    AddBlock $line.Substring(3) 11 'I' $cViolet 14 2 8 1.4 $false
  }
  elseif($line.StartsWith('#Q ')){
    if(-not $seenQ){
      AddBlock 'Domande tipiche all''orale' 10 'B' $cViolet 0 8 4 1.25 $false
      $seenQ = $true
    }
    AddBlock ('D.  ' + $line.Substring(3)) 10.5 'B' $cQuestion 0 0 3 1.3 $false
  }
  elseif($line.Trim() -ne ''){
    AddBlock $line 10.5 'R' $cBody 0 0 8 1.42 $false
  }
}

# ---- helpers PDF ----
function NumInv([double]$v){ return [string]::Format([System.Globalization.CultureInfo]::InvariantCulture,'{0:0.###}',$v) }
function EscPdf([string]$s){ return $s.Replace('\','\\').Replace('(','\(').Replace(')','\)') }

# content stream per pagina
$pageStreams = New-Object System.Collections.ArrayList
foreach($pg in $script:pages){
  $sb = New-Object System.Text.StringBuilder
  foreach($r in $pg){
    if($r.K -eq 'r'){
      $pdfY = $script:PH - ($r.Y + $r.H)
      [void]$sb.Append((NumInv $r.CR)+' '+(NumInv $r.CG)+' '+(NumInv $r.CB)+" rg`n")
      [void]$sb.Append((NumInv $r.X)+' '+(NumInv $pdfY)+' '+(NumInv $r.W)+' '+(NumInv $r.H)+" re f`n")
    } else {
      $pdfY = $script:PH - ($r.Y + ($r.Size * 0.80))
      $t = EscPdf $r.T
      [void]$sb.Append((NumInv $r.CR)+' '+(NumInv $r.CG)+' '+(NumInv $r.CB)+" rg`n")
      [void]$sb.Append('BT /'+$r.Font+' '+(NumInv $r.Size)+' Tf '+(NumInv $r.X)+' '+(NumInv $pdfY)+' Td ('+$t+') Tj ET'+"`n")
    }
  }
  [void]$pageStreams.Add($sb.ToString())
}

$n   = $script:pages.Count
$enc = [System.Text.Encoding]::GetEncoding(1252)
$ms  = New-Object System.IO.MemoryStream
function W([string]$s){ $b = $enc.GetBytes($s); $ms.Write($b,0,$b.Length) }
$offsets = @{}
function StartObj([int]$num){ $offsets[$num] = [int]$ms.Length; W ("$num 0 obj`n") }

# header (con commento binario)
W "%PDF-1.4`n"
W ('%' + [char]0xE2 + [char]0xE3 + [char]0xCF + [char]0xD3 + "`n")

# 1 Catalog, 2 Pages, 3-5 Font
StartObj 1; W "<< /Type /Catalog /Pages 2 0 R >>`nendobj`n"

$kids = @()
for($i=0; $i -lt $n; $i++){ $kids += (''+(6 + $i*2)+' 0 R') }
StartObj 2; W ("<< /Type /Pages /Count $n /Kids [ " + ($kids -join ' ') + " ] >>`nendobj`n")

StartObj 3; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`nendobj`n"
StartObj 4; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`nendobj`n"
StartObj 5; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`nendobj`n"

# pagine + contenuti
for($i=0; $i -lt $n; $i++){
  $pageNum = 6 + $i*2
  $contNum = 7 + $i*2
  StartObj $pageNum
  W ("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + (NumInv $script:PW) + ' ' + (NumInv $script:PH) + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents $contNum 0 R >>`nendobj`n")
  $content = $pageStreams[$i]
  $clen = $enc.GetBytes($content).Length
  StartObj $contNum
  W ("<< /Length $clen >>`nstream`n")
  W $content
  W "`nendstream`nendobj`n"
}

# xref
$maxObj = 5 + $n*2
$size   = $maxObj + 1
$xrefOffset = [int]$ms.Length
W "xref`n"
W ("0 $size`n")
W ('{0:D10} {1:D5} f ' -f 0,65535); W "`n"
for($num=1; $num -le $maxObj; $num++){
  W ('{0:D10} 00000 n ' -f $offsets[$num]); W "`n"
}
W "trailer`n"
W ("<< /Size $size /Root 1 0 R >>`n")
W "startxref`n"
W ("$xrefOffset`n")
W "%%EOF`n"

[System.IO.File]::WriteAllBytes($pdfPath, $ms.ToArray())
$ms.Dispose()

$kb = [math]::Round((Get-Item $pdfPath).Length / 1KB, 1)
Write-Output ("OK: $pdfPath  |  pagine: $n  |  oggetti: $maxObj  |  dimensione: $kb KB")
