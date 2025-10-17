/**
 * electron-builder after-pack hook
 * 開発環境のbetter-sqlite3をパッケージにコピーする
 */

const fs = require('fs-extra');
const path = require('path');

exports.default = async function afterPack(context) {
  const appOutDir = context.appOutDir;
  const platform = context.packager.platform.name;
  
  console.log(`\n� [AfterPack] better-sqlite3をコピー中...`);
  console.log(`   Platform: ${platform}`);
  console.log(`   AppOutDir: ${appOutDir}`);
  
  try {
    // 開発環境のbetter-sqlite3 (正しくビルドされている)
    const sourcePath = path.join(process.cwd(), 'node_modules', 'better-sqlite3', 'build');
    
    // パッケージ内のbetter-sqlite3
    const destPath = path.join(
      appOutDir,
      'resources',
      'app.asar.unpacked',
      'node_modules',
      'better-sqlite3',
      'build'
    );
    
    console.log(`   Source: ${sourcePath}`);
    console.log(`   Dest: ${destPath}`);
    
    if (fs.existsSync(sourcePath)) {
      // 既存のbuildフォルダを削除
      if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
        console.log(`   ✓ 既存のbuildフォルダを削除`);
      }
      
      // 正しくビルドされたバイナリをコピー
      fs.copySync(sourcePath, destPath);
      console.log(`   ✅ better-sqlite3のバイナリコピー完了！\n`);
    } else {
      console.log(`   ⚠️  ソースbuildフォルダが見つかりませんでした\n`);
    }
  } catch (error) {
    console.error(`   ❌ コピー中にエラーが発生しました:`, error.message);
    console.error(`   これは警告です。ビルドは続行されます。\n`);
  }
};
