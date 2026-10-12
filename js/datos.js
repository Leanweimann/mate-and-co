

// Rutas de los json que usamos como base de datos
const RUTA_PRODUCTOS = "data/productos.json";
const RUTA_ENVIOS = "data/envios.json";

// Trae un json local y corta si la respuesta no es valida
async function obtenerJSON(ruta) {
  const respuesta = await fetch(ruta);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta} (estado ${respuesta.status})`);
  }

  return await respuesta.json();
}

// Cargamos productos y envios en paralelo
async function cargarDatosTienda() {
  const [productos, envios] = await Promise.all([
    obtenerJSON(RUTA_PRODUCTOS),
    obtenerJSON(RUTA_ENVIOS)
  ]);

  return { productos, envios };
}

function formatearPrecio(monto) {
  return monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
}
