// Claves del localStorage
const CLAVE_CARRITO = "mateyco_carrito";
const CLAVE_ENVIO = "mateyco_envio";
const CLAVE_PEDIDOS = "mateyco_pedidos";

// Si el dato guardado esta roto, devolvemos el valor por defecto y la app sigue andando
function leerStorage(clave, valorPorDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

let carrito = leerStorage(CLAVE_CARRITO, []);

function guardarCarrito() {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function agregarAlCarrito(producto) {
  const { id, nombre, precio, icono, stock } = producto;
  const itemExistente = carrito.find((item) => item.id === id);

  if (itemExistente) {
    if (itemExistente.cantidad >= stock) return false;
    itemExistente.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, icono, stock, cantidad: 1 });
  }

  guardarCarrito();
  return true;
}

// Suma o resta unidades. Si llega a cero, el producto sale del carrito
function modificarCantidad(idProducto, cambio) {
  const item = carrito.find((itemCarrito) => itemCarrito.id === idProducto);
  if (!item) return false;

  const nuevaCantidad = item.cantidad + cambio;
  if (nuevaCantidad > item.stock) return false;

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(idProducto);
  } else {
    item.cantidad = nuevaCantidad;
    guardarCarrito();
  }

  return true;
}

function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  guardarCarrito();
}

function vaciarCarrito() {
  carrito = [];
  localStorage.removeItem(CLAVE_CARRITO);
}

function calcularCantidadTotal() {
  return carrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
}

function calcularSubtotal() {
  return carrito.reduce((acumulado, { precio, cantidad }) => acumulado + precio * cantidad, 0);
}

function guardarEnvioElegido(idEnvio) {
  localStorage.setItem(CLAVE_ENVIO, idEnvio);
}

function obtenerEnvioGuardado() {
  return localStorage.getItem(CLAVE_ENVIO) || "retiro";
}

// Guarda el pedido confirmado con un numero correlativo (MC-0001, MC-0002...)
function registrarPedido(datosPedido) {
  const pedidos = leerStorage(CLAVE_PEDIDOS, []);
  const numero = `MC-${String(pedidos.length + 1).padStart(4, "0")}`;

  const nuevoPedido = {
    numero,
    fecha: new Date().toLocaleString("es-AR"),
    ...datosPedido
  };

  pedidos.push(nuevoPedido);
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));

  return nuevoPedido;
}
