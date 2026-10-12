// Elementos del DOM
const catalogo = document.getElementById("catalogo");
const estadoCarga = document.getElementById("estadoCarga");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtroCategoria");
const ordenPrecio = document.getElementById("ordenPrecio");
const botonCarrito = document.getElementById("botonCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const panelCarrito = document.getElementById("panelCarrito");
const fondoOscuro = document.getElementById("fondoOscuro");
const botonCerrarCarrito = document.getElementById("cerrarCarrito");
const listaCarrito = document.getElementById("listaCarrito");
const selectorEnvio = document.getElementById("selectorEnvio");
const subtotalCarrito = document.getElementById("subtotalCarrito");
const costoEnvioTexto = document.getElementById("costoEnvio");
const totalCarrito = document.getElementById("totalCarrito");
const botonVaciar = document.getElementById("vaciarCarrito");
const botonFinalizar = document.getElementById("finalizarCompra");

const COLORES_AVISO = { exito: "#3f6b3a", error: "#c0392b", info: "#8b5e34" };
const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let productos = [];
let envios = [];

const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

// Saca tildes y pasa a minusculas, asi la busqueda no depende de como escriba el usuario
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function mostrarAviso(mensaje, tipo = "exito") {
  Toastify({
    text: mensaje,
    duration: 2500,
    gravity: "bottom",
    position: "right",
    stopOnFocus: true,
    style: {
      background: COLORES_AVISO[tipo] || COLORES_AVISO.exito,
      borderRadius: "10px"
    }
  }).showToast();
}

// ----- Carga inicial -----

async function iniciarTienda() {
  estadoCarga.innerHTML = "";
  estadoCarga.classList.remove("estado--error");

  const cargador = document.createElement("div");
  cargador.innerHTML = `<div class="spinner"></div><p>Cargando productos...</p>`;
  estadoCarga.append(cargador);

  try {
    const datos = await cargarDatosTienda();
    productos = datos.productos;
    envios = datos.envios;

    cargarCategorias();
    cargarOpcionesEnvio();
    renderizarCatalogo();
    renderizarCarrito();
  } catch (error) {
    mostrarErrorDeCarga(error);
  } finally {
    cargador.remove();
  }
}

function mostrarErrorDeCarga(error) {
  estadoCarga.classList.add("estado--error");

  const mensajeError = document.createElement("div");
  mensajeError.innerHTML = `
    <p><strong>Uy, no pudimos cargar los productos.</strong></p>
    <p>${error.message}</p>
    <button class="boton boton--primario">Reintentar</button>
  `;
  mensajeError.querySelector("button").addEventListener("click", iniciarTienda);

  estadoCarga.append(mensajeError);
}

function cargarCategorias() {
  const categorias = [...new Set(productos.map((producto) => producto.categoria))];

  filtroCategoria.innerHTML = `<option value="todas">Todas las categorias</option>`;
  categorias.forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria;
    filtroCategoria.append(opcion);
  });
}

function cargarOpcionesEnvio() {
  const envioGuardado = obtenerEnvioGuardado();

  selectorEnvio.innerHTML = envios
    .map(({ id, nombre, costo }) => {
      const textoCosto = costo > 0 ? ` - ${formatearPrecio(costo)}` : "";
      const seleccionado = id === envioGuardado ? "selected" : "";
      return `<option value="${id}" ${seleccionado}>${nombre}${textoCosto}</option>`;
    })
    .join("");
}

// ----- Catalogo -----

function obtenerProductosFiltrados() {
  const textoBuscado = normalizarTexto(buscador.value.trim());
  const categoriaElegida = filtroCategoria.value;

  const productosFiltrados = productos.filter(({ nombre, descripcion, categoria }) => {
    const coincideTexto =
      normalizarTexto(nombre).includes(textoBuscado) ||
      normalizarTexto(descripcion).includes(textoBuscado);
    const coincideCategoria = categoriaElegida === "todas" || categoria === categoriaElegida;

    return coincideTexto && coincideCategoria;
  });

  if (ordenPrecio.value === "menor") {
    productosFiltrados.sort((productoA, productoB) => productoA.precio - productoB.precio);
  }
  if (ordenPrecio.value === "mayor") {
    productosFiltrados.sort((productoA, productoB) => productoB.precio - productoA.precio);
  }

  return productosFiltrados;
}

function renderizarCatalogo() {
  // Si los datos no cargaron, no hay nada que filtrar
  if (productos.length === 0) return;

  const productosVisibles = obtenerProductosFiltrados();
  catalogo.innerHTML = "";

  if (productosVisibles.length === 0) {
    catalogo.innerHTML = `<p class="sin-resultados">No encontramos productos con esa busqueda 🧉</p>`;
    return;
  }

  productosVisibles.forEach((producto) => catalogo.append(crearTarjeta(producto)));
}

function crearTarjeta(producto) {
  const { nombre, categoria, precio, stock, icono, descripcion } = producto;

  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";
  tarjeta.innerHTML = `
    <div class="tarjeta__icono">${icono}</div>
    <span class="tarjeta__categoria">${categoria}</span>
    <h3 class="tarjeta__nombre">${nombre}</h3>
    <p class="tarjeta__descripcion">${descripcion}</p>
    <div class="tarjeta__pie">
      <span class="tarjeta__precio">${formatearPrecio(precio)}</span>
      <span class="tarjeta__stock">${stock > 5 ? "En stock" : `Ultimas ${stock} unidades`}</span>
    </div>
    <button class="boton boton--primario">Agregar al carrito</button>
  `;

  tarjeta.querySelector("button").addEventListener("click", () => manejarAgregado(producto));
  return tarjeta;
}

function manejarAgregado(producto) {
  const seAgrego = agregarAlCarrito(producto);
  const mensaje = seAgrego
    ? `${producto.nombre} se sumo al carrito`
    : `No queda mas stock de ${producto.nombre}`;

  mostrarAviso(mensaje, seAgrego ? "exito" : "error");
  renderizarCarrito();
}

// ----- Carrito -----

function renderizarCarrito() {
  listaCarrito.innerHTML = "";

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<li class="carrito-vacio">Tu carrito esta vacio.<br>Sumale algo para la ronda 🧉</li>`;
  } else {
    carrito.forEach((item) => listaCarrito.append(crearItemCarrito(item)));
  }

  actualizarResumen();
}

function crearItemCarrito({ id, nombre, precio, cantidad, icono }) {
  const itemLista = document.createElement("li");
  itemLista.className = "item-carrito";
  itemLista.innerHTML = `
    <span class="item-carrito__icono">${icono}</span>
    <div class="item-carrito__info">
      <p class="item-carrito__nombre">${nombre}</p>
      <p class="item-carrito__precio">${formatearPrecio(precio)} c/u | ${formatearPrecio(precio * cantidad)}</p>
    </div>
    <div class="control-cantidad">
      <button data-accion="restar" data-id="${id}" aria-label="Restar una unidad">-</button>
      <span>${cantidad}</span>
      <button data-accion="sumar" data-id="${id}" aria-label="Sumar una unidad">+</button>
    </div>
    <button class="item-carrito__eliminar" data-accion="eliminar" data-id="${id}" aria-label="Quitar producto">🗑️</button>
  `;
  return itemLista;
}

// Un solo listener para todos los botones del carrito (delegacion de eventos)
function manejarAccionCarrito(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const { accion, id } = boton.dataset;
  const idProducto = Number(id);

  switch (accion) {
    case "sumar":
      if (!modificarCantidad(idProducto, 1)) {
        mostrarAviso("No hay mas stock disponible", "error");
      }
      break;
    case "restar":
      modificarCantidad(idProducto, -1);
      break;
    case "eliminar":
      eliminarDelCarrito(idProducto);
      mostrarAviso("Producto quitado del carrito", "info");
      break;
  }

  renderizarCarrito();
}

function obtenerTotales() {
  const subtotal = calcularSubtotal();
  const envioElegido = envios.find((envio) => envio.id === selectorEnvio.value) || envios[0];
  const costoEnvio = carrito.length > 0 ? envioElegido.costo : 0;

  return { envioElegido, subtotal, costoEnvio, total: subtotal + costoEnvio };
}

function actualizarResumen() {
  const { subtotal, costoEnvio, total } = obtenerTotales();
  const carritoVacio = carrito.length === 0;

  subtotalCarrito.textContent = formatearPrecio(subtotal);
  costoEnvioTexto.textContent = formatearPrecio(costoEnvio);
  totalCarrito.textContent = formatearPrecio(total);
  contadorCarrito.textContent = calcularCantidadTotal();

  botonVaciar.disabled = carritoVacio;
  botonFinalizar.disabled = carritoVacio;
}

function abrirPanelCarrito() {
  panelCarrito.classList.add("abierto");
  fondoOscuro.classList.add("visible");
}

function cerrarPanelCarrito() {
  panelCarrito.classList.remove("abierto");
  fondoOscuro.classList.remove("visible");
}

async function confirmarVaciado() {
  const { isConfirmed } = await Swal.fire({
    title: "Vaciar el carrito?",
    text: "Se van a quitar todos los productos que elegiste.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Si, vaciar",
    cancelButtonText: "Mejor no",
    confirmButtonColor: COLORES_AVISO.error
  });

  if (!isConfirmed) return;

  vaciarCarrito();
  renderizarCarrito();
  mostrarAviso("Carrito vaciado", "info");
}

// ----- Checkout -----

async function pedirDatosCliente(necesitaDireccion) {
  const campoDireccion = necesitaDireccion
    ? `<label>Direccion de entrega
         <input id="direccionCliente" type="text" placeholder="Calle, numero y ciudad">
       </label>`
    : "";

  const { value: datosCliente } = await Swal.fire({
    title: "Tus datos",
    html: `
      <div class="formulario-compra">
        <label>Nombre y apellido
          <input id="nombreCliente" type="text" placeholder="Ej: Juan Perez">
        </label>
        <label>Email
          <input id="emailCliente" type="email" placeholder="tuemail@ejemplo.com">
        </label>
        ${campoDireccion}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Volver al carrito",
    confirmButtonColor: COLORES_AVISO.exito,
    focusConfirm: false,
    preConfirm: () => {
      const popup = Swal.getPopup();
      const nombre = popup.querySelector("#nombreCliente").value.trim();
      const email = popup.querySelector("#emailCliente").value.trim();
      const direccion = necesitaDireccion
        ? popup.querySelector("#direccionCliente").value.trim()
        : "Retira en el local";

      if (!nombre || !email || !direccion) {
        Swal.showValidationMessage("Completa todos los campos para seguir");
        return false;
      }

      if (!EXPRESION_EMAIL.test(email)) {
        Swal.showValidationMessage("Revisa el email, parece que no es valido");
        return false;
      }

      return { nombre, email, direccion };
    }
  });

  return datosCliente;
}

async function finalizarCompra() {
  const { envioElegido, subtotal, costoEnvio, total } = obtenerTotales();
  const datosCliente = await pedirDatosCliente(envioElegido.id !== "retiro");

  if (!datosCliente) return;

  const detalleProductos = carrito
    .map(({ nombre, cantidad, precio }) => `
      <li><span>${cantidad} x ${nombre}</span><span>${formatearPrecio(precio * cantidad)}</span></li>
    `)
    .join("");

  const { isConfirmed } = await Swal.fire({
    title: "Revisa tu pedido",
    html: `
      <ul class="detalle-pedido">${detalleProductos}</ul>
      <div class="fila-resumen"><span>Subtotal</span><span>${formatearPrecio(subtotal)}</span></div>
      <div class="fila-resumen"><span>${envioElegido.nombre}</span><span>${formatearPrecio(costoEnvio)}</span></div>
      <div class="fila-resumen fila-resumen--total"><span>Total</span><span>${formatearPrecio(total)}</span></div>
      <p class="nota-entrega">Entrega: ${datosCliente.direccion}</p>
    `,
    showCancelButton: true,
    confirmButtonText: "Confirmar compra",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLORES_AVISO.exito
  });

  if (!isConfirmed) return;

  // Simulamos que el pago tarda un poquito en procesarse
  Swal.fire({
    title: "Procesando pago...",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });
  await esperar(1800);

  const pedido = registrarPedido({
    cliente: datosCliente,
    productos: carrito.map(({ id, nombre, cantidad, precio }) => ({ id, nombre, cantidad, precio })),
    envio: envioElegido.nombre,
    total
  });

  vaciarCarrito();
  renderizarCarrito();
  cerrarPanelCarrito();

  Swal.fire({
    icon: "success",
    title: `Gracias por tu compra, ${datosCliente.nombre.split(" ")[0]}!`,
    html: `Tu numero de pedido es <strong>${pedido.numero}</strong>.<br>Te mandamos el detalle a ${datosCliente.email}.`,
    confirmButtonText: "Seguir comprando",
    confirmButtonColor: COLORES_AVISO.exito
  });
}

//       Eventos

buscador.addEventListener("input", renderizarCatalogo);
filtroCategoria.addEventListener("change", renderizarCatalogo);
ordenPrecio.addEventListener("change", renderizarCatalogo);

botonCarrito.addEventListener("click", abrirPanelCarrito);
botonCerrarCarrito.addEventListener("click", cerrarPanelCarrito);
fondoOscuro.addEventListener("click", cerrarPanelCarrito);
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") cerrarPanelCarrito();
});

listaCarrito.addEventListener("click", manejarAccionCarrito);
selectorEnvio.addEventListener("change", () => {
  guardarEnvioElegido(selectorEnvio.value);
  actualizarResumen();
});
botonVaciar.addEventListener("click", confirmarVaciado);
botonFinalizar.addEventListener("click", finalizarCompra);

iniciarTienda();
