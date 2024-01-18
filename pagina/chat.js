let nombre = "";
let chat = [];
let miembros = [];
let reintentoConexion = -1;
let modoOscuro = false;
let html;
let ws;

window.onload = function() { 
    html = {
        titulo: document.querySelector("#titulo"),
        miembros: document.querySelector("#miembros"),
        listaMiembros: document.querySelector("#lista-miembros"),
        chat: document.querySelector("#chat"),
        campo: document.querySelector("#campo"),
        botonOscuro: document.querySelector("#modo-oscuro"),
        botonMiembros: document.querySelector("#abrir-miembros"),
        cerrarMiembros: document.querySelector("#cerrar-miembros"),
        enviar: document.querySelector("#enviar")
    };

    html.botonOscuro.addEventListener("click", cambiarModoOscuro);
    html.botonMiembros.addEventListener("click", abrirListaMiembros);
    html.cerrarMiembros.addEventListener("click", cerrarListaMiembros);
    html.enviar.addEventListener("click", enviarMensaje);

    html.campo.addEventListener("keypress", evt => {
        if (evt.key == "Enter") {
            enviarMensaje();
        }
    });

    do {
        nombre = prompt("Escoje tu nombre");
    }
    while (!nombre);

    establecerSocket();
};

function establecerSocket() {
    html.titulo.textContent = "Chat (conectando)";

    ws = new WebSocket("ws://" + location.host + "/ws");
    ws.addEventListener("open", () => {
        let datoNombre = JSON.stringify({
            tipo: "entrar",
            nombre
        });
        ws.send(datoNombre);

        html.titulo.textContent = "Chat";
    });

    ws.addEventListener("message", datos => {
        let json = JSON.parse(datos.data);
        
        let tipo = json.tipo;
        if (tipo == "enviarChat") {
            chat = json.chat;

            actualizarChat();
            mostrarChatAbajo();
        }
        else if (tipo == "nuevoMensaje") {
            sumarMensaje(json.mensaje);
            mostrarChatAbajo();
        }
        else if (tipo == "enviarMiembros") {
            miembros = json.miembros;
            actualizarMiembros();
        }
    });

    ws.addEventListener("error", err => {
        console.error("Hubo un error con la conexión");
        console.error(err);
    });
    
    ws.addEventListener("close", evt => {
        let limpio = evt.wasClean ? " de forma limpia" : "";

        console.error("Conexión cerrada" + limpio + " (" + evt.code + ": " + evt.reason + ")");
        html.titulo.textContent = "Chat (desconectado)";

        setTimeout(establecerSocket, 5000);
    });
}

function enviarMensaje() {
    let texto = html.campo.value;
    if (texto == "") return;

    let mensaje = {
        autor: nombre,
        mensaje: texto
    };

    ws.send(JSON.stringify({
        tipo: "enviarMensaje",
        mensaje: texto
    }));

    html.campo.value = "";

    sumarMensaje(mensaje);
    mostrarChatAbajo();
}

function cambiarModoOscuro(modo) {
    if (typeof modo !== "boolean") {
        cambiarModoOscuro(!modoOscuro);
        return;
    }

    modoOscuro = modo;
    document.body.className = modo ? "oscuro" : "";

    let titulo = modo ? "Modo claro" : "Moso oscuro";
    let icono = modo ? "images/Claro.png" : "images/Oscuro.png";
    
    html.botonOscuro.title = titulo;
    html.botonOscuro.firstElementChild.src = icono;

    let iconoMiembros = modo ? "images/Miembros oscuro.png" : "images/Miembros.png";
    html.botonMiembros.firstElementChild.src = iconoMiembros;

    let iconoCerrar = modo ? "images/Cerrar oscuro.png" : "images/Cerrar.png";
    html.cerrarMiembros.firstElementChild.src = iconoCerrar;

    let iconoEnviar = modo ? "images/Enviar oscuro.png" : "images/Enviar.png";
    html.enviar.firstElementChild.src = iconoEnviar;
}

function cerrarListaMiembros() {
    html.miembros.className = "";
}

function abrirListaMiembros() {
    html.miembros.className = "abierto";

    ws.send(JSON.stringify({
        tipo: "obtenerMiembros"
    }));
}

function actualizarChat() {
    html.chat.innerHTML = "";

    chat.forEach(mensaje => {
        sumarMensaje(mensaje);
    });
}

function actualizarMiembros() {
    html.listaMiembros.innerHTML = "";

    miembros.forEach(miembro => {
        let pMiembro = document.createElement("p");
        pMiembro.textContent = miembro;
        html.listaMiembros.appendChild(pMiembro);
    });
}

function sumarMensaje(mensaje) {
    let msj = document.createElement("div");
    msj.className = "mensaje";

    let autor = document.createElement("p");
    autor.className = "autor";
    if (!mensaje.sistema) autor.textContent = mensaje.autor;
    
    let texto = document.createElement("p");
    texto.className = "texto";
    texto.textContent = mensaje.mensaje;

    if (!mensaje.sistema) msj.appendChild(autor);
    msj.appendChild(texto);

    html.chat.appendChild(msj);
}

function mostrarChatAbajo() {
    html.chat.scrollTop = html.chat.scrollHeight - html.chat.clientHeight;
}