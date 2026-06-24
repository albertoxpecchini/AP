# =============================================================================
#  CV PDF generator - "dark premium" (PDF 1.4, hand-written byte by byte).
#  No Python / Node required: uses only PowerShell + System.Drawing.
#  Reads scripts/cv-data.json (UTF-8) and writes public/cv-alberto-pecchini.pdf.
#  Style matches the website: deep dark background, violet accent, glass chips.
#  ASCII-only source: all accented text comes from the JSON (read as UTF-8).
# =============================================================================
param([switch]$Preview)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root     = 'c:\Users\Administrator\Documents\AP'
$dataPath = Join-Path $root 'scripts\cv-data.json'
$photoPath= Join-Path $root 'public\alberto-pecchini.jpg'
$outPath  = Join-Path $root 'public\cv-alberto-pecchini.pdf'

$raw  = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
$data = $raw | ConvertFrom-Json

# ---- page geometry (points; 72 = 1 inch) -----------------------------------
$PW = 595.28; $PH = 841.89
$SIDE_W = 200.0
$SPAD = 20.0
$SIN  = $SIDE_W - 2*$SPAD                       # sidebar inner width
$MX0 = $SIDE_W + 28.0; $MR = 38.0               # main column, page 1
$MW0 = $PW - $MX0 - $MR
$MX1 = 46.0                                     # main column, later pages
$MW1 = $PW - $MX1 - $MR
$MT0 = 50.0; $MT1 = 78.0; $MB = 48.0

# ---- palette (r g b in 0..1) -----------------------------------------------
$cBgDeep   = @(0.043,0.059,0.078)   # #0b0f14
$cSideBg   = @(0.082,0.063,0.122)   # #15101f
$cAccent   = @(0.545,0.482,1.000)   # #8b7bff
$cAccentDp = @(0.357,0.294,0.839)   # #5b4bd6
$cInk      = @(0.769,0.647,1.000)   # #c4a5ff
$cText     = @(0.910,0.933,0.957)   # #e8eef4
$cSub      = @(0.655,0.698,0.741)   # #a7b2bd
$cWhite    = @(1,1,1)
$cChipBg   = @(0.129,0.110,0.227)   # #211c3a
$cChipBd   = @(0.231,0.196,0.392)   # #3b3264
$cSideLbl  = @(0.608,0.525,0.839)   # muted violet label
$cHair     = @(0.180,0.160,0.290)   # faint violet hairline
$cSideChip = @(0.160,0.135,0.270)

# ---- text measuring via GDI (Arial ~ Helvetica) ----------------------------
$bmpM = New-Object System.Drawing.Bitmap -ArgumentList 8,8
$gM   = [System.Drawing.Graphics]::FromImage($bmpM)
$gM.PageUnit = [System.Drawing.GraphicsUnit]::Point
$fmtM = [System.Drawing.StringFormat]::GenericTypographic
$fontCache = @{}
function GetFont([single]$size,[string]$style){
  $key = "$size|$style"
  if(-not $fontCache.ContainsKey($key)){
    $fs = [System.Drawing.FontStyle]::Regular
    if($style -eq 'B'){ $fs = [System.Drawing.FontStyle]::Bold }
    elseif($style -eq 'I'){ $fs = [System.Drawing.FontStyle]::Italic }
    $fontCache[$key] = New-Object System.Drawing.Font -ArgumentList 'Arial',$size,$fs,([System.Drawing.GraphicsUnit]::Point)
  }
  return $fontCache[$key]
}
function MeasureW([string]$t,[single]$size,[string]$style){
  if([string]::IsNullOrEmpty($t)){ return 0.0 }
  return [double]$gM.MeasureString($t,(GetFont $size $style),100000,$fmtM).Width
}
function WrapText([string]$text,[single]$size,[string]$style,[double]$maxW){
  $out = New-Object System.Collections.ArrayList
  $cur = ''
  foreach($w in ($text -split ' ')){
    if($w -eq ''){ continue }
    $try = if($cur -eq ''){ $w } else { "$cur $w" }
    if((MeasureW $try $size $style) -le $maxW){ $cur = $try }
    else { if($cur -ne ''){ [void]$out.Add($cur) }; $cur = $w }
  }
  if($cur -ne ''){ [void]$out.Add($cur) }
  if($out.Count -eq 0){ [void]$out.Add('') }
  return $out
}

# ---- prepare the circular photo: clean square baseline JPEG (DCTDecode) -----
function BuildPhotoJpeg([string]$path,[int]$dim){
  $src  = [System.Drawing.Image]::FromFile($path)
  try {
    $side = [Math]::Min($src.Width,$src.Height)
    $left = [int](($src.Width  - $side)/2)
    $top  = [int](($src.Height - $side)*0.30)   # face a touch high
    $bmp  = New-Object System.Drawing.Bitmap -ArgumentList $dim,$dim
    $g    = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $dst  = New-Object System.Drawing.Rectangle -ArgumentList 0,0,$dim,$dim
    $g.DrawImage($src,$dst,$left,$top,$side,$side,[System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
    $ep = New-Object System.Drawing.Imaging.EncoderParameters -ArgumentList 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter -ArgumentList ([System.Drawing.Imaging.Encoder]::Quality),([long]90)
    $msi = New-Object System.IO.MemoryStream
    $bmp.Save($msi,$codec,$ep)
    $bmp.Dispose()
    return $msi.ToArray()
  } finally { $src.Dispose() }
}
$PHOTO_DIM = 600
$jpegBytes = BuildPhotoJpeg $photoPath $PHOTO_DIM

# ---- draw-op model ----------------------------------------------------------
# Each page is an ArrayList of op hashtables. Y stored top-down (converted on emit).
$Pages = New-Object System.Collections.ArrayList
function RectOp($pg,$x,$y,$w,$h,$col){
  [void]$pg.Add(@{K='r'; X=$x; Y=$y; W=$w; H=$h; CR=$col[0]; CG=$col[1]; CB=$col[2]})
}
function RRectOp($pg,$x,$y,$w,$h,$r,$fill,$stroke,$lw){
  $op = @{K='rr'; X=$x; Y=$y; W=$w; H=$h; R=$r; FR=$fill[0]; FG=$fill[1]; FB=$fill[2]; LW=$lw; HS=$false}
  if($stroke -ne $null){ $op.HS=$true; $op.SR=$stroke[0]; $op.SG=$stroke[1]; $op.SB=$stroke[2] }
  [void]$pg.Add($op)
}
function TextOp($pg,$x,$y,$size,$font,$col,[string]$t){
  [void]$pg.Add(@{K='t'; T=$t; X=$x; Y=$y; Size=$size; Font=$font; CR=$col[0]; CG=$col[1]; CB=$col[2]})
}
function FontKey([string]$style){ if($style -eq 'B'){'F2'} elseif($style -eq 'I'){'F3'} else {'F1'} }

# ---- page backgrounds -------------------------------------------------------
function DrawBg($pg,[bool]$first){
  RectOp $pg 0 0 $PW $PH $cBgDeep
  if($first){
    RectOp $pg 0 0 $SIDE_W $PH $cSideBg
    RectOp $pg ($SIDE_W-2.0) 0 2.0 $PH $cAccent
  } else {
    RectOp $pg 0 0 9.0 $PH $cSideBg
    RectOp $pg 9.0 0 2.0 $PH $cAccent
    TextOp $pg $MX1 30.0 8.0 'F2' $cSub 'ALBERTO PECCHINI'
    $rt = 'Curriculum Vitae'
    $rw = MeasureW $rt 8 'R'
    TextOp $pg ($PW-$MR-$rw) 30.0 8.0 'F1' $cSub $rt
    RectOp $pg $MX1 40.0 ($PW-$MX1-$MR) 0.8 $cHair
  }
}

# ---- main column flow (auto page-break) ------------------------------------
$script:miIdx = 0
$script:my    = $MT0
$script:curPage = $null
function MainX0  { if($script:miIdx -eq 0){ $MX0 } else { $MX1 } }
function MainW   { if($script:miIdx -eq 0){ $MW0 } else { $MW1 } }
function MainNewPage {
  $pg = New-Object System.Collections.ArrayList
  DrawBg $pg $false
  [void]$Pages.Add($pg)
  $script:curPage = $pg
  $script:miIdx = $Pages.Count-1
  $script:my = $MT1
}
function MainEnsure([double]$need){
  if(($script:my + $need) -gt ($PH - $MB)){ MainNewPage }
}
function MainText([string]$text,[single]$size,[string]$style,$col,[double]$indent,[double]$spB,[double]$spA,[double]$lf){
  $script:my += $spB
  $maxW = (MainW) - $indent
  $lines = WrapText $text $size $style $maxW
  $lh = $size * $lf
  $fk = FontKey $style
  foreach($ln in $lines){
    MainEnsure $lh
    TextOp $script:curPage ((MainX0)+$indent) $script:my $size $fk $col $ln
    $script:my += $lh
  }
  $script:my += $spA
}
function MainRule($col,[double]$spB,[double]$spA){
  $script:my += $spB
  MainEnsure 2
  RectOp $script:curPage (MainX0) $script:my (MainW) 1.0 $col
  $script:my += 1.0 + $spA
}
function MainSection([string]$text){
  $script:my += 11
  MainEnsure 24
  $x0 = MainX0
  RectOp $script:curPage $x0 ($script:my+1.5) 6 6 $cAccent
  TextOp $script:curPage ($x0+12) $script:my 11.5 'F2' $cInk $text.ToUpper()
  $script:my += 16
  RectOp $script:curPage $x0 $script:my (MainW) 0.8 $cHair
  $script:my += 7
}
function MainChips($items,[single]$fs,$fg,$bg,$bd,[double]$hpad,[double]$vpad,[double]$gx,[double]$gy,[double]$rad){
  $chipH = $fs + 2*$vpad
  MainEnsure $chipH
  $x0 = MainX0; $maxW = MainW
  $curx = $x0; $rowTop = $script:my
  foreach($it in $items){
    $w = (MeasureW $it $fs 'R') + 2*$hpad
    if(($curx -ne $x0) -and (($curx + $gx + $w) -gt ($x0 + $maxW))){
      $curx = $x0; $rowTop += $chipH + $gy
      if(($rowTop + $chipH) -gt ($PH - $MB)){ MainNewPage; $x0 = MainX0; $maxW = MainW; $curx = $x0; $rowTop = $script:my }
    }
    RRectOp $script:curPage $curx $rowTop $w $chipH $rad $bg $bd 0.7
    TextOp  $script:curPage ($curx+$hpad) ($rowTop+$vpad) $fs 'F1' $fg $it
    $curx += $w + $gx
  }
  $script:my = $rowTop + $chipH
}

# ---- sidebar (page 1 only, fixed column, no page-break) --------------------
$script:sy = 30.0
$SX = $SPAD
function SidePhoto([double]$dim){
  $cx = $SIDE_W/2.0
  $x  = $cx - $dim/2.0
  [void]$Pages[0].Add(@{K='ph'; X=$x; Y=$script:sy; D=$dim})
  $script:sy += $dim + 16
}
function SideTitle([string]$t){
  $script:sy += 2
  TextOp $Pages[0] $SX $script:sy 9.5 'F2' $cWhite $t.ToUpper()
  $script:sy += 14
}
function SideRule {
  $script:sy += 6
  RectOp $Pages[0] $SX $script:sy $SIN 0.7 $cHair
  $script:sy += 9
}
function SideText([string]$t,[single]$size,[string]$style,$col,[double]$spA){
  $lines = WrapText $t $size $style $SIN
  $lh = $size * 1.28
  foreach($ln in $lines){
    TextOp $Pages[0] $SX $script:sy $size (FontKey $style) $col $ln
    $script:sy += $lh
  }
  $script:sy += $spA
}
function SideChips($items,[single]$fs){
  $hpad=6.0; $vpad=3.2; $gx=4.0; $gy=4.0; $rad=5.0
  $chipH = $fs + 2*$vpad
  $curx = $SX; $rowTop = $script:sy
  foreach($it in $items){
    $w = (MeasureW $it $fs 'R') + 2*$hpad
    if(($curx -ne $SX) -and (($curx + $gx + $w) -gt ($SX + $SIN))){
      $curx = $SX; $rowTop += $chipH + $gy
    }
    RRectOp $Pages[0] $curx $rowTop $w $chipH $rad $cSideChip $cChipBd 0.7
    TextOp  $Pages[0] ($curx+$hpad) ($rowTop+$vpad) $fs 'F1' $cText $it
    $curx += $w + $gx
  }
  $script:sy = $rowTop + $chipH + 2
}
function SideLang([string]$name,[string]$lvl,[double]$frac){
  TextOp $Pages[0] $SX $script:sy 8.8 'F2' $cWhite $name
  $lw = MeasureW $name 8.8 'B'
  TextOp $Pages[0] ($SX+$lw+5) ($script:sy+0.4) 7.5 'F1' $cSideLbl ("/ "+$lvl)
  $script:sy += 12
  RectOp $Pages[0] $SX $script:sy $SIN 3.0 $cSideChip
  RectOp $Pages[0] $SX $script:sy ($SIN*$frac) 3.0 $cAccent
  $script:sy += 10
}
function SideBullet([string]$t){
  TextOp $Pages[0] $SX ($script:sy+0.5) 8.4 'F2' $cAccent '+'
  SideTextIndent $t 8.4 $cText 12.0 3.0
}
function SideTextIndent([string]$t,[single]$size,$col,[double]$indent,[double]$spA){
  $lines = WrapText $t $size 'R' ($SIN-$indent)
  $lh = $size * 1.3
  foreach($ln in $lines){
    TextOp $Pages[0] ($SX+$indent) $script:sy $size 'F1' $col $ln
    $script:sy += $lh
  }
  $script:sy += $spA
}

# =============================================================================
#  BUILD
# =============================================================================
$pg0 = New-Object System.Collections.ArrayList
DrawBg $pg0 $true
[void]$Pages.Add($pg0)

# ----- sidebar -----
SidePhoto 120
SideTitle 'Contatti'
foreach($c in $data.contacts){
  TextOp $Pages[0] $SX $script:sy 6.6 'F2' $cSideLbl ($c[0].ToUpper())
  $script:sy += 9
  SideText $c[1] 8.6 'R' $cWhite 4
}
SideRule
SideTitle 'Lingue'
foreach($l in $data.languages){ SideLang $l[0] $l[1] ([double]$l[2]) }
SideRule
SideTitle 'Patente'
SideChips $data.patente 7.8
$script:sy += 4
SideTitle 'Alla guida di'
SideChips $data.guida 7.8
SideRule
SideTitle 'Punti di forza'
SideChips $data.strengths 7.8
SideRule
SideTitle ('Disponibilit' + [char]0xE0)
foreach($a in $data.availability){ SideBullet $a }
SideRule
SideTitle 'Nel cassetto'
SideText $data.wishlist 8.2 'I' $cSideLbl 0

# ----- main column -----
$script:miIdx = 0
$script:my = $MT0
$script:curPage = $Pages[0]
TextOp $script:curPage (MainX0) $script:my 25 'F2' $cText $data.name
$script:my += 27
TextOp $script:curPage (MainX0) $script:my 12.5 'F1' $cInk $data.role
$script:my += 16
MainText $data.tagline 8.6 'R' $cSub 0 0 0 1.25
MainRule $cHair 6 8

MainSection 'Profilo'
MainText $data.profile 9.4 'R' $cText 0 0 2 1.42

MainSection 'Competenze tecniche'
foreach($s in $data.skills){
  MainText $s[0] 9.2 'B' $cText 0 4 4 1.2
  MainChips $s[1] 8.3 $cInk $cChipBg $cChipBd 8 3.6 5 5 6
  $script:my += 3
}

MainSection 'Esperienze & progetti'
foreach($e in $data.experience){
  MainText $e.period 7.6 'B' $cInk 0 5 2 1.2
  MainText $e.title  10.5 'B' $cText 0 0 1 1.22
  MainText $e.role   9.0 'B' $cAccent 0 0 2 1.25
  MainText $e.desc   9.0 'R' $cSub 0 0 0 1.36
  if($e.link){ MainText ("> " + $e.link) 8.4 'B' $cInk 0 1 0 1.2 }
  $script:my += 3
}

MainSection 'Formazione'
foreach($e in $data.education){
  MainText $e.period 7.6 'B' $cInk 0 5 2 1.2
  MainText $e.title  10.5 'B' $cText 0 0 1 1.22
  MainText $e.role   9.0 'B' $cAccent 0 0 2 1.25
  MainText $e.desc   9.0 'R' $cSub 0 0 0 1.36
  $script:my += 3
}

MainSection 'Esperienze internazionali'
foreach($e in $data.travel){
  MainText $e.period 7.6 'B' $cInk 0 5 2 1.2
  MainText $e.title  10.5 'B' $cText 0 0 1 1.22
  MainText $e.role   9.0 'B' $cAccent 0 0 2 1.25
  MainText $e.desc   9.0 'R' $cSub 0 0 0 1.36
  $script:my += 3
}

MainSection ('Volontariato & attivit' + [char]0xE0 + ' extra')
foreach($e in $data.volunteer){
  MainText $e.period 7.6 'B' $cInk 0 5 2 1.2
  MainText $e.title  10.5 'B' $cText 0 0 1 1.22
  MainText $e.role   9.0 'B' $cAccent 0 0 2 1.25
  MainText $e.desc   9.0 'R' $cSub 0 0 0 1.36
  $script:my += 3
}

MainRule $cHair 6 5
MainText $data.privacy 7.2 'I' $cSub 0 0 0 1.36

# =============================================================================
#  EMIT  (build content streams, then assemble the PDF objects)
# =============================================================================
function N([double]$v){ [string]::Format([System.Globalization.CultureInfo]::InvariantCulture,'{0:0.###}',$v) }
function EscPdf([string]$s){ return $s.Replace('\','\\').Replace('(','\(').Replace(')','\)') }
$KAPPA = 0.5522847498

function AppendCircle($sb,[double]$cx,[double]$cy,[double]$r){
  $k = $r*$KAPPA
  [void]$sb.Append((N ($cx+$r))+' '+(N $cy)+" m`n")
  [void]$sb.Append((N ($cx+$r))+' '+(N ($cy+$k))+' '+(N ($cx+$k))+' '+(N ($cy+$r))+' '+(N $cx)+' '+(N ($cy+$r))+" c`n")
  [void]$sb.Append((N ($cx-$k))+' '+(N ($cy+$r))+' '+(N ($cx-$r))+' '+(N ($cy+$k))+' '+(N ($cx-$r))+' '+(N $cy)+" c`n")
  [void]$sb.Append((N ($cx-$r))+' '+(N ($cy-$k))+' '+(N ($cx-$k))+' '+(N ($cy-$r))+' '+(N $cx)+' '+(N ($cy-$r))+" c`n")
  [void]$sb.Append((N ($cx+$k))+' '+(N ($cy-$r))+' '+(N ($cx+$r))+' '+(N ($cy-$k))+' '+(N ($cx+$r))+' '+(N $cy)+" c`n")
  [void]$sb.Append("h`n")
}
function AppendRoundRect($sb,[double]$x,[double]$y,[double]$w,[double]$h,[double]$r){
  $x2=$x+$w; $y2=$y+$h
  [void]$sb.Append((N ($x+$r))+' '+(N $y)+" m`n")
  [void]$sb.Append((N ($x2-$r))+' '+(N $y)+" l`n")
  [void]$sb.Append((N $x2)+' '+(N $y)+' '+(N $x2)+' '+(N $y)+' '+(N $x2)+' '+(N ($y+$r))+" c`n")
  [void]$sb.Append((N $x2)+' '+(N ($y2-$r))+" l`n")
  [void]$sb.Append((N $x2)+' '+(N $y2)+' '+(N $x2)+' '+(N $y2)+' '+(N ($x2-$r))+' '+(N $y2)+" c`n")
  [void]$sb.Append((N ($x+$r))+' '+(N $y2)+" l`n")
  [void]$sb.Append((N $x)+' '+(N $y2)+' '+(N $x)+' '+(N $y2)+' '+(N $x)+' '+(N ($y2-$r))+" c`n")
  [void]$sb.Append((N $x)+' '+(N ($y+$r))+" l`n")
  [void]$sb.Append((N $x)+' '+(N $y)+' '+(N $x)+' '+(N $y)+' '+(N ($x+$r))+' '+(N $y)+" c`n")
  [void]$sb.Append("h`n")
}

$pageStreams = New-Object System.Collections.ArrayList
foreach($pg in $Pages){
  $sb = New-Object System.Text.StringBuilder
  foreach($r in $pg){
    switch($r.K){
      'r' {
        $pdfY = $PH - ($r.Y + $r.H)
        [void]$sb.Append((N $r.CR)+' '+(N $r.CG)+' '+(N $r.CB)+" rg`n")
        [void]$sb.Append((N $r.X)+' '+(N $pdfY)+' '+(N $r.W)+' '+(N $r.H)+" re f`n")
      }
      'rr' {
        $pdfY = $PH - ($r.Y + $r.H)
        AppendRoundRect $sb $r.X $pdfY $r.W $r.H $r.R
        if($r.HS){
          [void]$sb.Append((N $r.FR)+' '+(N $r.FG)+' '+(N $r.FB)+" rg`n")
          [void]$sb.Append((N $r.SR)+' '+(N $r.SG)+' '+(N $r.SB)+" RG`n")
          [void]$sb.Append((N $r.LW)+" w B`n")
        } else {
          [void]$sb.Append((N $r.FR)+' '+(N $r.FG)+' '+(N $r.FB)+" rg f`n")
        }
      }
      't' {
        $pdfY = $PH - ($r.Y + ($r.Size * 0.80))
        $t = EscPdf $r.T
        [void]$sb.Append((N $r.CR)+' '+(N $r.CG)+' '+(N $r.CB)+" rg`n")
        [void]$sb.Append('BT /'+$r.Font+' '+(N $r.Size)+' Tf '+(N $r.X)+' '+(N $pdfY)+' Td ('+$t+') Tj ET'+"`n")
      }
      'ph' {
        $D = $r.D
        $blY = $PH - ($r.Y + $D)
        $cx  = $r.X + $D/2.0
        $cy  = $PH - ($r.Y + $D/2.0)
        $rad = $D/2.0
        [void]$sb.Append("q`n")
        AppendCircle $sb $cx $cy $rad
        [void]$sb.Append("W n`n")
        [void]$sb.Append((N $D)+' 0 0 '+(N $D)+' '+(N $r.X)+' '+(N $blY)+" cm`n")
        [void]$sb.Append("/Im0 Do`n")
        [void]$sb.Append("Q`n")
        [void]$sb.Append((N $cAccent[0])+' '+(N $cAccent[1])+' '+(N $cAccent[2])+" RG`n")
        [void]$sb.Append("2.2 w`n")
        AppendCircle $sb $cx $cy $rad
        [void]$sb.Append("S`n")
      }
    }
  }
  [void]$pageStreams.Add($sb.ToString())
}

# ---- assemble objects -------------------------------------------------------
$n   = $Pages.Count
$enc = [System.Text.Encoding]::GetEncoding(1252)
$ms  = New-Object System.IO.MemoryStream
function W([string]$s){ $b = $enc.GetBytes($s); $ms.Write($b,0,$b.Length) }
function WB([byte[]]$b){ $ms.Write($b,0,$b.Length) }
$offsets = @{}
function StartObj([int]$num){ $offsets[$num] = [int]$ms.Length; W ("$num 0 obj`n") }

W "%PDF-1.4`n"
W ('%' + [char]0xE2 + [char]0xE3 + [char]0xCF + [char]0xD3 + "`n")

# obj 1 Catalog, 2 Pages, 3-5 Fonts, 6 Image, then pages/contents from 7
StartObj 1; W "<< /Type /Catalog /Pages 2 0 R >>`nendobj`n"

$kids = @()
for($i=0; $i -lt $n; $i++){ $kids += (''+(7 + $i*2)+' 0 R') }
StartObj 2; W ("<< /Type /Pages /Count $n /Kids [ " + ($kids -join ' ') + " ] >>`nendobj`n")

StartObj 3; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`nendobj`n"
StartObj 4; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`nendobj`n"
StartObj 5; W "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`nendobj`n"

StartObj 6
W ("<< /Type /XObject /Subtype /Image /Width $PHOTO_DIM /Height $PHOTO_DIM /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + $jpegBytes.Length + " >>`nstream`n")
WB $jpegBytes
W "`nendstream`nendobj`n"

$res = "<< /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /XObject << /Im0 6 0 R >> >>"
for($i=0; $i -lt $n; $i++){
  $pageNum = 7 + $i*2
  $contNum = 8 + $i*2
  StartObj $pageNum
  W ("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + (N $PW) + ' ' + (N $PH) + "] /Resources $res /Contents $contNum 0 R >>`nendobj`n")
  $content = $pageStreams[$i]
  $clen = $enc.GetBytes($content).Length
  StartObj $contNum
  W ("<< /Length $clen >>`nstream`n"); W $content; W "`nendstream`nendobj`n"
}

# ---- xref / trailer ---------------------------------------------------------
$maxObj = 6 + $n*2
$size   = $maxObj + 1
$xref   = [int]$ms.Length
W "xref`n"; W ("0 $size`n")
W ('{0:D10} {1:D5} f ' -f 0,65535); W "`n"
for($num=1; $num -le $maxObj; $num++){ W ('{0:D10} 00000 n ' -f $offsets[$num]); W "`n" }
W "trailer`n"; W ("<< /Size $size /Root 1 0 R >>`n")
W "startxref`n"; W ("$xref`n"); W "%%EOF`n"

[System.IO.File]::WriteAllBytes($outPath, $ms.ToArray())
$ms.Dispose()
$kb = [math]::Round((Get-Item $outPath).Length / 1KB, 1)
Write-Output ("OK: $outPath  |  pagine: $n  |  oggetti: $maxObj  |  foto: ${PHOTO_DIM}px " + [math]::Round($jpegBytes.Length/1KB,1) + " KB  |  totale: $kb KB")

# ---- optional PNG preview (System.Drawing) for visual QA --------------------
if($Preview){
  $previewDir = $env:CV_PREVIEW_DIR; if(-not $previewDir){ $previewDir = (Join-Path $root 'scripts') }
  $scale = 1.6
  $photoImg = [System.Drawing.Image]::FromStream((New-Object System.IO.MemoryStream(,$jpegBytes)))
  function Brush($col){ New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([int]($col[0]*255),[int]($col[1]*255),[int]($col[2]*255))) }
  function PvFont([single]$size,[string]$fk){
    $fs=[System.Drawing.FontStyle]::Regular
    if($fk -eq 'F2'){ $fs=[System.Drawing.FontStyle]::Bold } elseif($fk -eq 'F3'){ $fs=[System.Drawing.FontStyle]::Italic }
    New-Object System.Drawing.Font 'Arial',($size*$scale),$fs,([System.Drawing.GraphicsUnit]::Pixel)
  }
  $pi = 0
  foreach($pg in $Pages){
    $bw=[int]($PW*$scale); $bh=[int]($PH*$scale)
    $bmp = New-Object System.Drawing.Bitmap $bw,$bh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAlias
    foreach($r in $pg){
      switch($r.K){
        'r'  { $g.FillRectangle((Brush @($r.CR,$r.CG,$r.CB)), [single]($r.X*$scale),[single]($r.Y*$scale),[single]($r.W*$scale),[single]($r.H*$scale)) }
        'rr' {
          $path = New-Object System.Drawing.Drawing2D.GraphicsPath
          $x=$r.X*$scale; $y=$r.Y*$scale; $w=$r.W*$scale; $h=$r.H*$scale; $d=$r.R*2*$scale
          $path.AddArc($x,$y,$d,$d,180,90); $path.AddArc($x+$w-$d,$y,$d,$d,270,90)
          $path.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $path.AddArc($x,$y+$h-$d,$d,$d,90,90); $path.CloseFigure()
          $g.FillPath((Brush @($r.FR,$r.FG,$r.FB)), $path)
          if($r.HS){ $pen=New-Object System.Drawing.Pen -ArgumentList ((Brush @($r.SR,$r.SG,$r.SB)).Color),([single]($r.LW*$scale)); $g.DrawPath($pen,$path) }
        }
        't'  { $g.DrawString($r.T, (PvFont $r.Size $r.Font), (Brush @($r.CR,$r.CG,$r.CB)), [single]($r.X*$scale),[single]($r.Y*$scale)) }
        'ph' {
          $d=$r.D*$scale; $x=$r.X*$scale; $y=$r.Y*$scale
          $clip=New-Object System.Drawing.Drawing2D.GraphicsPath; $clip.AddEllipse($x,$y,$d,$d)
          $g.SetClip($clip); $g.DrawImage($photoImg,[single]$x,[single]$y,[single]$d,[single]$d); $g.ResetClip()
          $pen=New-Object System.Drawing.Pen -ArgumentList ((Brush $cAccent).Color),([single](2.2*$scale)); $g.DrawEllipse($pen,$x,$y,$d,$d)
        }
      }
    }
    $g.Dispose()
    $out = Join-Path $previewDir ("cv-preview-{0}.png" -f ($pi+1))
    $bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
    Write-Output "preview -> $out"
    $pi++
  }
  $photoImg.Dispose()
}
