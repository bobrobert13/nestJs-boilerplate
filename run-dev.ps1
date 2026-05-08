$p = Start-Process -FilePath 'npm' -ArgumentList 'run','start:dev' -NoNewWindow -PassThru
Start-Sleep -Seconds 10
if (!$p.HasExited) { $p.Kill() }