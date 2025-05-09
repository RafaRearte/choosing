﻿using choosing.Domain;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;

namespace choosing.Services.Impl
{
    public class ListService : IListService
    {
        private readonly IListRepository _listRepository;
        
        public ListService(IListRepository listRepository)
        {
            _listRepository = listRepository;
        }
        public async Task AcreditarInvitadoAsync(Guest guest)
        {
            //invitado.Ingreso = true;  // Lógica de acreditación (puedes añadir más lógica aquí)
            guest.Acreditado = 1;
            guest.horaAcreditacion = DateTime.Now;
            await _listRepository.UpdateAsync(guest);
        }

        public async Task<List<Guest>> GetAllInvitadosAsync()
        {
            return await _listRepository.GetAllAsync();
        }

        public async Task<Guest?> GetInvitadoByDniAsync(int dni)
        {
            return await _listRepository.GetByDNIAsync(dni);
        }

        public async  Task<List<Guest>> SearchInvitadoAsync(string query)
        {
            return await _listRepository.SearchByNameAsync(query);

        }

        public async Task<Guest> CreateInvitadoAsync(Guest newGuest)
        {
            return await _listRepository.AddAsync(newGuest);
        }

        public async Task UpdateInvitadoAsync(int originalDni, Guest updatedGuest)
        {
            // Obtener el invitado original
            var invitado = await _listRepository.GetByDNIAsync(originalDni);
            if (invitado == null)
                throw new Exception($"No se encontró un invitado con el DNI {originalDni}");

            // Si el DNI cambió, necesitamos eliminar el registro anterior y crear uno nuevo
            if (originalDni != updatedGuest.Dni)
            {
                await _listRepository.DeleteAsync(originalDni);
                await _listRepository.AddAsync(updatedGuest);
            }
            else
            {
                // Actualizar todos los campos
                invitado.Nombre = updatedGuest.Nombre;
                invitado.Apellido = updatedGuest.Apellido;
                invitado.Mail = updatedGuest.Mail;
                invitado.DayOne = updatedGuest.DayOne;
                invitado.DayTwo = updatedGuest.DayTwo;
                invitado.InfoAdicional = updatedGuest.InfoAdicional;
                invitado.Acreditado = updatedGuest.Acreditado;
                invitado.CantEntradas = updatedGuest.CantEntradas;

                await _listRepository.UpdateAsync(invitado);
            }
        }

        public async Task UpdateAccreditStatusAsync(Guest invitado)
        {
            await _listRepository.UpdateAsync(invitado);
        }

        public async Task DeleteInvitadoAsync(int dni)
        {
            await _listRepository.DeleteAsync(dni);
        }

        public async Task<List<Guest>> GetInvitadosAcreditadosAsync()
        {
            return await _listRepository.GetAcreditadosAsync();
        }

        public async Task<List<Guest>> GetInvitadosNoAcreditadosAsync()
        {
            return await _listRepository.GetNotAcreditadosAsync();
        }

        public async Task<List<Guest>> GetInvitadosNuevosAsync()
        {
            return await _listRepository.GetInvitadosNuevosAsync();
        }
    }
}
