// Contrato de props Android del RN instalado. No es una ejecución en dispositivo.
// Detecta valores que TypeScript/web aceptan pero el setter nativo rechaza.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('los roles de las pantallas Productos/Chat existen en los enums nativos Android', () => {
  const source = fs.readFileSync('node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt', 'utf8');
  function nativeRoles(name) {
    const start = source.indexOf(`enum class ${name} {`);
    assert.ok(start >= 0, `Enum ${name} disponible`);
    const body = source.slice(start, source.indexOf('companion object', start));
    return new Set([...body.matchAll(/^\s+([A-Z][A-Z0-9_]*)(?:,|;)?\s*$/gm)].map(match => match[1].toLowerCase()));
  }
  const supported = { accessibilityRole: nativeRoles('AccessibilityRole'), role: nativeRoles('Role') };
  const files = ['src/screens/ChatScreen.tsx', 'src/components/ChatInboxList.tsx', 'src/screens/ProductDetailScreen.tsx',
    'src/screens/MyProductsScreen.tsx', 'src/screens/EditProductScreen.tsx', 'src/screens/CartScreen.tsx'];
  const invalid = [];
  for (const file of files) {
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxAttribute(node) && supported[node.name.text] && node.initializer && ts.isStringLiteral(node.initializer)) {
        const value = node.initializer.text;
        if (!supported[node.name.text].has(value.toLowerCase())) invalid.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1} ${node.name.text}=${value}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  assert.deepEqual(invalid, [], 'Props compatibles con el enum del setter nativo, no solo con web');
});
