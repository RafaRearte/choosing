// Inicializar DataTable
let dataTable;

const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'login.html';
}

// Actualizar cada 5 segundos
const fetchInterval = 30000; 

const startPolling = () => {
  fetchGuests();
  setInterval(fetchGuests, fetchInterval);
}

$(document).ready(function () {
    // Inicializar DataTable
    dataTable = $('#invitadosTable').DataTable({
        language: {
        url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json",
        lengthMenu: "Mostrar _MENU_",
        info: "_TOTAL_ invitados",
        paginate: {
            previous: "←",
            next: "→"
        },
        search: "Buscar: " // Elimina el label "Search"
    },
    dom: "<'row'<'col-sm-6 d-flex justify-content-start'f>"+ // Solo buscador arriba
         "<'row'<'col-sm-12'tr>>"+ // Tabla
         "<'row mt-2'<'col-sm-4'l><'col-sm-4'i>>", // 3 controles abajo
    lengthChange: true,
    searching: true,

        
        // Configuración personalizada del search externo:
        initComplete: function() {
          $('#customSearch').on('keyup', function() {
            $('#invitadosTable').DataTable().search(this.value).draw();
          });
        },
        columns: [
            { data: 'dni' },
            { data: 'nombre' },
            { data: 'apellido' },
            { data: 'mail' },
            { data: 'dayOne' },
            { data: 'dayTwo' },
            {
                data: 'acreditado',
                render: function (data) {
                    // Verificar si el valor es mayor que 0 para considerarlo acreditado
                    const isAccredited = data > 0;
                    return isAccredited ? 
                        '<span class="badge bg-success">Ingreso</span>' : 
                        '<span class="badge bg-danger">No ingreso</span>';
                }
            },
            {
                data: null,
                render: function (data) {
                    // Verificar si el invitado está acreditado
                    const isAccredited = data.acreditado > 0;
                    const toggleClass = isAccredited ? 'btn-success' : 'btn-outline-success';
                    const toggleText = isAccredited ? 'Acreditado' : 'Acreditar';
                    
                    return `
                        <div class="d-flex gap-1">
                            <button type="button" class="btn btn-primary btn-sm" onclick="openEditModal('${data.dni}')">
                                Info
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="printLabel('${data.nombre}', '${data.apellido}','${data.dni}', '${data.profesion}', '${data.cargo}')">
                                Etiqueta
                            </button>
                            <button type="button" 
                                class="btn btn-sm ${isAccredited ? 'btn-success' : 'btn-outline-success'} rounded-circle toggle-accredit p-0 d-flex align-items-center justify-content-center" 
                                style="width: 28px; height: 28px;"
                                data-dni="${data.dni}" 
                                data-status="${isAccredited}"
                                title="${isAccredited ? 'Acreditado' : 'Acreditar'}">
                                <i class="bi ${isAccredited ? 'bi-check-lg' : 'bi-plus-lg'}" style="font-size: 0.8rem;"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });

    // Cargar los invitados al inicio
    //fetchGuests();
    startPolling(); // En lugar de fetchGuests();
    
    // Agregar evento para los botones de toggle acreditación
    $('#invitadosTable').on('click', '.toggle-accredit', function() {
        const dni = $(this).data('dni');
        const currentStatus = $(this).data('status');
        toggleAccreditStatus(dni, currentStatus);
    });
    // Agregar manejo de eventos para los contadores como botones
    $('.counter-badge').on('click', function() {
    // Remove active class from all counters
    $('.counter-badge').removeClass('active');
    // Add active class to current counter
    $(this).addClass('active');
    
    // Get the endpoint from the counter
    const endpoint = $(this).data('endpoint');
    // Construct the full URL
    const fullUrl = `${apiUrl}/${endpoint}`;
    // Load filtered data
    loadFilteredData(fullUrl);
});
});

// Función para cerrar sesión
const logout = () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
};

// Agregar evento al botón de cerrar sesión
document.getElementById('logoutButton').addEventListener('click', logout);

// Función para abrir el modal de edición con los datos del invitado
const openEditModal = async (dni) => {
    try {
        const response = await fetch(`${apiUrl}/searchByDni?dni=${dni}`,);
        if (!response.ok) throw new Error('No se encontró el invitado');
        
        const guest = await response.json();
        
        // Rellenar el formulario con los datos del invitado
        document.getElementById('editGuestDniOriginal').value = guest.dni;
        document.getElementById('editGuestDni').value = guest.dni;
        document.getElementById('editGuestNombre').value = guest.nombre || '';
        document.getElementById('editGuestApellido').value = guest.apellido || '';
        document.getElementById('editGuestEmail').value = guest.mail || '';
        document.getElementById('editGuestDayOne').checked = guest.dayOne === 'SI';
        document.getElementById('editGuestDayTwo').checked = guest.dayTwo === 'SI';
        document.getElementById('editGuestInfoAdicional').value = guest.infoAdicional || '';
        document.getElementById('editGuestAcreditado').checked = guest.acreditado > 0;
        if (guest.horaAcreditacion) {
            const fecha = new Date(guest.horaAcreditacion);
            const horaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
            document.getElementById('editGuestHoraAcreditacion').innerHTML = `<strong>Hora de acreditación:</strong> ${horaFormateada}`;
        } else {
            document.getElementById('editGuestHoraAcreditacion').innerHTML = '<strong>Hora de acreditación:</strong> No acreditado';
        }
        
        // Abrir el modal
        $('#editGuestModal').modal('show');
    } catch (error) {
        console.error('Error al cargar los datos del invitado:', error);
        alert('No se pudieron cargar los datos del invitado');
    }
};

// Función para guardar los cambios del invitado editado
const saveEditedGuest = async () => {
    // Obtener el DNI original (por si cambió)
    const originalDni = document.getElementById('editGuestDniOriginal').value;
    
    // Obtener los valores del formulario
    const dni = document.getElementById('editGuestDni').value;
    const nombre = document.getElementById('editGuestNombre').value;
    const apellido = document.getElementById('editGuestApellido').value;
    const email = document.getElementById('editGuestEmail').value;
    const dayOne = document.getElementById('editGuestDayOne').checked ? 'SI' : 'NO';
    const dayTwo = document.getElementById('editGuestDayTwo').checked ? 'SI' : 'NO';
    const infoAdicional = document.getElementById('editGuestInfoAdicional').value;
    const acreditado = document.getElementById('editGuestAcreditado').checked ? 1 : 0;
    
    // Validación básica
    if (!dni || !nombre || !apellido) {
        alert('Por favor complete los campos obligatorios: DNI, Nombre y Apellido');
        return;
    }
    
    // Crear objeto con los datos actualizados
    const updatedGuest = {
        dni: parseInt(dni),
        nombre: nombre,
        apellido: apellido,
        mail: email,
        dayOne: dayOne,
        dayTwo: dayTwo,
        infoAdicional: infoAdicional,
        acreditado: acreditado
    };
    
    try {
        const response = await fetch(`${apiUrl}/update/${originalDni}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedGuest)
        });
        
        if (response.ok) {
            alert('Invitado actualizado con éxito');
            $('#editGuestModal').modal('hide');
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al actualizar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al actualizar invitado:', error);
        alert('Ha ocurrido un error al intentar actualizar el invitado');
    }
};

// Función para eliminar un invitado
const deleteGuest = async () => {
    // Obtener el DNI del invitado a eliminar
    const dni = document.getElementById('editGuestDniOriginal').value;
    
    // Confirmar la eliminación
    const confirmDelete = confirm(`¿Está seguro que desea eliminar al invitado con DNI ${dni}?`);
    if (!confirmDelete) return;
    
    try {
        const response = await authenticatedFetch(`${apiUrl}/delete/${dni}`, {
            method: 'DELETE'
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            alert('Invitado eliminado con éxito');
            $('#editGuestModal').modal('hide');
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al eliminar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al eliminar invitado:', error);
        alert('Ha ocurrido un error al intentar eliminar el invitado');
    }
};

// Función para cambiar el estado de acreditación (toggle)
const toggleAccreditStatus = async (dni, currentStatus) => {
    try {
        // Convertir el estado actual a un valor booleano
        const isCurrentlyAccredited = currentStatus === 'true' || currentStatus === true;
        
        // Llamar al endpoint con el nuevo estado (opuesto al actual)
        const newStatus = isCurrentlyAccredited ? 0 : 1;
        
        const response = await fetch(`${apiUrl}/updateAccreditStatus/${dni}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ acreditado: newStatus })
        });
        
        if (response.ok) {
            // No mostrar alert para una mejor experiencia de usuario
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al cambiar estado de acreditación: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al cambiar estado de acreditación:', error);
        alert('Ha ocurrido un error al intentar cambiar el estado de acreditación');
    }
};
    const apiUrl = "https://choosing-rafa.duckdns.org/api/List";

    // Actualizar Contadores
    const updateCounters = (guests, newCount = null) => {
    const totalGuests = guests.length;
    const accreditedGuests = guests.filter(guest => guest.acreditado > 0).length;
    const notAccreditedGuests = totalGuests - accreditedGuests;

    document.getElementById("totalGuests").innerText = `Invitados: ${totalGuests}`;
    document.getElementById("accredited").innerText = `Acreditados: ${accreditedGuests}`;
    document.getElementById("notAccredited").innerText = `No acreditados: ${notAccreditedGuests}`;
    if (newCount !== null) {
        document.getElementById("new").innerText = `Nuevos: ${newCount}`;
    } else {
        fetchNewCount();
    }
};
// Obtener y mostrar invitados en ambas tablas
// Modificar la función fetchGuests
const fetchGuests = async () => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetAll`);
        if (!response) return; // Si hay redirección por token inválido
        
        if (!response.ok) throw new Error('Error al obtener los invitados');
        const guests = await response.json();

        // Actualizar DataTable
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();

        // Obtener el contador de nuevos invitados en una llamada separada
        const newResponse = await authenticatedFetch(`${apiUrl}/GetNuevos`);
        if (newResponse && newResponse.ok) {
            const newGuests = await newResponse.json();
            updateCounters(guests, newGuests.length);
        } else {
            updateCounters(guests);
        }
    } catch (error) {
        console.error('Error fetching guests:', error);
    }
};

const saveNewGuest = async () => {
    const dni = document.getElementById("newGuestDni").value;
    const nombre = document.getElementById("newGuestNombre").value;
    const apellido = document.getElementById("newGuestApellido").value;
    const email = document.getElementById("newGuestEmail").value;
    const dayOne = document.getElementById("newGuestDayOne").checked ? "SI" : "NO";
    const dayTwo = document.getElementById("newGuestDayTwo").checked ? "SI" : "NO";

    if (!dni || !nombre || !apellido) {
        alert("Por favor, complete los campos obligatorios: DNI, Nombre y Apellido.");
        return;
    }

    const newGuest = {
        dni: parseInt(dni),
        nombre,
        apellido,
        mail: email,
        dayOne,
        dayTwo,
        acreditado: 0
    };

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiUrl}/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(newGuest)
        });

        if (response.ok) {
            alert("Invitado agregado con éxito.");
            $("#addGuestModal").modal("hide");
            document.getElementById("addGuestForm").reset();
            fetchGuests();
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor inicie sesión nuevamente.');
            logout();
        } else {
            const errorText = await response.text();
            alert(`Error al crear invitado: ${errorText}`);
        }
    } catch (error) {
        console.error("Error al crear invitado:", error);
        alert("Hubo un error al intentar crear el invitado.");
    }
};

// Función helper para hacer peticiones autenticadas
const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    // Si no hay token, redirigir al login
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    
    // Configurar headers con autenticación
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Si hay error de autenticación, redirigir al login
        if (response.status === 401) {
            alert('Sesión expirada. Por favor inicie sesión nuevamente.');
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};

// Función para obtener el contador de nuevos invitados
const fetchNewCount = async () => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetNuevos`);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener nuevos invitados');
        const newGuests = await response.json();
        
        document.getElementById("new").innerText = `Nuevos: ${newGuests.length}`;
    } catch (error) {
        console.error('Error fetching new guests count:', error);
    }
};

// Función para cargar datos filtrados según el contador seleccionado
const loadFilteredData = async (url) => {
    // Mostrar indicador de carga
    document.getElementById('loadingIndicator').style.display = 'block';
    
    try {
        const response = await authenticatedFetch(url);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener los datos filtrados');
        const guests = await response.json();

        // Limpiar y actualizar la tabla
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();
        
        // Si el filtro es GetAll, actualizar todos los contadores
        if (url.endsWith('GetAll')) {
            updateCounters(guests);
        }
    } catch (error) {
        console.error('Error loading filtered data:', error);
        alert('Error al cargar los datos filtrados');
    } finally {
        // Ocultar indicador de carga
        document.getElementById('loadingIndicator').style.display = 'none';
    }
};

const searchByName = async () => {
    const query = document.getElementById("searchName").value;

    if (!query) {
        alert("Por favor, ingresa un nombre o apellido para buscar.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/searchByName?query=${query}`);
        if (!response.ok) throw new Error('No se encontraron resultados para el nombre ingresado.');

        const guests = await response.json();

        // Actualizar la tabla con los resultados obtenidos
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();

        updateCounters(guests); // Actualizar los contadores
    } catch (error) {
        console.error("Error al buscar por nombre:", error);
        alert("No se encontraron resultados para el nombre ingresado.");
    }
};

const searchByDni = async () => {
    const dni = document.getElementById("searchDni").value;

    if (!dni) {
        alert("Por favor, ingresa un DNI para buscar.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/searchByDni?dni=${dni}`);
        if (!response.ok) throw new Error('No se encontró un invitado con ese DNI.');

        const guest = await response.json();

        // Actualizar la tabla con el resultado obtenido
        dataTable.clear();
        dataTable.rows.add([guest]); // Pasar el objeto como un array
        dataTable.draw();

        updateCounters([guest]); // Actualizar los contadores con un solo resultado
    } catch (error) {
        console.error("Error al buscar por DNI:", error);
        alert("No se encontró un invitado con ese DNI.");
    }
};

    const printLabel = async (nombre, apellido, dni, profesion, cargo) => {
    try {
        // Primero acreditar al usuario
        const response = await fetch(`${apiUrl}/updateAccreditStatus/${dni}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ acreditado: 1 })
        });
        
        if (!response.ok) {
            throw new Error('Error al acreditar al invitado');
        }
        
        // Luego imprimir la etiqueta
        const etiquetaHTML = `
        <div style="
            width: 90mm;
            height: 26mm;
            font-family: Arial, sans-serif;
            font-size: 16pt;
            line-height: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 0mm;
            box-sizing: border-box;
        ">
            <div style="font-weight: bold;">${nombre} ${apellido}</div>
            <div>${profesion}</div>
            <div>${cargo}</div>
            <div>DNI: ${dni}</div>
        </div>
        `;
        
        
        

        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(etiquetaHTML);
        printWindow.document.close();
        printWindow.print();
        
        // Actualizar la tabla después de acreditar
        fetchGuests();
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al acreditar al invitado');
    }
};
function loadUserInfo() {
    // Obtener datos del usuario del localStorage (guardados durante el login)
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData) {
        // Mostrar el nombre del usuario
        document.getElementById('userName').textContent = userData.name || 'Usuario';
        
    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadUserInfo();
    fetchGuests();
});