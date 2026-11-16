import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_soltapp_bmc_document(output_path):
    doc = docx.Document()

    # 1. Configuración de Márgenes (2.5 cm en todos los bordes)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # Paleta de Colores Soltapp
    HEX_PRIMARY = "0D9488"      # Teal Profundo Oficial Soltapp
    HEX_SECONDARY = "3BD7C2"    # Teal Claro / Verde Menta
    HEX_DARK = "1F232E"         # Grafito Oscuro / Charcoal
    HEX_MUTED = "64748B"        # Gris Pizarra
    HEX_BG_LIGHT = "F0FDFA"     # Fondo Teal Suave
    HEX_BG_CARD = "F8FAFC"      # Fondo Gris Muy Suave
    HEX_ACCENT_AMBER = "D97706" # Ámbar Acento
    HEX_BORDER = "CBD5E1"       # Gris Bordes

    COLOR_PRIMARY = RGBColor(13, 148, 136)
    COLOR_DARK = RGBColor(31, 35, 46)
    COLOR_MUTED = RGBColor(100, 116, 139)

    # Helpers XML para estilo de celdas
    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_padding(cell, top=120, bottom=120, left=160, right=160):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    def set_table_borders(table, color=HEX_BORDER, sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_callout(text, title=None, border_color=HEX_PRIMARY, bg_color=HEX_BG_LIGHT):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_color)
        set_cell_padding(cell, top=140, bottom=140, left=200, right=200)

        # Borde izquierdo grueso
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
            f'<w:top w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        if title:
            r_title = p.add_run(f"📌 {title}\n")
            r_title.bold = True
            r_title.font.size = Pt(11)
            r_title.font.name = "Arial"
            r_title.font.color.rgb = COLOR_PRIMARY
        
        r_text = p.add_run(text)
        r_text.font.size = Pt(10)
        r_text.font.name = "Arial"
        r_text.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(8)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.name = "Arial"
        run.font.color.rgb = COLOR_PRIMARY
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.name = "Arial"
        run.font.color.rgb = COLOR_DARK
        return h

    def add_heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = "Arial"
        run.font.color.rgb = COLOR_PRIMARY
        return h

    def add_body(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.size = Pt(10.5)
            r_pre.font.name = "Arial"
            r_pre.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.size = Pt(10.5)
        r.font.name = "Arial"
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.size = Pt(10)
            r_pre.font.name = "Arial"
            r_pre.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.size = Pt(10)
        r.font.name = "Arial"
        r.font.color.rgb = COLOR_DARK
        return p

    # =========================================================================
    # PORTADA DECORADA Y ELEGANTE
    # =========================================================================
    p_title_space = doc.add_paragraph()
    p_title_space.paragraph_format.space_before = Pt(36)

    # Banner Superior de Marca
    p_brand = doc.add_paragraph()
    p_brand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_brand = p_brand.add_run("SOLTAPP MOBILE")
    r_brand.bold = True
    r_brand.font.size = Pt(32)
    r_brand.font.name = "Arial"
    r_brand.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(20)
    r_sub = p_sub.add_run("INFORME ESTRATÉGICO & BUSINESS MODEL CANVAS (BMC)")
    r_sub.bold = True
    r_sub.font.size = Pt(14)
    r_sub.font.name = "Arial"
    r_sub.font.color.rgb = COLOR_DARK

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_after = Pt(36)
    r_desc = p_desc.add_run(
        "Diagnóstico Integral de Arquitectura, Flujo Operativo de Trato en Persona con Validación QR, "
        "Reputación Mutua y Modelo de Negocio Sostenible."
    )
    r_desc.italic = True
    r_desc.font.size = Pt(11)
    r_desc.font.name = "Arial"
    r_desc.font.color.rgb = COLOR_MUTED

    # Ficha Técnica en Portada
    t_meta = doc.add_table(rows=5, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_meta, color=HEX_BORDER, sz="6")

    meta_rows = [
        ("Proyecto:", "Soltapp Mobile (Plataforma C2C de Comercio de Cercanía)"),
        ("Versión Analizada:", "v2.0 (Post-Integración Calificación Mutua, Historial & Remoción Realtime)"),
        ("Tecnologías Principales:", "React Native, Expo Router, Supabase (PostgreSQL, Realtime, Auth, Storage)"),
        ("Fecha de Emisión:", "Noviembre 2026"),
        ("Mercado Inicial Objetivo:", "Argentina (Pilar, GBA Norte, escalable a nivel nacional / LATAM)")
    ]

    for idx, (label, val) in enumerate(meta_rows):
        c0 = t_meta.cell(idx, 0)
        c1 = t_meta.cell(idx, 1)
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_padding(c0, top=100, bottom=100, left=140, right=140)
        set_cell_padding(c1, top=100, bottom=100, left=140, right=140)
        set_cell_background(c0, HEX_BG_LIGHT)
        set_cell_background(c1, "FFFFFF")

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.size = Pt(10)
        r0.font.name = "Arial"
        r0.font.color.rgb = COLOR_PRIMARY

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.size = Pt(10)
        r1.font.name = "Arial"
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # RESUMEN EJECUTIVO
    # =========================================================================
    add_heading_1("Resumen Ejecutivo")
    
    add_body(
        "Soltapp Mobile nace como respuesta directa a una necesidad desatendida y crítica en el comercio electrónico "
        "latinoamericano: la brecha de confianza y costo entre los marketplaces tradicionales. Por un lado, plataformas como "
        "Mercado Libre aplican comisiones agresivas (15% a 25%), retenciones financieras de 14 a 30 días y riesgos de contracargos. "
        "Por el otro, canales informales como Facebook Marketplace sufren de anonimato absoluto, abundancia de estafas, "
        "compradores o vendedores fantasmas ('no-shows') y nula trazabilidad de reputación.",
        bold_prefix="El Contexto de Oportunidad: "
    )

    add_body(
        "Soltapp implementa el paradigma de 'Trato en Persona Verificado': una experiencia 100% libre de comisiones intermediarias, "
        "donde el dinero no queda retenido en una billetera de la plataforma, sino que se intercambia cara a cara en efectivo o "
        "transferencia bancaria directa (Alias/CBU/CVU). La plataforma actúa como garante de presencia y autenticidad mediante "
        "códigos QR dinámicos con vencimiento temporal (5 minutos), registro de geolocalización, actualización de estados en tiempo real "
        "y un sistema de valoración mutua bidireccional (Comprador ⇄ Vendedor).",
        bold_prefix="La Solución Diferencial: "
    )

    add_callout(
        "Propuesta Nuclear de Soltapp:\n"
        "• 0% Comisión por transacción pactada en persona (el vendedor recibe el 100% del precio acordado).\n"
        "• Cero riesgo de recibir una caja vacía: el comprador inspecciona y prueba el producto antes de pagar.\n"
        "• Certificación criptográfica física vía QR dinámico que elimina el fraude de reclamos falsos.\n"
        "• Reputación verificada ligada a transacciones reales completadas, no a perfiles anónimos.\n"
        "• Sostenibilidad y dinamización económica de proximidad (Economía Circular Hiperlocal).",
        title="Tesis de Negocio y Ventaja Competitiva"
    )

    # =========================================================================
    # CAPÍTULO 1: ESTADO ACTUAL Y DIAGNÓSTICO DEL PROYECTO SOLTAPP MOBILE
    # =========================================================================
    add_heading_1("Capítulo 1: Estado Actual y Diagnóstico del Proyecto")

    add_body(
        "A la fecha, el código fuente y la arquitectura de Soltapp Mobile han alcanzado una madurez operativa completa "
        "en sus componentes centrales. Se han resuelto y probado en dispositivos físicos reales los puntos críticos "
        "de fricción comercial y técnica.",
        bold_prefix="Diagnóstico de Madurez Tecnológica: "
    )

    add_heading_2("1.1. Arquitectura Técnica y Componentes")
    add_bullet("React Native con Expo Router (v53), TypeScript y compilación nativa para Android e iOS, con soporte web responsivo.", "Frontend Móvil: ")
    add_bullet("Supabase BaaS sobre PostgreSQL gestionado, tablas relacionales con Row Level Security (RLS) y RPCs optimizadas.", "Backend & Base de Datos: ")
    add_bullet("Canales WebSocket bidireccionales ('soltapp-meetup-sync', 'soltapp-home-sync') que transmiten en vivo la creación de órdenes, generación de QR, validación de entrega, calificaciones y baja de productos.", "Sincronización en Tiempo Real: ")
    add_bullet("Almacenamiento híbrido optimizado con AsyncStorage en móvil y localStorage en web, garantizando persistencia offline y carga reactiva instantánea.", "Caché y Persistencia Local: ")
    add_bullet("Supabase Storage con buckets públicos para fotografías de publicaciones y avatares de usuario.", "Almacenamiento Multimedia: ")

    add_heading_2("1.2. El Customer Journey Integral Implementado")
    add_body(
        "El flujo de usuario ha sido perfeccionado de punta a punta, cubriendo tanto la perspectiva del comprador como la del vendedor:"
    )

    add_bullet("Publicación del Producto: El vendedor publica con fotos, precio, condición y geolocalización en mapa interactivo.", "Paso 1 - Oferta: ")
    add_bullet("Pacto del Encuentro: El comprador explora el catálogo hiperlocal y solicita la compra en persona acordando precio y lugar público.", "Paso 2 - Acuerdo: ")
    add_bullet("Notificación y Bandeja Única: Ambos usuarios reciben notificaciones en tiempo real en su buzón sin división artificial de cuentas (cada usuario puede comprar y vender en paralelo).", "Paso 3 - Alertas: ")
    add_bullet("Generación de QR Dinámico: Al momento de verse cara a cara, el vendedor genera en su pantalla un código QR con vigencia de 5 minutos y animación de pulso.", "Paso 4 - Encuentro Físico: ")
    add_bullet("Inspección y Escaneo: El comprador revisa el producto en mano y, estando conforme, escanea el QR del vendedor con la cámara de Soltapp.", "Paso 5 - Validación: ")
    add_bullet("Pago 100% Externo: La entrega física queda certificada ('DELIVERED'). El comprador paga en efectivo o transferencia bancaria directa (sin cobro ni comisión de Soltapp).", "Paso 6 - Pago Directo: ")
    add_bullet("Confirmación del Pago: El vendedor confirma la recepción del dinero, cerrando la orden como 'COMPLETED'.", "Paso 7 - Cierre de Orden: ")
    add_bullet("Baja Automática del Catálogo: En ese mismo instante, el producto pasa a estado 'vendido', es removido de la pantalla de inicio y catálogo de búsqueda de todos los usuarios.", "Paso 8 - Remoción Inmediata: ")
    add_bullet("Calificación Mutua: Tanto el comprador como el vendedor se califican (1 a 5 estrellas + reseña escrita). La reputación pública se actualiza de inmediato.", "Paso 9 - Reputación: ")
    add_bullet("Historial y Retorno: La transacción queda guardada permanentemente en 'Mis Compras' y 'Mis Ventas', y ambos usuarios disponen de botones claros para 'Volver al Menú Principal'.", "Paso 10 - Trazabilidad: ")

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 2: MATRIZ VISUAL DEL BUSINESS MODEL CANVAS
    # =========================================================================
    add_heading_1("Capítulo 2: Matriz Business Model Canvas de Soltapp")

    add_body(
        "A continuación se presenta la matriz estructurada del Business Model Canvas (metodología Osterwalder & Pigneur), "
        "adaptada específicamente a la realidad operativa, técnica y de mercado de Soltapp Mobile:"
    )

    # Tabla Canvas de 9 Bloques
    t_canvas = doc.add_table(rows=6, cols=3)
    t_canvas.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_canvas, color=HEX_PRIMARY, sz="8")

    # Definir contenido de los 9 bloques
    canvas_blocks = [
        # Fila 1: Socios Clave | Actividades Clave | Propuesta de Valor
        ("1. SOCIOS CLAVE (Key Partners)", 
         "• Comercios barriales (Puntos Seguros de Encuentro: cafeterías, estaciones de servicio, shoppings).\n"
         "• Billeteras virtuales y pasarelas de pago (Mercado Pago, MODO, Cuenta DNI para cobros en mano).\n"
         "• Proveedores de nube (Supabase, AWS, Expo).\n"
         "• Comunidades locales y centros comerciales abiertos.\n"
         "• Creadores de contenido y ferias barriales."),

        ("2. ACTIVIDADES CLAVE (Key Activities)",
         "• Desarrollo y mejora continua de la App móvil.\n"
         "• Mantenimiento del protocolo de seguridad QR y Realtime.\n"
         "• Moderación de publicaciones y prevención de fraude.\n"
         "• Crecimiento de densidad y liquidez por zona geográfica.\n"
         "• Gestión y certificación de 'Puntos Seguros'."),

        ("3. PROPUESTA DE VALOR (Value Proposition)",
         "• Para Compradores: Cero riesgo de estafa (prueban el producto antes de pagar), sin costos de envío, reputación transparente.\n"
         "• Para Vendedores: 100% de la ganancia (0% comisión), cobro inmediato en mano sin retenciones bancarias, validación QR contra reclamos falsos.\n"
         "• Para la Comunidad: Reutilización y economía circular de cercanía, dinamización comercial barrial.")
    ]

    for col_idx, (b_title, b_content) in enumerate(canvas_blocks):
        c = t_canvas.cell(0, col_idx)
        c.width = Inches(2.2)
        set_cell_padding(c, top=100, bottom=100, left=120, right=120)
        set_cell_background(c, HEX_BG_LIGHT)
        p = c.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        rt = p.add_run(b_title + "\n")
        rt.bold = True
        rt.font.size = Pt(9.5)
        rt.font.name = "Arial"
        rt.font.color.rgb = COLOR_PRIMARY
        rc = p.add_run(b_content)
        rc.font.size = Pt(8.5)
        rc.font.name = "Arial"
        rc.font.color.rgb = COLOR_DARK

    # Fila 2: Recursos Clave | Relaciones con Clientes | Segmentos de Clientes
    canvas_blocks_2 = [
        ("4. RECURSOS CLAVE (Key Resources)",
         "• Infraestructura React Native + Supabase + Realtime.\n"
         "• Algoritmo de geolocalización y mapa de proximidad.\n"
         "• Protocolo de validación efímero por código QR.\n"
         "• Grafo de reputación verificado por transacciones reales.\n"
         "• Marca Soltapp e identidad visual."),

        ("5. RELACIÓN CON CLIENTES (Customer Relationships)",
         "• Experiencia automatizada y self-service.\n"
         "• Comunidad basada en confianza y calificaciones mutuas.\n"
         "• Soporte y arbitraje rápido ante cancelaciones o No-Shows.\n"
         "• Notificaciones interactivas y chat en tiempo real."),

        ("6. SEGMENTOS DE CLIENTES (Customer Segments)",
         "• Vendedores C2C ocasionales (particulares que venden indumentaria, celulares, electrónica, muebles).\n"
         "• Compradores que exigen ver y probar el producto antes de pagar.\n"
         "• Microemprendedores y comerciantes de barrio.\n"
         "• Jóvenes y familias interesadas en ahorro y economía circular.")
    ]

    for col_idx, (b_title, b_content) in enumerate(canvas_blocks_2):
        c = t_canvas.cell(1, col_idx)
        c.width = Inches(2.2)
        set_cell_padding(c, top=100, bottom=100, left=120, right=120)
        set_cell_background(c, "FFFFFF")
        p = c.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        rt = p.add_run(b_title + "\n")
        rt.bold = True
        rt.font.size = Pt(9.5)
        rt.font.name = "Arial"
        rt.font.color.rgb = COLOR_PRIMARY
        rc = p.add_run(b_content)
        rc.font.size = Pt(8.5)
        rc.font.name = "Arial"
        rc.font.color.rgb = COLOR_DARK

    # Fila 3: Canales (ocupa celda específica)
    c_channels = t_canvas.cell(2, 0)
    c_channels.width = Inches(6.6)
    set_cell_padding(c_channels, top=100, bottom=100, left=120, right=120)
    set_cell_background(c_channels, HEX_BG_CARD)
    p_ch = c_channels.paragraphs[0]
    p_ch.paragraph_format.space_before = Pt(0)
    p_ch.paragraph_format.space_after = Pt(0)
    rt_ch = p_ch.add_run("7. CANALES DE DISTRIBUCIÓN Y CONTACTO (Channels):\n")
    rt_ch.bold = True
    rt_ch.font.size = Pt(9.5)
    rt_ch.font.name = "Arial"
    rt_ch.font.color.rgb = COLOR_PRIMARY
    rc_ch = p_ch.add_run(
        "• Aplicación Móvil Nativa (Android Play Store, iOS App Store, APK directo).\n"
        "• PWA / Versión Web Responsiva para acceso universal sin instalación obligatoria.\n"
        "• Redes Sociales y Marketing Hiperlocal (Instagram, TikTok, grupos vecinales en Facebook).\n"
        "• Puntos Físicos Seguros ('Soltapp Safe Spots') señalizados en comercios adheridos."
    )
    rc_ch.font.size = Pt(8.5)
    rc_ch.font.name = "Arial"
    rc_ch.font.color.rgb = COLOR_DARK

    # Unir celdas de fila 3
    t_canvas.cell(2, 0).merge(t_canvas.cell(2, 1)).merge(t_canvas.cell(2, 2))

    # Fila 4: Estructura de Costes | Fuentes de Ingresos
    c_costs = t_canvas.cell(3, 0)
    c_rev = t_canvas.cell(3, 1)
    c_costs.width = Inches(3.3)
    c_rev.width = Inches(3.3)
    t_canvas.cell(3, 1).merge(t_canvas.cell(3, 2))

    set_cell_padding(c_costs, top=100, bottom=100, left=120, right=120)
    set_cell_padding(c_rev, top=100, bottom=100, left=120, right=120)
    set_cell_background(c_costs, "FFFFFF")
    set_cell_background(c_rev, HEX_BG_LIGHT)

    p_co = c_costs.paragraphs[0]
    p_co.paragraph_format.space_before = Pt(0)
    p_co.paragraph_format.space_after = Pt(2)
    rt_co = p_co.add_run("8. ESTRUCTURA DE COSTES (Cost Structure)\n")
    rt_co.bold = True
    rt_co.font.size = Pt(9.5)
    rt_co.font.name = "Arial"
    rt_co.font.color.rgb = COLOR_PRIMARY
    rc_co = p_co.add_run(
        "• Infraestructura Cloud: Servidores Supabase Pro, Base de datos PostgreSQL, ancho de banda Realtime y Storage de imágenes.\n"
        "• Desarrollo y Mantenimiento Técnico de Software.\n"
        "• Costo de Adquisición de Clientes (CAC) y campañas geolocalizadas.\n"
        "• Licencias de tiendas móviles (Google Play Developer, Apple Developer Program).\n"
        "• Costos legales, términos de servicio y soporte al cliente."
    )
    rc_co.font.size = Pt(8.5)
    rc_co.font.name = "Arial"
    rc_co.font.color.rgb = COLOR_DARK

    p_re = c_rev.paragraphs[0]
    p_re.paragraph_format.space_before = Pt(0)
    p_re.paragraph_format.space_after = Pt(2)
    rt_re = p_re.add_run("9. FUENTES DE INGRESOS (Revenue Streams)\n")
    rt_re.bold = True
    rt_re.font.size = Pt(9.5)
    rt_re.font.name = "Arial"
    rt_re.font.color.rgb = COLOR_PRIMARY
    rc_re = p_re.add_run(
        "• Publicaciones Destacadas / Freemium Boosts (visibilidad premium en carruseles y primeros puestos del feed).\n"
        "• Suscripción 'Soltapp Pro' para microvendedores y comercios (publicaciones ilimitadas, analíticas y badge oficial).\n"
        "• Red de Puntos Seguros Patrocinados (comercios abonan fee mensual por figurar como punto recomendado en el mapa).\n"
        "• Soltapp Verify (tarifa simbólica para verificación de identidad con DNI).\n"
        "• Alianzas de publicidad hiperlocal no intrusiva y acuerdos Fintech."
    )
    rc_re.font.size = Pt(8.5)
    rc_re.font.name = "Arial"
    rc_re.font.color.rgb = COLOR_DARK

    # Eliminar filas sobrantes del template
    for r_idx in [5, 4]:
        t_canvas._tbl.remove(t_canvas.rows[r_idx]._tr)

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 3: DESGLOSE ESTRATÉGICO DE LOS 9 BLOQUES
    # =========================================================================
    add_heading_1("Capítulo 3: Desglose Estratégico de los 9 Bloques del Canvas")

    add_heading_2("3.1. Propuesta de Valor Diferencial (Value Propositions)")
    add_body(
        "Soltapp ataca el talón de Aquiles de las dos plataformas dominantes en Argentina (Mercado Libre y Facebook Marketplace). "
        "La propuesta no es solo tecnológica, sino un cambio en la psicología de compra:"
    )
    add_bullet("Cero sobreprecio por comisiones infladas de plataforma. Prueba física inmediata del artículo antes de transferir dinero. Ausencia de costos y esperas de correo.", "Para el Comprador: ")
    add_bullet("Retención del 100% del importe. Disponibilidad inmediata del dinero en mano o cuenta bancaria sin bloqueos. Certificación digital irrefutable por QR que previene fraudes de contracargo.", "Para el Vendedor: ")
    add_bullet("Fortalecimiento de la economía circular vecinal, reducción de huella de carbono por transporte de larga distancia y revalorización de los espacios públicos como centros de encuentro.", "Para la Comunidad: ")

    add_heading_2("3.2. Segmentos de Clientes (Customer Segments)")
    add_body(
        "El marketplace opera bajo una lógica C2C (Consumer-to-Consumer) con expansión natural hacia B2C de proximidad:"
    )
    add_bullet("Personas de 18 a 55 años que buscan monetizar artículos en desuso de tecnología, indumentaria, muebles o rodados sin ceder el 20% a un intermediario.", "1. Vendedores Ocasionales: ")
    add_bullet("Consumidores inteligentes y buscadores de oportunidades que priorizan la verificación tangible del producto y la inmediatez de la entrega.", "2. Cazadores de Oportunidades Locales: ")
    add_bullet("Emprendedores de barrio, feriantes y artesanos que necesitan un escaparate digital hiperlocal para atraer clientes a su zona de influencia.", "3. Microemprendedores y Comercios de Proximidad: ")
    add_bullet("Vecinos de partidos definidos (ej. Pilar, Tigre, Escobar, San Isidro) donde la distancia física facilita el encuentro seguro.", "4. Comunidades Geográficas Agrupadas: ")

    add_heading_2("3.3. Canales de Distribución y Comunicación (Channels)")
    add_bullet("Aplicación Móvil construida en React Native / Expo, distribuida mediante tiendas oficiales y APK ligero para máxima accesibilidad.", "Canal Directo Principal: ")
    add_bullet("PWA (Progressive Web App) totalmente reactiva para consultar publicaciones y detalles sin necesidad de descargar la app.", "Canal Web Complementario: ")
    add_bullet("Adquisición mediante micro-campañas de Meta Ads y TikTok segmentadas por código postal y radio de kilómetros (hiperlocal).", "Canal de Adquisición Digital: ")
    add_bullet("Puntos de Encuentro Físicos identificados con vinilos y QR en cafeterías y estaciones adheridas ('Punto Seguro Soltapp').", "Canal Físico de Marca: ")

    add_heading_2("3.4. Relaciones con los Clientes (Customer Relationships)")
    add_bullet("Tanto el pacto del encuentro, la generación y lectura de QR, como la confirmación de pago y baja del catálogo ocurren de forma automática sin intervención manual.", "Automatización Self-Service: ")
    add_bullet("El historial de compras y ventas de cada usuario se alimenta con valoraciones reales de 1 a 5 estrellas y comentarios directos de las contrapartes, expulsando naturalmente a estafadores.", "Confianza Basada en Reputación Verificada: ")
    add_bullet("Los casos de cancelaciones o inasistencias ('No-Show') quedan registrados en el sistema, penalizando la visibilidad de usuarios incumplidores.", "Mecanismo Anti-Ghosting: ")

    add_heading_2("3.5. Fuentes de Ingresos (Revenue Streams)")
    add_body(
        "La premisa fundamental de Soltapp es mantener la transacción básica cara a cara 100% gratuita y sin comisiones para lograr adopción masiva. "
        "La monetización se construye a través de servicios de valor agregado:"
    )
    add_bullet("Vendedores particulares abonan micro-pagos para destacar sus publicaciones en el carrusel de Home y en los primeros resultados de búsqueda durante 3, 7 o 15 días.", "1. Publicaciones Destacadas (Boosts Freemium): ")
    add_bullet("Membresía mensual ($X/mes) para vendedores recurrentes y pequeños comercios: publicaciones ilimitadas, estadísticas de visualizaciones, soporte prioritario e insignia de 'Vendedor Destacado'.", "2. Suscripción Soltapp Pro: ")
    add_bullet("Locales gastronómicos y centros comerciales abonan una cuota mensual por figurar en el mapa interactivo de la app como 'Punto de Encuentro Seguro Oficial', captando flujo de personas.", "3. Red de Puntos Seguros Patrocinados: ")
    add_bullet("Tarifa única simbólica para usuarios que deseen verificar su identidad mediante validación de DNI y biometría, otorgando el badge 'Usuario Verificado'.", "4. Insignia de Verificación de Identidad: ")

    add_heading_2("3.6. Recursos Clave (Key Resources)")
    add_bullet("Código fuente optimizado en React Native y esquema de base de datos relacional PostgreSQL con RLS y realtime habilitado.", "Infraestructura Tecnológica: ")
    add_bullet("Algoritmo de cálculo de distancias por latitud/longitud y renderizado de mapa interactivo con OpenStreetMap y geocodificación.", "Módulo de Geolocalización: ")
    add_bullet("Mecanismo de generación de tokens QR con cifrado y expiración estricta de 5 minutos, impidiendo reutilización fraudulenta.", "Protocolo de Validación Criptográfica QR: ")
    add_bullet("Grafo social de transacciones pasadas y calificaciones cruzadas que constituye el activo intangible más valioso de la plataforma.", "Base de Datos de Reputación: ")

    add_heading_2("3.7. Actividades Clave (Key Activities)")
    add_bullet("Iteración ágil de la aplicación, optimización del rendimiento de escaneo QR, consumo de batería y estabilidad de WebSockets.", "Ingeniería y Desarrollo de Software: ")
    add_bullet("Filtro automatizado y manual de publicaciones ilegales, réplicas no autorizadas o comportamientos sospechosos.", "Moderación y Seguridad: ")
    add_bullet("Estrategia de atracción simétrica: garantizar que en cada zona geográfica exista un balance saludable entre oferta de productos y compradores activos.", "Gestión de Liquidez de Marketplace: ")
    add_bullet("Prospección y acuerdos con comercios locales para ampliar la red de Puntos de Encuentro Seguros.", "Desarrollo Comercial y Alianzas: ")

    add_heading_2("3.8. Socios Clave (Key Partnerships)")
    add_bullet("Supabase (base de datos, realtime, auth y storage) y Expo / EAS para integración y despliegue continuo.", "Proveedores Cloud e Infraestructura: ")
    add_bullet("Cadenas de cafeterías, estaciones de servicio (YPF, Shell) y centros comerciales que ofrecen seguridad física e iluminación para los encuentros.", "Red de Comercios Adheridos: ")
    add_bullet("Mercado Pago, MODO, Ualá y bancos que facilitan la transferencia en mano inmediata sin costo adicional para los usuarios.", "Fintechs y Billeteras Virtuales: ")
    add_bullet("Comunidades barriales de compra y venta, centros de estudiantes y asociaciones vecinales.", "Aliados Comunitarios: ")

    add_heading_2("3.9. Estructura de Costes (Cost Structure)")
    add_bullet("Servidores cloud de Supabase Pro, hosting de imágenes en bucket S3, cuotas de peticiones WebSocket y base de datos.", "Costos de Infraestructura y Servidores: ")
    add_bullet("Honorarios de desarrollo, testing, UI/UX y soporte al cliente.", "Equipo Técnico y Operativo: ")
    add_bullet("Publicidad geolocalizada en Meta Ads y Google Search para traccionar masa crítica en localidades piloto.", "Marketing y Adquisición (CAC): ")
    add_bullet("Tarifas de mantenimiento de cuentas en Apple Developer Program ($99 USD/año) y Google Play Console ($25 USD pago único).", "Licencias de Plataforma: ")

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 4: MODELO DE MONETIZACIÓN Y PROYECCIÓN DE INGRESOS
    # =========================================================================
    add_heading_1("Capítulo 4: Modelo de Monetización y Economía Unitaria")

    add_body(
        "Una de las mayores fortalezas de Soltapp es que NO depende de cobrar una comisión sobre el valor de venta "
        "para ser altamente rentable. El cobro de comisiones genera fricción, evasión (los usuarios se pasan el número de teléfono "
        "para no pagar la comisión) y encarece el producto. Soltapp adopta el modelo probado de Wallapop (España), "
        "Milanuncios y Craigslist, adaptado con micro-monetizaciones modernas:"
    )

    # Tabla de Vías de Ingresos
    t_rev = doc.add_table(rows=5, cols=4)
    t_rev.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_rev, color=HEX_BORDER, sz="6")

    headers_rev = ["Línea de Ingreso", "Mecanismo de Cobro", "Precio Estimado (ARS)", "Potencial de Escala"]
    for c_idx, h_text in enumerate(headers_rev):
        cell = t_rev.cell(0, c_idx)
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_padding(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(255, 255, 255)

    rev_rows = [
        ("Boost Destacado 3 Días", "Micro-pago por producto en portada", "$ 1.500 - $ 2.500", "Alto volumen en categorías calientes (celulares, autos)"),
        ("Boost Destacado 7 Días", "Micro-pago con prioridad en búsquedas", "$ 3.000 - $ 4.500", "Vendedores con apuro de liquidez"),
        ("Suscripción Soltapp Pro", "Membresía mensual para comercios", "$ 9.900 / mes", "Ingreso recurrente predecible (MRR)"),
        ("Punto Seguro Patrocinado", "Fee mensual para locales y cafeterías", "$ 25.000 - $ 40.000 / mes", "Monetización B2B atada al tráfico presencial")
    ]

    for r_idx, row_data in enumerate(rev_rows):
        for c_idx, val in enumerate(row_data):
            cell = t_rev.cell(r_idx + 1, c_idx)
            set_cell_padding(cell, top=80, bottom=80, left=100, right=100)
            if r_idx % 2 == 1:
                set_cell_background(cell, HEX_BG_CARD)
            else:
                set_cell_background(cell, "FFFFFF")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.size = Pt(9)
            r.font.name = "Arial"
            r.font.color.rgb = COLOR_DARK

    add_heading_2("4.1. Roadmap de Despliegue de Monetización")
    add_bullet("Crecimiento puro de base de usuarios y volumen de publicaciones en zona piloto (Pilar y alrededores). 100% gratuito sin fricciones.", "Fase 1 - Densidad (Meses 1-4): ")
    add_bullet("Lanzamiento de Publicaciones Destacadas (Boosts) y verificación opcional de DNI ('Soltapp Verify').", "Fase 2 - Freemium Boosts (Meses 5-8): ")
    add_bullet("Introducción de Soltapp Pro para microcomercios y habilitación de los primeros 20 Puntos Seguros Patrocinados en shoppings y cafeterías.", "Fase 3 - B2B & Pro (Meses 9-14): ")
    add_bullet("Integración de microcréditos para compras en cuotas mediante alianzas con billeteras virtuales.", "Fase 4 - Ecosistema Fintech (Meses 15+): ")

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 5: MATRIZ DE POSICIONAMIENTO Y VENTAJA COMPETITIVA
    # =========================================================================
    add_heading_1("Capítulo 5: Posicionamiento y Ventaja Competitiva")

    add_body(
        "Soltapp se sitúa en un punto óptimo ('sweet spot') del mercado argentino, combinando la gratuidad y cercanía "
        "de Facebook Marketplace con el rigor, la trazabilidad y la reputación de Mercado Libre:"
    )

    # Tabla Comparativa Competitiva
    t_comp = doc.add_table(rows=7, cols=4)
    t_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_comp, color=HEX_BORDER, sz="6")

    headers_comp = ["Variable / Atributo", "Soltapp Mobile", "Mercado Libre", "Facebook Marketplace"]
    for c_idx, h_text in enumerate(headers_comp):
        cell = t_comp.cell(0, c_idx)
        set_cell_background(cell, HEX_DARK if c_idx != 1 else HEX_PRIMARY)
        set_cell_padding(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(255, 255, 255)

    comp_rows = [
        ("Comisión por Venta", "0% (Trato directo en mano)", "15% a 25% + costos fijos", "0%"),
        ("Validación de Entrega", "Criptográfica por QR Dinámico", "Código de seguimiento postal", "Ninguna (Acuerdo ciego)"),
        ("Riesgo de Estafa", "Mínimo (Se prueba antes de pagar)", "Medio (Reclamos falsos de compradores)", "Muy Alto (Robos, perfiles falsos)"),
        ("Disponibilidad del Dinero", "Inmediata en mano o cuenta", "Retención de 14 a 30 días", "Inmediata"),
        ("Reputación del Usuario", "Mutua real ligada a productos", "Unilateral del vendedor", "Prácticamente nula o falsa"),
        ("Enfoque de Negocio", "Comercio hiperlocal de cercanía", "E-commerce nacional logístico", "Clasificados masivos desregulados")
    ]

    for r_idx, row_data in enumerate(comp_rows):
        for c_idx, val in enumerate(row_data):
            cell = t_comp.cell(r_idx + 1, c_idx)
            set_cell_padding(cell, top=80, bottom=80, left=100, right=100)
            if c_idx == 1:
                set_cell_background(cell, HEX_BG_LIGHT)
            elif r_idx % 2 == 1:
                set_cell_background(cell, HEX_BG_CARD)
            else:
                set_cell_background(cell, "FFFFFF")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            if c_idx == 1:
                r.bold = True
            r.font.size = Pt(9)
            r.font.name = "Arial"
            r.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 6: ESTRATEGIA GO-TO-MARKET (GTM) Y CONCLUSIONES
    # =========================================================================
    add_heading_1("Capítulo 6: Estrategia de Go-to-Market y Plan de Expansión")

    add_body(
        "El principal desafío de cualquier marketplace bilateral es el dilema del 'huevo y la gallina' (sin compradores "
        "no hay vendedores, y sin vendedores no hay compradores). La estrategia comprobada para resolver esto es la "
        "Densificación Hiperlocal Geográfica (la estrategia de Uber y DoorDash en sus orígenes):"
    )

    add_bullet("Concentrar todo el marketing de lanzamiento en una zona compacta con alto poder adquisitivo y densidad poblacional (Pilar y corredor Panamericana Norte). Se alcanza liquidez cuando el 80% de los usuarios encuentra un producto deseado a menos de 10 km.", "1. Plaza Piloto Concéntrica (Pilar): ")
    add_bullet("Captar a los mejores vendedores de grupos vecinales de Facebook e Instagram, ofreciéndoles publicación gratuita y destacada para poblar el catálogo inicial con artículos de calidad.", "2. Siembra Inicial de Oferta (Seeding): ")
    add_bullet("Establecer los 5 primeros 'Puntos Seguros Soltapp' en cafeterías céntricas conocidas, publicitando en redes 'Comprá y vendé seguro en Punto Seguro X'.", "3. Activación de Puntos Seguros: ")
    add_bullet("Replicar el modelo probado a Escobar, Tigre, San Isidro y Vicente López una vez consolidada la masa crítica de Pilar.", "4. Expansión Modular: ")

    add_heading_1("Capítulo 7: Conclusiones y Próximos Pasos Estratégicos")

    add_callout(
        "Conclusión Estratégica:\n"
        "El proyecto Soltapp Mobile ha superado con éxito la fase de validación técnica del núcleo del producto. "
        "Las funcionalidades de encuentro cara a cara, validación por QR dinámico, calificación bidireccional "
        "y registro histórico de transacciones constituyen una base sólida y diferencial en el mercado.\n\n"
        "Próximos Pasos Recomendados:\n"
        "1. Despliegue en producción y testeo con grupo cerrado de 50 usuarios reales en Pilar.\n"
        "2. Monitoreo de métricas clave: Tasa de conversión de encuentros (acordados vs. completados con QR), "
        "tasa de No-Show y tiempo medio de venta por producto.\n"
        "3. Implementación del módulo de Publicaciones Destacadas (Boosts) para dar inicio a la monetización en Fase 2.\n"
        "4. Formalización de los primeros acuerdos comerciales para Puntos Seguros en espacios públicos y comerciales.",
        title="Dictamen Final y Hoja de Ruta"
    )

    doc.save(output_path)
    print(f"Documento generado exitosamente en: {output_path}")

if __name__ == "__main__":
    out_file = r"C:\Users\nenri\OneDrive\Escritorio\soltapp-mobile\Soltapp_Business_Model_Canvas.docx"
    create_soltapp_bmc_document(out_file)
