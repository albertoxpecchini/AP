# Apre la regia di Claude (cruscotto.mjs) al centro dello schermo da 24", oppure, se è già
# aperta, la riporta davanti e la rimette al centro (Alberto, 3.11.2026: «mostra quel cmd e
# impara per qualsiasi task di aprirlo»). Lo lanciano anche i ganci di Claude Code (gancio.mjs).
# Lo schermo si riconosce dalle misure fisiche che il monitor dichiara (EDID): vince quello con
# la diagonale più vicina ai 24 pollici (l'HP 24f); se non si trova, il principale.
#
#   powershell -ExecutionPolicy Bypass -File tools\cruscotto\cruscotto.ps1 [-Pollici 24] [-Colonne 160] [-Righe 50] [-Nuova]

param([double]$Pollici = 24, [int]$Colonne = 160, [int]$Righe = 50, [switch]$Nuova)

$titolo = 'Regia di Claude'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @'
using System; using System.Runtime.InteropServices;
public class RegiaFinestra {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct DISPLAY_DEVICE { public int cb; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string DeviceName; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceString; public int StateFlags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceID; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceKey; }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool EnumDisplayDevices(string dev, uint i, ref DISPLAY_DEVICE dd, uint flags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint flags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("kernel32.dll", SetLastError=true)] public static extern bool AttachConsole(uint pid);
  [DllImport("kernel32.dll")] public static extern bool FreeConsole();
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr CreateFile(string name, uint access, uint share, IntPtr sec, uint disp, uint flags, IntPtr tmpl);
  [DllImport("kernel32.dll")] public static extern bool GetConsoleMode(IntPtr h, out uint mode);
  [DllImport("kernel32.dll")] public static extern bool SetConsoleMode(IntPtr h, uint mode);
  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
  // via la «modifica rapida»: un clic dentro la finestra la metteva in «Seleziona» e il disegno si fermava
  public static string SenzaSelezione(uint pid) {
    FreeConsole();
    if (!AttachConsole(pid)) return "non mi attacco alla console (" + Marshal.GetLastWin32Error() + ")";
    IntPtr h = CreateFile("CONIN$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
    uint modo; GetConsoleMode(h, out modo);
    bool ok = SetConsoleMode(h, (modo & ~0x40u) | 0x80u);
    CloseHandle(h); FreeConsole();
    return ok ? "modifica rapida spenta" : "modifica rapida ancora accesa";
  }
  public static string Adattatore(string pezzo) {
    for (uint a = 0; a < 16; a++) {
      var d = new DISPLAY_DEVICE(); d.cb = Marshal.SizeOf(d);
      if (!EnumDisplayDevices(null, a, ref d, 0)) continue;
      for (uint b = 0; b < 4; b++) {
        var m = new DISPLAY_DEVICE(); m.cb = Marshal.SizeOf(m);
        if (EnumDisplayDevices(d.DeviceName, b, ref m, 1) && m.DeviceID.ToUpper().Contains(pezzo.ToUpper())) return d.DeviceName;
      }
    }
    return null;
  }
}
'@

# lo schermo: il monitor con la diagonale più vicina a $Pollici
$schermo = [System.Windows.Forms.Screen]::PrimaryScreen
try {
  $monitor = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction Stop |
    ForEach-Object { [pscustomobject]@{ Id = $_.InstanceName; Pollici = [math]::Sqrt([math]::Pow($_.MaxHorizontalImageSize, 2) + [math]::Pow($_.MaxVerticalImageSize, 2)) / 2.54 } } |
    Sort-Object { [math]::Abs($_.Pollici - $Pollici) } | Select-Object -First 1
  if ($monitor) {
    $pezzo = ($monitor.Id -replace '^DISPLAY\\', '' -replace '_\d+$', '') -replace '\\', '#'
    $nome = [RegiaFinestra]::Adattatore($pezzo)
    $trovato = [System.Windows.Forms.Screen]::AllScreens | Where-Object { $_.DeviceName -eq $nome } | Select-Object -First 1
    if ($trovato) { $schermo = $trovato }
  }
} catch {}

function Centra([IntPtr]$h) {
  if ([RegiaFinestra]::IsIconic($h)) { [void][RegiaFinestra]::ShowWindow($h, 9) }
  $r = New-Object RegiaFinestra+RECT
  [void][RegiaFinestra]::GetWindowRect($h, [ref]$r)
  $area = $schermo.WorkingArea
  $w = [math]::Min($r.Right - $r.Left, $area.Width)
  $hh = [math]::Min($r.Bottom - $r.Top, $area.Height)
  $x = $area.X + [int](($area.Width - $w) / 2)
  $y = $area.Y + [int](($area.Height - $hh) / 2)
  [void][RegiaFinestra]::SetWindowPos($h, [IntPtr]::Zero, $x, $y, $w, $hh, 0x0044)
  [void][RegiaFinestra]::SetForegroundWindow($h)
  Write-Host "regia: ${w}x${hh} in ($x, $y) su $($schermo.DeviceName)"
}

# già aperta? davanti e al centro
if (-not $Nuova) {
  $h = [RegiaFinestra]::FindWindow([NullString]::Value, $titolo)
  if ($h -ne [IntPtr]::Zero) { Centra $h; exit 0 }
}

$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
$comando = "title $titolo & mode con: cols=$Colonne lines=$Righe & node `"$qui\cruscotto.mjs`""
$p = Start-Process -FilePath 'conhost.exe' -ArgumentList "cmd.exe /k `"$comando`"" -PassThru

# la finestra: la console è intestata al cmd figlio di conhost
$h = [IntPtr]::Zero
$cmd = $null
for ($i = 0; $i -lt 80 -and $h -eq [IntPtr]::Zero; $i++) {
  Start-Sleep -Milliseconds 150
  $cmd = Get-CimInstance Win32_Process -Filter "ParentProcessId = $($p.Id) AND Name = 'cmd.exe'" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { $h = (Get-Process -Id $cmd.ProcessId -ErrorAction SilentlyContinue).MainWindowHandle }
  if (-not $h -or $h -eq [IntPtr]::Zero) { $h = [RegiaFinestra]::FindWindow([NullString]::Value, $titolo) }
}
if ($h -eq [IntPtr]::Zero) { Write-Host 'finestra non trovata'; exit 1 }
Start-Sleep -Milliseconds 700
Centra $h
if ($cmd) { Write-Host ([RegiaFinestra]::SenzaSelezione([uint32]$cmd.ProcessId)) }
