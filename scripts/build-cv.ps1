# =============================================================================
#  CV PDF generator - "dark premium" su Kit Italia (AgID / Bootstrap Italia).
#  Tipografia AUTENTICA del kit: Titillium Web EMBEDDATA (TrueType, FontFile2),
#  palette dark-premium viola, struttura kit: fascia d'intestazione, "card",
#  "tag"/chip, section header, lista esperienze con marcatore d'accento.
#  Nessun Python / Node: solo PowerShell + System.Drawing (foto + preview).
#  Legge scripts/cv-data.<it|en|fr|de>.json (UTF-8) e genera un PDF per lingua:
#  public/cv-alberto-pecchini-<loc>.pdf (+ copia IT -> cv-alberto-pecchini.pdf).
#  Sorgente ASCII-only: il testo accentato arriva dal JSON (letto come UTF-8).
# =============================================================================
param([switch]$Preview)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root     = 'c:\Users\Administrator\Documents\AP'
$photoPath= Join-Path $root 'public\alberto-pecchini.jpg'
$fontDir  = Join-Path $root 'public\bootstrap-italia\fonts\Titillium_Web'

# Multilingua: un PDF per lingua. I dati stanno in scripts\cv-data.<loc>.json
# (stessa struttura, testo tradotto + blocco "ui" con le etichette di sezione).
# $data e $outPath vengono impostati per-lingua nel loop di BUILD, in fondo.
$LOCALES = @('it','en','fr','de')

# ---- page geometry (points; 72 = 1 inch) -----------------------------------
$PW = 595.28; $PH = 841.89
$BAND_H = 160.0                                 # fascia d'intestazione (pag.1)
$SIDE_W = 202.0                                 # rail sinistra (pag.1)
$ML = 40.0; $MR = 40.0                          # margini contenuto
$railX = 34.0; $railW = $SIDE_W - $railX - 20.0 # rail interno
$MX0 = $SIDE_W + 28.0; $MW0 = $PW - $MX0 - $MR  # colonna principale, pag.1
$MX1 = 46.0;           $MW1 = $PW - $MX1 - $MR  # colonna principale, pag.2+
$MT0 = $BAND_H + 24.0                            # top colonna, pag.1
$MT1 = 74.0; $MB = 44.0
$railTop = $BAND_H + 22.0

# ---- palette (r g b in 0..1) - dark premium viola --------------------------
$cBgDeep   = @(0.043,0.059,0.078)   # #0b0f14
$cSideBg   = @(0.082,0.063,0.122)   # #15101f
$cBand     = @(0.075,0.055,0.118)   # #130e1e  (fascia, leggermente diversa)
$cAccent   = @(0.545,0.482,1.000)   # #8b7bff
$cInk      = @(0.769,0.647,1.000)   # #c4a5ff
$cText     = @(0.910,0.933,0.957)   # #e8eef4
$cSub      = @(0.655,0.698,0.741)   # #a7b2bd
$cWhite    = @(1,1,1)
$cChipBg   = @(0.129,0.110,0.227)   # #211c3a
$cChipBd   = @(0.231,0.196,0.392)   # #3b3264
$cSideLbl  = @(0.612,0.529,0.843)   # etichetta viola tenue
$cHair     = @(0.180,0.160,0.290)   # hairline viola debole
$cSideChip = @(0.160,0.135,0.270)

# =============================================================================
#  FONT EMBEDDING - Titillium Web (TrueType, WinAnsi, FontFile2)
# =============================================================================
function U16([byte[]]$b,[int]$o){ return ([int]$b[$o] -shl 8) -bor [int]$b[$o+1] }
function S16([byte[]]$b,[int]$o){ $v = ([int]$b[$o] -shl 8) -bor [int]$b[$o+1]; if($v -ge 0x8000){ $v -= 0x10000 }; return $v }
function U32([byte[]]$b,[int]$o){ return [long](([uint32]$b[$o] -shl 24) -bor ([uint32]$b[$o+1] -shl 16) -bor ([uint32]$b[$o+2] -shl 8) -bor [uint32]$b[$o+3]) }
function S32([byte[]]$b,[int]$o){ $v = U32 $b $o; if($v -ge 0x80000000L){ $v -= 0x100000000L }; return $v }

$enc1252 = [System.Text.Encoding]::GetEncoding(1252)

function ParseFont([string]$path){
  $b = [System.IO.File]::ReadAllBytes($path)
  $numTables = U16 $b 4
  $tab = @{}
  for($i=0;$i -lt $numTables;$i++){ $r=12+$i*16; $tag=[System.Text.Encoding]::ASCII.GetString($b,$r,4); $tab[$tag]=@((U32 $b ($r+8)),(U32 $b ($r+12))) }
  $head=[int]$tab['head'][0]; $upm=U16 $b ($head+18)
  $xMin=S16 $b ($head+36); $yMin=S16 $b ($head+38); $xMax=S16 $b ($head+40); $yMax=S16 $b ($head+42)
  $hhea=[int]$tab['hhea'][0]; $asc=S16 $b ($hhea+4); $desc=S16 $b ($hhea+6); $numHM=U16 $b ($hhea+34)
  $hmtx=[int]$tab['hmtx'][0]
  # italic angle dal 'post'
  $ia=0.0; if($tab.ContainsKey('post')){ $post=[int]$tab['post'][0]; $ia=[math]::Round((S32 $b ($post+4))/65536.0,1) }
  # cap height da OS/2 (v>=2)
  $cap=700; if($tab.ContainsKey('OS/2')){ $os2=[int]$tab['OS/2'][0]; $ov=U16 $b $os2; if($ov -ge 2){ $c=S16 $b ($os2+88); if($c -gt 0){ $cap=$c } } }
  # cmap (3,1) o (3,0) format 4
  $cmap=[int]$tab['cmap'][0]; $nSub=U16 $b ($cmap+2); $best=-1; $best0=-1
  for($i=0;$i -lt $nSub;$i++){ $r=$cmap+4+$i*8; $plat=U16 $b $r; $eid=U16 $b ($r+2); $off=U32 $b ($r+4)
    if($plat -eq 3 -and $eid -eq 1){ $best=$cmap+[int]$off }
    elseif($plat -eq 3 -and $eid -eq 0){ $best0=$cmap+[int]$off }
  }
  if($best -lt 0){ $best=$best0 }
  $segX2=U16 $b ($best+6); $segCount=[int]($segX2/2)
  $endO=$best+14; $startO=$endO+$segX2+2; $deltaO=$startO+$segX2; $rangeO=$deltaO+$segX2
  $widths = New-Object int[] 256
  for($c=32;$c -le 255;$c++){
    $ch = $enc1252.GetString([byte[]]@([byte]$c)); $u=[int]$ch[0]; $g=0
    for($s=0;$s -lt $segCount;$s++){
      $end=U16 $b ($endO+$s*2)
      if($u -le $end){
        $start=U16 $b ($startO+$s*2)
        if($u -lt $start){ break }
        $delta=U16 $b ($deltaO+$s*2); $ro=U16 $b ($rangeO+$s*2)
        if($ro -eq 0){ $g=(($u+$delta) -band 0xFFFF) }
        else { $gi=$rangeO+$s*2+$ro+($u-$start)*2; $gg=U16 $b $gi; if($gg -ne 0){ $g=(($gg+$delta) -band 0xFFFF) } }
        break
      }
    }
    $gid=$g; if($gid -ge $numHM){ $gid=$numHM-1 }
    $widths[$c] = U16 $b ($hmtx + $gid*4)   # upm=1000 -> gia' in 1000-unita'
  }
  return [pscustomobject]@{
    bytes=$b; upm=$upm; bbox=@($xMin,$yMin,$xMax,$yMax)
    ascent=$asc; descent=$desc; italic=$ia; cap=$cap; widths=$widths
  }
}

# F1=Regular(400) F2=Bold(700) F3=Italic(400i) F4=SemiBold(600)
$FontDefs = @(
  @{ key='F1'; base='TitilliumWeb';          flags=32; stemv=82;  file='titillium-web-v10-latin-ext_latin-regular.ttf' },
  @{ key='F2'; base='TitilliumWeb-Bold';     flags=32; stemv=140; file='titillium-web-v10-latin-ext_latin-700.ttf' },
  @{ key='F3'; base='TitilliumWeb-Italic';   flags=96; stemv=82;  file='titillium-web-v10-latin-ext_latin-italic.ttf' },
  @{ key='F4'; base='TitilliumWeb-SemiBold'; flags=32; stemv=110; file='titillium-web-v10-latin-ext_latin-600.ttf' }
)
$FontWidths = @{}
foreach($fd in $FontDefs){ $fd.font = ParseFont (Join-Path $fontDir $fd.file); $FontWidths[$fd.key] = $fd.font.widths }

function FontKey([string]$style){ switch($style){ 'B'{'F2'} 'I'{'F3'} 'SB'{'F4'} default{'F1'} } }
function MeasureW([string]$t,[single]$size,[string]$style){
  if([string]::IsNullOrEmpty($t)){ return 0.0 }
  $wt = $FontWidths[(FontKey $style)]
  $bytes = $enc1252.GetBytes($t); $w=0
  foreach($by in $bytes){ $w += $wt[[int]$by] }
  return [double]($w * $size / 1000.0)
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
    $top  = [int](($src.Height - $side)*0.30)
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
$Pages = New-Object System.Collections.ArrayList
function RectOp($pg,$x,$y,$w,$h,$col){ [void]$pg.Add(@{K='r'; X=$x; Y=$y; W=$w; H=$h; CR=$col[0]; CG=$col[1]; CB=$col[2]}) }
function RRectOp($pg,$x,$y,$w,$h,$r,$fill,$stroke,$lw){
  $op = @{K='rr'; X=$x; Y=$y; W=$w; H=$h; R=$r; FR=$fill[0]; FG=$fill[1]; FB=$fill[2]; LW=$lw; HS=$false}
  if($null -ne $stroke){ $op.HS=$true; $op.SR=$stroke[0]; $op.SG=$stroke[1]; $op.SB=$stroke[2] }
  [void]$pg.Add($op)
}
function TextOp($pg,$x,$y,$size,$font,$col,[string]$t){ [void]$pg.Add(@{K='t'; T=$t; X=$x; Y=$y; Size=$size; Font=$font; CR=$col[0]; CG=$col[1]; CB=$col[2]}) }

# ---- page backgrounds -------------------------------------------------------
function DrawBg($pg,[bool]$first){
  RectOp $pg 0 0 $PW $PH $cBgDeep
  if($first){
    RectOp $pg 0 $BAND_H $SIDE_W ($PH-$BAND_H) $cSideBg          # rail sotto la fascia
    RectOp $pg ($SIDE_W-2.0) $BAND_H 2.0 ($PH-$BAND_H) $cAccent  # bordo accento rail
    RectOp $pg 0 0 $PW $BAND_H $cBand                            # fascia full-width
    RectOp $pg 0 ($BAND_H-2.5) $PW 2.5 $cAccent                  # baseline accento fascia
  } else {
    RectOp $pg 0 0 9.0 $PH $cSideBg
    RectOp $pg 9.0 0 2.0 $PH $cAccent
    TextOp $pg $MX1 30.0 8.0 'F4' $cSub 'ALBERTO PECCHINI'
    $rt = $data.ui.runningTitle
    $rw = MeasureW $rt 8 'R'
    TextOp $pg ($PW-$MR-$rw) 30.0 8.0 'F1' $cSub $rt
    RectOp $pg $MX1 41.0 ($PW-$MX1-$MR) 0.8 $cHair
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
function MainEnsure([double]$need){ if(($script:my + $need) -gt ($PH - $MB)){ MainNewPage } }
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
function MainSection([string]$text){
  $script:my += 10
  MainEnsure 26
  $x0 = MainX0
  RRectOp $script:curPage $x0 ($script:my-1.0) 4 13 1.5 $cAccent $null 0   # barra accento
  TextOp $script:curPage ($x0+13) $script:my 11.5 'F2' $cInk $text.ToUpper()
  $script:my += 16
  RectOp $script:curPage $x0 $script:my (MainW) 0.8 $cHair
  $script:my += 7
}
function MainTag([string]$text,[double]$xIndent){
  $fs=7.6; $hpad=6.5; $vpad=3.0; $rad=5.0
  $w=(MeasureW $text $fs 'B')+2*$hpad; $h=$fs+2*$vpad
  MainEnsure $h
  RRectOp $script:curPage ((MainX0)+$xIndent) $script:my $w $h $rad $cChipBg $cChipBd 0.7
  TextOp  $script:curPage ((MainX0)+$xIndent+$hpad) ($script:my+$vpad) $fs 'F2' $cInk $text
  $script:my += $h
}
function MainEntry($period,$title,$role,$desc,$link){
  $indent = 13.0
  $script:my += 5
  MainEnsure 58                                                            # tieni unito il "capo" dell'elemento
  $yTick = $script:my
  MainTag $period $indent
  RectOp $script:curPage (MainX0) $yTick 3.0 ($script:my-$yTick) $cAccent   # marcatore (alto del tag)
  $script:my += 2
  MainText $title 10.9 'B'  $cText   $indent 0 1 1.22
  if($role){ MainText $role 9.0 'SB' $cAccent $indent 0 1 1.25 }
  MainText $desc 9.0 'R' $cSub $indent 0 0 1.36
  if($link){ MainText ("> " + $link) 8.4 'B' $cInk $indent 1 0 1.2 }
  $script:my += 3
}
function MainChips($items,[single]$fs,$fg,$bg,$bd,[double]$hpad,[double]$vpad,[double]$gx,[double]$gy,[double]$rad,[double]$indent){
  $chipH = $fs + 2*$vpad
  MainEnsure $chipH
  $x0 = (MainX0)+$indent; $maxW = (MainW)-$indent
  $curx = $x0; $rowTop = $script:my
  foreach($it in $items){
    $w = (MeasureW $it $fs 'R') + 2*$hpad
    if(($curx -ne $x0) -and (($curx + $gx + $w) -gt ($x0 + $maxW))){
      $curx = $x0; $rowTop += $chipH + $gy
      if(($rowTop + $chipH) -gt ($PH - $MB)){ MainNewPage; $x0 = (MainX0)+$indent; $maxW = (MainW)-$indent; $curx = $x0; $rowTop = $script:my }
    }
    RRectOp $script:curPage $curx $rowTop $w $chipH $rad $bg $bd 0.7
    TextOp  $script:curPage ($curx+$hpad) ($rowTop+$vpad) $fs 'F1' $fg $it
    $curx += $w + $gx
  }
  $script:my = $rowTop + $chipH
}

# ---- rail sinistra (pag.1, colonna fissa, no page-break) -------------------
$script:sy = $railTop
$SX = $railX
function SideTitle([string]$t){
  $script:sy += 3
  RRectOp $Pages[0] $SX ($script:sy) 3.5 10.5 1.2 $cAccent $null 0
  TextOp $Pages[0] ($SX+10) $script:sy 9.2 'F2' $cWhite $t.ToUpper()
  $script:sy += 15
}
function SideRule {
  $script:sy += 7
  RectOp $Pages[0] $SX $script:sy $railW 0.7 $cHair
  $script:sy += 11
}
function SideText([string]$t,[single]$size,[string]$style,$col,[double]$spA){
  $lines = WrapText $t $size $style $railW
  $lh = $size * 1.3
  foreach($ln in $lines){ TextOp $Pages[0] $SX $script:sy $size (FontKey $style) $col $ln; $script:sy += $lh }
  $script:sy += $spA
}
function SideChips($items,[single]$fs){
  $hpad=6.0; $vpad=3.2; $gx=4.0; $gy=4.0; $rad=5.0
  $chipH = $fs + 2*$vpad
  $curx = $SX; $rowTop = $script:sy
  foreach($it in $items){
    $w = (MeasureW $it $fs 'R') + 2*$hpad
    if(($curx -ne $SX) -and (($curx + $gx + $w) -gt ($SX + $railW))){ $curx = $SX; $rowTop += $chipH + $gy }
    RRectOp $Pages[0] $curx $rowTop $w $chipH $rad $cSideChip $cChipBd 0.7
    TextOp  $Pages[0] ($curx+$hpad) ($rowTop+$vpad) $fs 'F1' $cText $it
    $curx += $w + $gx
  }
  $script:sy = $rowTop + $chipH + 2
}
function SideLang([string]$name,[string]$lvl,[double]$frac){
  TextOp $Pages[0] $SX $script:sy 9.0 'F2' $cWhite $name
  $lw = MeasureW $name 9.0 'B'
  TextOp $Pages[0] ($SX+$lw+5) ($script:sy+0.6) 7.6 'F1' $cSideLbl ("/ "+$lvl)
  $script:sy += 12.5
  RRectOp $Pages[0] $SX $script:sy $railW 3.4 1.7 $cSideChip $null 0
  RRectOp $Pages[0] $SX $script:sy ($railW*$frac) 3.4 1.7 $cAccent $null 0
  $script:sy += 11
}
function SideBullet([string]$t){
  TextOp $Pages[0] $SX ($script:sy+0.4) 8.4 'F2' $cAccent '+'
  $lines = WrapText $t 8.4 'R' ($railW-12)
  $lh = 8.4 * 1.32
  foreach($ln in $lines){ TextOp $Pages[0] ($SX+12) $script:sy 8.4 'F1' $cText $ln; $script:sy += $lh }
  $script:sy += 3
}

# ---- elemento fascia: chip contatto ----------------------------------------
function BandChips($pg,$items,[double]$x0,[double]$yTop,[double]$maxRight){
  $fs=8.0; $hpad=7.0; $vpad=3.4; $gx=5.0; $gy=5.0; $rad=6.0
  $chipH=$fs+2*$vpad; $curx=$x0; $rowTop=$yTop
  foreach($it in $items){
    $w=(MeasureW $it $fs 'R')+2*$hpad
    if(($curx -ne $x0) -and (($curx+$gx+$w) -gt $maxRight)){ $curx=$x0; $rowTop += $chipH+$gy }
    RRectOp $pg $curx $rowTop $w $chipH $rad $cChipBg $cChipBd 0.8
    TextOp  $pg ($curx+$hpad) ($rowTop+$vpad) $fs 'F1' $cText $it
    $curx += $w + $gx
  }
}

# =============================================================================
#  BUILD  (una passata per lingua -> un PDF per lingua)
# =============================================================================
foreach($loc in $LOCALES){
$dataPath = Join-Path $root ("scripts\cv-data.$loc.json")
$raw  = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
$data = $raw | ConvertFrom-Json
$outPath = Join-Path $root ("public\cv-alberto-pecchini-$loc.pdf")

# stato di layout azzerato a ogni lingua (colonna principale + rail sinistra)
$Pages = New-Object System.Collections.ArrayList
$script:miIdx = 0; $script:my = $MT0; $script:curPage = $null
$script:sy = $railTop

$pg0 = New-Object System.Collections.ArrayList
DrawBg $pg0 $true
[void]$Pages.Add($pg0)

# ----- fascia d'intestazione (pag.1) -----
$phDim = 94.0; $phX = $ML; $phY = 30.0
[void]$pg0.Add(@{K='ph'; X=$phX; Y=$phY; D=$phDim})
$idX = $phX + $phDim + 22.0
$idR = $PW - $MR
TextOp $pg0 $idX 40.0 25.0 'F2' $cText $data.name
TextOp $pg0 $idX 71.0 12.5 'F4' $cInk $data.role
# tagline (wrap)
$tagY = 88.0
foreach($ln in (WrapText $data.tagline 8.8 'R' ($idR-$idX))){ TextOp $pg0 $idX $tagY 8.8 'F1' $cSub $ln; $tagY += 8.8*1.28 }
# chip contatto
$contactVals = @(); foreach($c in $data.contacts){ $contactVals += $c[1] }
BandChips $pg0 $contactVals $idX 116.0 $idR

# ----- rail sinistra -----
SideTitle $data.ui.langs
foreach($l in $data.languages){ SideLang $l[0] $l[1] ([double]$l[2]) }
SideRule
SideTitle $data.ui.license
SideChips $data.patente 7.8
$script:sy += 5
SideTitle $data.ui.canDrive
SideChips $data.guida 7.8
SideRule
SideTitle $data.ui.strengths
SideChips $data.strengths 7.8
SideRule
SideTitle $data.ui.availability
foreach($a in $data.availability){ SideBullet $a }
SideRule
SideTitle $data.ui.wish
SideText $data.wishlist 8.2 'I' $cSideLbl 0

# ----- colonna principale -----
$script:miIdx = 0
$script:my = $MT0
$script:curPage = $Pages[0]

MainSection $data.ui.profile
MainText $data.profile 9.4 'R' $cText 0 0 1 1.4

MainSection $data.ui.skills
foreach($s in $data.skills){
  MainText $s[0] 9.2 'SB' $cText 0 3 3 1.2
  MainChips $s[1] 8.3 $cInk $cChipBg $cChipBd 8 3.6 5 5 6 0
  $script:my += 3
}

MainSection $data.ui.experience
foreach($e in $data.experience){ MainEntry $e.period $e.title $e.role $e.desc $e.link }

MainSection $data.ui.education
foreach($e in $data.education){ MainEntry $e.period $e.title $e.role $e.desc $null }

MainSection $data.ui.travel
foreach($e in $data.travel){ MainEntry $e.period $e.title $e.role $e.desc $null }

MainSection $data.ui.volunteer
foreach($e in $data.volunteer){ MainEntry $e.period $e.title $e.role $e.desc $null }

$script:my += 6
MainEnsure 2
RectOp $script:curPage (MainX0) $script:my (MainW) 0.8 $cHair
$script:my += 7
MainText $data.privacy 7.2 'I' $cSub 0 0 0 1.36

# =============================================================================
#  EMIT
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
        [void]$sb.Append("2.4 w`n")
        AppendCircle $sb $cx $cy $rad
        [void]$sb.Append("S`n")
      }
    }
  }
  [void]$pageStreams.Add($sb.ToString())
}

# ---- assemble objects (numbering dinamico) ---------------------------------
$n   = $Pages.Count
$enc = $enc1252
$ms  = New-Object System.IO.MemoryStream
function W([string]$s){ $b = $enc.GetBytes($s); $ms.Write($b,0,$b.Length) }
function WB([byte[]]$b){ $ms.Write($b,0,$b.Length) }
$offsets = @{}
function StartObj([int]$num){ $offsets[$num] = [int]$ms.Length; W ("$num 0 obj`n") }

# Mappa oggetti:
#  1 Catalog | 2 Pages
#  font i (0..3): font=3+i*3, descriptor=4+i*3, fontfile=5+i*3
#  image = 15
#  page p: page=16+p*2, content=17+p*2
$fontObjOf = @{}
for($i=0;$i -lt 4;$i++){ $fontObjOf[$FontDefs[$i].key] = 3 + $i*3 }
$imgObj = 15

W "%PDF-1.4`n"
W ('%' + [char]0xE2 + [char]0xE3 + [char]0xCF + [char]0xD3 + "`n")

StartObj 1; W "<< /Type /Catalog /Pages 2 0 R >>`nendobj`n"

$kids = @(); for($p=0;$p -lt $n;$p++){ $kids += (''+(16 + $p*2)+' 0 R') }
StartObj 2; W ("<< /Type /Pages /Count $n /Kids [ " + ($kids -join ' ') + " ] >>`nendobj`n")

for($i=0;$i -lt 4;$i++){
  $fd = $FontDefs[$i]; $f = $fd.font
  $fontN = 3 + $i*3; $descN = 4 + $i*3; $fileN = 5 + $i*3
  $wid = ($f.widths[32..255] -join ' ')
  StartObj $fontN
  W ("<< /Type /Font /Subtype /TrueType /BaseFont /" + $fd.base + " /FirstChar 32 /LastChar 255 /Widths [ $wid ] /FontDescriptor $descN 0 R /Encoding /WinAnsiEncoding >>`nendobj`n")
  $bb = $f.bbox
  StartObj $descN
  W ("<< /Type /FontDescriptor /FontName /" + $fd.base + " /Flags " + $fd.flags + " /FontBBox [ " + $bb[0] + ' ' + $bb[1] + ' ' + $bb[2] + ' ' + $bb[3] + " ] /ItalicAngle " + (N $f.italic) + " /Ascent " + $f.ascent + " /Descent " + $f.descent + " /CapHeight " + $f.cap + " /StemV " + $fd.stemv + " /FontFile2 $fileN 0 R >>`nendobj`n")
  $tb = $f.bytes
  StartObj $fileN
  W ("<< /Length " + $tb.Length + " /Length1 " + $tb.Length + " >>`nstream`n")
  WB $tb
  W "`nendstream`nendobj`n"
}

StartObj $imgObj
W ("<< /Type /XObject /Subtype /Image /Width $PHOTO_DIM /Height $PHOTO_DIM /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + $jpegBytes.Length + " >>`nstream`n")
WB $jpegBytes
W "`nendstream`nendobj`n"

$res = "<< /Font << /F1 " + $fontObjOf['F1'] + " 0 R /F2 " + $fontObjOf['F2'] + " 0 R /F3 " + $fontObjOf['F3'] + " 0 R /F4 " + $fontObjOf['F4'] + " 0 R >> /XObject << /Im0 $imgObj 0 R >> >>"
for($p=0;$p -lt $n;$p++){
  $pageNum = 16 + $p*2; $contNum = 17 + $p*2
  StartObj $pageNum
  W ("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + (N $PW) + ' ' + (N $PH) + "] /Resources $res /Contents $contNum 0 R >>`nendobj`n")
  $content = $pageStreams[$p]
  $clen = $enc.GetBytes($content).Length
  StartObj $contNum
  W ("<< /Length $clen >>`nstream`n"); W $content; W "`nendstream`nendobj`n"
}

# ---- xref / trailer ---------------------------------------------------------
$maxObj = 15 + $n*2
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
Write-Output ("OK: $outPath  |  pagine: $n  |  oggetti: $maxObj  |  font: Titillium Web (4 pesi, embedded)  |  totale: $kb KB")

# L'italiano e' anche il PDF "base" (link storici, /archivio, build-zips).
if($loc -eq 'it'){
  $basePath = Join-Path $root 'public\cv-alberto-pecchini.pdf'
  Copy-Item $outPath $basePath -Force
  Write-Output "OK: $basePath  (copia IT del CV base)"
}

# ---- optional PNG preview (System.Drawing) for visual QA (solo IT) ----------
if($Preview -and $loc -eq 'it'){
  $previewDir = $env:CV_PREVIEW_DIR; if(-not $previewDir){ $previewDir = (Join-Path $root 'scripts') }
  $scale = 1.7
  $photoImg = [System.Drawing.Image]::FromStream((New-Object System.IO.MemoryStream(,$jpegBytes)))
  # carica Titillium per il preview
  $pfc = New-Object System.Drawing.Text.PrivateFontCollection
  foreach($fd in $FontDefs){ $pfc.AddFontFile((Join-Path $fontDir $fd.file)) }
  function PvFamily([string]$name){ foreach($fam in $pfc.Families){ if($fam.Name -eq $name){ return $fam } }; return $pfc.Families[0] }
  $famReg = PvFamily 'Titillium Web'
  $famSemi = PvFamily 'Titillium Web SemiBold'
  function Brush($col){ New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([int]($col[0]*255),[int]($col[1]*255),[int]($col[2]*255))) }
  function PvFont([single]$size,[string]$fk){
    $sz=$size*$scale
    try {
      switch($fk){
        'F2' { return New-Object System.Drawing.Font($famReg,$sz,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel) }
        'F3' { return New-Object System.Drawing.Font($famReg,$sz,[System.Drawing.FontStyle]::Italic,[System.Drawing.GraphicsUnit]::Pixel) }
        'F4' { return New-Object System.Drawing.Font($famSemi,$sz,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel) }
        default { return New-Object System.Drawing.Font($famReg,$sz,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel) }
      }
    } catch { return New-Object System.Drawing.Font('Arial',$sz,[System.Drawing.GraphicsUnit]::Pixel) }
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
          $x=$r.X*$scale; $y=$r.Y*$scale; $w=$r.W*$scale; $h=$r.H*$scale; $d=[Math]::Min($r.R*2*$scale,[Math]::Min($w,$h))
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
          $pen=New-Object System.Drawing.Pen -ArgumentList ((Brush $cAccent).Color),([single](2.4*$scale)); $g.DrawEllipse($pen,$x,$y,$d,$d)
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
} # foreach $loc
