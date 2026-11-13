-- ============================================================
-- CÍRCULO KA — Esquema SQL completo para Supabase
-- Etapa 2: Árbol de los Sueños + Libro de los Habitantes
-- ============================================================
-- Este archivo se ejecuta una sola vez en el SQL Editor de Supabase.
-- Contiene: tablas, índices, RLS, triggers, correcciones de seguridad.
-- ============================================================

-- ============================================================
-- SECCIÓN 1: TABLAS
-- ============================================================

-- 1.1 perfiles — Libro de los Habitantes
CREATE TABLE IF NOT EXISTS perfiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar          TEXT NOT NULL DEFAULT 'mawari.png',
  nombre_universo TEXT NOT NULL CHECK (char_length(nombre_universo) BETWEEN 1 AND 30),
  guardia         TEXT NOT NULL DEFAULT 'Custodio de las Raíces Vivas',
  presentacion    TEXT CHECK (char_length(presentacion) <= 500),
  rol             TEXT NOT NULL DEFAULT 'habitante'
                  CHECK (rol IN ('habitante', 'confiable', 'guardian', 'admin')),
  bloqueada       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);
CREATE INDEX IF NOT EXISTS idx_perfiles_bloqueada ON perfiles(bloqueada) WHERE bloqueada = TRUE;

-- 1.2 suenos — Árbol de los Sueños
CREATE TABLE IF NOT EXISTS suenos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habitante_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  texto         TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 1000),
  simbolo       TEXT NOT NULL DEFAULT 'luz',
  color         TEXT NOT NULL DEFAULT '#ffe58f',
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'bloqueado')),
  moderador_id  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderado_en   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_suenos_aprobados ON suenos(creado_en DESC) WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_suenos_pendientes ON suenos(creado_en) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_suenos_habitante ON suenos(habitante_id);

-- 1.3 visitas — Encuentros (preparada para Etapa 3)
CREATE TABLE IF NOT EXISTS visitas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anfitriona_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  visitante_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  mensaje       TEXT NOT NULL CHECK (char_length(mensaje) BETWEEN 1 AND 500),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'bloqueado')),
  moderador_id  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderado_en   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_visitas_anfitriona_aprobadas ON visitas(creado_en DESC) WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_visitas_pendientes ON visitas(creado_en) WHERE estado = 'pendiente';

-- 1.4 descubrimientos — Mural (preparada para Etapa 3)
CREATE TABLE IF NOT EXISTS descubrimientos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habitante_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 100),
  descripcion   TEXT NOT NULL CHECK (char_length(descripcion) <= 500),
  imagen_url    TEXT,
  region_origen TEXT CHECK (region_origen IN ('viva', 'espiritual', 'creacion', 'circulo')),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'bloqueado')),
  moderador_id  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderado_en   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_descubrimientos_aprobados ON descubrimientos(creado_en DESC) WHERE estado = 'aprobado';

-- 1.5 creaciones — Casa de los Creadores (preparada para Etapa 4)
CREATE TABLE IF NOT EXISTS creaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habitante_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 100),
  tipo          TEXT NOT NULL CHECK (tipo IN ('ilustracion', 'modelo3d', 'historia', 'otro')),
  url_archivo   TEXT,
  descripcion   TEXT NOT NULL CHECK (char_length(descripcion) <= 500),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'bloqueado')),
  moderador_id  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderado_en   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_creaciones_aprobadas ON creaciones(creado_en DESC) WHERE estado = 'aprobado';

-- 1.6 eventos — Calendario (preparada para Etapa 4)
CREATE TABLE IF NOT EXISTS eventos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 100),
  descripcion TEXT NOT NULL CHECK (char_length(descripcion) <= 1000),
  fecha       TIMESTAMPTZ NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('actividad', 'desafio', 'encuentro')),
  creado_por  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eventos_futuros ON eventos(fecha) WHERE fecha > NOW();

-- 1.7 moderacion_auditoria — registro inmutable de decisiones
CREATE TABLE IF NOT EXISTS moderacion_auditoria (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderador_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  tabla_origen  TEXT NOT NULL CHECK (tabla_origen IN ('suenos','visitas','descubrimientos','creaciones')),
  registro_id   UUID NOT NULL,
  decision      TEXT NOT NULL CHECK (decision IN ('aprobar','rechazar','bloquear','desbloquear')),
  motivo        TEXT CHECK (char_length(motivo) <= 300),
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_moderador ON moderacion_auditoria(moderador_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro ON moderacion_auditoria(tabla_origen, registro_id);

-- ============================================================
-- SECCIÓN 2: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE descubrimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE creaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderacion_auditoria ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECCIÓN 3: POLÍTICAS RLS (con correcciones de seguridad)
-- ============================================================

-- 3.1 perfiles
CREATE POLICY "perfiles_lectura_publica" ON perfiles FOR SELECT USING (TRUE);
CREATE POLICY "perfiles_insert_propio" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_update_propio" ON perfiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_delete_admin" ON perfiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.2 suenos — INSERT con control de estado (corrección punto 2)
CREATE POLICY "suenos_lectura" ON suenos FOR SELECT USING (
  estado = 'aprobado'
  OR auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "suenos_insert_controlado" ON suenos FOR INSERT WITH CHECK (
  auth.uid() = habitante_id
  AND NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.bloqueada = TRUE)
  AND (
    estado = 'pendiente'
    OR (estado = 'aprobado' AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('confiable', 'guardian', 'admin')
    ))
  )
  AND estado NOT IN ('rechazado', 'bloqueado')
);
CREATE POLICY "suenos_update_moderador" ON suenos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "suenos_delete_propio_admin" ON suenos FOR DELETE USING (
  auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.3 visitas — mismo patrón
CREATE POLICY "visitas_lectura" ON visitas FOR SELECT USING (
  estado = 'aprobado'
  OR auth.uid() = visitante_id
  OR auth.uid() = anfitriona_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "visitas_insert_controlado" ON visitas FOR INSERT WITH CHECK (
  auth.uid() = visitante_id
  AND auth.uid() <> anfitriona_id
  AND NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.bloqueada = TRUE)
  AND (
    estado = 'pendiente'
    OR (estado = 'aprobado' AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('confiable', 'guardian', 'admin')
    ))
  )
  AND estado NOT IN ('rechazado', 'bloqueado')
);
CREATE POLICY "visitas_update_moderador" ON visitas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "visitas_delete_anfitriona_admin" ON visitas FOR DELETE USING (
  auth.uid() = anfitriona_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.4 descubrimientos — mismo patrón
CREATE POLICY "descubrimientos_lectura" ON descubrimientos FOR SELECT USING (
  estado = 'aprobado'
  OR auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "descubrimientos_insert_controlado" ON descubrimientos FOR INSERT WITH CHECK (
  auth.uid() = habitante_id
  AND NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.bloqueada = TRUE)
  AND (
    estado = 'pendiente'
    OR (estado = 'aprobado' AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('confiable', 'guardian', 'admin')
    ))
  )
  AND estado NOT IN ('rechazado', 'bloqueado')
);
CREATE POLICY "descubrimientos_update_moderador" ON descubrimientos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "descubrimientos_delete_propio_admin" ON descubrimientos FOR DELETE USING (
  auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.5 creaciones — mismo patrón
CREATE POLICY "creaciones_lectura" ON creaciones FOR SELECT USING (
  estado = 'aprobado'
  OR auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "creaciones_insert_controlado" ON creaciones FOR INSERT WITH CHECK (
  auth.uid() = habitante_id
  AND NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.bloqueada = TRUE)
  AND (
    estado = 'pendiente'
    OR (estado = 'aprobado' AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('confiable', 'guardian', 'admin')
    ))
  )
  AND estado NOT IN ('rechazado', 'bloqueado')
);
CREATE POLICY "creaciones_update_moderador" ON creaciones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "creaciones_delete_propio_admin" ON creaciones FOR DELETE USING (
  auth.uid() = habitante_id
  OR EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.6 eventos — públicos para lectura, solo Guardianes escriben
CREATE POLICY "eventos_lectura_publica" ON eventos FOR SELECT USING (TRUE);
CREATE POLICY "eventos_insert_guardian" ON eventos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "eventos_update_guardian" ON eventos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
CREATE POLICY "eventos_delete_admin" ON eventos FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- 3.7 auditoría — inmutable (corrección punto 4)
-- Sin política INSERT directa: solo el trigger SECURITY DEFINER puede insertar
CREATE POLICY "auditoria_lectura_guardian" ON moderacion_auditoria FOR SELECT USING (
  EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin'))
);
-- UPDATE y DELETE explícitamente denegados
CREATE POLICY "auditoria_no_update" ON moderacion_auditoria FOR UPDATE USING (FALSE) WITH CHECK (FALSE);
CREATE POLICY "auditoria_no_delete" ON moderacion_auditoria FOR DELETE USING (FALSE);

-- ============================================================
-- SECCIÓN 4: GRANT DE COLUMNAS (corrección punto 1)
-- Las habitantes solo pueden UPDATE de columnas no sensibles
-- ============================================================
REVOKE UPDATE ON perfiles FROM authenticated;
GRANT UPDATE (avatar, nombre_universo, guardia, presentacion) ON perfiles TO authenticated;

-- ============================================================
-- SECCIÓN 5: TRIGGERS
-- ============================================================

-- 5.1 Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION crear_perfil_al_registrar()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, avatar, nombre_universo)
  VALUES (NEW.id, 'mawari.png', 'Viajera')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_crear_perfil ON auth.users;
CREATE TRIGGER trigger_crear_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_perfil_al_registrar();

-- 5.2 Prevenir cambios de rol no autorizados (corrección punto 1, capa 2)
CREATE OR REPLACE FUNCTION prevent_rol_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol <> OLD.rol THEN
    IF NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin') THEN
      RAISE EXCEPTION 'Solo los administradores pueden cambiar el rol';
    END IF;
  END IF;
  IF NEW.bloqueada <> OLD.bloqueada THEN
    IF NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin')) THEN
      RAISE EXCEPTION 'Solo los guardianes pueden bloquear habitantes';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_rol_change ON perfiles;
CREATE TRIGGER trigger_prevent_rol_change
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION prevent_rol_change();

-- 5.3 Registrar auditoría automáticamente (corrección punto 4)
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  mod_id UUID;
  decision_text TEXT;
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    mod_id := auth.uid();
    IF NEW.estado = 'aprobado' AND OLD.estado <> 'aprobado' THEN
      decision_text := 'aprobar';
    ELSIF NEW.estado = 'rechazado' AND OLD.estado <> 'rechazado' THEN
      decision_text := 'rechazar';
    ELSIF NEW.estado = 'bloqueado' AND OLD.estado <> 'bloqueado' THEN
      decision_text := 'bloquear';
    ELSE
      RETURN NEW;
    END IF;
    INSERT INTO moderacion_auditoria (moderador_id, tabla_origen, registro_id, decision)
    VALUES (mod_id, TG_TABLE_NAME, NEW.id, decision_text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auditoria_suenos ON suenos;
CREATE TRIGGER trigger_auditoria_suenos AFTER UPDATE OF estado ON suenos
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
DROP TRIGGER IF EXISTS trigger_auditoria_visitas ON visitas;
CREATE TRIGGER trigger_auditoria_visitas AFTER UPDATE OF estado ON visitas
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
DROP TRIGGER IF EXISTS trigger_auditoria_descubrimientos ON descubrimientos;
CREATE TRIGGER trigger_auditoria_descubrimientos AFTER UPDATE OF estado ON descubrimientos
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
DROP TRIGGER IF EXISTS trigger_auditoria_creaciones ON creaciones;
CREATE TRIGGER trigger_auditoria_creaciones AFTER UPDATE OF estado ON creaciones
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- 5.4 Verificar confianza: 5 aportes aprobados → rol confiable
CREATE OR REPLACE FUNCTION verificar_confianza()
RETURNS TRIGGER AS $$
DECLARE
  total_aprobados INTEGER;
BEGIN
  IF NEW.estado = 'aprobado' AND (OLD.estado IS NULL OR OLD.estado <> 'aprobado') THEN
    SELECT COUNT(*) INTO total_aprobados FROM (
      SELECT id FROM suenos WHERE habitante_id = NEW.habitante_id AND estado = 'aprobado'
      UNION ALL
      SELECT id FROM visitas WHERE visitante_id = NEW.habitante_id AND estado = 'aprobado'
      UNION ALL
      SELECT id FROM descubrimientos WHERE habitante_id = NEW.habitante_id AND estado = 'aprobado'
      UNION ALL
      SELECT id FROM creaciones WHERE habitante_id = NEW.habitante_id AND estado = 'aprobado'
    ) AS total;
    IF total_aprobados >= 5 THEN
      UPDATE perfiles SET rol = 'confiable' WHERE id = NEW.habitante_id AND rol = 'habitante';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_verificar_confianza_suenos ON suenos;
CREATE TRIGGER trigger_verificar_confianza_suenos AFTER UPDATE OF estado ON suenos
  FOR EACH ROW EXECUTE FUNCTION verificar_confianza();

-- ============================================================
-- SECCIÓN 6: FUNCIONES ADMINISTRATIVAS (SECURITY DEFINER)
-- ============================================================

-- Designar Guardián (solo Admin)
CREATE OR REPLACE FUNCTION designar_guardian(habitante_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden designar guardianes';
  END IF;
  UPDATE perfiles SET rol = 'guardian', actualizado_en = NOW()
  WHERE id = habitante_id AND rol IN ('habitante', 'confiable');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bloquear habitante (Guardianes y Admin)
CREATE OR REPLACE FUNCTION bloquear_habitante(habitante_id UUID, motivo TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('guardian', 'admin')) THEN
    RAISE EXCEPTION 'Solo guardianes pueden bloquear habitantes';
  END IF;
  UPDATE perfiles SET bloqueada = TRUE, actualizado_en = NOW()
  WHERE id = habitante_id AND rol <> 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECCIÓN 7: DESIGNAR A YELI COMO ADMIN
-- Ejecutar DESPUÉS de que Yeli se registre por primera vez.
-- Reemplazar 'EMAIL-DE-YELI' por el email real de Yeli.
-- ============================================================
-- UPDATE perfiles SET rol = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'EMAIL-DE-YELI'
-- );

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
