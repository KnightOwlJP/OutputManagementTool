const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

console.log('================================');
console.log('アイコンファイル生成');
console.log('================================\n');

async function generateIcons() {
  try {
    const svgPath = path.join(__dirname, 'public', 'icon.svg');
    const pngPath = path.join(__dirname, 'public', 'icon.png');
    const icoPath = path.join(__dirname, 'public', 'icon.ico');

    // SVGファイルの存在確認
    if (!fs.existsSync(svgPath)) {
      console.error('✗ public/icon.svg が見つかりません');
      process.exit(1);
    }

    console.log('[1/3] SVG → PNG (512x512) 変換中...');
    
    // PNG生成（512x512）
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(pngPath);
    
    const pngSize = fs.statSync(pngPath).size / 1024;
    console.log(`✓ PNG生成完了: public/icon.png (${pngSize.toFixed(2)} KB)\n`);

    console.log('[2/3] ICO用の複数サイズPNG生成中...');
    
    // ICO用に複数サイズのPNG生成
    const sizes = [16, 32, 48, 64, 128, 256];
    const tempDir = path.join(__dirname, 'temp_icons');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const pngFiles = [];
    for (const size of sizes) {
      const tempPngPath = path.join(tempDir, `icon-${size}.png`);
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(tempPngPath);
      pngFiles.push(tempPngPath);
    }
    
    console.log(`✓ 複数サイズPNG生成完了 (${sizes.length}サイズ)\n`);

    console.log('[3/3] ICO生成中...');
    
    try {
      // 複数サイズのPNGをBufferとして読み込む
      const pngBuffers = [];
      for (const pngFile of pngFiles) {
        pngBuffers.push(fs.readFileSync(pngFile));
      }
      
      const icoBuffer = await toIco(pngBuffers);
      fs.writeFileSync(icoPath, icoBuffer);
      const icoSize = fs.statSync(icoPath).size / 1024;
      console.log(`✓ ICO生成完了: public/icon.ico (${icoSize.toFixed(2)} KB)\n`);
    } catch (error) {
      console.log('⚠️  ICO自動生成に失敗しました:', error.message);
      console.log('    手動で生成してください: https://www.icoconverter.com/\n');
    }

    // 一時ファイルのクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }

    console.log('================================');
    console.log('アイコン生成完了！');
    console.log('================================\n');
    
    console.log('生成されたファイル:');
    if (fs.existsSync(pngPath)) {
      console.log('  ✓ public/icon.png (PNG形式)');
    }
    if (fs.existsSync(icoPath)) {
      console.log('  ✓ public/icon.ico (ICO形式)');
    } else {
      console.log('  ⚠️  public/icon.ico (生成失敗)');
    }
    console.log('');
    
    console.log('📊 アイコンデザイン: 循環型（プロセス・テーブル・マニュアル）');
    console.log('   シンプルで視認性の高いデザイン\n');
    
    console.log('次のステップ:');
    console.log('  1. アイコン確認: start public/icon.png');
    console.log('  2. ビルド実行: npm run build:win\n');

  } catch (error) {
    console.error('✗ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

generateIcons();
