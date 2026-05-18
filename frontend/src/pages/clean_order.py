import re

with open('OrdenTrabajo.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Cambiar maxWidth a 740px
content = content.replace(
    "<div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>",
    "<div style={{ maxWidth: '740px', margin: '0 auto', padding: '16px' }}>"
)

# 2. Reemplazar todos los form-group dentro del formulario con of-f
# Esto es más complicado porque hay form-group también fuera del formulario
# Vamos a reemplazar los que están claramente en el formulario (después del </form>)
# En su lugar, reemplacemos los patrones específicos

# Reemplazar <div className="form-group"> seguido de label/input compacto
content = re.sub(
    r'<div className="form-group" style=\{\{[^}]*\}\}>\s*<label[^>]*>',
    '<div className="of-f">\n                    <label>',
    content
)

# Reemplazar <div className="form-group"> simple seguido de label
content = re.sub(
    r'<div className="form-group">\s*<label[^>]*>',
    '<div className="of-f">\n                    <label>',
    content
)

# 3. Limpiar todos los labels con estilos inline de form-group
content = re.sub(
    r"<label style=\{\{ display: 'block', marginBottom: '[^']*', fontWeight: '600', color: 'var\(text\)' \}\}>",
    "<label>",
    content
)

content = re.sub(
    r"<label style=\{\{ display: 'flex', alignItems: 'center', gap: '[^']*', cursor: 'pointer', fontWeight: '600', color: 'var\(text\)' \}\}>",
    "<label className=\"of-chk\">",
    content
)

# 4. Limpiar inputs con estilos inline grandes
# Patrón 1: padding 10px 14px, border 2px, borderRadius 8px, fontSize 0.95rem
content = re.sub(
    r"style=\{\{ width: '100%', padding: '10px 14px', border: `?2px solid [^`]+`?, borderRadius: '8px', fontSize: '0\.95rem' \}\}",
    "",
    content
)

# Patrón 2: padding 10px 14px, border 2px solid var(border), borderRadius 8px, fontSize 0.95rem
content = re.sub(
    r"style=\{\{ width: '100%', padding: '10px 14px', border: '2px solid var\(border\)', borderRadius: '8px', fontSize: '0\.95rem' \}\}",
    "",
    content
)

# Patrón 3: padding 12px 16px, border 2px, borderRadius 8px, fontSize 1rem
content = re.sub(
    r"style=\{\{ width: '100%', padding: '12px 16px', border: '2px solid var\(border\)', borderRadius: '8px', fontSize: '1rem' \}\}",
    "",
    content
)

# Patrón 4: fechas con padding 10px
content = re.sub(
    r"style=\{\{\s*width: '100%',\s*padding: '10px',\s*border: '2px solid var\(border\)',\s*borderRadius: '6px'\s*\}\}",
    "",
    content
)

# 5. Limpiar grid inline styles grandes
content = re.sub(
    r"style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(200px, 1fr\)\)', gap: '16px', marginBottom: '16px' \}\}",
    'className="of-grid"',
    content
)

content = re.sub(
    r"style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(200px, 1fr\)\)', gap: '20px', marginBottom: '20px' \}\}",
    'className="of-grid"',
    content
)

# 6. Limpiar div con form-group y style display flex
content = re.sub(
    r'<div className="form-group" style=\{\{ display: \'flex\', alignItems: \'center\' \}\}>',
    '<div className="of-f" style={{ display: \'flex\', alignItems: \'center\' }}>',
    content
)

# 7. Reemplazar la sección de búsqueda de cliente
# Limpiar estilos inline del buscador de cliente
content = re.sub(
    r"style=\{\{\s*width: '100%',\s*padding: '12px 16px',\s*border: '2px solid var\(primary\)',\s*borderRadius: '8px',\s*fontSize: '1rem',\s*background: [^}]+\s*\}\}",
    "",
    content
)

# Limpiar estilos inline del buscador de equipo
content = re.sub(
    r"style=\{\{\s*width: '100%',\s*padding: '12px 16px',\s*border: '2px solid var\(success\)',\s*borderRadius: '8px',\s*fontSize: '1rem',\s*background: [^}]+\s*\}\}",
    "",
    content
)

content = re.sub(
    r"style=\{\{\s*width: '100%',\s*padding: '10px 16px',\s*border: '2px solid var\(info\)',\s*borderRadius: '8px',\s*fontSize: '1rem',\s*background: [^}]+\s*\}\}",
    "",
    content
)

with open('OrdenTrabajo.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - cleaned inline styles')
