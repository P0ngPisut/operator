# Dumps the raw RGB pixels of an image to <out>.rgb (3 bytes per pixel, row-major) and writes <out>.json with its size.
param([string]$ImagePath, [string]$OutBase)
Add-Type -AssemblyName System.Drawing
$full = [System.IO.Path]::GetFullPath($ImagePath)
$bmp = [System.Drawing.Bitmap]::FromFile($full)
$w = $bmp.Width; $h = $bmp.Height
$rect = New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $w, $h
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$stride = $data.Stride
$bytes = [byte[]]::new($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy([IntPtr]$data.Scan0, $bytes, [int]0, [int]$bytes.Length)
$bmp.UnlockBits($data)
$bmp.Dispose()
$out = [byte[]]::new($w * $h * 3)
for ($y = 0; $y -lt $h; $y++) { [System.Buffer]::BlockCopy($bytes, $y * $stride, $out, $y * $w * 3, $w * 3) }
[System.IO.File]::WriteAllBytes([System.IO.Path]::GetFullPath("$OutBase.rgb"), $out)
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath("$OutBase.json"), ('{"width":' + $w + ',"height":' + $h + ',"order":"BGR"}'))
"dumped $w x $h"
