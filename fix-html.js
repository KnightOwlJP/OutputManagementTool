/**
 * Next.js 15のHTMLから不正なCSS scriptタグを削除するスクリプト
 * Next.js 15は<script src="xxx.css">というタグを生成するが、
 * これはブラウザでCSSをJavaScriptとして解釈させようとしてエラーになる
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const outDir = path.join(__dirname, 'out');

// すべてのHTMLファイルを取得
const htmlFiles = glob.sync('**/*.html', { cwd: outDir });

console.log('================================');
console.log('HTML修正処理開始');
console.log('================================\n');

let totalFixed = 0;
let totalFiles = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(outDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // <script src="xxx.css">タグを削除（asyncありなし両方）
  const fixed = content.replace(
    /<script\s+src="[^"]+\.css"(?:\s+async="")?\s*><\/script>/g,
    ''
  );
  
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
    const removedCount = (content.match(/<script\s+src="[^"]+\.css"/g) || []).length;
    console.log(`✓ ${file}: ${removedCount}個のCSS scriptタグを削除`);
    totalFixed++;
  }
  
  totalFiles++;
});

console.log('\n================================');
console.log('HTML修正完了');
console.log('================================');
console.log(`処理ファイル数: ${totalFiles}`);
console.log(`修正ファイル数: ${totalFixed}`);

// 404.html を index.html のコピーに置き換えて SPA フォールバックを実現
console.log('\n================================');
console.log('SPA フォールバック設定');
console.log('================================\n');

const indexPath = path.join(outDir, 'index.html');
const notFoundPath = path.join(outDir, '404.html');

if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  fs.writeFileSync(notFoundPath, indexContent, 'utf-8');
  console.log('✓ 404.html を index.html のコピーに置き換えました');
  console.log('  → これによりクライアントサイドルーティングが動作します');
} else {
  console.log('⚠ index.html が見つかりません');
}

console.log('');
