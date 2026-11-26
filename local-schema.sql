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

-- ============================================
-- BORRADO LÓGICO DE PRODUCTOS 09/10/2026
-- ============================================
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ============================================
-- BORRADO LÓGICO DE MOZOS
-- ============================================
ALTER TABLE mozos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_mozos_activo ON mozos(activo);

-- ============================================
-- PEDIDOS: EVITAR PEDIDOS ACTIVOS DUPLICADOS
-- 26/11/2026
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_una_mesa_activa
ON public.pedidos (id_mesa)
WHERE estado = 'activo';

-- ============================================
-- RPC: AGREGAR ITEM AL PEDIDO
-- 26/11/2026
-- ============================================

CREATE OR REPLACE FUNCTION public.agregar_item_pedido(
    p_mesa_id INTEGER,
    p_producto_id BIGINT,
    p_cantidad INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_usuario_id UUID;
    v_pedido_id BIGINT;
    v_detalle_id BIGINT;
    v_precio NUMERIC;
    v_cantidad_actual INTEGER;
    v_nueva_cantidad INTEGER;
    v_total NUMERIC;
BEGIN
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF p_mesa_id IS NULL OR p_mesa_id <= 0 THEN
        RAISE EXCEPTION 'Número de mesa inválido';
    END IF;

    IF p_producto_id IS NULL OR p_producto_id <= 0 THEN
        RAISE EXCEPTION 'Producto inválido';
    END IF;

    IF p_producto_id > 2147483647 THEN
        RAISE EXCEPTION 'El identificador del producto excede el límite admitido por detalle_pedido';
    END IF;

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor que cero';
    END IF;

    -- Validar producto y obtener precio
    SELECT precio
    INTO v_precio
    FROM public.productos
    WHERE id_producto = p_producto_id
      AND activo IS DISTINCT FROM FALSE
      AND disponible IS DISTINCT FROM FALSE
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto no existe o no está disponible';
    END IF;

    -- Crear pedido si la mesa no tiene uno activo
    INSERT INTO public.pedidos (
        id_mesa,
        estado,
        total,
        creado_por
    )
    VALUES (
        p_mesa_id,
        'activo',
        0,
        v_usuario_id
    )
    ON CONFLICT (id_mesa)
    WHERE estado = 'activo'
    DO NOTHING
    RETURNING id_pedido INTO v_pedido_id;

    -- Recuperar pedido existente
    IF v_pedido_id IS NULL THEN
        SELECT id_pedido
        INTO v_pedido_id
        FROM public.pedidos
        WHERE id_mesa = p_mesa_id
          AND estado = 'activo'
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No se pudo recuperar el pedido activo de la mesa';
        END IF;
    ELSE
        PERFORM 1
        FROM public.pedidos
        WHERE id_pedido = v_pedido_id
        FOR UPDATE;
    END IF;

    -- Comprobar compatibilidad con INTEGER
    IF v_pedido_id > 2147483647 THEN
        RAISE EXCEPTION 'El identificador del pedido excede el límite admitido por detalle_pedido';
    END IF;

    -- Buscar producto existente en el pedido
    SELECT id_detalle, cantidad
    INTO v_detalle_id, v_cantidad_actual
    FROM public.detalle_pedido
    WHERE id_pedido = v_pedido_id::INTEGER
      AND id_producto = p_producto_id::INTEGER
    FOR UPDATE;

    IF FOUND THEN
        -- Incrementar cantidad
        v_nueva_cantidad := v_cantidad_actual + p_cantidad;

        UPDATE public.detalle_pedido
        SET cantidad = v_nueva_cantidad,
            precio_unitario = v_precio,
            subtotal = v_precio * v_nueva_cantidad
        WHERE id_detalle = v_detalle_id;
    ELSE
        -- Insertar nuevo detalle
        INSERT INTO public.detalle_pedido (
            id_pedido,
            id_producto,
            cantidad,
            precio_unitario,
            subtotal
        )
        VALUES (
            v_pedido_id::INTEGER,
            p_producto_id::INTEGER,
            p_cantidad,
            v_precio,
            v_precio * p_cantidad
        );
    END IF;

    -- Recalcular total
    UPDATE public.pedidos
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM public.detalle_pedido
        WHERE id_pedido = v_pedido_id::INTEGER
    )
    WHERE id_pedido = v_pedido_id
    RETURNING total INTO v_total;

    RETURN jsonb_build_object(
        'pedidoId', v_pedido_id,
        'mesaId', p_mesa_id,
        'total', v_total
    );
END;
$$;

-- Permisos
REVOKE ALL
ON FUNCTION public.agregar_item_pedido(INTEGER, BIGINT, INTEGER)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.agregar_item_pedido(INTEGER, BIGINT, INTEGER)
TO authenticated;

-- ============================================
-- RPC: ACTUALIZAR PEDIDO
-- CANCELAR AUTOMÁTICAMENTE SI QUEDA VACÍO
-- 26/11/2026
-- ============================================

CREATE OR REPLACE FUNCTION public.actualizar_pedido(
    p_mesa_id INTEGER,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_pedido_id BIGINT;
    v_item JSONB;
    v_producto_id BIGINT;
    v_cantidad INTEGER;
    v_precio NUMERIC;
    v_subtotal NUMERIC;
    v_total NUMERIC := 0;
    v_existentes BIGINT[];
    v_cantidad_detalles INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF p_mesa_id IS NULL OR p_mesa_id <= 0 THEN
        RAISE EXCEPTION 'La mesa indicada no es válida';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'La lista de productos no es válida';
    END IF;

    -- Bloquear el pedido activo
    SELECT id_pedido
    INTO v_pedido_id
    FROM public.pedidos
    WHERE id_mesa = p_mesa_id
      AND estado = 'activo'
    FOR UPDATE;

    IF v_pedido_id IS NULL THEN
        RAISE EXCEPTION 'No hay un pedido activo para esta mesa';
    END IF;

    IF v_pedido_id > 2147483647 THEN
        RAISE EXCEPTION 'El ID del pedido supera el rango permitido';
    END IF;

    -- Productos que ya pertenecían al pedido
    SELECT COALESCE(
        array_agg(DISTINCT id_producto::BIGINT),
        ARRAY[]::BIGINT[]
    )
    INTO v_existentes
    FROM public.detalle_pedido
    WHERE id_pedido = v_pedido_id::INTEGER;

    -- Validar todos los elementos antes de modificar
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        IF jsonb_typeof(v_item) <> 'object'
           OR NOT (v_item ? 'id_producto')
           OR NOT (v_item ? 'cantidad')
           OR jsonb_typeof(v_item->'id_producto') <> 'number'
           OR jsonb_typeof(v_item->'cantidad') <> 'number'
           OR (v_item->>'id_producto') !~ '^[1-9][0-9]*$'
           OR (v_item->>'cantidad') !~ '^(0|[1-9][0-9]*)$'
        THEN
            RAISE EXCEPTION 'La lista contiene un producto o cantidad inválidos';
        END IF;

        v_producto_id := (v_item->>'id_producto')::BIGINT;
        v_cantidad := (v_item->>'cantidad')::INTEGER;

        IF v_producto_id > 2147483647 THEN
            RAISE EXCEPTION 'El ID del producto supera el rango permitido';
        END IF;

        -- Rechazar productos duplicados
        IF (
            SELECT COUNT(*)
            FROM jsonb_array_elements(p_items) AS x(value)
            WHERE x.value->>'id_producto' = v_item->>'id_producto'
        ) > 1 THEN
            RAISE EXCEPTION 'La lista contiene productos duplicados';
        END IF;

        -- Los productos nuevos deben estar disponibles
        IF v_cantidad > 0
           AND NOT (v_producto_id = ANY(v_existentes))
        THEN
            SELECT precio
            INTO v_precio
            FROM public.productos
            WHERE id_producto = v_producto_id
              AND activo IS TRUE
              AND disponible IS TRUE
              AND deleted_at IS NULL;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'El producto % no existe o no está disponible',
                    v_producto_id;
            END IF;
        END IF;
    END LOOP;

    -- Reemplazar los detalles anteriores
    DELETE FROM public.detalle_pedido
    WHERE id_pedido = v_pedido_id::INTEGER;

    -- Insertar productos con precios de la base de datos
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_producto_id := (v_item->>'id_producto')::BIGINT;
        v_cantidad := (v_item->>'cantidad')::INTEGER;

        IF v_cantidad > 0 THEN
            SELECT precio
            INTO v_precio
            FROM public.productos
            WHERE id_producto = v_producto_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'No se encontró el producto %', v_producto_id;
            END IF;

            v_subtotal := v_precio * v_cantidad;

            INSERT INTO public.detalle_pedido (
                id_pedido,
                id_producto,
                cantidad,
                precio_unitario,
                subtotal
            )
            VALUES (
                v_pedido_id::INTEGER,
                v_producto_id::INTEGER,
                v_cantidad,
                v_precio,
                v_subtotal
            );

            v_total := v_total + v_subtotal;
        END IF;
    END LOOP;

    -- Comprobar cuántos detalles quedaron
    SELECT COUNT(*)
    INTO v_cantidad_detalles
    FROM public.detalle_pedido
    WHERE id_pedido = v_pedido_id::INTEGER;

    -- Cancelar automáticamente si queda vacío
    UPDATE public.pedidos
    SET total = v_total,
        estado = CASE
            WHEN v_cantidad_detalles = 0 THEN 'cancelado'
            ELSE 'activo'
        END,
        updated_at = NOW()
    WHERE id_pedido = v_pedido_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'pedidoId', v_pedido_id,
        'mesaId', p_mesa_id,
        'total', v_total,
        'pedidoCancelado', v_cantidad_detalles = 0
    );
END;
$$;

-- Permisos
REVOKE ALL
ON FUNCTION public.actualizar_pedido(INTEGER, JSONB)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.actualizar_pedido(INTEGER, JSONB)
TO authenticated;

