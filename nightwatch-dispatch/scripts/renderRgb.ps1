# Converts a raw BGR byte file (3 bytes per pixel, row-major) into a PNG.
param([string]$RgbPath, [int]$Width, [int]$Height, [string]$OutPath)
Add-Type -AssemblyName System.Drawing
$bytes = [System.IO.File]::ReadAllBytes([System.IO.Path]::GetFullPath($RgbPath))
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$rect = New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $Width, $Height
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$stride = $data.Stride
$padded = [byte[]]::new($stride * $Height)
for ($y = 0; $y -lt $Height; $y++) { [System.Buffer]::BlockCopy($bytes, $y * $Width * 3, $padded, $y * $stride, $Width * 3) }
[System.Runtime.InteropServices.Marshal]::Copy($padded, [int]0, [IntPtr]$data.Scan0, [int]$padded.Length)
$bmp.UnlockBits($data)
$bmp.Save([System.IO.Path]::GetFullPath($OutPath), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
"wrote $OutPath"
