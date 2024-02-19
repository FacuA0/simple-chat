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

    nombre = localStorage.getItem("nombre");

    if (nombre && !confirm(`¿Deseas volver a usar el nombre "${nombre}"?`)) {
        nombre = null;
    }

    while (!nombre) {
        nombre = prompt("Escoje tu nombre");
    }

    localStorage.setItem("nombre", nombre);

    establecerSocket();
};

function establecerSocket() {
    html.titulo.textContent = "Chat (conectando)";

    let protocolo = location.protocol == "https:" ? "wss://" : "ws://";
    ws = new WebSocket(protocolo + location.host + "/ws");
    
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
        fecha: new Date().getTime(),
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

    if (mensaje.tipo == "mensaje") {
        let autor = document.createElement("p");
        autor.className = "cabecera";

        let ahora = new Date(mensaje.fecha);
        let fechaLarga = ahora.toLocaleString();
        let hora = (ahora.getHours() + "").padStart(2, "0");
        let minutos = (ahora.getMinutes() + "").padStart(2, "0");
        let fecha = `${hora}:${minutos}`;

        let spanFecha = mensaje.fecha ? `&nbsp;<span class="fecha" title="${fechaLarga}">${fecha}</span>` : "";
        autor.innerHTML = `<span class="autor">${mensaje.autor}</span>` + spanFecha;

        msj.appendChild(autor);
    }
    
    let texto = document.createElement("p");
    texto.className = "texto";

    if (mensaje.tipo == "mensaje" || mensaje.tipo == "sistema") {
        texto.textContent = mensaje.mensaje;
    }
    else if (mensaje.tipo == "entrar") {
        texto.textContent = `¡${mensaje.usuario} se ha unido al chat!`;
    }
    else if (mensaje.tipo == "salir") {
        texto.textContent = `¡${mensaje.usuario} ha dejado el chat!`;
    }

    msj.appendChild(texto);

    html.chat.appendChild(msj);
}

function mostrarChatAbajo() {
    html.chat.scrollTop = html.chat.scrollHeight - html.chat.clientHeight;
}