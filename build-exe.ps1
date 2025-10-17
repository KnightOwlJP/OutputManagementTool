# Windows用実行ファイルビルドスクリプト
# このスクリプトを実行すると、.exeファイルが生成されます

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Output Management Tool - ビルド開始" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ステップ1: 古いビルドファイルのクリーンアップ
Write-Host "[1/5] クリーンアップ中..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "electron/*.js") { Remove-Item "electron/*.js" }
Write-Host "✓ クリーンアップ完了" -ForegroundColor Green
Write-Host ""

# ステップ2: Next.jsのビルド
Write-Host "[2/5] Next.jsビルド中..." -ForegroundColor Yellow
npm run build:next
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Next.jsビルドに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Next.jsビルド完了" -ForegroundColor Green
Write-Host ""

# ステップ3: Electronメインプロセスのコンパイル
Write-Host "[3/5] Electronコンパイル中..." -ForegroundColor Yellow
npx tsc -p electron/tsconfig.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Electronコンパイルに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Electronコンパイル完了" -ForegroundColor Green
Write-Host ""

# ステップ4: better-sqlite3のリビルド
Write-Host "[4/5] ネイティブモジュールのリビルド中..." -ForegroundColor Yellow
npm rebuild better-sqlite3 --update-binary
Write-Host "✓ リビルド完了" -ForegroundColor Green
Write-Host ""

# ステップ5: Electron Builderで.exe生成
Write-Host "[5/5] .exe生成中（数分かかります）..." -ForegroundColor Yellow
npx electron-builder --win --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ .exe生成に失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✓ .exe生成完了" -ForegroundColor Green
Write-Host ""

# 完了メッセージ
Write-Host "================================" -ForegroundColor Cyan
Write-Host "ビルド完了！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "出力先: dist/" -ForegroundColor Yellow
Write-Host ""

# ファイルサイズの表示
if (Test-Path "dist\Output Management Tool-0.1.0-x64.exe") {
    $fileSize = (Get-Item "dist\Output Management Tool-0.1.0-x64.exe").Length / 1MB
    Write-Host "インストーラー: Output Management Tool-0.1.0-x64.exe" -ForegroundColor White
    Write-Host "ファイルサイズ: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
}

if (Test-Path "dist\win-unpacked\Output Management Tool.exe") {
    $folderSize = (Get-ChildItem "dist\win-unpacked" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "ポータブル版: dist\win-unpacked\" -ForegroundColor White
    Write-Host "フォルダサイズ: $([math]::Round($folderSize, 2)) MB" -ForegroundColor White
    Write-Host ""
}

Write-Host "配布する場合は、以下のいずれかを使用してください:" -ForegroundColor Cyan
Write-Host "  • インストーラー版: dist\Output Management Tool-0.1.0-x64.exe" -ForegroundColor White
Write-Host "  • ポータブル版: dist\win-unpacked\ フォルダ全体" -ForegroundColor White
Write-Host ""
Write-Host "詳細は docs/BUILD_GUIDE.md を参照してください。" -ForegroundColor Gray
