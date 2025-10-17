# アイコン生成スクリプト
# SVGからPNG、ICO、ICNSファイルを生成します

Write-Host "================================" -ForegroundColor Cyan
Write-Host "アイコンファイル生成" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 必要なツールの確認
$imagemagickInstalled = Get-Command "magick" -ErrorAction SilentlyContinue
$inkscapeInstalled = Get-Command "inkscape" -ErrorAction SilentlyContinue

if (-not $imagemagickInstalled -and -not $inkscapeInstalled) {
    Write-Host "⚠️  ImageMagickまたはInkscapeがインストールされていません" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "以下のいずれかの方法でインストールしてください:" -ForegroundColor White
    Write-Host ""
    Write-Host "方法1: ImageMagick (推奨)" -ForegroundColor Cyan
    Write-Host "  1. https://imagemagick.org/script/download.php からダウンロード" -ForegroundColor White
    Write-Host "  2. インストール時に 'Add to PATH' を選択" -ForegroundColor White
    Write-Host ""
    Write-Host "方法2: Chocolatey経由" -ForegroundColor Cyan
    Write-Host "  choco install imagemagick" -ForegroundColor White
    Write-Host ""
    Write-Host "方法3: オンラインツールを使用" -ForegroundColor Cyan
    Write-Host "  1. public/icon.svg をブラウザで開く" -ForegroundColor White
    Write-Host "  2. https://www.icoconverter.com/ にアクセス" -ForegroundColor White
    Write-Host "  3. SVGをアップロードしてICOに変換" -ForegroundColor White
    Write-Host "  4. 生成されたicon.icoをpublic/フォルダに保存" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ 画像変換ツールが見つかりました" -ForegroundColor Green
Write-Host ""

# SVGファイルの存在確認
if (-not (Test-Path "public/icon.svg")) {
    Write-Host "✗ public/icon.svg が見つかりません" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] SVG → PNG (512x512) 変換中..." -ForegroundColor Yellow

# PNG生成
if ($inkscapeInstalled) {
    inkscape --export-type=png --export-width=512 --export-height=512 --export-filename="public/icon.png" "public/icon.svg"
} else {
    magick "public/icon.svg" -resize 512x512 "public/icon.png"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PNG生成完了: public/icon.png" -ForegroundColor Green
} else {
    Write-Host "✗ PNG生成に失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/4] PNG → ICO (Windows) 変換中..." -ForegroundColor Yellow

# ICO生成（複数サイズ）
if ($imagemagickInstalled) {
    magick "public/icon.png" -define icon:auto-resize=256,128,64,48,32,16 "public/icon.ico"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ ICO生成完了: public/icon.ico" -ForegroundColor Green
    } else {
        Write-Host "✗ ICO生成に失敗しました" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  ImageMagickが必要です（ICO生成用）" -ForegroundColor Yellow
    Write-Host "オンラインツールを使用してください: https://www.icoconverter.com/" -ForegroundColor White
}
Write-Host ""

Write-Host "[3/4] PNG → ICNS (macOS) 変換中..." -ForegroundColor Yellow

# ICNS生成（macOS用、Windowsでは制限あり）
if ($imagemagickInstalled) {
    # 一時フォルダ作成
    $iconsetPath = "public/icon.iconset"
    if (Test-Path $iconsetPath) {
        Remove-Item -Recurse -Force $iconsetPath
    }
    New-Item -ItemType Directory -Path $iconsetPath | Out-Null
    
    # 複数サイズのPNG生成
    $sizes = @(16, 32, 64, 128, 256, 512)
    foreach ($size in $sizes) {
        magick "public/icon.png" -resize "${size}x${size}" "$iconsetPath/icon_${size}x${size}.png"
        $size2x = $size * 2
        magick "public/icon.png" -resize "${size2x}x${size2x}" "$iconsetPath/icon_${size}x${size}@2x.png"
    }
    
    Write-Host "✓ アイコンセット生成完了" -ForegroundColor Green
    Write-Host "⚠️  ICNS生成はmacOS環境で実行してください" -ForegroundColor Yellow
    Write-Host "macOSで以下を実行: iconutil -c icns public/icon.iconset" -ForegroundColor White
} else {
    Write-Host "⚠️  ICNS生成をスキップします（macOS環境が推奨）" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[4/4] ファイルサイズ確認中..." -ForegroundColor Yellow

# ファイルサイズ表示
if (Test-Path "public/icon.png") {
    $pngSize = (Get-Item "public/icon.png").Length / 1KB
    Write-Host "  icon.png: $([math]::Round($pngSize, 2)) KB" -ForegroundColor White
}

if (Test-Path "public/icon.ico") {
    $icoSize = (Get-Item "public/icon.ico").Length / 1KB
    Write-Host "  icon.ico: $([math]::Round($icoSize, 2)) KB" -ForegroundColor White
}

if (Test-Path "public/icon.iconset") {
    $iconsetSize = (Get-ChildItem "public/icon.iconset" -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "  icon.iconset: $([math]::Round($iconsetSize, 2)) KB" -ForegroundColor White
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "アイコン生成完了！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "生成されたファイル:" -ForegroundColor White
if (Test-Path "public/icon.png") { Write-Host "  ✓ public/icon.png (Linux用)" -ForegroundColor Green }
if (Test-Path "public/icon.ico") { Write-Host "  ✓ public/icon.ico (Windows用)" -ForegroundColor Green }
if (Test-Path "public/icon.iconset") { Write-Host "  ⚠️  public/icon.iconset (macOSでICNSに変換が必要)" -ForegroundColor Yellow }

Write-Host ""
Write-Host "📊 アイコンデザイン: 循環型（プロセス・テーブル・マニュアル）" -ForegroundColor Cyan
Write-Host "   シンプルで視認性の高いデザイン" -ForegroundColor White
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "  1. SVG確認: start public/icon.svg" -ForegroundColor White
Write-Host "  2. PNG確認: start public/icon.png" -ForegroundColor White
Write-Host "  3. ビルド実行: .\build-exe.ps1" -ForegroundColor White
Write-Host ""
