/* circulo-upload.js · Validación de archivos antes de subir a Supabase Storage.
   Verifica tipo MIME y tamaño en el frontend. La seguridad real la
   proporcionan las políticas de Storage (ver schema-circulo-ka.sql). */
(function () {
  var TIPOS = {
    "bucket-avatares": ["image/webp", "image/jpeg", "image/png"],
    "bucket-creaciones": ["image/webp", "image/jpeg", "image/png", "application/pdf", "model/gltf-binary", "model/gltf+json"],
    "bucket-descubrimientos": ["image/webp", "image/jpeg", "image/png"]
  };
  var EXT = {
    "bucket-avatares": ["webp", "jpg", "jpeg", "png"],
    "bucket-creaciones": ["webp", "jpg", "jpeg", "png", "pdf", "glb", "gltf", "stl", "3mf"],
    "bucket-descubrimientos": ["webp", "jpg", "jpeg", "png"]
  };
  var MAX = {
    "bucket-avatares": 500 * 1024,
    "bucket-creaciones": 10 * 1024 * 1024,
    "bucket-descubrimientos": 2 * 1024 * 1024
  };
  var MSG_MAX = {
    "bucket-avatares": "500 KB",
    "bucket-creaciones": "10 MB",
    "bucket-descubrimientos": "2 MB"
  };

  window.CirculoUpload = {
    validar: function (bucket, archivo) {
      if (!TIPOS[bucket]) return { ok: false, error: "Bucket desconocido" };
      var extArchivo = (archivo.name.split(".").pop() || "").toLowerCase();
      if (TIPOS[bucket].indexOf(archivo.type) < 0 && EXT[bucket].indexOf(extArchivo) < 0) {
        return { ok: false, error: "Tipo de archivo no permitido. Permitidos: " + EXT[bucket].join(", ") };
      }
      if (archivo.size > MAX[bucket]) {
        return { ok: false, error: "Archivo demasiado grande. Máximo: " + MSG_MAX[bucket] };
      }
      return { ok: true };
    },
    tiposPermitidos: function (bucket) { return EXT[bucket] || []; },
    maxTamano: function (bucket) { return MAX[bucket] || 0; }
  };
})();
