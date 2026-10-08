-- ============================================
-- ESQUEMA COMPLETO - SISTEMA PARRILLA MILVER
-- Backup consolidado para entorno local
-- ============================================

-- ============================================
-- 1. TABLA CATEGORÍAS
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLA PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    id_categoria INTEGER REFERENCES categorias(id_categoria),
    disponible BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLA PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido BIGSERIAL PRIMARY KEY,
    id_mesa INTEGER NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'activo',
    total DECIMAL(10,2) DEFAULT 0,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABLA DETALLE_PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle BIGSERIAL PRIMARY KEY,
    id_pedido INTEGER REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABLA RESERVAS
-- ============================================
CREATE TABLE IF NOT EXISTS reservas (
    id_reserva BIGSERIAL PRIMARY KEY,
    id_mesa INTEGER NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    fecha_reserva DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_reserva TIME NOT NULL DEFAULT CURRENT_TIME,
    cantidad_personas INTEGER DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    notas TEXT,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. TABLA MOZOS (versión final sin apellido/telefono)
-- ============================================
CREATE TABLE IF NOT EXISTS mozos (
    id_mozo BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reservas_mesa ON reservas(id_mesa);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_estado ON reservas(fecha_reserva, estado);

-- ============================================
-- DATOS INICIALES - CATEGORÍAS
-- ============================================
INSERT INTO categorias (nombre, descripcion, orden) VALUES
    ('Menús', 'Menús completos', 1),
    ('Minutas', 'Platos rápidos', 2),
    ('Bebidas', 'Bebidas sin alcohol', 3),
    ('Postres', 'Postres caseros', 4),
    ('Vinos', 'Vinos y bebidas con alcohol', 5)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- DATOS INICIALES - PRODUCTOS
-- ============================================
INSERT INTO productos (nombre, precio, id_categoria) VALUES
    ('Menú Parrillada', 25000, 1),
    ('Menú Infantil', 22000, 1),
    ('Porción Papas Fritas', 10000, 2),
    ('Porción Ensalada Especial', 12000, 2),
    ('Coca Cola 1.5L', 16000, 3),
    ('Sprite 1.5L', 16500, 3),
    ('Agua Saborizada 1.5L', 14000, 3),
    ('Tricolor 1 porción', 18000, 4),
    ('Chic Cakes 1 porción', 19000, 4),
    ('Escocés 1 porción', 19000, 4),
    ('Naufrago', 4500, 5),
    ('Finca Las Mora', 5500, 5),
    ('Benjamin', 6000, 5),
    ('Alma Mora', 7000, 5),
    ('Alaris', 5800, 5),
    ('Dilema', 4800, 5),
    ('Valentin L.', 4500, 5),
    ('Trumpeter', 12000, 5),
    ('Fernet', 22000, 5),
    ('Latitud 33', 8500, 5);

-- ============================================
-- DATOS INICIALES - MOZOS
-- ============================================
INSERT INTO mozos (nombre) VALUES
    ('Juan Pérez'),
    ('María García'),
    ('Carlos Rodríguez'),
    ('Laura Martínez');

-- ============================================
-- FUNCIÓN Y TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservas_updated_at ON reservas;
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS RLS

-- CATEGORÍAS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos pueden ver categorías" ON categorias
    FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar categorías" ON categorias
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Todos pueden ver productos" ON productos
    FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar productos" ON productos
    FOR ALL USING (auth.role() = 'authenticated');

-- PEDIDOS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden gestionar pedidos" ON pedidos
    FOR ALL USING (auth.role() = 'authenticated');

-- DETALLE_PEDIDO
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden gestionar detalles" ON detalle_pedido
    FOR ALL USING (auth.role() = 'authenticated');

-- RESERVAS
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver todas las reservas" ON reservas
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden crear reservas" ON reservas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden actualizar reservas" ON reservas
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden eliminar reservas" ON reservas
    FOR DELETE USING (auth.role() = 'authenticated');

-- MOZOS
ALTER TABLE mozos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver mozos" ON mozos
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear mozos" ON mozos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar mozos" ON mozos
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar mozos" ON mozos
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 'Tablas creadas:' AS mensaje;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- PRODUCTOS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

