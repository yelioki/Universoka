# Círculo Ka — Guía de Setup

Esta guía te lleva paso a paso para activar el Círculo Ka en Universo Ka.
Sigue los pasos en orden. Si te trabas en alguno, escríbeme.

## Resumen

Vas a hacer 5 cosas:
1. Crear un proyecto en Supabase (gratis)
2. Ejecutar el esquema SQL (copiar y pegar)
3. Configurar magic link
4. Rellenar un archivo con dos valores
5. Subir los archivos a GitHub

Tiempo total estimado: 30-45 minutos.

---

## Paso 1 · Crear proyecto en Supabase

1. Ve a https://supabase.com en tu navegador.
2. Haz clic en «Start your project» o «Sign up».
3. Inicia sesión con GitHub (más fácil) o con tu email.
4. Haz clic en «New project».
5. Rellena:
   - **Name**: Universo Ka Círculo
   - **Database Password**: inventa una contraseña larga y guárdala en un gestor de contraseñas. NO la pierdas.
   - **Region**: South America (São Paulo) si la mayoría de tus habitantes están en Chile/LatAm, si no, la más cercana.
   - **Pricing plan**: Free (no necesitas Pro ahora).
6. Haz clic en «Create new project».
7. Espera 2-3 minutos a que Supabase cree el proyecto. Verás un spinner.

Cuando termine, verás el dashboard de tu proyecto.

---

## Paso 2 · Ejecutar el esquema SQL

1. En el dashboard de Supabase, busca el ícono «SQL Editor» en el menú izquierdo (ícono de `</>`).
2. Haz clic en «New query».
3. Abre el archivo `circulo-ka-schema.sql` que está en la carpeta de descarga.
4. Copia TODO el contenido del archivo.
5. Pégalo en el editor de Supabase.
6. Haz clic en «Run» (botón verde abajo).
7. Espera a que termine (10-30 segundos).
8. Si todo sale bien, verás «Success. No rows returned» en la parte inferior.

Esto crea las 6 tablas, las políticas de seguridad, los triggers y los buckets de almacenamiento. Todo en un solo paso.

### Verificar que se creó bien

En el mismo SQL Editor, pega esto y ejecútalo:

```sql
SELECT 'tablas' AS tipo, COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
UNION ALL
SELECT 'políticas', COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

Debería mostrar:
- tablas: 7 (perfiles, suenos, visitas, descubrimientos, creaciones, eventos, moderacion_auditoria)
- políticas: ~30

Si los números coinciden, el esquema está bien.

---

## Paso 3 · Configurar magic link

1. En el dashboard de Supabase, busca «Authentication» en el menú izquierdo.
2. Haz clic en «Providers».
3. Verifica que «Email» esté habilitado (lo está por defecto).
4. Haz clic en «URL Configuration» (o «Settings» dentro de Authentication).
5. En «Site URL», escribe: `https://yelioki.github.io` (o el dominio donde tengas tu app).
6. En «Redirect URLs», agrega: `https://yelioki.github.io/Universoka/circulo-ka.html`
   (Ajusta la URL según cómo esté configurado tu GitHub Pages).
7. Guarda los cambios.

Con esto, cuando una habitante reciba el magic link por email y haga clic, será redirigida a tu app ya autenticada.

### Nota sobre emails

El tier gratuito de Supabase usa un servicio de email limitado (~4 emails por hora).
Para empezar está bien. Si la comunidad crece y necesitas más emails,
puedes configurar un SMTP propio más adelante (SendGrid tiene 100 emails/día gratis).

---

## Paso 4 · Rellenar supabase-client.js

1. En el dashboard de Supabase, ve a «Settings» (ícono de engranaje abajo a la izquierda).
2. Haz clic en «API».
3. Verás dos valores importantes:
   - **Project URL**: algo como `https://abcdefghijklm.supabase.co`
   - **anon public key**: una cadena larga que empieza con `eyJ...`

4. Abre el archivo `supabase-client.js` en un editor de texto (Bloc de notas, VS Code, o el que uses).
5. Busca estas dos líneas al principio:

```javascript
var SUPABASE_URL = "https://RELLENAR-TU-PROJECT-ID.supabase.co";
var SUPABASE_ANON_KEY = "RELLENAR-TU-ANON-KEY-AQUI";
```

6. Reemplaza `https://RELLENAR-TU-PROJECT-ID.supabase.co` con tu Project URL real.
7. Reemplaza `RELLENAR-TU-ANON-KEY-AQUI` con tu anon public key real.

Quedaría algo así:

```javascript
var SUPABASE_URL = "https://abcdefghijklm.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...";
```

8. Guarda el archivo.

### Importante

- La **anon key** es pública por diseño. No es un secreto. Puede ir en el frontend sin riesgo.
- La **service_role key** (que también verás en la misma página) NUNCA se pone en el frontend. Guárdala en un gestor de contraseñas. Solo la usarás tú para operaciones administrativas.

---

## Paso 5 · Subir los archivos a GitHub

Necesitas subir estos archivos nuevos a tu repositorio GitHub (yelioki/Universoka):

### Archivos nuevos (10)

1. `circulo-ka-schema.sql` — el esquema SQL (lo ejecutaste en Supabase, pero también va al repo para referencia)
2. `supabase-client.js` — el que acabas de rellenar con tus claves
3. `circulo-auth.js` — lógica de autenticación
4. `circulo-auth.html` — pantalla de magic link
5. `circulo-ka.html` — panorama del Círculo
6. `circulo-mundo.json` — configuración de los 6 puntos
7. `arbol-suenos.html` — Árbol de los Sueños
8. `libro-habitantes.html` — Libro de los Habitantes
9. `circulo-ambiente.js` — ambiente sonoro del Círculo (si existe)
10. `README-circulo-ka-setup.md` — esta guía

### Archivos modificados (3)

11. `ka-mundo.json` — el punto «circulo» ahora está activo
12. `ka-nav.js` — el botón Círculo ahora es enlace
13. `sw.js` — versión ka-v14 con los archivos nuevos en el cache

### Cómo subirlos

Igual que en P1: ve a tu repositorio en GitHub, «Add file» → «Upload files», arrastra todos los archivos, escribe un mensaje como «Círculo Ka Etapa 2», y haz commit.

---

## Paso 6 · Probar que funciona

1. Espera 1-2 minutos a que GitHub Pages actualice (a veces tarda).
2. Abre tu app: https://yelioki.github.io/Universoka/ (o tu URL).
3. Entra al Tepuy Central.
4. Haz clic en el punto «Círculo Ka» (ahora debería estar activo, con luz dorada).
5. Deberías ver la pantalla de magic link.
6. Escribe tu email y haz clic en «Recibir enlace mágico».
7. Revisa tu correo. Debería llegar un email de Supabase con un enlace.
8. Haz clic en el enlace.
9. Volverás a la app, ya autenticada, viendo el panorama del Círculo con 6 puntos.
10. Haz clic en «Árbol de los Sueños». Deberías poder escribir un sueño y publicarlo.
11. Haz clic en «Libro de los Habitantes». Deberías ver tu perfil y poder editarlo.

### Si algo no funciona

- **La pantalla de magic link no carga**: verifica que `supabase-client.js` tenga bien la URL y la anon key.
- **No llega el email**: revisa spam. Supabase a veces tarda 1-2 minutos. El free tier limita a 4 emails/hora.
- **El enlace del email no redirige bien**: verifica la «Site URL» y «Redirect URLs» en Authentication → Settings.
- **Error de RLS al publicar un sueño**: verifica que ejecutaste TODO el esquema SQL del paso 2.
- **El Círculo se ve vacío**: es normal, no hay habitantes ni sueños todavía. Eres la primera ✨

---

## Paso 7 · Designarte Admin (primera habitante)

Cuando te autentiques por primera vez con magic link, tu perfil se creará automáticamente con rol «habitante». Para ser admin:

1. Ve al dashboard de Supabase → SQL Editor.
2. Pega y ejecuta esto (reemplaza TU-EMAIL con el email que usaste):

```sql
UPDATE perfiles
SET rol = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU-EMAIL@example.com');
```

3. Ahora eres Admin del Círculo Ka. Puedes designar Guardianes, ver la cola de moderación, etc.

### Ver tu propio ID de habitante

```sql
SELECT id, nombre_universo, rol FROM perfiles;
```

---

## Resumen final

| Paso | Qué hiciste | Tiempo |
|------|-------------|--------|
| 1 | Crear proyecto Supabase | 5 min |
| 2 | Ejecutar esquema SQL | 5 min |
| 3 | Configurar magic link | 5 min |
| 4 | Rellenar supabase-client.js | 5 min |
| 5 | Subir archivos a GitHub | 10 min |
| 6 | Probar que funciona | 10 min |
| 7 | Designarte admin | 2 min |

**Total: ~42 minutos**

Cuando termines, escríbeme y me dices cómo te fue. Si algo se trabó, me cuentas dónde y lo resolvemos juntas.

---

## Backup semanal (importante)

El tier gratuito de Supabase NO hace backups automáticos. Una vez por semana (domingo), ejecuta:

```bash
# En tu computador, con Supabase CLI instalado:
supabase db dump -f backup-$(date +%Y%m%d).sql
```

Guarda el archivo en un lugar seguro (repositorio privado, disco externo, etc.).

Si pierdes datos, puedes restaurar ejecutando el archivo backup-YYYYMMDD.sql en el SQL Editor de Supabase.

---

## ¿Y después?

Etapa 2 está completa: Árbol de los Sueños y Libro de los Habitantes funcionando.

Las siguientes etapas (cuando quieras):
- **Etapa 3**: Encuentros entre Habitantes + Mural de Descubrimientos
- **Etapa 4**: Casa de los Creadores + Calendario de Encuentros + panel de moderación para Guardianes

Cada etapa se construye sobre lo que ya funciona, sin romper nada.

✨ Bienvenida al Círculo Ka, Yeli. El refugio de los creadores ya despierta.
