# Output Management Tool - Quick Launch Script
# このスクリプトでアプリを簡単に起動できます

$exePath = ".\dist\win-unpacked\Output Management Tool.exe"

if (Test-Path $exePath) {
    Write-Host "🚀 Output Management Toolを起動中..." -ForegroundColor Green
    Start-Process -FilePath $exePath
    Write-Host "✅ アプリが起動しました！" -ForegroundColor Green
} else {
    Write-Host "❌ EXEファイルが見つかりません。" -ForegroundColor Red
    Write-Host "   まず以下のコマンドでビルドしてください:" -ForegroundColor Yellow
    Write-Host "   npm run build:win" -ForegroundColor Cyan
    
    $response = Read-Host "今すぐビルドしますか？ (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "🔨 ビルド開始..." -ForegroundColor Yellow
        npm run build:win
        
        if (Test-Path $exePath) {
            Write-Host "🚀 ビルド完了！アプリを起動中..." -ForegroundColor Green
            Start-Process -FilePath $exePath
        }
    }
}
